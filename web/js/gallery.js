// WarP Minigames · gallery (/minigames)  ·  discord.gg/w4p
const ICON = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  circle: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8"/>',
  skill: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  thread: '<path d="M3 12h4l3-6 4 12 3-6h4"/>',
  bars: '<path d="M6 4v6M6 14v6M12 4v2M12 10v10M18 4v10M18 18v2"/>',
  remember: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/>',
  count: '<path d="M5 8h14M5 16h14M9 4l-2 16M17 4l-2 16"/>',
  find: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  pipes: '<path d="M4 8h6v8h10"/><path d="M4 16h3"/>',
  connect: '<rect x="3" y="9" width="6" height="6" rx="1"/><rect x="15" y="9" width="6" height="6" rx="1"/><path d="M9 12h6" stroke-dasharray="2 2"/>',
  wires: '<path d="M4 6c8 0 8 12 16 12M4 18c8 0 8-12 16-12"/>',
  knobs: '<circle cx="8" cy="12" r="4"/><circle cx="17" cy="12" r="3"/><path d="M8 8v3"/>',
  safe: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v2"/>',
  arrows: '<path d="M12 4v16M5 11l7-7 7 7"/>',
  pairs: '<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/>',
  letters: '<path d="M5 19l5-14 5 14M7 14h6M17 9v10"/>',
};

window.Gallery = {
  open: false, diff: null, last: {},
  el: null,
  show(d) {
    if (!this.diff) this.diff = d.difficulty || 'normal';
    if (d.last) this.last[d.last.game] = d.last.ok;
    this.games = d.games || MG.order;
    if (!this.el) { this.el = document.createElement('div'); this.el.id = 'gal'; document.body.appendChild(this.el); }
    this.render();
    this.el.classList.add('on');
    this.open = true;
  },
  render() {
    const diffs = ['easy', 'normal', 'hard'];
    this.el.innerHTML = `<div class="mg-veil"></div><div class="gl-zoom"><div class="gl-box">
      <div class="gl-head"><div>
          <div class="mg-top"><div class="mg-brand">${UI.brand ? `<b>${esc(UI.brand)}</b>` : ''}<span>${this.games.length} ${esc(T('ui.games'))}</span></div></div>
          <h1>${esc(T('ui.gallery_title'))}</h1><p>${esc(T('ui.gallery_sub'))}</p></div>
        <div class="gl-ctrl"><div class="gl-seg">${diffs.map(k => `<button data-d="${k}" class="${k === this.diff ? 'on' : ''}">${esc(T('ui.' + k))}</button>`).join('')}</div><button class="gl-x" title="${esc(T('ui.gallery_close'))}">✕</button></div></div>
      <div class="gl-grid">${this.games.map((g, i) => {
        const l = this.last[g];
        return `<div class="gl-card" data-g="${g}"><span class="n">${String(i + 1).padStart(2, '0')}</span><svg class="ic" viewBox="0 0 24 24">${ICON[g] || ''}</svg>
          <h3>${esc(T(g + '.title'))}</h3><p>${esc(T(g + '.hint'))}</p>${l != null ? `<span class="last ${l ? 'ok' : 'bad'}">${esc(T(l ? 'ui.passed' : 'ui.failed'))}</span>` : ''}</div>`;
      }).join('')}</div>
      <div class="gl-foot"><span>WARP SCRIPTS</span><span>DISCORD.GG/W4P</span></div></div></div>`;
    this.el.querySelector('.gl-x').onclick = () => this.close();
    this.el.querySelectorAll('.gl-seg button').forEach(b => b.onclick = () => { this.diff = b.dataset.d; SFX.tick(); this.render(); });
    this.el.querySelectorAll('.gl-card').forEach(c => c.onclick = () => { SFX.click(); this.hide(); post('galleryPick', { game: c.dataset.g, difficulty: this.diff }); });
  },
  hide() { if (this.el) this.el.classList.remove('on'); this.open = false; },
  close() { this.hide(); post('galleryClose', {}); },
};
