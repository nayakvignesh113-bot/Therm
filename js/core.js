/* Thermo core: namespace, helpers, numerics, plotting, router */
'use strict';
const U = window.U = {
  modules: [], modById: {}, anims: {}, calcs: {}, routes: {}, parts: {
    thermo: { name: 'Thermodynamics', color: 'var(--hot)' },
    heat: { name: 'Heat Transfer', color: 'var(--warm)' },
    mass: { name: 'Mass Transfer', color: 'var(--cool)' },
  }
};
const R = String.raw; window.R = R;

/* ---------- DOM helpers ---------- */
U.$ = (s, r = document) => r.querySelector(s);
U.$$ = (s, r = document) => [...r.querySelectorAll(s)];
U.h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
U.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
U.math = el => {
  if (window.renderMathInElement) {
    try {
      renderMathInElement(el, {
        delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false
      });
    } catch (e) { console.warn(e); }
  } else setTimeout(() => window.renderMathInElement && U.math(el), 400);
};
U.store = {
  get(k, d) { try { const v = localStorage.getItem('thermo.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('thermo.' + k, JSON.stringify(v)); } catch (e) { } }
};

/* ---------- lazy data loading ---------- */
const _loading = {};
U.need = (...keys) => Promise.all(keys.map(k => {
  if (window.D && D[k]) return Promise.resolve(D[k]);
  if (!_loading[k]) _loading[k] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'js/data/' + k + '.js';
    s.onload = () => res(D[k]); s.onerror = () => rej(new Error('data ' + k)); document.head.append(s);
  });
  return _loading[k];
}));

/* ---------- number formatting ---------- */
U.fmt = (x, n = 4) => {
  if (x == null || Number.isNaN(x)) return '—';
  if (typeof x !== 'number') return String(x);
  if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e7)) {
    const [m, e] = x.toExponential(n - 1).split('e');
    return m + '×10<sup>' + (+e) + '</sup>';
  }
  return (+x.toPrecision(n)).toLocaleString('en-US', { maximumFractionDigits: 10 });
};
U.f = (x, n = 4) => { // plain text (for LaTeX)
  if (x == null || Number.isNaN(x)) return '?';
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e7)) { const [m, e] = x.toExponential(n - 1).split('e'); return m + '\\times10^{' + (+e) + '}'; }
  return String(+x.toPrecision(n));
};

