/**
 * main.js
 * Orquesta la experiencia: pasos, formularios, estado y textos.
 *
 * Flujo:
 *   0 Bienvenida → 1 Cuadrícula → 2 Últimas veces (actos 1 y 2) → 3 Las tuyas
 *   → 4 Pausa → 5 Primeras veces (acto 3) → 6 Carta final
 */
(function (App) {
  "use strict";

  const { CONFIG, CATEGORIES, ACTS, LAST_TIMES, FIRST_TIME_WHEN, LIVED_COLORS } = App.data;
  const { createVoice, greeting, formatNumber } = App.language;
  const life = App.life;
  const avatarKit = App.avatar;
  const theme = App.theme;
  const sound = App.sound;

  const LAST_STEP = 6;
  const STEP = Object.freeze({ WELCOME: 0, GRID: 1, LASTS: 2, MINE: 3, PAUSE: 4, FIRSTS: 5, LETTER: 6 });

  // ---------- Referencias al DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    steps: Array.from(document.querySelectorAll(".step")),
    progressLabel: $("progress-label"),
    progressSteps: $("progress-steps"),
    resume: $("resume"),
    resumeRestart: $("resume-restart"),
    resumeClose: $("resume-close"),
    board: $("board"),
    grid: $("grid"),
    weekInfo: $("week-info"),
    legend: $("legend"),
    boardTitle: $("board-title"),

    badge: $("badge"),
    badgeAvatar: $("badge-avatar"),
    badgeName: $("badge-name"),
    badgeLevel: $("badge-level"),

    welcomeForm: $("welcome-form"),
    welcomeError: $("welcome-error"),
    nameInput: $("name"),
    birthDay: $("birth-day"),
    birthMonth: $("birth-month"),
    birthYear: $("birth-year"),
    welcomeScene: $("welcome-scene"),
    creator: $("avatar-creator"),
    avatarHint: $("avatar-hint"),
    avatarRandom: $("avatar-random"),
    avatarSkip: $("avatar-skip"),

    gridTitle: $("t-grid"),
    gridIntro: $("grid-intro"),
    humanScale: $("human-scale"),
    statLived: $("stat-lived"),
    statRemaining: $("stat-remaining"),

    lastsSection: document.querySelector(".step--lasts"),
    lastCounter: $("last-counter"),
    lastTitle: $("t-lasts"),
    lastStory: $("last-story"),
    lastMeta: $("last-meta"),
    lastPrev: $("last-prev"),
    lastNext: $("last-next"),

    mineIntro: $("mine-intro"),
    memoryCard: $("memory-card"),
    memoryCount: $("memory-count"),
    memoryTitle: $("memory-title"),
    memoryMeta: $("memory-meta"),
    memoryAge: $("memory-age"),
    memoryAgeMinus: $("memory-age-minus"),
    memoryAgePlus: $("memory-age-plus"),
    memoryYes: $("memory-yes"),
    memoryNo: $("memory-no"),
    memoryPrev: $("memory-prev"),
    memorySkip: $("memory-skip"),
    memoryDone: $("memory-done"),
    memorySummary: $("memory-summary"),
    memoryChips: $("memory-chips"),
    memoryReview: $("memory-review"),
    mineNext: $("mine-next"),
    customForm: $("custom-last-form"),
    customText: $("custom-last-text"),
    customAge: $("custom-last-age"),
    customError: $("custom-last-error"),
    customList: $("custom-last-list"),
    colorChoices: $("color-choices"),

    firstsIntro: $("firsts-intro"),
    firstForm: $("first-form"),
    firstText: $("first-text"),
    firstWhen: $("first-when"),
    firstError: $("first-error"),
    firstList: $("first-list"),

    letterScene: $("letter-scene"),
    letterTitle: $("t-letter"),
    letterBody: $("letter-body"),
    download: $("download"),
    downloadError: $("download-error"),
    restart: $("restart"),
    share: $("share"),
    shareWhatsapp: $("share-whatsapp"),
    shareFallback: $("share-fallback"),
    shareUrl: $("share-url"),
    shareStatus: $("share-status"),
    invited: $("invited"),

    themeToggle: $("theme-toggle"),
    themeToggleLabel: $("theme-toggle-label"),
    themeAuto: $("theme-auto"),

    soundToggle: $("sound-toggle"),
    soundLabel: $("sound-label"),
    musicToggle: $("music-toggle"),
  };

  // ---------- Estado ----------
  /**
   * Estado inicial. Vive en memoria y se guarda en este navegador
   * (ver persist() y js/storage.js) para no perder el avance al recargar.
   */
  function initialState() {
    return {
      step: STEP.WELCOME,
      /** El paso más avanzado que se ha visitado (la barra deja volver hasta ahí). */
      maxStep: STEP.WELCOME,
      /** La cuadrícula ya se pintó con animación una vez. */
      gridPainted: false,
      /** Tarjeta actual del paso 3 (igual a LAST_TIMES.length = ya terminó). */
      mineIndex: 0,
      voice: null,
      birthDate: null,
      stats: null,
      /** id → { checked, age, answered } para las últimas veces predefinidas. */
      lastChoices: new Map(),
      /** Últimas veces escritas por la persona. */
      customLasts: [],
      /** Primeras veces sembradas en el futuro. */
      firstTimes: [],
      /** Posición en la secuencia del paso 2 (tarjetas de acto y recuerdos). */
      storyIndex: 0,
      legendFilter: null,
      marks: new Map(),
      nextId: 1,
    };
  }

  let state = initialState();

  /** Apariencia del personaje. Se elige antes de empezar la experiencia. */
  let avatar = { ...avatarKit.DEFAULT_AVATAR };
  /** El creador del personaje está plegado ("Saltar este paso"). */
  let creatorCollapsed = false;
  /** Mientras se restaura el avance guardado no se vuelve a guardar. */
  let restoring = false;

  const grid = App.grid.createGrid(els.grid, { onSelect: describeWeek });

  // ---------- Personaje con vida ----------
  /** Edad del personaje "hoy": su apariencia actual. */
  function presentStage() {
    return state.stats ? avatarKit.stageForAge(state.stats.years) : "adulto";
  }

  /** Semana de hoy en la cuadrícula. */
  function nowIndex() {
    return Math.min(state.stats.livedWeeks, life.TOTAL_WEEKS - 1);
  }

  // Respira, parpadea y saluda en la casita de la bienvenida y de la carta.
  const welcomeAnimator = App.animate.createSceneAnimator(els.welcomeScene, {
    getAvatar: () => avatar,
    isNight: () => isNight(),
  });
  const letterAnimator = App.animate.createSceneAnimator(els.letterScene, {
    getAvatar: () => avatar,
    isNight: () => isNight(),
    getStage: presentStage,
  });

  // Camina sobre la cuadrícula hasta cada recuerdo, con la edad de ese momento.
  const walker = App.walker.createWalker(els.grid, { getAvatar: () => avatar });

  // ---------- Utilidades ----------
  function createEl(tag, { className, text, attrs } = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text; // textContent evita inyectar HTML
    if (attrs) Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function setError(target, message, field) {
    target.textContent = message || "";
    if (message) sound.play("error");
    if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function pluralize(count, singular, plural) {
    return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
  }

  /** Une una lista en español: "a", "a y b", "a, b y c". */
  function joinList(parts) {
    if (parts.length <= 1) return parts.join("");
    return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
  }

  /**
   * El tiempo que queda a escala humana, por ejemplo:
   * "unos 2,308 fines de semana, unas 45 Navidades y unos 532 meses".
   * @returns {string|null} null si ya pasó los 80 años de la hoja.
   */
  function humanScaleText() {
    const scale = life.getHumanScale(state.birthDate, new Date());
    if (!scale) return null;
    const parts = [];
    parts.push(scale.weekends === 1 ? "un fin de semana" : `unos ${formatNumber(scale.weekends)} fines de semana`);
    if (scale.christmases === 1) parts.push("una Navidad");
    else if (scale.christmases > 1) parts.push(`unas ${formatNumber(scale.christmases)} Navidades`);
    if (scale.months === 1) parts.push("un mes");
    else if (scale.months > 1) parts.push(`unos ${formatNumber(scale.months)} meses`);
    return joinList(parts);
  }

  function isMobile() {
    return window.matchMedia("(max-width: 899px)").matches;
  }

  function scrollBehavior() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  /** Edad máxima válida para una última vez (no puede estar en el futuro). */
  function maxAge() {
    return Math.min(state.stats.years, CONFIG.YEARS - 1);
  }

  function parseAge(value) {
    const age = Number(value);
    if (value === "" || !Number.isInteger(age) || age < 0 || age > maxAge()) return null;
    return age;
  }

  // ---------- Marcas en la cuadrícula ----------
  /**
   * Busca la semana libre más cercana a `index` dentro de [min, max]
   * para que dos marcas no caigan en la misma semana.
   */
  function placeFree(marks, index, min, max) {
    for (let offset = 0; offset <= max - min; offset += 1) {
      for (const candidate of [index - offset, index + offset]) {
        if (candidate >= min && candidate <= max && !marks.has(candidate)) return candidate;
      }
    }
    return null;
  }

  /** Lista ordenada de las últimas veces activas (predefinidas y propias). */
  function activeLastTimes() {
    const defaults = LAST_TIMES.filter((item) => state.lastChoices.get(item.id).checked).map(
      (item) => ({
        id: item.id,
        act: item.act,
        title: item.title,
        category: item.category,
        age: state.lastChoices.get(item.id).age,
        week: item.week,
        story: item.story,
      })
    );
    const custom = state.customLasts.map((item) => ({
      id: item.id,
      title: item.title,
      category: "propia",
      age: item.age,
      week: 26,
    }));
    return [...defaults, ...custom].sort((a, b) => a.age - b.age || a.week - b.week);
  }

  /** Recalcula todas las marcas y las dibuja. */
  function refreshMarks() {
    const marks = new Map();
    const lived = state.stats.livedWeeks;

    if (lived > 0) {
      activeLastTimes().forEach((item) => {
        const target = Math.min(life.indexFor(item.age, item.week), lived - 1);
        const index = placeFree(marks, target, 0, lived - 1);
        if (index !== null) marks.set(index, { kind: "last", ...item });
      });
    }

    state.firstTimes.forEach((item) => {
      const when = FIRST_TIME_WHEN.find((w) => w.id === item.whenId);
      const target = lived + when.weeksFromNow;
      if (target >= life.TOTAL_WEEKS) {
        item.index = null;
        return;
      }
      const index = placeFree(marks, target, lived + 1, life.TOTAL_WEEKS - 1);
      item.index = index;
      if (index !== null) marks.set(index, { kind: "seed", title: item.text });
    });

    state.marks = marks;
    grid.setMarks(marks);
    applyLegendFilter();
    persist();
  }

  /** Índice de la cuadrícula donde quedó una última vez. */
  function indexOfLast(id) {
    for (const [index, mark] of state.marks) {
      if (mark.kind === "last" && mark.id === id) return index;
    }
    return null;
  }

  // ---------- Información de cada semana ----------
  function describeWeek(index) {
    const { age, week } = life.positionOf(index);
    const lived = state.stats ? state.stats.livedWeeks : 0;
    const parts = [`A los ${age} años, semana ${week + 1}.`];
    const mark = state.marks.get(index);

    if (mark && mark.kind === "last") parts.push(`Última vez: ${mark.title}.`);
    if (mark && mark.kind === "seed") parts.push(`Primera vez sembrada: ${mark.title}.`);

    if (index < lived) parts.push("Ya la viviste.");
    else if (index === lived) parts.push("Esta es tu semana.");
    else parts.push("Todavía por vivir.");

    els.weekInfo.textContent = parts.join(" ");
  }

  // ---------- Leyenda ----------
  const LEGEND_ITEMS = [
    {
      id: "lived",
      label: "Semanas vividas",
      swatchClass: "legend__swatch--lived",
      match: (cell) => cell.classList.contains("is-lived") && !cell.dataset.category,
    },
    ...Object.entries(CATEGORIES).map(([id, cat]) => ({
      id,
      label: cat.label,
      swatch: `var(${cat.cssVar})`,
      match: (cell) => cell.dataset.category === id,
    })),
    {
      id: "seed",
      label: "Primeras veces",
      swatchClass: "legend__swatch--seed",
      match: (cell) => cell.classList.contains("is-seed"),
    },
  ];

  function renderLegend() {
    const items = LEGEND_ITEMS.map((item) => {
      const li = createEl("li");
      const button = createEl("button", {
        className: "legend__item",
        attrs: { type: "button", "aria-pressed": "false", "data-legend": item.id },
      });
      const swatch = createEl("span", {
        className: item.swatchClass ? `legend__swatch ${item.swatchClass}` : "legend__swatch",
        attrs: { "aria-hidden": "true" },
      });
      if (item.swatch) swatch.style.background = item.swatch;
      button.append(swatch, document.createTextNode(item.label));
      li.appendChild(button);
      return li;
    });
    els.legend.replaceChildren(...items);
  }

  function applyLegendFilter() {
    const item = LEGEND_ITEMS.find((i) => i.id === state.legendFilter);
    grid.setFilter(item ? item.match : null);
    els.legend.querySelectorAll("[data-legend]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.legend === state.legendFilter));
    });
  }

  els.legend.addEventListener("click", (event) => {
    const button = event.target.closest("[data-legend]");
    if (!button) return;
    const id = button.dataset.legend;
    state.legendFilter = state.legendFilter === id ? null : id;
    applyLegendFilter();
  });

  // ---------- Navegación entre pasos ----------
  function showStep(step, { moveFocus = true } = {}) {
    state.step = step;
    state.maxStep = Math.max(state.maxStep, step);
    if (!restoring) els.resume.hidden = true;
    els.steps.forEach((section) => {
      section.hidden = Number(section.dataset.step) !== step;
    });

    document.body.classList.toggle("is-welcome", step === STEP.WELCOME);
    $("app-title").hidden = step === STEP.WELCOME; // un solo título principal a la vez
    document.body.classList.toggle("is-intro", step === STEP.GRID);
    document.body.classList.toggle("is-reading", step === STEP.LASTS);
    document.body.classList.toggle("is-pause", step === STEP.PAUSE);
    sound.duck(step === STEP.PAUSE); // en la pausa, la música baja
    // En la bienvenida y en la pausa no hay cuadrícula ni tarjeta: solo texto.
    const quiet = step === STEP.WELCOME || step === STEP.PAUSE;
    els.board.hidden = quiet;
    els.badge.hidden = quiet;
    if (!quiet) renderBadge();
    els.board.classList.toggle("has-story", step >= STEP.LASTS);
    renderProgress();
    if (step !== STEP.LASTS) grid.spotlight(null);

    const renderers = {
      [STEP.GRID]: renderGridStep,
      [STEP.LASTS]: renderLastStory,
      [STEP.MINE]: renderMineStep,
      [STEP.FIRSTS]: renderFirstsStep,
      [STEP.LETTER]: renderLetter,
    };
    if (renderers[step]) renderers[step]();

    // Animaciones del personaje: solo corren en el paso donde se ven.
    if (step === STEP.WELCOME) welcomeAnimator.start();
    else welcomeAnimator.stop();
    if (step === STEP.LETTER) letterAnimator.start();
    else letterAnimator.stop();
    // Fuera de la historia, regresa al presente con su apariencia actual.
    // (En el paso 3 lo mueve cada tarjeta.)
    if (state.stats && [STEP.FIRSTS, STEP.LETTER].includes(step)) {
      walker.walkTo(nowIndex(), { stage: presentStage() });
    }

    // Mueve el foco al título del paso (lectores de pantalla y teclado).
    const heading = els.steps[step].querySelector("[tabindex='-1']");
    if (heading && moveFocus) heading.focus({ preventScroll: true });

    // En celular la cuadrícula va arriba: lleva a la persona a lo que cambió.
    if (step === STEP.GRID || quiet || !isMobile()) {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
    } else if (step !== STEP.LASTS) {
      els.steps[step].scrollIntoView({ block: "start", behavior: scrollBehavior() });
    }
    persist();
  }

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => showStep(Math.min(state.step + 1, LAST_STEP)));
  });

  /**
   * A dónde lleva "Atrás" desde cada paso. Desde lo que viene se regresa
   * a las tuyas (la pausa es solo una transición hacia adelante).
   */
  const BACK_TO = Object.freeze({
    [STEP.GRID]: STEP.WELCOME,
    [STEP.MINE]: STEP.LASTS,
    [STEP.PAUSE]: STEP.MINE,
    [STEP.FIRSTS]: STEP.MINE,
    [STEP.LETTER]: STEP.FIRSTS,
  });

  function goBack() {
    const target = BACK_TO[state.step];
    if (target === undefined) return;
    sound.play("back");
    showStep(target);
  }

  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", goBack));

  // ---------- Barra de avance ----------
  /** Nombre de cada paso en la barra (la bienvenida no aparece). */
  const STEP_NAMES = Object.freeze({
    [STEP.GRID]: "Tu cuadrícula",
    [STEP.LASTS]: "Últimas veces",
    [STEP.MINE]: "Las tuyas",
    [STEP.PAUSE]: "Una pausa",
    [STEP.FIRSTS]: "Lo que viene",
    [STEP.LETTER]: "Tu carta",
  });

  /**
   * Un segmento por paso: los visitados se pueden tocar para volver,
   * el actual se marca y los que faltan quedan apagados.
   */
  function renderProgress() {
    const current = state.step;
    if (current === STEP.WELCOME) return;
    els.progressLabel.textContent = `Paso ${current} de ${LAST_STEP}: ${STEP_NAMES[current]}`;

    const items = [];
    for (let step = STEP.GRID; step <= LAST_STEP; step += 1) {
      const li = createEl("li");
      const reached = step <= state.maxStep;
      const button = createEl("button", {
        className: "progress__step",
        attrs: {
          type: "button",
          "data-goto": String(step),
          "aria-label": `Paso ${step}: ${STEP_NAMES[step]}${reached ? "" : " (todavía no)"}`,
        },
      });
      if (step < current) button.classList.add("is-done");
      if (step === current) {
        button.classList.add("is-current");
        button.setAttribute("aria-current", "step");
      }
      if (step > current && reached) button.classList.add("is-reached");
      button.disabled = !reached || step === current;
      li.appendChild(button);
      items.push(li);
    }
    els.progressSteps.replaceChildren(...items);
  }

  els.progressSteps.addEventListener("click", (event) => {
    const button = event.target.closest("[data-goto]");
    if (!button || button.disabled) return;
    showStep(Number(button.dataset.goto));
  });

  // ---------- Paso 0 · Creador de personaje ----------
  /** Grupos del creador: qué opción del avatar controla cada uno. */
  const CREATOR_GROUPS = [
    { key: "skin", legend: "Piel", type: "swatch", options: avatarKit.OPTIONS.skin },
    { key: "hairStyle", legend: "Peinado", type: "pill", options: avatarKit.OPTIONS.hairStyle },
    { key: "hairColor", legend: "Color de cabello", type: "swatch", options: avatarKit.OPTIONS.hairColor },
    { key: "shirt", legend: "Playera", type: "swatch", options: avatarKit.OPTIONS.shirt },
    {
      key: "glasses",
      legend: "Lentes",
      type: "pill",
      options: [
        { id: "no", label: "Sin lentes" },
        { id: "si", label: "Con lentes" },
      ],
    },
  ];

  function currentValue(key) {
    if (key === "glasses") return avatar.glasses ? "si" : "no";
    return avatar[key];
  }

  function renderCreator() {
    const groups = CREATOR_GROUPS.map((group) => {
      const fieldset = createEl("fieldset", { className: "creator__group" });
      fieldset.appendChild(createEl("legend", { text: group.legend }));

      const list = createEl("div", { className: group.type === "swatch" ? "swatches" : "pills" });
      group.options.forEach((option) => {
        const label = createEl("label", {
          className: group.type === "swatch" ? "swatch-option" : "pill",
          attrs: { title: option.label },
        });
        const radio = createEl("input", {
          attrs: { type: "radio", name: `avatar-${group.key}`, value: option.id, "data-key": group.key },
        });
        radio.checked = currentValue(group.key) === option.id;

        const face = createEl("span");
        if (group.type === "swatch") {
          face.style.background = option.value;
          face.appendChild(createEl("span", { className: "sr-only", text: option.label }));
        } else {
          face.textContent = option.label;
        }
        label.append(radio, face);
        list.appendChild(label);
      });

      fieldset.appendChild(list);
      return fieldset;
    });
    els.creator.replaceChildren(...groups);
  }

  function renderWelcomeScene() {
    welcomeAnimator.refresh();
  }

  els.creator.addEventListener("change", (event) => {
    const key = event.target.dataset.key;
    if (!key) return;
    avatar = avatarKit.normalize({
      ...avatar,
      [key]: key === "glasses" ? event.target.value === "si" : event.target.value,
    });
    renderWelcomeScene();
    welcomeAnimator.wave(); // saluda con su nueva apariencia
    persist();
  });

  /** Personaje sorpresa: arma uno al azar (siempre distinto al actual). */
  function randomAvatar() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)].id;
    let next;
    do {
      next = avatarKit.normalize({
        skin: pick(avatarKit.OPTIONS.skin),
        hairStyle: pick(avatarKit.OPTIONS.hairStyle),
        hairColor: pick(avatarKit.OPTIONS.hairColor),
        shirt: pick(avatarKit.OPTIONS.shirt),
        glasses: Math.random() < 0.3,
      });
    } while (JSON.stringify(next) === JSON.stringify(avatar));
    return next;
  }

  els.avatarRandom.addEventListener("click", () => {
    avatar = randomAvatar();
    renderCreator();
    renderWelcomeScene();
    welcomeAnimator.wave();
    sound.play("seed");
    persist();
  });

  /** "Saltar este paso" pliega las opciones; se pueden volver a abrir. */
  function renderCreatorCollapsed() {
    els.creator.hidden = creatorCollapsed;
    els.avatarSkip.setAttribute("aria-expanded", String(!creatorCollapsed));
    els.avatarSkip.textContent = creatorCollapsed ? "Personalizar mi personaje" : "Saltar este paso";
    els.avatarHint.textContent = creatorCollapsed
      ? "Así te va a acompañar. Puedes personalizarlo cuando quieras."
      : "Arma a alguien que se parezca a ti, o deja que te sorprenda. Te va a acompañar en todo el camino.";
  }

  els.avatarSkip.addEventListener("click", () => {
    creatorCollapsed = !creatorCollapsed;
    renderCreatorCollapsed();
    persist();
  });

  // ---------- Paso 0 · Fecha de nacimiento ----------
  const MONTHS = Object.freeze([
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]);
  const OLDEST_YEARS = 120;

  function daysInMonth(year, month) {
    // Sin año elegido se usa uno bisiesto, para no esconder el 29 de febrero.
    return new Date(year || 2000, month || 1, 0).getDate();
  }

  function fillSelect(select, placeholder, options, keep) {
    const items = [createEl("option", { text: placeholder, attrs: { value: "" } })];
    options.forEach(([value, label]) => items.push(createEl("option", { text: label, attrs: { value: String(value) } })));
    select.replaceChildren(...items);
    select.value = options.some(([value]) => String(value) === keep) ? keep : "";
  }

  /** Llena los selectores de mes y año (una vez) y los días según el mes. */
  function renderDateSelects() {
    const thisYear = new Date().getFullYear();
    if (els.birthMonth.options.length === 0) {
      fillSelect(els.birthMonth, "Mes", MONTHS.map((name, i) => [i + 1, name[0].toUpperCase() + name.slice(1)]), "");
      const years = [];
      for (let y = thisYear; y >= thisYear - OLDEST_YEARS; y -= 1) years.push([y, String(y)]);
      fillSelect(els.birthYear, "Año", years, "");
    }
    renderDays();
  }

  /** Los días cambian según el mes y el año (30, 31, 28 o 29). */
  function renderDays() {
    const total = daysInMonth(Number(els.birthYear.value), Number(els.birthMonth.value));
    const days = [];
    for (let d = 1; d <= total; d += 1) days.push([d, String(d)]);
    fillSelect(els.birthDay, "Día", days, els.birthDay.value);
  }

  els.birthMonth.addEventListener("change", renderDays);
  els.birthYear.addEventListener("change", renderDays);

  /** Fecha elegida como "AAAA-MM-DD" ("" si falta algún dato). */
  function birthValue() {
    const [d, m, y] = [els.birthDay.value, els.birthMonth.value, els.birthYear.value];
    if (!d || !m || !y) return "";
    const pad2 = (n) => String(n).padStart(2, "0");
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  function setBirthValue(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    els.birthYear.value = match ? String(Number(match[1])) : "";
    els.birthMonth.value = match ? String(Number(match[2])) : "";
    renderDays();
    els.birthDay.value = match ? String(Number(match[3])) : "";
  }

  /** Marca los selectores con error: los vacíos, o los tres si la fecha no sirve. */
  function setBirthInvalid(invalid) {
    const selects = [els.birthDay, els.birthMonth, els.birthYear];
    const empty = selects.filter((select) => !select.value);
    selects.forEach((select) => {
      const bad = invalid && (empty.length ? !select.value : true);
      select.setAttribute("aria-invalid", String(bad));
    });
    return empty[0] || els.birthDay; // el primero que hay que corregir
  }

  // ---------- Tarjeta del personaje ----------
  function renderBadge() {
    const { voice, stats } = state;
    avatarKit.renderAvatarCanvas(els.badgeAvatar, avatar, 3, { pose: { stage: presentStage() } });
    els.badgeName.textContent = voice.name;
    els.badgeLevel.textContent = `Nivel ${stats.years}`;
    els.badgeLevel.setAttribute("aria-label", `${stats.years} años cumplidos`);
  }

  // ---------- Paso 0 · Bienvenida ----------
  // Al corregir un dato, se borra el mensaje de error anterior.
  els.welcomeForm.addEventListener("input", (event) => {
    if (!event.target.dataset.key) setError(els.welcomeError, "", event.target);
    if (event.target.tagName === "SELECT") setBirthInvalid(false);
    persist();
  });
  els.welcomeForm.addEventListener("change", () => persist());

  els.welcomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.nameInput.value.trim().replace(/\s+/g, " ").slice(0, CONFIG.MAX_NAME_LENGTH);
    const gender = new FormData(els.welcomeForm).get("gender");
    const today = new Date();
    const birthDate = life.parseDateInput(birthValue());

    setError(els.welcomeError, "", els.nameInput);
    setBirthInvalid(false);

    if (!name) {
      setError(els.welcomeError, "¿Cómo te llamo? Escribe tu nombre para empezar.", els.nameInput);
      els.nameInput.focus();
      return;
    }
    if (!gender) {
      setError(els.welcomeError, "Elige cómo quieres que te hable.");
      els.welcomeForm.querySelector("input[name='gender']").focus();
      return;
    }
    const dateError = life.validateBirthDate(birthDate, today);
    if (dateError) {
      setError(els.welcomeError, dateError);
      setBirthInvalid(true).focus();
      return;
    }

    startExperience({
      voice: createVoice(name, gender),
      birthDate,
      stats: life.getLifeStats(birthDate, today),
    });
  });

  function startExperience({ voice, birthDate, stats }) {
    // Si regresa a cambiar sus datos, se conserva lo que ya respondió.
    const previous = state.stats ? state : null;
    const sameBirth = previous && previous.birthDate.getTime() === birthDate.getTime();
    state = { ...initialState(), voice, birthDate, stats };
    sound.play("advance");

    // Por defecto, se marcan las últimas veces que ya ocurrieron por edad.
    LAST_TIMES.forEach((item) => {
      const happened = life.indexFor(item.age, item.week) < stats.livedWeeks;
      state.lastChoices.set(item.id, { checked: happened, age: Math.min(item.age, maxAge()), answered: false });
    });

    if (previous) {
      state.customLasts = previous.customLasts.filter((item) => item.age <= maxAge());
      state.firstTimes = previous.firstTimes;
      state.nextId = previous.nextId;
      if (sameBirth) {
        state.lastChoices = previous.lastChoices;
        state.mineIndex = previous.mineIndex;
        state.maxStep = previous.maxStep;
        state.gridPainted = true;
      }
    }

    els.boardTitle.textContent = `La vida de ${voice.name}`;
    grid.clearSelection();
    els.weekInfo.textContent = "Toca o recorre una semana para ver qué pasó en ella.";
    renderLegend();
    refreshMarks();
    showStep(STEP.GRID);
  }

  // ---------- Paso 1 · Cuadrícula ----------
  function renderGridStep() {
    const { voice, stats } = state;
    els.gridTitle.textContent = `${voice.name}, esta es tu vida en semanas`;
    els.gridIntro.textContent = stats.exceeded
      ? "Cada cuadrito es una semana; cada fila, un año. Ya recorriste las 4,160 semanas de esta hoja, y cada semana de más es un regalo."
      : "Cada cuadrito es una semana; cada fila, un año. Los que se encienden ya los viviste. El que parpadea es esta semana, justo ahora.";
    const scale = humanScaleText();
    els.humanScale.textContent = scale
      ? `Dicho de otra forma: si la vida te presta los 80 años de esta hoja, te quedan ${scale}.`
      : "Ya recorriste toda esta hoja. Lo que venga ahora es tiempo de regalo.";
    els.statLived.textContent = formatNumber(stats.livedWeeks);
    els.statRemaining.textContent = formatNumber(stats.remainingWeeks);

    // La animación de encender las semanas solo se ve la primera vez;
    // al volver a este paso, el personaje regresa caminando al presente.
    if (state.gridPainted) {
      grid.paintLived(stats.livedWeeks, { animate: false });
      walker.walkTo(nowIndex(), { stage: presentStage() });
      return;
    }
    state.gridPainted = true;
    walker.hide();
    grid.paintLived(stats.livedWeeks, { animate: true }).then(() => {
      if (state.step !== STEP.GRID) return;
      sound.play("arpeggio");
      // Aparece parado en la semana de hoy, con su apariencia actual.
      walker.place(nowIndex(), { stage: presentStage() });
    });
  }

  // ---------- Paso 2 · Últimas veces, en dos actos ----------
  /**
   * Arma la secuencia de la historia: cada acto abre con su tarjeta y
   * sigue con sus recuerdos, de la edad más temprana a la más tardía.
   * @returns {Array<{type: "act", act: number} | {type: "item", act: number, item: object, n: number, total: number}>}
   */
  function storySequence() {
    const items = activeLastTimes().filter((item) => item.story);
    const sequence = [];
    [1, 2].forEach((act) => {
      const inAct = items
        .filter((item) => item.act === act)
        .sort((a, b) => a.age - b.age || a.week - b.week);
      if (!inAct.length) return;
      sequence.push({ type: "act", act });
      inAct.forEach((item, i) => sequence.push({ type: "item", act, item, n: i + 1, total: inAct.length }));
    });
    return sequence;
  }

  function renderLastStory() {
    const sequence = storySequence();

    if (sequence.length === 0) {
      els.lastsSection.dataset.act = "1";
      els.lastCounter.textContent = "Últimas veces";
      els.lastTitle.textContent = "Tus últimas veces todavía están por llegar";
      els.lastStory.textContent = state.voice.g(
        "Eres muy joven para haber despedido muchas cosas. Algún día, sin aviso, harás algo por última vez. Ojalá lo disfrutes como si lo supieras.",
        "Eres muy joven para haber despedido muchas cosas. Algún día, sin aviso, harás algo por última vez. Ojalá lo disfrutes como si lo supieras.",
        "Todavía no despides muchas cosas. Algún día, sin aviso, harás algo por última vez. Ojalá lo disfrutes como si lo supieras."
      );
      els.lastMeta.textContent = "";
      els.lastPrev.hidden = false;
      els.lastPrev.disabled = false;
      els.lastNext.textContent = "Seguir";
      grid.spotlight(null);
      persist();
      return;
    }

    state.storyIndex = Math.max(0, Math.min(state.storyIndex, sequence.length - 1));
    const entry = sequence[state.storyIndex];
    const next = sequence[state.storyIndex + 1];
    const act = ACTS[entry.act];

    els.lastsSection.dataset.act = String(entry.act);
    els.lastPrev.hidden = false;
    els.lastPrev.disabled = false; // en la primera tarjeta regresa a la cuadrícula
    persist();

    if (entry.type === "act") {
      // Tarjeta que abre el acto: sin semana iluminada, solo el tono.
      els.lastCounter.textContent = act.label;
      els.lastTitle.textContent = act.title;
      els.lastStory.textContent = act.intro(state.voice);
      els.lastMeta.textContent = "";
      els.lastNext.textContent = "Vamos";
      grid.spotlight(null);
      sound.play("act", 0.12);
      return;
    }

    const { item } = entry;
    els.lastCounter.textContent = `${act.label} · ${entry.n} de ${entry.total}`;
    els.lastTitle.textContent = item.title;
    els.lastStory.textContent = item.story(state.voice);

    const dot = createEl("span", { className: "meta__dot", attrs: { "aria-hidden": "true" } });
    dot.style.background = `var(${CATEGORIES[item.category].cssVar})`;
    els.lastMeta.replaceChildren(
      dot,
      document.createTextNode(`Alrededor de los ${item.age} años. ${CATEGORIES[item.category].label}.`)
    );

    if (!next) els.lastNext.textContent = "Ahora cuéntame las tuyas";
    else if (next.type === "act") els.lastNext.textContent = "Pasemos al segundo acto";
    else els.lastNext.textContent = "Siguiente recuerdo";

    const index = indexOfLast(item.id);
    grid.spotlight(index);
    if (index !== null) grid.select(index);
    walker.walkTo(index, { stage: avatarKit.stageForAge(item.age) });
    sound.play("ding", 0.12);
  }

  els.lastPrev.addEventListener("click", () => {
    if (state.storyIndex <= 0 || storySequence().length === 0) {
      showStep(STEP.GRID);
      return;
    }
    state.storyIndex -= 1;
    renderLastStory();
  });

  els.lastNext.addEventListener("click", () => {
    const sequence = storySequence();
    if (sequence.length === 0 || state.storyIndex >= sequence.length - 1) {
      showStep(STEP.MINE);
      return;
    }
    state.storyIndex += 1;
    renderLastStory();
  });

  // ---------- Paso 3 · Las tuyas: una tarjeta a la vez ----------
  /**
   * Cada recuerdo se pregunta en su propia tarjeta ("Sí, ya la viví" /
   * "Todavía no"), con la edad ajustable. Al terminar se muestra un resumen
   * donde se puede corregir cualquiera de un toque, agregar recuerdos
   * propios y elegir el color de las semanas.
   */
  function mineDone() {
    return state.mineIndex >= LAST_TIMES.length;
  }

  function renderMineStep() {
    const done = mineDone();
    els.memoryCard.hidden = done;
    els.memoryDone.hidden = !done;
    els.mineNext.hidden = !done;
    els.mineIntro.textContent = done
      ? "Así quedaron tus últimas veces. Si te acuerdas de otra que no está aquí, escríbela: también cuenta."
      : "Te voy a mostrar cada recuerdo. Dime si ya lo viviste y, si fue en otro momento, corrige la edad.";
    if (done) renderMineDone();
    else renderMemoryCard();
  }

  /** Semana (dentro de lo vivido) donde cae un recuerdo a cierta edad. */
  function weekForMemory(item, age) {
    const lived = state.stats.livedWeeks;
    if (lived <= 0) return null;
    return Math.min(life.indexFor(age, item.week), lived - 1);
  }

  function renderMemoryCard() {
    const item = LAST_TIMES[state.mineIndex];
    const choice = state.lastChoices.get(item.id);
    choice.age = Math.min(choice.age, maxAge());

    els.memoryCard.style.setProperty("--row-color", `var(${CATEGORIES[item.category].cssVar})`);
    els.memoryCount.textContent = `Recuerdo ${state.mineIndex + 1} de ${LAST_TIMES.length} · ${ACTS[item.act].label}`;
    els.memoryTitle.textContent = item.title;
    const dot = createEl("span", { className: "meta__dot", attrs: { "aria-hidden": "true" } });
    dot.style.background = `var(${CATEGORIES[item.category].cssVar})`;
    els.memoryMeta.replaceChildren(dot, document.createTextNode(CATEGORIES[item.category].label));

    els.memoryAge.textContent = choice.age === 1 ? "1 año" : `${choice.age} años`;
    els.memoryAgeMinus.disabled = choice.age <= 0;
    els.memoryAgePlus.disabled = choice.age >= maxAge();
    els.memoryPrev.hidden = state.mineIndex === 0;

    // Muestra la respuesta que ya dio (si regresa a esta tarjeta).
    els.memoryYes.setAttribute("aria-pressed", String(choice.answered && choice.checked));
    els.memoryNo.setAttribute("aria-pressed", String(choice.answered && !choice.checked));

    // El personaje camina hasta esa semana, con la edad del recuerdo.
    const index = weekForMemory(item, choice.age);
    grid.spotlight(index, { scroll: !isMobile() });
    if (index !== null) {
      grid.select(index, { notify: false });
      walker.walkTo(index, { stage: avatarKit.stageForAge(choice.age) });
    }
  }

  /** Responde la tarjeta actual y pasa a la siguiente. */
  function answerMemory(lived) {
    const item = LAST_TIMES[state.mineIndex];
    const choice = state.lastChoices.get(item.id);
    choice.checked = lived;
    choice.answered = true;
    sound.play(lived ? "ding" : "select");
    state.mineIndex += 1;
    refreshMarks();
    renderMineStep();
    if (mineDone()) walker.walkTo(nowIndex(), { stage: presentStage() });
    (mineDone() ? els.memorySummary : els.memoryYes).focus?.();
  }

  function changeMemoryAge(delta) {
    const item = LAST_TIMES[state.mineIndex];
    const choice = state.lastChoices.get(item.id);
    choice.age = Math.max(0, Math.min(maxAge(), choice.age + delta));
    refreshMarks();
    renderMemoryCard();
  }

  els.memoryYes.addEventListener("click", () => answerMemory(true));
  els.memoryNo.addEventListener("click", () => answerMemory(false));
  els.memoryAgeMinus.addEventListener("click", () => changeMemoryAge(-1));
  els.memoryAgePlus.addEventListener("click", () => changeMemoryAge(1));
  els.memoryPrev.addEventListener("click", () => {
    state.mineIndex = Math.max(0, state.mineIndex - 1);
    renderMineStep();
    els.memoryYes.focus();
  });
  els.memorySkip.addEventListener("click", () => {
    // Las que no respondió se quedan como se sugirieron por su edad.
    state.mineIndex = LAST_TIMES.length;
    refreshMarks();
    renderMineStep();
    walker.walkTo(nowIndex(), { stage: presentStage() });
    els.memorySummary.focus?.();
  });
  els.memoryReview.addEventListener("click", () => {
    state.mineIndex = 0;
    renderMineStep();
    els.memoryYes.focus();
  });

  /** Resumen: cada recuerdo es un botón que se marca o desmarca de un toque. */
  function renderMineDone() {
    const lived = LAST_TIMES.filter((item) => state.lastChoices.get(item.id).checked).length;
    els.memorySummary.textContent = `Marcaste ${pluralize(lived, "recuerdo", "recuerdos")} de ${LAST_TIMES.length} como vividos. Si alguno no cuadra, tócalo para cambiarlo.`;
    const chips = LAST_TIMES.map((item) => {
      const choice = state.lastChoices.get(item.id);
      const li = createEl("li");
      const chip = createEl("button", {
        className: "memory-chip",
        attrs: { type: "button", "data-id": item.id, "aria-pressed": String(choice.checked) },
      });
      chip.style.setProperty("--row-color", `var(${CATEGORIES[item.category].cssVar})`);
      chip.append(
        createEl("span", { className: "memory-chip__mark", text: choice.checked ? "✓" : "", attrs: { "aria-hidden": "true" } }),
        createEl("span", { text: `${item.title} (${choice.age})` })
      );
      li.appendChild(chip);
      return li;
    });
    els.memoryChips.replaceChildren(...chips);
    renderCustomList();
    renderColorChoices();
    els.customAge.max = String(maxAge());
  }

  els.memoryChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-id]");
    if (!chip) return;
    const choice = state.lastChoices.get(chip.dataset.id);
    choice.checked = !choice.checked;
    choice.answered = true;
    refreshMarks();
    renderMineDone();
    els.memoryChips.querySelector(`[data-id="${chip.dataset.id}"]`).focus();
    const index = indexOfLast(chip.dataset.id);
    if (index !== null) grid.select(index, { notify: false });
  });

  els.customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.customText.value.trim().replace(/\s+/g, " ").slice(0, CONFIG.MAX_CUSTOM_TEXT_LENGTH);
    const age = parseAge(els.customAge.value);

    setError(els.customError, "", els.customText);
    els.customAge.setAttribute("aria-invalid", "false");

    if (state.customLasts.length >= CONFIG.MAX_CUSTOM_LAST_TIMES) {
      setError(els.customError, `Ya guardaste ${CONFIG.MAX_CUSTOM_LAST_TIMES} recuerdos tuyos, el máximo. Quita uno si quieres cambiarlo.`);
      return;
    }
    if (!title) {
      setError(els.customError, "Cuéntame qué hiciste por última vez.", els.customText);
      els.customText.focus();
      return;
    }
    if (age === null) {
      setError(els.customError, `¿Cuántos años tenías? Escribe una edad entre 0 y ${maxAge()}.`, els.customAge);
      els.customAge.focus();
      return;
    }

    const id = `propia-${state.nextId++}`;
    state.customLasts.push({ id, title, age });
    sound.play("seed");
    els.customForm.reset();
    renderCustomList();
    refreshMarks();
    const index = indexOfLast(id);
    if (index !== null) grid.select(index);
    els.customText.focus();
  });

  function renderCustomList() {
    const items = state.customLasts.map((item) => {
      const li = createEl("li", { className: "tag" });
      li.append(
        createEl("span", { text: `${item.title} (a los ${item.age} años)` }),
        createEl("button", {
          className: "tag__remove",
          text: "Quitar",
          attrs: { type: "button", "data-remove": item.id, "aria-label": `Quitar: ${item.title}` },
        })
      );
      return li;
    });
    els.customList.replaceChildren(...items);
  }

  els.customList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    state.customLasts = state.customLasts.filter((item) => item.id !== button.dataset.remove);
    renderCustomList();
    refreshMarks();
    els.customText.focus();
  });

  function renderColorChoices() {
    // Color elegido a mano (vacío = según el modo).
    const current = document.documentElement.style.getPropertyValue("--lived").trim();
    const choices = LIVED_COLORS.map((color) => {
      const label = createEl("label", { className: "choice" });
      const radio = createEl("input", {
        attrs: { type: "radio", name: "lived-color", value: color.value },
      });
      radio.checked = current.toLowerCase() === color.value.toLowerCase();
      const swatch = createEl("span", { className: "swatch", attrs: { "aria-hidden": "true" } });
      swatch.style.background = color.swatch || color.value;
      label.append(radio, swatch, document.createTextNode(color.label));
      return label;
    });
    els.colorChoices.replaceChildren(...choices);
  }

  els.colorChoices.addEventListener("change", (event) => {
    if (event.target.name !== "lived-color") return;
    applyLivedColor(event.target.value);
    persist();
  });

  /** Color de las semanas vividas ("" = según el modo). */
  function applyLivedColor(value) {
    if (value) document.documentElement.style.setProperty("--lived", value);
    else document.documentElement.style.removeProperty("--lived");
  }

  // ---------- Paso 5 · Tercer acto: primeras veces ----------
  function renderFirstsStep() {
    const scale = humanScaleText();
    els.firstsIntro.textContent = scale
      ? `Te quedan ${scale}. Muchos de esos días traerán primeras veces que todavía no imaginas. ¿Hay alguna que quieras provocar tú? Siémbrala en tu cuadrícula: puedes poner hasta ${CONFIG.MAX_FIRST_TIMES}.`
      : `Cada semana que llega todavía puede traer algo nuevo. ¿Hay alguna primera vez que quieras provocar tú? Puedes sembrar hasta ${CONFIG.MAX_FIRST_TIMES}.`;

    if (!els.firstWhen.options.length) {
      FIRST_TIME_WHEN.forEach((when) => {
        els.firstWhen.appendChild(createEl("option", { text: when.label, attrs: { value: when.id } }));
      });
    }
    renderFirstList();
  }

  els.firstForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.firstText.value.trim().replace(/\s+/g, " ").slice(0, CONFIG.MAX_CUSTOM_TEXT_LENGTH);
    setError(els.firstError, "", els.firstText);

    if (state.firstTimes.length >= CONFIG.MAX_FIRST_TIMES) {
      setError(els.firstError, `Ya sembraste ${CONFIG.MAX_FIRST_TIMES}. Quita una si quieres cambiarla.`);
      return;
    }
    if (!text) {
      setError(els.firstError, "Escribe algo que quieras hacer por primera vez.", els.firstText);
      els.firstText.focus();
      return;
    }

    const id = `primera-${state.nextId++}`;
    state.firstTimes.push({ id, text, whenId: els.firstWhen.value, index: null });
    sound.play("seed");
    els.firstText.value = "";
    refreshMarks();
    renderFirstList();

    const added = state.firstTimes[state.firstTimes.length - 1];
    if (added.index !== null) grid.select(added.index);
    els.firstText.focus();
  });

  function whenLabel(whenId) {
    return FIRST_TIME_WHEN.find((w) => w.id === whenId).label.toLowerCase();
  }

  function renderFirstList() {
    const items = state.firstTimes.map((item) => {
      const li = createEl("li", { className: "tag" });
      li.append(
        createEl("span", { text: `${item.text} (${whenLabel(item.whenId)})` }),
        createEl("button", {
          className: "tag__remove",
          text: "Quitar",
          attrs: { type: "button", "data-remove": item.id, "aria-label": `Quitar: ${item.text}` },
        })
      );
      return li;
    });
    els.firstList.replaceChildren(...items);
  }

  els.firstList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    state.firstTimes = state.firstTimes.filter((item) => item.id !== button.dataset.remove);
    refreshMarks();
    renderFirstList();
    els.firstText.focus();
  });

  // ---------- Paso 6 · Carta final ----------
  /** La frase de cierre: va en la carta y en la imagen descargable. */
  const CLOSING_LINE = "Que la próxima última vez te encuentre prestando atención.";

  /** Firma de la carta, de quien fue la persona en su infancia. */
  function signature() {
    if (state.stats.years < 10) return "Con cariño, la hoja que guarda tus semanas.";
    return state.voice.g(
      "Con cariño, la niña que fuiste a los 10 años.",
      "Con cariño, el niño que fuiste a los 10 años.",
      "Con cariño, quien fuiste a los 10 años."
    );
  }

  /** Textos del pie de la imagen descargable: la misma emoción que la carta. */
  function imageFooter() {
    const scale = humanScaleText();
    const firsts = state.firstTimes.map((item) => `«${item.text}»`);
    const lines = [
      scale ? `Te quedan ${scale}.` : "Cada semana que llega ahora es tiempo de regalo.",
      firsts.length ? `Primeras veces que te esperan: ${joinList(firsts)}.` : "",
    ].filter(Boolean);
    const date = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    return { headline: CLOSING_LINE, lines, signature: signature(), date: `Escrita el ${date}` };
  }

  /**
   * Una carta íntima: nombra sus últimas veces, cita con sus propias
   * palabras lo que escribió y cierra con algo para hacer esta semana.
   */
  function renderLetter() {
    const { voice, stats } = state;
    const lasts = activeLastTimes();
    const defaults = lasts.filter((item) => item.category !== "propia");
    const own = lasts.filter((item) => item.category === "propia");
    const firsts = state.firstTimes;
    const p = (text, className) => createEl("p", { text, className });
    const list = (lines) => {
      const ul = createEl("ul");
      lines.forEach((line) => ul.appendChild(createEl("li", { text: line })));
      return ul;
    };
    const body = [];

    els.letterTitle.textContent = `${greeting(voice)} ${voice.name}:`;
    // 1. Lo vivido
    if (stats.livedWeeks < 1) {
      body.push(p("Tu cuadrícula apenas empieza: esta es tu primera semana, y todo lo que viene todavía está por estrenarse."));
    } else {
      const lived = stats.exceeded
        ? `más de ${formatNumber(stats.livedWeeks)} semanas`
        : pluralize(stats.livedWeeks, "semana", "semanas");
      if (defaults.length) {
        body.push(p(`Ya viviste ${lived}. En ellas guardas ${pluralize(defaults.length, "última vez", "últimas veces")} que pasaron sin que nadie te avisara:`));
        body.push(list(defaults.map((item) => item.title)));
      } else {
        body.push(p(`Ya viviste ${lived}, y cada una guarda algo que no se va a repetir igual.`));
      }
    }

    // 2. Sus propias palabras
    if (own.length) {
      body.push(
        p(
          own.length === 1
            ? "Y me contaste una que no estaba en mi lista. Esa es solo tuya:"
            : "Y me contaste otras que no estaban en mi lista. Esas son solo tuyas:"
        )
      );
      body.push(list(own.map((item) => `«${item.title}», a los ${item.age} años.`)));
    }

    // 3. Lo que queda, a escala humana
    const scale = humanScaleText();
    body.push(
      p(
        scale
          ? `Si la vida te presta los 80 años de esta hoja, te quedan ${scale}. No es poco. Tampoco es infinito.`
          : "Ya recorriste las 4,160 semanas de esta hoja. Cada semana nueva es tiempo de regalo."
      )
    );

    // 4. Las primeras veces, citadas tal como las escribió
    if (firsts.length) {
      body.push(p("Escribiste que quieres hacer por primera vez:"));
      body.push(list(firsts.map((item) => `«${item.text}», ${whenLabel(item.whenId)}.`)));
      body.push(p("Ya están sembradas en tu cuadrícula, esperándote."));
    } else {
      body.push(p("No sembraste primeras veces, y está bien: no todo se planea. A veces basta con mirar las semanas mientras pasan."));
    }

    renderShareLinks();

    // 5. Algo para hacer esta misma semana
    body.push(createEl("h3", { className: "letter__subtitle", text: "Para esta semana" }));
    const firstStep = firsts.length
      ? `Da un paso pequeño hacia «${firsts[0].text}»: aparta una fecha, haz una llamada o manda un mensaje.`
      : "Haz algo por primera vez, aunque sea pequeño: un camino distinto, una receta nueva, una canción que nunca escuchas.";
    const reachOut = lasts.length
      ? "Y antes del domingo, escríbele a alguien que estuvo en alguna de tus últimas veces. Dile que te acordaste de esa época."
      : "Y antes del domingo, dile a alguien que quieres mucho que te alegra tenerle cerca.";
    body.push(p(`${firstStep} ${reachOut}`));

    // Firma
    body.push(p(signature(), "letter__sign"));
    body.push(p(`P. D. ${CLOSING_LINE}`, "letter__ps"));

    els.letterBody.replaceChildren(...body);
  }

  els.download.addEventListener("click", async () => {
    setError(els.downloadError, "");
    els.download.disabled = true;
    els.download.textContent = "Creando imagen…";
    try {
      await App.exporter.downloadImage({
        voice: state.voice,
        avatar,
        livedWeeks: state.stats.livedWeeks,
        marks: state.marks,
        stage: presentStage(),
        footer: imageFooter(),
      });
      sound.play("arpeggio");
    } catch (error) {
      console.error(error);
      setError(els.downloadError, "No se pudo crear la imagen. Intenta de nuevo o usa otro navegador.");
    } finally {
      els.download.disabled = false;
      els.download.textContent = "Descargar mi cuadrícula";
    }
  });

  // ---------- Invitar a otra persona ----------
  /**
   * Enlace limpio a la página, sin ningún dato de quien invita: solo marca
   * que es una invitación para dar la bienvenida.
   */
  function inviteUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("invitacion", "1");
    return url.toString();
  }

  const INVITE_TEXT =
    "Hice mi cuadrícula de vida en semanas y me hizo pensar en las últimas veces que pasan sin que nos demos cuenta. Te invito a hacer la tuya:";

  function setShareStatus(message) {
    els.shareStatus.textContent = message;
  }

  /** Copia al portapapeles; si el navegador no lo permite, muestra el enlace para copiarlo a mano. */
  async function copyInvite(url) {
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Enlace copiado. Pégalo en un mensaje para quien tú quieras.");
      return;
    } catch {
      /* sin acceso al portapapeles: se muestra el enlace */
    }
    els.shareFallback.hidden = false;
    els.shareUrl.value = url;
    els.shareUrl.focus();
    els.shareUrl.select();
    setShareStatus("Tu navegador no me dejó copiarlo. Ya está seleccionado: cópialo con Ctrl+C o Cmd+C.");
  }

  els.share.addEventListener("click", async () => {
    const url = inviteUrl();
    setShareStatus("");
    // En celular abre el menú de compartir del sistema (WhatsApp, mensajes, correo...).
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tu vida en semanas", text: INVITE_TEXT, url });
        setShareStatus("¡Listo! Ojalá le guste tanto como a ti.");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return; // canceló el menú
      }
    }
    await copyInvite(url);
  });

  function renderShareLinks() {
    els.shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${INVITE_TEXT} ${inviteUrl()}`)}`;
    els.shareFallback.hidden = true;
    setShareStatus("");
  }

  /** Si llegó por una invitación, la bienvenida lo dice (y el enlace se limpia). */
  function welcomeInvited() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("invitacion")) return;
    els.invited.hidden = false;
    params.delete("invitacion");
    const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    try {
      window.history.replaceState(null, "", clean);
    } catch {
      /* algunos navegadores no lo permiten con archivos locales */
    }
  }

  /** Empezar de nuevo: borra todo, también el avance guardado en el navegador. */
  function restart() {
    App.storage.clear();
    state = initialState();
    avatar = { ...avatarKit.DEFAULT_AVATAR };
    creatorCollapsed = false;
    els.welcomeForm.reset();
    renderDays();
    renderCreator();
    renderCreatorCollapsed();
    renderWelcomeScene();
    walker.hide();
    els.firstWhen.replaceChildren();
    applyLivedColor("");
    grid.paintLived(0, { animate: false });
    grid.setMarks(new Map());
    grid.setFilter(null);
    grid.clearSelection();
    els.resume.hidden = true;
    showStep(STEP.WELCOME);
    App.storage.clear(); // showStep guarda el paso de bienvenida vacío: se borra también
    els.nameInput.focus();
  }

  els.restart.addEventListener("click", restart);

  // ---------- Modo de día y modo nocturno ----------
  function isNight() {
    return theme.current() === theme.THEMES.NIGHT;
  }

  /** Actualiza el botón: muestra la acción disponible (ir a noche o a día). */
  function renderThemeControls() {
    const night = isNight();
    els.themeToggleLabel.textContent = night ? "Modo día" : "Modo noche";
    // Los íconos son SVG: se usa el atributo "hidden" (no la propiedad).
    els.themeToggle.querySelector(".icon-moon").toggleAttribute("hidden", night);
    els.themeToggle.querySelector(".icon-sun").toggleAttribute("hidden", !night);
    els.themeAuto.hidden = !theme.isManual();
  }

  /** Vuelve a pintar las escenas visibles con los colores del modo. */
  function onThemeChange() {
    renderThemeControls();
    renderWelcomeScene();
    letterAnimator.refresh();
  }

  els.themeToggle.addEventListener("click", () => theme.toggle());
  els.themeAuto.addEventListener("click", () => {
    theme.useAutomatic();
    els.themeToggle.focus();
  });
  theme.onChange(onThemeChange);

  // ---------- Sonido ----------
  /** Botón de bocina (acción: activar o silenciar) y botón de música. */
  function renderSoundControls() {
    const on = sound.isEnabled();
    els.soundToggle.dataset.on = String(on);
    els.soundLabel.textContent = on ? "Silenciar" : "Activar sonido";
    els.musicToggle.hidden = !on;
    els.musicToggle.setAttribute("aria-pressed", String(sound.isMusicOn()));
  }

  els.soundToggle.addEventListener("click", () => {
    const wasOn = sound.isEnabled();
    sound.toggle();
    if (!wasOn) sound.play("advance"); // confirma que ya suena
  });
  els.musicToggle.addEventListener("click", () => sound.toggleMusic());
  sound.onChange(renderSoundControls);
  if (!sound.isSupported()) els.soundToggle.hidden = true;

  // Bip al elegir cualquier opción (radios y casillas).
  document.addEventListener("change", (event) => {
    if (event.target.matches("input[type='radio'], input[type='checkbox']")) sound.play("select");
  });

  // Bips al tocar botones. Los que tienen su propio sonido se excluyen:
  // los de la historia (ding), los formularios (sembrar o error) y los de sonido.
  const OWN_SOUND =
    "#sound-toggle, #music-toggle, #last-next, #last-prev, #download, #avatar-random, #memory-yes, #memory-no, [data-back], button[type='submit']";
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || button.matches(OWN_SOUND)) return;
    sound.play(button.matches("[data-next], #restart") ? "advance" : "select");
  });
  els.lastPrev.addEventListener("click", () => sound.play("back"));

  // ---------- Recordar el avance (solo en este navegador) ----------
  /** Guarda lo necesario para continuar si la página se recarga. */
  function persist() {
    if (restoring) return;
    App.storage.save({
      step: state.step,
      maxStep: state.maxStep,
      form: {
        name: els.nameInput.value,
        gender: new FormData(els.welcomeForm).get("gender") || "",
        birth: birthValue(),
      },
      avatar,
      creatorCollapsed,
      livedColor: document.documentElement.style.getPropertyValue("--lived").trim(),
      lastChoices: [...state.lastChoices.entries()],
      customLasts: state.customLasts,
      firstTimes: state.firstTimes.map(({ id, text, whenId }) => ({ id, text, whenId })),
      storyIndex: state.storyIndex,
      mineIndex: state.mineIndex,
      nextId: state.nextId,
    });
  }

  /**
   * Recupera el avance guardado. Los datos se revisan antes de usarlos:
   * si algo no cuadra, se descarta y se empieza desde la bienvenida.
   * @returns {boolean} true si se pudo continuar en un paso avanzado.
   */
  function restore() {
    const saved = App.storage.load();
    if (!saved) return false;
    restoring = true;
    try {
      const form = saved.form || {};
      els.nameInput.value = String(form.name || "").slice(0, CONFIG.MAX_NAME_LENGTH);
      const genderInput = els.welcomeForm.querySelector(`input[name="gender"][value="${form.gender}"]`);
      if (genderInput) genderInput.checked = true;
      setBirthValue(form.birth);
      avatar = avatarKit.normalize(saved.avatar);
      creatorCollapsed = Boolean(saved.creatorCollapsed);
      if (LIVED_COLORS.some((c) => c.value === saved.livedColor)) applyLivedColor(saved.livedColor);
      renderCreator();
      renderCreatorCollapsed();
      renderWelcomeScene();

      const step = Number(saved.step);
      const birthDate = life.parseDateInput(form.birth);
      const name = els.nameInput.value.trim();
      const today = new Date();
      if (!(step >= STEP.GRID && step <= LAST_STEP) || !name || !genderInput || life.validateBirthDate(birthDate, today)) {
        return false; // se queda en la bienvenida, con lo que ya había escrito
      }

      const stats = life.getLifeStats(birthDate, today);
      state = { ...initialState(), voice: createVoice(name, form.gender), birthDate, stats };
      const savedChoices = new Map(Array.isArray(saved.lastChoices) ? saved.lastChoices : []);
      LAST_TIMES.forEach((item) => {
        const c = savedChoices.get(item.id) || {};
        const fallbackChecked = life.indexFor(item.age, item.week) < stats.livedWeeks;
        state.lastChoices.set(item.id, {
          checked: typeof c.checked === "boolean" ? c.checked : fallbackChecked,
          age: Number.isInteger(c.age) ? Math.max(0, Math.min(c.age, maxAge())) : Math.min(item.age, maxAge()),
          answered: Boolean(c.answered),
        });
      });
      const text = (value) => String(value || "").slice(0, CONFIG.MAX_CUSTOM_TEXT_LENGTH);
      state.customLasts = (saved.customLasts || [])
        .filter((item) => item && Number.isInteger(item.age) && item.age <= maxAge() && text(item.title))
        .slice(0, CONFIG.MAX_CUSTOM_LAST_TIMES)
        .map((item) => ({ id: String(item.id), title: text(item.title), age: item.age }));
      state.firstTimes = (saved.firstTimes || [])
        .filter((item) => item && text(item.text) && FIRST_TIME_WHEN.some((w) => w.id === item.whenId))
        .slice(0, CONFIG.MAX_FIRST_TIMES)
        .map((item) => ({ id: String(item.id), text: text(item.text), whenId: item.whenId, index: null }));
      state.storyIndex = Math.max(0, Number(saved.storyIndex) || 0);
      state.mineIndex = Math.max(0, Math.min(LAST_TIMES.length, Number(saved.mineIndex) || 0));
      state.nextId = Math.max(1, Number(saved.nextId) || 1);
      state.maxStep = Math.max(step, Math.min(LAST_STEP, Number(saved.maxStep) || step));
      state.gridPainted = true;

      els.boardTitle.textContent = `La vida de ${state.voice.name}`;
      els.weekInfo.textContent = "Toca o recorre una semana para ver qué pasó en ella.";
      renderLegend();
      refreshMarks();
      grid.paintLived(stats.livedWeeks, { animate: false });
      els.resume.hidden = false;
      window.setTimeout(() => (els.resume.hidden = true), 9000); // el aviso se va solo
      showStep(step, { moveFocus: false });
      walker.walkTo(step === STEP.LASTS || step === STEP.MINE ? null : nowIndex(), { stage: presentStage() });
      return true;
    } catch (error) {
      console.error(error);
      App.storage.clear();
      return false;
    } finally {
      restoring = false;
      persist();
    }
  }

  els.resumeClose.addEventListener("click", () => {
    els.resume.hidden = true;
  });
  els.resumeRestart.addEventListener("click", restart);

  // ---------- Arranque ----------
  welcomeInvited();
  renderDateSelects();
  renderCreator();
  renderCreatorCollapsed();
  renderThemeControls();
  renderSoundControls();
  if (!restore()) {
    renderWelcomeScene();
    showStep(STEP.WELCOME, { moveFocus: false });
  }
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
