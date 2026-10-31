# Kit de prompts: haz tu propia "Últimas veces"

Estos prompts los escribí **después** de terminar el proyecto, con todo lo que aprendí en el camino. No son los mensajes exactos que usé (esos están resumidos en el [README](README.md#los-prompts)). Son una versión más completa y ordenada para que cualquier persona pueda construir una página como esta, o una propia, con una IA como Claude, ChatGPT o Gemini, y llegar más rápido a un buen resultado.

## Cómo usarlos

1. **Usa uno por fase y en orden.** Cada uno se apoya en el anterior. No los pegues todos juntos: la IA hace mejor una cosa a la vez y tú puedes revisar entre fases.
2. **Cambia lo que está entre [corchetes]** por tus propias decisiones.
3. **Revisa antes de seguir.** Abre la página, pruébala en la computadora y en el celular, y pide ajustes hasta que te convenza. Luego pasa al siguiente prompt.
4. **Cuida los tokens.** Si la conversación se hace muy larga o se acaban tus créditos, usa el [prompt para continuar en otra conversación](#prompt-para-continuar-en-una-conversación-nueva).

Cada prompt sigue la estructura **Rol, Tarea, Contexto y Restricciones**, y agrega dos partes que ayudan mucho: **Entrega** (qué quieres recibir) y **Criterios de aceptación** (cómo sabrás que quedó bien).

### Lo que puedes personalizar

| Variable | En mi proyecto | Ideas para el tuyo |
|---|---|---|
| [AÑOS] | 80 años (4,160 semanas) | 90 años, o la esperanza de vida de tu país |
| [ESTÉTICA] | Retro 8-bit hogareña, con una casita y un personaje pixel art | Acuarela, cuaderno escolar, minimalista, espacio |
| [COLOR PRINCIPAL] | Naranja | El que te haga sentir en casa |
| [PÚBLICO] | Cualquier persona adulta que quiera reflexionar sobre su tiempo | Estudiantes, papás y mamás, un equipo de trabajo |
| [TONO] | Cálido y nostálgico, nunca triste | Divertido, motivador, poético |
| [IDIOMA] | Español de México | Tu idioma y tu región |

---

## Prompt 0. La base del proyecto

> **Rol:** Actúa como desarrolladora web front-end senior, experta en HTML, CSS y JavaScript sin librerías, con sensibilidad para el diseño, la accesibilidad (WCAG 2.1 AA) y la escritura emotiva en [IDIOMA].
>
> **Tarea:** Crea la base de una página web interactiva llamada "[NOMBRE DE LA PÁGINA]" que muestre una vida de [AÑOS] años como una cuadrícula de semanas (una fila por año, 52 cuadritos por fila). La persona escribe su nombre y su fecha de nacimiento, y las semanas que ya vivió se iluminan. En esta fase solo quiero la estructura, la bienvenida y la cuadrícula; lo demás lo agregaremos después.
>
> **Contexto:** Es mi proyecto final de un curso de vibecoding. Es para [PÚBLICO] y debe sentirse [TONO]. La idea completa, que construiremos por fases, es: 1) ver la vida en semanas, 2) descubrir las "últimas veces" que pasaron sin aviso (la última vez que te cargaron dormida del carro a tu cama, por ejemplo), 3) marcar las propias y 4) sembrar "primeras veces" en las semanas que quedan, para terminar con una carta personal.
>
> **Restricciones:**
> - Solo HTML, CSS y JavaScript, sin frameworks ni herramientas de compilación, para publicarla gratis en GitHub Pages.
> - Archivos separados: `index.html`, `css/styles.css` y un archivo de JavaScript por responsabilidad (datos, cálculos, cuadrícula y flujo principal).
> - Los colores se definen como variables de CSS al inicio, para cambiarlos fácilmente.
> - Ningún dato sale del navegador: no uses servidores, analíticas ni servicios externos. Todo lo que escriba la persona se inserta con `textContent`, nunca como HTML.
> - Diseño adaptable: debe verse bien en un celular de 360 px de ancho y en una computadora.
> - Calcula la fecha de nacimiento en hora local, para evitar errores de un día.
> - Código comentado en [IDIOMA], explicando el porqué y no solo el qué.
>
> **Entrega:** La estructura de carpetas, el código completo de cada archivo y una explicación breve de cómo se conectan las partes.
>
> **Criterios de aceptación:** Al escribir una fecha válida se ilumina el número correcto de semanas y la semana actual se distingue. Una fecha futura o incompleta muestra un mensaje claro junto al campo. La cuadrícula se puede recorrer con las flechas del teclado.

