/**
 * sound.js
 * Sonidos 8-bit generados en el navegador con Web Audio (sin archivos).
 *
 * - Todo empieza apagado. Nada suena hasta que la persona toca la bocina.
 * - Efectos: bip al elegir, bip doble al avanzar, ding al iluminar una
 *   última vez, arpegio al terminar la cuadrícula, notas al sembrar.
 * - Música opcional: una melodía chiptune lenta en bucle (La menor).
 *
 * Cada sonido que se toca avisa con el evento "vida:sound" en document,
 * útil para pruebas automáticas.
 */
(function (App) {
  "use strict";

  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  const VOLUME = Object.freeze({ master: 0.5, effects: 0.16, music: 0.09 });

  /** Convierte un nombre de nota ("A4", "C#5") en frecuencia (Hz). */
  const NOTE_INDEX = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  function freq(note) {
    const [, name, octave] = /^([A-G]#?)(\d)$/.exec(note);
    const midi = (Number(octave) + 1) * 12 + NOTE_INDEX[name];
    return 440 * 2 ** ((midi - 69) / 12);
  }

  let ctx = null;
  let master = null;
  let effectsBus = null;
  let musicBus = null;
  let pulseWave = null; // onda de pulso al 25 %, el timbre clásico de consola

  let effectsOn = false;
  let musicOn = false;

  /** Crea el contexto de audio la primera vez (siempre tras un toque). */
  function ensureContext() {
    if (ctx || !AudioCtx) return Boolean(ctx);
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = VOLUME.master;
    master.connect(ctx.destination);

    effectsBus = ctx.createGain();
    effectsBus.gain.value = VOLUME.effects;
    effectsBus.connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);

    // Pulso al 25 %: suma de armónicos de una onda rectangular estrecha.
    const harmonics = 32;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n += 1) {
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    }
    pulseWave = ctx.createPeriodicWave(real, imag);
    return true;
  }

  /**
   * Toca una nota con envolvente corta (ataque rápido, caída suave).
   * @param {{ note?: string, hz?: number, start: number, length: number,
   *           wave?: "pulse"|"square"|"triangle", volume?: number,
   *           bus: GainNode, slideTo?: number, decay?: number }} options
   */
  function tone({ note, hz, start, length, wave = "square", volume = 1, bus, slideTo, decay = 0.6 }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (wave === "pulse") osc.setPeriodicWave(pulseWave);
    else osc.type = wave;

    const f = hz || freq(note);
    osc.frequency.setValueAtTime(f, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);

    const end = start + length;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume * (1 - decay), 0.0001), end - 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  // ---------- Efectos ----------
  const EFFECTS = {
    /** Elegir una opción: un bip corto y agudo. */
    select: (t) => tone({ note: "E6", start: t, length: 0.05, wave: "pulse", volume: 0.5, bus: effectsBus }),

    /** Avanzar: dos notas que suben. */
    advance: (t) => {
      tone({ note: "C5", start: t, length: 0.06, wave: "square", volume: 0.45, bus: effectsBus });
      tone({ note: "G5", start: t + 0.07, length: 0.08, wave: "square", volume: 0.45, bus: effectsBus });
    },

    /** Volver: dos notas que bajan, más suaves. */
    back: (t) => {
      tone({ note: "G5", start: t, length: 0.05, wave: "pulse", volume: 0.35, bus: effectsBus });
      tone({ note: "C5", start: t + 0.06, length: 0.07, wave: "pulse", volume: 0.35, bus: effectsBus });
    },

    /** Una última vez se ilumina: campanita suave con eco. */
    ding: (t) => {
      tone({ note: "E6", start: t, length: 0.9, wave: "triangle", volume: 0.9, bus: effectsBus, decay: 0.98 });
      tone({ note: "B6", start: t, length: 0.6, wave: "triangle", volume: 0.25, bus: effectsBus, decay: 0.98 });
      tone({ note: "E6", start: t + 0.18, length: 0.6, wave: "triangle", volume: 0.25, bus: effectsBus, decay: 0.98 });
    },

    /** Empieza un acto: dos notas graves y lentas. */
    act: (t) => {
      tone({ note: "A4", start: t, length: 0.35, wave: "triangle", volume: 0.8, bus: effectsBus, decay: 0.9 });
      tone({ note: "E5", start: t + 0.2, length: 0.5, wave: "triangle", volume: 0.8, bus: effectsBus, decay: 0.95 });
    },

    /** La cuadrícula terminó de pintarse: arpegio corto que sube. */
    arpeggio: (t) => {
      ["C5", "E5", "G5", "C6", "E6"].forEach((note, i) =>
        tone({ note, start: t + i * 0.07, length: i === 4 ? 0.35 : 0.08, wave: "pulse", volume: 0.5, bus: effectsBus, decay: 0.8 })
      );
    },

    /** Sembrar una primera vez (o guardar un recuerdo): tres notas brillantes. */
    seed: (t) => {
      ["G5", "C6", "E6"].forEach((note, i) =>
        tone({ note, start: t + i * 0.06, length: 0.09, wave: "square", volume: 0.4, bus: effectsBus })
      );
    },

    /** Algo falta en un formulario: dos notas graves, sin sobresaltar. */
    error: (t) => {
      tone({ note: "E4", start: t, length: 0.08, wave: "square", volume: 0.35, bus: effectsBus });
      tone({ note: "C4", start: t + 0.09, length: 0.12, wave: "square", volume: 0.35, bus: effectsBus });
    },
  };

  /**
   * Toca un efecto si el sonido está encendido.
   * @param {string} name   Nombre del efecto (ver EFFECTS).
   * @param {number} delay  Segundos de espera, para no encimar dos sonidos.
   */
  function play(name, delay = 0) {
    if (!effectsOn || !ctx || !EFFECTS[name]) return;
    if (ctx.state === "suspended") ctx.resume();
    EFFECTS[name](ctx.currentTime + 0.01 + delay);
    document.dispatchEvent(new CustomEvent("vida:sound", { detail: { name } }));
  }

  // ---------- Música de fondo ----------
  // 8 compases en La menor (Am, F, C, G), a 76 pulsos por minuto.
  // Cada compás tiene 8 octavos. [nota, octavos]; null = silencio.
  const TEMPO = 76;
  const EIGHTH = 60 / TEMPO / 2;
  const STEPS_PER_BAR = 8;

  const MELODY = [
    [["E5", 2], ["D5", 1], ["C5", 1], ["E5", 3], ["A4", 1]],
    [["F5", 2], ["E5", 1], ["D5", 1], ["C5", 3], [null, 1]],
    [["E5", 2], ["G5", 2], ["E5", 1], ["D5", 1], ["C5", 2]],
    [["D5", 4], ["B4", 2], [null, 2]],
    [["E5", 2], ["D5", 1], ["C5", 1], ["E5", 2], ["A5", 2]],
    [["G5", 2], ["F5", 1], ["E5", 1], ["F5", 2], ["A4", 2]],
    [["G4", 2], ["C5", 2], ["E5", 2], ["D5", 2]],
    [["D5", 2], ["C5", 2], ["B4", 4]],
  ];

  const CHORDS = [
    { bass: "A2", arp: ["A3", "C4", "E4", "C4"] },
    { bass: "F2", arp: ["F3", "A3", "C4", "A3"] },
    { bass: "C3", arp: ["C4", "E4", "G4", "E4"] },
    { bass: "G2", arp: ["G3", "B3", "D4", "B3"] },
  ];

  /** Pasa la melodía de compases a una lista de [paso, nota, octavos]. */
  const MELODY_EVENTS = (() => {
    const events = [];
    MELODY.forEach((bar, b) => {
      let step = b * STEPS_PER_BAR;
      bar.forEach(([note, length]) => {
        if (note) events.push({ step, note, length });
        step += length;
      });
    });
    return events;
  })();
  const LOOP_STEPS = MELODY.length * STEPS_PER_BAR;

  let nextStep = 0;
  let nextTime = 0;
  let schedulerId = null;

  /** Programa las notas de un paso (un octavo) del bucle. */
  function scheduleStep(step, time) {
    const bar = Math.floor(step / STEPS_PER_BAR) % MELODY.length;
    const inBar = step % STEPS_PER_BAR;
    const chord = CHORDS[bar % CHORDS.length];

    // Arpegio de acompañamiento, muy bajito
    tone({ note: chord.arp[inBar % 4], start: time, length: EIGHTH * 0.9, wave: "pulse", volume: 0.18, bus: musicBus, decay: 0.7 });

    // Bajo en los tiempos 1 y 3
    if (inBar === 0 || inBar === 4) {
      tone({ note: chord.bass, start: time, length: EIGHTH * 3.6, wave: "triangle", volume: 0.7, bus: musicBus, decay: 0.5 });
    }

    // Melodía
    MELODY_EVENTS.filter((e) => e.step === step % LOOP_STEPS).forEach((e) =>
      tone({ note: e.note, start: time, length: EIGHTH * e.length * 0.95, wave: "pulse", volume: 0.5, bus: musicBus, decay: 0.45 })
    );
  }

  /** Programador con ventana de anticipación: estable aunque la página esté ocupada. */
  function scheduler() {
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(nextStep, nextTime);
      nextStep = (nextStep + 1) % LOOP_STEPS;
      nextTime += EIGHTH;
    }
  }

  function startMusic() {
    if (schedulerId || !ctx) return;
    nextStep = 0;
    nextTime = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(VOLUME.music, ctx.currentTime + 2);
    scheduler();
    schedulerId = window.setInterval(scheduler, 50);
  }

  function stopMusic() {
    if (!schedulerId || !ctx) return;
    window.clearInterval(schedulerId);
    schedulerId = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), ctx.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  }

  /** Baja la música a la mitad (por ejemplo, en la pausa) o la regresa. */
  function duck(on) {
    if (!schedulerId || !ctx) return;
    const target = on ? VOLUME.music * 0.35 : VOLUME.music;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), ctx.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 1.2);
  }

  // ---------- Encender y apagar ----------
  const listeners = [];
  const notify = () => listeners.forEach((listener) => listener({ effects: effectsOn, music: musicOn }));

  /** Enciende o apaga todo el sonido. Al apagar, también se apaga la música. */
  function setEnabled(on) {
    if (on && !ensureContext()) return; // navegador sin Web Audio
    effectsOn = on;
    if (ctx && on && ctx.state === "suspended") ctx.resume();
    if (!on) {
      musicOn = false;
      stopMusic();
    }
    notify();
  }

  function setMusic(on) {
    if (on && !effectsOn) setEnabled(true);
    if (!ctx) return;
    musicOn = on;
    if (on) startMusic();
    else stopMusic();
    notify();
  }

  // Si la pestaña se oculta, el audio se pausa; al volver, sigue.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (effectsOn) ctx.resume();
  });

  App.sound = Object.freeze({
    isSupported: () => Boolean(AudioCtx),
    isEnabled: () => effectsOn,
    isMusicOn: () => musicOn,
    setEnabled,
    toggle: () => setEnabled(!effectsOn),
    setMusic,
    toggleMusic: () => setMusic(!musicOn),
    duck,
    play,
    onChange: (listener) => listeners.push(listener),
  });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
