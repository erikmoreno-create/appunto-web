// Asistente Appunto — widget de chat flotante.
// Vanilla JS, sin dependencias. Se inyecta a sí mismo (HTML + CSS) en
// cualquier página donde se cargue este script.
//
// Endpoint:    POST /api/chat   { messages: [...] }
// Almacenamiento: sessionStorage (se borra al cerrar la pestaña).
// Historial enviado al backend: últimos 10 mensajes.

(function () {
    'use strict';

    if (window.__appuntoChatLoaded) return;
    window.__appuntoChatLoaded = true;

    var CFG = {
        api: '/api/chat',
        storageKey: 'appunto_chat_history',
        maxHistory: 10,
        maxInputChars: 2000,
    };

    var WELCOME = 'Hola, soy el asistente de Appunto. Te puedo orientar sobre nuestros servicios o conectarte con un consultor. ¿En qué puedo ayudarte?';

    // ─── Estilos ──────────────────────────────────────────────────────────
    var styles = ''
        + '#appunto-chat{--ap-primary:#31728D;--ap-primary-container:#215c75;--ap-surface:#F4F1ED;--ap-surface-low:#ebe6e0;--ap-surface-white:#fff;--ap-on-surface:#191c1e;--ap-on-surface-variant:#404547;--ap-outline:#cad1d6;font-family:"Inter",system-ui,-apple-system,sans-serif;color:var(--ap-on-surface)}'
        + '#appunto-chat *{box-sizing:border-box}'
        + '#appunto-chat-toggle{position:fixed;bottom:1.5rem;right:1.5rem;width:56px;height:56px;border-radius:50%;background:var(--ap-primary);color:#fff;border:none;cursor:pointer;box-shadow:0 12px 28px rgba(15,37,48,.28);z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform .2s ease,background-color .2s ease,box-shadow .2s ease;padding:0}'
        + '#appunto-chat-toggle:hover{background:var(--ap-primary-container);transform:translateY(-2px);box-shadow:0 16px 32px rgba(15,37,48,.32)}'
        + '#appunto-chat-toggle:focus-visible{outline:3px solid #fff;outline-offset:3px}'
        + '#appunto-chat-toggle svg{width:26px;height:26px;display:block}'
        + '#appunto-chat-panel{position:fixed;bottom:1.5rem;right:1.5rem;width:360px;height:560px;max-height:calc(100vh - 3rem);background:var(--ap-surface-white);border-radius:20px;box-shadow:0 24px 56px rgba(15,37,48,.32);display:none;flex-direction:column;overflow:hidden;z-index:9999}'
        + '#appunto-chat-panel.appunto-open{display:flex;animation:appunto-fade-in .25s ease-out}'
        + '@keyframes appunto-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'
        + '@media (max-width:480px){#appunto-chat-panel{bottom:0;right:0;left:0;width:100%;height:100%;max-height:100%;border-radius:0}}'
        + '#appunto-chat-panel header{background:var(--ap-primary);color:#fff;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:12px}'
        + '#appunto-chat-panel header h2{font-family:"Manrope",system-ui,sans-serif;font-size:15px;font-weight:700;margin:0;letter-spacing:-.01em;line-height:1.2}'
        + '#appunto-chat-panel header .appunto-status{font-size:11px;font-weight:500;opacity:.85;margin-top:2px;display:block}'
        + '#appunto-chat-close{background:transparent;border:none;color:#fff;cursor:pointer;padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background .15s ease}'
        + '#appunto-chat-close:hover{background:rgba(255,255,255,.15)}'
        + '#appunto-chat-close:focus-visible{outline:2px solid #fff;outline-offset:1px}'
        + '#appunto-chat-close svg{width:20px;height:20px;display:block}'
        + '#appunto-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--ap-surface);scroll-behavior:smooth}'
        + '#appunto-chat-messages::-webkit-scrollbar{width:6px}'
        + '#appunto-chat-messages::-webkit-scrollbar-thumb{background:var(--ap-outline);border-radius:3px}'
        + '.appunto-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}'
        + '.appunto-msg p{margin:0 0 6px}'
        + '.appunto-msg p:last-child{margin-bottom:0}'
        + '.appunto-msg ul{margin:6px 0;padding-left:18px}'
        + '.appunto-msg li{margin:2px 0}'
        + '.appunto-msg.bot{background:var(--ap-surface-white);color:var(--ap-on-surface);border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,.06)}'
        + '.appunto-msg.user{background:var(--ap-primary);color:#fff;border-bottom-right-radius:4px;align-self:flex-end;white-space:pre-wrap}'
        + '.appunto-msg.bot a{color:var(--ap-primary);text-decoration:underline}'
        + '.appunto-msg.user a{color:#fff;text-decoration:underline}'
        + '.appunto-typing{align-self:flex-start;background:var(--ap-surface-white);border-radius:16px;border-bottom-left-radius:4px;padding:12px 16px;box-shadow:0 1px 2px rgba(0,0,0,.06);display:flex;gap:5px}'
        + '.appunto-typing span{width:7px;height:7px;border-radius:50%;background:var(--ap-on-surface-variant);opacity:.4;animation:appunto-typing 1.2s infinite}'
        + '.appunto-typing span:nth-child(2){animation-delay:.2s}'
        + '.appunto-typing span:nth-child(3){animation-delay:.4s}'
        + '@keyframes appunto-typing{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}'
        + '#appunto-chat-form{border-top:1px solid var(--ap-outline);background:var(--ap-surface-white);padding:12px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0}'
        + '#appunto-chat-input{flex:1;border:1px solid var(--ap-outline);border-radius:12px;padding:10px 12px;font-family:inherit;font-size:14px;line-height:1.4;resize:none;max-height:96px;background:var(--ap-surface-white);color:var(--ap-on-surface);overflow-y:auto}'
        + '#appunto-chat-input:focus{outline:none;border-color:var(--ap-primary);box-shadow:0 0 0 2px rgba(49,114,141,.18)}'
        + '#appunto-chat-input:disabled{background:var(--ap-surface-low);cursor:not-allowed}'
        + '#appunto-chat-send{background:var(--ap-primary);color:#fff;border:none;border-radius:12px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s ease}'
        + '#appunto-chat-send:hover:not(:disabled){background:var(--ap-primary-container)}'
        + '#appunto-chat-send:focus-visible{outline:2px solid var(--ap-primary);outline-offset:2px}'
        + '#appunto-chat-send:disabled{opacity:.45;cursor:not-allowed}'
        + '#appunto-chat-send svg{width:18px;height:18px;display:block}';

    var styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // ─── DOM ──────────────────────────────────────────────────────────────
    var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

    var container = document.createElement('div');
    container.id = 'appunto-chat';
    container.innerHTML = ''
        + '<button id="appunto-chat-toggle" type="button" aria-label="Abrir chat con Appunto" aria-expanded="false" aria-controls="appunto-chat-panel">' + ICON_CHAT + '</button>'
        + '<div id="appunto-chat-panel" role="dialog" aria-labelledby="appunto-chat-title" aria-hidden="true">'
        +   '<header>'
        +     '<div>'
        +       '<h2 id="appunto-chat-title">Asistente Appunto</h2>'
        +       '<span class="appunto-status">Responde en segundos</span>'
        +     '</div>'
        +     '<button id="appunto-chat-close" type="button" aria-label="Cerrar chat">' + ICON_CLOSE + '</button>'
        +   '</header>'
        +   '<div id="appunto-chat-messages" aria-live="polite" aria-atomic="false"></div>'
        +   '<form id="appunto-chat-form" autocomplete="off">'
        +     '<textarea id="appunto-chat-input" placeholder="Escribe tu mensaje..." rows="1" aria-label="Tu mensaje" maxlength="' + CFG.maxInputChars + '"></textarea>'
        +     '<button id="appunto-chat-send" type="submit" aria-label="Enviar mensaje">' + ICON_SEND + '</button>'
        +   '</form>'
        + '</div>';

    function mount() {
        document.body.appendChild(container);
        wire();
    }
    if (document.body) {
        mount();
    } else {
        document.addEventListener('DOMContentLoaded', mount);
    }

    // ─── Estado ───────────────────────────────────────────────────────────
    var history = [];
    var isOpen = false;
    var isLoading = false;

    try {
        var stored = sessionStorage.getItem(CFG.storageKey);
        if (stored) {
            var parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) history = parsed;
        }
    } catch (e) { history = []; }

    function saveHistory() {
        try { sessionStorage.setItem(CFG.storageKey, JSON.stringify(history)); } catch (e) {}
    }

    // ─── Render de mensajes ──────────────────────────────────────────────
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    // Markdown muy ligero: **negritas**, [texto](url), listas con `- `
    // y saltos de línea. Cualquier input se escapa antes de aplicar formato.
    function renderMarkdown(text) {
        var safe = escapeHtml(text);
        var lines = safe.split('\n');
        var out = [];
        var inList = false;
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^\s*[-•]\s+(.*)$/);
            if (m) {
                if (!inList) { out.push('<ul>'); inList = true; }
                out.push('<li>' + m[1] + '</li>');
            } else {
                if (inList) { out.push('</ul>'); inList = false; }
                out.push(lines[i]);
            }
        }
        if (inList) out.push('</ul>');
        var html = out.join('\n');
        html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // Saltos de línea que no estén pegados a tags de lista → <br>
        html = html.replace(/\n(?!<\/?(?:ul|li))/g, '<br>');
        html = html.replace(/\n/g, '');
        return html;
    }

    var messagesEl, inputEl, sendBtn, panelEl, toggleBtn, closeBtn, formEl;

    function appendMessageBubble(role, content) {
        var div = document.createElement('div');
        div.className = 'appunto-msg ' + (role === 'user' ? 'user' : 'bot');
        if (role === 'user') {
            div.textContent = content;
        } else {
            div.innerHTML = renderMarkdown(content);
        }
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
        if (document.getElementById('appunto-typing-indicator')) return;
        var div = document.createElement('div');
        div.className = 'appunto-typing';
        div.id = 'appunto-typing-indicator';
        div.setAttribute('aria-label', 'El asistente está escribiendo');
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
        var t = document.getElementById('appunto-typing-indicator');
        if (t) t.remove();
    }

    function renderAllHistory() {
        messagesEl.innerHTML = '';
        if (history.length === 0) {
            history.push({ role: 'assistant', content: WELCOME });
            saveHistory();
        }
        for (var i = 0; i < history.length; i++) {
            var role = history[i].role === 'assistant' ? 'bot' : 'user';
            appendMessageBubble(role, history[i].content);
        }
    }

    // ─── Abrir/cerrar ────────────────────────────────────────────────────
    function openPanel() {
        panelEl.classList.add('appunto-open');
        panelEl.setAttribute('aria-hidden', 'false');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.style.display = 'none';
        isOpen = true;
        renderAllHistory();
        setTimeout(function () { inputEl.focus(); }, 80);
    }

    function closePanel() {
        panelEl.classList.remove('appunto-open');
        panelEl.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.style.display = 'flex';
        isOpen = false;
        toggleBtn.focus();
    }

    // ─── Envío ────────────────────────────────────────────────────────────
    function sendMessage(text) {
        if (isLoading) return;
        isLoading = true;
        sendBtn.disabled = true;
        inputEl.disabled = true;

        history.push({ role: 'user', content: text });
        saveHistory();
        appendMessageBubble('user', text);
        showTyping();

        var payload = {
            messages: history.slice(-CFG.maxHistory).map(function (m) {
                return { role: m.role, content: m.content };
            }),
        };

        fetch(CFG.api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        .then(function (res) {
            return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
            hideTyping();
            var reply;
            if (r.ok && r.data && r.data.reply) {
                reply = r.data.reply;
            } else if (r.data && r.data.error) {
                reply = r.data.error;
            } else {
                reply = 'No pude responder en este momento. Si quieres, [agenda un diagnóstico gratuito](https://appunto-mx.odoo.com/book/EU30) o escríbenos a contacto@appunto.mx.';
            }
            history.push({ role: 'assistant', content: reply });
            saveHistory();
            appendMessageBubble('bot', reply);
        })
        .catch(function () {
            hideTyping();
            var reply = 'No pude conectarme. Si quieres, [agenda un diagnóstico gratuito](https://appunto-mx.odoo.com/book/EU30) o escríbenos a contacto@appunto.mx.';
            history.push({ role: 'assistant', content: reply });
            saveHistory();
            appendMessageBubble('bot', reply);
        })
        .then(function () {
            isLoading = false;
            sendBtn.disabled = false;
            inputEl.disabled = false;
            inputEl.focus();
        });
    }

    function autoResize() {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(96, inputEl.scrollHeight) + 'px';
    }

    function wire() {
        messagesEl = container.querySelector('#appunto-chat-messages');
        inputEl = container.querySelector('#appunto-chat-input');
        sendBtn = container.querySelector('#appunto-chat-send');
        panelEl = container.querySelector('#appunto-chat-panel');
        toggleBtn = container.querySelector('#appunto-chat-toggle');
        closeBtn = container.querySelector('#appunto-chat-close');
        formEl = container.querySelector('#appunto-chat-form');

        toggleBtn.addEventListener('click', openPanel);
        closeBtn.addEventListener('click', closePanel);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) closePanel();
        });

        formEl.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = inputEl.value.trim();
            if (!text || text.length > CFG.maxInputChars) return;
            inputEl.value = '';
            autoResize();
            sendMessage(text);
        });

        inputEl.addEventListener('input', autoResize);

        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formEl.requestSubmit ? formEl.requestSubmit() : formEl.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });
    }
})();