---

## Prompt 1. Estilo y personaje

> **Rol:** Actúa como directora de arte y desarrolladora de pixel art para web.
>
> **Tarea:** Dale a la página una identidad visual [ESTÉTICA] y crea un personaje pixel art que la persona pueda personalizar (tono de piel, peinado, color de cabello, ropa y lentes), dibujado en `<canvas>`. Agrega una escena pequeña de bienvenida donde aparezca el personaje.
>
> **Contexto:** El personaje acompañará a la persona en toda la experiencia, así que tiene que sentirse suyo. El color principal es [COLOR PRINCIPAL].
>
> **Restricciones:**
> - Antes de programar, propón 3 paletas de colores con sus valores hexadecimales y una frase sobre lo que transmite cada una. Espera a que yo elija.
> - Todos los textos deben cumplir el contraste mínimo de 4.5 a 1.
> - Las opciones del personaje deben ser incluyentes: las mismas para todas las personas, sin depender del género.
> - Agrega un botón de "Personaje sorpresa" y otro para saltar este paso.
> - Usa fuentes alojadas dentro del proyecto, una pixelada para los títulos y otra fácil de leer para los textos largos.
> - Las imágenes en pixel art deben verse nítidas, sin difuminarse.
>
> **Entrega:** Las 3 paletas para elegir y, después de mi elección, el código actualizado.
>
> **Criterios de aceptación:** Cada opción cambia el personaje al instante. El diseño se ve igual de bien en el celular. Ningún texto queda con bajo contraste.

---

## Prompt 2. Modo nocturno

> **Rol:** Actúa como diseñadora de interfaces especializada en temas de color y accesibilidad.
>
> **Tarea:** Crea un modo nocturno para la página.
>
> **Contexto:** El modo nocturno debe conservar la nostalgia del diseño de día, no ser solo "fondo negro".
>
> **Restricciones:**
> - Propón 3 conceptos de modo nocturno con nombre, paleta y una frase de su ambiente. Espera a que yo elija.
> - Se activa automáticamente si el dispositivo está en modo oscuro o si es de noche ([HORA DE INICIO] a [HORA DE FIN]).
> - Incluye un botón accesible para cambiar de modo a mano. La elección se recuerda en el navegador y hay una forma de volver a "Automático".
> - Aplica el modo antes de pintar la página, para que no haya un destello del otro modo.
> - La escena del personaje y cualquier imagen que se descargue también cambian de modo.
>
> **Entrega:** Los 3 conceptos y, después, el código con los cambios marcados.
>
> **Criterios de aceptación:** Ningún texto baja de 4.5 a 1 de contraste en ningún modo. Al recargar se respeta la elección. No hay destello al cargar.

---

## Prompt 3. Textos e historia

