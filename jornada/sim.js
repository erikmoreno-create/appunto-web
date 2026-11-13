/*
 * Caritas ilustradas y simulación de Odoo para la landing de jornada.
 *
 * Todo es ilustrativo: personas ficticias y una interfaz que imita a Odoo
 * para explicar el flujo, no capturas reales. Sin dependencias.
 *
 *   window.Caras.svg(persona)          -> string con el SVG de una carita
 *   window.Caras.gente                 -> catálogo de personas de ejemplo
 *   window.SimOdoo.montar(nodo)        -> monta el simulador en un contenedor
 *   window.SimOdoo.escena(clave)       -> cambia de escena (oficina, planta, campo, sucursales)
 */
(function () {
    'use strict';

    // ── Caritas ────────────────────────────────────────────────────────────
    var PIEL = ['#F5D0B5', '#E8B48F', '#C98E67', '#A86F4C', '#7C4F35'];
    var PELO = { negro: '#2A2220', cafe: '#5B3A29', castano: '#8A5A3B', rubio: '#D9A85B', canas: '#B9B4AE', rojo: '#9E4A2F' };

    var gente = {
        ana:    { nombre: 'Ana Ramírez',     piel: 1, pelo: 'largo',  color: 'cafe',    fondo: '#CFE6EE', ropa: '#31728D' },
        jorge:  { nombre: 'Jorge López',     piel: 2, pelo: 'corto',  color: 'negro',   fondo: '#F1D9F1', ropa: '#991199', barba: true },
        maria:  { nombre: 'María Torres',    piel: 0, pelo: 'chongo', color: 'castano', fondo: '#FDE6CF', ropa: '#C2620E' },
        carlos: { nombre: 'Carlos Soto',     piel: 3, pelo: 'rapado', color: 'negro',   fondo: '#D7EBD9', ropa: '#4E7E52', lentes: true },
        luis:   { nombre: 'Luis Hernández',  piel: 1, pelo: 'lado',   color: 'negro',   fondo: '#E3DDF3', ropa: '#5B4A9E', lentes: true },
        paola:  { nombre: 'Paola García',    piel: 2, pelo: 'rizado', color: 'negro',   fondo: '#F6DADA', ropa: '#B4372B' },
        roberto:{ nombre: 'Roberto Méndez',  piel: 0, pelo: 'calvo',  color: 'canas',   fondo: '#DCE8F2', ropa: '#215C75', barba: true },
        sofia:  { nombre: 'Sofía Flores',    piel: 0, pelo: 'largo',  color: 'rubio',   fondo: '#FFF0C9', ropa: '#9E7A1F' },
        diego:  { nombre: 'Diego Vargas',    piel: 4, pelo: 'rizado', color: 'negro',   fondo: '#D5ECE8', ropa: '#12877A' },
        rosa:   { nombre: 'Rosa Martínez',   piel: 2, pelo: 'chongo', color: 'negro',   fondo: '#F4DFEA', ropa: '#8A1D82' },
        omar:   { nombre: 'Omar Benítez',    piel: 3, pelo: 'corto',  color: 'cafe',    fondo: '#E7E2DA', ropa: '#404547' },
        elena:  { nombre: 'Elena Fuentes',   piel: 1, pelo: 'largo',  color: 'rojo',    fondo: '#DDEFF6', ropa: '#31728D', lentes: true },
        hugo:   { nombre: 'Hugo Sánchez',    piel: 2, pelo: 'lado',   color: 'castano', fondo: '#E9F0D9', ropa: '#5E7B2E' },
        karla:  { nombre: 'Karla Vega',      piel: 3, pelo: 'largo',  color: 'negro',   fondo: '#F2E1D3', ropa: '#A04F2C' }
    };

    var uid = 0;
    function svg(p) {
        var id = 'cara' + (++uid);
        var piel = PIEL[p.piel || 0];
        var sombra = 'rgba(0,0,0,.10)';
        var pelo = PELO[p.color] || PELO.negro;
        var atras = '', frente = '';

        if (p.pelo === 'largo') {
            atras = '<path d="M17 33c0-13 6-21 15-21s15 8 15 21v15c-4 3-9 4-15 4s-11-1-15-4z" fill="' + pelo + '"/>';
            frente = '<path d="M19.5 30c0-9 5-15.5 12.5-15.5S44.5 21 44.5 30c-3-6-7.5-9-12.5-9.2-2.6 3.4-7 6.6-12.5 9.2z" fill="' + pelo + '"/>';
        } else if (p.pelo === 'chongo') {
            atras = '<circle cx="32" cy="11.5" r="6" fill="' + pelo + '"/>';
            frente = '<path d="M19.6 29c0-9 5.4-14.6 12.4-14.6S44.4 20 44.4 29c-3.6-4.8-7.8-6.6-12.4-6.6S23.2 24.2 19.6 29z" fill="' + pelo + '"/>';
        } else if (p.pelo === 'corto') {
            frente = '<path d="M19.4 28.5c-.6-9.6 5-14.8 12.6-14.8 7.8 0 13.3 5.2 12.6 14.8-2.2-3.6-3.6-5.6-5.4-6.4-4.4 1.6-9.4 1.6-14 0-2.2.8-4 2.8-5.8 6.4z" fill="' + pelo + '"/>';
        } else if (p.pelo === 'lado') {
            frente = '<path d="M19.4 29c-.8-9.8 4.8-15.4 13-15.4 7.2 0 12.6 4.8 12.2 14.4-1.8-3-3.6-5-5.6-6-3.8 1.2-10.6.6-14.6-2.4-1.8 2.4-3.4 5.4-5 9.4z" fill="' + pelo + '"/>';
        } else if (p.pelo === 'rizado') {
            var bucles = [[21, 24], [24, 18.5], [29, 15.5], [35, 15.5], [40, 18.5], [43, 24], [32, 14]];
            frente = bucles.map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5.2" fill="' + pelo + '"/>'; }).join('');
        } else if (p.pelo === 'rapado') {
            frente = '<path d="M20 27c0-8 5.4-12.6 12-12.6S44 19 44 27c-3.6-3-7.6-4.2-12-4.2S23.6 24 20 27z" fill="' + pelo + '" opacity=".85"/>';
        } else if (p.pelo === 'calvo') {
            frente = '<path d="M19.8 31c-.4-2.6.2-4.6 1.4-6 .4 2.2 1 3.8 2 5M44.2 31c.4-2.6-.2-4.6-1.4-6-.4 2.2-1 3.8-2 5" stroke="' + pelo + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>';
        }

        var barba = p.barba ? '<path d="M20.5 33c.6 8.6 5.4 13.6 11.5 13.6S42.9 41.6 43.5 33c-1.6 3-3.4 4.4-5.4 4.6-1.6-1.6-3.6-2.2-6.1-2.2s-4.5.6-6.1 2.2c-2-.2-3.8-1.6-5.4-4.6z" fill="' + pelo + '"/>' : '';
        var lentes = p.lentes ? '<g fill="none" stroke="#1E2A30" stroke-width="1.5"><rect x="22.3" y="28.2" width="8.4" height="6.4" rx="2.6"/><rect x="33.3" y="28.2" width="8.4" height="6.4" rx="2.6"/><path d="M30.7 31h2.6"/></g>' : '';

        return '<svg viewBox="0 0 64 64" role="img" aria-label="' + p.nombre + '"><defs><clipPath id="' + id + '"><circle cx="32" cy="32" r="32"/></clipPath></defs>' +
            '<g clip-path="url(#' + id + ')">' +
            '<rect width="64" height="64" fill="' + p.fondo + '"/>' +
            atras +
            '<path d="M7 66c1.6-12.4 11.4-19.4 25-19.4S55.4 53.6 57 66z" fill="' + p.ropa + '"/>' +
            '<path d="M26.4 47.4 32 53l5.6-5.6" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linejoin="round"/>' +
            '<rect x="27" y="38" width="10" height="10" rx="4" fill="' + piel + '"/><rect x="27" y="38" width="10" height="5" fill="' + sombra + '"/>' +
            '<circle cx="19.6" cy="32" r="3" fill="' + piel + '"/><circle cx="44.4" cy="32" r="3" fill="' + piel + '"/>' +
            '<ellipse cx="32" cy="30.5" rx="12.4" ry="14" fill="' + piel + '"/>' +
            frente + barba +
            '<circle cx="26.5" cy="31.4" r="1.55" fill="#24282B"/><circle cx="37.5" cy="31.4" r="1.55" fill="#24282B"/>' +
            '<path d="M24.4 27.6q2.1-1.2 4.2 0M35.4 27.6q2.1-1.2 4.2 0" stroke="#3A2E28" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".8"/>' +
            '<circle cx="24.2" cy="36" r="2.1" fill="#E58C8C" opacity=".22"/><circle cx="39.8" cy="36" r="2.1" fill="#E58C8C" opacity=".22"/>' +
            '<path d="M28.6 37.4q3.4 2.8 6.8 0" stroke="#6E3B2E" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +
            lentes +
            '</g></svg>';
    }

    function cara(clave, clase) {
        var p = gente[clave];
        return '<span class="cara ' + (clase || '') + '">' + svg(p) + '</span>';
    }

    window.Caras = { svg: svg, gente: gente, html: cara };

    // ── Simulador ──────────────────────────────────────────────────────────
    var CURSOR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 7.2-6.4 1.6L10 18.4z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

    var ESCENAS = {
        oficina: {
            app: 'Asistencias', menu: ['Mi asistencia', 'Vista general', 'Informes'], activo: 1,
            html: function () {
                return '' +
                '<div class="so-bar2"><span class="so-crumb">Vista general · Hoy</span>' +
                    '<button class="so-systray" data-t="systray"><span class="so-dot"></span>' + cara('ana', 'xs') + '</button></div>' +
                '<div class="so-pop" data-t="pop" hidden>' +
                    '<div class="so-pop-head">' + cara('ana', 'md') + '<div><b>Ana Ramírez</b><small data-t="pop-txt">Horas de hoy: 0:00</small></div></div>' +
                    '<button class="so-big in" data-t="checkin">Registrar entrada</button>' +
                '</div>' +
                '<table class="so-table"><thead><tr><th>Empleado</th><th>Entrada</th><th>Salida</th><th>Horas</th></tr></thead><tbody data-t="filas">' +
                    fila('ivan', 'Iván Castro', '08:41', '—', '0:16') +
                    fila('laura', 'Laura Peña', '08:45', '—', '0:12') +
                    fila('luis', 'Luis Hernández', '08:50', '—', '0:07') +
                '</tbody></table>' +
                '<div class="so-toast" data-t="toast" hidden><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Entrada registrada · 08:57</span></div>';
            },
            guion: [
                ['espera', 900],
                ['mover', 'systray'], ['clic', 'systray', function (s) { s.t('pop').hidden = false; }],
                ['espera', 700],
                ['mover', 'checkin'], ['clic', 'checkin', function (s) {
                    var b = s.t('checkin'); b.textContent = 'Registrar salida'; b.classList.remove('in'); b.classList.add('out');
                    s.t('pop-txt').textContent = 'Entrada 08:57 · desde la computadora';
                    s.raiz.querySelector('.so-dot').classList.add('on');
                }],
                ['espera', 600],
                ['hacer', function (s) {
                    s.t('toast').hidden = false;
                    s.t('filas').insertAdjacentHTML('afterbegin', fila('ana', 'Ana Ramírez', '08:57', '—', '0:00', true));
                }],
                ['espera', 900], ['hacer', function (s) { s.t('pop').hidden = true; }],
                ['mover', 'filas'], ['espera', 2600]
            ]
        },
        planta: {
            app: 'Asistencias · Kiosco', menu: [], kiosco: true,
            html: function () {
                var quienes = ['jorge', 'rosa', 'hugo', 'maria', 'diego', 'karla'];
                return '' +
                '<div class="so-kiosk" data-t="k1">' +
                    '<p class="so-k-title">Planta Querétaro · Turno vespertino</p>' +
                    '<p class="so-k-sub">Toca tu foto o pasa tu gafete</p>' +
                    '<div class="so-k-grid">' + quienes.map(function (q) {
                        return '<button class="so-k-emp" data-t="emp-' + q + '">' + cara(q, 'lg') + '<span>' + gente[q].nombre.split(' ')[0] + '</span></button>';
                    }).join('') + '</div>' +
                '</div>' +
                '<div class="so-kiosk" data-t="k2" hidden>' +
                    cara('jorge', 'lg') +
                    '<p class="so-k-title">Hola, Jorge</p><p class="so-k-sub">Escribe tu PIN</p>' +
                    '<div class="so-pin" data-t="pin"><i></i><i></i><i></i><i></i></div>' +
                    '<div class="so-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'OK'].map(function (n) {
                        return n === '' ? '<span></span>' : '<button data-t="n' + n + '"' + (n === 'OK' ? ' class="ok"' : '') + '>' + n + '</button>';
                    }).join('') + '</div>' +
                '</div>' +
                '<div class="so-kiosk so-k-done" data-t="k3" hidden>' +
                    '<div class="so-k-check"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
                    '<p class="so-k-title">¡Entrada registrada!</p><p class="so-k-sub">Jorge López · 13:56 · Turno vespertino</p>' +
                    '<p class="so-k-note">Llevas 38.0 h esta semana · tope 46 h</p>' +
                '</div>';
            },
            guion: [
                ['espera', 900],
                ['mover', 'emp-jorge'], ['clic', 'emp-jorge', function (s) { s.t('k1').hidden = true; s.t('k2').hidden = false; }],
                ['espera', 500],
                ['pin', 'n4'], ['pin', 'n8'], ['pin', 'n2'], ['pin', 'n7'],
                ['mover', 'nOK'], ['clic', 'nOK', function (s) { s.t('k2').hidden = true; s.t('k3').hidden = false; }],
                ['espera', 3200]
            ]
        },
        campo: {
            app: 'Odoo · App móvil', menu: [], movil: true,
            html: function () {
                return '' +
                '<div class="so-phone">' +
                    '<div class="so-ph-top"><span>07:31</span><span>●●● 5G</span></div>' +
                    '<div class="so-ph-head">' + cara('paola', 'sm') + '<div><b>Paola García</b><small>Ruta Bajío</small></div></div>' +
                    '<div class="so-map" data-t="map"><span class="so-pin-map" data-t="pinmap"></span><span class="so-map-tag" data-t="maptag">Buscando ubicación…</span></div>' +
                    '<button class="so-big in" data-t="cin">Registrar entrada</button>' +
                    '<div class="so-ph-done" data-t="pdone" hidden><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Entrada 07:31 · Celaya, Gto.</div>' +
                '</div>';
            },
            guion: [
                ['espera', 1100],
                ['hacer', function (s) { s.t('pinmap').classList.add('on'); s.t('maptag').textContent = 'Ubicación: Celaya, Gto. · ±20 m'; }],
                ['espera', 900],
                ['mover', 'cin'], ['clic', 'cin', function (s) { s.t('cin').hidden = true; s.t('pdone').hidden = false; }],
                ['espera', 3200]
            ]
        },
        sucursales: {
            app: 'Asistencias', menu: ['Vista general', 'Horas extra', 'Informes'], activo: 1,
            html: function () {
                return '' +
                '<div class="so-kpis">' +
                    kpi('Centro', '12 / 12') + kpi('Juriquilla', '9 / 10') + kpi('El Marqués', '7 / 8') +
                '</div>' +
                '<p class="so-h">Horas extra por aprobar</p>' +
                '<div class="so-ot">' +
                    ot('rosa', 'Rosa Martínez', 'Centro · 1.5 h', 'a1') +
                    ot('omar', 'Omar Benítez', 'Juriquilla · 1.0 h', 'a2') +
                    ot('elena', 'Elena Fuentes', 'El Marqués · 0.5 h', 'a3') +
                '</div>' +
                '<div class="so-alert" data-t="alerta" hidden><b>Alerta:</b> Elena está a 1.5 h del tope semanal.</div>';
            },
            guion: [
                ['espera', 900],
                ['mover', 'a1'], ['clic', 'a1', aprobar('a1')],
                ['espera', 500],
                ['mover', 'a2'], ['clic', 'a2', aprobar('a2')],
                ['espera', 700],
                ['hacer', function (s) { s.t('alerta').hidden = false; }],
                ['mover', 'alerta'], ['espera', 3000]
            ]
        }
    };

    function fila(clave, nombre, ent, sal, hrs, nueva) {
        var c = gente[clave] ? cara(clave, 'xs') : '<span class="cara xs ini">' + nombre.split(' ').map(function (w) { return w[0]; }).join('') + '</span>';
        return '<tr' + (nueva ? ' class="nueva"' : '') + '><td><span class="so-emp">' + c + nombre + '</span></td><td>' + ent + '</td><td>' + sal + '</td><td>' + hrs + '</td></tr>';
    }
    function kpi(sede, val) { return '<div class="so-kpi"><small>' + sede + '</small><b>' + val + '</b><span>presentes</span></div>'; }
    function ot(clave, nombre, det, id) {
        return '<div class="so-ot-row">' + cara(clave, 'sm') + '<div><b>' + nombre + '</b><small>' + det + '</small></div><button data-t="' + id + '">Aprobar</button></div>';
    }
    function aprobar(id) {
        return function (s) { var b = s.t(id); b.textContent = 'Aprobada'; b.classList.add('ok'); };
    }

    var sim = null;

    function montar(nodo) {
        nodo.innerHTML =
            '<div class="so-win" aria-hidden="true">' +
                '<div class="so-top"><span class="so-grid"><i></i><i></i><i></i><i></i></span><b class="so-app"></b><nav class="so-menu"></nav><span class="so-co">Appunto Demo</span></div>' +
                '<div class="so-body"></div>' +
                '<span class="so-cursor">' + CURSOR + '<i class="so-ripple"></i></span>' +
            '</div>' +
            '<p class="so-cap">Simulación ilustrativa de Odoo con datos ficticios.</p>';
        sim = {
            raiz: nodo,
            win: nodo.querySelector('.so-win'),
            body: nodo.querySelector('.so-body'),
            cursor: nodo.querySelector('.so-cursor'),
            corrida: 0,
            visible: true,
            t: function (k) { return this.body.querySelector('[data-t="' + k + '"]'); }
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                sim.visible = es[0].isIntersecting;
                if (sim.visible && sim.pausada) { sim.pausada = false; correr(sim.actual); }
            }, { threshold: .25 }).observe(nodo);
        }
    }

    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function dormir(ms, n) {
        return new Promise(function (ok, no) {
            setTimeout(function () { n === sim.corrida ? ok() : no('cancelada'); }, ms);
        });
    }

    function centro(el) {
        var w = sim.win.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 };
    }

    function moverA(el, n) {
        if (!el) return Promise.resolve();
        var c = centro(el);
        sim.cursor.style.transform = 'translate(' + (c.x - 4) + 'px,' + (c.y - 3) + 'px)';
        return dormir(750, n);
    }

    function clic(n) {
        sim.cursor.classList.remove('clic'); void sim.cursor.offsetWidth; sim.cursor.classList.add('clic');
        return dormir(260, n);
    }

    function pintar(clave) {
        var e = ESCENAS[clave];
        sim.win.className = 'so-win' + (e.kiosco ? ' kiosco' : '') + (e.movil ? ' movil' : '');
        sim.raiz.querySelector('.so-app').textContent = e.app;
        sim.raiz.querySelector('.so-menu').innerHTML = (e.menu || []).map(function (m, i) {
            return '<span' + (i === e.activo ? ' class="on"' : '') + '>' + m + '</span>';
        }).join('');
        sim.body.innerHTML = e.html();
        sim.cursor.style.transition = 'none';
        sim.cursor.style.transform = 'translate(' + (sim.win.clientWidth * .72) + 'px,' + (sim.win.clientHeight * .82) + 'px)';
        void sim.cursor.offsetWidth;
        sim.cursor.style.transition = '';
    }

    async function correr(clave) {
        var n = ++sim.corrida;
        sim.actual = clave;
        var e = ESCENAS[clave];
        try {
            while (true) {
                pintar(clave);
                if (reducido) { e.guion.forEach(function (p) { if (p[0] === 'clic' && p[2]) p[2](sim); if (p[0] === 'hacer') p[1](sim); }); return; }
                for (var i = 0; i < e.guion.length; i++) {
                    if (!sim.visible) { sim.pausada = true; return; }
                    var p = e.guion[i];
                    if (p[0] === 'espera') await dormir(p[1], n);
                    else if (p[0] === 'mover') await moverA(sim.t(p[1]), n);
                    else if (p[0] === 'clic') { await clic(n); if (p[2]) p[2](sim); }
                    else if (p[0] === 'hacer') p[1](sim);
                    else if (p[0] === 'pin') {
                        await moverA(sim.t(p[1]), n); await clic(n);
                        var vacio = sim.t('pin').querySelector('i:not(.on)'); if (vacio) vacio.classList.add('on');
                    }
                }
            }
        } catch (err) { /* otra escena tomó el control */ }
    }

    window.SimOdoo = { montar: montar, escena: function (c) { if (sim) correr(c); } };
})();
