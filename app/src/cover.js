// Vice Coast Cover Studio — the cover engine. Draws a multi-panel GTA-style poster cover
// (panel grid, sunset/neon grade, bold Anton title with a neon Pacifico subtitle) onto any
// 2D canvas at any of the three post sizes. Pure canvas, no network, no library.

export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};

export const GRADES = {
  sunset: { saturate: 1.25, contrast: 1.08, brightness: 1.02, mode: 'soft-light', top: 'rgba(255,120,40,0.20)', bottom: 'rgba(255,40,120,0.24)' },
  neon: { saturate: 1.5, contrast: 1.12, brightness: 0.98, mode: 'overlay', top: 'rgba(255,0,140,0.22)', bottom: 'rgba(0,220,255,0.20)' },
  vice: { saturate: 1.35, contrast: 1.05, brightness: 0.95, mode: 'soft-light', top: 'rgba(140,0,255,0.22)', bottom: 'rgba(255,0,110,0.20)' },
  golden: { saturate: 1.3, contrast: 1.06, brightness: 1.06, mode: 'soft-light', top: 'rgba(255,180,60,0.24)', bottom: 'rgba(255,120,0,0.16)' },
  noir: { saturate: 0.12, contrast: 1.25, brightness: 0.95, mode: 'overlay', top: 'rgba(20,10,40,0.28)', bottom: 'rgba(0,0,0,0.18)' },
};

export const LAYOUTS = {
  poster: { panels: 4, name: 'Poster 4' },
  hero: { panels: 4, name: 'Hero 4' },
  nine: { panels: 9, name: 'Nine' },
  bleed: { panels: 1, name: 'Full bleed' },
};

/** Returns the export pixel size [w, h] for a size name. */
export function coverSizeFor(sizeName) {
  return SIZES[sizeName] ?? SIZES.square;
}

/** Panel rectangles for a layout, as fractions of the cover, with white gutters between them. */
export function panelRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012); // gutter
  const f = Math.round(Math.min(w, h) * 0.012); // outer frame
  const ix = (x, y, pw, ph) => [x, y, pw, ph];
  if (layout === 'poster') {
    const heroW = Math.round(w * 0.6);
    const colX = heroW + g;
    const colW = w - colX - f;
    const rowH = Math.round((h - 2 * f - 2 * g) / 3);
    return [
      ix(f, f, heroW - f, h - 2 * f),
      ix(colX, f, colW, rowH),
      ix(colX, f + rowH + g, colW, rowH),
      ix(colX, f + 2 * (rowH + g), colW, h - f - (f + 2 * (rowH + g))),
    ];
  }
  if (layout === 'hero') {
    const heroH = Math.round(h * 0.6);
    const rowY = heroH + g;
    const rowH = h - rowY - f;
    const cellW = Math.round((w - 2 * f - 2 * g) / 3);
    return [
      ix(f, f, w - 2 * f, heroH - f),
      ix(f, rowY, cellW, rowH),
      ix(f + cellW + g, rowY, cellW, rowH),
      ix(f + 2 * (cellW + g), rowY, w - f - (f + 2 * (cellW + g)), rowH),
    ];
  }
  if (layout === 'nine') {
    const cellW = Math.round((w - 2 * f - 2 * g) / 3);
    const cellH = Math.round((h - 2 * f - 2 * g) / 3);
    const rects = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = f + c * (cellW + g);
        const y = f + r * (cellH + g);
        const pw = c === 2 ? w - f - x : cellW;
        const ph = r === 2 ? h - f - y : cellH;
        rects.push(ix(x, y, pw, ph));
      }
    }
    return rects;
  }
  return [ix(f, f, w - 2 * f, h - 2 * f)]; // bleed
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan offsets. */
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  const [x, y, pw, ph] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (!photo) {
    drawSunsetPlaceholder(ctx, x, y, pw, ph);
  } else {
    const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
    const scale = base * (panel.zoom || 1);
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const dx = x + (pw - dw) / 2 + (panel.ox || 0) * pw;
    const dy = y + (ph - dh) / 2 + (panel.oy || 0) * ph;
    ctx.filter = `saturate(${grade.saturate}) contrast(${grade.contrast}) brightness(${grade.brightness})`;
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.filter = 'none';
  }
  applyGradeOverlay(ctx, x, y, pw, ph, grade);
  ctx.restore();
}

