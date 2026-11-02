// WarP Minigames · the 16 games  ·  discord.gg/w4p
// Each game gets (body, opts, api) and calls api.win() or api.fail(reason). Defaults here are only a fallback -
// the real values come from Config.Games in config.lua.

const cssVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function roundRect(x, l, t, w, h, r) { if (h <= 0) return; x.beginPath(); if (x.roundRect) x.roundRect(l, t, w, h, r); else x.rect(l, t, w, h); x.fill(); }
// pointer position inside an element in its own (unscaled) pixels - works with Config.UI.scale
function localPoint(el, e, w, h) { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) * (w / r.width), (e.clientY - r.top) * (h / r.height)]; }

// ================================================================ 01 · lock — pins on a sliding track
MG.def('lock', { time: 20, keys: [['E', 'lock.k']], defaults: { pins: 4, speed: 0.85, zone: 0.16 } }, (body, o, api) => {
  body.innerHTML = `<div class="lk"><div class="lk-pins">${'<i></i>'.repeat(o.pins)}</div><div class="lk-track"><div class="lk-zone"></div><div class="lk-cur"></div></div></div>`;
  const pins = [...body.querySelectorAll('.lk-pins i')], zone = body.querySelector('.lk-zone'), cur = body.querySelector('.lk-cur');
  let pin = 0, pos = 0, dir = 1, speed = o.speed, z = [0, 0];
  const place = () => {
    const w = Math.max(0.05, o.zone * (1 - pin * 0.11));
    let s; do { s = rnd(0.08, 0.96 - w); } while (Math.abs(s + w / 2 - pos) < 0.18);
    z = [s, s + w];
    zone.style.left = s * 100 + '%'; zone.style.width = w * 100 + '%';
    pins.forEach((p, i) => p.className = i < pin ? 'done' : i === pin ? 'act' : '');
    api.round(pin + 1, o.pins);
  };
  place();
  api.loop(dt => {
    pos += dir * speed * dt;
    if (pos > 1) { pos = 1; dir = -1; } else if (pos < 0) { pos = 0; dir = 1; }
    cur.style.left = pos * 100 + '%';
  });
  api.key(['e', ' '], () => {
    if (pos >= z[0] && pos <= z[1]) {
      api.sfx.ok(); pin++; speed *= 1.15;
      if (pin >= o.pins) { pins.forEach(p => p.className = 'done'); return api.win(); }
      place();
    } else api.fail(T('why.pin'));
  });
});

// ================================================================ 02 · circle — dot around a ring
MG.def('circle', { time: 20, keys: [['E', 'circle.k']], defaults: { rounds: 4, speed: 190, arc: 46 } }, (body, o, api) => {
  const R = 84, C = 2 * Math.PI * R;
  body.innerHTML = `<div class="cl"><svg viewBox="-112 -112 224 224"><circle class="ring" r="${R}"/><circle class="arc" r="${R}"/><circle class="core" r="58"/><text>1</text><circle class="dot" r="9"/></svg></div>`;
  const arc = body.querySelector('.arc'), dot = body.querySelector('.dot'), num = body.querySelector('text');
  let round = 0, ang = 0, dir = 1, speed = o.speed, a0 = 0, w = o.arc;
  const place = () => {
    w = Math.max(16, o.arc - round * 5);
    do { a0 = rnd(0, 360); } while (Math.abs(((a0 + w / 2 - ang + 540) % 360) - 180) < 70);
    arc.setAttribute('stroke-dasharray', `${C * w / 360} ${C}`);
    arc.setAttribute('transform', `rotate(${a0 - 90})`);
    num.textContent = round + 1; api.round(round + 1, o.rounds);
  };
  place();
  api.loop(dt => {
    ang = (ang + dir * speed * dt + 360) % 360;
    const r = (ang - 90) * Math.PI / 180;
    dot.setAttribute('cx', R * Math.cos(r)); dot.setAttribute('cy', R * Math.sin(r));
  });
  api.key(['e', ' '], () => {
    if ((ang - a0 + 360) % 360 <= w) {
      api.sfx.ok(); round++; dir = -dir; speed *= 1.1;
      if (round >= o.rounds) return api.win();
      place();
    } else api.fail(T('why.arc'));
  });
});

// ================================================================ 03 · skill — press the shown key when the ring meets the circle
MG.def('skill', { time: 22, keys: o => [[(o.keys || ['E']).join(' '), 'skill.k']], defaults: { rounds: 6, speed: 1.25, window: 9, keys: ['E'] } }, (body, o, api) => {
  const TR = 50, START = 106;
  body.innerHTML = `<div class="cl sk"><svg viewBox="-112 -112 224 224"><circle class="band" r="${TR}" stroke-width="${o.window * 2}"/><circle class="core" r="${TR - 14}"/><circle class="target" r="${TR}"/><circle class="shrink" r="${START}"/><text>E</text></svg></div>`;
  const ring = body.querySelector('.shrink'), txt = body.querySelector('text');
  const keys = (o.keys && o.keys.length ? o.keys : ['E']).map(k => String(k).toUpperCase());
  let round = 0, r = START, t = 0, key = 'E', live = false;
  const next = () => {
    key = keys[rint(0, keys.length - 1)]; txt.textContent = key;
    t = 0; r = START; ring.setAttribute('class', 'shrink'); ring.setAttribute('r', r);
    live = true; api.round(round + 1, o.rounds);
  };
  api.loop(dt => {
    if (!live) return;
    t += dt * rnd(0.97, 1.03);
    r = START * (1 - t / o.speed);
    ring.setAttribute('r', Math.max(0, r));
    if (r < TR - o.window - 1) { live = false; ring.setAttribute('class', 'shrink miss'); api.fail(T('why.timing')); }
  });
  api.on('keydown', e => {
    if (!live || e.repeat || !/^[a-z0-9]$/i.test(e.key)) return;
    if (e.key.toUpperCase() !== key) { live = false; ring.setAttribute('class', 'shrink miss'); return api.fail(T('why.key')); }
    if (Math.abs(r - TR) <= o.window) {
      live = false; ring.setAttribute('class', 'shrink hit'); api.sfx.ok(); round++;
      if (round >= o.rounds) return api.after(200, () => api.win());
      api.after(rint(280, 520), next);
    } else { live = false; ring.setAttribute('class', 'shrink miss'); api.fail(T('why.timing')); }
  });
  api.after(350, next);
});

