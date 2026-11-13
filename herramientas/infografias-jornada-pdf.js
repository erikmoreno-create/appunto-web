// Convierte herramientas/_infografia-*.html en jornada/infografias/reforma-40-horas-*.pdf
// Requiere Playwright con Chromium. Uso: node herramientas/infografias-jornada-pdf.js
const path = require('path');
const { chromium } = require('playwright');
(async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    for (const k of ['micro', 'pequena', 'mediana', 'grande']) {
        await p.goto('file://' + path.resolve('herramientas/_infografia-' + k + '.html'));
        await p.waitForLoadState('networkidle');
        await p.pdf({ path: 'jornada/infografias/reforma-40-horas-' + k + '.pdf', preferCSSPageSize: true, printBackground: true });
    }
    await b.close();
})();
