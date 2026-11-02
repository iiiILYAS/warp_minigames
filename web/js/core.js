// WarP Minigames · core (frame, theme, locale, timer, sounds)  ·  discord.gg/w4p
// Games register with MG.def(name, meta, start) in games.js - start(body, opts, api) calls api.win() / api.fail(reason).
const RES = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'warp_minigames';
const IN_GAME = typeof GetParentResourceName === 'function';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function post(name, data) {
  if (!IN_GAME) { if (window.DemoPost) window.DemoPost(name, data); else (window.DemoQueue = window.DemoQueue || []).push([name, data]); return; }
  fetch(`https://${RES}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) }).catch(() => {});
}

// ---------------------------------------------------------------- locale
let STR = {};
function T(key, ...args) {
  let s = STR[key] != null ? STR[key] : key;
  args.forEach(a => { s = s.replace('%s', a); });
  return s;
}
async function loadLocale(code) {
  try { const r = await fetch(`locales/${code}.json`); if (r.ok) return await r.json(); } catch (e) { }
  return null;
}

// ---------------------------------------------------------------- settings (Config.UI / Config.Cancel, sent by client/main.lua)
const UI = { position: 'center', scale: 1, keyHints: true, sounds: true, volume: 0.6, brand: 'WARP', kicker: 'SECURITY SYSTEM', escape: true };

// ---------------------------------------------------------------- theme (Config.Theme)
const TH = { rgb: '255,255,255', ok: '46,229,157', bad: '255,77,94', cell: '#202328' };
let BASE_THEME = null;
const hexRgb = h => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; let x = m[1]; if (x.length === 3) x = x.split('').map(c => c + c).join(''); const n = parseInt(x, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
function applyTheme(t) {
  if (!t) return;
  const st = document.documentElement.style;
  const set = (v, hex, rgbVar) => { const c = hexRgb(hex); if (!c) return null; st.setProperty(v, `rgb(${c.join(',')})`); if (rgbVar) st.setProperty(rgbVar, c.join(',')); return c; };
  const ac = set('--ac', t.accent, '--ac-rgb');
  if (ac) { TH.rgb = ac.join(','); const lum = (0.299 * ac[0] + 0.587 * ac[1] + 0.114 * ac[2]) / 255; st.setProperty('--on-ac', lum > 0.6 ? '#0d0e10' : '#ffffff'); }
  const ok = set('--ok', t.success, '--ok-rgb'); if (ok) TH.ok = ok.join(',');
  const bad = set('--bad', t.danger, '--bad-rgb'); if (bad) TH.bad = bad.join(',');
  set('--bg', t.background); set('--hd', t.header); set('--sf', t.surface); set('--tx', t.text);
  const mut = set('--mut', t.muted);
  const cell = set('--cell', t.cell);
  if (cell) { TH.cell = `rgb(${cell.join(',')})`; st.setProperty('--cell2', mix(cell, [255, 255, 255], 0.06)); st.setProperty('--cell3', mix(cell, [255, 255, 255], 0.13)); }
  const bg = hexRgb(t.background); if (mut && bg) st.setProperty('--dim', mix(mut, bg, 0.45));
  if (t.backdrop != null) st.setProperty('--veil', Math.max(0, Math.min(1, +t.backdrop)));
  if (t.radius != null) st.setProperty('--r', (+t.radius || 0) + 'px');
}
function applyUI(u) {
  Object.assign(UI, u || {});
  document.documentElement.style.setProperty('--scale', Math.max(0.6, Math.min(1.6, +UI.scale || 1)));
}

// ---------------------------------------------------------------- sounds (WebAudio, no files)
const SFX = {
  ctx: null,
  t(freq, dur, type = 'sine', vol = 0.06, slide = 0) {
    if (!UI.sounds) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), n = c.currentTime, v = vol * (UI.volume == null ? 1 : +UI.volume) * 1.6;
      o.type = type; o.frequency.setValueAtTime(freq, n);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), n + dur);
      g.gain.setValueAtTime(Math.max(0.0002, v), n); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) { }
  },
  tick() { this.t(1650, 0.035, 'square', 0.018); },
  click() { this.t(2400, 0.02, 'square', 0.012); },
  ok() { this.t(880, 0.08, 'triangle', 0.05); setTimeout(() => this.t(1320, 0.1, 'triangle', 0.045), 60); },
  bad() { this.t(190, 0.22, 'sawtooth', 0.05, -90); },
  win() { [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => this.t(f, 0.14, 'triangle', 0.05), i * 70)); },
  lose() { this.t(260, 0.35, 'sawtooth', 0.05, -160); setTimeout(() => this.t(140, 0.4, 'square', 0.03, -60), 120); },
};

// ---------------------------------------------------------------- frame
const root = $('#mg');
const MG = {
  games: {}, order: [], cur: null,
  def(name, meta, start) { MG.games[name] = Object.assign({ start }, meta); MG.order.push(name); },

  open(name, opts, id) {
    const g = MG.games[name];
    if (!g) { post('done', { id, ok: false, reason: 'invalid', time: 0 }); return; }
    if (MG.cur) MG.end(false, true);
    const o = Object.assign({}, g.defaults || {}, opts || {});
    if (o.theme) applyTheme(o.theme);
    const keys = ((typeof g.keys === 'function' ? g.keys(o) : g.keys) || []).map(k => `<span><kbd>${esc(k[0])}</kbd>${esc(T(k[1]))}</span>`).join('')
      + (UI.escape ? `<span><kbd>ESC</kbd>${esc(T('ui.give_up'))}</span>` : '');
    const kicker = o.kicker != null ? o.kicker : UI.kicker === 'auto' ? T('ui.kicker') : UI.kicker;
    const diff = o.difficulty && T('ui.' + o.difficulty) !== 'ui.' + o.difficulty ? `<span class="mg-chip d-${esc(o.difficulty)}">${esc(T('ui.' + o.difficulty))}</span>` : '';
    root.className = 'on pos-' + (UI.position || 'center');
    root.innerHTML = `<div class="mg-veil"></div>
      <div class="mg-wrap">
        <div class="mg-card ${g.wide ? 'wide' : ''}">
          <div class="mg-head">
            <div class="mg-top"><div class="mg-brand">${UI.brand ? `<b>${esc(UI.brand)}</b>` : ''}${kicker ? `<span>${esc(kicker)}</span>` : ''}</div>
              <div class="mg-chips">${o.stage ? `<span class="mg-chip ac">${esc(T('ui.step'))} ${esc(o.stage)}</span>` : ''}${diff}</div></div>
            <div class="mg-title">${esc(o.title || T(name + '.title'))}</div>
            <div class="mg-hint">${esc(o.hint || T(name + '.hint'))}</div>
          </div>
          <div class="mg-stage"><div class="mg-body"></div><div class="mg-res"><span class="mg-ico"></span><b></b><small></small><em></em></div></div>
          <div class="mg-foot"><div class="mg-meta"><span class="mg-round"></span><span class="mg-secs"></span></div><div class="mg-bar"><i></i></div></div>
        </div>
        ${UI.keyHints ? `<div class="mg-keys">${keys}</div>` : ''}
      </div>`;
    const s = { id, name, o, alive: true, off: [], used: 0, real: 0, time: Math.max(3, +o.time || g.time || 20), paused: false };
    const card = $('.mg-card', root), bar = $('.mg-bar', root), fill = $('.mg-bar i', root);
    s.api = {
      card, body: $('.mg-body', root), sfx: SFX,
      round(a, b) { $('.mg-round', root).textContent = b ? `${a} / ${b}` : String(a); },
      hint(t) { $('.mg-hint', root).textContent = t; },
      win() { MG.end(true); },
      fail(why) { MG.end(false, false, why); },
      shake() { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); },
      penalty(sec) { s.used += sec; this.shake(); SFX.bad(); },
      pause(p) { s.paused = !!p; },
      after(ms, fn) { const h = setTimeout(() => s.alive && fn(), ms); s.off.push(() => clearTimeout(h)); return h; },
      every(ms, fn) { const h = setInterval(() => s.alive && fn(), ms); s.off.push(() => clearInterval(h)); return h; },
      on(ev, fn, el = window, o2) { el.addEventListener(ev, fn, o2); s.off.push(() => el.removeEventListener(ev, fn, o2)); },
      key(list, fn, up) {
        const want = list.map(k => k.toLowerCase());
        this.on(up ? 'keyup' : 'keydown', e => { if (!up && e.repeat) return; if (want.includes(e.key.toLowerCase()) || want.includes(e.code.toLowerCase())) { e.preventDefault(); fn(e); } });
      },
      loop(fn) {
        let last = performance.now();
        const f = t => { if (!s.alive) return; const dt = Math.max(0, Math.min(0.05, (t - last) / 1000)); last = t; fn(dt, t); requestAnimationFrame(f); };
        requestAnimationFrame(f);
      },
    };
    MG.cur = s;
    // the clock only runs while the player is actually playing (memorise phases pause it)
    let last = performance.now();
    const secs = $('.mg-secs', root);
    const tick = t => {
      if (!s.alive) return;
      const dt = Math.max(0, Math.min(0.1, (t - last) / 1000)); last = t;
      s.real += dt;
      if (!s.paused) s.used += dt;
      const left = Math.max(0, 1 - s.used / s.time);
      fill.style.transform = `scaleX(${left})`;
      bar.classList.toggle('low', left < 0.25);
      secs.textContent = s.paused ? T('ui.memorise') : Math.max(0, s.time - s.used).toFixed(1) + 's';
      secs.classList.toggle('low', left < 0.25);
      if (left <= 0) return MG.end(false, false, T('why.time'), 'time');
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try { g.start(s.api.body, o, s.api); } catch (e) { console.error(e); MG.end(false, false, T('why.error'), 'error'); }
  },

  // why = text on the result screen, code = machine reason sent back to Lua
  end(ok, silent, why, code) {
    const s = MG.cur;
    if (!s || !s.alive) return;
    s.alive = false;
    s.off.forEach(f => { try { f(); } catch (e) { } });
    if (s.o.theme) setTimeout(() => applyTheme(BASE_THEME), ok ? 960 : 1160);   // a per-game theme ends with its game
    const time = +s.real.toFixed(2);
    const reason = ok ? 'success' : (code || (silent ? 'cancelled' : 'fail'));
    if (silent) { root.className = ''; root.innerHTML = ''; MG.cur = null; post('done', { id: s.id, ok: false, reason, time }); return; }
    const res = $('.mg-res', root);
    res.classList.toggle('bad', !ok);
    $('.mg-ico', res).innerHTML = ok ? '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    $('b', res).textContent = ok ? (s.o.winText || T('ui.win')) : (s.o.failText || T('ui.fail'));
    $('small', res).textContent = ok ? (s.o.winSub || T('ui.win_sub')) : (why || T('ui.fail_sub'));
    $('em', res).textContent = time.toFixed(2) + 's';
    res.classList.add('on');
    ok ? SFX.win() : SFX.lose();
    setTimeout(() => {
      if (MG.cur === s) { root.className = ''; root.innerHTML = ''; MG.cur = null; }
      post('done', { id: s.id, ok: !!ok, reason, time });
    }, ok ? 950 : 1150);
  },
};

// ---------------------------------------------------------------- messages from Lua
window.addEventListener('message', async e => {
  const d = e.data || {};
  if (d.action === 'init') {
    BASE_THEME = d.theme; applyTheme(d.theme); applyUI(d.ui); UI.escape = d.escape !== false;
    STR = Object.assign({}, await loadLocale('en') || {}, d.strings || {});
    document.body.classList.toggle('rtl', d.locale === 'ar');
    document.documentElement.lang = d.locale || 'en';
    document.documentElement.dir = d.locale === 'ar' ? 'rtl' : 'ltr';
  }
  else if (d.action === 'open') { if (window.Gallery) Gallery.hide(); MG.open(d.game, d.opts, d.id); }
  else if (d.action === 'close' && MG.cur) MG.end(false, true, null, 'cancelled');
  else if (d.action === 'gallery' && window.Gallery) Gallery.show(d);
});
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (MG.cur && MG.cur.alive) { if (UI.escape) MG.end(false, false, T('why.cancelled'), 'cancelled'); }
  else if (window.Gallery && Gallery.open) Gallery.close();
});

// tell Lua the page is ready (it answers with 'init')
(async () => {
  const en = await loadLocale('en') || {};
  STR = Object.assign({}, en, STR);        // keep anything 'init' already set
  post('ready', {});
})();