/* ---------- numerics ---------- */
U.lerp = (x, x0, x1, y0, y1) => y0 + (y1 - y0) * (x - x0) / (x1 - x0);
U.bsearch = (arr, x) => { // index i with arr[i] <= x < arr[i+1] (ascending)
  let lo = 0, hi = arr.length - 1;
  if (x <= arr[0]) return 0; if (x >= arr[hi]) return hi - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m; else hi = m; }
  return lo;
};
U.interp = (xs, ys, x) => { // linear, ascending or descending xs
  if (xs[0] > xs[xs.length - 1]) { xs = xs.slice().reverse(); ys = ys.slice().reverse(); }
  const i = U.bsearch(xs, x); return U.lerp(x, xs[i], xs[i + 1], ys[i], ys[i + 1]);
};
U.brent = (f, a, b, tol = 1e-10, maxit = 200) => {
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return NaN;
  if (Math.abs(fa) < Math.abs(fb)) { [a, b] = [b, a];[fa, fb] = [fb, fa]; }
  let c = a, fc = fa, mflag = true, d = 0;
  for (let i = 0; i < maxit; i++) {
    if (fb === 0 || Math.abs(b - a) < tol * (1 + Math.abs(b))) return b;
    let s;
    if (fa !== fc && fb !== fc) s = a * fb * fc / ((fa - fb) * (fa - fc)) + b * fa * fc / ((fb - fa) * (fb - fc)) + c * fa * fb / ((fc - fa) * (fc - fb));
    else s = b - fb * (b - a) / (fb - fa);
    const q = (3 * a + b) / 4;
    if (!((s > q && s < b) || (s < q && s > b)) || (mflag && Math.abs(s - b) >= Math.abs(b - c) / 2) || (!mflag && Math.abs(s - b) >= Math.abs(c - d) / 2)) { s = (a + b) / 2; mflag = true; } else mflag = false;
    const fs = f(s); d = c; c = b; fc = fb;
    if (fa * fs < 0) { b = s; fb = fs; } else { a = s; fa = fs; }
    if (Math.abs(fa) < Math.abs(fb)) { [a, b] = [b, a];[fa, fb] = [fb, fa]; }
  }
  return b;
};
// root search: scan for bracket then brent
U.solve = (f, lo, hi, n = 80, tol) => {
  let x0 = lo, f0 = f(lo);
  for (let i = 1; i <= n; i++) {
    const x1 = lo + (hi - lo) * i / n, f1 = f(x1);
    if (isFinite(f0) && isFinite(f1) && f0 * f1 <= 0) return U.brent(f, x0, x1, tol);
    x0 = x1; f0 = f1;
  }
  return NaN;
};
U.solveLog = (f, lo, hi, n = 80) => { const r = U.solve(t => f(Math.exp(t)), Math.log(lo), Math.log(hi), n); return Math.exp(r); };
// error function (Abramowitz–Stegun 7.1.26 refined via series/continued fraction)
U.erf = x => {
  const s = Math.sign(x); x = Math.abs(x);
  if (x < 2.5) { // Taylor series, accurate
    let sum = x, term = x, n = 0;
    while (Math.abs(term) > 1e-16 * Math.abs(sum) && n < 200) { n++; term *= -x * x / n; sum += term / (2 * n + 1); }
    return s * 2 / Math.sqrt(Math.PI) * sum;
  }
  // continued fraction for erfc
  let f = 0; for (let k = 60; k >= 1; k--) f = k / 2 / (x + f);
  return s * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f));
};
U.erfc = x => 1 - U.erf(x);
U.erfinv = y => U.brent(x => U.erf(x) - y, -6, 6, 1e-13);
// Bessel functions J0,J1 (series / asymptotic), I0,I1,K0,K1 (A&S polynomials)
U.J = (n, x) => {
  if (Math.abs(x) < 25) { let sum = 0, t = Math.pow(x / 2, n) / U.fact(n); for (let k = 0; k < 60; k++) { sum += t; t *= -(x * x / 4) / ((k + 1) * (k + 1 + n)); } return sum; }
  const mu = 4 * n * n, w = x - (n / 2 + 0.25) * Math.PI;
  const P = 1 - (mu - 1) * (mu - 9) / (2 * Math.pow(8 * x, 2)), Q = (mu - 1) / (8 * x) - (mu - 1) * (mu - 9) * (mu - 25) / (6 * Math.pow(8 * x, 3));
  return Math.sqrt(2 / (Math.PI * x)) * (P * Math.cos(w) - Q * Math.sin(w));
};
U.erfcx = x => { // exp(x^2) erfc(x)
  if (x < 2.5) return Math.exp(x * x) * U.erfc(x);
  let f = 0; for (let k = 60; k >= 1; k--) f = k / 2 / (x + f); return 1 / Math.sqrt(Math.PI) / (x + f);
};
U.I = (n, x) => { let sum = 0, t = Math.pow(x / 2, n) / U.fact(n); for (let k = 0; k < 400; k++) { sum += t; t *= (x * x / 4) / ((k + 1) * (k + 1 + n)); if (t < 1e-17 * sum) break; } return sum; };
U.K = (n, x) => { // A&S 9.8.5-9.8.8
  if (n === 0) {
    if (x <= 2) { const t = x * x / 4; return -Math.log(x / 2) * U.I(0, x) - 0.57721566 + t * (0.42278420 + t * (0.23069756 + t * (0.03488590 + t * (0.00262698 + t * (0.00010750 + t * 0.0000074))))); }
    const t = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + t * (-0.07832358 + t * (0.02189568 + t * (-0.01062446 + t * (0.00587872 + t * (-0.00251540 + t * 0.00053208))))));
  }
  if (x <= 2) { const t = x * x / 4; return Math.log(x / 2) * U.I(1, x) + (1 / x) * (1 + t * (0.15443144 + t * (-0.67278579 + t * (-0.18156897 + t * (-0.01919402 + t * (-0.00110404 + t * -0.00004686)))))); }
  const t = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + t * (0.23498619 + t * (-0.03655620 + t * (0.01504268 + t * (-0.00780353 + t * (0.00325614 + t * -0.00068245))))));
};
U.fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
// Gaussian elimination with partial pivoting
U.linsolve = (A, b) => {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
};
U.integrate = (f, a, b, n = 200) => { // Simpson
  if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3;
};
U.range = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));

