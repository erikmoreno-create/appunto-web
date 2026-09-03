# CLAUDE.md — Sitio web de Appunto

Contexto del proyecto para sesiones de Claude Code. Complementa (no reemplaza) las preferencias globales del usuario.

## Qué es esto

Sitio web corporativo de **Appunto MX, S.A. de C.V.** — consultoría de negocio y tecnología en Querétaro, México. Implementan **Odoo** (ERP) y **Qlik** (integración y analítica de datos).

- Producción: <https://appunto.mx> (también `appunto-web.vercel.app`)
- CTA principal en todo el sitio: `https://appunto-mx.odoo.com/book/EU30` ("Agenda un diagnóstico gratuito")
- Contacto: contacto@appunto.mx · WhatsApp `https://wa.me/524464066544`

## Stack

**Sitio estático puro. No hay build, no hay framework, no hay `package.json`.**

- HTML plano, un archivo por página.
- **Tailwind CSS vía CDN** (`https://cdn.tailwindcss.com`) con la config de tema **inline en el `<head>` de cada página**. No hay `tailwind.config.js`.
- Fuentes: Manrope (headline) + Inter (body) + Material Symbols Outlined, desde Google Fonts.
- JS: `chatbot.js` (widget del asistente, vanilla JS) cargado con `defer` en todas las páginas.
- Backend: dos funciones serverless de Vercel en `api/` (CommonJS, `module.exports = async function handler(req, res)`).
- Deploy: Vercel, **auto-deploy en cada `git push` a `master`**. `vercel.json` sirve la raíz tal cual (`outputDirectory: "."`, sin build command).

⚠️ `css/styles.css` y `js/main.js` son **legacy y no están enlazados por ninguna página**. No los edites esperando que afecten el sitio.

## Estructura

```
index.html              Home
soluciones.html         Soluciones (Odoo + Qlik)
industrias.html         6 industrias atendidas
nosotros.html           Quiénes somos
contacto.html           Formulario → api/contact.js
odoo/index.html         Landing de Odoo (+ carpetas con videos/imágenes por módulo)
qlik/index.html         Landing de Qlik
avisodeprivacidad/      Aviso de Privacidad Integral (LFPDPPP)
api/contact.js          Crea lead en Odoo CRM vía JSON-RPC
api/chat.js             Proxy a OpenAI gpt-4o-mini para el chatbot
chatbot.js              Widget del chatbot (frontend)
logos/ images/ img_industrias/   Assets
*.md                    Documentación y copy de referencia (no se publican)
```

**Rutas:** las páginas de raíz usan rutas relativas (`soluciones.html`, `logos/…`); las de subcarpeta usan `../` (`../soluciones.html`, `../chatbot.js`). Los assets globales (`/favicon.svg`, `/avisodeprivacidad`) sí usan raíz absoluta. Respeta el patrón según dónde vive el archivo.

## Convenciones al editar

1. **Todo cambio de layout/estilo se hace en el HTML con clases Tailwind**, no en CSS externo.
2. **La consistencia entre páginas es manual.** Nav, footer, GA4, favicon y chatbot están duplicados en los 8 HTML. Si tocas uno de esos bloques, tócalos **todos** — verifica con `grep -l` antes de declarar terminado.
3. Paleta (definida en el `tailwind.config` inline de cada página):
   - `primary` `#31728D` (Calypso) · `primary-container` `#215c75`
   - `tertiary` `#991199` (Violet Eggplant) — solo para acentos y overlines
   - `surface` `#F4F1ED` · `surface-container-low` `#ebe6e0` · `surface-container-lowest` `#ffffff`
   - `on-surface` `#191c1e` · `on-surface-variant` `#404547` · `outline-variant` `#cad1d6`
4. Guía de diseño completa en [DESIGN.md](DESIGN.md). Regla clave: **evitar bordes 1px sólidos** para separar secciones; usar cambios de superficie.
5. Copy de referencia (el texto "oficial" de cada sección) en [contenido-web.md](contenido-web.md), [odoo/contenido-web-odoo.md](odoo/contenido-web-odoo.md) y [qlik/contenido-web-qlik.md](qlik/contenido-web-qlik.md).
6. Tono del copy: tutea, directo, lenguaje de negocio (no de software vendor), sin emojis ni superlativos vacíos.
7. **Al publicar o retirar una página, actualiza [sitemap.xml](sitemap.xml)** — es manual, no hay build que lo regenere. La `<lastmod>` de cada archivo sale de `git log -1 --format=%cs -- <archivo>`.

### Qué mide (y qué no) el escáner de isitagentready.com

Es la herramienta con la que se audita este sitio. **Mide si el sitio es consumible por agentes autónomos, no AEO.** No revisa JSON-LD, canonicals, Open Graph, estructura de encabezados ni marcado `FAQPage` — justo las palancas clásicas de posicionamiento en motores de respuesta. Un score alto ahí no implica buen AEO, y viceversa. Úsalo como un insumo, no como la definición de "listo".