// ================================================================ 04 · thread — hold to rise through the gaps
MG.def('thread', { time: 30, keys: [['SPACE', 'thread.k']], defaults: { gates: 8, gap: 74, speed: 115 } }, (body, o, api) => {
  const W = 340, H = 214;
  body.innerHTML = `<canvas class="cv" width="${W}" height="${H}"></canvas>`;
  const cv = body.querySelector('canvas'), x = cv.getContext('2d'), wall = cssVar('--cell3') || '#363b42', txt = cssVar('--mut') || '#888';
  let y = H / 2, vy = 0, hold = false, passed = 0, started = false;
  const gates = [];
  const spawn = gx => { const gap = Math.max(46, o.gap - passed * 2.5); gates.push({ x: gx, gap, gy: rnd(22 + gap / 2, H - 22 - gap / 2), done: false }); };
  for (let i = 0; i < 3; i++) spawn(W + 10 + i * 150);
  api.round(0, o.gates);
  api.key([' ', 'w', 'arrowup'], () => { hold = true; started = true; });
  api.key([' ', 'w', 'arrowup'], () => { hold = false; }, true);
  api.on('mousedown', () => { hold = true; started = true; }, cv);
  api.on('mouseup', () => { hold = false; });
  api.loop(dt => {
    if (started) {
      vy = hold ? Math.max(vy - 1500 * dt, -230) : Math.min(vy + 760 * dt, 250);
      y += vy * dt;
      for (const g of gates) g.x -= o.speed * dt;
      if (gates.length && gates[0].x < -20) gates.shift();
      const lastX = gates.length ? gates[gates.length - 1].x : 0;
      if (lastX < W - 140 && passed + gates.length < o.gates + 1) spawn(lastX + 150);
    }
    x.clearRect(0, 0, W, H);
    for (const g of gates) {
      x.fillStyle = wall;
      const top = g.gy - g.gap / 2, bot = g.gy + g.gap / 2;
      roundRect(x, g.x - 5, 8, 10, top - 8, 4); roundRect(x, g.x - 5, bot, 10, H - 8 - bot, 4);
      if (!g.done && g.x < 60) { g.done = true; passed++; api.sfx.tick(); api.round(passed, o.gates); if (passed >= o.gates) return api.win(); }
      if (Math.abs(g.x - 60) < 11 && (y - 7 < top || y + 7 > bot)) return api.fail(T('why.wire'));
    }
    if (y < 7 || y > H - 7) return api.fail(T('why.wire'));
    x.shadowColor = `rgba(${TH.rgb},.8)`; x.shadowBlur = 12; x.fillStyle = `rgb(${TH.rgb})`;
    roundRect(x, 53, y - 7, 14, 14, 3); x.shadowBlur = 0;
    if (!started) { x.fillStyle = txt; x.font = '700 11px Inter, Tajawal'; x.textAlign = 'center'; x.fillText(T('thread.start'), W / 2, H - 16); }
  });
});

// ================================================================ 05 · bars — get to the other side
MG.def('bars', { time: 25, keys: [['SPACE', 'bars.k']], defaults: { cols: 8, gap: 58 } }, (body, o, api) => {
  const W = 340, H = 214, cy = H / 2;
  body.innerHTML = `<canvas class="cv" width="${W}" height="${H}"></canvas>`;
  const x = body.querySelector('canvas').getContext('2d'), wall = cssVar('--cell3') || '#363b42';
  const cols = [];
  for (let i = 0; i < o.cols; i++) cols.push({ x: 52 + i * ((W - 80) / (o.cols - 1)), amp: rnd(38, 62), spd: rnd(1.1, 2.3) * (Math.random() < .5 ? -1 : 1), ph: rnd(0, 6.28) });
  let col = -1, px = 18, tx = 18, t = 0, flash = 0;
  const gapY = c => cy + c.amp * Math.sin(t * c.spd + c.ph);
  api.round(0, o.cols);
  api.key([' ', 'arrowright', 'd'], () => {
    if (col >= o.cols - 1) return;
    const c = cols[col + 1];
    if (Math.abs(gapY(c) - cy) < o.gap / 2 - 9) {
      col++; tx = c.x; api.sfx.tick(); api.round(col + 1, o.cols);
      if (col >= o.cols - 1) api.after(260, () => api.win());
    } else { flash = 1; api.fail(T('why.wall')); }
  });
  api.loop(dt => {
    t += dt; px += (tx - px) * Math.min(1, dt * 18); flash = Math.max(0, flash - dt * 3);
    x.clearRect(0, 0, W, H);
    cols.forEach((c, i) => {
      const g = gapY(c), top = g - o.gap / 2, bot = g + o.gap / 2;
      x.fillStyle = i <= col ? `rgba(${TH.rgb},.45)` : wall;
      roundRect(x, c.x - 4, 8, 8, top - 8, 4); roundRect(x, c.x - 4, bot, 8, H - 8 - bot, 4);
    });
    x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(6, cy - 0.5, W - 12, 1);
    const col2 = flash ? TH.bad : TH.rgb;
    x.shadowColor = `rgba(${col2},.8)`; x.shadowBlur = 12; x.fillStyle = `rgb(${col2})`;
    x.beginPath(); x.arc(px, cy, 7, 0, 7); x.fill(); x.shadowBlur = 0;
  });
});

