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

## Backend y secretos

Variables de entorno **configuradas en el dashboard de Vercel**, nunca en el repo (`.env` está en `.gitignore`):

- `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY` → usadas por `api/contact.js`
- `OPENAI_API_KEY` → usada por `api/chat.js`

El `SYSTEM_PROMPT` del chatbot vive **server-side** en `api/chat.js` (nunca llega al navegador). Documentación del chatbot en [CHATBOT.md](CHATBOT.md). Si cambia la oferta de servicios, industrias o el link de booking, **actualiza también ese prompt** o el bot dará información desactualizada.

## Deploy

`git push` a `master` dispara el deploy en Vercel (~1 min). También existen `deploy.bat` y una task de VS Code que hacen `add + commit "Update" + push`.

**Pide confirmación al usuario antes de cualquier `git push`** — va directo a producción.

## Estado conocido / deuda técnica

- **SEO/AEO incompleto:** ninguna página tiene `<link rel="canonical">`, Open Graph, Twitter Cards ni JSON-LD. No existen `robots.txt` ni `sitemap.xml`.
- `soluciones.html`, `nosotros.html` y `contacto.html` **no tienen `<meta name="description">`.**
- El menú móvil del nav (hamburguesa) es solo visual en varias páginas — el JS que lo abría vivía en `js/main.js`, que ya no se carga.
- El footer dice "© 2026".
- Assets pesados versionados en git: `OdooAppuntoDemoComercial.mp4` (~10 MB) y `qlik_espanol.mp4` (~11 MB).

## Git

Repo remoto en GitHub bajo la cuenta **erikmoreno-create** (la cuenta diaria del usuario es `erikjmm14` — usar `gh auth switch` si hace falta). Rama principal: `master`.
