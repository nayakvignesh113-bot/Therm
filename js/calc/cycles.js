/* Cycles, psychrometrics, combustion */
'use strict';
(() => {
  const { h } = U; const K = 273.15;
  const CAT = 'Thermodynamics — power & refrigeration cycles';
  const stateTable = (rows, cols) => '<div class="tablewrap"><table class="num"><tr>' + cols.map(c => `<th>${c[0]}</th>`).join('') + '</tr>' + rows.map(r => '<tr>' + cols.map(c => `<td>${typeof r[c[1]] === 'number' ? U.fmt(r[c[1]], 5) : (r[c[1]] ?? '—')}</td>`).join('') + '</tr>').join('') + '</table></div>';
  U.stateTable = stateTable;

  /* ---------- air model helpers ---------- */
  const airModel = (vari, k = 1.4) => {
    const Ra = 0.287, cp = 1.005, cv = cp / k; // cold-air standard uses k given
    if (!vari) return {
      Ra, cp: Ra * k / (k - 1), cv: Ra / (k - 1), k,
      h: T => Ra * k / (k - 1) * T, u: T => Ra / (k - 1) * T, s: (T, P) => Ra * k / (k - 1) * Math.log(T / 300) - Ra * Math.log(P / 100),
      Tisen_v: (T, v1, v2) => T * Math.pow(v1 / v2, k - 1), Tisen_P: (T, P1, P2) => T * Math.pow(P2 / P1, (k - 1) / k),
      Th: hh => hh / (Ra * k / (k - 1)), Tu: uu => uu / (Ra / (k - 1))
    };
    return {
      Ra, vari: true, h: T => U.IG.air('h', T), u: T => U.IG.air('u', T), s: (T, P) => U.IG.air('s0', T) - Ra * Math.log(P / 100),
      Tisen_v: (T, v1, v2) => U.IG.airT('vr', U.IG.air('vr', T) * v2 / v1), Tisen_P: (T, P1, P2) => U.IG.airT('Pr', U.IG.air('Pr', T) * P2 / P1),
      Th: hh => U.IG.airT('h', hh), Tu: uu => U.IG.airT('u', uu)
    };
  };
  // path generator for plotting
  const path = (M, a, b, type, n = 40) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1); let T, v;
      if (type === 's') { v = a.v * Math.pow(b.v / a.v, f); T = M.Tisen_v(a.T, a.v, v); }
      else if (type === 'v') { v = a.v; T = a.T + (b.T - a.T) * f; }
      else if (type === 'p') { T = a.T + (b.T - a.T) * f; v = M.Ra * T / a.P; }
      else if (type === 'poly') { v = a.v * Math.pow(b.v / a.v, f); const P = a.P * Math.pow(b.P / a.P, f); T = P * v / M.Ra; }
      else { T = a.T; v = a.v * Math.pow(b.v / a.v, f); }
      const P = M.Ra * T / v; pts.push({ v, P, T, s: M.s(T, P) });
    }
    return pts;
  };
  const plotCycle = (el, M, legs, states) => {
    const w = h('div', { class: 'two' }); el.append(w); const a = h('div'), b = h('div'); w.append(a, b);
    const ser1 = [], ser2 = [];
    legs.forEach(([i, j, t], k) => { const p = path(M, states[i], states[j], t); const col = U.cssVar(['--hot', '--cool', '--warm', '--green', '--violet', '--muted'][k % 6]); ser1.push({ x: p.map(q => q.v), y: p.map(q => q.P), color: col }); ser2.push({ x: p.map(q => q.s), y: p.map(q => q.T - K), color: col }); });
    U.plot(U.canvas(a, 520, 380), { series: ser1, marks: states.map((s, i) => ({ x: s.v, y: s.P, label: s.n || String(i + 1) })), xlabel: 'v [m³/kg]', ylabel: 'P [kPa]', title: 'P–v diagram' });
    U.plot(U.canvas(b, 520, 380), { series: ser2, marks: states.map((s, i) => ({ x: s.s, y: s.T - K, label: s.n || String(i + 1) })), xlabel: 's [kJ/kg·K] (relative)', ylabel: 'T [°C]', title: 'T–s diagram' });
  };

  /* ======================= Air-standard reciprocating cycles ======================= */
  U.addCalc('aircycle', {
    title: 'Air-standard cycles: Otto, Diesel, Dual, Stirling, Ericsson, Atkinson', cat: CAT, blurb: 'State table, net work, efficiency, MEP, P–v and T–s diagrams — cold-air or variable-cp analysis.',
    desc: R`<p><b>Otto</b> \(\eta=1-r^{1-k}\); <b>Diesel</b> \(\eta=1-\dfrac{1}{r^{k-1}}\dfrac{r_c^k-1}{k(r_c-1)}\); <b>Dual</b> \(\eta=1-\dfrac{r_pr_c^k-1}{r^{k-1}[(r_p-1)+kr_p(r_c-1)]}\); <b>Stirling/Ericsson</b> with ideal regeneration reach Carnot. MEP \(=w_{net}/(v_{max}-v_{min})\). Variable-\(c_p\) mode uses air tables (\(u, h, v_r, P_r\)).</p>`,
    inputs: [{ k: 'cyc', l: 'Cycle', v: 'otto', opts: [['otto', 'Otto (SI engine)'], ['diesel', 'Diesel (CI engine)'], ['dual', 'Dual / limited-pressure'], ['atk', 'Atkinson (over-expanded)'], ['stir', 'Stirling (ideal regeneration)'], ['eric', 'Ericsson (ideal regeneration)']] },
    { k: 'model', l: 'Property model', v: 'cold', opts: [['cold', 'Cold-air standard (constant k)'], ['var', 'Variable specific heats (air tables)']] }, { k: 'k', l: 'k (cold-air)', v: 1.4 },
    { k: 'P1', l: 'P₁ (start of compression)', u: 'kPa', v: 100 }, { k: 'T1', l: 'T₁', u: '°C', v: 27 }, { k: 'r', l: 'Compression ratio r = v₁/v₂ (Stirling/Ericsson: volume or pressure ratio)', v: 8 },
    { k: 'T3', l: 'Peak temperature T<sub>max</sub> (Otto, Atkinson, Stirling, Ericsson)', u: '°C', v: 1400 }, { k: 'rc', l: 'Cut-off ratio r<sub>c</sub> = v₃/v₂ (Diesel, Dual)', v: 2 }, { k: 'rp', l: 'Pressure ratio r<sub>p</sub> = P₃/P₂ (Dual)', v: 1.5 }],
    show: v => ({ k: v.model === 'cold', T3: ['otto', 'atk', 'stir', 'eric'].includes(v.cyc), rc: ['diesel', 'dual'].includes(v.cyc), rp: v.cyc === 'dual' }),
    async run(v) {
      if (v.model === 'var') await U.IG.load();
      const M = airModel(v.model === 'var', v.k), Ra = M.Ra; const T1 = v.T1 + K, P1 = v.P1, v1 = Ra * T1 / P1, r = v.r, Tmax = v.T3 + K;
      const st = (T, vv, n) => ({ T, v: vv, P: Ra * T / vv, n }); const S = []; let legs = [], qin = 0, qout = 0, ideal = null;
      S.push(st(T1, v1, '1'));
      if (v.cyc === 'stir' || v.cyc === 'eric') {
        const TL = T1, TH = Tmax; if (TH <= TL) throw new Error('T_max must exceed T₁');
        if (v.cyc === 'stir') { // 1→2 isothermal compression at TL (v1→v1/r), 2→3 v=const heating, 3→4 isothermal exp, 4→1 v=const cooling
          const v2 = v1 / r; S.push(st(TL, v2, '2'), st(TH, v2, '3'), st(TH, v1, '4')); legs = [[0, 1, 'T'], [1, 2, 'v'], [2, 3, 'T'], [3, 0, 'v']];
        } else { const P2 = P1 * r; S.push(st(TL, Ra * TL / P2, '2'), st(TH, Ra * TH / P2, '3'), st(TH, Ra * TH / P1, '4')); legs = [[0, 1, 'T'], [1, 2, 'p'], [2, 3, 'T'], [3, 0, 'p']]; }
        const qH = Ra * TH * Math.log(S[3].v / S[2].v), qL = Ra * TL * Math.log(S[0].v / S[1].v); qin = qH; qout = qL; ideal = 1 - TL / TH;
      } else {
        const v2 = v1 / r, T2 = M.Tisen_v(T1, v1, v2); S.push(st(T2, v2, '2'));
        if (v.cyc === 'otto' || v.cyc === 'atk') {
          if (Tmax <= T2) throw new Error('T_max must exceed compression end temperature ' + U.fmt(T2 - K, 4) + ' °C');
          S.push(st(Tmax, v2, '3')); qin = M.u(Tmax) - M.u(T2);
          if (v.cyc === 'otto') { const T4 = M.Tisen_v(Tmax, v2, v1); S.push(st(T4, v1, '4')); qout = M.u(T4) - M.u(T1); legs = [[0, 1, 's'], [1, 2, 'v'], [2, 3, 's'], [3, 0, 'v']]; if (!M.vari) ideal = 1 - Math.pow(r, 1 - v.k); }
          else { // expand to P1
            const P3 = S[2].P, T4 = M.vari ? U.IG.airT('Pr', U.IG.air('Pr', Tmax) * P1 / P3) : Tmax * Math.pow(P1 / P3, (v.k - 1) / v.k); S.push(st(T4, Ra * T4 / P1, '4')); qout = M.h(T4) - M.h(T1); legs = [[0, 1, 's'], [1, 2, 'v'], [2, 3, 's'], [3, 0, 'p']]; }
        } else {
          let i3 = 2;
          if (v.cyc === 'dual') { const Tx = T2 * v.rp; S.push(st(Tx, v2, '3')); qin += M.u(Tx) - M.u(T2); i3 = 3; }
          const Tb = S[i3 - 1].T, vb = v2 * v.rc, T3 = Tb * v.rc; S.push(st(T3, vb, String(i3 + 1))); qin += M.h(T3) - M.h(Tb);
          const T4 = M.Tisen_v(T3, vb, v1); S.push(st(T4, v1, String(i3 + 2))); qout = M.u(T4) - M.u(T1);
          legs = v.cyc === 'dual' ? [[0, 1, 's'], [1, 2, 'v'], [2, 3, 'p'], [3, 4, 's'], [4, 0, 'v']] : [[0, 1, 's'], [1, 2, 'p'], [2, 3, 's'], [3, 0, 'v']];
          if (!M.vari) { const k = v.k; ideal = v.cyc === 'diesel' ? 1 - Math.pow(r, 1 - k) * (Math.pow(v.rc, k) - 1) / (k * (v.rc - 1)) : 1 - (v.rp * Math.pow(v.rc, k) - 1) / (Math.pow(r, k - 1) * ((v.rp - 1) + k * v.rp * (v.rc - 1))); }
        }
      }
      S.forEach(s => { s.s = M.s(s.T, s.P); s.u = M.u(s.T); s.h = M.h(s.T); s.TC = s.T - K; });
      const wnet = qin - qout, eta = wnet / qin, vmax = Math.max(...S.map(s => s.v)), vmin = Math.min(...S.map(s => s.v));
      const Tmx = Math.max(...S.map(s => s.T)), Tmn = Math.min(...S.map(s => s.T));
      return {
        out: [['Thermal efficiency η', eta, '', 1], ['Net work w<sub>net</sub>', wnet, 'kJ/kg', 1], ['Heat added q<sub>in</sub>', qin, 'kJ/kg'], ['Heat rejected q<sub>out</sub>', qout, 'kJ/kg'], ['Mean effective pressure', wnet / (vmax - vmin), 'kPa', 1], ['Peak pressure', Math.max(...S.map(s => s.P)), 'kPa'], ['Peak temperature', Tmx - K, '°C'], ['Carnot η (same T<sub>max</sub>, T<sub>min</sub>)', 1 - Tmn / Tmx, ''], ['Closed-form η (cold-air)', ideal == null ? '—' : ideal, '']],
        html: stateTable(S, [['State', 'n'], ['P [kPa]', 'P'], ['T [°C]', 'TC'], ['v [m³/kg]', 'v'], ['u [kJ/kg]', 'u'], ['h [kJ/kg]', 'h'], ['s (rel.) [kJ/kg·K]', 's']]) + '<p class="small muted">Energy per kg of air. Cold-air values use u = c<sub>v</sub>T, h = c<sub>p</sub>T (absolute reference at 0 K); variable-cp values come from the ideal-gas air table.</p>',
        plot: el => plotCycle(el, M, legs, S)
      };
    }
  });

  /* ======================= Brayton gas turbine ======================= */
  U.addCalc('brayton', {
    title: 'Brayton gas-turbine cycle (regeneration, intercooling, reheat)', cat: CAT, blurb: 'Real compressor/turbine efficiencies, regenerator effectiveness, back-work ratio, optimum pressure ratio.',
    desc: R`<p>Ideal simple cycle: \(\eta=1-r_p^{(1-k)/k}\). Real cycle: \(w_C=h_2-h_1\) with \(h_2=h_1+(h_{2s}-h_1)/\eta_C\), \(w_T=\eta_T(h_3-h_{4s})\). Regenerator: \(h_x=h_2+\varepsilon(h_4-h_2)\) (only possible if \(T_4>T_2\)). Back-work ratio \(=w_C/w_T\).</p>`,
    inputs: [{ k: 'model', l: 'Property model', v: 'var', opts: [['cold', 'Cold-air (k = 1.4)'], ['var', 'Variable cp (air tables)']] }, { k: 'P1', l: 'Compressor inlet P₁', u: 'kPa', v: 100 }, { k: 'T1', l: 'Compressor inlet T₁', u: '°C', v: 27 },
    { k: 'rp', l: 'Overall pressure ratio r<sub>p</sub>', v: 10 }, { k: 'T3', l: 'Turbine inlet T₃', u: '°C', v: 1100 }, { k: 'ec', l: 'Compressor η<sub>C</sub>', v: 0.85 }, { k: 'et', l: 'Turbine η<sub>T</sub>', v: 0.88 },
    { k: 'eps', l: 'Regenerator effectiveness ε (0 = none)', v: 0 }, { k: 'ic', l: 'Two-stage compression with intercooling', v: 'no', opts: [['no', 'No'], ['yes', 'Yes (perfect, √r<sub>p</sub>)']] }, { k: 'rh', l: 'Two-stage expansion with reheat', v: 'no', opts: [['no', 'No'], ['yes', 'Yes (to T₃, √r<sub>p</sub>)']] }, { k: 'mdot', l: 'Air mass flow', u: 'kg/s', v: 20 }],
    async run(v) {
      if (v.model === 'var') await U.IG.load();
      const M = airModel(v.model === 'var', 1.4), Ra = .287, T1 = v.T1 + K, P1 = v.P1, P2 = P1 * v.rp, T3 = v.T3 + K;
      const comp = (Ta, Pa, Pb) => { const Ts = M.Tisen_P(Ta, Pa, Pb); const hb = M.h(Ta) + (M.h(Ts) - M.h(Ta)) / v.ec; return M.Th(hb); };
      const turb = (Ta, Pa, Pb) => { const Ts = M.Tisen_P(Ta, Pa, Pb); const hb = M.h(Ta) - v.et * (M.h(Ta) - M.h(Ts)); return M.Th(hb); };
      const S = [], st = (T, P, n) => ({ T, P, v: Ra * T / P, n }); let wc = 0, wt = 0, qin = 0;
      S.push(st(T1, P1, '1'));
      let Tc;
      if (v.ic === 'yes') { const Pm = Math.sqrt(P1 * P2); const Ta = comp(T1, P1, Pm); S.push(st(Ta, Pm, '1a')); S.push(st(T1, Pm, '1b')); const Tb = comp(T1, Pm, P2); S.push(st(Tb, P2, '2')); wc = (M.h(Ta) - M.h(T1)) + (M.h(Tb) - M.h(T1)); Tc = Tb; }
      else { Tc = comp(T1, P1, P2); S.push(st(Tc, P2, '2')); wc = M.h(Tc) - M.h(T1); }
      // expansion
      let T4, exp = [];
      if (v.rh === 'yes') { const Pm = Math.sqrt(P1 * P2); const Ta = turb(T3, P2, Pm); const Tb = turb(T3, Pm, P1); exp = [st(T3, P2, '3'), st(Ta, Pm, '3a'), st(T3, Pm, '3b'), st(Tb, P1, '4')]; wt = (M.h(T3) - M.h(Ta)) + (M.h(T3) - M.h(Tb)); qin = M.h(T3) - M.h(Ta); T4 = Tb; }
      else { T4 = turb(T3, P2, P1); exp = [st(T3, P2, '3'), st(T4, P1, '4')]; wt = M.h(T3) - M.h(T4); }
      let hx = M.h(Tc), regen = false, warn = '';
      if (v.eps > 0) { if (T4 > Tc) { hx = M.h(Tc) + v.eps * (M.h(T4) - M.h(Tc)); regen = true; } else warn = '<p class="err">Regeneration impossible: turbine exhaust (' + U.fmt(T4 - K, 4) + ' °C) is colder than compressor exit (' + U.fmt(Tc - K, 4) + ' °C).</p>'; }
      const Tx = M.Th(hx); if (regen) S.push(st(Tx, P2, 'x'));
      qin += M.h(T3) - hx; S.push(...exp);
      if (regen) { const hy = M.h(T4) - (hx - M.h(Tc)); S.push(st(M.Th(hy), P1, 'y')); }
      S.forEach(s => { s.s = M.s(s.T, s.P); s.h = M.h(s.T); s.TC = s.T - K; });
      const wnet = wt - wc, eta = wnet / qin;
      const legs = []; for (let i = 0; i < S.length; i++) { const a = S[i], b = S[(i + 1) % S.length]; legs.push([i, (i + 1) % S.length, Math.abs(a.P - b.P) < 1e-6 ? 'p' : 's']); }
      return {
        out: [['Thermal efficiency η', eta, '', 1], ['Net work w<sub>net</sub>', wnet, 'kJ/kg', 1], ['Net power', wnet * v.mdot / 1000, 'MW', 1], ['Compressor work w<sub>C</sub>', wc, 'kJ/kg'], ['Turbine work w<sub>T</sub>', wt, 'kJ/kg'], ['Back-work ratio', wc / wt, ''], ['Heat input q<sub>in</sub>', qin, 'kJ/kg'], ['Turbine exhaust T₄', T4 - K, '°C'], ['Ideal simple-cycle η', 1 - Math.pow(v.rp, -0.4 / 1.4), ''], ['Carnot η', 1 - T1 / T3, '']],
        html: warn + stateTable(S, [['State', 'n'], ['P [kPa]', 'P'], ['T [°C]', 'TC'], ['h [kJ/kg]', 'h'], ['s (rel.)', 's']]),
        plot(el) {
          plotCycle(el, M, legs.map(l => [l[0], l[1], l[2] === 's' ? 'poly' : 'p']), S);
          // optimum-pressure-ratio study
          const rs = U.range(2, 40, 60), et = rs.map(rp => { try { const T2 = comp(T1, P1, P1 * rp), T4b = turb(T3, P1 * rp, P1); const wn = (M.h(T3) - M.h(T4b)) - (M.h(T2) - M.h(T1)); return [wn, wn / (M.h(T3) - M.h(T2))]; } catch (e) { return [NaN, NaN]; } });
          const c = h('div'); el.append(c);
          U.plot(U.canvas(c, 640, 330), { series: [{ x: rs, y: et.map(e => e[1] * 100), label: 'η [%] (simple cycle, same η_C, η_T)' }, { x: rs, y: et.map(e => e[0] / 10), label: 'w_net / 10 [kJ/kg]', color: U.cssVar('--cool') }], xlabel: 'Pressure ratio r_p', ylabel: 'η [%]  ·  w_net/10', title: 'Pressure-ratio study: max work and max efficiency occur at different r_p' });
        }
      };
    }
  });

  /* ======================= Rankine ======================= */
  U.addCalc('rankine', {
    title: 'Rankine steam power cycle (reheat, open/closed feedwater heater)', cat: CAT, blurb: 'Real pump/turbine efficiencies, state table, η, back-work ratio, specific steam consumption, T–s diagram.',
    desc: R`<p>Pump: \(w_P=v_1(P_2-P_1)/\eta_P\). Turbine: \(h_{out}=h_{in}-\eta_T(h_{in}-h_{out,s})\). Open FWH mass balance: \(y\,h_{bleed}+(1-y)h_{pump1}=h_f(P_{FWH})\). Closed FWH (drains cascaded to condenser, zero terminal temperature difference): \(y(h_{bleed}-h_{drain})=h_{fw,out}-h_{fw,in}\). SSC \(=3600/w_{net}\) kg/kWh.</p>`,
    inputs: [{ k: 'Pb', l: 'Boiler pressure', u: 'MPa', v: 15 }, { k: 'Tb', l: 'Turbine inlet T', u: '°C', v: 600 }, { k: 'Pc', l: 'Condenser pressure', u: 'kPa', v: 10 }, { k: 'et', l: 'Turbine η<sub>T</sub>', v: 0.87 }, { k: 'ep', l: 'Pump η<sub>P</sub>', v: 0.85 },
    { k: 'rh', l: 'Reheat', v: 'yes', opts: [['no', 'None'], ['yes', 'Single reheat']] }, { k: 'Prh', l: 'Reheat pressure', u: 'MPa', v: 3 }, { k: 'Trh', l: 'Reheat temperature', u: '°C', v: 600 },
    { k: 'fwh', l: 'Feedwater heater', v: 'open', opts: [['none', 'None'], ['open', 'Open (direct-contact)'], ['closed', 'Closed (drains to condenser)']] }, { k: 'Pf', l: 'Bleed / FWH pressure', u: 'MPa', v: 1 }, { k: 'W', l: 'Net power output', u: 'MW', v: 100 }],
    show: v => ({ Prh: v.rh === 'yes', Trh: v.rh === 'yes', Pf: v.fwh !== 'none' }),
    async run(v) {
      const F = await U.fluid('water'); const Pb = v.Pb * 1e6, Pc = v.Pc * 1e3, Prh = v.Prh * 1e6, Pf = v.Pf * 1e6, rh = v.rh === 'yes', fwh = v.fwh;
      if (rh && !(Prh < Pb && Prh > Pc)) throw new Error('Reheat pressure must lie between condenser and boiler pressures');
      if (fwh !== 'none' && !(Pf < Pb && Pf > Pc)) throw new Error('FWH pressure must lie between condenser and boiler pressures');
      const S = []; const add = (n, st) => { st.n = n; st.TC = st.T - K; st.Pk = st.P / 1e3; S.push(st); return st; };
      const expand = (a, P) => { const s2 = F.state({ P, s: a.s }); const hh = a.h - v.et * (a.h - s2.h); return F.state({ P, h: hh }); };
      const pump = (a, P) => { const s2 = F.state({ P, s: a.s }); const hh = a.h + (s2.h - a.h) / v.ep; return F.state({ P, h: hh }); };
      const tin = F.state({ P: Pb, T: v.Tb + K });
      // turbine path with optional bleed
      let wT = 0, y = 0, bleed = null, ex, qin = 0;
      const c1 = F.state({ P: Pc, x: 0 });
      let fwIn, wP = 0;
      if (fwh === 'open') { const p1 = pump(c1, Pf); const f = F.state({ P: Pf, x: 0 }); const p2 = pump(f, Pb); add('1', c1); add('2', p1); add('3', f); add('4', p2); wP = 0; fwIn = p2; }
      else if (fwh === 'closed') { const p1 = pump(c1, Pb); add('1', c1); add('2', p1); fwIn = p1; }
      else { const p1 = pump(c1, Pb); add('1', c1); add('2', p1); fwIn = p1; }
      // compute turbine states
      const hp = [], lp = [];
      add('in', tin);
      let cur = tin;
      if (rh) {
        if (fwh !== 'none' && Pf > Prh) { bleed = expand(tin, Pf); const a = expand(bleed, Prh); hp.push(bleed, a); cur = a; } else { const a = expand(tin, Prh); hp.push(a); cur = a; }
        const r = F.state({ P: Prh, T: v.Trh + K }); lp.push(r);
        if (fwh !== 'none' && Pf <= Prh) { bleed = Pf === Prh ? r : expand(r, Pf); ex = expand(bleed, Pc); } else ex = expand(r, Pc);
      } else {
        if (fwh !== 'none') { bleed = expand(tin, Pf); ex = expand(bleed, Pc); } else ex = expand(tin, Pc);
      }
      // mass fraction
      let fwOut = fwIn;
      if (fwh === 'open') { const f = S.find(s => s.n === '3'), p1 = S.find(s => s.n === '2'); y = (f.h - p1.h) / (bleed.h - p1.h); }
      if (fwh === 'closed') { const drain = F.state({ P: Pf, x: 0 }); fwOut = F.state({ P: Pb, T: Math.min(drain.T, F.Tsat(Pb) - 0.5) }); y = (fwOut.h - fwIn.h) / (bleed.h - drain.h); add('3 (FW out)', fwOut); add('drain', drain); }
      // work
      if (fwh === 'open') { const s = S; wP = (1 - y) * (s.find(q => q.n === '2').h - c1.h) + (s.find(q => q.n === '4').h - s.find(q => q.n === '3').h); } else wP = fwIn.h - c1.h;
      // turbine work accounting
      const seq = [tin]; if (rh) { hp.forEach(s => seq.push(s)); } else if (bleed) seq.push(bleed);
      if (rh) { // HP section
        let m = 1, last = tin;
        hp.forEach(s => { wT += m * (last.h - s.h); if (s === bleed) m -= y; last = s; });
        const r = lp[0]; qin += m * (r.h - last.h); add('reheat out', r);
        let lst = r; if (bleed && Pf <= Prh) { wT += m * (lst.h - bleed.h); m -= y; lst = bleed; } wT += m * (lst.h - ex.h);
        hp.forEach((s, i) => add(s === bleed ? 'bleed' : 'HP exit', s));
        if (bleed && Pf <= Prh && bleed !== r) add('bleed', bleed);
      } else { if (bleed) { wT = (tin.h - bleed.h) + (1 - y) * (bleed.h - ex.h); add('bleed', bleed); } else wT = tin.h - ex.h; }
      add('turbine exit', ex);
      qin += tin.h - fwOut.h;
      const wnet = wT - wP, eta = wnet / qin, mdot = v.W * 1e3 / wnet;
      const pts = S.map(s => ({ x: s.s, y: s.T - K, label: s.n, r: 4 }));
      return {
        out: [['Thermal efficiency η', eta, '', 1], ['Net work w<sub>net</sub>', wnet, 'kJ/kg steam', 1], ['Steam flow for ' + v.W + ' MW', mdot, 'kg/s', 1], ['Specific steam consumption', 3600 / wnet, 'kg/kWh'], ['Turbine work', wT, 'kJ/kg'], ['Pump work', wP, 'kJ/kg'], ['Back-work ratio', wP / wT, ''], ['Heat input', qin, 'kJ/kg'], ['Heat rate', 3600 / eta, 'kJ/kWh'], ['Turbine exit quality', ex.x == null ? 'superheated' : ex.x, ''], ['Bleed fraction y', fwh === 'none' ? '—' : y, ''], ['Condenser heat rejection', mdot * (1 - (fwh === 'closed' ? 0 : y)) * (ex.h - c1.h) / 1e3 + (fwh === 'closed' ? mdot * y * (S.find(s => s.n === 'drain').h - c1.h) / 1e3 : 0), 'MW'], ['Carnot η (T<sub>max</sub>,T<sub>cond</sub>)', 1 - c1.T / Math.max(tin.T, rh ? v.Trh + K : 0), '']],
        html: stateTable(S, [['State', 'n'], ['P [kPa]', 'Pk'], ['T [°C]', 'TC'], ['h [kJ/kg]', 'h'], ['s [kJ/kg·K]', 's'], ['x', 'x'], ['phase', 'phase']]).replace(/<td>(\d+(\.\d+)?)<\/td>/g, '<td>$1</td>') + (ex.x != null && ex.x < 0.88 ? '<div class="box warn"><b>Exit quality below ~0.88</b>Moisture this high erodes last-stage blades — raise turbine inlet temperature or add reheat.</div>' : ''),
        plot(el) {
          const c = h('div'); el.append(c);
          const lines = [{ ...U.isobarTs(F, Pb, c1.T, Math.max(tin.T, v.Trh + K) + 5), color: U.cssVar('--hot'), width: 1.2, label: 'boiler P' }, { ...U.isobarTs(F, Pc, c1.T - 1, c1.T + 30), color: U.cssVar('--cool'), width: 1.2, label: 'condenser P' }];
          if (rh) lines.push({ ...U.isobarTs(F, Prh, c1.T, v.Trh + K + 5), color: U.cssVar('--warm'), width: 1.2, label: 'reheat P' });
          U.drawTs(U.canvas(c, 760, 440), F, pts, { lines, title: 'Rankine cycle on T–s (water)' });
        }
      };
    }
  });

  /* ======================= Vapour-compression refrigeration ======================= */
  U.addCalc('vcr', {
    title: 'Vapour-compression refrigeration / heat pump', cat: CAT, blurb: 'Any refrigerant: COP, capacity, mass flow, compressor power and discharge temperature; P–h and T–s plots.',
    desc: R`<p>States: 1 evaporator exit (superheat), 2 compressor exit \(h_2=h_1+(h_{2s}-h_1)/\eta_C\), 3 condenser exit (subcooling), 4 after expansion \(h_4=h_3\). \(q_L=h_1-h_4\), \(w=h_2-h_1\), \(COP_R=q_L/w\), \(COP_{HP}=(h_2-h_3)/w\). 1 ton of refrigeration = 3.517 kW.</p>`,
    inputs: [{ k: 'fl', l: 'Refrigerant', v: 'r134a', opts: Object.entries(U.FLUIDS) }, { k: 'Te', l: 'Evaporating temperature', u: '°C', v: -10 }, { k: 'Tc', l: 'Condensing temperature', u: '°C', v: 40 },
    { k: 'sh', l: 'Superheat at evaporator exit', u: 'K', v: 5 }, { k: 'sc', l: 'Subcooling at condenser exit', u: 'K', v: 3 }, { k: 'ec', l: 'Compressor isentropic η', v: 0.8 }, { k: 'Q', l: 'Cooling capacity', u: 'kW', v: 10 }],
    async run(v) {
      const F = await U.fluid(v.fl); const Te = v.Te + K, Tc = v.Tc + K; if (Tc >= F.Tc) throw new Error('Condensing T must be below critical (' + U.fmt(F.Tc - K, 4) + ' °C) — for CO₂ use a transcritical analysis');
      const se = F.satT(Te), sc = F.satT(Tc);
      const s1 = v.sh > 0 ? F.state({ P: se.P, T: Te + v.sh }) : F.state({ T: Te, x: 1 });
      const s2s = F.state({ P: sc.P, s: s1.s }), h2 = s1.h + (s2s.h - s1.h) / v.ec, s2 = F.state({ P: sc.P, h: h2 });
      const s3 = v.sc > 0 ? F.state({ P: sc.P, T: Tc - v.sc }) : F.state({ T: Tc, x: 0 });
      const s4 = F.state({ P: se.P, h: s3.h });
      const qL = s1.h - s4.h, w = h2 - s1.h, cop = qL / w, m = v.Q / qL;
      const S = [s1, s2, s3, s4]; S.forEach((s, i) => { s.n = String(i + 1); s.TC = s.T - K; s.Pk = s.P / 1e3; });
      return {
        out: [['COP (refrigerator)', cop, '', 1], ['COP (heat pump)', (h2 - s3.h) / w, ''], ['Refrigerant flow', m, 'kg/s', 1], ['Compressor power', m * w, 'kW', 1], ['Heat rejected Q<sub>H</sub>', m * (h2 - s3.h), 'kW'], ['Refrigerating effect q<sub>L</sub>', qL, 'kJ/kg'], ['Discharge temperature', s2.T - K, '°C'], ['Pressure ratio', sc.P / se.P, ''], ['Suction volume flow', m * s1.v * 3600, 'm³/h'], ['Quality after valve x₄', s4.x, ''], ['Carnot COP', Te / (Tc - Te), ''], ['Capacity', v.Q / 3.51685, 'TR']],
        html: stateTable(S, [['State', 'n'], ['P [kPa]', 'Pk'], ['T [°C]', 'TC'], ['h [kJ/kg]', 'h'], ['s [kJ/kg·K]', 's'], ['x', 'x']]),
        plot(el) {
          const w2 = h('div', { class: 'two' }); el.append(w2); const a = h('div'), b = h('div'); w2.append(a, b);
          const cyc = { x: [s1.h, s2.h, sc.hg, sc.hf, s3.h, s4.h, s1.h], y: [s1.P, s2.P, sc.P, sc.P, s3.P, s4.P, s1.P].map(p => p / 1e3), color: U.cssVar('--hot'), label: 'cycle' };
          U.drawPh(U.canvas(a, 520, 400), F, S.map(s => ({ x: s.h, y: s.P / 1e3, label: s.n })), { lines: [cyc], xlim: [Math.min(F.sat.hf[0], s4.h) - 10, Math.max(s2.h + 30, sc.hg + 30)] });
          const iso = U.isobarTs(F, sc.P, s3.T - 5, s2.T + 5);
          U.drawTs(U.canvas(b, 520, 400), F, S.map(s => ({ x: s.s, y: s.T - K, label: s.n })), { lines: [{ ...iso, color: U.cssVar('--hot'), width: 1.4 }, { x: [s4.s, s1.s], y: [s4.T - K, s1.T - K], color: U.cssVar('--cool') }, { x: [s1.s, s2.s], y: [s1.T - K, s2.T - K], color: U.cssVar('--warm') }] });
        }
      };
    }
  });

  /* ======================= Gas refrigeration ======================= */
  U.addCalc('gasref', {
    title: 'Gas (reversed Brayton) refrigeration cycle', cat: CAT, blurb: 'Aircraft-cabin style air-cycle refrigeration with optional regenerator.',
    desc: R`<p>Air enters the compressor at \(T_1\) (from the cold space), is compressed, cooled to \(T_3\) by ambient, expanded in a turbine to \(T_4\), and absorbs heat \(q_L=c_p(T_1-T_4)\). \(COP=q_L/(w_C-w_T)\).</p>`,
    inputs: [{ k: 'T1', l: 'Compressor inlet T₁', u: '°C', v: -10 }, { k: 'P1', l: 'P₁', u: 'kPa', v: 100 }, { k: 'rp', l: 'Pressure ratio', v: 4 }, { k: 'T3', l: 'Turbine inlet T₃ (after cooler)', u: '°C', v: 30 }, { k: 'ec', l: 'Compressor η', v: 0.8 }, { k: 'et', l: 'Turbine η', v: 0.85 }, { k: 'Q', l: 'Cooling load', u: 'kW', v: 20 }],
    run(v) {
      const k = 1.4, cp = 1.005, T1 = v.T1 + K, T3 = v.T3 + K, a = Math.pow(v.rp, (k - 1) / k);
      const T2 = T1 + (T1 * a - T1) / v.ec, T4 = T3 - v.et * (T3 - T3 / a); const qL = cp * (T1 - T4), w = cp * (T2 - T1) - cp * (T3 - T4);
      if (qL <= 0) throw new Error('T₄ must be below T₁ — increase pressure ratio');
      return { out: [['COP', qL / w, '', 1], ['T₂', T2 - K, '°C'], ['T₄ (coldest)', T4 - K, '°C', 1], ['q<sub>L</sub>', qL, 'kJ/kg'], ['Net work in', w, 'kJ/kg'], ['Air flow for load', v.Q / qL, 'kg/s'], ['Power', v.Q / qL * w, 'kW']], html: '<p>Air-cycle COPs are low (≈ 0.3–1) but the hardware is light and uses air as refrigerant — hence its use in aircraft environmental control.</p>' };
    }
  });

  /* ======================= Combined cycle ======================= */
  U.addCalc('combined', {
    title: 'Combined gas–steam cycle (HRSG)', cat: CAT, blurb: 'Gas-turbine exhaust raises steam in a heat-recovery steam generator; overall efficiency.',
    desc: R`<p>Energy balance across the HRSG: \(\dot m_s(h_{3s}-h_{2s})=\dot m_g(h_{4g}-h_{stack})\). Overall \(\eta=(\dot W_{GT}+\dot W_{ST})/\dot Q_{in,GT}\).</p>`,
    inputs: [{ k: 'rp', l: 'GT pressure ratio', v: 14 }, { k: 'T1', l: 'GT inlet T', u: '°C', v: 25 }, { k: 'T3', l: 'Turbine inlet T', u: '°C', v: 1300 }, { k: 'ec', l: 'Compressor η', v: 0.86 }, { k: 'et', l: 'Gas turbine η', v: 0.9 },
    { k: 'Tst', l: 'Stack temperature', u: '°C', v: 120 }, { k: 'Ps', l: 'Steam pressure', u: 'MPa', v: 8 }, { k: 'Ts', l: 'Steam T', u: '°C', v: 500 }, { k: 'Pc', l: 'Condenser P', u: 'kPa', v: 10 }, { k: 'est', l: 'Steam turbine η', v: 0.88 }, { k: 'mg', l: 'Gas flow', u: 'kg/s', v: 100 }],
    async run(v) {
      await U.IG.load(); const F = await U.fluid('water'); const M = airModel(true); const T1 = v.T1 + K, T3 = v.T3 + K;
      const T2s = M.Tisen_P(T1, 100, 100 * v.rp), h2 = M.h(T1) + (M.h(T2s) - M.h(T1)) / v.ec, T4s = M.Tisen_P(T3, 100 * v.rp, 100), h4 = M.h(T3) - v.et * (M.h(T3) - M.h(T4s));
      const wgt = (M.h(T3) - h4) - (h2 - M.h(T1)), qin = M.h(T3) - h2, T4 = M.Th(h4);
      if (v.Ts + K > T4 - 10) throw new Error('Steam temperature must be below GT exhaust (' + U.fmt(T4 - K, 4) + ' °C) by a reasonable approach');
      const c1 = F.state({ P: v.Pc * 1e3, x: 0 }), p2s = F.state({ P: v.Ps * 1e6, s: c1.s }), wp = (p2s.h - c1.h) / 0.85, h2s = c1.h + wp;
      const t3 = F.state({ P: v.Ps * 1e6, T: v.Ts + K }), t4s = F.state({ P: v.Pc * 1e3, s: t3.s }), h4s = t3.h - v.est * (t3.h - t4s.h), wst = t3.h - h4s - wp;
      const ratio = (h4 - M.h(v.Tst + K)) / (t3.h - h2s), ms = ratio * v.mg;
      const WGT = v.mg * wgt, WST = ms * wst, Q = v.mg * qin;
      return { out: [['Combined η', (WGT + WST) / Q, '', 1], ['GT alone η', wgt / qin, ''], ['GT power', WGT / 1e3, 'MW'], ['ST power', WST / 1e3, 'MW'], ['Total', (WGT + WST) / 1e3, 'MW', 1], ['Steam flow', ms, 'kg/s'], ['GT exhaust T₄', T4 - K, '°C'], ['Steam turbine exit quality', F.state({ P: v.Pc * 1e3, h: h4s }).x ?? '—', '']], html: '<p>Combined cycles reach 55–63 % because the Brayton cycle rejects heat at a high temperature that the Rankine cycle can still use.</p>' };
    }
  });

  /* ======================= Turbojet ======================= */
  U.addCalc('turbojet', {
    title: 'Ideal turbojet (jet propulsion cycle)', cat: CAT, blurb: 'Ram compression, turbine drives compressor, nozzle exit velocity, thrust and propulsive efficiency.',
    desc: R`<p>Diffuser: \(T_{02}=T_a+V^2/2c_p\). Compressor work = turbine work. Nozzle expands to ambient. Thrust \(F=\dot m(V_e-V)\); propulsive efficiency \(\eta_p=\dfrac{2V}{V_e+V}\).</p>`,
    inputs: [{ k: 'V', l: 'Flight speed', u: 'm/s', v: 260 }, { k: 'Ta', l: 'Ambient T', u: '°C', v: -40 }, { k: 'Pa', l: 'Ambient P', u: 'kPa', v: 35 }, { k: 'rp', l: 'Compressor pressure ratio', v: 10 }, { k: 'T4', l: 'Turbine inlet T', u: '°C', v: 1100 }, { k: 'm', l: 'Air flow', u: 'kg/s', v: 45 }],
    run(v) {
      const cp = 1.005, k = 1.4, e = (k - 1) / k, Ta = v.Ta + K, T1 = Ta + v.V * v.V / 2000 / cp, P1 = v.Pa * Math.pow(T1 / Ta, 1 / e), P2 = P1 * v.rp, T2 = T1 * Math.pow(v.rp, e), T4 = v.T4 + K, T5 = T4 - (T2 - T1), P5 = P2 * Math.pow(T5 / T4, 1 / e), T6 = T4 * Math.pow(v.Pa / P2, e);
      const Ve = Math.sqrt(2000 * cp * (T5 - T6) * 1 + 0) ; const Thr = v.m * (Ve - v.V), qin = cp * (T4 - T2);
      return { out: [['Thrust', Thr / 1e3, 'kN', 1], ['Exit velocity', Ve, 'm/s'], ['Propulsive efficiency', 2 * v.V / (Ve + v.V), '', 1], ['Propulsive power', Thr * v.V / 1e3, 'kW'], ['Heat input rate', v.m * qin, 'kW'], ['Overall efficiency', Thr * v.V / 1e3 / (v.m * qin), ''], ['T after diffuser', T1 - K, '°C'], ['Turbine exit T₅ / P₅', U.fmt(T5 - K, 4) + ' °C / ' + U.fmt(P5, 4) + ' kPa', '']] };
    }
  });

  /* ======================= Psychrometrics ======================= */
  const Psat = T => { // Pa, T in °C; water table above 0.01 °C, Sonntag ice equation below
    const TK = T + K; if (T >= 0.01 && window.D && D.water) { if (!U.FL_W) U.FL_W = new U.Fluid('water', D.water); return U.FL_W.satT(TK).P; }
    if (T >= 0.01) return 611.2 * Math.exp(17.62 * T / (243.12 + T)); // Magnus fallback before tables load
    return Math.exp(-6024.5282 / TK + 29.32707 + 1.0613868e-2 * TK - 1.3198825e-5 * TK * TK - 0.49382577 * Math.log(TK));
  };
  U.Psat = Psat;
  U.need('water').then(() => { U.FL_W = new U.Fluid('water', D.water); });
  const psy = U.psy = {
    w: (Pv, P) => 0.621945 * Pv / (P - Pv),
    Pv: (w, P) => w * P / (0.621945 + w),
    h: (T, w) => 1.006 * T + w * (2501 + 1.86 * T),
    v: (T, w, P) => 0.287042 * (T + K) * (1 + 1.607858 * w) / (P / 1000),
    wFromWB: (T, Twb, P) => { const ws = psy.w(Psat(Twb), P); return Twb >= 0 ? ((2501 - 2.326 * Twb) * ws - 1.006 * (T - Twb)) / (2501 + 1.86 * T - 4.186 * Twb) : ((2830 - 0.24 * Twb) * ws - 1.006 * (T - Twb)) / (2830 + 1.86 * T - 2.1 * Twb); },
    Twb: (T, w, P) => U.brent(t => psy.wFromWB(T, t, P) - w, -40, T + 1e-6),
    Tdp: (w, P) => { const pv = psy.Pv(w, P); return U.brent(t => Psat(t) - pv, -60, 100); },
    state(o, P) { // o: {T, phi | Twb | w | Tdp}
      const T = o.T; let w;
      if (o.phi != null) w = psy.w(o.phi * Psat(T), P); else if (o.Twb != null) w = psy.wFromWB(T, o.Twb, P); else if (o.Tdp != null) w = psy.w(Psat(o.Tdp), P); else w = o.w;
      if (w < 0) throw new Error('Inconsistent state (negative humidity ratio)');
      const Pv = psy.Pv(w, P), phi = Pv / Psat(T); if (phi > 1.0005) throw new Error('State is supersaturated (φ > 100 %) — fog region');
      return { T, w, phi, Pv, h: psy.h(T, w), v: psy.v(T, w, P), Twb: psy.Twb(T, w, P), Tdp: w > 0 ? psy.Tdp(w, P) : -Infinity, rho: (1 + w) / psy.v(T, w, P) };
    },
    fromHW: (hh, w) => (hh - 2501 * w) / (1.006 + 1.86 * w)
  };
  U.drawPsy = (cv, P, pts = [], lines = [], range = [-10, 50]) => {
    const Ts = U.range(range[0], range[1], 80), ser = [];
    for (const ph of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) ser.push({ x: Ts, y: Ts.map(t => 1000 * psy.w(ph * Psat(t), P)), color: ph === 1 ? U.cssVar('--fg') : U.cssVar('--cool'), width: ph === 1 ? 2 : 0.8 });
    for (let hh = -10; hh <= 140; hh += 10) { const xs = [], ys = []; Ts.forEach(t => { const w = (hh - 1.006 * t) / (2501 + 1.86 * t); if (w >= 0 && w <= psy.w(Psat(t), P)) { xs.push(t); ys.push(1000 * w); } }); if (xs.length > 1) ser.push({ x: xs, y: ys, color: U.cssVar('--warm'), width: 0.7, dash: [4, 4] }); }
    for (let wb = range[0]; wb <= range[1] - 5; wb += 5) { const xs = [], ys = []; U.range(wb, range[1], 30).forEach(t => { const w = psy.wFromWB(t, wb, P); if (w >= 0) { xs.push(t); ys.push(1000 * w); } }); ser.push({ x: xs, y: ys, color: U.cssVar('--green'), width: 0.6, dash: [2, 3] }); }
    lines.forEach(l => ser.push(l));
    const wmax = Math.min(1000 * psy.w(Psat(range[1]) * 0.75, P), 40);
    const map = U.plot(cv, { series: ser, marks: pts, xlabel: 'Dry-bulb temperature [°C]', ylabel: 'Humidity ratio ω [g/kg dry air]', title: `Psychrometric chart at ${U.f(P / 1e3, 5)} kPa  (blue: φ = 10…100 %, orange: h [kJ/kg], green: wet-bulb)`, xlim: range, ylim: [0, wmax] });
    return map;
  };
  U.addCalc('psychro', {
    title: 'Psychrometrics & air-conditioning processes (with live chart)', cat: 'Thermodynamics — mixtures & psychrometry', blurb: 'Moist-air state from any pair; heating, cooling & dehumidification, humidification, adiabatic mixing, evaporative cooling, cooling tower.',
    desc: R`<p>\(\omega=0.622\,\dfrac{P_v}{P-P_v}\), \(\phi=P_v/P_{sat}(T)\), \(h=1.006T+\omega(2501+1.86T)\) kJ/kg dry air. Wet-bulb from the adiabatic-saturation balance. Click on the chart to set state 1.</p>`,
    mount(el) {
      const f = (k, l, v, u) => { const i = h('input', { class: 'inp', type: 'number', step: 'any', value: v }); return [k, h('div', { class: 'fld' }, h('label', { html: l + (u ? ' <span class="u">[' + u + ']</span>' : '') }), i), i]; };
      const P = f('P', 'Total pressure', 101.325, 'kPa'), T1 = f('T1', 'State 1 dry-bulb', 32, '°C');
      const sec = h('select', { class: 'inp' }, [['phi', 'Relative humidity φ (%)'], ['Twb', 'Wet-bulb T (°C)'], ['Tdp', 'Dew-point T (°C)'], ['w', 'Humidity ratio ω (g/kg)']].map(([k, n]) => h('option', { value: k }, n)));
      const s1 = f('s1', 'value', 60);
      const proc = h('select', { class: 'inp' }, [['none', 'State only'], ['heat', 'Sensible heating / cooling to T₂'], ['cool', 'Cooling & dehumidifying coil (to T₂, φ₂)'], ['adp', 'Cooling coil by ADP & bypass factor'], ['hum', 'Steam humidification to φ₂'], ['evap', 'Evaporative (adiabatic) cooling, effectiveness'], ['mix', 'Adiabatic mixing with stream 2'], ['tower', 'Cooling tower (water side)']].map(([k, n]) => h('option', { value: k }, n)));
      const T2 = f('T2', 'T₂ / ADP / stream-2 T', 15, '°C'), p2 = f('p2', 'φ₂ (%) / bypass factor / effectiveness / stream-2 φ', 90), mr = f('mr', 'Dry-air flow ṁ₁ (kg/s) ', 1), m2 = f('m2', 'Stream-2 dry-air flow ṁ₂ (kg/s) | tower: water in/out T (°C) e.g. 35', 0.5), m3 = f('m3', 'Tower: water outlet T (°C)', 27);
      const out = h('div'), ch = h('div');
      el.append(h('div', { class: 'form' }, P[1], T1[1], h('div', { class: 'fld' }, h('label', {}, 'Second property'), sec), s1[1], h('div', { class: 'fld' }, h('label', {}, 'Process'), proc), T2[1], p2[1], mr[1], m2[1], m3[1]), out, ch);
      const cv = U.canvas(ch, 820, 520);
      cv.addEventListener('click', e => { if (!cv.map) return; const r = cv.getBoundingClientRect(), sx = cv.W / r.width; const q = cv.map.inv((e.clientX - r.left) * sx, (e.clientY - r.top) * sx); T1[2].value = q.x.toFixed(1); sec.value = 'w'; s1[2].value = q.y.toFixed(2); run(); });
      const run = async () => {
        out.innerHTML = '';
        try {
          await U.need('water'); if (!U.FL_W) U.FL_W = new U.Fluid('water', D.water);
          const Pt = +P[2].value * 1e3, o = { T: +T1[2].value }; const x = +s1[2].value;
          if (sec.value === 'phi') o.phi = x / 100; else if (sec.value === 'w') o.w = x / 1000; else o[sec.value] = x;
          const A = psy.state(o, Pt); let B = null, C = null, extra = [], lines = [];
          const t2 = +T2[2].value, q2 = +p2[2].value, m1 = +mr[2].value;
          const p = proc.value;
          if (p === 'heat') { if (t2 < A.Tdp) throw new Error('Sensible cooling below dew point would condense — use the dehumidifying coil'); B = psy.state({ T: t2, w: A.w }, Pt); extra.push(['Heat added Q', m1 * (B.h - A.h), 'kW', 1]); }
          if (p === 'cool') { B = psy.state({ T: t2, phi: q2 / 100 }, Pt); if (B.w > A.w) throw new Error('Exit ω exceeds inlet — this coil cannot humidify'); const hw = 4.186 * t2; extra.push(['Cooling load Q', m1 * (A.h - B.h - (A.w - B.w) * hw), 'kW', 1], ['Condensate', m1 * (A.w - B.w) * 3600, 'kg/h'], ['Sensible heat factor', (1.006 + 1.86 * A.w) * (A.T - B.T) / (A.h - B.h), ''], ['Tons of refrigeration', m1 * (A.h - B.h) / 3.517, 'TR']); }
          if (p === 'adp') { const adp = psy.state({ T: t2, phi: 1 }, Pt), bf = q2 > 1 ? q2 / 100 : q2; B = psy.state({ T: adp.T + bf * (A.T - adp.T), w: adp.w + bf * (A.w - adp.w) }, Pt); C = adp; extra.push(['Coil load', m1 * (A.h - B.h), 'kW', 1], ['Contact factor 1−BF', 1 - bf, ''], ['Condensate', m1 * (A.w - B.w) * 3600, 'kg/h']); }
          if (p === 'hum') { const wt = psy.w(q2 / 100 * Psat(A.T), Pt); B = psy.state({ T: A.T, w: wt }, Pt); extra.push(['Steam added', m1 * (B.w - A.w) * 3600, 'kg/h', 1], ['(ideal isothermal steam injection approx.)', '', '']); }
          if (p === 'evap') { const eff = q2 > 1 ? q2 / 100 : q2, Tb = A.T - eff * (A.T - A.Twb); B = psy.state({ T: Tb, w: psy.wFromWB(Tb, A.Twb, Pt) }, Pt); extra.push(['Water evaporated', m1 * (B.w - A.w) * 3600, 'kg/h', 1], ['Temperature drop', A.T - B.T, 'K']); }
          if (p === 'mix') { const S2 = psy.state({ T: t2, phi: q2 / 100 }, Pt), mm2 = +m2[2].value; const w3 = (m1 * A.w + mm2 * S2.w) / (m1 + mm2), h3 = (m1 * A.h + mm2 * S2.h) / (m1 + mm2); const T3 = psy.fromHW(h3, w3); B = S2; C = psy.state({ T: T3, w: w3 }, Pt); extra.push(['Mixed T₃', C.T, '°C', 1], ['Mixed φ₃', C.phi * 100, '%'], ['Mixed ω₃', C.w * 1000, 'g/kg'], ['Mixed h₃', C.h, 'kJ/kg']); }
          if (p === 'tower') { const Twi = +m2[2].value, Two = +m3[2].value; B = psy.state({ T: t2, phi: q2 / 100 }, Pt); const cw = 4.186; // per kg dry air: water needed
            const mw = m1 * (B.h - A.h) / (cw * (Twi - Two) + 0); extra.push(['Air leaves (state 2) h', B.h, 'kJ/kg'], ['Water cooled per kg/s air', mw, 'kg/s', 1], ['Make-up water (evaporated)', m1 * (B.w - A.w) * 3600, 'kg/h'], ['Range', Twi - Two, 'K'], ['Approach (T<sub>w,out</sub> − T<sub>wb,in</sub>)', Two - A.Twb, 'K']); }
          const show = (S, n) => [['State ' + n + ': T<sub>db</sub>', S.T, '°C'], ['φ', S.phi * 100, '%'], ['ω', S.w * 1000, 'g/kg da'], ['h', S.h, 'kJ/kg da'], ['T<sub>wb</sub>', S.Twb, '°C'], ['T<sub>dp</sub>', S.Tdp, '°C'], ['v', S.v, 'm³/kg da'], ['P<sub>v</sub>', S.Pv / 1e3, 'kPa']];
          const rows = [...show(A, 1)]; if (B) rows.push(...show(B, 2)); if (C && p === 'adp') rows.push(['ADP T', C.T, '°C']);
          out.append(h('div', { class: 'out' }, [...extra, ...rows].map(([l, v, u, m]) => h('div', { class: m ? 'main' : '' }, h('span', { html: l }), h('b', { html: (typeof v === 'number' ? U.fmt(v, 5) : v) + ' <small>' + (u || '') + '</small>' })))));
          const pts = [{ x: A.T, y: A.w * 1000, label: '1', color: U.cssVar('--hot') }]; if (B) pts.push({ x: B.T, y: B.w * 1000, label: '2', color: U.cssVar('--cool') }); if (C) pts.push({ x: C.T, y: C.w * 1000, label: p === 'mix' ? '3 (mix)' : 'ADP', color: U.cssVar('--violet') });
          if (B && p !== 'mix') lines.push({ x: [A.T, B.T], y: [A.w * 1000, B.w * 1000], color: U.cssVar('--hot'), width: 3 });
          if (p === 'mix' || p === 'adp') lines.push({ x: [A.T, p === 'mix' ? B.T : C.T], y: [A.w * 1000, (p === 'mix' ? B.w : C.w) * 1000], color: U.cssVar('--violet'), width: 2.5 });
          const lo = Math.floor(Math.min(-5, ...pts.map(q => q.x)) / 5) * 5, hi = Math.max(45, Math.ceil(Math.max(...pts.map(q => q.x)) / 5) * 5 + 5);
          cv.refit(); U.drawPsy(cv, Pt, pts, lines, [lo, hi]);
        } catch (e) { out.append(h('p', { class: 'err' }, '⚠ ' + e.message)); }
      };
      el.addEventListener('input', () => { clearTimeout(el._t); el._t = setTimeout(run, 300); }); el.addEventListener('change', run); run();
    }
  });

  /* ======================= Combustion ======================= */
  const FUELS = { // name: [C,H,O,N, hf (kJ/kmol), phase, species key in tables or null]
    CH4: ['Methane CH₄ (g)', 1, 4, 0, 0, null, 'g', 'CH4'], C2H6: ['Ethane C₂H₆ (g)', 2, 6, 0, 0, null, 'g', 'C2H6'], C3H8: ['Propane C₃H₈ (g)', 3, 8, 0, 0, null, 'g', 'C3H8'],
    C4H10: ['n-Butane C₄H₁₀ (g)', 4, 10, 0, 0, -126150, 'g', null], C8l: ['n-Octane C₈H₁₈ (l)', 8, 18, 0, 0, -249950, 'l', null], C8g: ['n-Octane C₈H₁₈ (g)', 8, 18, 0, 0, -208450, 'g', null],
    C12: ['n-Dodecane C₁₂H₂₆ (g) (diesel surrogate)', 12, 26, 0, 0, -291010, 'g', null], EtOHl: ['Ethanol C₂H₅OH (l)', 2, 6, 1, 0, -277690, 'l', null], MeOHl: ['Methanol CH₃OH (l)', 1, 4, 1, 0, -238660, 'l', null],
    H2: ['Hydrogen H₂ (g)', 0, 2, 0, 0, null, 'g', 'H2'], CO: ['Carbon monoxide CO (g)', 1, 0, 1, 0, null, 'g', 'CO'], C: ['Carbon (graphite)', 1, 0, 0, 0, 0, 's', null], C2H2: ['Acetylene C₂H₂ (g)', 2, 2, 0, 0, null, 'g', 'C2H2'], custom: ['Custom CₓHᵧO_z', 0, 0, 0, 0, 0, 'g', null]
  };
  U.FUELS = FUELS;
  U.combust = (fuel, ex, opts = {}) => { // returns products per kmol fuel and energetics
    const IG = U.IG; let [nm, C, Hh, O, N, hf, ph, key] = FUELS[fuel] || FUELS.custom;
    if (fuel === 'custom') { C = opts.C; Hh = opts.H; O = opts.O; hf = opts.hf; }
    if (key) hf = IG.sp(key).hf;
    const ath = C + Hh / 4 - O / 2; // stoich O2 kmol
    const a = ath * (1 + ex / 100); const nN2 = 3.76 * a + N / 2;
    let nCO2, nCO, nH2O = Hh / 2, nO2;
    const avail = 2 * a + O - Hh / 2; // O atoms for carbon after making water
    if (avail >= 2 * C) { nCO2 = C; nCO = 0; nO2 = (avail - 2 * C) / 2; } else { if (avail < C) throw new Error('Too little air: even CO cannot form — increase air'); nCO2 = avail - C; nCO = C - nCO2; nO2 = 0; }
    const P = { CO2: nCO2, CO: nCO, H2O: nH2O, O2: nO2, N2: nN2 }; const nP = Object.values(P).reduce((x, y) => x + y, 0);
    const Mf = 12.011 * C + 1.008 * Hh + 15.999 * O + 14.007 * N, mAir = a * 4.76 * 28.97;
    return { nm, C, Hh, O, hf, ph, key, ath, a, P, nP, Mf, AF: mAir / Mf, AFmol: a * 4.76 };
  };
  U.addCalc('combust', {
    title: 'Combustion: air–fuel ratio, products, heating value, adiabatic flame temperature', cat: 'Thermodynamics — mixtures & psychrometry', blurb: 'Balanced equation, AF, dew point of products, HHV/LHV, flame temperature from NASA species data.',
    desc: R`<p>\(C_xH_yO_z+a(O_2+3.76N_2)\to\dots\), \(a_{th}=x+\tfrac y4-\tfrac z2\). First law (steady flow, per kmol fuel): \(Q=\sum_P n_e(\bar h^\circ_f+\Delta\bar h)_e-\sum_R n_i(\bar h^\circ_f+\Delta\bar h)_i\). Adiabatic flame temperature: \(Q=0\). Complete combustion is assumed (no dissociation), so the computed flame temperature is an upper bound.</p>`,
    inputs: [{ k: 'fuel', l: 'Fuel', v: 'CH4', opts: Object.entries(FUELS).map(([k, f]) => [k, f[0]]) }, { k: 'C', l: 'Custom: C atoms x', v: 7 }, { k: 'H', l: 'Custom: H atoms y', v: 16 }, { k: 'O', l: 'Custom: O atoms z', v: 0 }, { k: 'hf', l: 'Custom: h̄°<sub>f</sub>', u: 'kJ/kmol', v: -187820 },
    { k: 'ex', l: 'Excess air (negative = deficient)', u: '%', v: 0 }, { k: 'Ta', l: 'Air inlet T', u: '°C', v: 25 }, { k: 'Tp', l: 'Products exit T (for heat release)', u: '°C', v: 500 }, { k: 'P', l: 'Pressure', u: 'kPa', v: 101.325 }],
    show: v => ({ C: v.fuel === 'custom', H: v.fuel === 'custom', O: v.fuel === 'custom', hf: v.fuel === 'custom' }),
    async run(v) {
      await U.IG.load(); const IG = U.IG, Ta = v.Ta + K;
      const r = U.combust(v.fuel, v.ex, v);
      const HR = r.hf + r.a * (IG.dh('O2', Ta) + 3.76 * IG.dh('N2', Ta)); // fuel at 25 °C
      const HP = T => Object.entries(r.P).reduce((s, [sp, n]) => s + n * (IG.sp(sp).hf + IG.dh(sp, T)), 0);
      const Tad = U.brent(T => HP(T) - HR, 300, 3500);
      // heating value (products at 25 °C, H2O liquid for HHV)
      const hfgw = 44010; const HP298 = Object.entries(r.P).reduce((s, [sp, n]) => s + n * IG.sp(sp).hf, 0);
      const LHV = (r.hf + 0 - HP298) / r.Mf, HHV = LHV + r.P.H2O * hfgw / r.Mf;
      const Qout = (HR - HP(v.Tp + K)) / r.Mf;
      const yH2O = r.P.H2O / r.nP, Tdp = r.P.H2O > 0 ? U.brent(t => U.Psat(t) - yH2O * v.P * 1e3, 0.01, 200) : NaN;
      const eqn = `${r.nm.split(' ').slice(-2, -1)[0] || 'Fuel'} + ${U.fmt(r.a, 4)} (O₂ + 3.76 N₂) → ` + Object.entries(r.P).filter(([, n]) => n > 1e-9).map(([s, n]) => U.fmt(n, 4) + ' ' + s.replace(/(\d)/g, '<sub>$1</sub>')).join(' + ');
      return {
        out: [['Adiabatic flame temperature', Tad - K, '°C', 1], ['Air–fuel ratio (mass)', r.AF, 'kg air/kg fuel', 1], ['AF (molar)', r.AFmol, 'kmol/kmol'], ['Equivalence ratio φ', 1 / (1 + v.ex / 100), ''], ['LHV', LHV, 'kJ/kg fuel'], ['HHV', HHV, 'kJ/kg fuel'], ['Heat released (products at T<sub>p</sub>)', Qout, 'kJ/kg fuel'], ['Dew point of products', Tdp, '°C'], ['Products per kg fuel', r.nP * (Object.entries(r.P).reduce((s, [sp, n]) => s + n * IG.M(sp), 0) / r.nP) / r.Mf, 'kg']],
        html: `<p><b>Balanced:</b> ${eqn}</p><table class="num"><tr><th>Product</th><th>kmol/kmol fuel</th><th>mole fraction (wet)</th><th>dry basis</th></tr>` + Object.entries(r.P).map(([s, n]) => `<tr><td>${s}</td><td>${U.fmt(n, 4)}</td><td>${U.fmt(n / r.nP, 4)}</td><td>${s === 'H2O' ? '—' : U.fmt(n / (r.nP - r.P.H2O), 4)}</td></tr>`).join('') + '</table>' + (r.ph === 'l' ? '<p class="small muted">Liquid fuel: its h̄°<sub>f</sub> already includes the latent heat, so the LHV is per kg of liquid fuel.</p>' : '') + '<p class="small muted">h̄°<sub>f</sub> and sensible enthalpies from NASA polynomials (GRI-Mech 3.0) for species in the database; tabulated literature h̄°<sub>f</sub> for heavier fuels. Real flames are cooler because of dissociation (CO₂ ⇌ CO + ½O₂, H₂O ⇌ H₂ + ½O₂) and heat loss.</p>',
        plot(el) { const xs = U.range(-30, 200, 47); const T = xs.map(e => { try { const rr = U.combust(v.fuel, e, v); const HRr = rr.hf + rr.a * (IG.dh('O2', Ta) + 3.76 * IG.dh('N2', Ta)); return U.brent(TT => Object.entries(rr.P).reduce((s, [sp, n]) => s + n * (IG.sp(sp).hf + IG.dh(sp, TT)), 0) - HRr, 300, 3500) - K; } catch (e) { return NaN; } }); U.plot(U.canvas(el, 640, 320), { series: [{ x: xs, y: T, label: 'T_ad' }], marks: [{ x: v.ex, y: Tad - K, label: 'this case' }], xlabel: 'Excess air [%]', ylabel: 'Adiabatic flame T [°C]', title: 'Flame temperature peaks near stoichiometric' }); }
      };
    }
  });
})();