// ================================================================ 06 · remember — memorise the lit tiles
MG.def('remember', { time: 25, keys: [['CLICK', 'key.click']], defaults: { size: 6, rounds: 3, start: 5 } }, (body, o, api) => {
  const N = o.size * o.size;
  body.innerHTML = `<div class="grid" style="grid-template-columns:repeat(${o.size},34px);grid-auto-rows:34px">${'<i></i>'.repeat(N)}</div>`;
  const grid = body.querySelector('.grid'), cells = [...grid.children];
  let round = 0, want = new Set(), got = new Set(), live = false;
  const next = () => {
    live = false; grid.classList.remove('click'); api.pause(true);
    cells.forEach(c => c.className = '');
    want = new Set(shuffle([...Array(N).keys()]).slice(0, Math.min(N - 1, o.start + round))); got = new Set();
    api.round(round + 1, o.rounds); api.hint(T('remember.watch'));
    want.forEach(i => cells[i].className = 'on');
    api.after(1500 + round * 200, () => { cells.forEach(c => c.className = ''); live = true; grid.classList.add('click'); api.pause(false); api.hint(T('remember.click')); });
  };
  cells.forEach((c, i) => c.addEventListener('click', () => {
    if (!live || got.has(i)) return;
    if (!want.has(i)) { c.className = 'bad'; live = false; return api.fail(T('why.tile')); }
    got.add(i); c.className = 'on'; api.sfx.tick();
    if (got.size === want.size) { live = false; api.sfx.ok(); round++; if (round >= o.rounds) return api.win(); api.after(450, next); }
  }));
  next();
});

// ================================================================ 07 · count — how many highlighted tiles?
MG.def('count', { time: 25, keys: [['0-9', 'key.type'], ['ENTER', 'key.confirm']], defaults: { rounds: 3, cols: 7, rows: 6, show: 1500 } }, (body, o, api) => {
  let round = 0, ans = 0, typed = '', asking = false;
  const show = () => {
    asking = false; typed = ''; api.pause(true); api.round(round + 1, o.rounds); api.hint(T('count.hint'));
    const N = o.cols * o.rows; ans = Math.min(N - 4, rint(5, 9 + round * 2));
    const idx = shuffle([...Array(N).keys()]), decoy = rint(6, 11);
    const cls = Array(N).fill('');
    idx.slice(0, ans).forEach(i => cls[i] = 'on');
    idx.slice(ans, ans + decoy).forEach(i => cls[i] = ['c2', 'c3', 'c4'][rint(0, 2)]);
    body.innerHTML = `<div class="grid" style="grid-template-columns:repeat(${o.cols},32px);grid-auto-rows:32px">${cls.map(c => `<i class="${c}"></i>`).join('')}</div>`;
    api.after(o.show, ask);
  };
  const ask = () => {
    asking = true; api.pause(false); api.hint(T('count.type'));
    body.innerHTML = `<div class="ask"><p>${esc(T('count.ask'))}</p><div class="in"></div></div>`;
  };
  api.on('keydown', e => {
    if (!asking) return;
    const box = body.querySelector('.in');
    if (/^[0-9]$/.test(e.key) && typed.length < 2) { typed += e.key; api.sfx.tick(); }
    else if (e.key === 'Backspace') typed = typed.slice(0, -1);
    else if (e.key === 'Enter' && typed) {
      if (+typed === ans) { api.sfx.ok(); round++; if (round >= o.rounds) return api.win(); return show(); }
      return api.fail(T('why.count', ans));
    }
    if (box) box.textContent = typed;
  });
  show();
});

// ================================================================ 08 · find — remember the code, find it in the grid
MG.def('find', { time: 30, wide: true, keys: [['CLICK', 'key.click']], defaults: { rounds: 2, cells: 24, show: 2600, similar: 0.3, slide: false } }, (body, o, api) => {
  const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = () => Array.from({ length: 4 }, () => AB[rint(0, AB.length - 1)]).join('');
  let round = 0, target = '', codes = [], live = false;
  const near = t => { let c; do { const a = t.split(''); a[rint(0, 3)] = AB[rint(0, AB.length - 1)]; c = a.join(''); } while (c === t); return c; };
  const draw = () => { body.innerHTML = `<div class="fd-grid">${codes.map((c, i) => `<b data-i="${i}">${c}</b>`).join('')}</div>`; };
  const show = () => {
    live = false; api.pause(true); api.round(round + 1, o.rounds); api.hint(T('find.watch'));
    target = code();
    body.innerHTML = `<div class="ask"><p>${esc(T('find.label'))}</p><div class="fd-target">${target}</div></div>`;
    api.after(o.show, () => {
      codes = Array.from({ length: o.cells }, () => { let c; do { c = Math.random() < o.similar ? near(target) : code(); } while (c === target); return c; });
      codes[rint(0, o.cells - 1)] = target;
      draw(); live = true; api.pause(false); api.hint(T('find.click'));
    });
  };
  if (o.slide) api.every(1700, () => { if (!live) return; codes.unshift(codes.pop()); draw(); });
  api.on('click', e => {
    const b = e.target.closest('.fd-grid b'); if (!b || !live) return;
    if (codes[+b.dataset.i] === target) { api.sfx.ok(); round++; live = false; if (round >= o.rounds) return api.win(); api.after(300, show); }
    else { b.classList.add('bad'); api.penalty(3); }
  });
  show();
});

