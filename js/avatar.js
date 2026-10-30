/**
 * avatar.js
 * Personaje pixel art y escena de la casita.
 *
 * El personaje se arma por capas sobre una cuadrícula de 16 x 20 pixeles:
 *   base (cara, cuerpo) + peinado + lentes.
 * El contorno se calcula solo: cualquier pixel vacío junto a uno pintado
 * se vuelve color tinta. Así cada combinación se ve "pixel art" sin
 * dibujar un contorno por separado.
 *
 * La apariencia la elige la persona; el género no decide nada aquí.
 */
(function (App) {
  "use strict";

  const SPRITE_W = 16;
  const SPRITE_H = 20;
  const MARGIN = 1; // espacio para el contorno
  const FULL_W = SPRITE_W + MARGIN * 2; // 18
  const FULL_H = SPRITE_H + MARGIN * 2; // 22

  const COLORS = Object.freeze({
    ink: "#1E2440",
    mouth: "#B5534A",
    pants: "#2E3A63",
    shoes: "#1E2440",
  });

  // ---------- Opciones que puede elegir la persona ----------
  const OPTIONS = Object.freeze({
    skin: [
      { id: "piel-1", label: "Tono 1", value: "#F6D5B8" },
      { id: "piel-2", label: "Tono 2", value: "#E8B48A" },
      { id: "piel-3", label: "Tono 3", value: "#C98B5E" },
      { id: "piel-4", label: "Tono 4", value: "#9A6440" },
      { id: "piel-5", label: "Tono 5", value: "#6B4429" },
    ],
    hairStyle: [
      { id: "corto", label: "Corto" },
      { id: "largo", label: "Largo" },
      { id: "rizado", label: "Rizado" },
      { id: "chongo", label: "Chongo" },
      { id: "rapado", label: "Rapado" },
    ],
    hairColor: [
      { id: "negro", label: "Negro", value: "#2B1E1A" },
      { id: "castano", label: "Castaño", value: "#6B3E26" },
      { id: "cobrizo", label: "Cobrizo", value: "#B5571D" },
      { id: "rubio", label: "Rubio", value: "#E2B65C" },
      { id: "canoso", label: "Canoso", value: "#B8B6BE" },
    ],
    shirt: [
      { id: "naranja", label: "Naranja", value: "#E8613C" },
      { id: "azul", label: "Azul", value: "#2B5BA8" },
      { id: "verde", label: "Verde", value: "#3E8E6A" },
      { id: "mostaza", label: "Mostaza", value: "#E2A93B" },
      { id: "rosa", label: "Rosa", value: "#D96C8A" },
    ],
  });

  const DEFAULT_AVATAR = Object.freeze({
    skin: "piel-2",
    hairStyle: "corto",
    hairColor: "castano",
    shirt: "azul",
    glasses: false,
  });

  // ---------- Mapas de pixeles ----------
  // S piel · E ojos · B rubor · M boca · C playera · P pantalón · F zapatos
  //
  // Hay tres cuerpos según la edad. La cabeza ocupa las mismas filas (0 a 10)
  // en los tres, así el cabello y los lentes sirven para todos. El cuerpo se
  // dibuja pegado al piso: uno más bajito simplemente empieza más abajo.
  //  - shoulder: fila y columna del hombro derecho (para levantar el brazo)
  //  - hand:     pixel de la mano derecha (se borra al saludar)
  //  - stride:   las dos últimas filas con las piernas abiertas (al caminar)
  const HEAD = [
    "................",
    "................",
    "................",
    ".....SSSSSS.....",
    "....SSSSSSSS....",
    "....SSSSSSSS....",
    "....SSSSSSSS....",
    "....SSESSESS....",
    "....SBSSSSBS....",
    "....SSSMMSSS....",
    ".....SSSSSS.....",
  ];

  const BODIES = Object.freeze({
    adulto: {
      rows: [
        ".......SS.......",
        "...CCCCCCCCCC...",
        "...CCCCCCCCCC...",
        "...CCCCCCCCCC...",
        "...SCCCCCCCCS...",
        "....CCCCCCCC....",
        ".....PPPPPP.....",
        ".....PP..PP.....",
        "....FFF..FFF....",
      ],
      shoulder: [12, 12],
      hand: [15, 12],
      stride: ["....PP....PP....", "...FFF....FFF..."],
    },
    joven: {
      rows: [
        ".......SS.......",
        "...CCCCCCCCCC...",
        "...CCCCCCCCCC...",
        "...SCCCCCCCCS...",
        "....CCCCCCCC....",
        ".....PP..PP.....",
        "....FFF..FFF....",
      ],
      shoulder: [12, 12],
      hand: [14, 12],
      stride: ["....PP....PP....", "...FFF....FFF..."],
    },
    nino: {
      rows: [
        "....CCCCCCCC....",
        "....CCCCCCCC....",
        "....SCCCCCCS....",
        ".....PP..PP.....",
        ".....FF..FF.....",
      ],
      shoulder: [11, 11],
      hand: [13, 11],
      stride: ["....PP....PP....", "....FF....FF...."],
    },
  });

  /** Etapa del cuerpo según la edad. */
  function stageForAge(age) {
    if (age < 13) return "nino";
    if (age < 20) return "joven";
    return "adulto";
  }

  // H cabello. Las filas que no aparecen quedan vacías.
  const HAIR = {
    corto: [
      "................",
      "................",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "....HHHHHHHH....",
      "....HH.HHH.HH...",
      "....H......H....",
    ],
    largo: [
      "................",
      "................",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHH.HH.HHH...",
      "...HH......HH...",
      "...H........H...",
      "...H........H...",
      "...H........H...",
      "...H........H...",
      "...H........H...",
      "...H........H...",
      "...H........H...",
    ],
    rizado: [
      "................",
      ".....HHHHHH.....",
      "...HHHHHHHHHH...",
      "..HHHHHHHHHHHH..",
      "..HHHHHHHHHHHH..",
      "..HHH.HH.HH.HHH.",
      "..HH........HH..",
      "..H..........H..",
    ],
    chongo: [
      "......HHHH......",
      "......HHHH......",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "....HHHHHHHH....",
      "....HH....HH....",
      "....H......H....",
    ],
    rapado: [
      "................",
      "................",
      "................",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "....H......H....",
    ],
  };

  // G armazón · L cristal · E ojo (se repite para que se vea a través del cristal)
  const GLASSES = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....GGGGGG.....",
    ".....LELLEL.....",
    ".....GG..GG.....",
  ];

  // ---------- Utilidades de color ----------
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(hexA, hexB, amount) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
    return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function findOption(list, id) {
    return list.find((o) => o.id === id) || list[0];
  }

  /** Normaliza un avatar: cualquier valor desconocido vuelve al de fábrica. */
  function normalize(avatar = {}) {
    const pick = (list, id, fallback) => (list.some((o) => o.id === id) ? id : fallback);
    return {
      skin: pick(OPTIONS.skin, avatar.skin, DEFAULT_AVATAR.skin),
      hairStyle: pick(OPTIONS.hairStyle, avatar.hairStyle, DEFAULT_AVATAR.hairStyle),
      hairColor: pick(OPTIONS.hairColor, avatar.hairColor, DEFAULT_AVATAR.hairColor),
      shirt: pick(OPTIONS.shirt, avatar.shirt, DEFAULT_AVATAR.shirt),
      glasses: Boolean(avatar.glasses),
    };
  }

  // ---------- Composición del sprite ----------
  /**
   * Pose del personaje. Todos los campos son opcionales.
   * @typedef {{ stage?: "nino"|"joven"|"adulto", blink?: boolean,
   *             wave?: 0|1|2, stride?: boolean }} Pose
   *  - wave: 0 brazo abajo, 1 y 2 son los dos cuadros del saludo.
   *  - stride: piernas abiertas (paso al caminar).
   */

  /**
   * Devuelve una matriz FULL_H x FULL_W con colores (o null si está vacío).
   * Cada combinación de apariencia y pose se calcula una vez y se guarda.
   */
  const spriteCache = new Map();

  function buildSprite(rawAvatar, pose = {}) {
    const avatar = normalize(rawAvatar);
    const stage = BODIES[pose.stage] ? pose.stage : "adulto";
    const wave = pose.wave === 1 || pose.wave === 2 ? pose.wave : 0;
    const key = JSON.stringify([avatar, stage, Boolean(pose.blink), wave, Boolean(pose.stride)]);
    if (spriteCache.has(key)) return spriteCache.get(key);

    const skin = findOption(OPTIONS.skin, avatar.skin).value;
    const hair = findOption(OPTIONS.hairColor, avatar.hairColor).value;
    const shirt = findOption(OPTIONS.shirt, avatar.shirt).value;
    const palette = {
      S: skin,
      E: COLORS.ink,
      K: mix(skin, COLORS.ink, 0.55), // ojo cerrado
      B: mix(skin, "#E0607A", 0.35),
      M: mix(skin, COLORS.mouth, 0.6),
      C: shirt,
      P: COLORS.pants,
      F: COLORS.shoes,
      H: hair,
      G: COLORS.ink,
      L: "#E3EEF2",
    };

    // 1. Mapa de letras: cabeza + cuerpo de la edad, pegado al piso.
    const body = BODIES[stage];
    const map = [...HEAD, ...body.rows].map((row) => [...row]);
    if (pose.stride) {
      map[map.length - 2] = [...body.stride[0]];
      map[map.length - 1] = [...body.stride[1]];
    }
    const set = (r, c, ch) => {
      if (map[r] && c >= 0 && c < 16) map[r][c] = ch;
    };
    const overlay = (rows) =>
      rows.forEach((row, r) => [...row].forEach((ch, c) => ch !== "." && set(r, c, ch)));

    overlay(HAIR[avatar.hairStyle]);
    if (avatar.glasses) overlay(GLASSES);

    // 2. Saludo: la mano baja desaparece y el brazo sube junto a la cabeza.
    if (wave) {
      const [sr, sc] = body.shoulder;
      const [hr, hc] = body.hand;
      set(hr, hc, ".");
      set(sr - 1, sc + 1, "C");
      set(sr - 2, sc + 1, "S");
      set(sr - 3, sc + (wave === 1 ? 2 : 1), "S");
    }

    // 3. Parpadeo: los ojos (también los que se ven tras los lentes) se cierran.
    if (pose.blink) map[7] = map[7].map((ch) => (ch === "E" ? "K" : ch));

    // 4. A pixeles, alineado abajo: un cuerpo más bajo empieza más abajo.
    const offset = FULL_H - MARGIN * 2 - map.length;
    const pixels = Array.from({ length: FULL_H }, () => Array(FULL_W).fill(null));
    map.forEach((row, y) => {
      row.forEach((ch, x) => {
        if (ch !== "." && palette[ch]) pixels[y + offset + MARGIN][x + MARGIN] = palette[ch];
      });
    });

    // 5. Contorno automático
    const filled = pixels.map((row) => row.map(Boolean));
    for (let y = 0; y < FULL_H; y += 1) {
      for (let x = 0; x < FULL_W; x += 1) {
        if (filled[y][x]) continue;
        const touches =
          (y > 0 && filled[y - 1][x]) ||
          (y < FULL_H - 1 && filled[y + 1][x]) ||
          (x > 0 && filled[y][x - 1]) ||
          (x < FULL_W - 1 && filled[y][x + 1]);
        if (touches) pixels[y][x] = COLORS.ink;
      }
    }

    spriteCache.set(key, pixels);
    return pixels;
  }

  /**
   * Dibuja el personaje en un contexto 2D.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} avatar
   * @param {{ x?: number, y?: number, scale?: number, pose?: Pose, flip?: boolean }} [options]
   */
  function drawAvatar(ctx, avatar, { x = 0, y = 0, scale = 1, pose = {}, flip = false } = {}) {
    const pixels = buildSprite(avatar, pose);
    pixels.forEach((row, py) => {
      row.forEach((color, px) => {
        if (!color) return;
        const col = flip ? FULL_W - 1 - px : px;
        ctx.fillStyle = color;
        ctx.fillRect(x + col * scale, y + py * scale, scale, scale);
      });
    });
  }

  /** Pinta el personaje dentro de un <canvas> ajustando su tamaño. */
  function renderAvatarCanvas(canvas, avatar, scale = 4, { pose = {}, flip = false } = {}) {
    if (canvas.width !== FULL_W * scale) canvas.width = FULL_W * scale;
    if (canvas.height !== FULL_H * scale) canvas.height = FULL_H * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAvatar(ctx, avatar, { scale, pose, flip });
  }

  // ---------- Escena de la casita ----------
  const SCENE_W = 96;
  const SCENE_H = 54;
  const GROUND_Y = 44;

  /** Colores de la escena de día. */
  const SCENE_DAY = Object.freeze({
    sky: "#F7ECD6",
    cloud: "#FFF9EE",
    sun: "#F2C453",
    grass: "#8FAE6E",
    grassDark: "#6F9157",
    path: "#D9C29A",
    wall: "#F4D9B0",
    roof: "#C8553D",
    roofDark: "#A84432",
    door: "#7A4A35",
    window: "#F6C453",
    trunk: "#7A4A35",
    leaves: "#4F8A5B",
    leavesLight: "#6FA676",
    chimney: "#A84432",
  });

  /** Colores de la escena de noche: luna, estrellas y ventanas encendidas. */
  const SCENE_NIGHT = Object.freeze({
    sky: "#2A2754",
    cloud: "#5A5478",
    moon: "#F6E7B8",
    star: "#F6E7B8",
    grass: "#3E5A3A",
    grassDark: "#2F4730",
    path: "#6B5A45",
    wall: "#B59C78",
    roof: "#8F3F30",
    roofDark: "#74322A",
    door: "#4A2E22",
    window: "#FFD27A",
    trunk: "#4A2E22",
    leaves: "#2E5A3D",
    leavesLight: "#3D7050",
    chimney: "#74322A",
  });

  const STARS = [[6, 4], [10, 13], [22, 16], [30, 3], [40, 12], [46, 7], [52, 4], [64, 2], [73, 15], [90, 22]];

  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  /** Rectángulo con contorno de 1 pixel color tinta. */
  function box(ctx, color, x, y, w, h) {
    rect(ctx, COLORS.ink, x, y, w, h);
    rect(ctx, color, x + 1, y + 1, w - 2, h - 2);
  }

  /** Círculo pixelado (para nubes, copa del árbol y sol). */
  function blob(ctx, color, cx, cy, r) {
    for (let y = -r; y <= r; y += 1) {
      const half = Math.round(Math.sqrt(r * r - y * y));
      rect(ctx, color, cx - half, cy + y, half * 2 + 1, 1);
    }
  }

  function drawScene(ctx, avatar, night, pose = {}) {
    const SCENE = night ? SCENE_NIGHT : SCENE_DAY;

    // Cielo con sol, o con estrellas y luna menguante
    rect(ctx, SCENE.sky, 0, 0, SCENE_W, SCENE_H);
    if (night) {
      STARS.forEach(([x, y]) => rect(ctx, SCENE.star, x, y, 1, 1));
      blob(ctx, SCENE.moon, 84, 9, 4);
      blob(ctx, SCENE.sky, 86, 8, 3);
    } else {
      blob(ctx, SCENE.sun, 84, 9, 4);
    }

    // Nubes
    [[16, 8, 3], [21, 7, 4], [26, 8, 3], [58, 6, 2], [62, 5, 3], [66, 6, 2]].forEach(
      ([x, y, r]) => blob(ctx, SCENE.cloud, x, y, r)
    );

    // Pasto
    rect(ctx, SCENE.grass, 0, GROUND_Y, SCENE_W, SCENE_H - GROUND_Y);
    rect(ctx, COLORS.ink, 0, GROUND_Y, SCENE_W, 1);
    for (let x = 2; x < SCENE_W; x += 7) rect(ctx, SCENE.grassDark, x, GROUND_Y + 3 + (x % 3), 2, 1);

    // Árbol
    rect(ctx, COLORS.ink, 12, 30, 5, 15);
    rect(ctx, SCENE.trunk, 13, 30, 3, 14);
    blob(ctx, COLORS.ink, 14, 24, 9);
    blob(ctx, SCENE.leaves, 14, 24, 8);
    blob(ctx, SCENE.leavesLight, 11, 21, 3);

    // Chimenea
    box(ctx, SCENE.chimney, 53, 11, 5, 10);

    // Techo escalonado
    const roofTop = 9;
    const roofBottom = 24;
    for (let y = roofTop; y <= roofBottom; y += 1) {
      const half = Math.round((y - roofTop) * 1.15) + 2;
      rect(ctx, COLORS.ink, 47 - half - 1, y, half * 2 + 3, 1);
      if (y < roofBottom) {
        const color = (y - roofTop) % 4 === 3 ? SCENE.roofDark : SCENE.roof;
        rect(ctx, color, 47 - half, y, half * 2 + 1, 1);
      }
    }

    // Casa
    box(ctx, SCENE.wall, 31, 24, 33, 21);

    // Ventanas encendidas
    [[35, 28], [53, 28]].forEach(([x, y]) => {
      box(ctx, SCENE.window, x, y, 8, 7);
      rect(ctx, COLORS.ink, x + 3, y + 1, 1, 5);
      rect(ctx, COLORS.ink, x + 1, y + 3, 6, 1);
    });

    // Puerta y camino
    box(ctx, SCENE.door, 44, 33, 7, 12);
    rect(ctx, SCENE.window, 49, 39, 1, 1);
    rect(ctx, SCENE.path, 44, GROUND_Y + 1, 7, 2);
    rect(ctx, SCENE.path, 45, GROUND_Y + 3, 9, 2);
    rect(ctx, SCENE.path, 47, GROUND_Y + 5, 11, 5);

    // Personaje frente a su casa
    // (bob = 1 sube un pixel: la respiración)
    if (avatar) drawAvatar(ctx, avatar, { x: 68, y: GROUND_Y - FULL_H + 4 - (pose.bob ? 1 : 0), pose });
  }

  /**
   * Pinta la escena completa en un <canvas>.
   * @param {{ night?: boolean, scale?: number }} [options]
   */
  function renderSceneCanvas(canvas, avatar, { night = false, scale = 4, pose = {} } = {}) {
    if (canvas.width !== SCENE_W * scale) canvas.width = SCENE_W * scale;
    if (canvas.height !== SCENE_H * scale) canvas.height = SCENE_H * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawScene(ctx, avatar, night, pose);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  App.avatar = Object.freeze({
    OPTIONS,
    DEFAULT_AVATAR,
    STAGES: Object.freeze(Object.keys(BODIES)),
    SIZE: { width: FULL_W, height: FULL_H },
    stageForAge,
    normalize,
    findOption,
    drawAvatar,
    renderAvatarCanvas,
    renderSceneCanvas,
  });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
