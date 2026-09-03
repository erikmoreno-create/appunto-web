// Pruebas del control de gasto y acceso de api/.
//
// Se corren con:   node api/_ratelimit.test.js
//
// No hacen falta dependencias ni cuenta de Upstash: se levanta un servidor
// local que imita su API REST y se interceptan las llamadas a OpenAI y a Odoo,
// asi que la bateria completa no cuesta un centavo, no crea ningun lead y no
// toca ningun servicio externo.
//
// El prefijo "_" evita que Vercel lo publique como ruta.

const http = require("http");
const path = require("path");

const DIR = __dirname;
const CHAT = path.join(DIR, "chat.js");
const CONTACT = path.join(DIR, "contact.js");
const RL = path.join(DIR, "_ratelimit.js");

let comandos = [];   // todo lo que recibio el falso Upstash
let modo = "ok";     // "ok" | "error-por-comando" | "caido"

const srv = http.createServer((req, res) => {
    if (modo === "caido") { res.writeHead(500); return res.end("boom"); }
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", () => {
        const cmds = JSON.parse(body);
        comandos.push(...cmds);
        const out = cmds.map(cmd => {
            if (modo === "error-por-comando") return { error: "WRONGTYPE simulado" };
            if (cmd[0] !== "INCR") return { result: 1 };
            const k = "n:" + cmd[1];
            srv[k] = (srv[k] || 0) + 1;
            return { result: srv[k] };
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(out));
    });
});

// Recarga los modulos para que cada bloque parta de contadores limpios.
// Devuelve los dos handlers respaldados por la MISMA instancia de
// _ratelimit.js: si se recargaran por separado no compartirian estado y las
// pruebas de independencia entre ambitos pasarian por el motivo equivocado.
function cargarAmbos() {
    delete require.cache[require.resolve(CHAT)];
    delete require.cache[require.resolve(CONTACT)];
    delete require.cache[require.resolve(RL)];
    return { chat: require(CHAT), contact: require(CONTACT) };
}
const cargar = () => cargarAmbos().chat;

const fakeRes = () => {
    const r = { headers: {} };
    r.setHeader = (k, v) => (r.headers[k.toLowerCase()] = v);
    r.status = c => ((r.code = c), r);
    r.json = b => ((r.body = b), r);
    r.end = () => r;
    return r;
};

const req_ = (headers, body) => ({
    method: "POST",
    headers,
    body: body ?? { messages: [{ role: "user", content: "hola" }] },
});

const ORIGEN = "https://appunto.mx";
let fallos = 0;
function check(nombre, real, esperado) {
    const ok = String(real) === String(esperado);
    if (!ok) fallos++;
    console.log(`  ${ok ? "OK  " : "FALLA"} ${nombre}: ${real}${ok ? "" : "  (esperado " + esperado + ")"}`);
}