> **Rol:** Actúa como escritora de experiencias interactivas y guionista, con un estilo [TONO] y cercano, en [IDIOMA].
>
> **Tarea:** Escribe y programa la historia de la página en tres actos: 1) "últimas veces" de la infancia, 2) "últimas veces" de la juventud y 3) "primeras veces" que la persona quiere vivir. Agrega una pausa breve antes del tercer acto y una carta final personalizada.
>
> **Contexto:** El objetivo no es poner triste a nadie, sino que la persona preste más atención a las semanas que vienen. Cada "última vez" se ilumina en la semana de la cuadrícula en la que normalmente ocurre.
>
> **Restricciones:**
> - Escribe al menos [NÚMERO] "últimas veces" universales y concretas, con una edad típica, una categoría (familia, escuela, infancia…) y un texto corto para cada una.
> - El texto se adapta a cómo quiere la persona que le hable (mujer, hombre o neutro) solo en la gramática.
> - Expresa el tiempo que queda en números humanos (fines de semana, Navidades, meses), no solo en semanas.
> - La persona puede escribir hasta 3 "primeras veces", que aparecen como semillas en semanas futuras.
> - La carta usa sus propias palabras, cierra con una acción concreta para esta semana y termina con una frase memorable.
> - Contempla los casos límite: nació hace pocos días, tiene más de [AÑOS] años o nació un 29 de febrero.
> - Pon todo el contenido en un archivo de datos, separado de la lógica, para poder editarlo sin tocar el código.
>
> **Entrega:** Los textos completos para que yo los revise y, después, el código.
>
> **Criterios de aceptación:** Ninguna frase sale con errores gramaticales en ninguna de las tres formas de hablar. Los casos límite muestran un texto natural, nunca "0 semanas" ni "1 semanas".

---

## Prompt 4. Sonido

> **Rol:** Actúa como diseñadora de sonido para videojuegos retro y experta en la Web Audio API.
>
> **Tarea:** Agrega efectos de sonido estilo 8-bit y una música de fondo opcional, generados en el navegador sin archivos de audio.
>
> **Contexto:** El sonido debe acompañar sin estorbar; la experiencia es íntima.
>
> **Restricciones:**
> - Todo empieza apagado. Nada suena hasta que la persona lo active con un botón accesible.
> - Efectos cortos para avanzar, elegir, iluminar un recuerdo y descargar; un sonido suave y nunca alarmante para los errores.
> - La música es lenta, se repite sin cortes y baja de volumen en la pausa.
> - Si la pestaña se oculta, el audio se pausa.
> - En `sound.js`, deja la melodía y los efectos en listas fáciles de editar.
>
> **Entrega:** El código y una tabla de qué sonido corresponde a cada acción.
>
> **Criterios de aceptación:** Nada suena con el sonido apagado. No hay errores en la consola en Chrome, Safari ni Firefox.

---

## Prompt 5. Animaciones

> **Rol:** Actúa como animadora de pixel art y desarrolladora front-end.
>
> **Tarea:** Dale vida al personaje: que respire, parpadee y salude en la bienvenida y en la carta, y que camine por la cuadrícula hasta la semana de cada recuerdo, cambiando de edad (niña o niño, joven, adulto) según el momento.
>
> **Contexto:** La idea es que se sienta como el mapa de un videojuego.
>
> **Restricciones:**
> - Camina en "L" (primero los años y luego las semanas), mirando hacia donde va.
> - El personaje nunca tapa la semana iluminada.
> - Si se cambia el tamaño de la ventana o se gira el celular, se reacomoda en su lugar.
> - Respeta la preferencia de "reducir movimiento": en ese caso aparece directo, sin animación.
> - Las animaciones se detienen cuando no se ven, para ahorrar batería.
>
> **Entrega:** El código y una explicación breve de cómo se calcula el camino.
>
> **Criterios de aceptación:** La animación es fluida en el celular. Con "reducir movimiento" activado, nada se mueve.

---

## Prompt 6. Usabilidad

> **Rol:** Actúa como especialista en experiencia de usuario (UX) y pruebas de usabilidad.
>
> **Tarea:** Revisa toda la experiencia como si fueras alguien que la usa por primera vez en su celular, haz una lista de los puntos donde podría confundirse o atorarse y corrígelos.
>
> **Contexto:** Quiero que cualquier persona, de cualquier edad, pueda terminarla sin ayuda.
>
> **Restricciones:**
> - Fecha de nacimiento con selectores de día, mes y año en [IDIOMA]; los días se ajustan al mes elegido.
> - Botón de "Atrás" en cada paso, sin perder lo que ya se respondió.
> - Una barra de avance que diga en qué paso va ("Paso 3 de 6").
> - Las preguntas largas se dividen en tarjetas, una a la vez.
> - El avance se guarda solo en el navegador (`localStorage`), caduca después de [DÍAS] días y "Empezar de nuevo" lo borra. Si el navegador no permite guardar, la página funciona igual.
> - Todo se puede hacer solo con teclado, con foco visible, y los errores se anuncian a los lectores de pantalla.
>
> **Entrega:** Primero la lista de problemas ordenada por importancia; después, el código corregido.
>
> **Criterios de aceptación:** Al recargar a la mitad, se retoma donde iba. El recorrido completo se puede hacer solo con teclado.

