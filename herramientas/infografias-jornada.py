# Genera el HTML de las 4 infografias de jornada/infografias/. Uso, desde la raiz del repo:
#   python3 herramientas/infografias-jornada.py
#   node herramientas/infografias-jornada-pdf.js
# El logo blanco recortado (_logo-blanco.png) sale de "logos/White logo - no background.png".

import base64, json

def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()

LOGO_W = b64('herramientas/_logo-blanco.png')
LOGO_C = b64('logos/ColorLogoNoBackgroundHorizontalNoSlogan800px.png')

BOOK = 'https://appunto-mx.odoo.com/book/EU30'
WA = 'https://wa.me/524464066544'

COMUNES = [
    ('La jornada baja dos horas cada año',
     'El tope semanal pasa de 48 a <b>46 horas el 1 de enero de 2027</b> y sigue bajando hasta llegar a <b>40 horas en 2030</b>.',
     'chart'),
    ('El sueldo no se toca',
     'Reducir la jornada no puede implicar bajar sueldos ni prestaciones. Aguinaldo, vacaciones y prima vacacional se quedan igual.',
     'Transitorio séptimo'),
    ('Registrar la jornada ya es obligación',
     'Debes registrar <b>de forma electrónica</b> la hora de inicio y de fin de la jornada de cada persona y entregar ese registro a la autoridad cuando lo pida.',
     'Art. 132, fr. XXXIV, LFT'),
    ('La STPS fijará las reglas finas',
     'Sus disposiciones generales definirán el alcance, las excepciones y el formato del registro, y aplican desde el <b>1 de enero de 2027</b>. Se esperan en diciembre de 2026.',
     'Transitorio quinto'),
    ('Las multas no son menores',
     'No llevar el registro, alterarlo o rebasar la jornada se sanciona con <b>250 a 5,000 UMA</b>: de unos $29 mil a casi $587 mil pesos con la UMA de 2026.',
     'Art. 994, fr. IV Bis, LFT'),
    ('Las horas extra tienen tope semanal',
     'Dentro del tope se pagan <b>al doble</b>; lo que lo rebase, <b>al triple</b>. Las personas menores de 18 años no pueden trabajar horas extra.',
     'ot'),
    ('Bien hecho, el registro te protege',
     'Si el registro está acordado con tu equipo, sirve como prueba plena en una demanda laboral. Conviene que cada persona pueda consultar sus horas.',
     None),
]

TAMANOS = {
    'micro': {
        'nombre': 'Micro', 'rango': '1 a 10 personas', 'ej': 8,
        'archivo': 'Infografia-Reforma40h-Micro.pdf',
        'extra': [
            ('Ser chico no te exenta',
             'La obligación es para todo patrón. La STPS podría definir etapas o excepciones, pero mientras no las publique, lo prudente es prepararte.'),
            ('No necesitas un reloj checador',
             'La ley pide un registro electrónico, no un aparato. Un celular o una computadora pueden registrar entradas y salidas con hora y ubicación.'),
            ('Empieza por lo mínimo',
             'Con dos piezas cumples lo esencial: el expediente de cada persona con su horario y el registro de asistencias. Lo demás se suma después.'),
        ],
    },
    'pequena': {
        'nombre': 'Pequeña', 'rango': '11 a 50 personas', 'ej': 30,
        'archivo': 'Infografia-Reforma40h-Pequena.pdf',
        'extra': [
            ('Los turnos se van a mover',
             'Con menos horas por persona, hay que rehacer turnos y suplencias. Planearlos en un sistema evita huecos y horas extra de emergencia.'),
            ('Define quién autoriza horas extra',
             'Que ninguna hora extra se apruebe de palabra: una regla clara y la aprobación del responsable de área te evitan pagar triples sin darte cuenta.'),
            ('Conecta asistencia y nómina',
             'Si las horas pasan directo a tu nómina, dejas de recapturar cada quincena y reduces errores, aunque ya tengas tu propio programa de nómina.'),
        ],
    },
    'mediana': {
        'nombre': 'Mediana', 'rango': '51 a 250 personas', 'ej': 150,
        'archivo': 'Infografia-Reforma40h-Mediana.pdf',
        'extra': [
            ('Un solo registro para todas las áreas',
             'Planta, oficina y campo checan distinto: kiosco, computadora o app. Lo importante es que todo llegue a un mismo registro central.'),
            ('Tus jefes de área son clave',
             'Ellos aprueban horas extra y corrigen olvidos. Dales un flujo de aprobación y alertas de quién se acerca al tope antes de rebasarlo.'),
            ('Mide antes de que llegue la inspección',
             'Reportes por área y por persona te dicen dónde se concentran las horas extra y qué turnos hay que ajustar para 2028 y 2029.'),
        ],
    },
    'grande': {
        'nombre': 'Grande', 'rango': 'más de 250 personas', 'ej': 500,
        'archivo': 'Infografia-Reforma40h-Grande.pdf',
        'extra': [
            ('La escala multiplica cada hora',
             'Con cientos de personas, una regla mal configurada se repite en cada quincena. Conviene probar las reglas de jornada y horas extra antes de enero.'),
            ('Integra, no dupliques',
             'Conecta el registro con tu nómina y tus sistemas actuales para que horas, pagos e historial coincidan en todos lados, sin capturas paralelas.'),
            ('Cuida quién corrige qué',
             'Define permisos para corregir registros y guarda la bitácora de cada cambio. Un registro que cualquiera edita pierde valor como prueba.'),
        ],
    },
}