srv.listen(0, async () => {
    const PUERTO = srv.address().port;
    process.env.UPSTASH_REDIS_REST_URL = "http://127.0.0.1:" + PUERTO;
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    process.env.VERCEL_ENV = "production";
    process.env.OPENAI_API_KEY = "sk-de-prueba-no-real";
    process.env.ODOO_URL = "https://odoo.simulado.invalid";
    process.env.ODOO_DB = "db";
    process.env.ODOO_USER = "u";
    process.env.ODOO_API_KEY = "k";

    let llamadasOpenAI = 0, leads = 0, fugas = [];
    let odooDevuelveLead = true;
    const fetchReal = globalThis.fetch;
    globalThis.fetch = (url, opts) => {
        const u = String(url);
        if (u.includes("api.openai.com")) {
            llamadasOpenAI++;
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ choices: [{ message: { content: "simulada" } }] }),
            });
        }
        if (u.includes("odoo.simulado.invalid")) {
            const esAuth = JSON.parse(opts.body).params.method === "authenticate";
            if (!esAuth && odooDevuelveLead) leads++;
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(
                    esAuth ? { result: 7 } : (odooDevuelveLead ? { result: 4242 } : { jsonrpc: "2.0", id: null })),
            });
        }
        if (u.startsWith("http://127.0.0.1:" + PUERTO)) return fetchReal(url, opts);
        // Cualquier otro destino seria una llamada real: se registra y se corta.
        fugas.push(u);
        return Promise.reject(new Error("llamada saliente no simulada: " + u));
    };

    // --- 1. El bloqueado no debe seguir gastando el presupuesto global ------
    console.log("\n1) Contador global protegido del atacante ya bloqueado");
    let handler = cargar();
    comandos = [];
    let codigos = [];
    for (let i = 1; i <= 20; i++) {
        const r = fakeRes();
        await handler(req_({ origin: ORIGEN, "x-real-ip": "9.9.9.9" }), r);
        codigos.push(r.code);
    }
    const incrGlobal = comandos.filter(c => c[0] === "INCR" && c[1].includes(":global:")).length;
    check("bloquea a partir de la 11", codigos.indexOf(429) + 1, 11);
    check("INCR sobre la clave global", incrGlobal, 10);
    // 10 aceptadas x 6 comandos + 4 de la peticion 11 + 0 de la 12 a la 20,
    // que ya salen por la cache local de IPs bloqueadas.
    check("comandos gastados en Upstash", comandos.length, 64);
    console.log("     (sin los arreglos: 120 comandos y 20 INCR globales, o sea");
    console.log("      el atacante vaciaba el presupuesto diario de todos)");

    // --- 2. x-forwarded-for falsificado ------------------------------------
    console.log("\n2) x-forwarded-for falsificado no crea cubetas nuevas");
    handler = cargar();
    codigos = [];
    for (let i = 1; i <= 12; i++) {
        const r = fakeRes();
        // Vercel anade la IP real AL FINAL de lo que mande el cliente.
        await handler(req_({ origin: ORIGEN, "x-forwarded-for": `10.0.0.${i}, 7.7.7.7` }), r);
        codigos.push(r.code);
    }
    check("sigue bloqueando en la 11 pese al spoofing", codigos.indexOf(429) + 1, 11);

    // --- 3. Upstash con error por comando: no debe abrirse ------------------
    console.log("\n3) Error por comando con HTTP 200 no deja pasar todo");
    handler = cargar();
    modo = "error-por-comando";
    codigos = [];
    for (let i = 1; i <= 12; i++) {
        const r = fakeRes();
        await handler(req_({ origin: ORIGEN, "x-real-ip": "4.4.4.4" }), r);
        codigos.push(r.code);
    }
    check("cae al respaldo y sigue limitando", codigos.indexOf(429) + 1, 11);
    modo = "ok";

    // --- 4. Retry-After: lo que queda de la ventana en curso ----------------
    console.log("\n4) Retry-After coherente con la ventana");
    handler = cargar();
    let ra = null, expose = null;
    for (let i = 1; i <= 11; i++) {
        const r = fakeRes();
        await handler(req_({ origin: ORIGEN, "x-real-ip": "5.5.5.5" }), r);
        if (r.code === 429) { ra = Number(r.headers["retry-after"]); expose = r.headers["access-control-expose-headers"]; }
    }
    check("dentro de la ventana de un minuto (1-60)", ra > 0 && ra <= 60, "true");
    check("Retry-After legible por el navegador", expose, "Retry-After");

    // --- 5. Origenes --------------------------------------------------------
    console.log("\n5) Lista blanca de origenes");
    handler = cargar();
    const casos = [
        ["https://appunto.mx", true],
        ["https://appunto-web-dhsk-git-x-erikmoreno-creates-projects.vercel.app", true],
        ["https://appunto-website.vercel.app", false],
        ["https://appunto-web-clon-de-un-tercero.vercel.app", false],
        ["https://sitio-ajeno.example", false],
    ];
    let n = 0;
    for (const [origen, permitido] of casos) {
        const r = fakeRes();
        await handler(req_({ origin: origen, "x-real-ip": "1.2.3." + n++ }), r);
        check(origen.slice(8, 52).padEnd(46), r.code === 403 ? "403" : "pasa", permitido ? "pasa" : "403");
    }

    // --- 6. Vary siempre presente ------------------------------------------
    console.log("\n6) Vary: Origin tambien en el 403");
    const r6 = fakeRes();
    await handler(req_({ origin: "https://sitio-ajeno.example", "x-real-ip": "2.2.2.2" }), r6);
    check("Vary en la respuesta 403", r6.headers["vary"], "Origin");

    // --- 7. Peticion basura tambien cuenta en el chat ------------------------
    console.log("\n7) El cuerpo malformado consume cuota en /api/chat");
    handler = cargar();
    comandos = [];
    const r7 = fakeRes();
    await handler(req_({ origin: ORIGEN, "x-real-ip": "3.3.3.3" }, { nada: true }), r7);
    check("responde 400", r7.code, 400);
    check("pero conto la peticion", comandos.filter(c => c[0] === "INCR").length > 0, "true");

    // --- 8. /api/contact: cuota mucho mas estricta --------------------------
    console.log("\n8) /api/contact: 3 envios por hora, no 10 por minuto");
    let { chat, contact } = cargarAmbos();
    const lead = (ip, extra) => req_(
        { origin: ORIGEN, "x-real-ip": ip },
        Object.assign({ nombre: "Ana", email: "ana@empresa.mx", reto: "Tenemos datos dispersos" }, extra)
    );
    leads = 0;
    codigos = [];
    for (let i = 1; i <= 5; i++) {
        const r = fakeRes();
        await contact(lead("20.20.20.20"), r);
        codigos.push(r.code);
    }
    check("acepta 3 y corta la 4a", codigos.join(","), "200,200,200,429,429");
    check("leads creados en el CRM", leads, 3);

    // --- 9. Las cuotas de cada endpoint son independientes -------------------
    console.log("\n9) Quedarse sin formulario no deja sin chatbot");
    const r9 = fakeRes();
    await chat(req_({ origin: ORIGEN, "x-real-ip": "20.20.20.20" }), r9);
    check("misma IP bloqueada en contact, habla con el chat", r9.code, 200);

    // --- 10. Validacion de campos -------------------------------------------
    console.log("\n10) Validacion de los campos del formulario");
    ({ chat, contact } = cargarAmbos());
    const casosValidacion = [
        ["reto de 5000 caracteres", { reto: "x".repeat(5000) }, 400],
        ["email sin arroba",        { email: "no-es-un-correo" }, 400],
        ["nombre numerico",         { nombre: 12345 },            400],
        ["envio correcto",          {},                           200],
    ];
    n = 40;
    for (const [nombre, extra, esperado] of casosValidacion) {
        const r = fakeRes();
        await contact(lead("30.30.30." + n++, extra), r);
        check(nombre.padEnd(24), r.code, esperado);
    }

    // --- 11. Una errata no puede costar un lead -----------------------------
    console.log("\n11) Tres erratas seguidas no gastan la cuota de envios");
    ({ chat, contact } = cargarAmbos());
    leads = 0;
    for (let i = 0; i < 3; i++) {
        const r = fakeRes();
        await contact(lead("40.40.40.40", { email: "ana@empresa" }), r);   // sin TLD
        check(`errata ${i + 1} -> 400`, r.code, 400);
    }
    const rBueno = fakeRes();
    await contact(lead("40.40.40.40"), rBueno);
    check("el 4o intento, ya correcto, SI se registra", rBueno.code, 200);
    check("y crea su lead", leads, 1);

    // --- 12. Odoo responde 200 sin id de lead -------------------------------
    console.log("\n12) Un 200 de Odoo sin id no se confirma como exito");
    ({ chat, contact } = cargarAmbos());
    odooDevuelveLead = false;
    const r12 = fakeRes();
    await contact(lead("50.50.50.50"), r12);
    check("responde 502, no 200", r12.code, 502);
    check("no promete un registro inexistente", r12.body.success === undefined, "true");
    odooDevuelveLead = true;

    // --- 13. Nada salio de verdad a internet --------------------------------
    console.log("\n13) Ninguna llamada real saliente");
    check("destinos no simulados", fugas.length, 0);
    check("llamadas a OpenAI interceptadas (>0)", llamadasOpenAI > 0, "true");
    check("altas de lead interceptadas (>0)", leads >= 0, "true");

    console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLAS`);
    srv.close();
    process.exit(fallos === 0 ? 0 : 1);
});
