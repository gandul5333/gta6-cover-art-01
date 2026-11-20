// Vice Coast Cover Studio — the editor. Wires the controls to the cover engine (cover.js):
// photo uploads, per-panel crop and zoom, layouts, grades, caption editing and PNG export.
// Photos are read on this machine with FileReader and never uploaded anywhere.
import { drawCoverArt, coverSizeFor, panelRects, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelName = document.getElementById('panelName');
const zoomSlider = document.getElementById('zoom');
const panelPhotoSelect = document.getElementById('panelPhoto');
const thumbsBox = document.getElementById('thumbs');

const state = {
  photos: [], // { img, name, url }
  panels: Array.from({ length: 9 }, (_, i) => ({ photo: i, zoom: 1, ox: 0, oy: 0 })),
  layout: 'poster',
  grade: 'sunset',
  size: 'square',
  title: 'NEON SHORE',
  subtitle: 'Neon nights, golden days',
  eyebrow: 'A COVER STORY · VICE COAST',
  grain: true,
  fillOne: false,
  fillPhoto: 0,
  selected: 0,
};

let fontsReady = false;

/** Loads the bundled display fonts, then repaints so the title uses Anton + Pacifico. */
export async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch { /* fall back to system fonts */ }
  fontsReady = true;
}

/** Loads an image from a URL, resolving once it can be drawn on a canvas. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The state the engine draws: fill-one-photo mode collapses every panel onto one photo. */
export function drawState() {
  const panels = state.panels.map((p, i) => ({
    ...p,
    photo: state.fillOne ? state.fillPhoto : (state.photos[p.photo] ? p.photo : 0),
  }));
  const photos = state.photos.map((p) => p.img);
  return { ...state, panels, photos };
}

export function redraw() {
  drawCoverArt(canvas, drawState());
}

function panelCount() {
  return (LAYOUTS[state.layout] || LAYOUTS.poster).panels;
}

function refreshPanelUI() {
  panelName.textContent = String(state.selected + 1);
  const panel = state.panels[state.selected];
  zoomSlider.value = String(panel.zoom);
  panelPhotoSelect.value = String(panel.photo);
  [...thumbsBox.children].forEach((el, i) => el.classList.toggle('on', i === panel.photo));
}

function refreshPhotoUI() {
  thumbsBox.innerHTML = '';
  state.photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.url;
    thumb.alt = p.name;
    thumb.title = p.name;
    thumb.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      state.fillPhoto = i;
      refreshPanelUI();
      redraw();
    });
    thumbsBox.appendChild(thumb);
  });
  panelPhotoSelect.innerHTML = '';
  state.photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1} · ${p.name}`;
    panelPhotoSelect.appendChild(opt);
  });
  refreshPanelUI();
}

/** Adds already-loaded images as photos, keeping panel assignments in range. */
export function addPhotos(entries) {
  entries.forEach((entry) => state.photos.push(entry));
  if (state.photos.length > 0) state.fillPhoto = 0;
  refreshPhotoUI();
  redraw();
}

/** Loads the two bundled sample photos (made with an image model, free to use). */
export async function loadSamplePhotos() {
  const [boulevard, pier] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  addPhotos([
    { img: boulevard, name: 'boulevard.jpg', url: 'samples/boulevard.jpg' },
    { img: pier, name: 'pier.jpg', url: 'samples/pier.jpg' },
  ]);
  status.textContent = 'Samples loaded — click a panel, drag to crop it.';
}

function setSize(sizeName) {
  state.size = sizeName;
  const [w, h] = coverSizeFor(sizeName);
  canvas.width = w;
  canvas.height = h;
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === sizeName));
  redraw();
}

function setLayout(layout) {
  state.layout = layout;
  state.selected = 0;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  refreshPanelUI();
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === grade));
  redraw();
}

/** Exports the cover at the chosen post size as a PNG download. */
export function exportCover() {
  const [w, h] = coverSizeFor(state.size);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  drawCoverArt(out, drawState());
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-coast-cover-${w}x${h}.png`;
  }, 'image/png');
}

/** Picks the panel under a pointer event, in canvas pixels. */
function panelAtEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < panelCount(); i++) {
    const [rx, ry, rw, rh] = rects[i];
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return i;
  }
  return -1;
}

let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAtEvent(e);
  if (hit < 0) return;
  state.selected = hit;
  refreshPanelUI();
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[state.selected];
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const [, , pw, ph] = rects[state.selected];
  panel.ox += ((e.clientX - lastX) / rect.width) * (canvas.width / pw);
  panel.oy += ((e.clientY - lastY) / rect.height) * (canvas.height / ph);
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
  lastX = e.clientX;
  lastY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  zoomSlider.value = String(panel.zoom);
  redraw();
}, { passive: false });

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  const entries = [];
  for (const file of files) {
    const url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    entries.push({ img: await loadImage(url), name: file.name, url });
  }
  addPhotos(entries);
  status.textContent = `${entries.length} photo${entries.length === 1 ? '' : 's'} loaded.`;
});
document.getElementById('samples').addEventListener('click', () => {
  loadSamplePhotos().catch(() => { status.textContent = 'Could not load the samples.'; });
});
document.getElementById('fillOne').addEventListener('change', (e) => {
  state.fillOne = e.target.checked;
  redraw();
});
panelPhotoSelect.addEventListener('change', (e) => {
  state.panels[state.selected].photo = Number(e.target.value);
  state.fillPhoto = Number(e.target.value);
  refreshPanelUI();
  redraw();
});
document.querySelectorAll('#layouts button').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('#grades button').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('#sizes button').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
zoomSlider.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomSlider.value);
  redraw();
});
document.getElementById('fit').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1; panel.ox = 0; panel.oy = 0;
  refreshPanelUI();
  redraw();
});
document.getElementById('shuffle').addEventListener('click', () => {
  const layouts = Object.keys(LAYOUTS);
  const grades = ['sunset', 'neon', 'vice', 'golden', 'noir'];
  setLayout(layouts[Math.floor(Math.random() * layouts.length)]);
  setGrade(grades[Math.floor(Math.random() * grades.length)]);
});
document.getElementById('grain').addEventListener('change', (e) => {
  state.grain = e.target.checked;
  redraw();
});
document.getElementById('eyebrow').addEventListener('input', (e) => { state.eyebrow = e.target.value; redraw(); });
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('export').addEventListener('click', exportCover);

// For screenshots and debugging: the live state, a repaint, and the export.
window.__viceCoast = { state, redraw, exportCover, setLayout, setGrade, setSize, loadSamplePhotos, ensureFonts };

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state, setLayout, setGrade, setSize, loadSamplePhotos, ensureFonts, redraw,
  });
} else {
  ensureFonts().then(redraw);
  redraw();
}
