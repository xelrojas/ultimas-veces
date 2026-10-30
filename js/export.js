/**
 * export.js
 * Genera una imagen PNG de la cuadrícula para descargar o compartir.
 * Se dibuja directo en un <canvas>, sin librerías externas, con el mismo
 * estilo de la página: papel beige, ventana retro y el personaje.
 */
(function (App) {
  "use strict";

  const { CONFIG } = App.data;
  const { TOTAL_WEEKS } = App.life;
  const { formatNumber } = App.language;

  const WIDTH = 1080;
  const OUTER = 56;       // margen de la hoja
  const INNER = 40;       // margen dentro de la ventana
  const BAR = 44;         // alto de la barra de título
  const BORDER = 4;
  const SHADOW = 8;
  const GAP = 3;
  const COLS = CONFIG.WEEKS_PER_YEAR;
  const AVATAR_SCALE = 6;

  const FONT_PIXEL = '"Pixelify Sans", "Courier New", monospace';
  const FONT_SANS = '"Figtree", system-ui, sans-serif';

  /** Lee un color definido como variable CSS en :root. */
  function cssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** Mezcla dos colores hex (igual que color-mix en el CSS). */
  function mix(hexA, hexB, amount) {
    const toRgb = (hex) => {
      const n = parseInt(hex.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const a = toRgb(hexA);
    const b = toRgb(hexB);
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * amount)).join(",")})`;
  }

  /** Corta un texto en líneas que quepan en un ancho dado. */
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  /**
   * @param {{
   *   voice: { name: string },
   *   avatar: object,
   *   livedWeeks: number,
   *   marks: Map<number, { kind: string, category?: string }>,
   *   footer: { headline: string, lines: string[], signature: string, date: string },
   * }} params
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function renderImage({ voice, avatar, stage = "adulto", livedWeeks, marks, footer }) {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const c = {
      paper: cssColor("--paper"),
      panel: cssColor("--panel"),
      empty: cssColor("--week-empty"),
      ink: cssColor("--ink"),
      line: cssColor("--line"),
      soft: cssColor("--ink-soft"),
      faint: cssColor("--ink-faint"),
      accent: cssColor("--accent"),
      accentInk: cssColor("--accent-ink"),
      lived: cssColor("--lived"),
    };
    // Igual que en la página: las semanas vividas se atenúan hacia el panel
    // según --lived-mix (40% de día, 72% de noche).
    const livedShare = parseFloat(cssColor("--lived-mix")) / 100 || 0.4;
    const livedDim = mix(c.lived, c.panel, 1 - livedShare);
    const categoryColor = (category) =>
      cssColor(App.data.CATEGORIES[category]?.cssVar || "--lived");

    // Medidas
    const winX = OUTER;
    const winW = WIDTH - OUTER * 2 - SHADOW;
    const gridW = winW - INNER * 2;
    const cell = (gridW - GAP * (COLS - 1)) / COLS;
    const gridH = CONFIG.YEARS * cell + (CONFIG.YEARS - 1) * GAP;
    const avatarH = App.avatar.SIZE.height * AVATAR_SCALE;
    const headerH = Math.max(avatarH, 120) + 36;
    // El pie (la dedicatoria) se mide antes de crear la imagen para saber su alto.
    const footerLayout = layoutFooter(footer, gridW);
    const footerH = footerLayout.height + 48;
    const winY = OUTER;
    const winH = BAR + INNER + headerH + gridH + footerH;
    const height = winY + winH + SHADOW + OUTER;

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // Hoja
    ctx.fillStyle = c.paper;
    ctx.fillRect(0, 0, WIDTH, height);

    // Ventana con sombra dura
    ctx.fillStyle = c.line;
    ctx.fillRect(winX + SHADOW, winY + SHADOW, winW, winH);
    ctx.fillRect(winX, winY, winW, winH);
    ctx.fillStyle = c.panel;
    ctx.fillRect(winX + BORDER, winY + BORDER, winW - BORDER * 2, winH - BORDER * 2);

    // Barra de título
    ctx.fillStyle = c.accent;
    ctx.fillRect(winX + BORDER, winY + BORDER, winW - BORDER * 2, BAR - BORDER);
    ctx.fillStyle = c.line;
    ctx.fillRect(winX, winY + BAR, winW, BORDER);
    ctx.fillStyle = c.accentInk;
    ctx.font = `500 22px ${FONT_PIXEL}`;
    ctx.textBaseline = "middle";
    ctx.fillText("Tu vida en semanas", winX + 18, winY + BAR / 2 + 2);
    for (let i = 0; i < 3; i += 1) {
      const x = winX + winW - 26 - i * 26;
      ctx.fillStyle = c.line;
      ctx.fillRect(x, winY + 14, 18, 18);
      ctx.fillStyle = c.panel;
      ctx.fillRect(x + 3, winY + 17, 12, 12);
    }

    // Encabezado: personaje, nombre y números
    const contentX = winX + INNER;
    const headerY = winY + BAR + INNER;
    // El personaje con su apariencia actual (niño, joven o adulto según su edad)
    App.avatar.drawAvatar(ctx, avatar, { x: contentX, y: headerY, scale: AVATAR_SCALE, pose: { stage } });

    const textX = contentX + App.avatar.SIZE.width * AVATAR_SCALE + 28;
    const textW = winX + winW - INNER - textX;
    ctx.textBaseline = "top";
    ctx.fillStyle = c.ink;
    ctx.font = `500 50px ${FONT_PIXEL}`;
    const titleLines = wrapText(ctx, `La vida de ${voice.name}`, textW).slice(0, 2);
    titleLines.forEach((line, n) => ctx.fillText(line, textX, headerY + 6 + n * 54));

    ctx.fillStyle = c.soft;
    ctx.font = `400 24px ${FONT_SANS}`;
    const remaining = TOTAL_WEEKS - livedWeeks;
    const weeks = (n) => `${formatNumber(n)} ${n === 1 ? "semana" : "semanas"}`;
    const summary =
      remaining <= 0
        ? `Más de ${weeks(TOTAL_WEEKS)} vividas`
        : `${weeks(livedWeeks)} ${livedWeeks === 1 ? "vivida" : "vividas"} y ${formatNumber(remaining)} por vivir`;
    ctx.fillText(
      summary,
      textX,
      headerY + 18 + titleLines.length * 54
    );

    // Cuadrícula
    const top = headerY + headerH;
    for (let i = 0; i < TOTAL_WEEKS; i += 1) {
      const x = contentX + (i % COLS) * (cell + GAP);
      const y = top + Math.floor(i / COLS) * (cell + GAP);
      const mark = marks.get(i);

      if (mark && mark.kind === "last") ctx.fillStyle = categoryColor(mark.category);
      else if (i < livedWeeks) ctx.fillStyle = livedDim;
      else if (i === livedWeeks) ctx.fillStyle = c.ink;
      else if (mark && mark.kind === "seed") ctx.fillStyle = c.ink;
      else ctx.fillStyle = c.empty;
      ctx.fillRect(x, y, cell, cell);

      // Las semillas son un cuadrito hueco
      if (mark && mark.kind === "seed") {
        ctx.fillStyle = c.panel;
        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
      }
    }

    // Dedicatoria final: separador de cuadritos y textos
    const footerTop = top + gridH + 40;
    for (let x = contentX; x < contentX + gridW; x += 16) {
      ctx.fillStyle = c.accent;
      ctx.fillRect(x, footerTop, 8, 8);
    }
    ctx.textBaseline = "top";
    footerLayout.blocks.forEach((block) => {
      ctx.font = block.font;
      ctx.fillStyle = c[block.color];
      block.lines.forEach((line, n) => ctx.fillText(line, contentX, footerTop + block.y + n * block.lineHeight));
    });

    return canvas;
  }

  /**
   * Acomoda los textos del pie en renglones y calcula su alto.
   * Orden: frase principal, líneas de apoyo, firma y fecha.
   */
  function layoutFooter(footer, width) {
    const measure = document.createElement("canvas").getContext("2d");
    const specs = [
      { text: footer.headline, font: `500 36px ${FONT_PIXEL}`, color: "ink", lineHeight: 46, gapBefore: 40 },
      ...footer.lines.map((text, i) => ({
        text,
        font: `400 24px ${FONT_SANS}`,
        color: "soft",
        lineHeight: 34,
        gapBefore: i === 0 ? 22 : 10,
      })),
      { text: footer.signature, font: `400 26px ${FONT_PIXEL}`, color: "ink", lineHeight: 34, gapBefore: 30 },
      { text: footer.date, font: `400 20px ${FONT_SANS}`, color: "faint", lineHeight: 28, gapBefore: 8 },
    ].filter((spec) => spec.text);

    let y = 0;
    const blocks = specs.map((spec) => {
      measure.font = spec.font;
      const lines = wrapText(measure, spec.text, width);
      y += spec.gapBefore;
      const block = { ...spec, lines, y };
      y += lines.length * spec.lineHeight;
      return block;
    });
    return { blocks, height: y };
  }

  /** Convierte un nombre en un texto seguro para el nombre de archivo. */
  function slugify(text) {
    return (
      text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "persona"
    );
  }

  /** Descarga la imagen como PNG. */
  async function downloadImage(params) {
    const canvas = await renderImage(params);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo crear la imagen.");

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vida-en-semanas-${slugify(params.voice.name)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  App.exporter = Object.freeze({ renderImage, downloadImage });
})((window.VidaEnSemanas = window.VidaEnSemanas || {}));