// ---------------------------------------------------------------- pipe helpers (N=1 E=2 S=4 W=8)
const PIPE = {
  rot: m => ((m << 1) | (m >> 3)) & 15,
  opp: d => ((d << 2) | (d >> 2)) & 15,
  step: { 1: [-1, 0], 2: [0, 1], 4: [1, 0], 8: [0, -1] },
  svg(m) {
    const seg = { 1: 'M25 25V0', 2: 'M25 25H50', 4: 'M25 25V50', 8: 'M25 25H0' };
    return `<svg viewBox="0 0 50 50"><path d="${[1, 2, 4, 8].filter(b => m & b).map(b => seg[b]).join('')}"/></svg>`;
  },
  // a random simple path from the left edge to the right edge (cells as [r, c])
  path(R, Cn) {
    for (let tries = 0; tries < 300; tries++) {
      const r0 = rint(0, R - 1), path = [[r0, 0]], seen = new Set([r0 + ',0']);
      const dfs = () => {
        const [r, c] = path[path.length - 1];
        if (c === Cn - 1 && path.length >= Cn + 1) return true;
        const moves = shuffle([[0, 1], [0, 1], [-1, 0], [1, 0]]).filter((m, i, a) => a.findIndex(n => n[0] === m[0] && n[1] === m[1]) === i);
        for (const [dr, dc] of moves) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= Cn || seen.has(nr + ',' + nc)) continue;
          seen.add(nr + ',' + nc); path.push([nr, nc]);
          if (dfs()) return true;
          path.pop(); seen.delete(nr + ',' + nc);
        }
        return false;
      };
      if (dfs() && path.length <= R * Cn * 0.7) return path;
    }
    return Array.from({ length: Cn }, (_, c) => [0, c]);
  },
  masks(path) {
    const dir = (a, b) => b[0] < a[0] ? 1 : b[1] > a[1] ? 2 : b[0] > a[0] ? 4 : 8;
    return path.map((p, i) => (i === 0 ? 8 : PIPE.opp(dir(path[i - 1], p))) | (i === path.length - 1 ? 2 : dir(p, path[i + 1])));
  },
  flow(grid, R, Cn, start) {
    const lit = new Set(); const [sr, sc] = start;
    if (!(grid[sr][sc] & 8)) return lit;
    const q = [[sr, sc]]; lit.add(sr + ',' + sc);
    while (q.length) {
      const [r, c] = q.shift(), m = grid[r][c];
      for (const b of [1, 2, 4, 8]) {
        if (!(m & b)) continue;
        const nr = r + PIPE.step[b][0], nc = c + PIPE.step[b][1];
        if (nr < 0 || nr >= R || nc < 0 || nc >= Cn || lit.has(nr + ',' + nc)) continue;
        if (grid[nr][nc] & PIPE.opp(b)) { lit.add(nr + ',' + nc); q.push([nr, nc]); }
      }
    }
    return lit;
  },
};

// ================================================================ 09 · pipes — rotate tiles to connect both nodes
MG.def('pipes', { time: 40, keys: [['CLICK', 'pipes.k']], defaults: { rows: 5, cols: 5 } }, (body, o, api) => {
  const R = o.rows, Cn = o.cols, path = PIPE.path(R, Cn), pm = PIPE.masks(path);
  const grid = Array.from({ length: R }, () => Array.from({ length: Cn }, () => [5, 10, 3, 6, 12, 9, 3, 6][rint(0, 7)]));
  path.forEach((p, i) => grid[p[0]][p[1]] = pm[i]);
  const start = path[0], end = path[path.length - 1];
  for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) for (let k = rint(0, 3); k > 0; k--) grid[r][c] = PIPE.rot(grid[r][c]);
  const ends = () => { const lit = PIPE.flow(grid, R, Cn, start); return { lit, ok: lit.has(end[0] + ',' + end[1]) && (grid[end[0]][end[1]] & 2) }; };
  if (ends().ok) grid[start[0]][start[1]] = PIPE.rot(grid[start[0]][start[1]]);
  body.innerHTML = `<div class="pp" style="grid-template-columns:repeat(${Cn},50px)"></div>`;
  const box = body.querySelector('.pp');
  const draw = () => {
    const { lit, ok } = ends();
    box.innerHTML = grid.flatMap((row, r) => row.map((m, c) => {
      const io = (r === start[0] && c === start[1]) ? ' io in' : (r === end[0] && c === end[1]) ? ' io out' : '';
      return `<div class="t${lit.has(r + ',' + c) ? ' lit' : ''}${io}" data-r="${r}" data-c="${c}">${PIPE.svg(m)}</div>`;
    })).join('');
    return ok;
  };
  draw();
  api.round(T('pipes.round'));
  box.addEventListener('click', e => {
    const t = e.target.closest('.t'); if (!t) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    grid[r][c] = PIPE.rot(grid[r][c]); api.sfx.tick();
    if (draw()) { box.style.pointerEvents = 'none'; api.after(350, () => api.win()); }
  });
});

