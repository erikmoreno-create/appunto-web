// Pruebas del control de gasto y acceso de api/.
//
// Se corren con:   node api/_ratelimit.test.js
//
// No hacen falta dependencias ni cuenta de Upstash: se levanta un servidor
// local que imita su API REST y se intercepta el fetch a OpenAI, asi que la
// bateria completa no cuesta un centavo ni toca ningun servicio externo.
//
// El prefijo "_" evita que Vercel lo publique como ruta.
const http = require("http");
const path = require("path");

const DIR = __dirname;
const CHAT = path.join(DIR, "chat.js");
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

function cargar() {
    delete require.cache[require.resolve(CHAT)];
    delete require.cache[require.resolve(RL)];
    return require(CHAT);
}

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
    process.env.UPSTASH_REDIS_REST_URL = "http://127.0.0.1:" + srv.address().port;
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    process.env.VERCEL_ENV = "production";
    // Key falsa + fetch interceptado: el flujo llega hasta el final sin que
    // salga una sola peticion real a OpenAI, asi que no cuesta un centavo.
    process.env.OPENAI_API_KEY = "sk-de-prueba-no-real";
    let llamadasOpenAI = 0;
    const fetchReal = globalThis.fetch;
    globalThis.fetch = (url, opts) => {
        if (String(url).includes("api.openai.com")) {
            llamadasOpenAI++;
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ choices: [{ message: { content: "simulada" } }] }),
            });
        }
        return fetchReal(url, opts);
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
    // 10 aceptadas x 6 comandos (INCR+EXPIRE de minuto, hora y global)
    // + 4 de la peticion 11 (solo las claves por IP, el global ya no se toca)
    // + 0 de las peticiones 12-20, que ya salen por la cache local.
    check("comandos gastados en Upstash", comandos.length, 64);
    const trasBloqueo = comandos.length - 64;
    check("comandos de las peticiones 12-20", trasBloqueo, 0);
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

    // --- 4. Retry-After segun la ventana que se agoto -----------------------
    console.log("\n4) Retry-After coherente con la ventana");
    handler = cargar();
    let ra = null;
    for (let i = 1; i <= 11; i++) {
        const r = fakeRes();
        await handler(req_({ origin: ORIGEN, "x-real-ip": "5.5.5.5" }), r);
        if (r.code === 429) ra = r.headers["retry-after"];
    }
    check("ventana de minuto -> 60", ra, 60);

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
    for (const [origen, permitido] of casos) {
        const r = fakeRes();
        await handler(req_({ origin: origen, "x-real-ip": "1.2.3." + Math.random() }), r);
        check(origen.slice(8, 52).padEnd(46), r.code === 403 ? "403" : "pasa", permitido ? "pasa" : "403");
    }

    // --- 6. Vary siempre presente ------------------------------------------
    console.log("\n6) Vary: Origin tambien en el 403");
    const r6 = fakeRes();
    await handler(req_({ origin: "https://sitio-ajeno.example", "x-real-ip": "2.2.2.2" }), r6);
    check("Vary en la respuesta 403", r6.headers["vary"], "Origin");

    // --- 7. Peticion basura tambien cuenta ----------------------------------
    console.log("\n7) El cuerpo malformado consume cuota");
    handler = cargar();
    comandos = [];
    const r7 = fakeRes();
    await handler(req_({ origin: ORIGEN, "x-real-ip": "3.3.3.3" }, { nada: true }), r7);
    check("responde 400", r7.code, 400);
    check("pero conto la peticion", comandos.filter(c => c[0] === "INCR").length > 0, "true");

    console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLAS`);
    srv.close();
    process.exit(fallos === 0 ? 0 : 1);
});