De sus 22 checks, para un sitio de marketing como este solo aplican unos pocos. Los que exigen `apiCatalog`, `oauthDiscovery`, `oauthProtectedResource`, `authMd`, `mcpServerCard`, `a2aAgentCard`, `agentSkills`, `webMcp` y `ard` presuponen que el sitio **es** un servicio consumible por agentes (servidor MCP, agente A2A, APIs con OAuth). Appunto no lo es; pasarlos exigiría construir esa infraestructura, no configurarla.

### Content Signals: política declarada

`robots.txt` declara `search=yes, ai-input=yes, ai-train=yes`. Decidido con el usuario en sept 2026. `ai-input` es la que importa para el objetivo del sitio: cubre RAG y grounding, o sea el uso del contenido al generar respuestas. `search` solo cubre índices y enlaces con extractos, no resúmenes de IA.

### DNS-AID: decidido NO implementar (sept 2026)

El escáner de isitagentready reporta `dnsAid: fail` y lo seguirá reportando. **Es intencional, no un pendiente.** Razones:

1. DNS-AID (`draft-mozleywilliams-dnsop-dnsaid`) es un borrador individual del IETF, sin adoptar. El propio documento dice que "no está respaldado por el IETF y no tiene posición formal en el proceso de estándares".
2. Los registros bajo `_agents` anuncian **un agente que habla MCP o A2A**, con su endpoint y capacidades. Appunto no tiene ninguno; publicarlos sería anunciar una puerta inexistente.
3. **No aporta al AEO.** Los motores de respuesta llegan por HTTP rastreando; no consultan registros DNS `_agents`.
4. El DNS lo opera Akky (`dns1-4.akkyhosting13.mx`), **sin DNSSEC** (no hay registros DS), y el borrador insiste en DNSSEC. Los paneles de registradores mexicanos con frecuencia no permiten crear registros SVCB.

Reconsiderar solo si se construye un servidor MCP real que exponga la información de Appunto. Ahí los registros apuntarían a algo que existe.

### Servicios: qué se puede afirmar públicamente

Las líneas de servicio verificables hoy son **Odoo y Qlik**. La empresa está transicionando hacia soluciones de **IA**, pero eso aún no está formalizado: no lo declares como servicio en JSON-LD, FAQs ni copy estructurado hasta que el usuario confirme que ya es oferta firme. Los motores de respuesta citan lo que encuentran, y una afirmación prematura se propaga.

## Backend y secretos

Variables de entorno **configuradas en el dashboard de Vercel**, nunca en el repo (`.env` está en `.gitignore`):

- `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY` → usadas por `api/contact.js`
- `OPENAI_API_KEY` → usada por `api/chat.js`

El `SYSTEM_PROMPT` del chatbot vive **server-side** en `api/chat.js` (nunca llega al navegador). Documentación del chatbot en [CHATBOT.md](CHATBOT.md). Si cambia la oferta de servicios, industrias o el link de booking, **actualiza también ese prompt** o el bot dará información desactualizada.

## Deploy

**`master` es rama protegida: no acepta `push` directo, solo Pull Requests.**

Flujo: rama → `git push -u origin <rama>` → `gh pr create --base master`. Vercel publica una **URL de preview** en un comentario del PR; úsala para verificar antes de mergear (es la única forma de probar `robots.txt`, `.vercelignore`, headers o cualquier cosa que dependa del servidor). El merge a `master` despliega a producción en ~1 min.

`deploy.bat` y la task de VS Code hacen `add + commit + push` directo — **ya no funcionan** con la protección de rama.

**Pide confirmación al usuario antes de mergear un PR** — eso es lo que va a producción.

## Estado conocido / deuda técnica

- **SEO/AEO incompleto:** ninguna página tiene `<link rel="canonical">`, Open Graph, Twitter Cards ni JSON-LD.
- **URLs duplicadas sin canonicalizar.** El mismo contenido responde 200 en varias rutas y ninguna redirige: `/odoo`, `/odoo/` y `/odoo/index.html` son la misma página (igual `qlik` y `avisodeprivacidad`), y `/` con `/index.html`. El `sitemap.xml` ya declara cuál es la buena; falta que las etiquetas `<link rel="canonical">` y los enlaces internos del nav apunten a esa misma forma.
- **`www.appunto.mx` no resuelve** (fallo de conexión, no redirección). Quien lo teclee ve un error.
- `AGENTS.md` (contexto para otros agentes) y este `CLAUDE.md` se solapan. `AGENTS.md` está algo desactualizado: describe 5 páginas sin mencionar `odoo/index.html` ni `qlik/index.html`, y dice que `css/` tiene estilos propios en uso.
- Las meta descriptions de `contacto`/`nosotros`/`soluciones` mencionan **Inteligencia Artificial** como tercera línea de servicio, junto a Odoo y Qlik. El resto del sitio y el prompt del chatbot solo hablan de Odoo y Qlik.
- El menú móvil del nav (hamburguesa) es solo visual en varias páginas — el JS que lo abría vivía en `js/main.js`, que ya no se carga.
- El footer dice "© 2026".
- Assets pesados versionados en git: `OdooAppuntoDemoComercial.mp4` (~10 MB) y `qlik_espanol.mp4` (~11 MB).

## Git

Repo remoto en GitHub bajo la cuenta **erikmoreno-create** (la cuenta diaria del usuario es `erikjmm14` — usar `gh auth switch` si hace falta). Rama principal: `master`.
