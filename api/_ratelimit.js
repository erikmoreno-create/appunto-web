// Control de acceso y de gasto compartido por los endpoints de api/.
//
// El prefijo "_" hace que Vercel no lo publique como ruta: es un modulo, no
// un endpoint.
//
// Los endpoints de api/ son publicos por necesidad (los llama el navegador de
// cada visitante, no hay credencial que exigir) y cada peticion cuesta dinero:
// creditos de OpenAI en /api/chat, escrituras al CRM en /api/contact. Lo que
// se puede acotar es cuanto se le permite gastar a cada quien.
//
// OJO: los headers CORS NO son la defensa. Solo deciden que paginas pueden
// leer la respuesta desde el navegador de un visitante; un script con curl los
// ignora por completo. La defensa real es el rate limit por IP.

const ALLOWED_ORIGINS = [
    'https://appunto.mx',
    'https://www.appunto.mx',
    'https://appunto-web.vercel.app',
];

// Previews de Vercel del propio proyecto, para poder probar en cada PR.
// El slug del equipo va anclado a proposito: un patron abierto tipo
// "appunto-web[a-z0-9-]*" tambien aceptaria el proyecto "appunto-website" de
// un tercero, que podria clonar el chatbot de pago en su sitio.
const PREVIEW_ORIGIN = /^https:\/\/appunto-web-[a-z0-9-]+-erikmoreno-creates-projects\.vercel\.app$/;

function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN.test(origin);
}

// x-forwarded-for SI es falsificable: Vercel anade la IP real al final de lo
// que haya mandado el cliente, asi que el primer elemento puede ser inventado
// y el ultimo es el bueno. x-real-ip y x-vercel-forwarded-for los escribe la
// plataforma y el cliente no los controla, asi que van primero.
function clientIp(req) {
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real.trim()) return real.trim();

    for (const h of ['x-vercel-forwarded-for', 'x-forwarded-for']) {
        const v = req.headers[h];
        if (typeof v === 'string' && v.trim()) {
            const partes = v.split(',').map(s => s.trim()).filter(Boolean);
            if (partes.length) return partes[partes.length - 1];
        }
    }
    return 'sin-ip';
}

// Ventanas fijas: la ventana va dentro del nombre de la clave, asi que el
// contador se reinicia solo. El entorno tambien va en la clave, para que los
// previews no consuman el presupuesto de produccion.
const ENTORNO = process.env.VERCEL_ENV || 'dev';

const DIA_MS = 24 * 60 * 60 * 1000;

// Cada endpoint tiene su propio perfil de uso legitimo, asi que sus cuotas no
// pueden ser las mismas: a un chatbot se le mandan muchos mensajes seguidos,
// un formulario de contacto lo envia una persona una vez.
const CUOTAS = {
    chat: {
        porIp: [
            { etiqueta: 'minuto', ventanaMs: 60 * 1000,      max: 10, ttl: 120,  retryAfter: 60 },
            { etiqueta: 'hora',   ventanaMs: 60 * 60 * 1000, max: 60, ttl: 7200, retryAfter: 900 },
        ],
        global: { etiqueta: 'global', ventanaMs: DIA_MS, max: 1500, ttl: 172800, retryAfter: 3600 },
    },
    contact: {
        // Escribe leads en el CRM de produccion. Nadie llena el formulario tres
        // veces en una hora de buena fe, y un lead basura cuesta tiempo del
        // equipo comercial, asi que se aprieta mucho mas que el chat.
        porIp: [
            { etiqueta: 'hora', ventanaMs: 60 * 60 * 1000, max: 3,  ttl: 7200,   retryAfter: 900 },
            { etiqueta: 'dia',  ventanaMs: DIA_MS,         max: 10, ttl: 172800, retryAfter: 3600 },
        ],
        global: { etiqueta: 'global', ventanaMs: DIA_MS, max: 200, ttl: 172800, retryAfter: 3600 },
    },
};

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAY_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