// ================================================================ 10 · connect — drag the missing tiles in
MG.def('connect', { time: 35, keys: [['DRAG', 'connect.k']], defaults: { rows: 4, cols: 5, missing: 3 } }, (body, o, api) => {
  const R = o.rows, Cn = o.cols, path = PIPE.path(R, Cn), pm = PIPE.masks(path);
  const at = {}; path.forEach((p, i) => at[p[0] + ',' + p[1]] = { m: pm[i], i });
  const holes = shuffle(path.slice(1, -1).map((p, i) => i + 1)).slice(0, Math.min(o.missing, path.length - 2));
  const open = new Set(holes.map(i => path[i][0] + ',' + path[i][1]));
  const decoys = []; while (decoys.length < 2) { const m = [5, 10, 3, 6, 12, 9][rint(0, 5)]; if (!holes.some(h => pm[h] === m)) decoys.push(m); }
  const tray = shuffle(holes.map(h => pm[h]).concat(decoys));
  body.innerHTML = `<div class="cn"><div class="pp" style="grid-template-columns:repeat(${Cn},50px)"></div><div class="cn-tray pp" style="grid-template-columns:repeat(${tray.length},50px)"></div></div>`;
  const box = body.querySelector('.pp'), trayEl = body.querySelector('.cn-tray');
  const draw = () => {
    box.innerHTML = '';
    for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) {
      const k = r + ',' + c, cell = at[k], d = document.createElement('div');
      d.dataset.k = k;
      if (!cell) { d.className = 't'; d.style.opacity = '.35'; d.style.cursor = 'default'; }
      else if (open.has(k)) d.className = 't slot';
      else { d.className = 't lit' + (cell.i === 0 ? ' io in' : cell.i === path.length - 1 ? ' io out' : ''); d.innerHTML = PIPE.svg(cell.m); }
      box.appendChild(d);
    }
  };
  draw();
  trayEl.innerHTML = tray.map((m, i) => `<div class="t" data-i="${i}">${PIPE.svg(m)}</div>`).join('');
  api.round(T('connect.placed', 0, holes.length));
  let drag = null, placed = 0;
  const slotAt = e => document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('slot'));
  api.on('pointerdown', e => {
    const t = e.target.closest('.cn-tray .t'); if (!t || t.classList.contains('used')) return;
    const g = t.cloneNode(true); g.classList.add('cn-ghost'); document.body.appendChild(g);
    drag = { t, g, m: tray[+t.dataset.i] }; g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
  });
  api.on('pointermove', e => {
    if (!drag) return;
    drag.g.style.left = e.clientX + 'px'; drag.g.style.top = e.clientY + 'px';
    box.querySelectorAll('.slot').forEach(s => s.classList.remove('hot'));
    const s = slotAt(e); if (s) s.classList.add('hot');
  });
  api.on('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null; d.g.remove();
    const s = slotAt(e);
    box.querySelectorAll('.slot').forEach(x => x.classList.remove('hot'));
    if (!s) return;
    if (at[s.dataset.k].m === d.m) {
      open.delete(s.dataset.k); d.t.classList.add('used'); placed++; api.sfx.ok(); draw();
      api.round(T('connect.placed', placed, holes.length));
      if (!open.size) api.after(300, () => api.win());
    } else api.penalty(3);
  });
  api.on('pointerup', () => document.querySelectorAll('.cn-ghost').forEach(g => g.remove()));
});

// ================================================================ 11 · wires — connect every wire to its colour
MG.def('wires', { time: 25, keys: [['DRAG', 'wires.k']], defaults: { wires: 5, penalty: 3 } }, (body, o, api) => {
  const W = 360, H = 250, COL = ['#ff4d5e', '#3d8bff', '#ffd23d', '#2ee59d', '#b06bff', '#ff8a3d'];
  const n = Math.max(3, Math.min(6, o.wires | 0));
  const ys = i => 26 + i * ((H - 52) / (n - 1));
  const left = shuffle([...Array(n).keys()]), right = shuffle([...Array(n).keys()]);
  body.innerHTML = `<div class="wr"><svg viewBox="0 0 ${W} ${H}"></svg>${left.map((c, i) => `<div class="end l" data-c="${c}" style="top:${ys(i)}px"><i style="background:${COL[c]}"></i></div>`).join('')}${right.map((c, i) => `<div class="end r" data-c="${c}" style="top:${ys(i)}px"><i style="background:${COL[c]}"></i></div>`).join('')}</div>`;
  const box = body.querySelector('.wr'), svg = box.querySelector('svg');
  const lx = 56, rx = W - 56;
  const curve = (x1, y1, x2, y2) => `M${x1} ${y1}C${x1 + 70} ${y1},${x2 - 70} ${y2},${x2} ${y2}`;
  let drag = null, done = 0;
  api.round(T('wires.left', n));
  api.on('pointerdown', e => {
    const el = e.target.closest('.end.l'); if (!el || el.classList.contains('done')) return;
    const c = +el.dataset.c, y = parseFloat(el.style.top);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('stroke', COL[c]); svg.appendChild(p);
    drag = { el, c, y, p }; el.classList.add('hot'); api.sfx.click();
  }, box);
  api.on('pointermove', e => {
    if (!drag) return;
    const [x, y] = localPoint(box, e, W, H);
    drag.p.setAttribute('d', curve(lx, drag.y, x, y));
  });
  api.on('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null; d.el.classList.remove('hot');
    const tgt = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('r'));
    if (tgt && !tgt.classList.contains('done') && +tgt.dataset.c === d.c) {
      d.p.setAttribute('d', curve(lx, d.y, rx, parseFloat(tgt.style.top)));
      d.el.classList.add('done'); tgt.classList.add('done'); done++; api.sfx.ok();
      api.round(done >= n ? T('wires.left', 0) : T('wires.left', n - done));
      if (done >= n) api.after(300, () => api.win());
    } else {
      d.p.remove();
      if (tgt) { tgt.classList.add('bad'); api.after(350, () => tgt.classList.remove('bad')); api.penalty(o.penalty); }
    }
  });
});

