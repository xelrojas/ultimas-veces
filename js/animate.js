/**
 * animate.js
 * Da vida al personaje en las escenas de la casita (bienvenida y carta):
 * respira (sube y baja un pixel), parpadea de vez en cuando y saluda.
 *
 * Con "reducir movimiento" activado en el dispositivo, la escena se dibuja
 * quieta y no se programa ninguna animación.
 */
(function (App) {
  "use strict";

  const TICK_MS = 110;          // ritmo de la animación (unos 9 cuadros por segundo)
  const BREATH_MS = 900;        // medio ciclo de respiración
  const BLINK_MS = 150;         // lo que dura un parpadeo
  const BLINK_EVERY = [2600, 5200]; // entre parpadeos (al azar en este rango)
  const WAVE_FRAME_MS = 230;    // cada movimiento de la mano al saludar
  const WAVE_MS = 1850;         // lo que dura un saludo
  const WAVE_AGAIN_MS = 9000;   // vuelve a saludar solo, de vez en cuando

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ getAvatar: () => object, isNight: () => boolean, getStage?: () => string }} source
   */
  function createSceneAnimator(canvas, { getAvatar, isNight, getStage = () => "adulto" }) {
    let timer = null;
    let startedAt = 0;
    let nextBlinkAt = 0;
    let waveUntil = 0;
    let lastWaveAt = 0;

    const randomBlinkDelay = () =>
      BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);

    /** Calcula la pose del momento y dibuja la escena. */
    function draw(now = performance.now()) {
      const still = !timer;
      const elapsed = now - startedAt;
      const pose = { stage: getStage() };

      if (!still) {
        pose.bob = Math.floor(elapsed / BREATH_MS) % 2 === 1;

        if (now >= nextBlinkAt) {
          pose.blink = true;
          if (now >= nextBlinkAt + BLINK_MS) nextBlinkAt = now + randomBlinkDelay();
        }

        if (now - lastWaveAt > WAVE_AGAIN_MS && now > waveUntil) wave(now);
        if (now < waveUntil) pose.wave = Math.floor((waveUntil - now) / WAVE_FRAME_MS) % 2 ? 1 : 2;
      }

      App.avatar.renderSceneCanvas(canvas, getAvatar(), { night: isNight(), pose });
    }

    /** Saluda con la mano (por ejemplo, al cambiar su apariencia). */
    function wave(now = performance.now()) {
      if (!timer) return;
      waveUntil = now + WAVE_MS;
      lastWaveAt = now;
    }

    function start({ greet = true } = {}) {
      if (timer) return;
      if (prefersReducedMotion()) {
        draw();
        return;
      }
      startedAt = performance.now();
      nextBlinkAt = startedAt + randomBlinkDelay();
      timer = window.setInterval(() => {
        if (!document.hidden) draw();
      }, TICK_MS);
      if (greet) wave(startedAt + 400);
      else lastWaveAt = startedAt;
      draw();
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
      draw(); // queda quieto, con la pose normal
    }

    return Object.freeze({ start, stop, wave: () => wave(), refresh: () => draw() });
  }

  App.animate = Object.freeze({ createSceneAnimator });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