---

## Prompt 7. Compartir

> **Rol:** Actúa como desarrolladora front-end con enfoque en privacidad.
>
> **Tarea:** Al final de la experiencia, agrega una forma de invitar a otra persona a hacer su propia cuadrícula y un botón para descargar la cuadrícula como imagen.
>
> **Contexto:** Las respuestas son muy personales; nadie debe recibirlas por accidente.
>
> **Restricciones:**
> - El enlace para compartir no lleva nombre, fecha ni recuerdos; solo una marca de invitación (por ejemplo, `?invitacion=1`).
> - En el celular usa el menú de compartir del teléfono; si no existe, copia el enlace; y si tampoco se puede, muéstralo listo para copiar a mano.
> - Agrega un botón para enviarlo por WhatsApp con un mensaje cálido.
> - Quien abre la invitación ve un saludo de bienvenida especial.
> - Agrega etiquetas Open Graph y una imagen de vista previa de 1200 × 630 px.
> - La imagen descargable incluye la cuadrícula, el personaje y la frase final de la carta, en el modo de color activo.
>
> **Entrega:** El código y los pasos para probar cada caso.
>
> **Criterios de aceptación:** El enlace copiado no contiene ningún dato personal. La imagen se descarga bien en el celular y en la computadora.

---

## Prompt 8. Auditoría final y README

> **Rol:** Actúa como ingeniera de control de calidad (QA) y redactora técnica.
>
> **Tarea:** Haz una auditoría general de todo el proyecto, corrige lo que encuentres y escribe un README.
>
> **Contexto:** El repositorio será público en GitHub y formará parte de mi portafolio.
>
> **Restricciones:**
> - Revisa que el HTML sea válido, que no haya errores en la consola, que todos los botones y enlaces funcionen, el contraste de colores en ambos modos, la navegación con teclado, el diseño en celular y los casos límite de fechas.
> - Para cada problema explica qué pasaba, por qué (la causa técnica) y cómo se corrigió.
> - El README va en primera persona, con un tono personal, e incluye: de qué trata, por qué lo hice, capturas, herramientas usadas, prompts, errores que corregí, privacidad, cómo probarlo, la URL pública y créditos.
>
> **Entrega:** El informe de la auditoría en una tabla (problema, causa, corrección), el código corregido y el README.
>
> **Criterios de aceptación:** Cero errores de HTML y de accesibilidad automática, y todo el recorrido funciona en computadora y celular.

---

## Prompt para corregir un error

Cuando algo falle, copia el error de la consola del navegador (clic derecho → Inspeccionar → Consola) y usa este prompt:

> **Rol:** Actúa como desarrolladora senior y maestra paciente.
>
> **Tarea:** Corrige este error y explícame por qué sucedió.
>
> **Contexto:** Estaba [LO QUE HICISTE, por ejemplo: "tocando el botón de modo noche en el celular"] y pasó [LO QUE VISTE]. Esperaba que [LO QUE DEBÍA PASAR]. El error de la consola es: `[PEGA AQUÍ EL ERROR]`.
>
> **Restricciones:** Explícalo en lenguaje sencillo. Cambia solo lo necesario y dime en qué archivo y en qué línea. Dime cómo comprobar que quedó resuelto y cómo evitar que vuelva a pasar.

## Prompt para continuar en una conversación nueva

Si la conversación se vuelve muy larga, o vas a cambiar de herramienta, pide primero un resumen y pégalo al empezar la nueva conversación:

> Resume el estado actual del proyecto para continuarlo en otra conversación: el objetivo, las decisiones de diseño que ya tomé (colores, estilo, tono), la estructura de archivos, qué hace cada archivo, qué fases ya están terminadas, qué falta y cualquier error pendiente. Hazlo en una lista breve.
