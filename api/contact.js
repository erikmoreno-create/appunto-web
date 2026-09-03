// Endpoint del formulario de contacto: crea un lead en el CRM de Odoo.
//
// OJO: hoy NINGUNA pagina del sitio lo llama — no existe ningun <form> en el
// repo. Por eso esta listado en .vercelignore y no se publica: un endpoint sin
// consumidores que escribe en el CRM de produccion es riesgo sin beneficio.
//
// El codigo se conserva, protegido y listo, para cuando se anada el formulario
// a contacto.html. Para reactivarlo: quitar la linea "api/contact.js" de
// .vercelignore y verificar en el preview del PR antes de mergear.

const { clientIp, verificarCuota, aplicarCors } = require('./_ratelimit.js');

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

    // Lo gratis primero: sin configuracion no hay nada que hacer.
    const ODOO_URL     = process.env.ODOO_URL;
    const ODOO_DB      = process.env.ODOO_DB;
    const ODOO_USER    = process.env.ODOO_USER;
    const ODOO_API_KEY = process.env.ODOO_API_KEY;

    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
        console.error('Faltan variables de entorno de Odoo');
        return res.status(500).json({ error: 'No pudimos registrar tu mensaje. Escríbenos a contacto@appunto.mx.' });
    }

    // La cuota se cobra antes de parsear: si solo contaramos los envios bien
    // formados, un bucle de peticiones basura no tocaria ningun contador.
    const ip = clientIp(req);
    const cuota = await verificarCuota(ip, 'contact');
    if (!cuota.ok) {
        console.warn('Cuota agotada (' + cuota.etiqueta + ') para ' + ip);
        res.setHeader('Retry-After', String(cuota.retryAfter));
        return res.status(429).json({
            error: 'Ya recibimos tu mensaje. Si es urgente, escríbenos a contacto@appunto.mx o por WhatsApp.',
        });
    }

    const { datos, error } = limpiarCampos(req.body || {});
    if (error) return res.status(400).json({ error });

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

        const authData = await authRes.json();
        const uid = authData.result;
        if (!uid) {
            // El detalle va al log, no al cliente: los mensajes de error no
            // tienen por que revelar que hay detras del endpoint.
            console.error('Odoo auth failed:', JSON.stringify(authData));
            return res.status(502).json({ error: 'No pudimos registrar tu mensaje. Escríbenos a contacto@appunto.mx.' });
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
                            description:  `Reto principal:\n${reto}`,
                        }],
                    ],
                },
            }),
        });

        const leadData = await leadRes.json();
        if (leadData.error) {
            console.error('Odoo create lead error:', JSON.stringify(leadData.error));
            return res.status(502).json({ error: 'No pudimos registrar tu mensaje. Escríbenos a contacto@appunto.mx.' });
        }

        return res.status(200).json({ success: true, leadId: leadData.result });

    } catch (err) {
        console.error('Error inesperado:', err);
        return res.status(500).json({ error: 'No pudimos registrar tu mensaje. Escríbenos a contacto@appunto.mx.' });
    }
};
