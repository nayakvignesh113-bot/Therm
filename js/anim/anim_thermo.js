/* Thermodynamics animations */
'use strict';
(() => {
  const { h } = U; const K = 273.15;
  /* ---------- shared animation helpers ---------- */
  const A = U.A = {
    ctrl(parent) { const c = h('div', { class: 'ctrl' }); parent.append(c); return c; },
    slider(c, label, min, max, step, val, fmt = v => v) { const i = h('input', { type: 'range', min, max, step, value: val }), o = h('output', {}, fmt(+val)); i.addEventListener('input', () => o.textContent = fmt(+i.value)); c.append(h('label', {}, label, i, o)); i.val = () => +i.value; return i; },
    select(c, label, opts, val) { const s = h('select', { class: 'inp', style: 'width:auto' }, opts.map(([k, n]) => h('option', { value: k }, n))); if (val != null) s.value = val; c.append(h('label', {}, label, s)); return s; },
    button(c, label, fn) { const b = h('button', { class: 'btn sm', onclick: fn }, label); c.append(b); return b; },
    loop(fn) { let run = true, last = performance.now(); const tick = t => { if (!run) return; const dt = Math.max(0, Math.min(0.05, (t - last) / 1000)); last = t; try { fn(dt, t / 1000); } catch (e) { console.error(e); run = false; } requestAnimationFrame(tick); }; requestAnimationFrame(tick); return () => { run = false; }; },
    heat(t) { t = Math.max(0, Math.min(1, t)); const r = Math.round(255 * Math.min(1, 0.15 + 1.6 * t)), g = Math.round(255 * Math.max(0, Math.min(1, 1.6 * t - 0.45))), b = Math.round(255 * Math.max(0, 0.75 - 1.5 * t) + (t > 0.85 ? 255 * (t - 0.85) * 4 : 0)); return `rgb(${r},${g},${Math.min(255, b)})`; },
    cool2hot(t) { t = Math.max(0, Math.min(1, t)); const r = Math.round(30 + 225 * t), g = Math.round(110 + 60 * Math.sin(Math.PI * t) - 80 * t), b = Math.round(230 - 200 * t); return `rgb(${r},${g},${b})`; },
    arrow(ctx, x1, y1, x2, y2, col, w = 3) { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); const a = Math.atan2(y2 - y1, x2 - x1), s = 6 + w * 2; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4)); ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4)); ctx.fill(); },
    text(ctx, s, x, y, o = {}) { ctx.fillStyle = o.color || U.cssVar('--fg'); ctx.font = (o.bold ? '600 ' : '') + (o.size || 13) + 'px Inter, system-ui'; ctx.textAlign = o.align || 'left'; ctx.fillText(s, x, y); }
  };

  /* ======================= Piston–cylinder processes ======================= */
  U.addAnim('piston', {
    title: 'Piston–cylinder: boundary work, heat and the first law', part: 'thermo', blurb: 'Watch molecules, piston and the P–V diagram together for isobaric, isochoric, isothermal, adiabatic and polytropic processes.',
    desc: R`<h3>What you are seeing</h3><p>The gas is a collection of molecules whose mean speed scales with \(\sqrt{T}\). Pressure is the momentum delivered per unit time per unit area by molecules hitting the piston. As the piston moves, the gas does boundary work \(W_b=\int P\,dV\) — the <b>shaded area under the P–V curve</b>. Red arrows show heat entering, blue arrows heat leaving.</p>
    <ul><li><b>Isobaric</b> (\(P\)=const): heating pushes the piston out at constant pressure; \(Q=\Delta H=mc_p\Delta T\), \(W=P\Delta V\).</li>
    <li><b>Isochoric</b> (\(V\)=const): piston locked; no work; all heat raises \(U\): \(Q=mc_v\Delta T\).</li>
    <li><b>Isothermal</b> compression: molecules keep the same speed; you must <i>remove</i> heat equal to the work done on the gas: \(Q=W=P_1V_1\ln(V_2/V_1)\).</li>
    <li><b>Adiabatic</b> (reversible) compression: no heat, so work done on the gas raises its temperature (\(PV^k\)=const) — this is why a bicycle pump gets hot and why diesel engines need no spark.</li>
    <li><b>Polytropic</b> \(PV^n\)=const with \(1<n<k\): some heat leaves during compression, as in a real cooled compressor.</li></ul>
    <p><b>Sign convention used:</b> \(W\) = work done <i>by</i> the gas, \(Q\) = heat <i>into</i> the gas, so \(Q-W=\Delta U\).</p>`,
    mount(el) {
      const c = A.ctrl(el), proc = A.select(c, 'Process', [['p', 'Isobaric heating'], ['v', 'Isochoric heating'], ['T', 'Isothermal compression'], ['s', 'Adiabatic compression'], ['n', 'Polytropic compression (n = 1.25)']], 's');
      const sp = A.slider(c, 'Speed', 0.2, 3, 0.1, 1, v => v + '×'); A.button(c, '↺ Restart', () => reset());
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 460, 420), pv = U.canvas(Rr, 480, 420); cv.classList.add('anim');
      const read = h('div', { class: 'out' }); el.append(read);
      const m = 0.001, Rg = 0.287, k = 1.4, cvh = Rg / (k - 1); // 1 g of air
      let f, st, trail, mol;
      const reset = () => { f = 0; trail = []; st = null; mol = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random() * 6.283 })); };
      reset();
      const P1 = 100, T1 = 300, V1 = m * Rg * T1 / P1;
      const state = (pr, f) => { // f: 0→1 progress
        let V, P, T;
        if (pr === 'p') { T = T1 * (1 + 1.5 * f); P = P1; V = m * Rg * T / P; }
        else if (pr === 'v') { V = V1; T = T1 * (1 + 1.5 * f); P = m * Rg * T / V; }
        else { V = V1 * (1 - 0.75 * f); const n = { T: 1, s: k, n: 1.25 }[pr]; P = P1 * Math.pow(V1 / V, n); T = P * V / (m * Rg); }
        return { V, P, T };
      };
      return A.loop(dt => {
        const pr = proc.value; if (st && st.pr !== pr) reset();
        f = Math.min(1, f + dt * 0.12 * sp.val()); const s = state(pr, f); st = { pr, ...s }; trail.push(s);
        // work & heat
        let W = 0; for (let i = 1; i < trail.length; i++) W += 0.5 * (trail[i].P + trail[i - 1].P) * (trail[i].V - trail[i - 1].V);
        const dU = m * cvh * (s.T - T1), Q = dU + W;
        // draw cylinder
        const ctx = cv.ctx; ctx.clearRect(0, 0, 460, 420);
        const x0 = 80, w = 300, yb = 390, Hmax = 300, hgt = Hmax * (s.V / (V1 * 2.6)), ytop = yb - hgt;
        ctx.fillStyle = A.heat((s.T - 250) / 700); ctx.globalAlpha = 0.18; ctx.fillRect(x0, ytop, w, hgt); ctx.globalAlpha = 1;
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, yb - Hmax - 20); ctx.lineTo(x0, yb); ctx.lineTo(x0 + w, yb); ctx.lineTo(x0 + w, yb - Hmax - 20); ctx.stroke();
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(x0 + 3, ytop - 22, w - 6, 22); ctx.fillRect(x0 + w / 2 - 8, ytop - 80, 16, 58);
        if (pr === 'v') { ctx.fillStyle = U.cssVar('--red'); ctx.fillRect(x0 - 14, ytop - 30, 12, 12); ctx.fillRect(x0 + w + 2, ytop - 30, 12, 12); A.text(ctx, 'locked', x0 + w + 18, ytop - 20, { size: 11 }); }
        if (pr === 'p') { ctx.fillStyle = U.cssVar('--fg'); ctx.fillRect(x0 + w / 2 - 40, ytop - 110, 80, 30); A.text(ctx, 'weight', x0 + w / 2, ytop - 90, { align: 'center', color: U.cssVar('--panel'), size: 12 }); }
        // molecules
        const spd = 0.9 * Math.sqrt(s.T / 300) * sp.val();
        ctx.fillStyle = U.cssVar('--cool');
        mol.forEach(p => { p.x += Math.cos(p.a) * spd * dt * 0.9; p.y += Math.sin(p.a) * spd * dt * 0.9 * (Hmax / hgt); if (p.x < 0 || p.x > 1) { p.a = Math.PI - p.a; p.x = Math.max(0, Math.min(1, p.x)); } if (p.y < 0 || p.y > 1) { p.a = -p.a; p.y = Math.max(0, Math.min(1, p.y)); } ctx.beginPath(); ctx.arc(x0 + 8 + p.x * (w - 16), ytop + 6 + p.y * (hgt - 12), 3.2, 0, 7); ctx.fill(); });
        // heat arrows
        const dq = trail.length > 2 ? (Q - (trail.Qprev || 0)) : 0; trail.Qprev = Q;
        if (Math.abs(dq) > 1e-7) { const col = dq > 0 ? U.cssVar('--hot') : U.cssVar('--cool'); for (let i = 0; i < 3; i++) { const xx = x0 + 60 + i * 90; dq > 0 ? A.arrow(ctx, xx, yb + 28, xx, yb + 4, col) : A.arrow(ctx, xx, yb + 2, xx, yb + 26, col); } A.text(ctx, dq > 0 ? 'Q in' : 'Q out', x0 - 50, yb + 18, { color: col, bold: true }); }
        if (pr !== 'v') A.text(ctx, pr === 'p' ? 'gas pushes piston → W > 0' : 'piston compresses gas → W < 0', 230, 22, { align: 'center', size: 12 });
        // P-V diagram
        const ser = [{ x: trail.map(t => t.V * 1e3), y: trail.map(t => t.P), fill: pr !== 'v', fillTo: 0, label: 'path' }];
        U.plot(pv, { series: ser, marks: [{ x: s.V * 1e3, y: s.P, color: U.cssVar('--hot') }], xlabel: 'V [litre]', ylabel: 'P [kPa]', title: 'P–V diagram (shaded = |W|)', xlim: [0, V1 * 2.6e3], ylim: [0, Math.max(800, P1 * 1.1)] });
        read.innerHTML = [['P', s.P, 'kPa'], ['V', s.V * 1e3, 'L'], ['T', s.T - K, '°C'], ['W (by gas)', W * 1e3, 'J'], ['Q (into gas)', Q * 1e3, 'J'], ['ΔU', dU * 1e3, 'J']].map(([a, b, u]) => `<div><span>${a}</span><b>${U.fmt(b, 4)} <small>${u}</small></b></div>`).join('');
        if (f >= 1 && !st.held) { st.held = performance.now(); } if (f >= 1 && performance.now() - st.held > 2500) reset();
      });
    }
  });

  /* ======================= Phase change at constant pressure ======================= */
  U.addAnim('phase', {
    title: 'Boiling water at constant pressure: the T–v diagram and the vapour dome', part: 'thermo', blurb: 'Compressed liquid → saturated liquid → wet mixture → saturated vapour → superheated vapour, with live quality.',
    desc: R`<h3>The five states of a pure substance</h3><ol><li><b>Compressed (subcooled) liquid</b>: \(T<T_{sat}(P)\). Heat raises T; volume barely changes.</li><li><b>Saturated liquid</b> (\(x=0\)): the liquid is about to boil — at 101.325 kPa this is 100 °C.</li><li><b>Saturated mixture</b>: T stays fixed at \(T_{sat}\) while heat (latent heat \(h_{fg}\)) converts liquid to vapour. The quality \(x=m_g/m\) rises from 0 to 1 and \(v=v_f+x\,v_{fg}\) grows enormously.</li><li><b>Saturated vapour</b> (\(x=1\)).</li><li><b>Superheated vapour</b>: T rises again.</li></ol>
    <p>Move the pressure slider: higher pressure raises \(T_{sat}\) and shrinks \(h_{fg}\) and \(v_{fg}\). At the <b>critical point</b> (22.06 MPa, 373.95 °C) the dome closes: liquid and vapour become indistinguishable. This is why pressure cookers cook faster (≈120 °C at 2 bar) and why high-pressure boilers need less latent heat per kg.</p><p>Data: real water properties (IAPWS-95).</p>`,
    mount(el) {
      const c = A.ctrl(el), Pi = A.slider(c, 'Pressure', 0, 1, 0.01, 0.42, v => U.fmt(Math.pow(10, -2.3 + 3.6 * v), 3).replace(/<[^>]+>/g, '') + ' MPa'), sp = A.slider(c, 'Heating rate', 0.2, 3, 0.1, 1, v => v + '×'); A.button(c, '↺ Restart', () => { q = 0; });
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 420, 420), pv = U.canvas(Rr, 500, 420); const read = h('div', { class: 'out' }); el.append(read);
      let F = null, q = 0, bubbles = [];
      U.fluid('water').then(x => F = x);
      return A.loop(dt => {
        if (!F) return; const P = Math.pow(10, -2.3 + 3.6 * Pi.val()) * 1e6; const Tin = 293.15;
        let st; const sub = P < F.Pc;
        const s0 = F.state({ P, T: Tin }); const hmax = F.state({ P, T: Math.max(F.Tsat(Math.min(P, F.Pc * 0.999)) + 150, 700) }).h;
        q += dt * 120 * sp.val(); const hh = s0.h + q; if (hh > hmax) q = 0;
        try { st = F.state({ P, h: Math.min(hh, hmax) }); } catch (e) { return; }
        const ctx = cv.ctx; ctx.clearRect(0, 0, 420, 420);
        const x0 = 70, w = 280, yb = 380, vmax = Math.log(F.state({ P, h: hmax }).v / s0.v);
        const hgt = 60 + 250 * Math.log(st.v / s0.v) / vmax, ytop = yb - hgt;
        const x = st.x == null ? (st.T < (sub ? F.Tsat(P) : F.Tc) ? 0 : 1) : st.x;
        // liquid fraction height by volume
        const vf = sub ? F.satP(P).vf : st.v; const liqH = st.x != null ? hgt * (1 - x) * vf / st.v : (x === 0 ? hgt : 0);
        ctx.fillStyle = 'rgba(80,150,230,.55)'; ctx.fillRect(x0, yb - liqH, w, liqH);
        ctx.fillStyle = A.heat((st.T - 280) / 600); ctx.globalAlpha = 0.25; ctx.fillRect(x0, ytop, w, hgt - liqH); ctx.globalAlpha = 1;
        if (st.x != null && st.x > 0 && st.x < 1) { if (Math.random() < 0.6) bubbles.push({ x: x0 + 10 + Math.random() * (w - 20), y: yb - 4, r: 2 + Math.random() * 4 }); }
        bubbles = bubbles.filter(b => b.y > yb - liqH + 2); ctx.strokeStyle = '#fff'; bubbles.forEach(b => { b.y -= 60 * dt; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); });
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, 40); ctx.lineTo(x0, yb); ctx.lineTo(x0 + w, yb); ctx.lineTo(x0 + w, 40); ctx.stroke();
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(x0 + 3, ytop - 20, w - 6, 20); ctx.fillStyle = U.cssVar('--fg'); ctx.fillRect(x0 + w / 2 - 50, ytop - 50, 100, 30); A.text(ctx, 'P = const', x0 + w / 2, ytop - 30, { align: 'center', color: U.cssVar('--panel'), size: 12 });
        for (let i = 0; i < 4; i++) { const xx = x0 + 35 + i * 70; A.arrow(ctx, xx, yb + 32, xx, yb + 6, U.cssVar('--hot')); }
        A.text(ctx, st.phase, 210, 24, { align: 'center', bold: true });
        // T-v diagram
        const s = F.sat, dome = { x: [...s.vf, ...s.vg.slice().reverse()], y: [...s.T, ...s.T.slice().reverse()].map(t => t - K), color: U.cssVar('--muted'), width: 1.5, label: 'saturation dome' };
        const iso = []; for (let hq = s0.h; hq <= hmax; hq += (hmax - s0.h) / 120) { try { const z = F.state({ P, h: hq }); iso.push(z); } catch (e) { } }
        U.plot(pv, { series: [dome, { x: iso.map(z => z.v), y: iso.map(z => z.T - K), color: U.cssVar('--cool'), width: 1.4, label: 'isobar' }], marks: [{ x: st.v, y: st.T - K, color: U.cssVar('--hot'), label: st.x != null && st.x > 0 && st.x < 1 ? 'x = ' + st.x.toFixed(2) : '' }], logx: true, xlabel: 'v [m³/kg] (log)', ylabel: 'T [°C]', title: 'T–v diagram of water', xlim: [5e-4, 200], ylim: [0, 600] });
        read.innerHTML = [['P', P / 1e3, 'kPa'], ['T', st.T - K, '°C'], ['T_sat', sub ? F.Tsat(P) - K : NaN, '°C'], ['quality x', st.x ?? NaN, ''], ['v', st.v, 'm³/kg'], ['h', st.h, 'kJ/kg'], ['heat added', q, 'kJ/kg']].map(([a, b, u]) => `<div><span>${a}</span><b>${isNaN(b) ? '—' : U.fmt(b, 4)} <small>${u}</small></b></div>`).join('');
      });
    }
  });

  /* ======================= Cycle animator ======================= */
  U.addAnim('cycle', {
    title: 'Thermodynamic cycles on P–v and T–s diagrams', part: 'thermo', blurb: 'Carnot, Otto, Diesel, Brayton, Stirling: a state point travels the cycle; areas show net work and heat.',
    desc: R`<h3>Reading cycle diagrams</h3><p>On a <b>P–v</b> diagram the enclosed area is the net work per kg; on a <b>T–s</b> diagram the enclosed area is the net heat per kg (equal to net work, by the first law for a cycle). Clockwise loops are power cycles.</p>
    <ul><li><b>Carnot</b>: two isotherms + two isentropes — a rectangle on T–s. Highest possible efficiency \(1-T_L/T_H\), but the tiny P–v area means huge machines for little work.</li>
    <li><b>Otto</b> (petrol engine): isentropic compression, constant-volume heat addition (spark), isentropic expansion, constant-volume rejection. \(\eta=1-r^{1-k}\) depends only on compression ratio.</li>
    <li><b>Diesel</b>: heat added at constant pressure (fuel injected while piston descends). For the same r, less efficient than Otto, but Diesel engines run far higher r (no knock).</li>
    <li><b>Brayton</b> (gas turbine): two isobars + two isentropes; \(\eta=1-r_p^{(1-k)/k}\).</li>
    <li><b>Stirling</b> with an ideal regenerator: the heat rejected on the constant-volume cooling leg is stored and returned on the heating leg, so external heat is exchanged only at \(T_H\) and \(T_L\) → Carnot efficiency.</li></ul>
    <p>Colour of the moving dot: red when heat is being added, blue when rejected, grey when adiabatic.</p>`,
    mount(el) {
      const c = A.ctrl(el), cy = A.select(c, 'Cycle', [['carnot', 'Carnot'], ['otto', 'Otto'], ['diesel', 'Diesel'], ['brayton', 'Brayton'], ['stirling', 'Stirling']], 'otto'), r = A.slider(c, 'Compression / pressure ratio', 2, 20, 0.5, 8), sp = A.slider(c, 'Speed', 0.2, 3, 0.1, 1, v => v + '×');
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const a = U.canvas(L, 500, 400), b = U.canvas(Rr, 500, 400); const read = h('div', { class: 'out' }); el.append(read);
      const k = 1.4, Rg = 0.287, cp = 1.005, cv = cp / k, T1 = 300, P1 = 100, Tmax = 1800;
      let ph = 0;
      const build = () => {
        const rr = r.val(), v1 = Rg * T1 / P1; const legs = []; // each leg: {type, from, to, q: +1 in, -1 out, 0}
        const S = (T, v) => ({ T, v, P: Rg * T / v, s: cv * Math.log(T / T1) + Rg * Math.log(v / v1) });
        let pts;
        switch (cy.value) {
          case 'carnot': { const TH = 900, v2 = v1 / 1.6, v3 = v2 * Math.pow(T1 / TH, 1 / (k - 1)) ; const A1 = S(T1, v1), A2 = S(T1, v2), A3 = S(TH, v2 * Math.pow(T1 / TH, 1 / (k - 1))), A4 = S(TH, v1 * Math.pow(T1 / TH, 1 / (k - 1))); pts = [A1, A2, A3, A4]; legs.push(['T', 0, 1, -1], ['s', 1, 2, 0], ['T', 2, 3, 1], ['s', 3, 0, 0]); break; }
          case 'otto': { const v2 = v1 / rr, T2 = T1 * Math.pow(rr, k - 1), T3 = Math.max(Tmax, T2 * 1.3), T4 = T3 / Math.pow(rr, k - 1); pts = [S(T1, v1), S(T2, v2), S(T3, v2), S(T4, v1)]; legs.push(['s', 0, 1, 0], ['v', 1, 2, 1], ['s', 2, 3, 0], ['v', 3, 0, -1]); break; }
          case 'diesel': { const rd = Math.max(rr, 12), v2 = v1 / rd, T2 = T1 * Math.pow(rd, k - 1), rc = 2, T3 = T2 * rc, v3 = v2 * rc, T4 = T3 * Math.pow(v3 / v1, k - 1); pts = [S(T1, v1), S(T2, v2), S(T3, v3), S(T4, v1)]; legs.push(['s', 0, 1, 0], ['p', 1, 2, 1], ['s', 2, 3, 0], ['v', 3, 0, -1]); break; }
          case 'brayton': { const T2 = T1 * Math.pow(rr, (k - 1) / k), T3 = 1400, T4 = T3 / Math.pow(rr, (k - 1) / k), P2 = P1 * rr; pts = [S(T1, v1), S(T2, Rg * T2 / P2), S(T3, Rg * T3 / P2), S(T4, Rg * T4 / P1)]; legs.push(['s', 0, 1, 0], ['p', 1, 2, 1], ['s', 2, 3, 0], ['p', 3, 0, -1]); break; }
          case 'stirling': { const TH = 900, v2 = v1 / rr; pts = [S(T1, v1), S(T1, v2), S(TH, v2), S(TH, v1)]; legs.push(['T', 0, 1, -1], ['v', 1, 2, 2], ['T', 2, 3, 1], ['v', 3, 0, -2]); break; }
        }
        const path = (lg, f) => { const [t, i, j] = lg, A1 = pts[i], B = pts[j]; let T, v; if (t === 's') { v = A1.v * Math.pow(B.v / A1.v, f); T = A1.T * Math.pow(A1.v / v, k - 1); } else if (t === 'v') { v = A1.v; T = A1.T + (B.T - A1.T) * f; } else if (t === 'p') { T = A1.T + (B.T - A1.T) * f; v = Rg * T / A1.P; } else { T = A1.T; v = A1.v * Math.pow(B.v / A1.v, f); } return S(T, v); };
        const curves = legs.map(lg => U.range(0, 1, 40).map(f => path(lg, f)));
        // heat in/out
        let qin = 0, qout = 0; legs.forEach((lg, i) => { const cu = curves[i]; let q = 0; for (let j = 1; j < cu.length; j++) q += 0.5 * (cu[j].T + cu[j - 1].T) * (cu[j].s - cu[j - 1].s); if (Math.abs(lg[3]) === 2) return; if (q > 0) qin += q; else qout -= q; });
        return { pts, legs, curves, path, qin, qout };
      };
      let cfg = build(), key = '';
      return A.loop(dt => {
        const nk = cy.value + r.val(); if (nk !== key) { cfg = build(); key = nk; }
        ph = (ph + dt * 0.18 * sp.val()) % cfg.legs.length; const li = Math.floor(ph), f = ph - li, s = cfg.path(cfg.legs[li], f), q = cfg.legs[li][3];
        const col = q > 0 ? U.cssVar('--hot') : q < 0 ? U.cssVar('--cool') : U.cssVar('--muted');
        const cols = cfg.legs.map(lg => lg[3] > 0 ? U.cssVar('--hot') : lg[3] < 0 ? U.cssVar('--cool') : U.cssVar('--muted'));
        U.plot(a, { series: cfg.curves.map((cu, i) => ({ x: cu.map(z => z.v), y: cu.map(z => z.P), color: cols[i], width: 2.6 })), marks: [...cfg.pts.map((p, i) => ({ x: p.v, y: p.P, label: String(i + 1), r: 3 })), { x: s.v, y: s.P, color: col, r: 7 }], xlabel: 'v [m³/kg]', ylabel: 'P [kPa]', title: 'P–v (area = net work)' });
        U.plot(b, { series: cfg.curves.map((cu, i) => ({ x: cu.map(z => z.s), y: cu.map(z => z.T), color: cols[i], width: 2.6 })), marks: [...cfg.pts.map((p, i) => ({ x: p.s, y: p.T, label: String(i + 1), r: 3 })), { x: s.s, y: s.T, color: col, r: 7 }], xlabel: 's − s₁ [kJ/kg·K]', ylabel: 'T [K]', title: 'T–s (area = net heat)' });
        const eta = 1 - cfg.qout / cfg.qin, Tm = Math.max(...cfg.pts.map(p => p.T)), Tn = Math.min(...cfg.pts.map(p => p.T));
        read.innerHTML = [['Leg', (li + 1) + '→' + ((li + 1) % cfg.legs.length + 1) + ' (' + { s: 'isentropic', v: 'const. volume', p: 'const. pressure', T: 'isothermal' }[cfg.legs[li][0]] + ')'], ['q<sub>in</sub>', U.fmt(cfg.qin, 4) + ' kJ/kg'], ['q<sub>out</sub>', U.fmt(cfg.qout, 4) + ' kJ/kg'], ['η', U.fmt(eta, 4)], ['Carnot η (same T range)', U.fmt(1 - Tn / Tm, 4)], ['T now', U.fmt(s.T, 4) + ' K']].map(([x, y]) => `<div><span>${x}</span><b>${y}</b></div>`).join('');
      });
    }
  });

  /* ======================= Four-stroke engine ======================= */
  U.addAnim('engine', {
    title: 'Four-stroke spark-ignition engine and its indicator diagram', part: 'thermo', blurb: 'Crank–slider mechanism, valves and spark synchronised with the Otto P–V diagram.',
    desc: R`<h3>Four strokes, two crank revolutions</h3><ol><li><b>Intake</b> (inlet valve open): piston moves TDC→BDC drawing in fuel–air mixture at ~atmospheric pressure.</li><li><b>Compression</b>: both valves closed; mixture compressed (≈ isentropic in the ideal Otto model).</li><li><b>Combustion + power</b>: spark near TDC → rapid pressure rise (≈ constant-volume heat addition), then expansion pushes the piston down.</li><li><b>Exhaust</b>: exhaust valve opens, products are pushed out.</li></ol>
    <p>The real indicator diagram has rounded corners (finite combustion time, valve timing, heat loss) and a small negative “pumping loop” during intake/exhaust. Indicated work = loop area; \(\text{MEP}=W_{net}/V_d\); indicated power \(=\text{MEP}\cdot V_d\cdot N/2\) for a four-stroke engine.</p>
    <p>Piston position from crank angle θ: \(x=r\cos\theta+\sqrt{l^2-r^2\sin^2\theta}\).</p>`,
    mount(el) {
      const c = A.ctrl(el), rpm = A.slider(c, 'Speed', 10, 120, 5, 40, v => v + ' rpm (slow-motion)'), rc = A.slider(c, 'Compression ratio', 6, 12, 0.5, 9);
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 420, 460), pv = U.canvas(Rr, 520, 460); let th = 0; const trail = [];
      return A.loop(dt => {
        th += dt * rpm.val() / 60 * 2 * Math.PI; const cyc = (th % (4 * Math.PI)); const stroke = Math.floor(cyc / Math.PI); const r = 60, l = 150;
        const ang = cyc; const xp = r * Math.cos(ang) + Math.sqrt(l * l - r * r * Math.sin(ang) ** 2); // from crank centre
        const ctx = cv.ctx; ctx.clearRect(0, 0, 420, 460); const cx = 210, cyy = 390, top = cyy - (r + l) - 30;
        const yP = cyy - xp; const Vc = 1 / (rc.val() - 1), Vn = Vc + (r + l - xp) / (2 * r); // normalised volume (Vd = 1)
        // gas pressure model (normalised)
        const k = 1.35; let P;
        const P1 = 1, P2 = P1 * Math.pow((1 + Vc) / Vc, k), P3 = P2 * 3.2;
        if (stroke === 0) P = 0.95; else if (stroke === 1) P = P1 * Math.pow((1 + Vc) / Vn, k); else if (stroke === 2) P = P3 * Math.pow(Vc / Vn, k); else P = 1.08;
        // cylinder
        ctx.fillStyle = stroke === 2 ? A.heat(0.4 + 0.5 * Math.max(0, 1 - (cyc - 2 * Math.PI) / Math.PI)) : stroke === 0 ? 'rgba(80,160,230,.35)' : stroke === 1 ? 'rgba(120,170,230,.5)' : 'rgba(140,140,140,.35)';
        ctx.fillRect(cx - 70, top + 20, 140, yP - top - 30);
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 72, cyy - r - l + 60); ctx.lineTo(cx - 72, top + 18); ctx.lineTo(cx + 72, top + 18); ctx.lineTo(cx + 72, cyy - r - l + 60); ctx.stroke();
        // valves
        const iv = stroke === 0 ? 10 : 0, ev = stroke === 3 ? 10 : 0; ctx.lineWidth = 5; ctx.strokeStyle = U.cssVar('--cool'); ctx.beginPath(); ctx.moveTo(cx - 40, top - 10 + iv); ctx.lineTo(cx - 40, top + 14 + iv); ctx.stroke(); ctx.strokeStyle = U.cssVar('--muted'); ctx.beginPath(); ctx.moveTo(cx + 40, top - 10 + ev); ctx.lineTo(cx + 40, top + 14 + ev); ctx.stroke();
        A.text(ctx, 'inlet', cx - 40, top - 16, { align: 'center', size: 11 }); A.text(ctx, 'exhaust', cx + 40, top - 16, { align: 'center', size: 11 });
        if (stroke === 2 && cyc - 2 * Math.PI < 0.35) { ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(cx, top + 26, 9, 0, 7); ctx.fill(); }
        // piston, rod, crank
        ctx.fillStyle = U.cssVar('--muted'); ctx.fillRect(cx - 68, yP - 10, 136, 34);
        const crx = cx + r * Math.sin(ang), cry = cyy - r * Math.cos(ang);
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx, yP + 10); ctx.lineTo(crx, cry); ctx.stroke(); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx, cyy); ctx.lineTo(crx, cry); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cyy, r + 10, 0, 7); ctx.lineWidth = 2; ctx.stroke();
        A.text(ctx, ['1 · INTAKE', '2 · COMPRESSION', '3 · POWER', '4 · EXHAUST'][stroke], 210, 22, { align: 'center', bold: true, size: 15 });
        trail.push({ V: Vn, P }); if (trail.length > 600) trail.shift();
        U.plot(pv, { series: [{ x: trail.map(t => t.V), y: trail.map(t => t.P), color: U.cssVar('--hot') }], marks: [{ x: Vn, y: P, r: 7, color: U.cssVar('--fg') }], xlabel: 'V / V_d', ylabel: 'P / P_atm', title: 'Indicator (P–V) diagram', xlim: [0, 1.25], ylim: [0, P3 * 1.05] });
      });
    }
  });

  /* ======================= Refrigeration / Rankine loop ======================= */
  const loopAnim = (kind) => ({
    title: kind === 'vcr' ? 'Vapour-compression refrigerator: follow the refrigerant' : 'Steam power plant (Rankine cycle): follow the water',
    part: 'thermo', blurb: kind === 'vcr' ? 'Compressor → condenser → expansion valve → evaporator, with the state moving on the P–h chart.' : 'Pump → boiler → turbine → condenser with the state moving on the T–s diagram.',
    desc: kind === 'vcr' ? R`<h3>How a refrigerator moves heat uphill</h3><ol><li><b>1→2 Compressor</b>: low-pressure vapour is compressed to high pressure and temperature (work input \(w=h_2-h_1\)).</li><li><b>2→3 Condenser</b>: hot vapour rejects heat to the room (\(q_H=h_2-h_3\)) and condenses to liquid — the warm coils at the back of a fridge.</li><li><b>3→4 Expansion valve</b>: throttling, \(h_4=h_3\). Pressure drops, part of the liquid flashes, and the mixture becomes very cold.</li><li><b>4→1 Evaporator</b>: the cold mixture absorbs heat from the food space (\(q_L=h_1-h_4\)) and evaporates.</li></ol><p>\(COP_R=q_L/w\). On the P–h chart the cycle is almost a rectangle; throttling is a vertical line. Particle colour: blue = liquid, purple = two-phase, red = vapour.</p>`
      : R`<h3>The Rankine cycle</h3><ol><li><b>1→2 Pump</b>: saturated liquid pumped to boiler pressure — tiny work because liquid volume is small (\(w_P\approx v\Delta P\)).</li><li><b>2→3 Boiler</b>: heat added at constant pressure: preheating, boiling at \(T_{sat}\), superheating.</li><li><b>3→4 Turbine</b>: steam expands, producing work; exit is usually a wet mixture.</li><li><b>4→1 Condenser</b>: steam condenses at low pressure (≈ 10 kPa, 46 °C) rejecting heat to cooling water.</li></ol><p>Efficiency rises with higher boiler pressure/temperature and lower condenser pressure; reheat keeps turbine exit moisture acceptable; regeneration (feedwater heating) raises the average temperature of heat addition.</p>`,
    mount(el) {
      const c = A.ctrl(el), sp = A.slider(c, 'Flow speed', 0.2, 3, 0.1, 1, v => v + '×');
      const wrap = h('div', { class: 'two' }); el.append(wrap); const L = h('div'), Rr = h('div'); wrap.append(L, Rr);
      const cv = U.canvas(L, 480, 420), dg = U.canvas(Rr, 500, 420); const read = h('div', { class: 'out' }); el.append(read);
      let F = null, S = null; let t = 0;
      const comps = kind === 'vcr' ? [['Compressor', 380, 210], ['Condenser', 240, 60], ['Expansion valve', 100, 210], ['Evaporator', 240, 360]] : [['Pump', 100, 210], ['Boiler', 240, 60], ['Turbine', 380, 210], ['Condenser', 240, 360]];
      const corners = kind === 'vcr' ? [[380, 360], [380, 60], [100, 60], [100, 360]] : [[100, 360], [100, 60], [380, 60], [380, 360]];
      U.fluid(kind === 'vcr' ? 'r134a' : 'water').then(f => {
        F = f;
        if (kind === 'vcr') { const se = F.satT(263.15), sc = F.satT(313.15); const s1 = F.state({ T: 263.15, x: 1 }), s2 = F.state({ P: sc.P, h: s1.h + (F.state({ P: sc.P, s: s1.s }).h - s1.h) / 0.8 }), s3 = F.state({ T: 313.15, x: 0 }), s4 = F.state({ P: se.P, h: s3.h }); S = [s1, s2, s3, s4]; }
        else { const c1 = F.state({ P: 10e3, x: 0 }), p2 = F.state({ P: 8e6, s: c1.s }), t3 = F.state({ P: 8e6, T: 773.15 }), t4 = F.state({ P: 10e3, s: t3.s }); S = [c1, p2, t3, t4]; }
      });
      const N = 40;
      return A.loop(dt => {
        if (!S) return; t = (t + dt * 0.06 * sp.val()) % 1;
        const ctx = cv.ctx; ctx.clearRect(0, 0, 480, 420);
        ctx.strokeStyle = U.cssVar('--line2'); ctx.lineWidth = 10; ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.stroke();
        // state along loop: 4 segments each with a process; interpolate enthalpy/state
        const segState = (u) => { const i = Math.floor(u * 4) % 4, f = u * 4 - Math.floor(u * 4); const a = S[i], b = S[(i + 1) % 4]; let st;
          try { if (kind === 'vcr') { if (i === 0) st = F.state({ s: a.s + (b.s - a.s) * f, P: a.P + (b.P - a.P) * f }); else if (i === 2) st = F.state({ P: Math.exp(Math.log(a.P) + (Math.log(b.P) - Math.log(a.P)) * f), h: a.h }); else st = F.state({ P: a.P, h: a.h + (b.h - a.h) * f }); }
            else { if (i === 0) st = F.state({ P: a.P + (b.P - a.P) * f, s: a.s }); else if (i === 2) st = F.state({ P: Math.exp(Math.log(a.P) + (Math.log(b.P) - Math.log(a.P)) * f), s: a.s }); else st = F.state({ P: a.P, h: a.h + (b.h - a.h) * f }); } } catch (e) { st = a; }
          return { st, i, f }; };
        const pos = (u) => { const i = Math.floor(u * 4) % 4, f = u * 4 - Math.floor(u * 4), a = corners[i], b = corners[(i + 1) % 4]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
        for (let j = 0; j < N; j++) { const u = (t + j / N) % 1, { st } = segState(u), [x, y] = pos(u); const xq = st.x == null ? (st.phase.includes('liquid') ? 0 : 1) : st.x; ctx.fillStyle = xq <= 0.001 ? '#3b82f6' : xq >= 0.999 ? '#ef4444' : '#8b5cf6'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
        comps.forEach(([n, x, y], i) => { ctx.fillStyle = U.cssVar('--panel'); ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 2; ctx.fillRect(x - 58, y - 22, 116, 44); ctx.strokeRect(x - 58, y - 22, 116, 44); A.text(ctx, n, x, y + 5, { align: 'center', bold: true, size: 12 }); });
        corners.forEach((p, i) => A.text(ctx, String(i + 1), p[0] + (p[0] > 240 ? 14 : -22), p[1] + (p[1] > 200 ? 18 : -8), { bold: true, color: U.cssVar('--hot') }));
        if (kind === 'vcr') { A.arrow(ctx, 240, 26, 240, 2, U.cssVar('--hot')); A.text(ctx, 'Q_H to room', 252, 16, { size: 11 }); A.arrow(ctx, 240, 418, 240, 390, U.cssVar('--cool')); A.text(ctx, 'Q_L from food', 252, 412, { size: 11 }); A.arrow(ctx, 470, 210, 440, 210, U.cssVar('--fg')); A.text(ctx, 'W', 450, 200, { size: 12, bold: true }); }
        else { A.arrow(ctx, 240, 2, 240, 30, U.cssVar('--hot')); A.text(ctx, 'Q_in (fuel)', 252, 14, { size: 11 }); A.arrow(ctx, 240, 390, 240, 418, U.cssVar('--cool')); A.text(ctx, 'Q_out (cooling water)', 252, 412, { size: 11 }); A.arrow(ctx, 440, 210, 474, 210, U.cssVar('--fg')); A.text(ctx, 'W_T', 444, 200, { size: 12, bold: true }); }
        const { st, i } = segState(t);
        if (kind === 'vcr') U.drawPh(dg, F, [...S.map((s, j) => ({ x: s.h, y: s.P / 1e3, label: String(j + 1), r: 3 })), { x: st.h, y: st.P / 1e3, r: 7, color: U.cssVar('--hot') }], { lines: [{ x: [...S.map(s => s.h), S[0].h], y: [...S.map(s => s.P / 1e3), S[0].P / 1e3], color: U.cssVar('--hot') }], xlim: [150, 460], title: 'R-134a on the P–h chart' });
        else U.drawTs(dg, F, [...S.map((s, j) => ({ x: s.s, y: s.T - K, label: String(j + 1), r: 3 })), { x: st.s, y: st.T - K, r: 7, color: U.cssVar('--hot') }], { lines: [{ ...U.isobarTs(F, 8e6, S[1].T, 773.15), color: U.cssVar('--hot'), width: 1.3 }, { x: [S[3].s, S[0].s], y: [S[3].T - K, S[0].T - K], color: U.cssVar('--cool') }, { x: [S[2].s, S[3].s], y: [S[2].T - K, S[3].T - K], color: U.cssVar('--muted') }], title: 'Water on the T–s diagram (8 MPa, 500 °C, 10 kPa)' });
        read.innerHTML = [['Now in', comps[kind === 'vcr' ? i : i][0]], ['P', U.fmt(st.P / 1e3, 4) + ' kPa'], ['T', U.fmt(st.T - K, 4) + ' °C'], ['h', U.fmt(st.h, 5) + ' kJ/kg'], ['phase', st.phase], [kind === 'vcr' ? 'COP' : 'η', U.fmt(kind === 'vcr' ? (S[0].h - S[3].h) / (S[1].h - S[0].h) : ((S[2].h - S[3].h) - (S[1].h - S[0].h)) / (S[2].h - S[1].h), 4)]].map(([x, y]) => `<div><span>${x}</span><b>${y}</b></div>`).join('');
      });
    }
  });
  U.addAnim('vcr', loopAnim('vcr'));
  U.addAnim('rankine', loopAnim('rankine'));

  /* ======================= Entropy: mixing & free expansion ======================= */
  U.addAnim('mixing', {
    title: 'Irreversibility you can see: free expansion and mixing of gases', part: 'thermo', blurb: 'Remove the partition and watch entropy rise; the reverse never happens spontaneously.',
    desc: R`<h3>Why entropy increases</h3><p>Remove the partition: molecules spread to fill the whole box. Energy is conserved (an isolated, rigid box: \(Q=W=0\), so \(\Delta U=0\) and for an ideal gas \(T\) is unchanged), yet the process never reverses by itself. The number of microscopic arrangements available rises enormously; Boltzmann’s \(S=k\ln\Omega\) quantifies this.</p>
    <ul><li><b>Free expansion</b> into vacuum: \(\Delta S=mR\ln(V_2/V_1)=mR\ln2\) — entropy generated with no heat transfer at all.</li><li><b>Mixing</b> two different gases at the same T, P: \(\Delta S_{mix}=-\bar R\sum n_i\ln y_i\) — for equal amounts, \(2n\bar R\ln 2\).</li></ul><p>The live counter shows the fraction of molecules on the left and an estimate of the mixing entropy from the actual left/right distribution. Fluctuations exist but become vanishingly unlikely to restore the initial state as N grows — the statistical origin of the second law.</p>`,
    mount(el) {
      const c = A.ctrl(el), mode = A.select(c, 'Experiment', [['exp', 'Free expansion into vacuum'], ['mix', 'Mixing of two gases']], 'mix'), n = A.slider(c, 'Molecules', 50, 600, 50, 300); A.button(c, '↺ Reset', () => reset()); A.button(c, '⇥ Remove partition', () => { open = true; });
      const cv = U.canvas(el, 820, 360); const read = h('div', { class: 'out' }); el.append(read); let P = [], open = false, hist = [];
      const reset = () => { open = false; hist = []; P = Array.from({ length: n.val() }, (_, i) => { const left = mode.value === 'exp' ? true : i % 2 === 0; return { L: left, x: left ? Math.random() * 0.48 : 0.52 + Math.random() * 0.48, y: Math.random(), vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), c: mode.value === 'exp' ? 0 : (left ? 0 : 1) }; }); };
      mode.onchange = reset; n.addEventListener('change', reset); reset();
      return A.loop(dt => {
        const ctx = cv.ctx; ctx.clearRect(0, 0, 820, 360); const W = 560, H = 300, ox = 20, oy = 30;
        P.forEach(p => { p.x += p.vx * dt * 0.6; p.y += p.vy * dt * 0.6 * W / H; if (p.y < 0 || p.y > 1) { p.vy *= -1; p.y = Math.max(0, Math.min(1, p.y)); } if (p.x < 0 || p.x > 1) { p.vx *= -1; p.x = Math.max(0, Math.min(1, p.x)); } if (!open) { if (p.L && p.x > 0.494) { p.vx = -Math.abs(p.vx); p.x = 0.494; } if (!p.L && p.x < 0.506) { p.vx = Math.abs(p.vx); p.x = 0.506; } } });
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 3; ctx.strokeRect(ox, oy, W, H); if (!open) { ctx.beginPath(); ctx.moveTo(ox + W / 2, oy); ctx.lineTo(ox + W / 2, oy + H); ctx.stroke(); }
        P.forEach(p => { ctx.fillStyle = p.c ? U.cssVar('--cool') : U.cssVar('--hot'); ctx.beginPath(); ctx.arc(ox + p.x * W, oy + p.y * H, 3, 0, 7); ctx.fill(); });
        // entropy estimate
        const Nn = P.length; let s = 0; if (mode.value === 'exp') { const nl = P.filter(p => p.x < 0.5).length / Nn; s = -(nl * Math.log(nl || 1) + (1 - nl) * Math.log(1 - nl || 1)) / Math.log(2); }
        else { for (const side of [0, 1]) { const inS = P.filter(p => (p.x >= 0.5) === !!side); const a = inS.filter(p => p.c === 0).length, b = inS.length - a; const y = [a, b].map(q => q / (inS.length || 1)); s += inS.length / Nn * -y.reduce((t, yi) => t + (yi > 0 ? yi * Math.log(yi) : 0), 0) / Math.log(2); } }
        hist.push(s); if (hist.length > 600) hist.shift();
        ctx.strokeStyle = U.cssVar('--green'); ctx.lineWidth = 2; ctx.beginPath(); hist.forEach((v, i) => { const x = 600 + i * 210 / 600, y = 320 - v * 260; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.strokeStyle = U.cssVar('--line2'); ctx.strokeRect(600, 60, 210, 260);
        A.text(ctx, 'ΔS / ΔS_max', 705, 50, { align: 'center', bold: true, size: 12 }); A.text(ctx, 'time →', 705, 340, { align: 'center', size: 11 });
        A.text(ctx, open ? 'Partition removed — irreversible spreading' : 'Press “Remove partition”', ox + W / 2, 20, { align: 'center', bold: true });
        read.innerHTML = `<div><span>Fraction on left</span><b>${U.fmt(P.filter(p => p.x < 0.5).length / Nn, 3)}</b></div><div><span>ΔS / ΔS<sub>max</sub></span><b>${U.fmt(s, 3)}</b></div><div><span>Ideal-gas result</span><b>${mode.value === 'exp' ? 'ΔS = mR ln 2' : 'ΔS = 2nR̄ ln 2'}</b></div>`;
      });
    }
  });

  /* ======================= Nozzle / throttle ======================= */
  U.addAnim('nozzle', {
    title: 'Steady-flow devices: nozzle, diffuser and throttling valve', part: 'thermo', blurb: 'Enthalpy converts to kinetic energy in a nozzle; in a throttle it does not — but entropy rises.',
    desc: R`<h3>One equation, three devices</h3><p>For adiabatic, work-free steady flow: \(h_1+\tfrac{V_1^2}{2}=h_2+\tfrac{V_2^2}{2}\).</p><ul><li><b>Nozzle</b> (converging, subsonic): area falls, velocity rises, pressure and enthalpy fall. Steam and gas turbines, rockets, jet engines.</li><li><b>Diffuser</b>: the reverse — flow slows, pressure recovers (jet-engine inlets, pump volutes).</li><li><b>Throttling valve / porous plug</b>: pressure falls through friction, but velocities are similar on both sides, so \(h_2=h_1\). For an ideal gas T stays constant; for real fluids T changes (Joule–Thomson effect), which is how refrigerators and gas liquefiers make cold. Throttling is highly irreversible: \(\Delta s=-R\ln(P_2/P_1)>0\).</li></ul><p>Particle speed is drawn to scale with local velocity; colour shows local pressure (red high, blue low). Mass conservation \(\dot m=\rho AV\) explains why the particles bunch or spread.</p>`,
    mount(el) {
      const c = A.ctrl(el), dev = A.select(c, 'Device', [['noz', 'Nozzle'], ['dif', 'Diffuser'], ['thr', 'Throttling valve']], 'noz');
      const cv = U.canvas(el, 860, 330); const read = h('div', { class: 'out' }); el.append(read);
      let P = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random() * 2 - 1 }));
      return A.loop(dt => {
        const d = dev.value, ctx = cv.ctx; ctx.clearRect(0, 0, 860, 330); const ox = 40, W = 780, cy = 165;
        const half = x => d === 'noz' ? 110 - 70 * Math.min(1, Math.max(0, (x - 0.2) / 0.6)) : d === 'dif' ? 40 + 70 * Math.min(1, Math.max(0, (x - 0.2) / 0.6)) : (Math.abs(x - 0.5) < 0.03 ? 18 : 90);
        const V = x => d === 'thr' ? (Math.abs(x - 0.5) < 0.03 ? 5 : 1) : 110 / half(x) * (d === 'noz' ? 0.6 : 1.6) ;
        const Pn = x => d === 'noz' ? 1 - 0.75 * Math.min(1, Math.max(0, (x - 0.2) / 0.6)) ** 1.3 : d === 'dif' ? 0.3 + 0.6 * Math.min(1, Math.max(0, (x - 0.2) / 0.6)) : (x < 0.5 ? 1 : 0.35);
        // walls
        ctx.strokeStyle = U.cssVar('--fg'); ctx.lineWidth = 4; for (const s of [1, -1]) { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200, y = cy - s * half(x); i ? ctx.lineTo(ox + x * W, y) : ctx.moveTo(ox + x * W, y); } ctx.stroke(); }
        P.forEach(p => { p.x += V(p.x) * dt * 0.12; if (p.x > 1) { p.x = 0; p.y = Math.random() * 2 - 1; } ctx.fillStyle = A.cool2hot(Pn(p.x)); ctx.beginPath(); ctx.arc(ox + p.x * W, cy + p.y * half(p.x) * 0.92, 3.4, 0, 7); ctx.fill(); });
        A.text(ctx, 'inlet 1', ox + 10, 30, { bold: true }); A.text(ctx, 'exit 2', ox + W - 60, 30, { bold: true });
        const v1 = V(0.05) * 50, v2 = V(0.98) * 50;
        const rows = d === 'thr' ? [['V₁ ≈ V₂', 'similar'], ['h₂', '= h₁'], ['P₂/P₁', '0.35'], ['Δs (ideal gas)', U.fmt(-0.287 * Math.log(0.35), 4) + ' kJ/kg·K'], ['T (ideal gas)', 'unchanged'], ['Real fluid', 'T changes (Joule–Thomson)']] : [['V₁ (illustr.)', U.fmt(v1, 3) + ' m/s'], ['V₂ (illustr.)', U.fmt(v2, 3) + ' m/s'], ['Δh = (V₁²−V₂²)/2', U.fmt((v1 * v1 - v2 * v2) / 2000, 4) + ' kJ/kg'], ['Pressure', d === 'noz' ? 'falls' : 'rises']];
        read.innerHTML = rows.map(([x, y]) => `<div><span>${x}</span><b>${y}</b></div>`).join('');
      });
    }
  });
})();
