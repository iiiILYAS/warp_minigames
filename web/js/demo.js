// browser preview only (never loaded in game): open web/index.html through any local web server
// ?g=<game>&d=<difficulty>&lang=ar&accent=E6B04E&gallery=1
const q = new URLSearchParams(location.search);
document.body.style.background = 'radial-gradient(ellipse at 30% 20%,#2b3138,#0b0d10 70%)';
const THEME = { accent: '#' + (q.get('accent') || 'FFFFFF'), success: '#2EE59D', danger: '#FF4D5E', background: '#0D0E10', header: '#121316', surface: '#17191C', cell: '#202328', text: '#F4F5F7', muted: '#868C96', backdrop: 0.7, radius: 8 };
let demoId = 0;
const sendInit = async () => {
  const lang = q.get('lang') || 'en';
  const strings = await loadLocale(lang) || {};
  window.postMessage({ action: 'init', theme: THEME, ui: { position: 'center', scale: 1, keyHints: true, sounds: true, volume: 0.6, brand: 'WARP', kicker: 'auto' }, escape: true, locale: lang, strings }, '*');
};
window.DemoPost = (name, data) => {
  console.log('[demo]', name, JSON.stringify(data));
  if (name === 'ready') sendInit().then(() => setTimeout(boot, 50));
  if (name === 'galleryPick') MG.open(data.game, { difficulty: data.difficulty }, ++demoId);
  if (name === 'done' && Gallery.el && q.get('gallery')) setTimeout(() => window.postMessage({ action: 'gallery', games: MG.order, last: { game: MG.lastGame, ok: data.ok } }, '*'), 50);
};
(window.DemoQueue || []).forEach(([n, d]) => window.DemoPost(n, d));
const _open = MG.open; MG.open = (n, o, id) => { MG.lastGame = n; _open(n, o, id); };
function boot() {
  const bar = document.createElement('div');
  bar.id = 'demo';
  bar.innerHTML = `<select id="dd"><option>easy</option><option selected>normal</option><option>hard</option></select><button data-gal="1">gallery</button>` + MG.order.map(g => `<button data-g="${g}">${g}</button>`).join('');
  document.body.appendChild(bar);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.gal) return window.postMessage({ action: 'gallery', games: MG.order, difficulty: 'normal' }, '*');
    MG.open(b.dataset.g, { difficulty: $('#dd').value }, ++demoId);
  });
  if (q.get('g')) MG.open(q.get('g'), { difficulty: q.get('d') || 'normal', stage: q.get('stage') || undefined }, ++demoId);
  if (q.get('gallery')) window.postMessage({ action: 'gallery', games: MG.order, difficulty: 'normal' }, '*');
}
