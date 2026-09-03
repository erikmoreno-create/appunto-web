# Asistente Appunto

Widget de chat flotante en la esquina inferior derecha de cada página del sitio. Responde preguntas sobre los servicios de Appunto y redirige al booking de Odoo cuando el visitante quiere agendar o cotizar.

## Arquitectura

```
contacto.html / index.html / etc.
        ↓ <script defer src="chatbot.js">
chatbot.js  (vanilla JS, inyecta widget + estilos)
        ↓ POST /api/chat
api/chat.js (Vercel serverless function)
        ↓ HTTPS
OpenAI API (gpt-4o-mini)
```

**El system prompt vive en `api/chat.js` (server-side).** El navegador nunca lo ve, ni ve la API key.

### Frontend (`chatbot.js`)

- Vanilla JS, sin dependencias, sin proceso de build.
- Se autoinyecta en el `<body>` de cualquier página donde se cargue.
- Estilos como CSS embebido (no usa Tailwind porque la CDN de Tailwind no procesa clases inyectadas dinámicamente).
- Historial de la conversación en `sessionStorage` con la clave `appunto_chat_history` — se borra al cerrar la pestaña.
- Al enviar mensajes al backend trunca a los últimos 10 turnos.

### Backend (`api/chat.js`)

- Función serverless de Vercel (Node.js runtime, `module.exports`).
- POST `/api/chat` recibe `{ messages: [{ role, content }, ...] }`.
- Valida: array no vacío, último mensaje es `user`, contenido entre 1 y 2000 caracteres.
- Antepone el system prompt al historial recibido.
- Llama a `https://api.openai.com/v1/chat/completions` con:
  - `model: 'gpt-4o-mini'`
  - `max_tokens: 400`
  - `temperature: 0.7`
- Devuelve `{ reply: '...' }` o `{ error: '...' }` con mensaje en español sin detalles técnicos.

### Variables de entorno

| Variable | Dónde | Para qué |
|----------|-------|----------|
| `OPENAI_API_KEY` | Vercel → Project Settings → Environment Variables | Autenticar contra la API de OpenAI |
| `UPSTASH_REDIS_REST_URL` | Vercel → Project Settings → Environment Variables | Contador del rate limit (opcional, ver abajo) |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel → Project Settings → Environment Variables | Token de ese Redis (opcional, ver abajo) |

La key **nunca** se hardcodea ni se envía al cliente. Si se filtra (en un commit, en un log, en un chat), hay que regenerarla en OpenAI y actualizar el valor en Vercel.

## Cómo cambiar el system prompt

Editar la constante `SYSTEM_PROMPT` arriba de `api/chat.js`. Es un string template literal. Después de commitear y pushear, Vercel redespliega solo. El cambio aplica en segundos, no hay que tocar el frontend.

Si quieres iterar rápido sobre el prompt **sin redeployar cada vez**, prueba localmente con `vercel dev` (ver más abajo).

## Cómo cambiar de modelo

En `api/chat.js`, dentro del body del `fetch` a OpenAI:

```js
body: JSON.stringify({
    model: 'gpt-4o-mini',  // ← cambiar aquí
    messages: chatMessages,
    max_tokens: 400,
    temperature: 0.7,
}),
```

Modelos compatibles (mismo endpoint `/v1/chat/completions`):

- `gpt-4o-mini` — actual, costo bajo, calidad suficiente para chatbot de FAQ.
- `gpt-4o` — más capaz, ~30× más caro por token. Usar si las respuestas se sienten cortas o incoherentes.
- `gpt-4.1-mini` / `gpt-4.1` — modelos de la línea 4.1 si quieres más razonamiento.

Si en el futuro migras a otro proveedor (Anthropic, Google), hay que cambiar:
1. El endpoint (URL).
2. La forma del body (cada proveedor tiene su propio formato).
3. Cómo se extrae el `reply` de la respuesta (`data.choices[0].message.content` para OpenAI; otros proveedores devuelven distinto).
4. La variable de entorno con la key.

## Control de gasto y abuso

`/api/chat` es **público por necesidad**: lo llama el navegador de cada visitante, así que no hay credencial que se pueda exigir. Y cada petición que entra se convierte en una llamada de pago a OpenAI. Sin límite, quien descubra la URL puede generar factura indefinidamente.

**Los headers CORS no son la defensa.** Solo deciden qué páginas pueden *leer* la respuesta desde el navegador de un visitante; un script con `curl` los ignora por completo. Sirven para cortar el uso desde otro sitio web, nada más.