/* ---------- seeded random for problem generators ---------- */
U.rng = seed => {
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  r.seed = seed;
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.num = (a, b, step) => { const n = Math.round((b - a) / step); return +(a + step * r.int(0, n)).toFixed(10); };
  return r;
};

/* ---------- canvas plotting ---------- */
U.cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
U.canvas = (parent, w = 640, h = 380) => {
  const c = U.h('canvas', { class: 'plot' }); parent.append(c);
  const dpr = window.devicePixelRatio || 1;
  const fit = () => {
    const W = Math.min(w, parent.clientWidth || w); const H = W * h / w;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
    const ctx = c.getContext('2d'); ctx.setTransform(dpr * W / w, 0, 0, dpr * W / w, 0, 0); return ctx;
  };
  c.ctx = fit(); c.W = w; c.H = h; c.refit = () => (c.ctx = fit());
  return c;
};
U.niceTicks = (lo, hi, n = 6) => {
  if (!(hi > lo)) { hi = lo + 1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= step0) || 10 * mag;
  const t = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) t.push(+v.toPrecision(12));
  return t;
};
/* opts: {series:[{x:[],y:[],label,color,dash,width,points,fill}], xlabel, ylabel, xlim, ylim, logx, logy, title, marks:[{x,y,label}]} */
U.plot = (cv, o) => {
  const ctx = cv.ctx, W = cv.W, H = cv.H, m = { l: 66, r: 18, t: o.title ? 30 : 14, b: 50 };
  const fg = U.cssVar('--fg'), mut = U.cssVar('--muted'), grid = U.cssVar('--line');
  ctx.clearRect(0, 0, W, H);
  const tx = v => o.logx ? Math.log10(v) : v, ty = v => o.logy ? Math.log10(v) : v;
  let xs = [], ys = [];
  o.series.forEach(s => s.x.forEach((x, i) => { const y = s.y[i]; if (isFinite(x) && isFinite(y) && (!o.logx || x > 0) && (!o.logy || y > 0)) { xs.push(tx(x)); ys.push(ty(y)); } }));
  (o.marks || []).forEach(p => { if (isFinite(p.x) && isFinite(p.y)) { xs.push(tx(p.x)); ys.push(ty(p.y)); } });
  let [x0, x1] = o.xlim ? o.xlim.map(tx) : [Math.min(...xs), Math.max(...xs)];
  let [y0, y1] = o.ylim ? o.ylim.map(ty) : [Math.min(...ys), Math.max(...ys)];
  if (!isFinite(x0)) { x0 = 0; x1 = 1; } if (!isFinite(y0)) { y0 = 0; y1 = 1; }
  if (x1 === x0) { x1 += 1; x0 -= 1; } if (y1 === y0) { y1 += Math.abs(y1) * 0.1 + 1; y0 -= Math.abs(y0) * 0.1 + 1; }
  if (!o.ylim) { const p = (y1 - y0) * 0.06; y0 -= p; y1 += p; }
  const X = v => m.l + (tx(v) - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - (ty(v) - y0) / (y1 - y0) * (H - m.t - m.b);
  ctx.font = '12px Inter, system-ui, sans-serif'; ctx.lineWidth = 1;
  const ticks = (a, b, log) => log ? (() => { const t = []; for (let k = Math.floor(a); k <= Math.ceil(b); k++) t.push(k); return t.filter(k => k >= a - 1e-9 && k <= b + 1e-9); })() : U.niceTicks(a, b);
  ctx.strokeStyle = grid; ctx.fillStyle = mut; ctx.textAlign = 'center';
  ticks(x0, x1, o.logx).forEach(t => {
    const v = o.logx ? Math.pow(10, t) : t, px = X(v); ctx.beginPath(); ctx.moveTo(px, m.t); ctx.lineTo(px, H - m.b); ctx.stroke();
    ctx.fillText(o.logx ? '10^' + t : (+t.toPrecision(6)).toString(), px, H - m.b + 16);
  });
  ctx.textAlign = 'right';
  ticks(y0, y1, o.logy).forEach(t => {
    const v = o.logy ? Math.pow(10, t) : t, py = Y(v); ctx.beginPath(); ctx.moveTo(m.l, py); ctx.lineTo(W - m.r, py); ctx.stroke();
    ctx.fillText(o.logy ? '10^' + t : (+t.toPrecision(6)).toString(), m.l - 6, py + 4);
  });
  ctx.strokeStyle = fg; ctx.strokeRect(m.l, m.t, W - m.l - m.r, H - m.t - m.b);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.font = '600 13px Inter, system-ui, sans-serif';
  if (o.xlabel) ctx.fillText(o.xlabel, (m.l + W - m.r) / 2, H - 12);
  if (o.ylabel) { ctx.save(); ctx.translate(16, (m.t + H - m.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylabel, 0, 0); ctx.restore(); }
  if (o.title) ctx.fillText(o.title, W / 2, 18);
  ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, W - m.l - m.r, H - m.t - m.b); ctx.clip();
  const pal = ['--hot', '--cool', '--warm', '--green', '--violet', '--muted'];
  o.series.forEach((s, k) => {
    const col = s.color || U.cssVar(pal[k % pal.length]);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s.width || 2.2; ctx.setLineDash(s.dash || []);
    if (s.fill) { ctx.globalAlpha = 0.18; ctx.beginPath(); s.x.forEach((x, i) => i ? ctx.lineTo(X(x), Y(s.y[i])) : ctx.moveTo(X(x), Y(s.y[i]))); ctx.lineTo(X(s.x[s.x.length - 1]), Y(s.fillTo ?? (o.logy ? Math.pow(10, y0) : y0))); ctx.lineTo(X(s.x[0]), Y(s.fillTo ?? (o.logy ? Math.pow(10, y0) : y0))); ctx.fill(); ctx.globalAlpha = 1; }
    if (s.points) s.x.forEach((x, i) => { ctx.beginPath(); ctx.arc(X(x), Y(s.y[i]), 3.5, 0, 7); ctx.fill(); });
    else { ctx.beginPath(); let pen = false; s.x.forEach((x, i) => { const y = s.y[i]; if (!isFinite(x) || !isFinite(y)) { pen = false; return; } pen ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); pen = true; }); ctx.stroke(); }
  });
  ctx.setLineDash([]);
  (o.marks || []).forEach(p => {
    ctx.fillStyle = p.color || fg; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r || 5, 0, 7); ctx.fill();
    if (p.label) { ctx.font = '600 12px Inter, system-ui'; ctx.textAlign = 'left'; ctx.fillText(p.label, X(p.x) + 7, Y(p.y) - 7); }
  });
  ctx.restore();
  // legend
  const lab = o.series.filter(s => s.label);
  if (lab.length) {
    ctx.font = '12px Inter, system-ui'; ctx.textAlign = 'left';
    const lw = Math.max(...lab.map(s => ctx.measureText(s.label).width)) + 34;
    let lx = o.legend === 'left' ? m.l + 8 : W - m.r - lw - 6, ly = m.t + 8;
    ctx.fillStyle = U.cssVar('--panel'); ctx.globalAlpha = .85; ctx.fillRect(lx, ly, lw, lab.length * 18 + 6); ctx.globalAlpha = 1;
    lab.forEach((s, i) => {
      const k = o.series.indexOf(s), col = s.color || U.cssVar(pal[k % pal.length]);
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash(s.dash || []); ctx.beginPath(); ctx.moveTo(lx + 6, ly + 13 + i * 18); ctx.lineTo(lx + 24, ly + 13 + i * 18); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = fg; ctx.fillText(s.label, lx + 29, ly + 17 + i * 18);
    });
  }
  cv.map = { X, Y, inv: (px, py) => ({ x: x0 + (px - m.l) / (W - m.l - m.r) * (x1 - x0), y: y0 + (H - m.b - py) / (H - m.t - m.b) * (y1 - y0) }) };
  return cv.map;
};

/* ---------- registration ---------- */
U.addModule = m => { U.modules.push(m); U.modById[m.id] = m; };
U.addAnim = (id, a) => { a.id = id; U.anims[id] = a; };
U.addCalc = (id, c) => { c.id = id; U.calcs[id] = c; };

/* ---------- toast ---------- */
U.toast = msg => { const t = U.h('div', { class: 'toast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); };