// --- Contadores -------------------------------------------------------------

// Respaldo en memoria del proceso. Vercel reutiliza instancias calientes, asi
// que atrapa la rafaga desde una IP, pero se pierde en cada arranque en frio y
// no ve las otras instancias. Solo cubre el hueco mientras Upstash no este
// configurado, o si Upstash deja de responder.
const MEMORIA_MAX = 5000;
const memoria = new Map();

function contarEnMemoria(clave, ttlSeg) {
    const ahora = Date.now();

    if (memoria.size >= MEMORIA_MAX) {
        for (const [k, v] of memoria) if (v.exp <= ahora) memoria.delete(k);
        // Si tras limpiar lo vencido sigue lleno (alguien rotando claves mete
        // entradas mas rapido de lo que expiran), se tira lo mas viejo. Map
        // conserva el orden de insercion: las primeras son las mas antiguas.
        if (memoria.size >= MEMORIA_MAX) {
            let sobran = memoria.size - Math.floor(MEMORIA_MAX / 2);
            for (const k of memoria.keys()) {
                memoria.delete(k);
                if (--sobran <= 0) break;
            }
        }
    }

    const actual = memoria.get(clave);
    if (!actual || actual.exp <= ahora) {
        memoria.set(clave, { n: 1, exp: ahora + ttlSeg * 1000 });
        return 1;
    }
    actual.n += 1;
    return actual.n;
}

// IPs ya rechazadas, para no volver a preguntarle a Upstash en cada peticion
// de un atacante: bajo ataque es justo cuando no conviene agotar su cuota de
// comandos. Es una cache local, no la defensa; si se pierde, solo se gastan
// mas comandos.
const bloqueadas = new Map();

function estaBloqueada(llave) {
    const b = bloqueadas.get(llave);
    if (b === undefined) return null;
    if (b.exp <= Date.now()) { bloqueadas.delete(llave); return null; }
    return b;
}

function bloquear(llave, etiqueta, segundos) {
    if (bloqueadas.size > MEMORIA_MAX) bloqueadas.clear();
    bloqueadas.set(llave, { etiqueta, exp: Date.now() + segundos * 1000, retryAfter: segundos });
}

// Upstash se llama por su API REST a proposito: el repo no tiene package.json
// y anadir una dependencia npm cambiaria el modelo de deploy del sitio.
function leerContador(item) {
    // Un pipeline puede devolver HTTP 200 y traer errores por comando. Si no
    // sale un numero se lanza, para caer al respaldo en memoria: seguir de
    // largo con NaN dejaria el limite abierto sin que nadie se entere, porque
    // toda comparacion contra NaN es false.
    if (!item || typeof item !== 'object' || item.result === undefined || item.result === null) {
        throw new Error('Upstash: comando sin result -> ' + JSON.stringify(item).slice(0, 120));
    }
    const n = Number(item.result);
    if (!Number.isFinite(n)) {
        throw new Error('Upstash: contador no numerico -> ' + String(item.result).slice(0, 60));
    }
    return n;
}

async function contarEnRedis(entradas) {
    const comandos = [];
    for (const e of entradas) {
        comandos.push(['INCR', e.clave]);
        comandos.push(['EXPIRE', e.clave, String(e.ttl)]);
    }

    const r = await fetch(REDIS_URL + '/pipeline', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + REDIS_TOKEN,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(comandos),
        signal: AbortSignal.timeout(2000),
    });

    if (!r.ok) throw new Error('Upstash respondio ' + r.status);
    const out = await r.json();
    if (!Array.isArray(out) || out.length !== comandos.length) {
        throw new Error('Upstash: respuesta con forma inesperada');
    }
    // Los INCR son los indices pares; los impares son los EXPIRE.
    return entradas.map((_, i) => leerContador(out[i * 2]));
}

