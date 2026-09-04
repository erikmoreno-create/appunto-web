// Verifica el contenido estructurado de las paginas. No necesita credenciales
// ni red, y no cuesta nada:
//
//     node verificar-contenido.test.js
//
// Existe porque el sitio no tiene build. Cada bloque de JSON-LD se escribe a
// mano dentro del HTML, y el texto de las preguntas frecuentes vive DUPLICADO
// en dos lugares de la misma pagina: el <details> visible y el nodo FAQPage.
// Nada obliga a que sigan iguales. Un marcado que contradice al texto visible
// es una violacion de las guias de datos estructurados y, peor para el
// objetivo del sitio, le entrega a los motores de respuesta una afirmacion que
// la pagina ya no hace.
//
// Correr esto despues de tocar cualquier FAQ o cualquier JSON-LD.

const fs = require('fs');

const PAGINAS = ['index.html', 'soluciones.html', 'industrias.html', 'nosotros.html',
                 'contacto.html', 'odoo/index.html', 'qlik/index.html',
                 'avisodeprivacidad/index.html'];

let fallos = 0;
const mal = (msg) => { console.log('  FALLA  ' + msg); fallos++; };

function desescapar(s) {
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// Texto que un lector (o un crawler) ve realmente, sin marcado ni scripts.
function textoVisible(html) {
    return desescapar(html.replace(/<script[\s\S]*?<\/script>/g, ' ')
                          .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ');
}

console.log('1) Todo bloque de JSON-LD parsea\n');
const grafos = {};
for (const p of PAGINAS) {
    const html = fs.readFileSync(p, 'utf8');
    const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (!bloques.length) { mal(p + ': sin JSON-LD'); continue; }

    const tipos = [];
    grafos[p] = [];
    for (const [i, b] of bloques.entries()) {
        try {
            const o = JSON.parse(b[1]);
            const nodos = o['@graph'] || [o];
            grafos[p].push(...nodos);
            tipos.push(...nodos.map(n => n['@type']).flat().filter(Boolean));
        } catch (e) {
            mal(p + ' bloque ' + (i + 1) + ': ' + e.message);
        }
    }
    console.log('  OK   ' + p + ' — ' + tipos.join(', '));
}

console.log('\n2) Cada pregunta y respuesta del FAQPage aparece en el texto visible\n');
for (const [p, nodos] of Object.entries(grafos)) {
    const faq = nodos.find(n => n['@type'] === 'FAQPage');
    if (!faq) continue;

    const visible = textoVisible(fs.readFileSync(p, 'utf8'));
    let ok = 0;
    for (const q of faq.mainEntity) {
        const falta = [];
        if (!visible.includes(q.name.replace(/\s+/g, ' '))) falta.push('la pregunta');
        if (!visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) falta.push('la respuesta');
        if (falta.length) mal(p + ': ' + falta.join(' y ') + ' de "' + q.name.slice(0, 45) + '..." no esta en el HTML');
        else ok++;
    }
    console.log('  OK   ' + p + ' — ' + ok + '/' + faq.mainEntity.length + ' pares alineados');
}

console.log('\n3) Las referencias por @id apuntan a nodos que existen\n');
for (const [p, nodos] of Object.entries(grafos)) {
    // Los @id de la organizacion y el sitio se definen en index.html y las
    // demas paginas los referencian a proposito, asi que no se exigen locales.
    const globales = ['https://appunto.mx/#organization', 'https://appunto.mx/#website'];
    const definidos = new Set([...nodos.map(n => n['@id']).filter(Boolean), ...globales]);

    const refs = [];
    JSON.stringify(nodos, (k, v) => {
        if (v && typeof v === 'object' && v['@id'] && Object.keys(v).length === 1) refs.push(v['@id']);
        return v;
    });
    const rotas = [...new Set(refs)].filter(r => !definidos.has(r));
    if (rotas.length) mal(p + ': @id sin nodo -> ' + rotas.join(', '));
    else console.log('  OK   ' + p + ' — ' + new Set(refs).size + ' referencias resueltas');
}

console.log('\n4) El rango de tamano de empresa es el mismo en todo el sitio\n');
{
    const archivos = [...PAGINAS, 'api/chat.js'];
    const rangos = new Map();
    for (const f of archivos) {
        for (const m of fs.readFileSync(f, 'utf8').matchAll(/(\d+) a (\d+) (?:colaboradores|empleados)/g)) {
            if (!rangos.has(m[0])) rangos.set(m[0], []);
            rangos.get(m[0]).push(f);
        }
    }
    if (rangos.size > 1) {
        mal('hay ' + rangos.size + ' rangos distintos:');
        for (const [r, fs_] of rangos) console.log('         "' + r + '" en ' + [...new Set(fs_)].join(', '));
    } else if (rangos.size === 1) {
        console.log('  OK   "' + [...rangos.keys()][0] + '" en ' + new Set([...rangos.values()][0]).size + ' archivos');
    }
}

console.log('\n' + (fallos ? '\n' + fallos + ' FALLA(S)' : '\nTODO OK'));
process.exit(fallos ? 1 : 0);
