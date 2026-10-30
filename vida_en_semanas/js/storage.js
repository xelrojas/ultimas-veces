/**
 * storage.js
 * Guarda el avance solo en este navegador (localStorage), para no perderlo
 * si la página se recarga por accidente. Nada se envía a ningún lado.
 *
 * - Si el navegador no permite guardar (modo privado, cookies bloqueadas),
 *   la página funciona igual: simplemente no recuerda el avance.
 * - El avance caduca a los 60 días.
 * - "Empezar de nuevo" lo borra.
 */
(function (App) {
  "use strict";

  const KEY = "vida-en-semanas:avance";
  const VERSION = 1;
  const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

  /** @param {object} snapshot Datos simples (se guardan como JSON). */
  function save(snapshot) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), ...snapshot }));
      return true;
    } catch {
      return false;
    }
  }

  /** @returns {object|null} El avance guardado, o null si no hay o ya no sirve. */
  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== VERSION || Date.now() - data.savedAt > MAX_AGE_MS) {
        clear();
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  App.storage = Object.freeze({ save, load, clear });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
