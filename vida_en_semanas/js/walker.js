/**
 * walker.js
 * El personaje camina sobre la cuadrícula, como en el mapa de un videojuego.
 *
 * - Se para sobre la semana indicada (sus pies quedan en el borde de arriba
 *   del cuadrito, así la semana iluminada se sigue viendo).
 * - Camina en "L": primero recorre los años (arriba o abajo) y después las
 *   semanas (izquierda o derecha), alternando el paso.
 * - Cambia de edad al llegar: niño en la infancia, joven en la adolescencia
 *   y su apariencia actual en el presente.
 *
 * Con "reducir movimiento" activado, aparece directo en su lugar.
 */
(function (App) {
  "use strict";

  const STEP_MS = 140;          // cada cuánto alterna el paso al caminar
  const PX_PER_MS = 0.32;       // velocidad
  const MIN_WALK_MS = 450;
  const MAX_WALK_MS = 2200;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * @param {HTMLElement} gridEl   La cuadrícula (debe tener position: relative).
   * @param {{ getAvatar: () => object }} source
   */
  function createWalker(gridEl, { getAvatar }) {
    const el = document.createElement("div");
    el.className = "walker";
    el.setAttribute("aria-hidden", "true");
    el.hidden = true;
    const canvas = document.createElement("canvas");
    canvas.className = "pixel walker__sprite";
    el.appendChild(canvas);

    let index = null;           // semana donde está parado
    let stage = "adulto";
    let flip = false;
    let scale = 2;
    let animation = null;
    let stepTimer = null;
    let walkToken = 0;          // para ignorar caminatas que ya se cancelaron

    /** El elemento se agrega después de que la cuadrícula dibuja sus semanas. */
    function attach() {
      if (!el.isConnected) gridEl.appendChild(el);
    }

    function cellAt(i) {
      return gridEl.querySelector(`.week[data-index="${i}"]`);
    }

    /** Tamaño del personaje según el tamaño de los cuadritos. */
    function updateScale() {
      const cell = cellAt(0);
      scale = cell && cell.offsetWidth >= 8 ? 2 : 1;
    }

    function draw(pose = {}) {
      App.avatar.renderAvatarCanvas(canvas, getAvatar(), scale, { pose: { stage, ...pose }, flip });
    }

    /** Coordenadas (en px, dentro de la cuadrícula) para pararse en una semana. */
    function spotFor(i) {
      const cell = cellAt(i);
      if (!cell) return { x: 0, y: 0 };
      const { width, height } = App.avatar.SIZE;
      const w = width * scale;
      const h = height * scale;
      return {
        x: Math.round(cell.offsetLeft + cell.offsetWidth / 2 - w / 2),
        // Los pies quedan sobre el marco de la semana iluminada, sin taparla.
        // (el marco mide 3 px y se separa 2 px del cuadrito: 5 px en total)
        y: Math.round(cell.offsetTop - (h - scale) - 5),
      };
    }

    function moveTo({ x, y }) {
      el.style.transform = `translate(${x}px, ${y}px)`;
    }

    /** Posición actual, aunque esté a medio camino. */
    function currentSpot() {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return { x: matrix.m41, y: matrix.m42 };
    }

    function stopWalking() {
      walkToken += 1;
      window.clearInterval(stepTimer);
      stepTimer = null;
      if (animation) {
        const here = currentSpot();
        animation.cancel();
        animation = null;
        moveTo(here);
      }
    }

    /** Aparece parado en una semana, sin caminar. */
    function place(i, { stage: newStage = stage } = {}) {
      stopWalking();
      attach();
      updateScale();
      index = i;
      stage = newStage;
      flip = false;
      draw();
      moveTo(spotFor(i));
      el.hidden = false;
      el.classList.remove("walker--arrive");
      void el.offsetWidth; // reinicia la animación de aparecer
      el.classList.add("walker--arrive");
    }

    /**
     * Camina hasta una semana y, al llegar, toma la edad indicada.
     * @returns {Promise<void>} Se resuelve al llegar (o si otra caminata la reemplaza).
     */
    function walkTo(i, { stage: newStage = stage } = {}) {
      if (i === null || i === undefined) return Promise.resolve();
      if (el.hidden || index === null || prefersReducedMotion()) {
        place(i, { stage: newStage });
        return Promise.resolve();
      }

      const from = animation ? currentSpot() : spotFor(index);
      stopWalking();
      const token = walkToken;
      updateScale();
      const to = spotFor(i);
      index = i;

      const dy = Math.abs(to.y - from.y);
      const dx = Math.abs(to.x - from.x);
      const distance = dx + dy;
      if (distance < 1) {
        stage = newStage;
        draw();
        return Promise.resolve();
      }

      flip = to.x < from.x; // mira hacia donde va
      const corner = { x: from.x, y: to.y };
      const duration = Math.min(MAX_WALK_MS, Math.max(MIN_WALK_MS, distance / PX_PER_MS));

      animation = el.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px)` },
          { transform: `translate(${corner.x}px, ${corner.y}px)`, offset: dy / distance },
          { transform: `translate(${to.x}px, ${to.y}px)` },
        ],
        { duration, easing: "linear", fill: "forwards" }
      );

      let stride = false;
      draw({ stride: true });
      stepTimer = window.setInterval(() => {
        stride = !stride;
        draw({ stride });
      }, STEP_MS);

      return animation.finished
        .then(() => {
          if (token !== walkToken) return;
          window.clearInterval(stepTimer);
          stepTimer = null;
          animation.cancel();
          animation = null;
          moveTo(to);
          const grew = newStage !== stage;
          stage = newStage;
          draw();
          if (grew) {
            el.classList.remove("walker--arrive");
            void el.offsetWidth;
            el.classList.add("walker--arrive");
          }
        })
        .catch(() => {}); // cancelada por otra caminata
    }

    function hide() {
      stopWalking();
      el.hidden = true;
      index = null;
    }

    /** Vuelve a dibujar (por ejemplo, si cambia la apariencia). */
    function refresh() {
      if (!el.hidden && !animation) draw();
    }

    // Si cambia el tamaño de la cuadrícula (girar el celular, cambiar la
    // ventana), el personaje se reacomoda en su semana.
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        if (el.hidden || index === null || animation) return;
        updateScale();
        draw();
        moveTo(spotFor(index));
      }).observe(gridEl);
    }

    return Object.freeze({ place, walkTo, hide, refresh });
  }

  App.walker = Object.freeze({ createWalker });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
