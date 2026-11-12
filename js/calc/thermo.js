/* Thermodynamics calculators */
'use strict';
(() => {
  const { h } = U; const K = 273.15;
  const CAT = 'Thermodynamics — properties & processes';
  U.GASES = { // cp, cv kJ/kg.K at 300 K, M kg/kmol  (ideal-gas, Cengel Table A-2 values)
    air: ['Air', 1.005, 0.718, 28.97], N2: ['Nitrogen', 1.039, 0.743, 28.013], O2: ['Oxygen', 0.918, 0.658, 31.999], CO2: ['Carbon dioxide', 0.846, 0.657, 44.01],
    H2O: ['Steam (ideal-gas)', 1.8723, 1.4108, 18.015], He: ['Helium', 5.1926, 3.1156, 4.003], Ar: ['Argon', 0.5203, 0.3122, 39.948],
    H2: ['Hydrogen', 14.307, 10.183, 2.016], CH4: ['Methane', 2.2537, 1.7354, 16.043], CO: ['Carbon monoxide', 1.040, 0.744, 28.011]
  };
  const gasOpts = Object.entries(U.GASES).map(([k, g]) => [k, g[0]]);
  U.gasOpts = gasOpts;

  /* ======================= Property calculator ======================= */
  const PROPS = { T: ['Temperature T', [['C', '°C'], ['K', 'K']]], P: ['Pressure P', [['kPa', 'kPa'], ['MPa', 'MPa'], ['bar', 'bar']]], v: ['Specific volume v', [['m3', 'm³/kg']]], h: ['Enthalpy h', [['kJ', 'kJ/kg']]], u: ['Internal energy u', [['kJ', 'kJ/kg']]], s: ['Entropy s', [['kJ', 'kJ/kg·K']]], x: ['Quality x', [['-', '–']]] };
  const toSI = (p, val, un) => p === 'T' ? (un === 'C' ? val + K : val) : p === 'P' ? val * ({ kPa: 1e3, MPa: 1e6, bar: 1e5 })[un] : val;
  U.drawTs = (cv, F, pts, opts = {}) => {
    const s = F.sat, ser = [{ x: [...s.sf, ...s.sg.slice().reverse()], y: [...s.T.map(t => t - K), ...s.T.slice().reverse().map(t => t - K)], color: U.cssVar('--muted'), width: 1.5, label: 'saturation dome' }];
    (opts.lines || []).forEach(l => ser.push(l));
    return U.plot(cv, { series: ser, marks: pts, xlabel: 's [kJ/kg·K]', ylabel: 'T [°C]', title: opts.title || F.name + ' — T–s diagram', xlim: opts.xlim, ylim: opts.ylim });
  };
  U.drawPh = (cv, F, pts, opts = {}) => {
    const s = F.sat, ser = [{ x: [...s.hf, ...s.hg.slice().reverse()], y: [...s.P, ...s.P.slice().reverse()].map(p => p / 1e3), color: U.cssVar('--muted'), width: 1.5, label: 'saturation dome' }];
    (opts.lines || []).forEach(l => ser.push(l));
    return U.plot(cv, { series: ser, marks: pts, xlabel: 'h [kJ/kg]', ylabel: 'P [kPa] (log)', logy: true, title: opts.title || F.name + ' — P–h diagram', xlim: opts.xlim, ylim: opts.ylim });
  };
  U.isobarTs = (F, P, T1, T2, n = 60) => { // points along isobar between T1,T2 (K) incl. dome
    const xs = [], ys = [];
    if (P < F.Pc) {
      const sat = F.satP(P);
      U.range(Math.max(F.Tmin, T1), Math.min(sat.T - 0.01, T2), n / 2).forEach(T => { if (T < sat.T) { try { const st = F.PT(P, T, 'liq'); xs.push(st.s); ys.push(T - K); } catch (e) { } } });
      xs.push(sat.sf, sat.sg); ys.push(sat.T - K, sat.T - K);
      U.range(sat.T + 0.01, Math.min(F.Tmax, T2), n / 2).forEach(T => { try { const st = F.PT(P, T, 'vap'); xs.push(st.s); ys.push(T - K); } catch (e) { } });
    } else U.range(Math.max(F.Tmin, T1), Math.min(F.Tmax, T2), n).forEach(T => { try { const st = F.PT(P, T); xs.push(st.s); ys.push(T - K); } catch (e) { } });
    return { x: xs, y: ys };
  };
  U.stateRows = st => [['Phase', st.phase, ''], ['T', st.T - K, '°C'], ['P', st.P / 1e3, 'kPa'], ['v', st.v, 'm³/kg'], ['ρ', 1 / st.v, 'kg/m³'], ['u', st.u, 'kJ/kg'], ['h', st.h, 'kJ/kg'], ['s', st.s, 'kJ/kg·K'], ['x', st.x == null ? '—' : st.x, '']];
  U.addCalc('props', {
    title: 'Fluid property calculator (steam & refrigerants)', cat: CAT, blurb: 'Any two of T, P, v, u, h, s, x → complete state, plotted on T–s and P–h.',
    desc: '<p>Give <b>any two independent properties</b>. The engine interpolates dense tables generated from reference Helmholtz-energy equations of state (IAPWS-95 for water). Typical accuracy: ±0.1–0.5 kJ/kg in h away from the critical point. Reference state for water: u = s = 0 for saturated liquid at the triple point; refrigerants use the IIR convention (h = 200 kJ/kg, s = 1 kJ/kg·K for saturated liquid at 0 °C).</p>',
    mount(el) {
      const fl = h('select', { class: 'inp' }, Object.entries(U.FLUIDS).map(([k, n]) => h('option', { value: k }, n)));
      const mk = (p0, v0, u0) => { const ps = h('select', { class: 'inp' }, Object.entries(PROPS).map(([k, [n]]) => h('option', { value: k }, n))); ps.value = p0; const val = h('input', { class: 'inp', type: 'number', step: 'any', value: v0 }); const un = h('select', { class: 'inp' }); const fillU = () => { un.innerHTML = ''; PROPS[ps.value][1].forEach(([k, n]) => un.append(h('option', { value: k }, n))); }; fillU(); if (u0) un.value = u0; ps.onchange = () => { fillU(); run(); }; return { ps, val, un }; };
      const A = mk('P', 1000, 'kPa'), B = mk('T', 250, 'C');
      const out = h('div'), plots = h('div', { class: 'two' });
      const row = (lab, o) => h('div', { class: 'fld' }, h('label', {}, lab), h('div', { class: 'row' }, o.ps, o.val, o.un));
      el.append(h('div', { class: 'form' }, h('div', { class: 'fld' }, h('label', {}, 'Fluid'), fl), row('Property 1', A), row('Property 2', B)), h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: () => run() }, 'Compute state')), out, plots);
      const run = async () => {
        out.innerHTML = ''; plots.innerHTML = '';
        try {
          const F = await U.fluid(fl.value);
          if (A.ps.value === B.ps.value) throw new Error('Choose two different properties');
          const inp = {}; inp[A.ps.value] = toSI(A.ps.value, +A.val.value, A.un.value); inp[B.ps.value] = toSI(B.ps.value, +B.val.value, B.un.value);
          const st = F.state(inp);
          out.append(h('div', { class: 'out' }, U.stateRows(st).map(([l, v, u], i) => h('div', { class: i === 0 ? 'main' : '' }, h('span', {}, l), h('b', { html: (typeof v === 'number' ? U.fmt(v, 6) : v) + ' <small>' + u + '</small>' })))));
          if (st.sat || st.x != null) { const s = st.sat || F.satT(st.T); out.append(h('div', { class: 'small muted', html: `Saturation at ${U.fmt(st.T - K, 5)} °C: P<sub>sat</sub>=${U.fmt(s.P / 1e3, 5)} kPa, v<sub>f</sub>=${U.fmt(s.vf, 5)}, v<sub>g</sub>=${U.fmt(s.vg, 5)} m³/kg, h<sub>f</sub>=${U.fmt(s.hf, 6)}, h<sub>fg</sub>=${U.fmt(s.hfg, 6)}, h<sub>g</sub>=${U.fmt(s.hg, 6)} kJ/kg, s<sub>f</sub>=${U.fmt(s.sf, 5)}, s<sub>g</sub>=${U.fmt(s.sg, 5)} kJ/kg·K` })); }
          else if (st.P < F.Pc) { const Ts = F.Tsat(st.P); out.append(h('div', { class: 'small muted', html: `T<sub>sat</sub>(P) = ${U.fmt(Ts - K, 5)} °C → ${st.T > Ts ? 'degree of superheat ' + U.fmt(st.T - Ts, 4) : 'degree of subcooling ' + U.fmt(Ts - st.T, 4)} K. ${st.T < Ts ? 'Compressed-liquid approximation h ≈ h<sub>f</sub>(T) = ' + U.fmt(F.satT(st.T).hf, 6) + ' kJ/kg (error ' + U.fmt(st.h - F.satT(st.T).hf, 3) + ' kJ/kg).' : ''}` })); }
          const c1 = h('div'), c2 = h('div'); plots.append(c1, c2);
          const iso = U.isobarTs(F, st.P, F.Tmin, Math.max(st.T + 80, F.Tc + 20));
          U.drawTs(U.canvas(c1, 560, 400), F, [{ x: st.s, y: st.T - K, label: 'state', color: U.cssVar('--hot') }], { lines: [{ ...iso, label: 'isobar P = ' + U.fmt(st.P / 1e3, 4).replace(/<[^>]+>/g, '') + ' kPa', color: U.cssVar('--cool') }] });
          U.drawPh(U.canvas(c2, 560, 400), F, [{ x: st.h, y: st.P / 1e3, label: 'state', color: U.cssVar('--hot') }]);
        } catch (e) { out.append(h('p', { class: 'err' }, '⚠ ' + e.message)); }
      };
      [fl, A.val, B.val, A.un, B.un].forEach(x => x.addEventListener('change', run)); run();
    }
  });

  /* ======================= Ideal-gas processes (closed system) ======================= */
  U.addCalc('igproc', {
    title: 'Ideal-gas process analyser (closed & steady-flow)', cat: CAT, blurb: 'Isobaric, isochoric, isothermal, isentropic, polytropic: W, Q, ΔU, ΔH, ΔS with P–v and T–s plots.',
    desc: R`<p>Closed-system boundary work \(W_b=\int P\,dV\); first law \(Q - W_b = \Delta U\). Steady-flow (open) shaft work for the same reversible path \(w_{sf}=-\int v\,dP\) (KE, PE neglected). Constant specific heats at 300 K unless “Air (variable \(c_p\))” is chosen, which uses ideal-gas air tables.</p>`,
    inputs: [{ k: 'gas', l: 'Gas', v: 'air', opts: [['airvar', 'Air (variable cp, tables)'], ...gasOpts] }, { k: 'proc', l: 'Process', v: 'poly', opts: [['p', 'Isobaric (P = const)'], ['v', 'Isochoric (V = const)'], ['T', 'Isothermal (T = const)'], ['s', 'Isentropic (reversible adiabatic)'], ['poly', 'Polytropic PVⁿ = const']] },
    { k: 'n', l: 'Polytropic index n', v: 1.3 }, { k: 'm', l: 'Mass m', u: 'kg', v: 1 }, { k: 'P1', l: 'P₁', u: 'kPa', v: 100 }, { k: 'T1', l: 'T₁', u: '°C', v: 27 },
    { k: 'spec', l: 'Final state given by', v: 'r', opts: [['P2', 'Final pressure P₂ (kPa)'], ['r', 'Compression ratio V₁/V₂'], ['T2', 'Final temperature T₂ (°C)']] }, { k: 'x2', l: 'Final-state value', v: 8 }],
    show: v => ({ n: v.proc === 'poly' }),
    run(v) {
      const vg = v.gas === 'airvar'; const g = U.GASES[vg ? 'air' : v.gas]; const Rg = 8.314462618 / g[3], cp = g[1], cv = cp - Rg, k = cp / cv;
      const T1 = v.T1 + K, P1 = v.P1, m = v.m, V1 = m * Rg * T1 / P1;
      let n = { p: 0, v: Infinity, T: 1, s: k, poly: v.n }[v.proc];
      let P2, V2, T2;
      const varS = vg && v.proc === 's';
      if (v.proc === 'p') { P2 = P1; if (v.spec === 'T2') T2 = v.x2 + K; else if (v.spec === 'r') { V2 = V1 / v.x2; T2 = T1 * V2 / V1; } else throw new Error('For isobaric, specify T₂ or volume ratio'); V2 = m * Rg * T2 / P2; }
      else if (v.proc === 'v') { V2 = V1; if (v.spec === 'T2') T2 = v.x2 + K; else if (v.spec === 'P2') T2 = T1 * v.x2 / P1; else throw new Error('For isochoric, specify T₂ or P₂'); P2 = m * Rg * T2 / V2; }
      else if (v.proc === 'T') { T2 = T1; if (v.spec === 'P2') P2 = v.x2; else if (v.spec === 'r') P2 = P1 * v.x2; else throw new Error('For isothermal, specify P₂ or volume ratio'); V2 = m * Rg * T2 / P2; }
      else if (varS) { // air tables via Pr / vr
        await0(); if (v.spec === 'P2') { P2 = v.x2; T2 = U.IG.airT('Pr', U.IG.air('Pr', T1) * P2 / P1); }
        else if (v.spec === 'r') { T2 = U.IG.airT('vr', U.IG.air('vr', T1) / v.x2); }
        else T2 = v.x2 + K;
        if (!P2) P2 = P1 * U.IG.air('Pr', T2) / U.IG.air('Pr', T1);
        V2 = m * Rg * T2 / P2; n = Math.log(P2 / P1) / Math.log(V1 / V2);
      } else {
        if (v.spec === 'P2') { P2 = v.x2; V2 = V1 * Math.pow(P1 / P2, 1 / n); } else if (v.spec === 'r') { V2 = V1 / v.x2; P2 = P1 * Math.pow(v.x2, n); } else { T2 = v.x2 + K; V2 = V1 * Math.pow(T1 / T2, 1 / (n - 1)); P2 = m * Rg * T2 / V2; }
        T2 = P2 * V2 / (m * Rg);
      }
      // energies
      let W, Wsf;
      if (v.proc === 'p') { W = P1 * (V2 - V1); Wsf = 0; }
      else if (v.proc === 'v') { W = 0; Wsf = -V1 * (P2 - P1); }
      else if (v.proc === 'T') { W = P1 * V1 * Math.log(V2 / V1); Wsf = W; }
      else { W = (P2 * V2 - P1 * V1) / (1 - n); Wsf = n * W; }
      let dU, dH, dS;
      if (vg) { dU = m * (U.IG.air('u', T2) - U.IG.air('u', T1)); dH = m * (U.IG.air('h', T2) - U.IG.air('h', T1)); dS = m * (U.IG.air('s0', T2) - U.IG.air('s0', T1) - Rg * Math.log(P2 / P1)); }
      else { dU = m * cv * (T2 - T1); dH = m * cp * (T2 - T1); dS = m * (cp * Math.log(T2 / T1) - Rg * Math.log(P2 / P1)); }
      if (varS) { W = -dU; Wsf = -dH; dS = 0; }
      const Q = dU + W;
      const html = R`<p><b>Gas constant</b> \(R = \bar R/M = 8.3145/${g[3]} = ${U.f(Rg, 4)}\) kJ/kg·K, \(c_p=${cp}\), \(c_v=${U.f(cv, 4)}\), \(k=${U.f(k, 4)}\).</p>
      <p>\(V_1 = mRT_1/P_1 = ${U.f(V1, 4)}\) m³ → \(V_2=${U.f(V2, 4)}\) m³, \(P_2=${U.f(P2, 5)}\) kPa, \(T_2=${U.f(T2, 5)}\) K.</p>
      <p>Boundary work: ${v.proc === 'p' ? R`\(W=P(V_2-V_1)\)` : v.proc === 'v' ? R`\(W=0\)` : v.proc === 'T' ? R`\(W=P_1V_1\ln(V_2/V_1)\)` : R`\(W=\dfrac{P_2V_2-P_1V_1}{1-n}\)`} \(= ${U.f(W, 5)}\) kJ. First law: \(Q=\Delta U+W=${U.f(dU, 5)}+${U.f(W, 5)}=${U.f(Q, 5)}\) kJ.</p>
      <p>Entropy: \(\Delta S = m\left[c_p\ln\frac{T_2}{T_1}-R\ln\frac{P_2}{P_1}\right]=${U.f(dS, 4)}\) kJ/K. ${Math.abs(dS) < 1e-6 ? 'Isentropic ✔' : ''}</p>
      <p>If the same path were executed in a <b>steady-flow</b> device (e.g. compressor), the shaft work output would be \(w = -\int V dP = ${U.f(Wsf, 5)}\) kJ (for m kg) — ${v.proc === 'poly' || v.proc === 's' ? 'n times the boundary work' : 'note the difference from boundary work'}.</p>`;
      return {
        out: [['Work W<sub>b</sub> (by gas)', W, 'kJ', 1], ['Heat Q (into gas)', Q, 'kJ', 1], ['ΔU', dU, 'kJ'], ['ΔH', dH, 'kJ'], ['ΔS', dS, 'kJ/K'], ['P₂', P2, 'kPa'], ['T₂', T2 - K, '°C'], ['V₁ → V₂', U.fmt(V1, 4) + ' → ' + U.fmt(V2, 4), 'm³'], ['Effective n', n === Infinity ? '∞' : n, ''], ['Steady-flow work −∫VdP', Wsf, 'kJ']], html,
        plot(el) {
          const w = h('div', { class: 'two' }); el.append(w); const a = h('div'), b = h('div'); w.append(a, b);
          const N = 80, Vs = [], Ps = [], Ss = [], Ts = [];
          for (let i = 0; i < N; i++) { const f = i / (N - 1); let Vv, Pp, Tt;
            if (v.proc === 'v') { Vv = V1; Pp = P1 + (P2 - P1) * f; } else if (v.proc === 'p') { Pp = P1; Vv = V1 + (V2 - V1) * f; } else { Vv = V1 * Math.pow(V2 / V1, f); Pp = v.proc === 'T' ? P1 * V1 / Vv : P1 * Math.pow(V1 / Vv, n); }
            Tt = Pp * Vv / (m * Rg); Vs.push(Vv); Ps.push(Pp); Ts.push(Tt - K); Ss.push(cp * Math.log(Tt / T1) - Rg * Math.log(Pp / P1)); }
          U.plot(U.canvas(a, 520, 380), { series: [{ x: Vs, y: Ps, label: 'process 1→2', fill: true, fillTo: 0 }], marks: [{ x: V1, y: P1, label: '1' }, { x: V2, y: P2, label: '2' }], xlabel: 'V [m³]', ylabel: 'P [kPa]', title: 'P–V (shaded area = boundary work)' });
          U.plot(U.canvas(b, 520, 380), { series: [{ x: Ss, y: Ts, label: 'process 1→2', color: U.cssVar('--cool') }], marks: [{ x: Ss[0], y: Ts[0], label: '1' }, { x: Ss[N - 1], y: Ts[N - 1], label: '2' }], xlabel: 's − s₁ [kJ/kg·K]', ylabel: 'T [°C]', title: 'T–s (area under curve = heat per kg, reversible)' });
        }
      };
    }
  });
  function await0() { if (!window.D || !D.igas) throw new Error('Loading ideal-gas tables… press Calculate again'); }
  U.need('igas');

  /* ======================= Steady-flow devices ======================= */
  U.addCalc('sfdev', {
    title: 'Steady-flow devices: turbine, compressor, pump, nozzle, diffuser, valve', cat: CAT, blurb: 'Real fluid or ideal-gas air; isentropic efficiency, exit state, power, entropy generation and exergy destroyed.',
    desc: R`<p>Steady-flow energy equation: \(\dot Q-\dot W=\dot m\left[(h_2-h_1)+\tfrac{V_2^2-V_1^2}{2}+g(z_2-z_1)\right]\). Isentropic efficiency: turbine \(\eta_T=\dfrac{h_1-h_2}{h_1-h_{2s}}\), compressor/pump \(\eta_C=\dfrac{h_{2s}-h_1}{h_2-h_1}\), nozzle \(\eta_N=\dfrac{V_2^2/2}{V_{2s}^2/2}\). Entropy generation \(\dot S_{gen}=\dot m(s_2-s_1)-\dot Q/T_0\); exergy destroyed \(\dot X_{d}=T_0\dot S_{gen}\) (Gouy–Stodola).</p>`,
    inputs: [{ k: 'dev', l: 'Device', v: 'turb', opts: [['turb', 'Turbine'], ['comp', 'Compressor'], ['pump', 'Pump'], ['noz', 'Nozzle'], ['dif', 'Diffuser'], ['valve', 'Throttling valve']] },
    { k: 'fl', l: 'Fluid', v: 'water', opts: [...Object.entries(U.FLUIDS), ['air', 'Air (ideal gas, variable cp)']] },
    { k: 'P1', l: 'Inlet P₁', u: 'kPa', v: 3000 }, { k: 'in2', l: 'Inlet 2nd property', v: 'T', opts: [['T', 'Temperature T₁ (°C)'], ['x', 'Quality x₁']] }, { k: 'T1', l: 'T₁ or x₁', v: 400 },
    { k: 'P2', l: 'Exit P₂', u: 'kPa', v: 50 }, { k: 'eta', l: 'Isentropic efficiency', u: '–', v: 0.85 }, { k: 'mdot', l: 'Mass flow ṁ', u: 'kg/s', v: 10 },
    { k: 'V1', l: 'Inlet velocity V₁', u: 'm/s', v: 30 }, { k: 'V2', l: 'Exit velocity V₂ (not nozzle)', u: 'm/s', v: 60 }, { k: 'Q', l: 'Heat loss to surroundings', u: 'kW', v: 0 }, { k: 'T0', l: 'Ambient T₀', u: '°C', v: 25 }],
    show: v => ({ V2: v.dev !== 'noz', eta: v.dev !== 'valve', in2: v.fl !== 'air' }),
    async run(v) {
      const T0 = v.T0 + K, P1 = v.P1 * 1e3, P2 = v.P2 * 1e3; let s1, h1, st1, st2s, st2, h2s, h2;
      let F, get;
      if (v.fl === 'air') {
        await U.IG.load(); const Ra = 0.287; const T1 = v.T1 + K; h1 = U.IG.air('h', T1); s1 = U.IG.air('s0', T1);
        const sAt = (T, P) => U.IG.air('s0', T) - Ra * Math.log(P / P1);
        const T2s = U.IG.airT('Pr', U.IG.air('Pr', T1) * P2 / P1); h2s = U.IG.air('h', T2s);
        st1 = { T: T1, P: P1, h: h1, s: s1, phase: 'ideal gas', x: null, v: Ra * T1 / (P1 / 1e3) };
        get = hh => { const T = U.IG.airT('h', hh); return { T, P: P2, h: hh, s: sAt(T, P2), phase: 'ideal gas', x: null, v: Ra * T / (P2 / 1e3) }; };
      } else {
        F = await U.fluid(v.fl);
        st1 = v.in2 === 'x' ? F.state({ P: P1, x: v.T1 }) : F.state({ P: P1, T: v.T1 + K }); h1 = st1.h; s1 = st1.s;
        st2s = F.state({ P: P2, s: s1 }); h2s = st2s.h; get = hh => F.state({ P: P2, h: hh });
      }
      const ke1 = v.V1 * v.V1 / 2000; let ke2 = v.V2 * v.V2 / 2000, W = 0, V2 = v.V2, q = -v.Q / v.mdot; // q into fluid per kg
      const dev = v.dev, eta = v.eta;
      if (dev === 'turb') h2 = h1 - eta * (h1 - h2s);
      else if (dev === 'comp' || dev === 'pump') h2 = h1 + (h2s - h1) / eta;
      else if (dev === 'noz') { const ke2s = ke1 + (h1 - h2s); ke2 = eta * ke2s; h2 = h1 + ke1 - ke2 + q; V2 = Math.sqrt(2000 * ke2); }
      else if (dev === 'dif') { // eta here as pressure-recovery efficiency: actual exit enthalpy from energy eqn; P2 given; ideal KE drop
        h2 = h1 + ke1 - ke2 + q; }
      else h2 = h1 + q;
      if (dev === 'turb' || dev === 'comp' || dev === 'pump') W = v.mdot * (h1 - h2 + ke1 - ke2) + (-v.Q); // W out (kW)
      if ((dev === 'turb' || dev === 'comp' || dev === 'pump') && v.Q) { /* efficiency defines h2; heat loss reduces work */ }
      const st2a = get(h2);
      const sgen = v.mdot * (st2a.s - s1) + v.Q / T0; // Q loss leaves to surroundings at T0
      const Xd = T0 * sgen;
      const dpsi = (h1 - h2) - T0 * (s1 - st2a.s) + ke1 - ke2; // ψ1 - ψ2 per kg
      let eta2 = null;
      if (dev === 'turb') eta2 = W / (v.mdot * dpsi); else if (dev === 'comp' || dev === 'pump') eta2 = -v.mdot * dpsi / W;
      const out = [['Exit phase', st2a.phase, ''], ['T₂', st2a.T - K, '°C', 1], ['h₂ (actual)', h2, 'kJ/kg'], ['h₂ₛ (isentropic)', h2s, 'kJ/kg'], ['s₂', st2a.s, 'kJ/kg·K'], ['x₂', st2a.x == null ? '—' : st2a.x, '']];
      if (W) out.unshift([dev === 'turb' ? 'Power output Ẇ' : 'Power input −Ẇ', Math.abs(W), 'kW', 1]);
      if (dev === 'noz' || dev === 'dif') out.unshift(['Exit velocity V₂', V2, 'm/s', 1]);
      out.push(['Entropy generation Ṡ<sub>gen</sub>', sgen, 'kW/K'], ['Exergy destroyed Ẋ<sub>d</sub>=T₀Ṡ<sub>gen</sub>', Xd, 'kW'], ['Second-law efficiency', eta2 == null ? '—' : eta2, '']);
      if (dev === 'noz' || dev === 'dif' || dev === 'valve') { const A2 = v.mdot * st2a.v / V2; out.push(['Exit area A₂ = ṁv₂/V₂', A2 * 1e4, 'cm²']); }
      const html = R`<p>Inlet: \(h_1=${U.f(h1, 6)}\) kJ/kg, \(s_1=${U.f(s1, 5)}\) kJ/kg·K (${st1.phase}). Isentropic exit at \(P_2\): \(s_{2s}=s_1\Rightarrow h_{2s}=${U.f(h2s, 6)}\) kJ/kg.</p>
        <p>${dev === 'turb' ? R`\(h_2=h_1-\eta_T(h_1-h_{2s})=${U.f(h2, 6)}\)` : dev === 'comp' || dev === 'pump' ? R`\(h_2=h_1+(h_{2s}-h_1)/\eta=${U.f(h2, 6)}\)` : dev === 'noz' ? R`\(\tfrac{V_2^2}{2}=\eta_N\left[\tfrac{V_1^2}{2}+h_1-h_{2s}\right]\Rightarrow V_2=${U.f(V2, 5)}\) m/s` : dev === 'valve' ? R`Throttling: \(h_2=h_1\) (isenthalpic)` : R`\(h_2=h_1+\tfrac{V_1^2-V_2^2}{2}=${U.f(h2, 6)}\)`} kJ/kg.</p>
        ${W ? R`<p>\(\dot W=\dot m\left[(h_1-h_2)+\tfrac{V_1^2-V_2^2}{2}\right]-\dot Q_{loss}=${U.f(W, 5)}\) kW. ${dev === 'pump' ? R`Check: incompressible estimate \(w\approx v_1\Delta P/\eta=${U.f(st1.v * (P2 - P1) / 1e3 / eta, 4)}\) kJ/kg.` : ''}</p>` : ''}
        <p>Second law: \(\dot S_{gen}=\dot m(s_2-s_1)+\dot Q_{loss}/T_0=${U.f(sgen, 4)}\) kW/K ${sgen < -1e-6 ? '<b class="err">(negative → impossible!)</b>' : '≥ 0 ✔'}; \(\dot X_d=${U.f(Xd, 5)}\) kW.</p>`;
      return {
        out, html, plot(el) {
          if (!F) return; const c = h('div'); el.append(c);
          U.drawTs(U.canvas(c, 640, 380), F, [{ x: s1, y: st1.T - K, label: '1' }, { x: st2s.s, y: st2s.T - K, label: '2s', color: U.cssVar('--cool') }, { x: st2a.s, y: st2a.T - K, label: '2', color: U.cssVar('--hot') }],
            { lines: [{ ...U.isobarTs(F, P1, F.Tmin, Math.max(st1.T + 60, F.Tc)), label: 'P₁', color: U.cssVar('--hot'), width: 1.2 }, { ...U.isobarTs(F, P2, F.Tmin, Math.max(st1.T + 60, F.Tc)), label: 'P₂', color: U.cssVar('--cool'), width: 1.2 }] });
        }
      };
    }
  });

  /* ======================= Second-law / Carnot checker ======================= */
  U.addCalc('carnot', {
    title: 'Heat engine / refrigerator / heat pump — second-law checker', cat: CAT, blurb: 'Compare with Carnot limit, compute entropy generation, decide reversible / irreversible / impossible.',
    desc: R`<p>Carnot limits: \(\eta_{rev}=1-T_L/T_H\), \(COP_{R,rev}=\dfrac{T_L}{T_H-T_L}\), \(COP_{HP,rev}=\dfrac{T_H}{T_H-T_L}\). Clausius inequality for the cycle: \(\oint \delta Q/T\le0\) ⇒ \(S_{gen}=\dfrac{Q_{out}}{T_{out}}-\dfrac{Q_{in}}{T_{in}}\ge0\).</p>`,
    inputs: [{ k: 'dev', l: 'Device', v: 'he', opts: [['he', 'Heat engine'], ['ref', 'Refrigerator'], ['hp', 'Heat pump']] }, { k: 'TH', l: 'Hot reservoir T<sub>H</sub>', u: '°C', v: 600 }, { k: 'TL', l: 'Cold reservoir T<sub>L</sub>', u: '°C', v: 30 },
    { k: 'Q', l: 'Engine: Q<sub>H</sub> in · Fridge: Q<sub>L</sub> removed · HP: Q<sub>H</sub> delivered', u: 'kW', v: 100 }, { k: 'W', l: 'Work (output for engine, input otherwise)', u: 'kW', v: 50 }],
    run(v) {
      const TH = v.TH + K, TL = v.TL + K; if (TH <= TL) throw new Error('T_H must exceed T_L');
      let perf, rev, QH, QL, name, sgen;
      if (v.dev === 'he') { QH = v.Q; QL = QH - v.W; perf = v.W / QH; rev = 1 - TL / TH; name = 'Thermal efficiency η'; sgen = QL / TL - QH / TH; }
      else if (v.dev === 'ref') { QL = v.Q; QH = QL + v.W; perf = QL / v.W; rev = TL / (TH - TL); name = 'COP<sub>R</sub>'; sgen = QH / TH - QL / TL; }
      else { QH = v.Q; QL = QH - v.W; perf = QH / v.W; rev = TH / (TH - TL); name = 'COP<sub>HP</sub>'; sgen = QH / TH - QL / TL; }
      const verdict = Math.abs(sgen) < 1e-9 * Math.max(1, QH) ? '✔ Reversible (Carnot) device' : sgen > 0 ? '✔ Irreversible but possible' : '✘ IMPOSSIBLE — violates the second law';
      if (QL < 0) throw new Error('Energy balance gives negative rejected/absorbed heat — violates the first law');
      return {
        out: [['Verdict', verdict, '', 1], [name + ' (actual)', perf, ''], [name + ' (Carnot limit)', rev, ''], ['Second-law efficiency', perf / rev, ''], ['Q<sub>H</sub>', QH, 'kW'], ['Q<sub>L</sub>', QL, 'kW'], ['Ṡ<sub>gen</sub>', sgen, 'kW/K'], ['Lost work T<sub>L</sub>Ṡ<sub>gen</sub>', TL * sgen, 'kW']],
        html: R`<p>Use absolute temperatures: \(T_H=${U.f(TH, 5)}\) K, \(T_L=${U.f(TL, 5)}\) K. Entropy generation of the cycle + reservoirs: \(\dot S_{gen}=${U.f(sgen, 4)}\) kW/K. ${v.dev === 'he' ? R`Maximum possible work \(=\eta_{rev}Q_H=${U.f(rev * QH, 4)}\) kW; irreversibility \(I=W_{rev}-W=${U.f(rev * QH - v.W, 4)}\) kW \(=T_L\dot S_{gen}\).` : R`Minimum work \(=${U.f(v.dev === 'ref' ? QL / rev : QH / rev, 4)}\) kW.`}</p>`
      };
    }
  });

  /* ======================= Entropy change ======================= */
  U.addCalc('entropy', {
    title: 'Entropy change & entropy generation', cat: CAT, blurb: 'Ideal gas (const/variable cp), solids & liquids, phase change, heat transfer across a temperature gap.',
    desc: R`<p>Tds relations: \(T\,ds=du+P\,dv=dh-v\,dP\). Ideal gas: \(\Delta s=c_p\ln\frac{T_2}{T_1}-R\ln\frac{P_2}{P_1}\) or \(\Delta s=s^\circ_2-s^\circ_1-R\ln\frac{P_2}{P_1}\). Incompressible: \(\Delta s=c\ln\frac{T_2}{T_1}\). Heat \(Q\) from \(T_A\) to \(T_B\): \(S_{gen}=Q\left(\frac1{T_B}-\frac1{T_A}\right)\).</p>`,
    inputs: [{ k: 'mode', l: 'Case', v: 'ig', opts: [['ig', 'Ideal gas (constant cp)'], ['igv', 'Ideal gas species (NASA tables)'], ['inc', 'Solid / liquid (incompressible)'], ['mix', 'Quench / mixing two bodies'], ['ht', 'Heat transfer between reservoirs']] },
    { k: 'gas', l: 'Gas (const cp)', v: 'air', opts: gasOpts }, { k: 'sp', l: 'Species (tables)', v: 'CO2', opts: Object.entries(U.SPECIES_NAMES) },
    { k: 'm', l: 'Mass m (body A for quench)', u: 'kg', v: 1 }, { k: 'c', l: 'Specific heat c (body A)', u: 'kJ/kg·K', v: 0.45 },
    { k: 'T1', l: 'T₁ (body A initial / reservoir A)', u: '°C', v: 27 }, { k: 'T2', l: 'T₂ (final / body B initial / reservoir B)', u: '°C', v: 327 }, { k: 'P1', l: 'P₁', u: 'kPa', v: 100 }, { k: 'P2', l: 'P₂', u: 'kPa', v: 500 },
    { k: 'mB', l: 'Body B mass', u: 'kg', v: 10 }, { k: 'cB', l: 'Body B specific heat', u: 'kJ/kg·K', v: 4.18 }, { k: 'Q', l: 'Heat transferred Q', u: 'kJ', v: 1000 }],
    show: v => ({ gas: v.mode === 'ig', sp: v.mode === 'igv', P1: v.mode.startsWith('ig'), P2: v.mode.startsWith('ig'), c: v.mode === 'inc' || v.mode === 'mix', mB: v.mode === 'mix', cB: v.mode === 'mix', Q: v.mode === 'ht', m: v.mode !== 'ht' }),
    async run(v) {
      const T1 = v.T1 + K, T2 = v.T2 + K;
      if (v.mode === 'ig') { const g = U.GASES[v.gas], Rg = 8.314462618 / g[3]; const ds = g[1] * Math.log(T2 / T1) - Rg * Math.log(v.P2 / v.P1); return { out: [['ΔS', v.m * ds, 'kJ/K', 1], ['Δs', ds, 'kJ/kg·K']], html: R`\(\Delta s=${g[1]}\ln\frac{${U.f(T2, 5)}}{${U.f(T1, 5)}}-${U.f(Rg, 4)}\ln\frac{${v.P2}}{${v.P1}}=${U.f(ds, 5)}\) kJ/kg·K` }; }
      if (v.mode === 'igv') { await U.IG.load(); const M = U.IG.M(v.sp); const ds = (U.IG.s0(v.sp, T2) - U.IG.s0(v.sp, T1) - 8.314462618 * Math.log(v.P2 / v.P1)) / M; return { out: [['ΔS', v.m * ds, 'kJ/K', 1], ['Δs', ds, 'kJ/kg·K'], ['s°(T₁), s°(T₂)', U.fmt(U.IG.s0(v.sp, T1), 6) + ', ' + U.fmt(U.IG.s0(v.sp, T2), 6), 'kJ/kmol·K']], html: R`\(\Delta \bar s=\bar s^\circ_2-\bar s^\circ_1-\bar R\ln\frac{P_2}{P_1}\), then divide by \(M=${M}\).` }; }
      if (v.mode === 'inc') { const ds = v.c * Math.log(T2 / T1); return { out: [['ΔS', v.m * ds, 'kJ/K', 1]], html: R`\(\Delta S=mc\ln\frac{T_2}{T_1}=${U.f(v.m * ds, 5)}\) kJ/K` }; }
      if (v.mode === 'mix') { const CA = v.m * v.c, CB = v.mB * v.cB, Tf = (CA * T1 + CB * T2) / (CA + CB); const dA = CA * Math.log(Tf / T1), dB = CB * Math.log(Tf / T2);
        return { out: [['Final T<sub>f</sub>', Tf - K, '°C', 1], ['ΔS<sub>A</sub>', dA, 'kJ/K'], ['ΔS<sub>B</sub>', dB, 'kJ/K'], ['S<sub>gen</sub> = ΔS<sub>A</sub>+ΔS<sub>B</sub>', dA + dB, 'kJ/K', 1]], html: R`<p>Energy: \(m_Ac_A(T_f-T_A)+m_Bc_B(T_f-T_B)=0\Rightarrow T_f=${U.f(Tf - K, 5)}\) °C. Each body: \(\Delta S=mc\ln(T_f/T_i)\). The isolated system's entropy rises — quenching is irreversible.</p>` }; }
      const sg = v.Q * (1 / T2 - 1 / T1); return { out: [['S<sub>gen</sub>', sg, 'kJ/K', 1], ['ΔS of A (−Q/T<sub>A</sub>)', -v.Q / T1, 'kJ/K'], ['ΔS of B (+Q/T<sub>B</sub>)', v.Q / T2, 'kJ/K'], ['Verdict', sg >= 0 ? 'possible (heat flows hot→cold)' : 'impossible as stated (heat cannot flow cold→hot unaided)', '']] };
    }
  });

  /* ======================= Exergy ======================= */
  U.addCalc('exergy', {
    title: 'Exergy (availability) of a state, a stream, and heat', cat: CAT, blurb: 'Non-flow and flow exergy relative to a dead state; exergy of heat; reversible work.',
    desc: R`<p>Closed system: \(\phi=(u-u_0)+P_0(v-v_0)-T_0(s-s_0)+\tfrac{V^2}{2}+gz\). Flowing stream: \(\psi=(h-h_0)-T_0(s-s_0)+\tfrac{V^2}{2}+gz\). Heat at \(T\): \(X_Q=Q\left(1-\tfrac{T_0}{T}\right)\).</p>`,
    inputs: [{ k: 'fl', l: 'Fluid', v: 'water', opts: [...Object.entries(U.FLUIDS), ['air', 'Air (ideal gas)']] }, { k: 'P', l: 'P', u: 'kPa', v: 4000 }, { k: 'T', l: 'T', u: '°C', v: 500 }, { k: 'V', l: 'Velocity', u: 'm/s', v: 0 }, { k: 'z', l: 'Elevation', u: 'm', v: 0 },
    { k: 'm', l: 'Mass (or ṁ)', u: 'kg (kg/s)', v: 1 }, { k: 'T0', l: 'Dead state T₀', u: '°C', v: 25 }, { k: 'P0', l: 'Dead state P₀', u: 'kPa', v: 100 }, { k: 'Q', l: 'Heat Q (for exergy of heat)', u: 'kJ', v: 1000 }, { k: 'TQ', l: 'Temperature of heat source', u: '°C', v: 500 }],
    async run(v) {
      let s1, s0, T0 = v.T0 + K;
      if (v.fl === 'air') { await U.IG.load(); const Ra = .287, T = v.T + K; const mk = (T, P) => ({ h: U.IG.air('h', T), u: U.IG.air('u', T), s: U.IG.air('s0', T) - Ra * Math.log(P / 100), v: Ra * T / P }); s1 = mk(T, v.P); s0 = mk(T0, v.P0); }
      else { const F = await U.fluid(v.fl); s1 = F.state({ P: v.P * 1e3, T: v.T + K }); s0 = F.state({ P: v.P0 * 1e3, T: T0 }); }
      const ke = v.V * v.V / 2000 + 9.81 * v.z / 1000;
      const phi = (s1.u - s0.u) + v.P0 * (s1.v - s0.v) - T0 * (s1.s - s0.s) + ke, psi = (s1.h - s0.h) - T0 * (s1.s - s0.s) + ke, xq = v.Q * (1 - T0 / (v.TQ + K));
      return {
        out: [['Flow exergy ψ', psi, 'kJ/kg', 1], ['Non-flow exergy φ', phi, 'kJ/kg', 1], ['Total stream exergy ṁψ', v.m * psi, 'kW'], ['Total closed exergy mφ', v.m * phi, 'kJ'], ['Exergy of heat X<sub>Q</sub>', xq, 'kJ'], ['Energy quality of heat 1−T₀/T', 1 - T0 / (v.TQ + K), '']],
        html: R`<p>State: \(h=${U.f(s1.h, 6)}, u=${U.f(s1.u, 6)}, s=${U.f(s1.s, 5)}, v=${U.f(s1.v, 4)}\). Dead state: \(h_0=${U.f(s0.h, 5)}, u_0=${U.f(s0.u, 5)}, s_0=${U.f(s0.s, 5)}, v_0=${U.f(s0.v, 4)}\).</p><p>Note \(\psi-\phi=(P-P_0)v\) — the flow work’s useful part.</p>`
      };
    }
  });

  /* ======================= Real gas / cubic EOS ======================= */
  U.addCalc('realgas', {
    title: 'Real-gas behaviour: Z from van der Waals, Redlich–Kwong, Peng–Robinson', cat: CAT, blurb: 'Compressibility factor, molar volume and departure from ideal-gas behaviour.',
    desc: R`<p>vdW: \(P=\frac{RT}{v-b}-\frac{a}{v^2}\), \(a=\frac{27R^2T_c^2}{64P_c}\), \(b=\frac{RT_c}{8P_c}\). RK: \(P=\frac{RT}{v-b}-\frac{a}{\sqrt T\,v(v+b)}\). PR: \(P=\frac{RT}{v-b}-\frac{a\alpha(T)}{v^2+2bv-b^2}\), \(\alpha=[1+\kappa(1-\sqrt{T_r})]^2\), \(\kappa=0.37464+1.54226\omega-0.26992\omega^2\). Each cubic is solved for Z; the largest root is vapour-like, the smallest liquid-like.</p>`,
    inputs: [{ k: 'g', l: 'Substance', v: 'CarbonDioxide', opts: ['Water', 'Air', 'Nitrogen', 'Oxygen', 'CarbonDioxide', 'Hydrogen', 'Helium', 'Methane', 'Ethane', 'Propane', 'n-Butane', 'Ammonia', 'R134a', 'R22', 'R12', 'Argon', 'CarbonMonoxide', 'Ethylene', 'n-Octane', 'Methanol', 'Ethanol', 'R1234yf'] },
    { k: 'T', l: 'Temperature', u: '°C', v: 50 }, { k: 'P', l: 'Pressure', u: 'MPa', v: 6 }],
    async run(v) {
      await U.need('crit'); const c = D.crit[v.g]; const Rb = 8.314462618, T = v.T + K, P = v.P * 1e6, Tc = c.Tc, Pc = c.Pc, w = c.w; // J/mol
      const cub = (a2, a1, a0) => { // Z^3 + a2 Z^2 + a1 Z + a0 = 0 real roots
        const f = z => ((z + a2) * z + a1) * z + a0; const roots = []; let prev = f(0), x0 = 0;
        for (let i = 1; i <= 4000; i++) { const x = i * 0.0015 * (1 + i / 400); const fx = f(x); if (prev * fx <= 0) roots.push(U.brent(f, x0, x)); prev = fx; x0 = x; if (x > 20) break; }
        return roots; };
      const A_ = (a) => a * P / (Rb * Rb * T * T), B_ = b => b * P / (Rb * T);
      const res = [];
      { const a = 27 * Rb * Rb * Tc * Tc / (64 * Pc), b = Rb * Tc / (8 * Pc), A = A_(a), B = B_(b); res.push(['van der Waals', cub(-(1 + B), A, -A * B)]); }
      { const a = 0.42748 * Rb * Rb * Math.pow(Tc, 2.5) / Pc, b = 0.08664 * Rb * Tc / Pc, A = a * P / (Rb * Rb * Math.pow(T, 2.5)), B = B_(b); res.push(['Redlich–Kwong', cub(-1, A - B - B * B, -A * B)]); }
      { const kap = 0.37464 + 1.54226 * w - 0.26992 * w * w, al = Math.pow(1 + kap * (1 - Math.sqrt(T / Tc)), 2), a = 0.45724 * Rb * Rb * Tc * Tc / Pc * al, b = 0.07780 * Rb * Tc / Pc, A = A_(a), B = B_(b); res.push(['Peng–Robinson', cub(-(1 - B), A - 3 * B * B - 2 * B, -(A * B - B * B - B * B * B))]); }
      const M = c.M, vid = Rb * T / P; // m3/mol
      const out = [['T<sub>r</sub> = T/T<sub>c</sub>', T / Tc, ''], ['P<sub>r</sub> = P/P<sub>c</sub>', P / Pc, ''], ['Acentric factor ω', w, ''], ['Ideal-gas v', vid / M * 1e3, 'm³/kg']];
      res.forEach(([n, r]) => { if (!r.length) return; const Zv = Math.max(...r), Zl = Math.min(...r); out.push([n + ' Z' + (r.length > 1 ? ' (vap / liq)' : ''), r.length > 1 ? U.fmt(Zv, 4) + ' / ' + U.fmt(Zl, 4) : Zv, '', n === 'Peng–Robinson'], [n + ' v', Zv * vid / M * 1e3, 'm³/kg']); });
      return { out, html: R`<p>Critical constants: \(T_c=${U.f(Tc, 5)}\) K, \(P_c=${U.f(Pc / 1e6, 5)}\) MPa, \(M=${M}\) kg/kmol. Z ≈ 1 means ideal-gas behaviour is acceptable; the ideal-gas error in v is \((1/Z-1)\times100\%\). Rule of thumb: ideal gas is good for \(P_r\ll1\) or \(T_r>2\).</p>` };
    }
  });

  /* ======================= Gas mixtures ======================= */
  U.addCalc('gasmix', {
    title: 'Ideal-gas mixture properties', cat: CAT, blurb: 'Molar mass, R, cp, cv, k, mass fractions, partial pressures (Dalton/Amagat).',
    desc: R`<p>\(M_m=\sum y_iM_i\), \(R_m=\bar R/M_m\), mass fraction \(mf_i=y_iM_i/M_m\), \(c_{p,m}=\sum mf_i\,c_{p,i}\), partial pressure \(P_i=y_iP\). Specific heats evaluated from NASA polynomials at the given T.</p>`,
    inputs: [['N2', 0.79], ['O2', 0.21], ['CO2', 0], ['H2O', 0], ['AR', 0], ['CO', 0], ['H2', 0], ['CH4', 0]].map(([k, y]) => ({ k, l: 'Mole fraction ' + U.SPECIES_NAMES[k], v: y })).concat([{ k: 'T', l: 'T', u: '°C', v: 25 }, { k: 'P', l: 'P', u: 'kPa', v: 101.325 }, { k: 'basis', l: 'Fractions entered are', v: 'mole', opts: [['mole', 'mole fractions'], ['mass', 'mass fractions']] }]),
    async run(v) {
      await U.IG.load(); const sp = ['N2', 'O2', 'CO2', 'H2O', 'AR', 'CO', 'H2', 'CH4'], T = v.T + K;
      let y = sp.map(s => v[s] || 0); if (v.basis === 'mass') { const n = y.map((m, i) => m / U.IG.M(sp[i])); y = n; }
      const S = y.reduce((a, b) => a + b, 0); if (!(S > 0)) throw new Error('Enter fractions'); y = y.map(x => x / S);
      const Mm = y.reduce((a, yi, i) => a + yi * U.IG.M(sp[i]), 0), cpb = y.reduce((a, yi, i) => a + yi * U.IG.cp(sp[i], T), 0);
      const cp = cpb / Mm, Rm = 8.314462618 / Mm, cv = cp - Rm;
      return { out: [['M<sub>mix</sub>', Mm, 'kg/kmol', 1], ['R<sub>mix</sub>', Rm, 'kJ/kg·K'], ['c<sub>p</sub>', cp, 'kJ/kg·K'], ['c<sub>v</sub>', cv, 'kJ/kg·K'], ['k = c<sub>p</sub>/c<sub>v</sub>', cp / cv, '', 1], ['Density', v.P / (Rm * T), 'kg/m³']],
        html: '<table class="num"><tr><th>Species</th><th>y<sub>i</sub></th><th>mass fraction</th><th>P<sub>i</sub> [kPa]</th><th>c̄<sub>p</sub> [kJ/kmol·K]</th></tr>' + sp.map((s, i) => y[i] ? `<tr><td>${U.SPECIES_NAMES[s]}</td><td>${U.fmt(y[i], 4)}</td><td>${U.fmt(y[i] * U.IG.M(s) / Mm, 4)}</td><td>${U.fmt(y[i] * v.P, 4)}</td><td>${U.fmt(U.IG.cp(s, T), 5)}</td></tr>` : '').join('') + '</table>' };
    }
  });

  /* ======================= Reciprocating compressor ======================= */
  U.addCalc('recip', {
    title: 'Reciprocating air compressor (single & multistage)', cat: CAT, blurb: 'Volumetric efficiency, indicated power, optimum intercooling pressures, isothermal efficiency.',
    desc: R`<p>Indicated work (N stages, perfect intercooling, equal pressure ratios): \(W=N\frac{n}{n-1}P_1\dot V_1\left[\left(\frac{P_2}{P_1}\right)^{\frac{n-1}{nN}}-1\right]\). Volumetric efficiency \(\eta_v=1+c-c\left(\frac{P_2}{P_1}\right)^{1/n}\) (per stage). Isothermal work \(P_1\dot V_1\ln(P_2/P_1)\).</p>`,
    inputs: [{ k: 'P1', l: 'Suction P₁', u: 'kPa', v: 100 }, { k: 'T1', l: 'Suction T₁', u: '°C', v: 27 }, { k: 'P2', l: 'Delivery P₂', u: 'kPa', v: 1500 }, { k: 'n', l: 'Polytropic index n', v: 1.3 }, { k: 'N', l: 'Number of stages', v: 2, step: 1 },
    { k: 'c', l: 'Clearance ratio c (per stage)', v: 0.05 }, { k: 'FAD', l: 'Free air delivered (at suction)', u: 'm³/min', v: 5 }, { k: 'rpm', l: 'Speed', u: 'rpm', v: 600 }, { k: 'em', l: 'Mechanical efficiency', v: 0.85 }],
    run(v) {
      const N = Math.max(1, Math.round(v.N)), r = Math.pow(v.P2 / v.P1, 1 / N), n = v.n, V1 = v.FAD / 60, P1 = v.P1;
      const W = N * n / (n - 1) * P1 * V1 * (Math.pow(r, (n - 1) / n) - 1), Wiso = P1 * V1 * Math.log(v.P2 / v.P1);
      const ev = 1 + v.c - v.c * Math.pow(r, 1 / n), Vs = V1 / ev / (v.rpm / 60);
      const T2 = (v.T1 + K) * Math.pow(r, (n - 1) / n) - K; const m = P1 * V1 / (0.287 * (v.T1 + K));
      const Pint = []; for (let i = 1; i < N; i++) Pint.push(U.fmt(P1 * Math.pow(r, i), 4));
      const Qic = N > 1 ? (N - 1) * m * 1.005 * (T2 - v.T1) : 0;
      return { out: [['Indicated power', W, 'kW', 1], ['Shaft power', W / v.em, 'kW', 1], ['Isothermal power', Wiso, 'kW'], ['Isothermal efficiency', Wiso / W, ''], ['Pressure ratio per stage', r, ''], ['Intermediate pressure(s)', Pint.join(', ') || '—', 'kPa'], ['Delivery T (each stage)', T2, '°C'], ['Volumetric efficiency (1st stage)', ev, ''], ['LP swept volume per cycle', Vs * 1e3, 'litre'], ['Mass flow', m, 'kg/s'], ['Intercooler heat rejection', Qic, 'kW']],
        html: R`<p>Optimum (minimum-work) intercooling: \(P_{i}=\sqrt{P_1P_2}\) for two stages — each stage does equal work and air is cooled back to \(T_1\). Multistaging lowers delivery temperature (lubricant safety), raises volumetric efficiency and approaches isothermal compression.</p>`,
        plot(el) { const rs = U.range(1.5, 30, 60); U.plot(U.canvas(el, 640, 320), { series: [1, 2, 3].map(Ns => ({ x: rs, y: rs.map(rr => Ns * n / (n - 1) * (Math.pow(rr, (n - 1) / (n * Ns)) - 1) / Math.log(rr)), label: Ns + ' stage' + (Ns > 1 ? 's' : '') })), xlabel: 'Overall pressure ratio P₂/P₁', ylabel: 'W / W_isothermal', title: 'Benefit of multistage compression' }); } };
    }
  });

  /* ======================= Tank charging / discharging ======================= */
  U.addCalc('tank', {
    title: 'Unsteady flow: charging & discharging a rigid tank', cat: CAT, blurb: 'Uniform-flow analysis with ideal gas: final temperature and mass, isentropic blow-down.',
    desc: R`<p>Uniform-state, uniform-flow: \(m_2u_2-m_1u_1=m_ih_i-m_eh_e+Q-W\). Adiabatic charging of an evacuated tank from a line: \(T_2=kT_{line}\) (constant \(c_p\)). Adiabatic discharge of the gas remaining in the tank follows \(T_2=T_1(P_2/P_1)^{(k-1)/k}\).</p>`,
    inputs: [{ k: 'mode', l: 'Process', v: 'fill', opts: [['fill', 'Charging from a supply line (adiabatic)'], ['empty', 'Discharge to lower pressure (adiabatic)']] }, { k: 'gas', l: 'Gas', v: 'air', opts: gasOpts }, { k: 'V', l: 'Tank volume', u: 'm³', v: 0.5 },
    { k: 'P1', l: 'Initial tank P₁', u: 'kPa', v: 100 }, { k: 'T1', l: 'Initial tank T₁', u: '°C', v: 25 }, { k: 'Pl', l: 'Line pressure (charging)', u: 'kPa', v: 800 }, { k: 'Tl', l: 'Line temperature', u: '°C', v: 25 }, { k: 'P2', l: 'Final tank P₂', u: 'kPa', v: 800 }],
    show: v => ({ Pl: v.mode === 'fill', Tl: v.mode === 'fill' }),
    run(v) {
      const g = U.GASES[v.gas], Rg = 8.314462618 / g[3], cp = g[1], cv = cp - Rg, k = cp / cv, T1 = v.T1 + K, m1 = v.P1 * v.V / (Rg * T1);
      if (v.mode === 'fill') {
        const Tl = v.Tl + K; // m2 cv T2 - m1 cv T1 = (m2-m1) cp Tl, m2 = P2V/(R T2)
        const A = v.P2 * v.V / Rg; // m2 T2 = A
        // cv A - m1 cv T1 = (A/T2 - m1) cp Tl  => A/T2 = (cv A - m1 cv T1)/(cp Tl) + m1
        const inv = ((cv * A - m1 * cv * T1) / (cp * Tl) + m1) / A; const T2 = 1 / inv, m2 = A / T2;
        return { out: [['Final temperature T₂', T2 - K, '°C', 1], ['Mass added', m2 - m1, 'kg', 1], ['Initial mass', m1, 'kg'], ['Final mass', m2, 'kg'], ['Limit for evacuated tank T₂ = kT<sub>line</sub>', k * Tl - K, '°C']], html: R`<p>The gas entering carries flow work \(Pv\) with it, which is converted to internal energy in the tank — hence the tank gets <i>hotter</i> than the line.</p>` };
      }
      const T2 = T1 * Math.pow(v.P2 / v.P1, (k - 1) / k), m2 = v.P2 * v.V / (Rg * T2);
      return { out: [['Final temperature T₂', T2 - K, '°C', 1], ['Mass escaped', m1 - m2, 'kg', 1], ['Mass remaining', m2, 'kg']], html: '<p>Gas remaining in the tank expands isentropically while pushing the escaping gas out, so it cools (why a CO₂ cylinder valve frosts).</p>' };
    }
  });

  /* ======================= Unit converter ======================= */
  const UNITS = {
    Pressure: { Pa: 1, kPa: 1e3, MPa: 1e6, bar: 1e5, atm: 101325, 'mm Hg (torr)': 133.322, 'm H₂O': 9806.65, psi: 6894.757, 'kgf/cm²': 98066.5 },
    Energy: { J: 1, kJ: 1e3, MJ: 1e6, kWh: 3.6e6, cal: 4.1868, kcal: 4186.8, Btu: 1055.056, 'ft·lbf': 1.355818 },
    Power: { W: 1, kW: 1e3, MW: 1e6, hp: 745.6999, 'PS (metric hp)': 735.4988, 'Btu/h': 0.2930711, 'ton of refrigeration': 3516.853, 'kcal/h': 1.163 },
    'Specific energy': { 'J/kg': 1, 'kJ/kg': 1e3, 'Btu/lbm': 2326, 'kcal/kg': 4186.8 },
    'Thermal conductivity': { 'W/m·K': 1, 'kcal/h·m·°C': 1.163, 'Btu/h·ft·°F': 1.730735, 'cal/s·cm·°C': 418.68 },
    'Heat transfer coefficient': { 'W/m²·K': 1, 'kcal/h·m²·°C': 1.163, 'Btu/h·ft²·°F': 5.678263 },
    'Heat flux': { 'W/m²': 1, 'kW/m²': 1e3, 'Btu/h·ft²': 3.154591, 'kcal/h·m²': 1.163 },
    'Specific heat / entropy': { 'J/kg·K': 1, 'kJ/kg·K': 1e3, 'Btu/lbm·°F': 4186.8, 'kcal/kg·°C': 4186.8 },
    Volume: { 'm³': 1, L: 1e-3, 'cm³': 1e-6, 'ft³': 0.02831685, 'US gal': 3.785412e-3 },
    'Dynamic viscosity': { 'Pa·s': 1, 'cP (mPa·s)': 1e-3, 'P (poise)': 0.1, 'lbm/ft·s': 1.488164 },
    'Kinematic viscosity / diffusivity': { 'm²/s': 1, 'cm²/s (St)': 1e-4, 'cSt (mm²/s)': 1e-6, 'ft²/s': 0.09290304, 'ft²/h': 2.58064e-5 }
  };
  U.addCalc('units', {
    title: 'Unit converter', cat: 'Utilities', blurb: 'Pressure, energy, power, k, h, flux, viscosity, temperature…',
    mount(el) {
      const cat = h('select', { class: 'inp' }, ['Temperature', ...Object.keys(UNITS)].map(c => h('option', {}, c))), val = h('input', { class: 'inp', type: 'number', value: 1 }), from = h('select', { class: 'inp' }), out = h('div');
      const T = { '°C': [x => x + K, x => x - K], K: [x => x, x => x], '°F': [x => (x - 32) * 5 / 9 + K, x => (x - K) * 9 / 5 + 32], '°R': [x => x * 5 / 9, x => x * 9 / 5] };
      const fill = () => { from.innerHTML = ''; Object.keys(cat.value === 'Temperature' ? T : UNITS[cat.value]).forEach(u => from.append(h('option', {}, u))); go(); };
      const go = () => { out.innerHTML = ''; const x = +val.value; const rows = cat.value === 'Temperature' ? Object.entries(T).map(([u, [, fr]]) => [u, fr(T[from.value][0](x))]) : Object.entries(UNITS[cat.value]).map(([u, f]) => [u, x * UNITS[cat.value][from.value] / f]); out.append(h('div', { class: 'out' }, rows.map(([u, y]) => h('div', {}, h('span', {}, u), h('b', { html: U.fmt(y, 7) }))))); if (cat.value === 'Temperature') out.append(h('p', { class: 'small muted' }, 'Temperature differences: 1 K = 1 °C = 1.8 °F = 1.8 °R.')); };
      cat.onchange = fill; val.oninput = go; from.onchange = go;
      el.append(h('div', { class: 'form' }, h('div', { class: 'fld' }, h('label', {}, 'Quantity'), cat), h('div', { class: 'fld' }, h('label', {}, 'Value'), val), h('div', { class: 'fld' }, h('label', {}, 'From unit'), from)), out); fill();
    }
  });
})();
