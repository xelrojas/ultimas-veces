/**
 * life.js
 * Cálculos puros sobre la vida en semanas. No toca el DOM, así que es fácil
 * de probar y de reutilizar.
 *
 * Modelo: la cuadrícula tiene una fila por año de vida y 52 columnas por fila.
 * La semana de una persona se ubica por su edad (fila) y las semanas desde
 * su último cumpleaños (columna).
 */
(function (App) {
  "use strict";

  const { CONFIG } = App.data;
  const TOTAL_WEEKS = CONFIG.YEARS * CONFIG.WEEKS_PER_YEAR;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  /**
   * Convierte el valor de un <input type="date"> ("AAAA-MM-DD") en una fecha
   * local. Se evita `new Date("AAAA-MM-DD")` porque la interpreta en UTC y
   * puede mover el día.
   * @returns {Date|null}
   */
  function parseDateInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    // Rechaza fechas imposibles como 2025-02-31.
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return null;
    }
    return date;
  }

  /** Quita la hora para comparar solo fechas. */
  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Valida la fecha de nacimiento.
   * @returns {string|null} Mensaje de error o null si es válida.
   */
  function validateBirthDate(birthDate, today) {
    if (!birthDate) return "Me falta tu fecha de nacimiento completa: día, mes y año.";
    if (startOfDay(birthDate) > startOfDay(today)) {
      return "Esa fecha todavía no llega. Revisa el año de nacimiento.";
    }
    if (today.getFullYear() - birthDate.getFullYear() > 120) {
      return "Revisa el año: con esa fecha tendrías más de 120 años.";
    }
    return null;
  }

  /**
   * Calcula la edad y la posición actual en la cuadrícula.
   * @returns {{ years: number, weekOfYear: number, livedWeeks: number, remainingWeeks: number, exceeded: boolean }}
   */
  function getLifeStats(birthDate, today) {
    const now = startOfDay(today);
    let years = now.getFullYear() - birthDate.getFullYear();
    let lastBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (lastBirthday > now) {
      years -= 1;
      lastBirthday = new Date(now.getFullYear() - 1, birthDate.getMonth(), birthDate.getDate());
    }

    const daysSinceBirthday = Math.round((now - lastBirthday) / MS_PER_DAY);
    const weekOfYear = Math.min(Math.floor(daysSinceBirthday / 7), CONFIG.WEEKS_PER_YEAR - 1);
    const rawLived = years * CONFIG.WEEKS_PER_YEAR + weekOfYear;
    const livedWeeks = Math.min(rawLived, TOTAL_WEEKS);

    return {
      years,
      weekOfYear,
      livedWeeks,
      remainingWeeks: TOTAL_WEEKS - livedWeeks,
      exceeded: rawLived >= TOTAL_WEEKS,
    };
  }

  /**
   * Pasa el tiempo que queda (hasta cumplir 80) a escala humana.
   * Cada semana trae un fin de semana, así que los fines de semana son
   * las semanas restantes de la cuadrícula.
   * @returns {{ weekends: number, christmases: number, months: number } | null}
   *          null si la persona ya pasó los 80 años.
   */
  function getHumanScale(birthDate, today) {
    const now = startOfDay(today);
    const end = new Date(birthDate.getFullYear() + CONFIG.YEARS, birthDate.getMonth(), birthDate.getDate());
    if (now >= end) return null;

    let christmases = 0;
    for (let year = now.getFullYear(); year <= end.getFullYear(); year += 1) {
      const christmas = new Date(year, 11, 25);
      if (christmas >= now && christmas < end) christmases += 1;
    }

    let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    if (end.getDate() < now.getDate()) months -= 1;

    return {
      weekends: getLifeStats(birthDate, today).remainingWeeks,
      christmases,
      months: Math.max(months, 0),
    };
  }

  /** Índice de la cuadrícula (0 a TOTAL_WEEKS - 1) para una edad y semana. */
  function indexFor(age, week) {
    const safeWeek = Math.max(0, Math.min(week, CONFIG.WEEKS_PER_YEAR - 1));
    return age * CONFIG.WEEKS_PER_YEAR + safeWeek;
  }

  /** Convierte un índice de la cuadrícula en { age, week }. */
  function positionOf(index) {
    return {
      age: Math.floor(index / CONFIG.WEEKS_PER_YEAR),
      week: index % CONFIG.WEEKS_PER_YEAR,
    };
  }

  /** ¿El índice existe dentro de la cuadrícula? */
  function isInGrid(index) {
    return Number.isInteger(index) && index >= 0 && index < TOTAL_WEEKS;
  }

  App.life = Object.freeze({
    TOTAL_WEEKS,
    parseDateInput,
    validateBirthDate,
    getLifeStats,
    getHumanScale,
    indexFor,
    positionOf,
    isInGrid,
  });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
