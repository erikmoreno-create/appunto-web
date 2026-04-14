# Instrucciones para Claude Code
## Optimización de home — Appunto website

---

## CONTEXTO

Estás trabajando sobre el archivo `contenido-web.md` de Appunto, que contiene el
contenido textual de las 5 páginas del sitio web. Tu tarea es **modificar únicamente
las 6 secciones de la PÁGINA 1 — INICIO**, sin tocar ninguna otra página del archivo.

El objetivo es optimizar el contenido existente para mejorar la conversión hacia
una acción principal: **agendar una sesión de diagnóstico**.

---

## RESTRICCIONES ESTRICTAS

- Modifica **solo** el bloque `# PÁGINA 1 — INICIO` del archivo.
- **No** agregues nuevas secciones dentro de la home.
- **No** elimines ninguna de las 6 secciones existentes.
- **No** toques ninguna otra página del archivo (Soluciones, Industrias, Nosotros, Contacto).
- **No** alargues la home con más bloques de contenido.
- **No** cambies los nombres de las secciones como encabezados Markdown.
- **No** cambies la estructura de metadatos del archivo (notas de uso, colores, tipografía).
- Reemplaza el copy de cada sección con el copy optimizado que se especifica abajo.
- Mantén el sistema de etiquetas existente: `**Headline:**`, `**Cuerpo:**`,
  `` **`[CTA principal]`** ``, etc.

---

## LAS 6 SECCIONES A MODIFICAR

Las secciones a reescribir son exactamente estas, en este orden, dentro de
`# PÁGINA 1 — INICIO`:

1. `## Hero`
2. `## Sección: El problema que resolvemos`
3. `## Sección: Qué hace Appunto`
4. `## Sección: Para quién es Appunto`
5. `## Sección: Nuestras soluciones`
6. El bloque compuesto por `## Sección: Por qué Appunto` +
   `## Sección: Prueba de confianza / Social proof` +
   `## Sección: CTA final de página`
   *(estos tres bloques forman la sección de cierre; optimízalos en conjunto
   pero mantenlos como secciones separadas)*

---

## COPY OPTIMIZADO POR SECCIÓN

Reemplaza el contenido de cada sección con exactamente lo siguiente:

---

### SECCIÓN 1 — Hero

```markdown
## Hero

**Eyebrow (texto pequeño sobre el headline):**
Consultoría de negocio y tecnología · Querétaro, México

**Headline:**
Tu operación tiene solución. Empieza por entenderla bien.

**Subheadline:**
Ayudamos a empresas con procesos desconectados, información dispersa o
fricción operativa a ordenar su operación y tomar mejores decisiones,
usando tecnología con sentido de negocio.

**`[CTA principal]`** Agenda un diagnóstico sin costo
**`[CTA secundario]`** Ver nuestras soluciones
```

---

### SECCIÓN 2 — El problema que resolvemos

```markdown
## Sección: El problema que resolvemos

**Título de sección:**
Hay un punto en que operar como siempre deja de funcionar.

**Cuerpo:**
El negocio creció. Pero los procesos, las herramientas y la forma de
decidir no evolucionaron al mismo ritmo. Y ahora hay más volumen,
más fricción y menos visibilidad.

**Cuatro señales de que es momento de actuar:**

- Cada área tiene su versión de los números y nunca coinciden.
- La operación depende de personas que saben demasiado y no está documentada.
- El retrabajo, la doble captura y las conciliaciones consumen tiempo que
  debería ir al negocio.
- Las decisiones importantes se toman con información incompleta o tardía.

**Nota de tono bajo los bullets:**
No es falta de esfuerzo. Es falta de estructura. Eso sí se puede resolver.
```

---

### SECCIÓN 3 — Qué hace Appunto

```markdown
## Sección: Qué hace Appunto

**Título de sección:**
No partimos de la herramienta. Partimos del negocio.

**Cuerpo:**
Antes de recomendar cualquier solución, entendemos cómo opera tu empresa,
dónde están las fricciones y qué tiene sentido resolver primero.
La tecnología es el medio. La claridad operativa es el objetivo.

**Tres columnas / íconos:**

**Entendemos primero**
La herramienta correcta depende del problema correcto. Empezamos con
preguntas, no con demos.

**Implementamos con criterio**
Configuramos, migramos, capacitamos y acompañamos. No entregamos sistemas
instalados y nos vamos.

**Acompañamos en serio**
Tenemos project managers dedicados. Nos quedamos hasta que el equipo
adopta la solución y genera valor real.
```

---

### SECCIÓN 4 — Para quién es Appunto