// ================================================================ 12 · knobs — hold the reading inside the target
MG.def('knobs', { time: 30, keys: [['W/S', 'knobs.pressure'], ['A/D', 'knobs.speed']], defaults: { band: 4, hold: 2.6 } }, (body, o, api) => {
  const target = rint(28, 82);
  let p = rint(0, 100), s = rint(0, 100), held = 0, t = 0;
  while (Math.abs(p * 0.75 + s * 0.25 - target) < 15) p = rint(0, 100);
  body.innerHTML = `<div class="kn">
    <div class="kn-val"><span>0%</span><small>${esc(T('knobs.target', target, o.band))}</small></div>
    <div class="kn-hold"><i></i></div>
    <div class="kn-row"><div class="kn-k"><div class="knob" data-k="p"><div class="cap"></div></div>${esc(T('knobs.pressure'))}</div><div class="kn-k"><div class="knob" data-k="s"><div class="cap"></div></div>${esc(T('knobs.speed'))}</div></div></div>`;
  const valEl = body.querySelector('.kn-val'), num = valEl.querySelector('span'), hold = body.querySelector('.kn-hold i');
  const kp = body.querySelector('[data-k=p]'), ks = body.querySelector('[data-k=s]');
  const setK = (el, v) => { el.style.setProperty('--fill', (v * 2.7) + 'deg'); el.querySelector('.cap').style.transform = `rotate(${v * 2.7 - 135}deg)`; };
  const clamp = v => Math.max(0, Math.min(100, v));
  const nudge = (k, d) => { if (k === 'p') p = clamp(p + d); else s = clamp(s + d); api.sfx.tick(); };
  let drag = null;
  [kp, ks].forEach(el => {
    el.addEventListener('pointerdown', e => { drag = { k: el.dataset.k, y: e.clientY }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!drag) return; const d = (drag.y - e.clientY) * 0.45; if (Math.abs(d) >= 1) { nudge(drag.k, Math.round(d)); drag.y = e.clientY; } });
    el.addEventListener('pointerup', () => drag = null);
    el.addEventListener('wheel', e => { e.preventDefault(); nudge(el.dataset.k, e.deltaY < 0 ? 2 : -2); }, { passive: false });
  });
  const keys = {};
  api.on('keydown', e => keys[e.key.toLowerCase()] = true);
  api.on('keyup', e => keys[e.key.toLowerCase()] = false);
  api.round(T('knobs.round'));
  api.loop(dt => {
    t += dt;
    if (keys.w) p = clamp(p + 30 * dt); if (keys.s) p = clamp(p - 30 * dt);
    if (keys.d) s = clamp(s + 30 * dt); if (keys.a) s = clamp(s - 30 * dt);
    const wob = 2.2 * Math.sin(t * 1.4) + 1.3 * Math.sin(t * 3.7);
    const v = Math.round(clamp(p * 0.75 + s * 0.25 + wob));
    const inside = Math.abs(v - target) <= o.band;
    held = inside ? held + dt : Math.max(0, held - dt * 0.6);
    num.textContent = v + '%'; valEl.classList.toggle('in', inside);
    hold.style.width = Math.min(100, held / o.hold * 100) + '%';
    setK(kp, p); setK(ks, s);
    if (held >= o.hold) api.win();
  });
});

