/**
 * theme.js
 * Modo alegre (día) y modo nocturno "Noche de lámparas".
 *
 * Reglas:
 *  1. Si la persona eligió un modo con el botón, se usa ese y se recuerda
 *     en este navegador.
 *  2. Si no, el modo es automático: nocturno cuando el dispositivo está en
 *     modo oscuro o cuando es de noche (de 7 p.m. a 7 a.m.).
 *
 * El <head> de index.html aplica la misma regla antes de pintar la página
 * para que no haya un destello de colores al cargar.
 */
(function (App) {
  "use strict";

  const STORAGE_KEY = "vida-en-semanas:tema";
  const THEMES = Object.freeze({ DAY: "day", NIGHT: "night" });
  const NIGHT_STARTS_AT = 19; // 7 p.m.
  const NIGHT_ENDS_AT = 7; // 7 a.m.
  const CHECK_EVERY_MS = 60 * 1000;
  const THEME_COLORS = Object.freeze({ day: "#EFE4CF", night: "#1C1A33" });

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listeners = [];

  // El almacenamiento puede fallar (modo privado, cookies bloqueadas):
  // en ese caso la página funciona igual, solo no recuerda la elección.
  function readChoice() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === THEMES.DAY || value === THEMES.NIGHT ? value : null;
    } catch {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  function isNightHour(date = new Date()) {
    const hour = date.getHours();
    return hour >= NIGHT_STARTS_AT || hour < NIGHT_ENDS_AT;
  }

  function automaticTheme() {
    return darkQuery.matches || isNightHour() ? THEMES.NIGHT : THEMES.DAY;
  }

  let choice = readChoice();

  function current() {
    return choice || automaticTheme();
  }

  function isManual() {
    return Boolean(choice);
  }

  function apply() {
    const theme = current();
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
    listeners.forEach((listener) => listener(theme, { manual: isManual() }));
  }

  /** Elige un modo a mano y lo recuerda. */
  function set(theme) {
    if (!Object.values(THEMES).includes(theme)) return;
    choice = theme;
    saveChoice(theme);
    apply();
  }

  function toggle() {
    set(current() === THEMES.NIGHT ? THEMES.DAY : THEMES.NIGHT);
  }

  /** Olvida la elección y vuelve al modo automático. */
  function useAutomatic() {
    choice = null;
    saveChoice(null);
    apply();
  }

  /** @param {(theme: string, info: { manual: boolean }) => void} listener */
  function onChange(listener) {
    listeners.push(listener);
  }

  // En modo automático, la página cambia sola si cambia la preferencia del
  // dispositivo o si llega la hora mientras está abierta.
  darkQuery.addEventListener("change", () => {
    if (!isManual()) apply();
  });
  window.setInterval(() => {
    if (!isManual() && document.documentElement.dataset.theme !== automaticTheme()) apply();
  }, CHECK_EVERY_MS);

  apply();

  App.theme = Object.freeze({ THEMES, current, isManual, set, toggle, useAutomatic, onChange });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
