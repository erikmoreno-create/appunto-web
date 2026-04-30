module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { nombre, empresa, email, caso, reto } = req.body || {};

    if (!nombre || !email || !reto) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const ODOO_URL     = process.env.ODOO_URL;      // https://appunto-mx.odoo.com
    const ODOO_DB      = process.env.ODOO_DB;       // appunto-mx
    const ODOO_USER    = process.env.ODOO_USER;     // email del usuario administrador
    const ODOO_API_KEY = process.env.ODOO_API_KEY;  // API key generada en Odoo

    if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_API_KEY) {
        console.error('Faltan variables de entorno de Odoo');
        return res.status(500).json({ error: 'Configuración incompleta en el servidor' });
    }

    const casoLabels = {
        'integracion-datos':    'Integración de datos (Qlik)',
        'analitica-negocio':    'Analítica de negocio (Qlik)',
        'integracion-operativa':'Integración operativa (Odoo)',
        'control-financiero':   'Control financiero (Odoo)',
        'otro':                 'Otro / No estoy seguro',
    };
    const casoLabel = casoLabels[caso] || 'No especificado';

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
            console.error('Odoo auth failed:', JSON.stringify(authData));
            return res.status(500).json({ error: 'Error de autenticación con Odoo' });
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
                            partner_name: empresa || '',
                            description:  `Caso de interés: ${casoLabel}\n\nReto principal:\n${reto}`,
                        }],
                    ],
                },
            }),
        });

        const leadData = await leadRes.json();
        if (leadData.error) {
            console.error('Odoo create lead error:', JSON.stringify(leadData.error));
            return res.status(500).json({ error: 'Error al crear el lead en Odoo' });
        }

        return res.status(200).json({ success: true, leadId: leadData.result });

    } catch (err) {
        console.error('Error inesperado:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
