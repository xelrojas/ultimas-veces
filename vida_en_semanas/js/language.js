/**
 * language.js
 * Ayudas para adaptar el texto al género que elige la persona.
 *
 * El género solo cambia las palabras (concordancia gramatical en español),
 * nunca las experiencias que se muestran.
 */
(function (App) {
  "use strict";

  /** Valores válidos que puede enviar el formulario de bienvenida. */
  const GENDERS = Object.freeze({
    FEMALE: "mujer",
    MALE: "hombre",
    NEUTRAL: "neutro",
  });

  /**
   * Crea una "voz": un objeto con el nombre de la persona y una función `g`
   * que elige la forma correcta de una palabra o frase.
   *
   * @param {string} name   Nombre de la persona.
   * @param {string} gender Uno de los valores de GENDERS.
   * @returns {{ name: string, gender: string, g: (female: string, male: string, neutral?: string) => string }}
   *
   * @example
   *   const v = createVoice("Mariana", "mujer");
   *   v.g("dormida", "dormido", "con sueño"); // "dormida"
   */
  function createVoice(name, gender) {
    const safeGender = Object.values(GENDERS).includes(gender)
      ? gender
      : GENDERS.NEUTRAL;

    function g(female, male, neutral) {
      if (safeGender === GENDERS.FEMALE) return female;
      if (safeGender === GENDERS.MALE) return male;
      // Si no hay forma neutra, se usa una frase que no dependa del género.
      return neutral !== undefined ? neutral : female;
    }

    return Object.freeze({ name, gender: safeGender, g });
  }

  /** Saludo para la carta final. */
  function greeting(voice) {
    return voice.g("Querida", "Querido", "Hola,");
  }

  /** Formatea números con separador de miles al estilo de México (4,160). */
  function formatNumber(value) {
    return new Intl.NumberFormat("es-MX").format(value);
  }

  App.language = Object.freeze({ GENDERS, createVoice, greeting, formatNumber });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
