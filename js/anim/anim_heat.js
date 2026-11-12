/* Heat & mass transfer animations */
'use strict';
(() => {
  const { h } = U; const A = U.A; const K = 273.15, SIG = 5.670374e-8;
  const colorbar = (ctx, x, y, w, hgt, lo, hi, unit = '°C') => { for (let i = 0; i < w; i++) { ctx.fillStyle = A.heat(i / w); ctx.fillRect(x + i, y, 1, hgt); } A.text(ctx, U.f(lo, 3) + ' ' + unit, x, y + hgt + 13, { size: 11 }); A.text(ctx, U.f(hi, 3) + ' ' + unit, x + w, y + hgt + 13, { size: 11, align: 'right' }); };
  const outRow = (rows) => rows.map(([x, y]) => `<div><span>${x}</span><b>${y}</b></div>`).join('');

  /* ======================= Three modes ======================= */
  U.addAnim('modes', {
    title: 'The three modes: conduction, convection, radiation', part: 'heat', blurb: 'Lattice vibrations, moving fluid parcels and photons — the microscopic picture behind Fourier, Newton and Stefan–Boltzmann.',
    desc: R`<h3>Conduction</h3><p>Energy passes from more energetic to less energetic particles by collisions (gases, liquids) and lattice vibrations + free electrons (solids): \(q''=-k\,dT/dx\). Metals conduct well because free electrons carry energy; insulators trap still air.</p><h3>Convection</h3><p>Conduction plus bulk fluid motion. Near the wall, heat conducts into a thin boundary layer; the moving fluid carries it away: \(q''=h(T_s-T_\infty)\). <i>Natural</i> convection is driven by buoyancy (hot fluid rises); <i>forced</i> by fans/pumps.</p><h3>Radiation</h3><p>Every body above 0 K emits electromagnetic waves; no medium is needed (sunlight crosses vacuum). \(q''=\varepsilon\sigma(T_s^4-T_{sur}^4)\). Because of the \(T^4\) law, radiation dominates at high temperatures (furnaces, flames).</p><p>Typical h (W/m²K): free convection gases 2–25, liquids 50–1000; forced gases 25–250, liquids 100–20 000; boiling/condensation 2500–100 000.</p>`,
    mount(el) {
      const c = A.ctrl(el), T = A.slider(c, 'Hot-side temperature', 50, 1200, 10, 400, v => v + ' °C');
      const cv = U.canvas(el, 900, 320); const atoms = [], parcels = [], phot = [];
      for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) atoms.push({ i, j, p: Math.random() * 6 });
      for (let i = 0; i < 70; i++) parcels.push({ x: Math.random(), y: Math.random() });
      return A.loop((dt, t) => {
        const ctx = cv.ctx, Th = T.val(); ctx.clearRect(0, 0, 900, 320); const amp = 1 + 5 * (Th / 1200);
        // conduction panel
        A.text(ctx, 'CONDUCTION', 150, 22, { align: 'center', bold: true }); ctx.fillStyle = A.heat(Th / 1200); ctx.fillRect(10, 40, 18, 250); ctx.fillStyle = A.heat(0.05); ctx.fillRect(272, 40, 18, 250);
        atoms.forEach(a => { const f = 1 - a.i / 11, am = 0.5 + amp * f; const x = 40 + a.i * 21 + am * Math.sin(t * 9 + a.p), y = 55 + a.j * 30 + am * Math.cos(t * 11 + a.p * 1.3); ctx.fillStyle = A.heat(0.08 + 0.9 * f * Th / 1200); ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); });
        A.arrow(ctx, 60, 305, 240, 305, U.cssVar('--hot'), 3);
        // convection panel
        const ox = 310; A.text(ctx, 'CONVECTION (natural)', ox + 140, 22, { align: 'center', bold: true }); ctx.fillStyle = A.heat(Th / 1200); ctx.fillRect(ox, 280, 280, 14);
        parcels.forEach(p => { const hot = p.y > 0.55 ? 1 : 0; const vy = 0.18 * (Th / 600) * (p.x < 0.5 ? -1 : 1); const vx = 0.18 * (Th / 600) * (p.y > 0.85 ? 1 : p.y < 0.15 ? -1 : 0); p.y += vy * dt * (p.x < 0.5 ? 1 : 1); p.x += (p.y > 0.85 ? 0.25 : p.y < 0.15 ? -0.25 : 0) * dt * (Th / 600); if (p.y < 0.05) { p.y = 0.05; p.x = Math.min(0.98, p.x + 0.02); } if (p.y > 0.97) { p.y = 0.97; p.x = Math.max(0.02, p.x - 0.02); } if (p.x < 0.5 && p.y < 0.1) p.x += 0.6 * dt; if (p.x > 0.5 && p.y > 0.9) p.x -= 0.6 * dt; p.x = Math.max(0.01, Math.min(0.99, p.x)); const warm = p.x < 0.5 ? 1 - p.y * 0.5 : 0.3 * (1 - p.y); ctx.fillStyle = A.heat(0.1 + 0.8 * warm * Th / 1200); ctx.beginPath(); ctx.arc(ox + 10 + p.x * 260, 50 + (1 - p.y) * 220, 5, 0, 7); ctx.fill(); });
        A.text(ctx, 'hot plate below', ox + 140, 310, { align: 'center', size: 11 });
        // radiation panel
        const rx = 620; A.text(ctx, 'RADIATION', rx + 140, 22, { align: 'center', bold: true }); ctx.fillStyle = A.heat(Th / 1200); ctx.beginPath(); ctx.arc(rx + 60, 165, 40, 0, 7); ctx.fill();
        if (Math.random() < 0.3 + Th / 600) phot.push({ a: Math.random() * 6.283, r: 42, l: 2897.8 / (Th + K) });
        ctx.lineWidth = 2; phot.forEach(p => { p.r += 260 * dt; const x = rx + 60 + p.r * Math.cos(p.a), y = 165 + p.r * Math.sin(p.a); ctx.strokeStyle = p.l < 1.5 ? '#f97316' : p.l < 3 ? '#dc2626' : '#7f1d1d'; ctx.beginPath(); for (let k2 = 0; k2 < 12; k2++) { const rr = p.r - k2 * 2; ctx.lineTo(rx + 60 + rr * Math.cos(p.a) + 3 * Math.sin(k2 * 1.4) * Math.sin(p.a), 165 + rr * Math.sin(p.a) - 3 * Math.sin(k2 * 1.4) * Math.cos(p.a)); } ctx.stroke(); }); for (let i = phot.length - 1; i >= 0; i--) if (phot[i].r > 240) phot.splice(i, 1);
        A.text(ctx, 'Eb = σT⁴ = ' + U.f(SIG * (Th + K) ** 4 / 1000, 3) + ' kW/m²', rx + 140, 305, { align: 'center', size: 12 });
        A.text(ctx, 'λmax = ' + U.f(2897.8 / (Th + K), 3) + ' μm', rx + 140, 290, { align: 'center', size: 12 });
      });
    }
  });

  /* ======================= Composite wall ======================= */
  U.addAnim('wall', {
    title: 'Steady conduction through a composite wall: the resistance analogy', part: 'heat', blurb: 'Change k, thickness and h: watch the temperature profile, heat flux and the thermal-resistance circuit respond.',
    desc: R`<h3>Thermal circuits</h3><p>In steady one-dimensional conduction without generation, the same heat rate flows through every layer: \(\dot Q=\dfrac{T_{\infty,1}-T_{\infty,2}}{R_{conv,1}+\sum L_i/(k_iA)+R_{conv,2}}\). The temperature drop across each element is proportional to its resistance — like voltage across resistors in series. So the <b>steepest slope</b> appears in the layer with the <b>lowest k</b> (insulation), and adding resistance where it is already largest is the most effective way to reduce heat loss.</p><p>The flowing dots represent heat flux: their speed is proportional to \(\dot q''\).</p>`,
    mount(el) {
      const c = A.ctrl(el), k1 = A.slider(c, 'k₁ brick', 0.1, 5, 0.1, 0.7, v => v + ' W/mK'), k2 = A.slider(c, 'k₂ insulation', 0.02, 1, 0.01, 0.05, v => v + ' W/mK'), k3 = A.slider(c, 'k₃ plaster', 0.1, 2, 0.05, 0.4, v => v + ' W/mK'), L2 = A.slider(c, 'Insulation thickness', 0, 0.2, 0.005, 0.05, v => (v * 1000).toFixed(0) + ' mm'), hi = A.slider(c, 'h inside', 2, 100, 1, 10), ho = A.slider(c, 'h outside', 2, 100, 1, 25);
      const cv = U.canvas(el, 880, 400); const read = h('div', { class: 'out' }); el.append(read); let dots = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() }));
      return A.loop(dt => {
        const Ti = 22, To = -5, L = [0.2, L2.val(), 0.02], k = [k1.val(), k2.val(), k3.val()];
        const R = [1 / hi.val(), ...L.map((l, i) => l / k[i]), 1 / ho.val()], Rt = R.reduce((a, b) => a + b), q = (Ti - To) / Rt;
        const T = [Ti]; R.forEach(r => T.push(T[T.length - 1] - q * r));
        const ctx = cv.ctx; ctx.clearRect(0, 0, 880, 400); const x0 = 160, sc = 1800; let x = x0; const xs = [x0];
        const cols = ['#b45309', '#fde68a', '#e5e7eb'];
        L.forEach((l, i) => { ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.6; ctx.fillRect(x, 40, Math.max(l * sc, 0.5), 250); ctx.globalAlpha = 1; x += l * sc; xs.push(x); });
        const Y = t => 270 - (t - To) / (Ti - To) * 210;
        ctx.strokeStyle = U.cssVar('--hot'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, Y(Ti)); ctx.lineTo(x0 - 50, Y(Ti)); ctx.lineTo(x0, Y(T[1])); xs.forEach((xx, i) => { if (i) ctx.lineTo(xx, Y(T[i + 1])); }); ctx.lineTo(x + 50, Y(To)); ctx.lineTo(x + 160, Y(To)); ctx.stroke();
        A.text(ctx, 'inside ' + Ti + ' °C', 30, Y(Ti) - 8, { size: 12 }); A.text(ctx, 'outside ' + To + ' °C', x + 60, Y(To) + 18, { size: 12 });
        T.slice(1, -1).forEach((t, i) => { ctx.fillStyle = U.cssVar('--fg'); ctx.beginPath(); ctx.arc(i === 0 ? x0 : xs[i], Y(t), 4, 0, 7); ctx.fill(); A.text(ctx, U.f(t, 3) + '°', (i === 0 ? x0 : xs[i]) + 4, Y(t) - 8, { size: 11 }); });
        dots.forEach(d => { d.x += q / 40 * dt * 0.3; if (d.x > 1) d.x = 0; ctx.fillStyle = U.cssVar('--hot'); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x0 - 40 + d.x * (x - x0 + 80), 60 + d.y * 210, 2.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
        // circuit
        const cyy = 345; let cx = 60; ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, cyy); ctx.lineTo(cx, cyy); ctx.stroke();
        R.forEach((r, i) => { const w = 40 + 400 * r / Rt; ctx.strokeRect(cx, cyy - 10, w, 20); A.text(ctx, ['R conv,i', 'R brick', 'R insul', 'R plaster', 'R conv,o'][i], cx + w / 2, cyy + 26, { align: 'center', size: 10 }); cx += w + 14; ctx.beginPath(); ctx.moveTo(cx - 14, cyy); ctx.lineTo(cx, cyy); ctx.stroke(); });
        read.innerHTML = outRow([['Heat flux q″', U.fmt(q, 4) + ' W/m²'], ['U-value', U.fmt(1 / Rt, 4) + ' W/m²K'], ['R-value total', U.fmt(Rt, 4) + ' m²K/W'], ['Inner surface T', U.fmt(T[1], 4) + ' °C'], ['Largest resistance', ['inside film', 'brick', 'insulation', 'plaster', 'outside film'][R.indexOf(Math.max(...R))]]]);
      });
    }
  });

  /* ======================= Transient slab (explicit FD) ======================= */
  U.addAnim('transient', {
    title: 'Transient conduction: a slab suddenly quenched (Bi effect)', part: 'heat', blurb: 'Explicit finite-difference solution in real time: compare low-Bi (lumped) and high-Bi (steep gradients) cooling.',
    desc: R`<h3>Biot number decides the shape</h3><p>\(Bi=hL/k\) compares internal conduction resistance \(L/k\) with external convection resistance \(1/h\).</p><ul><li><b>Bi ≪ 1</b> (e.g. a thin aluminium fin in air): the solid is almost uniform — lumped analysis \(T(t)\) applies.</li><li><b>Bi ≫ 1</b> (e.g. steel in agitated water): the surface drops almost instantly to the fluid temperature while the centre lags — large thermal gradients, thermal stresses and the reason thick sections crack in quenching.</li></ul><p>The Fourier number \(Fo=\alpha t/L^2\) is dimensionless time. The animation solves \(\partial T/\partial t=\alpha\,\partial^2T/\partial x^2\) with an explicit scheme (stable for \(\Delta Fo\le\frac{1}{2(1+Bi\,\Delta x/L)}\)) on 41 nodes; the dashed curve shows the lumped prediction for comparison.</p>`,
    mount(el) {
      const c = A.ctrl(el), lb = A.slider(c, 'log₁₀ Bi', -2, 2, 0.1, 0, v => 'Bi = ' + U.f(Math.pow(10, v), 3)), sp = A.slider(c, 'Speed', 0.2, 4, 0.1, 1, v => v + '×'); A.button(c, '↺ Restart', () => reset());
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 460, 380), pl = U.canvas(Rr, 500, 380); const read = h('div', { class: 'out' }); el.append(read);
      const N = 41; let T, Fo, hist, key;
      const reset = () => { T = new Float64Array(N).fill(1); Fo = 0; hist = []; };
      reset();
      return A.loop(dt => {
        const Bi = Math.pow(10, lb.val()); if (key !== Bi) { key = Bi; reset(); }
        const dx = 1 / (N - 1), dFo = 0.45 / (1 / (dx * dx) * (1 + Bi * dx)) * dx * dx;
        const steps = Math.ceil(dt * sp.val() * 0.25 / dFo);
        for (let s = 0; s < Math.min(steps, 4000); s++) { const Tn = T.slice(); const r = dFo / (dx * dx);
          Tn[0] = T[0] + 2 * r * (T[1] - T[0]); for (let i = 1; i < N - 1; i++) Tn[i] = T[i] + r * (T[i + 1] - 2 * T[i] + T[i - 1]); Tn[N - 1] = T[N - 1] + 2 * r * (T[N - 2] - T[N - 1] - Bi * dx * T[N - 1]); T = Tn; Fo += dFo; }
        hist.push([Fo, T[0], T[N - 1]]);
        const ctx = cv.ctx; ctx.clearRect(0, 0, 460, 380);
        for (let i = 0; i < N; i++) { ctx.fillStyle = A.heat(T[i]); const w = 180 / (N - 1); ctx.fillRect(230 + i * w, 60, w + 1, 220); ctx.fillRect(230 - (i + 1) * w, 60, w + 1, 220); }
        ctx.fillStyle = 'rgba(80,150,230,.35)'; ctx.fillRect(20, 40, 30 + 0, 260); ctx.fillRect(410, 40, 30, 260); A.text(ctx, 'fluid', 35, 320, { align: 'center', size: 11 }); A.text(ctx, 'fluid', 425, 320, { align: 'center', size: 11 });
        A.text(ctx, 'centre', 230, 50, { align: 'center', size: 11 }); colorbar(ctx, 130, 340, 200, 10, 0, 1, '(θ*)');
        const xs = U.range(0, 1, N);
        U.plot(pl, { series: [{ x: xs, y: [...T], label: 'θ*(x) now' }, { x: hist.map(h2 => h2[0]).map(f => f / Math.max(Fo, 1e-9)), y: hist.map(h2 => h2[1]), label: 'centre θ₀(t) (x-axis = t/t_now)', color: U.cssVar('--cool'), width: 1.5 }, { x: hist.map(h2 => h2[0] / Math.max(Fo, 1e-9)), y: hist.map(h2 => Math.exp(-Bi * h2[0])), label: 'lumped e^(−Bi·Fo)', dash: [5, 4], color: U.cssVar('--muted'), width: 1.5 }], xlabel: 'x / L   (and normalised time)', ylabel: 'θ* = (T−T∞)/(Ti−T∞)', title: 'Profile and centre history', ylim: [0, 1.02], xlim: [0, 1] });
        read.innerHTML = outRow([['Fo = αt/L²', U.fmt(Fo, 3)], ['Centre θ₀', U.fmt(T[0], 3)], ['Surface θ_s', U.fmt(T[N - 1], 3)], ['Centre − surface', U.fmt(T[0] - T[N - 1], 3)], ['Lumped would give', U.fmt(Math.exp(-Bi * Fo), 3)]]);
        if (T[0] < 0.01) reset();
      });
    }
  });

  /* ======================= Fin ======================= */
  U.addAnim('finanim', {
    title: 'How a fin works: temperature fall-off and efficiency', part: 'heat', blurb: 'Slide mL, k and h: see why long fins waste material and when fins pay off.',
    desc: R`<h3>Fin equation</h3><p>Energy balance on a slice: \(\dfrac{d^2\theta}{dx^2}-m^2\theta=0\), \(m=\sqrt{hP/kA_c}\), \(\theta=T-T_\infty\). For an adiabatic tip \(\theta/\theta_b=\cosh m(L-x)/\cosh mL\). The fin is hottest at its base; far from the base the surface is close to \(T_\infty\) and transfers little heat — so <b>efficiency</b> \(\eta_f=\tanh(mL)/mL\) falls as the fin lengthens. Beyond \(mL\approx 2.5\) almost nothing is gained (\(\tanh 2.5=0.987\)).</p><p>High-k materials (Al, Cu) and thin fins in low-h environments (air) give the best returns; in boiling water (very high h) fins help little.</p>`,
    mount(el) {
      const c = A.ctrl(el), mL = A.slider(c, 'mL', 0.1, 5, 0.05, 1.5), Tb = A.slider(c, 'Base T', 40, 200, 1, 120, v => v + ' °C');
      const cv = U.canvas(el, 880, 330); const read = h('div', { class: 'out' }); el.append(read);
      return A.loop(() => {
        const ml = mL.val(), ctx = cv.ctx; ctx.clearRect(0, 0, 880, 330); const Tinf = 25, tb = Tb.val() - Tinf;
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(20, 30, 60, 200); A.text(ctx, 'wall', 50, 250, { align: 'center', size: 11 });
        for (let i = 0; i < 300; i++) { const x = i / 299, th = Math.cosh(ml * (1 - x)) / Math.cosh(ml); ctx.fillStyle = A.heat(0.1 + 0.85 * th * tb / 175); ctx.fillRect(80 + i * 2.6, 105, 3, 50); }
        for (let i = 0; i < 12; i++) { const x = (i + 0.5) / 12, th = Math.cosh(ml * (1 - x)) / Math.cosh(ml); const len = 6 + 34 * th; A.arrow(ctx, 80 + x * 780, 100, 80 + x * 780, 100 - len, U.cssVar('--hot'), 2); A.arrow(ctx, 80 + x * 780, 160, 80 + x * 780, 160 + len, U.cssVar('--hot'), 2); }
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100, th = Math.cosh(ml * (1 - x)) / Math.cosh(ml); const px = 80 + x * 780, py = 310 - th * 90; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); A.text(ctx, 'θ/θb along the fin', 90, 215, { size: 12, bold: true });
        const eta = Math.tanh(ml) / ml; read.innerHTML = outRow([['Fin efficiency η_f', U.fmt(eta, 3)], ['Tip temperature', U.fmt(Tinf + tb / Math.cosh(ml), 4) + ' °C'], ['Heat vs infinite fin (tanh mL)', U.fmt(Math.tanh(ml), 3)], ['Advice', ml < 1 ? 'fin could be longer' : ml > 2.5 ? 'over-long: wasted material' : 'good design range']]);
      });
    }
  });

  /* ======================= Boundary layer ======================= */
  U.addAnim('bl', {
    title: 'Velocity and thermal boundary layers on a flat plate', part: 'heat', blurb: 'δ grows as √x, transition to turbulence, and how Prandtl number sets the thermal-layer thickness.',
    desc: R`<h3>Boundary layers</h3><p>Viscosity brings fluid to rest at the wall (no-slip). The velocity boundary layer grows downstream: laminar \(\delta\approx 5x/\sqrt{Re_x}\). Heat conducts from the wall into the slow fluid, forming a thermal boundary layer \(\delta_t\). Their ratio is governed by the Prandtl number: \(\delta/\delta_t\approx Pr^{1/3}\).</p><ul><li>Liquid metals (\(Pr\ll1\)): heat diffuses far faster than momentum → thick thermal layer.</li><li>Air (\(Pr\approx0.7\)): similar thicknesses.</li><li>Water (\(Pr\approx 2\!-\!7\)), oils (\(Pr\sim10^2\!-\!10^4\)): very thin thermal layer → large h for a given k.</li></ul><p>Beyond \(Re_{cr}\approx5\times10^5\) the layer becomes turbulent: it thickens rapidly (\(\delta\approx0.37x\,Re_x^{-1/5}\)), mixing raises the local h sharply. The local heat-transfer coefficient \(h_x\propto x^{-1/2}\) is highest at the leading edge.</p>`,
    mount(el) {
      const c = A.ctrl(el), V = A.slider(c, 'Free-stream velocity', 1, 40, 0.5, 15, v => v + ' m/s'), Pr = A.slider(c, 'log₁₀ Pr', -2, 3, 0.1, -0.15, v => 'Pr = ' + U.f(Math.pow(10, v), 3));
      const cv = U.canvas(el, 900, 360); const read = h('div', { class: 'out' }); el.append(read);
      const P = Array.from({ length: 240 }, () => ({ x: Math.random(), y: Math.random() }));
      return A.loop((dt, t) => {
        const ctx = cv.ctx; ctx.clearRect(0, 0, 900, 360); const nu = 1.6e-5, L = 1, ox = 60, W = 800, yb = 300, Hs = 250;
        const Rec = 5e5, xcr = Rec * nu / V.val(), pr = Math.pow(10, Pr.val());
        const d = x => { const Re = V.val() * x * L / nu; return x * L * (Re < Rec ? 5 / Math.sqrt(Re + 1) : 0.37 * Math.pow(Re, -0.2)); };
        const scale = Hs / Math.max(0.02, d(1) * 1.3);
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(ox, yb, W, 10); A.text(ctx, 'heated plate', ox + W / 2, yb + 30, { align: 'center', size: 12 });
        // thermal BL fill
        ctx.fillStyle = 'rgba(234,88,12,.20)'; ctx.beginPath(); ctx.moveTo(ox, yb); for (let i = 0; i <= 200; i++) { const x = i / 200; const dt_ = d(x) / Math.cbrt(pr) * (V.val() * x / nu < Rec ? 1 : 1); ctx.lineTo(ox + x * W, yb - Math.min(Hs, dt_ * scale)); } ctx.lineTo(ox + W, yb); ctx.fill();
        ctx.strokeStyle = U.cssVar('--cool'); ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200; const yy = yb - Math.min(Hs, d(x) * scale); i ? ctx.lineTo(ox + x * W, yy) : ctx.moveTo(ox + x * W, yy); } ctx.stroke();
        if (xcr < L) { ctx.setLineDash([4, 4]); ctx.strokeStyle = U.cssVar('--muted'); ctx.beginPath(); ctx.moveTo(ox + xcr * W, yb); ctx.lineTo(ox + xcr * W, 40); ctx.stroke(); ctx.setLineDash([]); A.text(ctx, 'transition', ox + xcr * W + 4, 50, { size: 11 }); }
        P.forEach(p => { const dd = d(Math.max(p.x, 0.001)) * scale; const yy = p.y * Hs; const lam = V.val() * p.x / nu < Rec; const u = yy > dd ? 1 : lam ? (2 * (yy / dd) - (yy / dd) ** 2) : Math.pow(yy / dd, 1 / 7); p.x += (0.05 + 0.25 * u) * dt * (V.val() / 15); if (!lam && yy < dd) p.y += (Math.random() - 0.5) * 0.02; p.y = Math.max(0.005, Math.min(1, p.y)); if (p.x > 1) { p.x = 0; p.y = Math.random(); } const inT = yy < d(p.x) / Math.cbrt(pr) * scale; ctx.fillStyle = inT ? U.cssVar('--hot') : U.cssVar('--cool'); ctx.beginPath(); ctx.arc(ox + p.x * W, yb - yy, 2.4, 0, 7); ctx.fill(); });
        // velocity profile at x=0.7
        const xp = 0.7, dd = d(xp) * scale, lam = V.val() * xp / nu < Rec; ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const yy = i / 40 * Math.min(Hs, dd * 1.4); const u = yy > dd ? 1 : lam ? 2 * yy / dd - (yy / dd) ** 2 : Math.pow(yy / dd, 1 / 7); const px = ox + xp * W + u * 70, py = yb - yy; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); A.text(ctx, 'u(y)', ox + xp * W + 74, yb - Math.min(Hs, dd * 1.4) - 4, { size: 11 });
        A.text(ctx, 'blue line: velocity BL δ   ·   orange region: thermal BL δt   (vertical scale exaggerated)', 450, 22, { align: 'center', size: 12 });
        const ReL = V.val() * L / nu; read.innerHTML = outRow([['Re_L (L = 1 m, air)', U.fmt(ReL, 3)], ['x_cr', xcr < L ? U.fmt(xcr, 3) + ' m' : '> L (all laminar)'], ['δ at x = 0.5 m', U.fmt(d(0.5) * 1000, 3) + ' mm'], ['δ/δt ≈ Pr^(1/3)', U.fmt(Math.cbrt(pr), 3)]]);
      });
    }
  });

  /* ======================= Developing pipe flow ======================= */
  U.addAnim('pipe', {
    title: 'Internal flow: hydrodynamic entry region and fully developed profiles', part: 'heat', blurb: 'Uniform inlet → parabolic laminar profile, or flat turbulent profile; heating along the tube.',
    desc: R`<h3>Entry length and fully developed flow</h3><p>At the tube inlet the velocity is uniform; boundary layers grow from the wall until they meet at the centreline after the hydrodynamic entry length \(L_h\approx0.05\,Re\,D\) (laminar) or \(\approx10D\) (turbulent). Downstream the laminar profile is parabolic, \(u/u_{max}=1-(r/R)^2\), with \(u_{max}=2V_{avg}\); the turbulent profile is much flatter (≈ 1/7-power law).</p><p>Heat transfer is highest in the entry region (thin boundary layers) and settles to a constant Nu in the fully developed region: \(Nu=3.66\) (constant wall T) or \(4.36\) (constant flux) for laminar flow. The fluid's mean temperature rises along the tube exponentially towards the wall temperature when \(T_s\) is constant.</p>`,
    mount(el) {
      const c = A.ctrl(el), reg = A.select(c, 'Regime', [['lam', 'Laminar (Re = 1000)'], ['tur', 'Turbulent (Re = 50 000)']], 'lam');
      const cv = U.canvas(el, 900, 300); const P = Array.from({ length: 300 }, () => ({ x: Math.random(), r: Math.random() * 2 - 1 }));
      return A.loop(dt => {
        const ctx = cv.ctx; ctx.clearRect(0, 0, 900, 300); const ox = 40, W = 820, cy = 150, R = 90, Le = reg.value === 'lam' ? 0.55 : 0.15;
        const prof = (x, r) => { const f = Math.min(1, x / Le), a = Math.abs(r); if (reg.value === 'lam') { const dlt = Math.max(0.02, f); const core = 1 / (1 - 2 * dlt / 3 * 1); const uw = a > 1 - dlt ? (1 - a) / dlt * (2 - (1 - a) / dlt) : 1; return (f < 1 ? uw * (1 + dlt) : 2 * (1 - a * a)); } return f < 1 ? (a > 1 - f * 0.3 ? Math.pow((1 - a) / (f * 0.3), 1 / 7) : 1) * 1.1 : 1.22 * Math.pow(Math.max(0, 1 - a), 1 / 7); };
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(ox, cy - R - 8, W, 8); ctx.fillRect(ox, cy + R, W, 8);
        for (let i = 0; i < 80; i++) { const x = i / 80; ctx.fillStyle = A.heat(0.25 + 0.5 * (1 - Math.exp(-3 * x))); ctx.globalAlpha = 0.25; ctx.fillRect(ox + x * W, cy - R, W / 80 + 1, 2 * R); ctx.globalAlpha = 1; }
        P.forEach(p => { p.x += prof(p.x, p.r) * dt * 0.08; if (reg.value === 'tur') p.r = Math.max(-0.99, Math.min(0.99, p.r + (Math.random() - 0.5) * 0.04)); if (p.x > 1) { p.x = 0; p.r = Math.random() * 2 - 1; } ctx.fillStyle = U.cssVar('--cool'); ctx.beginPath(); ctx.arc(ox + p.x * W, cy + p.r * R, 2.4, 0, 7); ctx.fill(); });
        [0.02, 0.15, Le, 0.9].forEach(x => { ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const r = -1 + 2 * i / 40, u = prof(x, r); const px = ox + x * W + u * 40, py = cy + r * R; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox + x * W, cy - R); ctx.lineTo(ox + x * W, cy + R); ctx.stroke(); ctx.setLineDash([]); });
        A.text(ctx, 'entry region', ox + Le * W / 2, 30, { align: 'center', bold: true, size: 12 }); A.text(ctx, 'fully developed', ox + (Le + 1) / 2 * W, 30, { align: 'center', bold: true, size: 12 });
      });
    }
  });

  /* ======================= Natural convection ======================= */
  U.addAnim('natconv', {
    title: 'Natural convection along a heated vertical plate', part: 'heat', blurb: 'Buoyancy-driven boundary layer: rising warm fluid, entrainment and the Rayleigh number.',
    desc: R`<h3>Buoyancy-driven flow</h3><p>Fluid next to a hot wall expands, becomes lighter (\(\Delta\rho\approx-\rho\beta\Delta T\)) and rises; cooler fluid is entrained from the side. The velocity is zero at the wall and in the far field, with a maximum inside the boundary layer. The governing group is the Rayleigh number \(Ra=g\beta\Delta TL^3/(\nu\alpha)\): laminar below about \(10^9\), turbulent above. For a vertical plate \(Nu\propto Ra^{1/4}\) (laminar) and \(Ra^{1/3}\) (turbulent) — in the turbulent regime h becomes independent of height.</p><p>Applications: radiators, transformer cooling, electronics in still air, solar collectors, cooling of quenched parts after removal from the bath.</p>`,
    mount(el) {
      const c = A.ctrl(el), dT = A.slider(c, 'Ts − T∞', 5, 120, 1, 40, v => v + ' K');
      const cv = U.canvas(el, 900, 400); const P = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random() }));
      return A.loop(dt => {
        const ctx = cv.ctx; ctx.clearRect(0, 0, 900, 400); const ox = 100, H = 340, top = 30, s = Math.sqrt(dT.val() / 40);
        ctx.fillStyle = A.heat(0.4 + dT.val() / 200); ctx.fillRect(ox - 14, top, 14, H);
        const del = y => 12 + 90 * Math.pow(y, 0.25); // BL thickness px vs height fraction from bottom
        P.forEach(p => { const yh = 1 - p.y, dd = del(yh); const dx = p.x * 600; const eta = dx / dd; const v = eta < 1 ? 4 * eta * (1 - eta) ** 2 * 3.2 : 0; p.y -= v * s * dt * 0.25; p.x -= (eta < 2.5 ? 0.02 : 0.05) * dt * s * (1 - Math.min(1, eta / 3)); if (p.x < 0.005) p.x = 0.005; if (p.y < 0) { p.y = 1; p.x = 0.05 + Math.random() * 0.9; } if (p.x < 0.01 && Math.random() < 0.01) p.x = 0.2; const warm = Math.max(0, 1 - eta) ** 2; ctx.fillStyle = A.heat(0.1 + 0.8 * warm * (dT.val() / 120 + 0.3)); ctx.beginPath(); ctx.arc(ox + 4 + dx, top + p.y * H, 2.6, 0, 7); ctx.fill(); });
        ctx.strokeStyle = U.cssVar('--cool'); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 50; i++) { const yh = i / 50; ctx.lineTo(ox + del(yh), top + (1 - yh) * H); } ctx.stroke(); A.text(ctx, 'boundary-layer edge', ox + del(0.6) + 6, top + 0.4 * H, { size: 11 });
        const yh = 0.6, dd = del(yh); ctx.strokeStyle = U.cssVar('--fg'); ctx.beginPath(); for (let i = 0; i <= 40; i++) { const eta = i / 40 * 1.3, v = eta < 1 ? 4 * eta * (1 - eta) ** 2 * 3.2 : 0; ctx.lineTo(ox + eta * dd, top + (1 - yh) * H - v * 40 * s); } ctx.stroke(); A.text(ctx, 'v(x)', ox + 20, top + (1 - yh) * H - 70 * s, { size: 11 });
        const Ra = 9.81 / 300 * dT.val() * 1 / (1.6e-5 * 2.2e-5); A.text(ctx, 'Ra (1 m tall, air) ≈ ' + U.f(Ra, 3) + (Ra > 1e9 ? '  → turbulent upper part' : '  → laminar'), 450, 380, { align: 'center', size: 12 });
      });
    }
  });

  /* ======================= Boiling ======================= */
  const boilModel = dTe => { // water 1 atm, polished copper approx
    const qn = 4.53e1 * Math.pow(dTe, 3) * 1.0 * 1; // calibrated-ish so qmax ~1.26e6 at ~30 K: Rohsenow coefficient for water/Cu at 1 atm ≈ 45 W/m²K³
    const qmax = 1.26e6, dTcr = Math.cbrt(qmax / 45.3), qmin = 1.9e4, dTmin = 120;
    if (dTe < 5) return 45.3 * 125 * Math.pow(dTe / 5, 4 / 3); // natural convection, continuous at onset if (dTe <= dTcr) return qn; if (dTe < dTmin) { const f = Math.log(dTe / dTcr) / Math.log(dTmin / dTcr); return Math.exp(Math.log(qmax) * (1 - f) + Math.log(qmin) * f); }
    return qmin * Math.pow(dTe / dTmin, 1.6);
  };
  U.boilModel = boilModel;
  U.addAnim('boiling', {
    title: 'The boiling curve: from natural convection to film boiling (Nukiyama)', part: 'heat', blurb: 'Increase the excess temperature and watch the bubble regime change on a heated surface.',
    desc: R`<h3>Regimes of pool boiling (water, 1 atm)</h3><ol><li><b>Natural convection</b> (\(\Delta T_e<5\) K): no bubbles; heat removed by buoyant liquid.</li><li><b>Nucleate boiling</b> — isolated bubbles then jets and columns (\(5<\Delta T_e<30\) K). Very high h; \(q''\propto\Delta T_e^3\) (Rohsenow). Industrial boilers operate here.</li><li><b>Critical heat flux</b> \(q''_{max}\approx1.26\) MW/m² at \(\Delta T_e\approx30\) K: vapour columns choke the liquid supply.</li><li><b>Transition boiling</b>: unstable partial vapour film; q falls as \(\Delta T_e\) rises.</li><li><b>Leidenfrost point</b> \(q''_{min}\) (~120 K): stable vapour blanket forms.</li><li><b>Film boiling</b>: the surface is insulated by vapour; heat crosses by conduction and radiation.</li></ol><p>In an electrically heated (flux-controlled) system, raising q″ beyond the CHF makes the surface temperature jump to the film-boiling branch — often above the melting point: <b>burnout</b>. In quenching (temperature-controlled, falling T) the part travels the curve <i>backwards</i>: film → transition → nucleate → convection, which is exactly the shape of a quench cooling-rate curve.</p>`,
    mount(el) {
      const c = A.ctrl(el), lt = A.slider(c, 'Excess temperature ΔTe', 0.3, 3.05, 0.01, 1.1, v => U.f(Math.pow(10, v), 3) + ' K');
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 460, 380), pl = U.canvas(Rr, 500, 380); let B = [];
      const ts = []; for (let t = 1; t <= 1200; t *= 1.05) ts.push(t);
      return A.loop(dt => {
        const dTe = Math.pow(10, lt.val()), q = boilModel(dTe), ctx = cv.ctx; ctx.clearRect(0, 0, 460, 380);
        ctx.fillStyle = 'rgba(80,150,230,.35)'; ctx.fillRect(20, 40, 420, 280); ctx.fillStyle = A.heat(Math.min(1, 0.2 + dTe / 600)); ctx.fillRect(20, 320, 420, 18);
        let reg; if (dTe < 5) reg = 'natural convection'; else if (dTe < 10) reg = 'nucleate: isolated bubbles'; else if (dTe < 30) reg = 'nucleate: jets & columns'; else if (dTe < 120) reg = 'transition boiling'; else reg = 'film boiling (vapour blanket)';
        if (dTe >= 5 && dTe < 120) { const rate = dTe < 10 ? 6 : dTe < 30 ? 40 : 25; for (let i = 0; i < rate * dt * 10; i++) B.push({ x: 30 + Math.random() * 400, y: 318, r: dTe < 10 ? 3 : 4 + Math.random() * 4, v: 60 + Math.random() * 80 }); }
        if (dTe >= 120 || (dTe >= 30 && Math.random() < 0.3)) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(20, 300 - (dTe >= 120 ? 12 : 0), 420, 20 + (dTe >= 120 ? 12 : 0)); if (Math.random() < 0.15) B.push({ x: 30 + Math.random() * 400, y: 300, r: 10, v: 70 }); }
        if (dTe < 5) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); const x = 60 + i * 65 + 10 * Math.sin(performance.now() / 600 + i); ctx.moveTo(x, 318); ctx.bezierCurveTo(x + 20, 250, x - 20, 150, x, 60); ctx.stroke(); } }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; B = B.filter(b => b.y > 45); B.forEach(b => { b.y -= b.v * dt; b.r += dt * 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); });
        A.text(ctx, reg, 230, 28, { align: 'center', bold: true });
        U.plot(pl, { series: [{ x: ts, y: ts.map(boilModel), label: 'boiling curve (water, 1 atm)' }], marks: [{ x: dTe, y: q, label: U.f(q / 1e3, 3) + ' kW/m²', color: U.cssVar('--hot') }], logx: true, logy: true, xlabel: 'ΔTe [K]', ylabel: 'q″ [W/m²]', ylim: [1e2, 3e6], title: 'Nukiyama boiling curve' });
      });
    }
  });

  /* ======================= Quench probe ======================= */
  U.addAnim('quench', {
    title: 'Quenching a hot probe: cooling curve and cooling-rate curve', part: 'heat', blurb: 'An Inconel probe at 850 °C plunged into water or oil: vapour blanket, nucleate boiling and convection stages.',
    desc: R`<h3>Why quench curves have three stages</h3><p>When a hot part (or an Inconel 600 quench probe, ISO 9950 / ASTM D6200) enters a liquid quenchant, its surface first sits far above the Leidenfrost temperature: a <b>vapour blanket</b> forms and cooling is slow (film boiling). As the surface cools, the blanket collapses and <b>nucleate boiling</b> takes over — the cooling rate peaks (this maximum governs hardening of steel). Finally, below the boiling point, <b>convection</b> removes heat slowly.</p><p>The model here is a lumped probe (Bi is small for Inconel at low h, and acceptable as an illustration) with surface heat flux taken from a boiling curve: \(\rho cV\,dT/dt=-q''(T_s)A\). Plotting \(dT/dt\) versus \(T\) gives the cooling-rate curve used to compare quenchants. Agitation, polymer additives, salts and nanoparticles shift the Leidenfrost point and the peak rate — the basis of quenchant research.</p><p>Inverse heat-conduction methods (e.g. Beck’s method) recover the real surface heat flux from the probe’s centre thermocouple history.</p>`,
    mount(el) {
      const c = A.ctrl(el), qn = A.select(c, 'Quenchant', [['water', 'Water 30 °C (still)'], ['wagit', 'Water 30 °C (agitated)'], ['oil', 'Mineral quench oil 60 °C'], ['brine', 'Brine 10 % (suppresses vapour film)']], 'water'), sp = A.slider(c, 'Speed', 0.3, 5, 0.1, 1.5, v => v + '×'); A.button(c, '↺ Re-quench', () => reset());
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 420, 420); const pl = h('div'); Rr.append(pl); const c1 = U.canvas(pl, 500, 260), c2 = U.canvas(pl, 500, 260);
      let T, t, hist, B = [];
      const reset = () => { T = 850; t = 0; hist = []; B = []; }; reset();
      const flux = (Ts, q) => { // W/m2 surface flux model by quenchant
        const P = { water: [100, 30, 400, 1.0, 1.0], wagit: [100, 30, 520, 1.6, 1.3], oil: [300, 60, 620, 0.12, 0.25], brine: [105, 30, 700, 1.4, 1.2] }[q];
        const [Tb, Tbath, Tlf, nf, cf] = P; const dTe = Ts - Tb;
        if (Ts <= Tb) return 600 * cf * (Ts - Tbath);
        const film = 1.8e5 * cf * Math.pow(Math.max(1, Ts - Tbath) / 800, 1.3) * (q === 'oil' ? 0.5 : 1);
        const nucleate = Math.min(1.6e6 * nf * (q === 'oil' ? 1.6 : 1), 45 * nf * Math.pow(Math.max(0, dTe) + (q === 'oil' ? 40 : 0), 3) * (q === 'oil' ? 0.015 : 1) + 600 * cf * (Ts - Tbath));
        const w = 1 / (1 + Math.exp((Ts - Tlf) / 25)); // 1 below Leidenfrost
        return w * nucleate + (1 - w) * film;
      };
      return A.loop(dt => {
        const step = dt * sp.val(), rhoc = 3.7e6 * 1.0, r = 0.00625, VA = r / 2; // cylinder V/A ≈ r/2
        for (let i = 0; i < 20 && T > 35; i++) { const dTdt = -flux(T, qn.value) / (rhoc * VA); T += dTdt * step / 20; t += step / 20; hist.push([t, T, -dTdt]); }
        const ctx = cv.ctx; ctx.clearRect(0, 0, 420, 420);
        ctx.fillStyle = qn.value === 'oil' ? 'rgba(202,138,4,.35)' : 'rgba(80,150,230,.35)'; ctx.fillRect(30, 120, 360, 280); ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 3; ctx.strokeRect(30, 120, 360, 280);
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(203, 20, 14, 120); ctx.fillStyle = A.heat((T - 30) / 850); ctx.fillRect(190, 140, 40, 200);
        const stage = T > (qn.value === 'oil' ? 620 : qn.value === 'brine' ? 700 : 520) ? 'vapour blanket (film boiling)' : T > (qn.value === 'oil' ? 300 : 100) ? 'nucleate boiling — fastest cooling' : 'convection';
        if (stage.startsWith('vapour')) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.strokeRect(184, 134, 52, 212); }
        if (stage.startsWith('nucleate')) { for (let i = 0; i < 5; i++) B.push({ x: 188 + Math.random() * 44 + (Math.random() < 0.5 ? -8 : 8), y: 140 + Math.random() * 200, r: 2 + Math.random() * 3 }); }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; B = B.filter(b => b.y > 125); B.forEach(b => { b.y -= 90 * dt; b.x += (Math.random() - 0.5) * 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); });
        A.text(ctx, stage, 210, 112, { align: 'center', bold: true, size: 12 }); A.text(ctx, 'Inconel probe Ø12.5 mm · T = ' + U.f(T, 3) + ' °C', 210, 412, { align: 'center', size: 12 });
        U.plot(c1, { series: [{ x: hist.map(x => x[0]), y: hist.map(x => x[1]), label: 'centre T' }], xlabel: 't [s]', ylabel: 'T [°C]', title: 'Cooling curve', ylim: [0, 900] });
        U.plot(c2, { series: [{ x: hist.map(x => x[1]), y: hist.map(x => x[2]), label: 'cooling rate', color: U.cssVar('--cool') }], xlabel: 'T [°C]', ylabel: 'dT/dt [K/s]', title: 'Cooling-rate curve', xlim: [0, 900] });
      });
    }
  });

  /* ======================= Heat exchanger flow ======================= */
  U.addAnim('hxflow', {
    title: 'Parallel-flow vs counter-flow heat exchangers', part: 'heat', blurb: 'Coloured streams and live temperature profiles; why counter-flow can heat the cold fluid above the hot outlet.',
    desc: R`<h3>Flow arrangement matters</h3><p>In <b>parallel flow</b> both fluids enter at the same end: the temperature difference is large at inlet and shrinks downstream; the cold outlet can never exceed the hot outlet. In <b>counter flow</b> the fluids move in opposite directions, the temperature difference is more uniform along the length, the mean (log-mean) temperature difference is larger for the same terminal temperatures, and the cold outlet can rise above the hot outlet. For the same duty, counter flow needs the least area.</p><p>Effectiveness \(\varepsilon=\dot q/\dot q_{max}\) with \(\dot q_{max}=C_{min}(T_{h,i}-T_{c,i})\); NTU \(=UA/C_{min}\) is the exchanger’s “thermal size”.</p>`,
    mount(el) {
      const c = A.ctrl(el), arr = A.select(c, 'Arrangement', [['cnt', 'Counter flow'], ['par', 'Parallel flow']], 'cnt'), ntu = A.slider(c, 'NTU', 0.2, 5, 0.1, 2), cr = A.slider(c, 'C_r = C_min/C_max', 0, 1, 0.05, 0.5);
      const cv = U.canvas(el, 900, 220), pl = U.canvas(el, 900, 300); const read = h('div', { class: 'out' }); el.append(read);
      const P = Array.from({ length: 160 }, (_, i) => ({ x: Math.random(), hot: i % 2 === 0, y: Math.random() }));
      return A.loop(dt => {
        const N = ntu.val(), C = cr.val(), cnt = arr.value === 'cnt', Thi = 1, Tci = 0; // hot = Cmin
        const eps = cnt ? (Math.abs(1 - C) < 1e-9 ? N / (1 + N) : (1 - Math.exp(-N * (1 - C))) / (1 - C * Math.exp(-N * (1 - C)))) : (1 - Math.exp(-N * (1 + C))) / (1 + C);
        const Tho = Thi - eps, Tco = Tci + C * eps; const xs = U.range(0, 1, 60); let Th, Tc;
        if (!cnt) { Th = xs.map(x => { const d = Math.exp(-N * (1 + C) * x); const q = (1 - d) / (1 + C); return 1 - q; }); Tc = Th.map((t, i) => C * (1 - t)); }
        else { const k = N * (1 - C), d0 = Thi - Tco; Th = xs.map(x => { const d = d0 * Math.exp(-k * x); const q = Math.abs(1 - C) < 1e-9 ? N * d0 * x : (d0 - d) / (1 - C); return 1 - q; }); Tc = Th.map(t => Tco - C * (1 - t)); }
        const ctx = cv.ctx; ctx.clearRect(0, 0, 900, 220);
        for (let i = 0; i < 60; i++) { ctx.fillStyle = A.heat(0.15 + 0.8 * Th[i]); ctx.fillRect(40 + i * 13.7, 40, 14, 60); ctx.fillStyle = A.heat(0.15 + 0.8 * Tc[i]); ctx.fillRect(40 + i * 13.7, 110, 14, 60); }
        P.forEach(p => { p.x += (p.hot || !cnt ? 1 : -1) * dt * 0.15; if (p.x > 1) p.x = 0; if (p.x < 0) p.x = 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(40 + p.x * 822, (p.hot ? 45 : 115) + p.y * 50, 2.2, 0, 7); ctx.fill(); });
        A.arrow(ctx, 10, 70, 36, 70, U.cssVar('--hot')); A.text(ctx, 'hot in', 6, 30, { size: 11 }); cnt ? A.arrow(ctx, 890, 140, 866, 140, U.cssVar('--cool')) : A.arrow(ctx, 10, 140, 36, 140, U.cssVar('--cool')); A.text(ctx, 'cold in', cnt ? 840 : 6, 195, { size: 11 });
        U.plot(pl, { series: [{ x: xs, y: Th, label: 'hot fluid' }, { x: xs, y: Tc, label: 'cold fluid', color: U.cssVar('--cool') }], xlabel: 'position along exchanger', ylabel: 'θ = (T − Tc,i)/(Th,i − Tc,i)', ylim: [0, 1], title: (cnt ? 'Counter' : 'Parallel') + '-flow temperature profiles' });
        read.innerHTML = outRow([['Effectiveness ε', U.fmt(eps, 3)], ['Hot outlet θ', U.fmt(Tho, 3)], ['Cold outlet θ', U.fmt(Tco, 3)], ['Temperature cross?', Tco > Tho ? 'yes (only possible in counter flow)' : 'no']]);
      });
    }
  });

  /* ======================= Planck / glowing body ======================= */
  U.addAnim('planck', {
    title: 'Blackbody radiation: Planck spectrum and the colour of hot metal', part: 'heat', blurb: 'Heat a body from 300 K to 6000 K: spectrum, Wien peak, visible fraction and glow colour.',
    desc: R`<h3>Planck’s law and its consequences</h3><p>\(E_{b\lambda}=\dfrac{C_1}{\lambda^5[\exp(C_2/\lambda T)-1]}\). Integrating over all wavelengths gives \(E_b=\sigma T^4\). The peak moves to shorter wavelength as T rises (\(\lambda_{max}T=2898\) μm·K): a body at room temperature radiates in the far infrared (≈10 μm); steel begins to glow dull red near 800 K, turns orange-yellow near 1300 K; the sun (≈5800 K) peaks in the visible.</p><p>Only a tiny fraction of a hot steel bar’s radiation is visible — most is infrared, which is why IR thermometers and thermal cameras work, and why glass (transparent to visible, opaque to far IR) creates the greenhouse effect.</p>`,
    mount(el) {
      const c = A.ctrl(el), T = A.slider(c, 'Temperature', 300, 6000, 10, 1300, v => v + ' K');
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 360, 360), pl = U.canvas(Rr, 560, 360); const read = h('div', { class: 'out' }); el.append(read);
      const ls = []; for (let l = 0.1; l < 50; l *= 1.03) ls.push(l);
      const rgbOf = TT => { // approximate blackbody colour (Tanner Helland fit)
        const t = TT / 100; let r, g, b; r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332); g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -0.0755); b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305; const vis = U.F0l(0.7 * TT) - U.F0l(0.4 * TT); const I = Math.min(1, Math.pow(vis * SIG * TT ** 4 / 2e4, 0.35)); return `rgb(${Math.round(Math.min(255, r) * I)},${Math.round(Math.max(0, Math.min(255, g)) * I)},${Math.round(Math.max(0, Math.min(255, b)) * I)})`; };
      return A.loop(() => {
        const TT = T.val(), ctx = cv.ctx; ctx.clearRect(0, 0, 360, 360); const g = ctx.createRadialGradient(180, 180, 20, 180, 180, 150); const col = rgbOf(TT); g.addColorStop(0, col); g.addColorStop(0.6, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 360, 360); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(180, 180, 150, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(110, 150, 140, 60); A.text(ctx, 'visible glow', 180, 340, { align: 'center', color: '#ddd', size: 12 });
        const lam = 2897.8 / TT, vis = U.F0l(0.76 * TT) - U.F0l(0.4 * TT);
        U.plot(pl, { series: [{ x: ls, y: ls.map(l => U.Eblam(l, TT)), label: TT + ' K', fill: true }, { x: [0.4, 0.4], y: [1e-3, 1e9], color: '#8b5cf6', dash: [3, 3] }, { x: [0.76, 0.76], y: [1e-3, 1e9], color: '#dc2626', dash: [3, 3] }], marks: [{ x: lam, y: U.Eblam(lam, TT), label: 'λmax = ' + U.f(lam, 3) + ' μm' }], logx: true, logy: true, ylim: [U.Eblam(lam, TT) * 1e-4, U.Eblam(lam, TT) * 4], xlabel: 'λ [μm] (dashed: visible band)', ylabel: 'E_bλ [W/m²μm]', title: 'Planck spectral distribution' });
        read.innerHTML = outRow([['E_b = σT⁴', U.fmt(SIG * TT ** 4 / 1e3, 4) + ' kW/m²'], ['λmax', U.fmt(lam, 4) + ' μm'], ['Visible fraction (0.40–0.76 μm)', U.fmt(100 * vis, 3) + ' %'], ['Infrared fraction (> 0.76 μm)', U.fmt(100 * (1 - U.F0l(0.76 * TT)), 3) + ' %']]);
      });
    }
  });

  /* ======================= Diffusion ======================= */
  U.addAnim('diffusion', {
    title: 'Molecular diffusion: random walks and Fick’s law', part: 'mass', blurb: 'Particles random-walk from a high-concentration source; the histogram converges to the erf profile.',
    desc: R`<h3>From random motion to Fick’s law</h3><p>Each molecule moves randomly; there is no force pushing it from high to low concentration. Yet because more molecules exist on the crowded side, more of them cross any plane from that side than in the other direction — a net flux proportional to the concentration gradient: \(j_A=-D_{AB}\,\partial C_A/\partial x\). The mean square displacement grows linearly in time, \(\langle x^2\rangle=2Dt\), which is why diffusion distances scale with \(\sqrt{Dt}\).</p><p>With the left face held at constant concentration (like carbon at a steel surface in a carburizing atmosphere), the profile follows \(\dfrac{C-C_0}{C_s-C_0}=\text{erfc}\dfrac{x}{2\sqrt{Dt}}\) — mathematically identical to transient conduction into a semi-infinite solid (replace \(\alpha\) by \(D\)).</p>`,
    mount(el) {
      const c = A.ctrl(el), D = A.slider(c, 'Diffusivity (relative)', 0.2, 3, 0.1, 1); A.button(c, '↺ Restart', () => reset());
      const cv = U.canvas(el, 900, 300), pl = U.canvas(el, 900, 260); let P = [], t = 0;
      const reset = () => { P = []; t = 0; }; reset();
      return A.loop(dt => {
        t += dt; const ctx = cv.ctx; ctx.clearRect(0, 0, 900, 300); const W = 800, ox = 60, Dn = 0.004 * D.val();
        const gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(6.2832 * Math.random());
        while (P.filter(p => p.x < 0.0125).length < 30) P.push({ x: Math.random() * 0.0125, y: Math.random() });
        const sd = Math.sqrt(2 * Dn * dt);
        P.forEach(p => { p.x += gauss() * sd; p.y += gauss() * sd * 3; if (p.x < 0) p.x = -p.x; p.y = Math.max(0, Math.min(1, p.y)); });
        P = P.filter(p => p.x < 1.02);
        ctx.fillStyle = U.cssVar('--hot'); ctx.fillRect(ox - 20, 20, 20, 260); A.text(ctx, 'Cs', ox - 10, 296, { align: 'center', size: 11 });
        ctx.fillStyle = U.cssVar('--cool'); P.forEach(p => { ctx.beginPath(); ctx.arc(ox + p.x * W, 20 + p.y * 260, 2, 0, 7); ctx.fill(); });
        // histogram
        const nb = 40, hist = Array(nb).fill(0); P.forEach(p => { const b = Math.floor(p.x * nb); if (b >= 0 && b < nb) hist[b]++; }); const c0 = 30 * (1 / nb) / 0.0125; const xs = hist.map((_, i) => (i + 0.5) / nb);
        const Lx = 2 * Math.sqrt(Dn * Math.max(t, 0.01));
        U.plot(pl, { series: [{ x: xs, y: hist.map(v => v / c0), points: true, label: 'simulated C/Cs' }, { x: U.range(0, 1, 100), y: U.range(0, 1, 100).map(x => U.erfc(x / Math.max(0.02, Lx))), label: 'erfc(x / 2√(Dt))', color: U.cssVar('--cool') }], xlabel: 'x (normalised)', ylabel: 'C / Cs', ylim: [0, 1.2], title: 'Concentration profile' });
      });
    }
  });
})();
