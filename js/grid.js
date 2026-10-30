/**
 * grid.js
 * Dibuja y actualiza la cuadrícula de semanas en el DOM.
 *
 * La cuadrícula no conoce la historia: solo recibe qué semanas pintar.
 * La lógica de la experiencia vive en main.js.
 */
(function (App) {
  "use strict";

  const { CONFIG } = App.data;
  const { TOTAL_WEEKS } = App.life;
  const COLS = CONFIG.WEEKS_PER_YEAR;
  const YEAR_LABEL_EVERY = 10;
  const MS_PER_ROW = 28; // velocidad de la animación al encender las semanas

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * @param {HTMLElement} container Elemento donde se dibuja la cuadrícula.
   * @param {{ onSelect: (index: number) => void }} options
   */
  function createGrid(container, { onSelect }) {
    /** @type {HTMLElement[]} */
    const cells = [];
    let selectedIndex = null;
    let spotlightIndex = null;
    let nowIndex = 0;
    let animationId = null;

    // ---------- Construcción (una sola vez) ----------
    function build() {
      const fragment = document.createDocumentFragment();
      for (let year = 0; year < CONFIG.YEARS; year += 1) {
        const label = document.createElement("span");
        label.className = "year-label";
        label.setAttribute("aria-hidden", "true");
        if (year % YEAR_LABEL_EVERY === 0) label.textContent = String(year);
        fragment.appendChild(label);

        for (let week = 0; week < COLS; week += 1) {
          const cell = document.createElement("span");
          cell.className = "week";
          cell.dataset.index = String(year * COLS + week);
          cell.setAttribute("aria-hidden", "true");
          cells.push(cell);
          fragment.appendChild(cell);
        }
      }
      container.replaceChildren(fragment);
    }

    // ---------- Semanas vividas ----------
    /**
     * Enciende las semanas vividas, fila por fila.
     * @returns {Promise<void>} Se resuelve cuando termina la animación.
     */
    function paintLived(livedWeeks, { animate = true } = {}) {
      cancelAnimationFrame(animationId);
      nowIndex = Math.min(livedWeeks, TOTAL_WEEKS - 1);

      const apply = (upTo) => {
        for (let i = 0; i < cells.length; i += 1) {
          cells[i].classList.toggle("is-lived", i < upTo);
        }
      };

      const finish = () => {
        apply(livedWeeks);
        cells.forEach((c) => c.classList.remove("is-now"));
        if (livedWeeks < TOTAL_WEEKS) cells[nowIndex].classList.add("is-now");
      };

      if (!animate || prefersReducedMotion()) {
        finish();
        return Promise.resolve();
      }

      apply(0);
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (time) => {
          const rows = Math.floor((time - start) / MS_PER_ROW) + 1;
          const upTo = Math.min(rows * COLS, livedWeeks);
          apply(upTo);
          if (upTo < livedWeeks) {
            animationId = requestAnimationFrame(step);
          } else {
            finish();
            resolve();
          }
        };
        animationId = requestAnimationFrame(step);
      });
    }

    // ---------- Marcas: últimas veces y primeras veces ----------
    /**
     * @param {Map<number, { kind: "last" | "seed", category?: string }>} marks
     */
    function setMarks(marks) {
      cells.forEach((cell, index) => {
        const mark = marks.get(index);
        if (mark && mark.kind === "last") {
          cell.dataset.category = mark.category;
        } else {
          delete cell.dataset.category;
        }
        cell.classList.toggle("is-seed", Boolean(mark && mark.kind === "seed"));
      });
    }

    // ---------- Resaltados ----------
    /** Ilumina una semana. Con scroll: false no mueve la página. */
    function spotlight(index, { scroll = true } = {}) {
      if (spotlightIndex !== null) cells[spotlightIndex].classList.remove("is-spotlight");
      spotlightIndex = App.life.isInGrid(index) ? index : null;
      if (spotlightIndex === null) return;

      const cell = cells[spotlightIndex];
      cell.classList.add("is-spotlight");
      if (scroll) scrollIntoViewIfNeeded(cell);
    }

    function select(index, { notify = true } = {}) {
      if (!App.life.isInGrid(index)) return;
      if (selectedIndex !== null) cells[selectedIndex].classList.remove("is-selected");
      selectedIndex = index;
      cells[index].classList.add("is-selected");
      if (notify) onSelect(index);
    }

    function clearSelection() {
      if (selectedIndex !== null) cells[selectedIndex].classList.remove("is-selected");
      selectedIndex = null;
    }

    /**
     * Atenúa todas las semanas excepto las que cumplen el filtro.
     * @param {((cell: HTMLElement) => boolean) | null} predicate
     */
    function setFilter(predicate) {
      container.classList.toggle("is-filtering", Boolean(predicate));
      cells.forEach((cell) => {
        cell.classList.toggle("is-match", Boolean(predicate && predicate(cell)));
      });
    }

    /**
     * Desplaza la página solo si la semana no está a la vista.
     * En celular la tarjeta de la historia tapa la mitad inferior,
     * así que la semana se lleva al tercio superior de la pantalla.
     */
    function scrollIntoViewIfNeeded(cell) {
      const rect = cell.getBoundingClientRect();
      const isMobile = window.matchMedia("(max-width: 899px)").matches;
      const topLimit = window.innerHeight * 0.12;
      const bottomLimit = window.innerHeight * (isMobile ? 0.4 : 0.88);
      if (rect.top >= topLimit && rect.bottom <= bottomLimit) return;

      const target = window.scrollY + rect.top - window.innerHeight * (isMobile ? 0.2 : 0.45);
      window.scrollTo({
        top: Math.max(0, target),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }

    // ---------- Interacción ----------
    function indexFromEvent(event) {
      const cell = event.target.closest(".week");
      return cell ? Number(cell.dataset.index) : null;
    }

    container.addEventListener("click", (event) => {
      const index = indexFromEvent(event);
      if (index !== null) select(index);
    });

    // Al pasar el mouse (no en pantallas táctiles, donde se usa el toque).
    container.addEventListener("pointerover", (event) => {
      if (event.pointerType !== "mouse") return;
      const index = indexFromEvent(event);
      if (index !== null) select(index);
    });

    container.addEventListener("focus", () => {
      if (selectedIndex === null) select(nowIndex);
    });

    // Navegación con teclado: flechas, Inicio/Fin y Re Pág/Av Pág.
    container.addEventListener("keydown", (event) => {
      const current = selectedIndex === null ? nowIndex : selectedIndex;
      const moves = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: COLS,
        ArrowUp: -COLS,
        PageDown: COLS * YEAR_LABEL_EVERY,
        PageUp: -COLS * YEAR_LABEL_EVERY,
      };

      let next = null;
      if (event.key in moves) next = current + moves[event.key];
      else if (event.key === "Home") next = current - (current % COLS);
      else if (event.key === "End") next = current - (current % COLS) + COLS - 1;
      if (next === null) return;

      event.preventDefault();
      next = Math.max(0, Math.min(TOTAL_WEEKS - 1, next));
      select(next);
      scrollIntoViewIfNeeded(cells[next]);
    });

    build();

    return Object.freeze({
      paintLived,
      setMarks,
      spotlight,
      select,
      clearSelection,
      setFilter,
      get nowIndex() {
        return nowIndex;
      },
    });
  }

  App.grid = Object.freeze({ createGrid });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