YEARS = [(2026, 48, 9), (2027, 46, 9), (2028, 44, 10), (2029, 42, 11), (2030, 40, 12)]


def chart():
    bars = []
    for y, h, _ in YEARS:
        hi = 18 + (h - 40) / 8 * 82
        cls = 'now' if y == 2027 else ''
        bars.append(f'<div class="b {cls}"><span class="v">{h} h</span><i style="height:{hi:.0f}%"></i><span class="y">{y}</span></div>')
    return '<div class="chart">' + ''.join(bars) + '</div>'


def ot():
    cells = ''.join(f'<td>{y}</td>' for y, _, _ in YEARS)
    vals = ''.join(f'<td><b>{o} h</b></td>' for _, _, o in YEARS)
    return f'<table class="ot"><tr><th>Año</th>{cells}</tr><tr><th>Tope semanal</th>{vals}</tr></table><p class="src">Transitorio cuarto · Arts. 66 y 68, LFT</p>'


def impacto(n):
    h27 = n * 2
    h30 = n * 8
    jor = h30 // 40
    return f'''<div class="impact">
        <p class="k">Tu empresa en números · ejemplo con {n} personas</p>
        <div class="nums">
          <div><b>{h27:,} h</b><span>menos por semana en 2027</span></div>
          <div><b>{h30:,} h</b><span>menos por semana en 2030</span></div>
          <div><b>{jor:,}</b><span>{'jornada completa' if jor == 1 else 'jornadas completas'} de 40 h que tendrás que reorganizar</span></div>
        </div>
        <p class="note">Si hoy tu equipo trabaja 48 horas a la semana. Es una estimación para dimensionar, no un cálculo de tu plantilla.</p>
      </div>'''


