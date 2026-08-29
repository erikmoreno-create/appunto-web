# appunto-web

Sitio público de Appunto. HTML/CSS/JS a mano, **sin framework y sin build**.

## ⚠️ Esto está en producción

El repositorio está conectado a **Vercel**. Un merge a `master` despliega a
producción en aproximadamente un minuto, en `appunto-web.vercel.app`.

No hay paso intermedio. Lo que se mergea, se publica.

## La rama por defecto es `master`, no `main`

No la asumas: detéctala.

```bash
BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD | sed 's|origin/||')
```

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` `nosotros.html` `soluciones.html` `industrias.html` `contacto.html` | las 5 páginas del sitio |
| `css/` | hojas de estilo |
| `images/` `img_industrias/` | imágenes (png, webp, svg) |
| `chatbot.js` | widget del chatbot, del lado del cliente |
| `api/chat.js` `api/contact.js` | **funciones serverless de Vercel** |
| `avisodeprivacidad/` | aviso de privacidad |
| `DESIGN.md` `CHATBOT.md` `contenido-web.md` | documentación existente — léela antes de cambiar diseño o textos |
| `vercel.json` | `buildCommand` vacío, `outputDirectory: "."` |

## 🚫 Zona prohibida: `api/`

`api/chat.js` y `api/contact.js` son backend real: consumen créditos de API y
envían correo. **Ninguna tarjeta de feedback es lo bastante "chica" para tocar
esa carpeta.** Si una tarjeta lo requiere, bloquéala y explica que es trabajo de
backend para Erik.

Lo mismo aplica a `vercel.json`, `.vercel/` y `deploy.bat`.

## Convenciones

- Los breakpoints ya existen en `css/`. **Usa los que hay**, no inventes uno.
- Nombres de clases: sigue el estilo del archivo que estés editando.
- Textos en español de México.
- Antes de cambiar diseño o copy, lee `DESIGN.md` y `contenido-web.md`.

## Cómo verificar un cambio

No hay tests ni build. Dos caminos:

1. **Preview de Vercel:** al abrir el PR, Vercel suele publicar una URL de
   previsualización. Si aparece en los comentarios del PR, **inclúyela en el
   cuerpo del PR** — le permite a Erik ver el cambio renderizado desde el
   celular en vez de leer un diff.
2. A ojo: abrir el archivo y revisarlo, incluyendo ancho de móvil (< 480 px).

## Prohibido

- Añadir dependencias, frameworks o herramientas de build. El sitio no tiene
  `package.json` a propósito.
- Tocar `OdooAppuntoDemoComercial.mp4` ni los archivos de video.
- Reemplazar imágenes salvo que la tarjeta lo pida explícitamente.
