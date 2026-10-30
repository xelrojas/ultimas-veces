/**
 * data.js
 * Contenido de la experiencia: configuración, categorías, actos de la
 * historia y "últimas veces".
 *
 * Para agregar o editar una "última vez", solo modifica la lista LAST_TIMES.
 * No hace falta tocar ningún otro archivo.
 */
(function (App) {
  "use strict";

  const CONFIG = Object.freeze({
    YEARS: 80,
    WEEKS_PER_YEAR: 52,
    MAX_NAME_LENGTH: 40,
    MAX_CUSTOM_TEXT_LENGTH: 80,
    MAX_FIRST_TIMES: 3,
    MAX_CUSTOM_LAST_TIMES: 5,
  });

  /** Categorías de "últimas veces". El color se define en css/styles.css. */
  const CATEGORIES = Object.freeze({
    infancia: { label: "Infancia", cssVar: "--cat-infancia" },
    familia: { label: "Familia", cssVar: "--cat-familia" },
    amistades: { label: "Escuela y amistades", cssVar: "--cat-amistades" },
    propia: { label: "Tus últimas veces", cssVar: "--cat-propia" },
  });

  /**
   * La historia se cuenta en tres actos:
   *  1. Nostalgia: la infancia, cuando todo parecía para siempre.
   *  2. Darse cuenta: la juventud y la casa.
   *  3. Esperanza: lo que viene (las primeras veces).
   * Los actos 1 y 2 agrupan las "últimas veces"; el 3 abre las primeras veces.
   */
  const ACTS = Object.freeze({
    1: {
      label: "Primer acto",
      title: "Cuando todo era para siempre",
      intro: (v) =>
        v.g(
          "Cuando eras niña, los días no tenían fin y todo parecía que iba a durar para siempre. Vamos a recordar algunas cosas que hiciste por última vez sin saberlo.",
          "Cuando eras niño, los días no tenían fin y todo parecía que iba a durar para siempre. Vamos a recordar algunas cosas que hiciste por última vez sin saberlo.",
          "En tu infancia, los días no tenían fin y todo parecía que iba a durar para siempre. Vamos a recordar algunas cosas que hiciste por última vez sin saberlo."
        ),
    },
    2: {
      label: "Segundo acto",
      title: "Cuando empezaste a darte cuenta",
      intro: () =>
        "Creciste, y algunas despedidas empezaron a hacer ruido. Aun así, la mayoría pasó sin que nadie las anunciara.",
    },
    3: {
      label: "Tercer acto",
      title: "Lo que viene",
    },
  });

  /**
   * "Últimas veces" universales, en orden de la historia.
   *  - act:  acto al que pertenece (1 o 2).
   *  - age:  edad típica en años en que suele ocurrir (la persona puede ajustarla).
   *  - week: semana dentro de ese año de vida (0 a 51), solo para ubicarla.
   *  - story(v): texto adaptado al nombre y género (ver language.js).
   */
  const LAST_TIMES = Object.freeze([
    // ----- Primer acto: la infancia -----
    {
      id: "carro",
      act: 1,
      category: "familia",
      age: 6,
      week: 30,
      title: "Te dormiste en el carro y despertaste en tu cama",
      story: (v) =>
        v.g(
          "Venían de regreso de una fiesta y te quedaste dormida en el asiento de atrás, con las luces de la carretera pasando por la ventana. Despertaste en tu cama sin saber cómo llegaste: alguien te cargó con cuidado para no despertarte. Fue la última vez.",
          "Venían de regreso de una fiesta y te quedaste dormido en el asiento de atrás, con las luces de la carretera pasando por la ventana. Despertaste en tu cama sin saber cómo llegaste: alguien te cargó con cuidado para no despertarte. Fue la última vez.",
          "Venían de regreso de una fiesta y el sueño te ganó en el asiento de atrás, con las luces de la carretera pasando por la ventana. Despertaste en tu cama sin saber cómo llegaste: alguien te cargó con cuidado para no despertarte. Fue la última vez."
        ),
    },
    {
      id: "caricaturas",
      act: 1,
      category: "infancia",
      age: 8,
      week: 20,
      title: "Viste caricaturas en pijama un sábado en la mañana",
      story: () =>
        "Te levantaste antes que todos, prendiste la tele y el sábado entero fue tuyo: cereal, caricaturas y pijama hasta mediodía. Un día dejaste de hacerlo y nadie se dio cuenta, ni tú.",
    },
    {
      id: "reyes",
      act: 1,
      category: "infancia",
      age: 9,
      week: 1,
      title: "Esperaste a los Reyes Magos con ilusión",
      story: (v) =>
        v.g(
          "Te fuiste a dormir nerviosa, segura de que esa noche pasaría algo mágico. Al año siguiente ya conocías el secreto.",
          "Te fuiste a dormir nervioso, seguro de que esa noche pasaría algo mágico. Al año siguiente ya conocías el secreto.",
          "Esa noche costó dormir de tanta ilusión: algo mágico iba a pasar. Al año siguiente ya conocías el secreto."
        ),
    },
    {
      id: "calle",
      act: 1,
      category: "infancia",
      age: 10,
      week: 30,
      title: "Jugaste en la calle hasta que oscureció",
      story: (v) =>
        `${v.name}, hubo una tarde en que te llamaron a cenar y dejaste el juego "para mañana". Ese mañana nunca llegó.`,
    },
    {
      id: "monografia",
      act: 1,
      category: "amistades",
      age: 11,
      week: 36,
      title: "Hiciste una tarea con monografía y resistol",
      story: () =>
        "Fuiste a la papelería por la monografía, recortaste los dibujos y escribiste todo a mano con tu mejor letra. Al día siguiente la entregaste con orgullo. Hoy cualquier respuesta está a un clic.",
    },
    {
      id: "recreo",
      act: 1,
      category: "amistades",
      age: 12,
      week: 44,
      title: "Corriste al recreo de la primaria",
      story: () =>
        "Sonó la campana y saliste corriendo con tus amigos. No había nada más importante en el mundo. Fue el último recreo de esa etapa.",
    },

    // ----- Segundo acto: la juventud y la casa -----
    {
      id: "verano",
      act: 2,
      category: "infancia",
      age: 15,
      week: 22,
      title: "Tuviste unas vacaciones sin ninguna preocupación",
      story: () =>
        "Días larguísimos, sin pendientes ni horarios, con la única pregunta de a qué hora salir. No sabías que esa ligereza también tenía fecha de caducidad.",
    },
    {
      id: "abuela",
      act: 2,
      category: "familia",
      age: 16,
      week: 8,
      title: "Tu abuela te llamó solo para saber cómo estabas",
      story: () =>
        "Sonó el teléfono de la casa y era ella, preguntando si ya habías comido y cuándo ibas a ir a verla. Contestaste con prisa por colgar. No sabías que algún día ibas a extrañar esas preguntas.",
    },
    {
      id: "despiertos",
      act: 2,
      category: "familia",
      age: 17,
      week: 40,
      title: "Alguien te esperó despierto hasta que llegaste",
      story: () =>
        "Llegaste tarde y la luz de la sala seguía prendida. No te regañaron: solo querían saber que habías llegado bien. Con los años, aprendiste a apagar esa luz tú.",
    },
    {
      id: "prepa",
      act: 2,
      category: "amistades",
      age: 18,
      week: 46,
      title: "Viste a todo tu grupo de la prepa junto",
      story: () =>
        'Se despidieron con un "nos vemos pronto". Muchos de ustedes no volvieron a coincidir en el mismo lugar.',
    },
    {
      id: "amistad",
      act: 2,
      category: "amistades",
      age: 21,
      week: 20,
      title: "Te viste con tu mejor amistad sin tener que planearlo",
      story: () =>
        "Se veían diario sin ponerse de acuerdo: en clase, en la tiendita, en la puerta de la casa. Luego llegaron los trabajos y los horarios, y verse empezó a necesitar agenda.",
    },
    {
      id: "casa",
      act: 2,
      category: "familia",
      age: 23,
      week: 10,
      title: "Viviste en casa de tus papás",
      story: () =>
        "Una mañana cerraste la puerta de la casa donde creciste y ya no volviste a vivir ahí. Desde entonces, cada regreso es una visita.",
    },
  ]);

  /** Opciones de "¿cuándo?" para las primeras veces (semanas desde hoy). */
  const FIRST_TIME_WHEN = Object.freeze([
    { id: "mes", label: "Este mes", weeksFromNow: 3 },
    { id: "semestre", label: "En los próximos seis meses", weeksFromNow: 20 },
    { id: "anio", label: "Este año", weeksFromNow: 40 },
    { id: "cinco", label: "En los próximos cinco años", weeksFromNow: 180 },
  ]);

  /** Colores que la persona puede elegir para sus semanas vividas. */
  // "Según el modo" (value vacío) usa el color del modo activo:
  // naranja de día y amarillo lámpara de noche.
  const LIVED_COLORS = Object.freeze([
    { id: "modo", label: "Según el modo", value: "", swatch: "linear-gradient(135deg, #E8613C 50%, #F2C46D 50%)" },
    { id: "naranja", label: "Naranja", value: "#E8613C" },
    { id: "mostaza", label: "Mostaza", value: "#D99A2B" },
    { id: "terracota", label: "Terracota", value: "#A8503A" },
  ]);

  App.data = Object.freeze({
    CONFIG,
    CATEGORIES,
    ACTS,
    LAST_TIMES,
    FIRST_TIME_WHEN,
    LIVED_COLORS,
  });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