Lo que sí protege, en `api/chat.js`:

| Capa | Límite | Qué cubre |
|---|---|---|
| Por IP, por minuto | 10 | La ráfaga de un script |
| Por IP, por hora | 60 | El goteo sostenido desde una IP |
| Global, por día | 1500 | El techo de la factura aunque roten las IPs |

Los contadores viven en **Upstash Redis**, llamado por su **API REST** — a propósito: el repo no tiene `package.json` y añadir una dependencia npm cambiaría el modelo de deploy del sitio.

### Si `UPSTASH_REDIS_REST_URL` y `_TOKEN` no están configuradas

El endpoint **sigue funcionando**, con un contador en la memoria del proceso. Atrapa la ráfaga desde una IP porque Vercel reutiliza instancias calientes, pero se pierde en cada arranque en frío y no ve las otras instancias. **Es una reja, no un muro.** Lo mismo aplica si Upstash deja de responder: se registra en los logs y se sigue con el contador en memoria, porque dejar el asistente muerto por una caída de Redis es peor para el negocio que el riesgo de que alguien ataque justo en esa ventana.

### Cómo configurar Upstash (una vez, gratis)

1. Crear cuenta en <https://upstash.com> y una base **Redis** (el free tier son 10 mil comandos al día; cada mensaje del chatbot consume 6).
2. En la base creada, sección **REST API**, copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
3. Pegarlas en Vercel → Project Settings → Environment Variables, para Production y Preview.
4. Redesplegar (cualquier push, o *Redeploy* en el dashboard). En los logs debe **dejar de aparecer** `Rate limit: UPSTASH_... sin configurar`.

### El techo que no depende de este código

Aunque todo lo anterior falle, el límite de gasto de la cuenta de OpenAI acota la factura: **Settings → Limits → Usage limits → monthly budget**. Configurarlo no es opcional.

## Cómo monitorear costos

OpenAI Platform → **Usage**: https://platform.openai.com/usage

Ver "Cost" filtrado por el modelo en uso. Cada llamada al asistente cuesta aproximadamente:

- **gpt-4o-mini**: ~$0.00015 por 1K tokens de input, ~$0.0006 por 1K tokens de output.
- Conversación típica de 5 turnos con historial de 10 mensajes ≈ 2K tokens input + 200 tokens output ≈ **menos de $0.001 USD por conversación completa**.

Para poner un techo seguro: OpenAI Platform → **Settings → Limits → Usage limits** → "Set a monthly budget". Si lo rebasa, la API deja de aceptar requests automáticamente (mejor que una factura sorpresa).

## Prueba local con `vercel dev`

Sin esto solo puedes probar el frontend (el toggle abre, el panel se ve), pero no las llamadas reales al modelo porque el endpoint `/api/chat` solo existe en el runtime de Vercel.

1. Instalar Vercel CLI una sola vez:
   ```
   npm install -g vercel
   ```

2. Linkear el proyecto local con el proyecto de Vercel (la primera vez):
   ```
   vercel link
   ```
   Te pregunta a qué scope y proyecto vinculas; elige `appunto-web-dhsk`.

3. Importar las variables de entorno de Vercel a tu máquina:
   ```
   vercel env pull .env.local
   ```
   Esto crea un `.env.local` con `OPENAI_API_KEY`. **No commitearlo**; ya debería ignorarse, si no, agregar a `.gitignore`.

4. Levantar el servidor local:
   ```
   vercel dev
   ```
   Por defecto en `http://localhost:3000`. Abre cualquier página, prueba el chat.

## Deploy a producción

El flujo es el mismo del resto del sitio:

```bash
git add api/chat.js chatbot.js CHATBOT.md *.html
git commit -m "feat: chatbot"
git push
```

Vercel detecta el push y despliega automáticamente. Si `OPENAI_API_KEY` no está configurada como env var, el endpoint responderá con error amigable y se loguea en la consola de Vercel.

## Comportamiento esperado del bot

- Tutea siempre, tono directo, sin emojis.
- Para preguntas sobre precio, tiempos, cotización o diagnóstico para un caso concreto: redirige al booking `https://appunto-mx.odoo.com/book/EU30`.
- Para preguntas fuera de scope (política, temas personales, otros temas): ofrece WhatsApp, email y booking.
- No promete resultados específicos. No inventa cifras ni features.

Si el bot empieza a desviarse (inventa, promete, cambia de tono), refuerza la regla específica en el system prompt y redeploya.