```markdown
## Sección: Para quién es Appunto

**Título de sección:**
¿Cuál de estas situaciones describe la tuya?

**Subtítulo:**
(sin subtítulo — eliminar el subtítulo existente)

**Cuatro tarjetas de buyer persona:**

**Dueño o director de PyME**
"La empresa creció pero ya no tengo control de lo que pasa."
Tienes más volumen, más personas y más fricción, pero menos visibilidad.
Necesitas una operación que no dependa de ti para funcionar.

**Director General de empresa mediana**
"Tengo datos por todos lados y ninguna lectura clara del negocio."
Cada área reporta diferente. Necesitas una sola versión de la verdad
para dirigir con más certeza y menos intuición.

**Director Comercial**
"Se nos van oportunidades porque no hay seguimiento real."
El equipo vende, pero sin trazabilidad del pipeline el forecast no
es confiable y los cierres se pierden.

**Director de Administración y Finanzas**
"El cierre de mes es un maratón de correcciones y retrabajo."
Doble captura, conciliaciones manuales y errores que llegan a cobranza.
Necesitas procesos conectados y menos dependencia del criterio de cada quien.

**`[CTA]`** Agenda un diagnóstico para tu caso
```

---

### SECCIÓN 5 — Nuestras soluciones

```markdown
## Sección: Nuestras soluciones

**Título de sección:**
Dos soluciones. Un mismo punto de partida: tu negocio.

**Subtítulo:**
(sin subtítulo — eliminar el subtítulo existente)

**Dos tarjetas principales:**

**Odoo · Integración operativa y ERP**
Para empresas que ya no pueden seguir con Excel y herramientas desconectadas.
Ordenamos tu operación, conectamos áreas y reducimos el retrabajo con una
implementación adaptada a tu realidad, no a un modelo genérico.
`[CTA]` Ver solución Odoo →

**Qlik · Analítica e inteligencia de negocio**
Para empresas con muchos datos y poca visibilidad real.
Integramos fuentes, construimos dashboards accionables y te damos
una sola versión de la verdad para tomar decisiones con más velocidad
y confianza.
`[CTA]` Ver solución Qlik →

*(Eliminar el CTA general "Ver todas nuestras soluciones" — los CTAs
de cada tarjeta son suficientes)*
```

---

### SECCIÓN 6 — Cierre (Por qué Appunto + Social proof + CTA final)

```markdown
## Sección: Por qué Appunto

**Título de sección:**
Lo que nos diferencia no es el catálogo. Es cómo resolvemos.

**Tres bloques (condensar de cinco a tres — eliminar los dos restantes):**

**Negocio antes que herramienta**
No llegamos con una propuesta lista antes de entender el problema.
La conversación siempre empieza con la operación.

**Implementación real, no instalación**
Configuramos, acompañamos y nos quedamos hasta que el equipo usa la
solución y genera valor. No desaparecemos después del go-live.

**Alcance claro, sin sorpresas**
Definimos el alcance antes de empezar y lo respetamos.
Si algo no va a funcionar para tu empresa, te lo decimos antes, no después.

---

## Sección: Prueba de confianza / Social proof

**Título de sección:**
Empresas que operan con más claridad.

*(Espacio reservado para logos de clientes y testimoniales reales.)*

**Placeholder para testimonial:**
> "Antes de Appunto tomábamos decisiones con información que llegaba tarde
> y nunca cuadraba entre áreas. Hoy tenemos visibilidad real y el cierre
> de mes dejó de ser un problema."
> — Director General, empresa mediana, sector distribución.

---

## Sección: CTA final de página

**Título:**
¿Tiene sentido conversar?

**Cuerpo:**
Una sesión de diagnóstico de 30 minutos, sin costo y sin compromiso.
Te escuchamos, identificamos las fricciones más costosas de tu operación
y te decimos con claridad si podemos ayudarte, y cómo.

**`[CTA principal]`** Agenda tu diagnóstico
**`[CTA secundario]`** Escríbenos por WhatsApp

**Microcopy bajo el CTA:**
Respondemos en menos de 24 horas. Sin venta, sin presión.
```

---

## ELEMENTOS ADICIONALES A ACTUALIZAR

Dentro de `## ELEMENTOS GLOBALES DEL SITIO`, en el bloque `### Meta copy (SEO sugerido)`,
actualiza únicamente la entrada de **Página de inicio** con lo siguiente:

```markdown
**Página de inicio:**
- *Title tag:* Appunto | Consultoría de negocio y tecnología · Querétaro
- *Meta description:* Ayudamos a empresas con procesos desconectados o
  información dispersa a ordenar su operación y tomar mejores decisiones.
  Odoo y Qlik implementados con criterio de negocio.
```

---

## VERIFICACIÓN ANTES DE GUARDAR

Antes de guardar los cambios, confirma que:

- [ ] Solo se modificó el bloque `# PÁGINA 1 — INICIO` y el meta de inicio.
- [ ] Las páginas 2, 3, 4 y 5 están intactas.
- [ ] Las 6 secciones de la home siguen presentes (no se eliminó ninguna).
- [ ] No se agregaron secciones nuevas dentro de la home.
- [ ] Los separadores `---` entre secciones se conservan.
- [ ] El bloque de metadatos del inicio del archivo no fue modificado.
- [ ] El sistema de etiquetas Markdown es consistente con el resto del archivo.

---

*Prompt generado para uso con Claude Code · Proyecto: Appunto website · v1.1*