/** Washes a panel with the grade's sunset/neon tint. */
export function applyGradeOverlay(ctx, x, y, pw, ph, grade) {
  const wash = ctx.createLinearGradient(x, y, x, y + ph);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, pw, ph);
  ctx.restore();
  const shade = ctx.createLinearGradient(x, y, x, y + ph);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(20,4,40,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, pw, ph);
}

/** A sunset placeholder for an empty panel: gradient sky and a glowing sun disc. */
export function drawSunsetPlaceholder(ctx, x, y, pw, ph) {
  const sky = ctx.createLinearGradient(x, y, x, y + ph);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#c62b7e');
  sky.addColorStop(0.75, '#ff7a3d');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, pw, ph);
  drawSunDisc(ctx, x + pw / 2, y + ph * 0.42, Math.min(pw, ph) * 0.22);
}

/** A glowing gradient sun disc, drawn with screen blending so it shines through photos. */
export function drawSunDisc(ctx, cx, cy, r) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.9);
  glow.addColorStop(0, 'rgba(255,190,90,0.85)');
  glow.addColorStop(0.5, 'rgba(255,110,60,0.35)');
  glow.addColorStop(1, 'rgba(255,110,60,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe98a');
  disc.addColorStop(0.55, '#ff9a3d');
  disc.addColorStop(1, '#ff2e63');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Shrinks the title until it fits the cover width, returning the font size in px. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (size > 24 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/** Draws the eyebrow, the big gradient title and the neon script subtitle over the foot. */
export function drawTitleBlock(ctx, w, h, state) {
  const bandH = h * 0.27;
  const bandY = h - bandH;
  const veil = ctx.createLinearGradient(0, bandY - h * 0.08, 0, h);
  veil.addColorStop(0, 'rgba(12,4,28,0)');
  veil.addColorStop(0.45, 'rgba(12,4,28,0.72)');
  veil.addColorStop(1, 'rgba(12,4,28,0.94)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, bandY - h * 0.08, w, bandH + h * 0.08);

  const pad = w * 0.055;
  let cursor = bandY + h * 0.055;
  const eyebrow = (state.eyebrow || '').trim().toUpperCase();
  if (eyebrow) {
    ctx.font = `700 ${Math.round(h * 0.021)}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(h * 0.004)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffb347';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(eyebrow, pad, cursor);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    cursor += h * 0.038;
  }
  const title = (state.title || '').trim().toUpperCase() || 'VICE COAST';
  const titleSize = fitTitleFont(ctx, title, w - pad * 2, Math.round(h * 0.115));
  ctx.font = `${titleSize}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleY = cursor + titleSize * 0.92;
  const ink = ctx.createLinearGradient(pad, titleY - titleSize, pad + ctx.measureText(title).width, titleY);
  ink.addColorStop(0, '#ffe259');
  ink.addColorStop(0.45, '#ff9a3d');
  ink.addColorStop(0.75, '#ff2e88');
  ink.addColorStop(1, '#b537f2');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a2e';
  ctx.lineWidth = Math.max(4, titleSize * 0.07);
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = ink;
  ctx.fillText(title, pad, titleY);
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.round(h * 0.042);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff7ad9';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(h * 0.02);
    ctx.fillText(sub, pad + 2, titleY + subSize * 1.25);
    ctx.shadowBlur = 0;
  }
}

/** Speckles the cover with film grain from a small seeded noise tile. */
export function drawGrain(ctx, w, h) {
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  let seed = 20261120;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens the cover's edges so the title block and panels sit in a poster frame. */
export function drawVignette(ctx, w, h) {
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8,2,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { photos, panels, layout, grade, title, subtitle, eyebrow, grain }
 * photos: array of images (or null); panels[i]: { photo, zoom, ox, oy }.
 */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout || 'poster', w, h);
  ctx.fillStyle = '#f5f0fa'; // white gutters + frame
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos ? state.photos[panel.photo] ?? null : null;
    drawPanelPhoto(ctx, photo, rect, panel, grade);
  });
  // A corner sun: a glowing disc peeking in from the cover's top-right corner,
  // clear of the panels' centres where faces usually sit.
  const sunR = Math.min(w, h) * 0.075;
  drawSunDisc(ctx, w - sunR * 0.35, sunR * 0.35, sunR);
  drawTitleBlock(ctx, w, h, state);
  if (state.grain !== false) drawGrain(ctx, w, h);
  drawVignette(ctx, w, h);
  // Thin black poster frame.
  ctx.strokeStyle = '#12081f';
  ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.006));
  ctx.strokeRect(0, 0, w, h);
}