CSS = '''
@page { size: Letter; margin: 0; }
:root{--teal:#296E8F;--teal-d:#1d5470;--purple:#8A1D82;--ink:#1f2a37;--muted:#5b6673;--line:#dfe5ea;--soft:#f4f8fa;--deep:#0B2431}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:8.5in;height:11in;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column}
.page:last-child{page-break-after:auto}
.head{background:var(--deep);color:#fff;padding:30px 44px 26px;position:relative;overflow:hidden}
.head::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 90% at 100% 0%,rgba(41,110,143,.75),transparent 70%),radial-gradient(40% 70% at 0% 100%,rgba(138,29,130,.35),transparent 70%)}
.head > *{position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.top img{height:60px}
.badge{display:inline-flex;flex-direction:column;align-items:flex-end;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22)}
.badge small{font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.badge b{font-size:13pt;font-weight:800}
.badge span{font-size:8pt;color:rgba(255,255,255,.8)}
.kick{margin-top:20px;font-size:8pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#E9A7E4}
h1{font-size:27pt;line-height:1.08;font-weight:800;letter-spacing:-.02em;margin-top:6px;max-width:15em}
h1 em{font-style:normal;color:#8FD0E8}
.sub{margin-top:10px;font-size:10pt;color:rgba(255,255,255,.8);max-width:46em}
.body{padding:22px 44px 0;flex:1}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{position:relative;padding:14px 16px 13px 54px;border-radius:14px;background:var(--soft);break-inside:avoid}
.card.wide{grid-column:span 2}
.n{position:absolute;left:14px;top:13px;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:var(--teal);color:#fff;font-weight:800;font-size:10.5pt}
.card.sz{background:#fff;border:1.5px solid rgba(138,29,130,.35)}
.card.sz .n{background:var(--purple)}
.card h3{font-size:11pt;line-height:1.25;color:var(--teal-d);font-weight:700;margin-bottom:4px}
.card.sz h3{color:var(--purple)}
.card p{color:#33404d}
.card b{color:var(--teal-d)}
.src{margin-top:6px;font-size:7.3pt;color:var(--muted);letter-spacing:.02em}
.chart{display:flex;align-items:flex-end;gap:10px;height:96px;margin-top:10px}
.chart .b{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px}
.chart i{display:block;width:100%;border-radius:7px 7px 3px 3px;background:#c9dce5}
.chart .now i{background:linear-gradient(180deg,var(--purple),#5c1357)}
.chart .v{font-size:8.5pt;font-weight:700;color:var(--teal-d)}
.chart .now .v{color:var(--purple)}
.chart .y{font-size:7.5pt;color:var(--muted)}
.chart-wrap{display:grid;grid-template-columns:1fr 1.15fr;gap:18px;align-items:end}
table.ot{width:100%;border-collapse:separate;border-spacing:0;margin-top:8px;font-size:8.5pt;border-radius:9px;overflow:hidden}
table.ot th{background:var(--teal);color:#fff;font-weight:600;text-align:left;padding:5px 8px;white-space:nowrap}
table.ot td{background:#fff;padding:5px 8px;text-align:center;border-bottom:1px solid var(--line)}
table.ot tr:first-child td{background:#e6eff3;font-weight:600;color:var(--teal-d)}
.sec{display:flex;align-items:center;gap:10px;margin:18px 0 10px;font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--purple)}
.sec::after{content:"";flex:1;height:1.5px;background:linear-gradient(90deg,rgba(138,29,130,.4),transparent)}
.impact{margin-top:14px;padding:16px 18px;border-radius:14px;background:linear-gradient(135deg,#eaf2f6,#f6eef5)}
.impact .k{font-size:8pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--teal)}
.nums{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}
.nums b{display:block;font-size:20pt;font-weight:800;letter-spacing:-.02em;color:var(--teal-d);line-height:1.1}
.nums div:last-child b{color:var(--purple)}
.nums span{font-size:8.5pt;color:#33404d}
.note{margin-top:8px;font-size:7.5pt;color:var(--muted)}
.cta{margin:16px 44px 0;padding:18px 22px;border-radius:16px;background:var(--deep);color:#fff;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;position:relative;overflow:hidden}
.cta::before{content:"";position:absolute;inset:0;background:radial-gradient(50% 120% at 100% 50%,rgba(41,110,143,.7),transparent 70%)}
.cta > *{position:relative}
.cta h4{font-size:13pt;font-weight:800;line-height:1.2}
.cta p{margin-top:4px;font-size:9pt;color:rgba(255,255,255,.8)}
.cta .btns{display:grid;gap:6px;text-align:center}
.cta a{display:block;padding:8px 16px;border-radius:999px;background:#fff;color:var(--deep);font-weight:700;font-size:9pt;text-decoration:none}
.cta a.alt{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4)}
.foot{margin-top:auto;padding:12px 44px 16px;display:flex;justify-content:space-between;align-items:center;font-size:7.3pt;color:var(--muted);border-top:1px solid var(--line)}
.foot img{height:16px}
.todo{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:7px 18px}
.todo li{display:flex;gap:9px;align-items:flex-start;font-size:9pt;color:#33404d}
.todo i{flex:none;width:13px;height:13px;margin-top:2px;border-radius:4px;border:1.6px solid var(--teal)}
.legal{padding:12px 44px 0;font-size:7.2pt;color:var(--muted);line-height:1.45}
.mini{padding:22px 44px 0;display:flex;justify-content:space-between;align-items:center}
.mini img{height:26px}
.mini span{font-size:8pt;color:var(--muted)}
'''


