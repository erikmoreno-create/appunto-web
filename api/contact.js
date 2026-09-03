// Endpoint del formulario de contacto: crea un lead en el CRM de Odoo.
//
// OJO: hoy NINGUNA pagina del sitio lo llama — no existe ningun <form> en el
// repo. Por eso esta listado en .vercelignore y no se publica: un endpoint sin
// consumidores que escribe en el CRM de produccion es riesgo sin beneficio.
//
// El codigo se conserva, protegido y listo, para cuando se anada el formulario
// a contacto.html. Para reactivarlo: quitar la linea "api/contact.js" de
// .vercelignore y verificar en el preview del PR antes de mergear.

const { clientIp, verificarCuota, rechazarPorCuota, aplicarCors } = require('./_ratelimit.js');

const HUMAN_FALLBACK = 'No pudimos registrar tu mensaje. Escríbenos a contacto@appunto.mx o por WhatsApp.';

// Limites de longitud: sin ellos, un solo POST puede meter megabytes de basura
// en el CRM y dejarlo inservible para el equipo comercial.
const CAMPOS = {
    nombre:   { max: 120,  requerido: true },
    empresa:  { max: 120,  requerido: false },
    email:    { max: 200,  requerido: true },
    telefono: { max: 40,   requerido: false },
    reto:     { max: 4000, requerido: true },
};

// Deliberadamente laxa: valida la forma, no la existencia del buzon. Una regex
// estricta rechaza direcciones validas y pierde leads reales, que es peor que
// dejar pasar una mal escrita.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// crm.lead.description es un campo Html en las versiones actuales de Odoo, y
// lo que llega aqui lo escribe un desconocido. Odoo sanitiza por su cuenta,
// asi que esto es defensa en profundidad: no se anade markup propio para no
// cambiar como se ve el lead en el back office del equipo comercial.
function escaparHtml(texto) {
    return texto.replace(/[&<>"']/g, c => ESCAPES[c]);
}

function limpiarCampos(body) {
    const datos = {};

    for (const [campo, regla] of Object.entries(CAMPOS)) {
        const bruto = body[campo];

        if (bruto === undefined || bruto === null || bruto === '') {
            if (regla.requerido) return { error: 'Falta un campo obligatorio.' };
            datos[campo] = '';
            continue;
        }
        if (typeof bruto !== 'string') return { error: 'Hay un campo con un formato inesperado.' };

        const valor = bruto.trim();
        if (regla.requerido && valor.length === 0) return { error: 'Falta un campo obligatorio.' };
        if (valor.length > regla.max) {
            return { error: `El campo "${campo}" supera los ${regla.max} caracteres.` };
        }
        datos[campo] = valor;
    }

    if (!EMAIL_RE.test(datos.email)) return { error: 'El correo no tiene un formato válido.' };
    return { datos };
}

module.exports = async function handler(req, res) {
    if (!aplicarCors(req, res)) return;

    const ip = clientIp(req);

    // Cuota de intentos: se cobra en cuanto entra la peticion, valida o no.
    // Es holgada, para no estorbar a quien se equivoca al escribir, pero le
    // pone techo al bucle de peticiones basura, que factura invocaciones de
    // Vercel aunque nunca llegue al CRM.
    const intentos = await verificarCuota(ip, 'contact-intentos');
    if (!intentos.ok) {
        return rechazarPorCuota(res, intentos, ip, `Demasiados intentos seguidos. ${HUMAN_FALLBACK}`);
    }

    const ODOO_URL     = process.env.ODOO_URL;
    const ODOO_DB      = process.env.ODOO_DB;
    const ODOO_USER    = process.env.ODOO_USER;
    const ODOO_API_KEY = process.env.ODOO_API_KEY;

    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
        console.error('Faltan variables de entorno de Odoo');
        return res.status(500).json({ error: HUMAN_FALLBACK });
    }

    // Validar ANTES de cobrar la cuota de envios. Son solo 3 por hora: si se
    // cobrara antes, tres erratas seguidas al escribir el correo dejarian a esa
    // persona sin poder escribir durante una hora, y el lead se pierde. Un
    // envio invalido no llega al CRM, asi que no hay nada que racionar.
    const { datos, error } = limpiarCampos(req.body || {});
    if (error) return res.status(400).json({ error });

    const cuota = await verificarCuota(ip, 'contact');
    if (!cuota.ok) {
        const mensaje = cuota.etiqueta === 'global'
            ? `Estamos recibiendo muchos mensajes ahora mismo. ${HUMAN_FALLBACK}`
            : 'Ya recibimos tus mensajes anteriores y te vamos a responder. Si es urgente, escríbenos a contacto@appunto.mx o por WhatsApp.';
        return rechazarPorCuota(res, cuota, ip, mensaje);
    }

    const { nombre, empresa, email, telefono, reto } = datos;

    try {
        // ── 1. Autenticar vía JSON-RPC con API key ────────────────────────────
        const authRes = await fetch(`${ODOO_URL}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'common',
                    method: 'authenticate',
                    args: [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}],
                },
            }),
        });

        if (!authRes.ok) {
            console.error('Odoo auth HTTP', authRes.status);
            return res.status(502).json({ error: HUMAN_FALLBACK });
        }

        const authData = await authRes.json();
        const uid = authData.result;
        if (!uid) {
            // El detalle va al log, no al cliente: los mensajes de error no
            // tienen por que revelar que hay detras del endpoint.
            console.error('Odoo auth failed:', JSON.stringify(authData));
            return res.status(502).json({ error: HUMAN_FALLBACK });
        }

        // ── 2. Crear el lead en CRM vía execute_kw ────────────────────────────
        const leadRes = await fetch(`${ODOO_URL}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                        ODOO_DB,
                        uid,
                        ODOO_API_KEY,
                        'crm.lead',
                        'create',
                        [{
                            name:         `${nombre}${empresa ? ' — ' + empresa : ''}`,
                            contact_name: nombre,
                            email_from:   email,
                            phone:        telefono,
                            partner_name: empresa,
                            type:         'opportunity',
                            description:  `Reto principal:\n${escaparHtml(reto)}`,
                        }],
                    ],
                },
            }),
        });

        if (!leadRes.ok) {
            console.error('Odoo create lead HTTP', leadRes.status);
            return res.status(502).json({ error: HUMAN_FALLBACK });
        }

        const leadData = await leadRes.json();
        if (leadData.error || !leadData.result) {
            // Sin un id de lead no se puede prometer que llego: confirmar un
            // registro que no existe hace que nadie vuelva a insistir.
            console.error('Odoo create lead sin resultado:', JSON.stringify(leadData).slice(0, 500));
            return res.status(502).json({ error: HUMAN_FALLBACK });
        }

        return res.status(200).json({ success: true, leadId: leadData.result });

    } catch (err) {
        console.error('Error inesperado:', err);
        return res.status(500).json({ error: HUMAN_FALLBACK });
    }
};
