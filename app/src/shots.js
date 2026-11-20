// Fixed scenes for screenshots. `?shot=cover` shows the exported cover alone, full frame,
// drawn by the app itself at the chosen post size; `?shot=editor` shows the editor with
// sample photos loaded. window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, api) {
  const { state, setLayout, setGrade, setSize, loadSamplePhotos, ensureFonts, redraw } = api;
  const title = query.get('caption');
  const subtitle = query.get('subtitle');
  const eyebrow = query.get('eyebrow');
  if (title) { state.title = title; document.getElementById('title').value = title; }
  if (subtitle) { state.subtitle = subtitle; document.getElementById('subtitle').value = subtitle; }
  if (eyebrow) { state.eyebrow = eyebrow; document.getElementById('eyebrow').value = eyebrow; }
  setLayout(query.get('layout') || 'poster');
  setGrade(query.get('grade') || 'sunset');
  if (query.get('size')) setSize(query.get('size'));
  await loadSamplePhotos();
  // Alternate the two samples across the panels so the grid shows several photos.
  state.panels.forEach((panel, i) => { panel.photo = i % 2; });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await ensureFonts();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