LISTA = '''<p class="sec">Tu lista antes del 1 de enero de 2027</p><ul class="todo">''' + ''.join(f'<li><i></i>{x}</li>' for x in [
    'Haz la lista de quién trabaja, en qué horario y en qué turno.',
    'Elige cómo va a checar cada grupo: kiosco, computadora o celular.',
    'Define quién aprueba las horas extra y con qué regla.',
    'Acuerda el registro con tu equipo y dales acceso a sus horas.',
    'Ajusta tus turnos a 46 h para 2027 y planea los de 2028.',
    'Prueba el registro en diciembre y arranca el 1 de enero.',
]) + '</ul>'


def card(i, t, p, extra, sz=False, wide=False):
    cls = 'card' + (' sz' if sz else '') + (' wide' if wide else '')
    inner = f'<span class="n">{i}</span><h3>{t}</h3><p>{p}</p>'
    if extra == 'chart':
        inner = f'<span class="n">{i}</span><div class="chart-wrap"><div><h3>{t}</h3><p>{p}</p><p class="src">Art. 123 constitucional y transitorio segundo de la reforma a la LFT</p></div>{chart()}</div>'
    elif extra == 'ot':
        inner += ot()
    elif extra:
        inner += f'<p class="src">{extra}</p>'
    return f'<div class="{cls}">{inner}</div>'


def build(clave):
    t = TAMANOS[clave]
    c = COMUNES
    p1 = ''.join([
        card(1, *c[0], wide=True),
        card(2, *c[1]), card(3, *c[2]),
        card(4, *c[3]), card(5, *c[4]),
        card(6, *c[5], wide=True),
    ])
    p2 = card(7, *c[6], wide=True)
    sz = ''.join(card(8 + k, x[0], x[1], None, sz=True, wide=(k == 0)) for k, x in enumerate(t['extra']))
    foot = lambda n: f'<div class="foot"><span><b style="color:#296E8F">APPUNTO</b> · Consultoría de negocio y tecnología · appunto.mx</span><span>{n}/2</span></div>'
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>10 cosas que debes saber de la reforma de 40 horas · {t['nombre']}</title><style>{CSS}</style></head><body>
<section class="page">
  <header class="head">
    <div class="top"><img src="data:image/png;base64,{LOGO_W}" alt="Appunto"><div class="badge"><small>Edición para empresa</small><b>{t['nombre']}</b><span>{t['rango']}</span></div></div>
    <p class="kick">Infografía · Reforma laboral 2026</p>
    <h1>10 cosas que debes saber de la reforma de <em>40 horas</em></h1>
    <p class="sub">La jornada baja por etapas y el registro electrónico de entradas y salidas se vuelve tu evidencia. Esto es lo esencial, con lo que más le pega a una empresa de {t['rango']}.</p>
  </header>
  <div class="body"><div class="grid">{p1}</div></div>
  {foot(1)}
</section>
<section class="page">
  <div class="mini"><img src="data:image/png;base64,{LOGO_C}" alt="Appunto"><span>10 cosas que debes saber de la reforma de 40 horas · {t['nombre']}</span></div>
  <div class="body" style="padding-top:14px">
    <div class="grid">{p2}</div>
    <p class="sec">Lo que más le pega a una empresa de {t['rango']}</p>
    <div class="grid">{sz}</div>
    {impacto(t['ej'])}
    {LISTA}
  </div>
  <div class="cta"><div><h4>¿Listo para el 1 de enero de 2027?</h4><p>Implementamos el registro electrónico de jornada en Odoo, a la medida de cómo trabaja tu equipo. La primera llamada es sin costo.</p></div>
  <div class="btns"><a href="{BOOK}">Agenda una llamada</a><a class="alt" href="{WA}">WhatsApp 446 406 6544</a></div></div>
  <p class="legal">Fuentes: Decreto de reforma al artículo 123 constitucional (DOF, 3 de marzo de 2026) y Decreto de reforma a la Ley Federal del Trabajo en materia de jornada (DOF, 1 de mayo de 2026). Valor de la UMA 2026 publicado por el INEGI. Información general actualizada a noviembre de 2026; no sustituye asesoría legal. Las disposiciones generales de la STPS pueden precisar o cambiar el alcance del registro. Odoo es una marca de Odoo S.A.</p>
  {foot(2)}
</section>
</body></html>'''


for k, t in TAMANOS.items():
    open(f'herramientas/_infografia-{k}.html', 'w', encoding='utf-8').write(build(k))
print(json.dumps({k: v['archivo'] for k, v in TAMANOS.items()}))
