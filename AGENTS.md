# appunto-web

Sitio público de Appunto. HTML + Tailwind por CDN, **sin framework y sin build**.

## ⚠️ Esto está en producción

El repositorio está conectado a **Vercel**. Un merge a `master` despliega a
producción en aproximadamente un minuto.

No hay paso intermedio. Lo que se mergea, se publica.

Al abrir un PR, Vercel publica un comentario con una **URL de previsualización**.
Inclúyela en el cuerpo del PR: le permite a Erik revisar el cambio renderizado
desde el celular en vez de leer un diff.

## La rama por defecto es `master`, no `main`

No la asumas: detéctala.

```bash
BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD | sed 's|origin/||')
```

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` `nosotros.html` `soluciones.html` `industrias.html` `contacto.html` `odoo/index.html` `qlik/index.html` `avisodeprivacidad/index.html` | las 8 páginas del sitio |
| `css/` `js/` | **legacy: ninguna página los enlaza.** Editarlos no cambia nada del sitio |
| `images/` `img_industrias/` | imágenes (png, webp, svg) |
| `chatbot.js` | widget del chatbot, del lado del cliente |
| `api/chat.js` | **función serverless de Vercel** (el chatbot) |
| `api/contact.js` | función serverless **no desplegada** (ver `.vercelignore`): hoy no hay formulario que la use |
| `avisodeprivacidad/` | aviso de privacidad |
| `DESIGN.md` `CHATBOT.md` `contenido-web.md` | documentación existente — léela antes de cambiar diseño o textos |
| `vercel.json` | `buildCommand` vacío, `outputDirectory: "."` |

## 🚫 Zona prohibida: `api/`

`api/chat.js` y `api/contact.js` son backend real: el primero consume créditos
de OpenAI en cada llamada, el segundo escribe leads en el CRM de Odoo. Ninguno
envía correo. `api/_ratelimit.js` controla el gasto de ambos. **Ninguna tarjeta de feedback es lo bastante "chica" para tocar
esa carpeta.** Si una tarjeta lo requiere, bloquéala y explica que es trabajo de
backend para Erik.

Lo mismo aplica a `vercel.json`, `.vercel/`, `deploy.bat` y el bloque de Google
Analytics que va en el `<head>` de cada página.

## Convenciones

- **El diseño es Tailwind por CDN** (`cdn.tailwindcss.com`), no CSS propio. Para
  responsive usa las clases utilitarias (`sm:`, `md:`, `lg:`) siguiendo el patrón
  que ya tiene el archivo. No escribas CSS nuevo salvo que ya exista un patrón
  para eso en `css/`.
- Tipografías: Manrope e Inter, cargadas desde Google Fonts.
- Textos en español de México.
- Antes de cambiar diseño o copy, lee `DESIGN.md` y `contenido-web.md`.

## Cómo verificar un cambio

No hay tests ni build. Dos caminos, en orden:

1. **La URL de preview de Vercel** que aparece en el PR — es la mejor
   verificación disponible.
2. A ojo: abrir el archivo y revisarlo, incluyendo ancho de móvil (< 480 px).

## Prohibido

- Añadir dependencias, frameworks o herramientas de build. El sitio no tiene
  `package.json` a propósito.
- Tocar `OdooAppuntoDemoComercial.mp4` ni los archivos de video.
- Reemplazar imágenes salvo que la tarjeta lo pida explícitamente.
