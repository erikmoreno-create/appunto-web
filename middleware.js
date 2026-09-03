/**
 * Negociacion de contenido Markdown para agentes.
 *
 * Cuando una peticion trae "Accept: text/markdown", este middleware devuelve
 * una representacion en Markdown de la pagina. Cualquier otra peticion sigue
 * el camino normal y recibe el HTML de siempre.
 *
 * Por que middleware y no un rewrite en vercel.json: en Vercel el sistema de
 * archivos se resuelve ANTES que los rewrites, asi que un rewrite sobre
 * /soluciones.html nunca se dispara porque el archivo estatico gana. El
 * middleware corre antes que todo. (Verificado empiricamente, no asumido.)
 *
 * El Markdown se genera al vuelo desde el propio HTML. Es a proposito: el
 * sitio no tiene build, y mantener copias .md a mano garantizaria que se
 * desincronicen. Una copia vieja servida a un motor de respuesta es peor que
 * no tener copia, porque propaga informacion falsa sobre la empresa.
 */

export const config = { matcher: '/:path*' };

export default async function middleware(request) {
  // Camino rapido: la inmensa mayoria de peticiones sale por aqui sin tocar nada.
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/markdown')) return;
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;

  let upstream;
  try {
    upstream = await fetch(url.toString(), {
      headers: { accept: 'text/html' },
      redirect: 'follow',
    });
  } catch {
    return; // si el fetch falla, que responda el sitio normal
  }

  const ctype = upstream.headers.get('content-type') || '';
  if (!upstream.ok || !ctype.includes('text/html')) return;

  const html = await upstream.text();
  const md = buildMarkdown(html, url);

  // El header Link (describedby / privacy-policy) lo pone vercel.json y tambien
  // aplica a esta respuesta, asi que no se repite aqui.
  return new Response(request.method === 'HEAD' ? null : md, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      // Estimacion (~4 caracteres por token), no un conteo exacto.
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
      // Critico: sin esto una cache intermedia podria servir Markdown a un navegador.
      'vary': 'accept',
    },
  });
}

function buildMarkdown(html, url) {
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = firstMatch(html, /<meta name="description" content="([^"]*)"/i);

  let md = `# ${strip(title)}\n\n`;
  if (desc) md += `> ${strip(desc)}\n\n`;
  md += `URL canonica: ${url.origin}${url.pathname}\n\n---\n\n`;
  md += extractBody(html);
  return md.trimEnd() + '\n';
}

function extractBody(html) {
  const main = firstMatch(html, /<main[^>]*>([\s\S]*?)<\/main>/i) || html;

  const body = main
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Los iconos de Material Symbols son texto suelto ("arrow_downward") que ensucia.
    .replace(/<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');

  const out = [];
  const re = /<(h[1-4]|p|li|blockquote|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const tag = m[1].toLowerCase();

    const inner = m[2]
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const t = strip(text);
        return t ? `[${t}](${href})` : '';
      })
      .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => {
        const s = strip(t);
        return s ? `**${s}**` : '';
      });

    const text = strip(inner);
    if (!text) continue;

    if (tag === 'li') out.push(`- ${text}`);
    // <summary> es la pregunta de un <details>: sin esto el Markdown se queda
    // con la respuesta suelta y sin la pregunta que le da sentido.
    else if (tag === 'summary') out.push(`#### ${text}`);
    else if (tag === 'blockquote') out.push(`> ${text}`);
    else if (tag === 'p') out.push(text);
    // El titulo del documento ya ocupa el H1, asi que el contenido baja un nivel.
    else out.push(`${'#'.repeat(Number(tag[1]) + 1)} ${text}`);
  }

  return out.filter((line, i) => line !== out[i - 1]).join('\n\n');
}

function firstMatch(s, re) {
  const m = s.match(re);
  return m ? m[1] : '';
}

function strip(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