async function contar(entradas) {
    if (!HAY_REDIS) return entradas.map(e => contarEnMemoria(e.clave, e.ttl));
    try {
        return await contarEnRedis(entradas);
    } catch (err) {
        // Se sigue con el contador en memoria antes que tumbar el endpoint:
        // que Upstash falle y alguien ataque a la vez es poco probable, y
        // dejar el sitio sin asistente por eso es peor para el negocio.
        console.error('Rate limit: Upstash no respondio, uso memoria:', err.message);
        return entradas.map(e => contarEnMemoria(e.clave, e.ttl));
    }
}

// --- API del modulo ---------------------------------------------------------

/**
 * Cuenta la peticion y dice si se acepta.
 *
 * Las cuotas por IP se comprueban ANTES de tocar el contador global, y solo se
 * incrementa el global si la IP paso. Si se incrementaran juntas, quien ya
 * esta bloqueado por IP seguiria consumiendo el presupuesto diario y podria
 * dejar el endpoint muerto para todos los visitantes durante 24 horas con unos
 * segundos de peticiones.
 */
async function verificarCuota(ip, ambito) {
    const cuotas = CUOTAS[ambito];
    if (!cuotas) throw new Error('verificarCuota: ambito desconocido -> ' + ambito);

    // La llave lleva el ambito: quedarse sin cuota en el formulario no debe
    // dejarte sin chatbot, son limites independientes.
    const llaveBloqueo = ambito + ':' + ip;

    const yaBloqueada = estaBloqueada(llaveBloqueo);
    if (yaBloqueada) {
        return { ok: false, etiqueta: yaBloqueada.etiqueta, retryAfter: yaBloqueada.retryAfter };
    }

    const ahora = Date.now();
    const prefijo = 'rl:' + ENTORNO + ':' + ambito + ':';

    const porIp = cuotas.porIp.map(c => ({
        clave: prefijo + c.etiqueta + ':' + ip + ':' + Math.floor(ahora / c.ventanaMs),
        ttl: c.ttl, max: c.max, etiqueta: c.etiqueta, retryAfter: c.retryAfter,
    }));

    const conteosIp = await contar(porIp);
    for (let i = 0; i < porIp.length; i++) {
        if (conteosIp[i] > porIp[i].max) {
            bloquear(llaveBloqueo, porIp[i].etiqueta, porIp[i].retryAfter);
            return { ok: false, etiqueta: porIp[i].etiqueta, retryAfter: porIp[i].retryAfter };
        }
    }

    const g = cuotas.global;
    const global = {
        clave: prefijo + g.etiqueta + ':' + Math.floor(ahora / g.ventanaMs),
        ttl: g.ttl,
    };
    const [conteoGlobal] = await contar([global]);
    if (conteoGlobal > g.max) {
        // No se bloquea la IP: el tope global no es culpa de quien escribe.
        return { ok: false, etiqueta: g.etiqueta, retryAfter: g.retryAfter };
    }

    return { ok: true };
}

/**
 * Aplica los headers CORS y corta lo que no deba pasar.
 * Devuelve true si el handler debe seguir; si devuelve false, ya se respondio.
 */
function aplicarCors(req, res) {
    const origin = req.headers.origin;

    // Vary siempre, tambien en los 403: la respuesta depende del Origin, y sin
    // esto una cache intermedia podria servirle a un visitante la respuesta
    // que se genero para otro origen.
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (origin && isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (req.method === 'OPTIONS') { res.status(200).end(); return false; }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido.' });
        return false;
    }

    // Un Origin ajeno se corta aqui. Sube el liston para el uso del endpoint
    // desde otro sitio web, pero se puede falsificar fuera del navegador: la
    // proteccion que de verdad cuenta es verificarCuota.
    if (origin && !isAllowedOrigin(origin)) {
        res.status(403).json({ error: 'Origen no permitido.' });
        return false;
    }
    return true;
}

module.exports = { isAllowedOrigin, clientIp, verificarCuota, aplicarCors, HAY_REDIS };
