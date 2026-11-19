/*
 * Meta Pixel (Facebook) de appunto.mx
 *
 * Un solo archivo para las 9 paginas: el ID vive aqui y en ningun otro lado.
 * Mientras PIXEL_ID este vacio, este script no hace nada (no carga nada de
 * Meta ni pone cookies).
 *
 * Eventos que manda:
 *   PageView  en cada pagina.
 *   Schedule  al hacer clic en un enlace a la agenda (appunto-mx.odoo.com/book).
 *   Contact   al hacer clic en WhatsApp (wa.me) o en un mailto:.
 *   Lead      lo manda jornada/index.html cuando el formulario de la
 *             infografia se registra bien (ver "generate_lead" ahi).
 */
(function () {
    var PIXEL_ID = '756476556494919';

    if (!PIXEL_ID || window.fbq) return;

    /* Codigo base oficial de Meta, sin cambios de logica. */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');

    /* Clics en agenda y contacto, en todo el sitio, sin tocar cada pagina. */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        var pagina = { content_name: location.pathname };
        if (href.indexOf('appunto-mx.odoo.com/book') !== -1) fbq('track', 'Schedule', pagina);
        else if (href.indexOf('wa.me/') !== -1 || href.indexOf('mailto:') === 0) fbq('track', 'Contact', pagina);
    }, true);
})();