// ================================================================ 13 · safe — find every number of the combination
MG.def('safe', { time: 40, keys: [['A/D', 'safe.k1'], ['SPACE', 'safe.k2']], defaults: { digits: 3, tolerance: 1, penalty: 4 } }, (body, o, api) => {
  const N = 100, R = 92;
  let ticks = '';
  for (let i = 0; i < N; i++) {
    const a = (i * 3.6 - 90) * Math.PI / 180, big = i % 10 === 0, r1 = big ? R - 14 : R - 8;
    ticks += `<line class="tk${big ? ' big' : ''}" x1="${(R * Math.cos(a)).toFixed(1)}" y1="${(R * Math.sin(a)).toFixed(1)}" x2="${(r1 * Math.cos(a)).toFixed(1)}" y2="${(r1 * Math.sin(a)).toFixed(1)}"/>`;
    // numbers face outwards, so the one under the marker always reads upright
    if (big) { const tx = ((R - 26) * Math.cos(a)).toFixed(1), ty = ((R - 26) * Math.sin(a)).toFixed(1); ticks += `<text x="${tx}" y="${ty}" transform="rotate(${i * 3.6} ${tx} ${ty})">${i}</text>`; }
  }
  body.innerHTML = `<div class="sf">
    <div class="sf-dial"><div class="sf-mark"></div><svg viewBox="-100 -100 200 200"><circle class="face" r="${R + 6}"/><g class="rot">${ticks}</g><circle class="hub" r="36"/><rect class="ptr" x="-2.5" y="-34" width="5" height="18" rx="2"/></svg></div>
    <div class="sf-row"><span class="sf-led"></span><span class="sf-num">00</span><div class="sf-slots">${'<i></i>'.repeat(o.digits)}</div></div></div>`;
  const rot = body.querySelector('.rot'), led = body.querySelector('.sf-led'), num = body.querySelector('.sf-num'), dial = body.querySelector('.sf-dial');
  const slots = [...body.querySelectorAll('.sf-slots i')];
  let v = rint(0, 99), last = Math.round(v), step = 0;
  const combo = [];
  for (let i = 0; i < o.digits; i++) { let c; do { c = rint(0, 99); } while (Math.min(Math.abs(c - (combo[i - 1] != null ? combo[i - 1] : v)), 100 - Math.abs(c - (combo[i - 1] != null ? combo[i - 1] : v))) < 18); combo.push(c); }
  const dist = (a, b) => { const d = Math.abs(((a % N) + N) % N - b); return Math.min(d, N - d); };
  const cur = () => ((Math.round(v) % N) + N) % N;
  const draw = () => {
    rot.setAttribute('transform', `rotate(${-v * 3.6})`);
    const n = cur(); num.textContent = String(n).padStart(2, '0');
    const d = dist(n, combo[step]), glow = Math.max(0, 1 - d / 14);
    const close = d <= o.tolerance;
    led.style.background = close ? `rgb(${TH.ok})` : glow > 0 ? `rgba(${TH.rgb},${0.15 + glow * 0.85})` : '';
    led.style.boxShadow = close ? `0 0 14px rgba(${TH.ok},.9)` : glow > 0 ? `0 0 ${Math.round(glow * 14)}px rgba(${TH.rgb},${glow * 0.8})` : 'none';
    slots.forEach((s, i) => { s.className = i < step ? 'done' : i === step ? 'act' : ''; s.textContent = i < step ? String(combo[i]).padStart(2, '0') : ''; });
  };
  const turn = d => {
    v += d;
    const n = cur();
    if (n !== last) { last = n; dist(n, combo[step]) <= o.tolerance ? api.sfx.t(3200, 0.03, 'square', 0.03) : api.sfx.click(); draw(); }
    else rot.setAttribute('transform', `rotate(${-v * 3.6})`);
  };
  api.round(T('safe.round', 1, o.digits));
  const keys = {};
  api.on('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.shiftKey) keys.shift = true; });
  api.on('keyup', e => { keys[e.key.toLowerCase()] = false; if (!e.shiftKey) keys.shift = false; });
  api.loop(dt => {
    const sp = keys.shift ? 7 : 18;
    if (keys.a || keys.arrowleft) turn(-sp * dt);
    if (keys.d || keys.arrowright) turn(sp * dt);
  });
  api.on('wheel', e => { e.preventDefault(); turn(e.deltaY < 0 ? 1 : -1); }, dial, { passive: false });
  let drag = null;
  api.on('pointerdown', e => { drag = { x: e.clientX }; dial.setPointerCapture(e.pointerId); }, dial);
  api.on('pointermove', e => { if (!drag) return; const d = (e.clientX - drag.x) / 9; if (Math.abs(d) >= 1) { turn(Math.trunc(d)); drag.x = e.clientX; } }, dial);
  api.on('pointerup', () => drag = null, dial);
  api.key([' ', 'enter', 'e'], () => {
    if (dist(cur(), combo[step]) <= o.tolerance) {
      api.sfx.ok(); step++;
      if (step >= o.digits) { draw(); return api.after(250, () => api.win()); }
      api.round(T('safe.round', step + 1, o.digits)); draw();
    } else api.penalty(o.penalty);
  });
  draw();
});

// ================================================================ 14 · arrows — type the sequence
MG.def('arrows', { time: 18, keys: [['↑ ↓ ← →', 'arrows.k']], defaults: { len: 6, rounds: 3 } }, (body, o, api) => {
  const ICON = { up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M5 12l7 7 7-7', left: 'M19 12H5M12 5l-7 7 7 7', right: 'M5 12h14M12 5l7 7-7 7' };
  const MAP = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
  let round = 0, seq = [], at = 0;
  const next = () => {
    seq = Array.from({ length: Math.min(9, o.len + round) }, () => ['up', 'down', 'left', 'right'][rint(0, 3)]); at = 0;
    body.innerHTML = `<div class="ar"><div class="ar-row">${seq.map((d, i) => `<b class="${i === 0 ? 'act' : ''}"><svg viewBox="0 0 24 24"><path d="${ICON[d]}"/></svg></b>`).join('')}</div></div>`;
    api.round(round + 1, o.rounds);
  };
  api.on('keydown', e => {
    const d = MAP[e.key.toLowerCase()]; if (!d || e.repeat) return;
    e.preventDefault();
    const boxes = body.querySelectorAll('.ar-row b');
    if (!boxes[at]) return;
    if (d !== seq[at]) { boxes[at].className = 'bad'; return api.fail(T('why.input')); }
    boxes[at].className = 'done'; at++; api.sfx.tick();
    if (at < seq.length) boxes[at].className = 'act';
    else { api.sfx.ok(); round++; if (round >= o.rounds) return api.win(); api.after(280, next); }
  });
  next();
});

// ================================================================ 15 · pairs — match every pair
MG.def('pairs', { time: 40, keys: [['CLICK', 'key.click']], defaults: { cols: 4, rows: 4, misses: 0 } }, (body, o, api) => {
  const ICONS = [
    '<path d="M12 2l10 10-10 10L2 12z"/>', '<path d="M12 3l10 18H2z"/>', '<circle cx="12" cy="12" r="9"/>', '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    '<path d="M12 2l2.9 6.5 7.1.7-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.7z"/>', '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
    '<path d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/>', '<path d="M3 6h18v4H3zm0 8h18v4H3z"/>', '<path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z"/>',
    '<path d="M4 20L12 4l8 16-8-5z"/>', '<path d="M12 2a10 10 0 1 0 0 20 6 6 0 0 1 0-20z"/>', '<path d="M4 4h7v7H4zm9 9h7v7h-7z"/>',
  ];
  const n = Math.floor(o.cols * o.rows / 2);
  const deck = shuffle([...Array(n).keys(), ...Array(n).keys()]);
  body.innerHTML = `<div class="pr" style="grid-template-columns:repeat(${o.cols},52px)">${deck.map((v, i) => `<b data-i="${i}"><span class="bk">?</span><span class="fr"><svg viewBox="0 0 24 24">${ICONS[v % ICONS.length]}</svg></span></b>`).join('')}</div>`;
  const cards = [...body.querySelectorAll('.pr b')];
  let first = null, lock = false, found = 0, miss = 0;
  api.round(0, n);
  cards.forEach(c => c.addEventListener('click', () => {
    if (lock || c.classList.contains('open')) return;
    c.classList.add('open'); api.sfx.tick();
    if (first === null) { first = c; return; }
    const a = first; first = null;
    if (deck[+a.dataset.i] === deck[+c.dataset.i]) {
      a.classList.add('got'); c.classList.add('got'); found++; api.sfx.ok(); api.round(found, n);
      if (found >= n) api.after(250, () => api.win());
    } else {
      lock = true; miss++;
      if (o.misses && miss >= o.misses) return api.fail(T('why.misses'));
      api.after(620, () => { a.classList.remove('open'); c.classList.remove('open'); lock = false; });
    }
  }));
});

// ================================================================ 16 · letters — type them before they fall
MG.def('letters', { time: 45, keys: [['A-Z', 'key.type']], defaults: { count: 12, lives: 3, words: ['A', 'B', 'C', 'G', 'K', 'Z', 'GH', 'QX', 'RL', 'VK', 'NX', 'JT', 'W4P'] } }, (body, o, api) => {
  body.innerHTML = `<div class="lt"><div class="lt-box"></div><div class="lt-in"><span></span><em>${esc(T('letters.input'))}</em></div><div class="lt-lives">${'<i></i>'.repeat(o.lives)}</div></div>`;
  const box = body.querySelector('.lt-box'), typedEl = body.querySelector('.lt-in span'), hint = body.querySelector('.lt-in em'), lives = [...body.querySelectorAll('.lt-lives i')];
  let toks = [], typed = '', cleared = 0, lost = 0, spawnT = 0.2, speed = 30;
  api.round(0, o.count);
  const spawn = () => {
    const w = o.words[rint(0, o.words.length - 1)], el = document.createElement('b');
    el.textContent = w; box.appendChild(el);
    toks.push({ w, el, x: rnd(30, 320), y: -18 });
  };
  api.on('keydown', e => {
    if (e.key === 'Backspace') { typed = typed.slice(0, -1); }
    else if (/^[a-z0-9]$/i.test(e.key)) {
      typed += e.key.toUpperCase();
      if (!toks.some(t => t.w.startsWith(typed))) { typed = ''; api.shake(); }
      else {
        const hit = toks.filter(t => t.w === typed).sort((a, b) => b.y - a.y)[0];
        if (hit) {
          hit.el.classList.add('hit'); toks = toks.filter(t => t !== hit); setTimeout(() => hit.el.remove(), 160);
          typed = ''; cleared++; api.sfx.ok(); api.round(cleared, o.count);
          if (cleared >= o.count) return api.win();
        } else api.sfx.tick();
      }
    }
    typedEl.textContent = typed; hint.style.display = typed ? 'none' : '';
  });
  api.loop(dt => {
    spawnT -= dt;
    if (spawnT <= 0 && toks.length < 6 && cleared + toks.length < o.count + 2) { spawn(); spawnT = Math.max(0.75, 1.5 - cleared * 0.06); }
    speed = 30 + cleared * 2.2;
    for (const t of [...toks]) {
      t.y += speed * dt;
      t.el.style.left = t.x + 'px'; t.el.style.top = t.y + 'px';
      if (t.y > 178) {
        toks = toks.filter(x => x !== t); t.el.remove();
        lives[lost] && lives[lost].classList.add('x'); lost++; api.penalty(0);
        if (lost >= o.lives) return api.fail(T('why.firewall'));
      }
    }
  });
});
