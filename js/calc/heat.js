/* Heat transfer calculators: conduction, fins, transient */
'use strict';
(() => {
  const { h } = U; const K = 273.15;
  const CAT = 'Heat transfer — conduction';
  const CATT = 'Heat transfer — transient conduction';
  const matOpts = [['', '— type k or pick a material —'], ...U.SOLIDS.map((m, i) => [i, m.n + ' (k=' + m.k + ')'])];
  U.matOpts = matOpts;

  /* ======================= Composite wall / cylinder / sphere ======================= */
  U.addCalc('composite', {
    title: 'Composite wall, cylinder or sphere — thermal resistance network', cat: CAT, blurb: 'Up to 4 layers + contact resistances + convection both sides: Q, U, interface temperatures, profile.',
    desc: R`<p>Resistances: plane \(R=\frac{L}{kA}\); cylinder \(R=\frac{\ln(r_2/r_1)}{2\pi kL}\); sphere \(R=\frac{r_2-r_1}{4\pi kr_1r_2}\); convection \(R=\frac1{hA}\); contact \(R=R''_{tc}/A\). Series: \(\dot Q=\dfrac{T_{\infty,1}-T_{\infty,2}}{\sum R}\), \(U=\dfrac{1}{A\sum R}\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'plane', opts: [['plane', 'Plane wall'], ['cyl', 'Cylinder (pipe)'], ['sph', 'Sphere']] }, { k: 'A', l: 'Area (plane) or length (cylinder)', u: 'm² / m', v: 1 }, { k: 'r0', l: 'Inner radius (cyl/sph)', u: 'mm', v: 25 },
    { k: 'Ti', l: 'Inside fluid T<sub>∞,1</sub>', u: '°C', v: 200 }, { k: 'hi', l: 'Inside h₁ (0 = surface temperature given)', u: 'W/m²K', v: 50 }, { k: 'To', l: 'Outside fluid T<sub>∞,2</sub>', u: '°C', v: 25 }, { k: 'ho', l: 'Outside h₂ (0 = surface temperature given)', u: 'W/m²K', v: 10 },
    ...[1, 2, 3, 4].flatMap(i => [{ k: 't' + i, l: `Layer ${i} thickness (0 = none)`, u: 'mm', v: [5, 50, 0, 0][i - 1] }, { k: 'k' + i, l: `Layer ${i} k`, u: 'W/m·K', v: [45, 0.04, 1, 1][i - 1] }]),
    { k: 'Rc', l: 'Contact resistance R″<sub>tc</sub> between each layer', u: 'm²K/W', v: 0 }],
    run(v) {
      const layers = [1, 2, 3, 4].map(i => [v['t' + i] / 1000, v['k' + i]]).filter(l => l[0] > 0);
      if (!layers.length) throw new Error('Add at least one layer');
      const g = v.geo, L = v.A; let r = v.r0 / 1000; const R = [], labels = [], radii = [r];
      const area = rr => g === 'plane' ? v.A : g === 'cyl' ? 2 * Math.PI * rr * L : 4 * Math.PI * rr * rr;
      if (v.hi > 0) { R.push(1 / (v.hi * area(r))); labels.push('conv. inside'); }
      layers.forEach(([t, k], i) => {
        if (i > 0 && v.Rc > 0) { R.push(v.Rc / area(r)); labels.push('contact ' + i + '|' + (i + 1)); }
        const r2 = r + t; R.push(g === 'plane' ? t / (k * v.A) : g === 'cyl' ? Math.log(r2 / r) / (2 * Math.PI * k * L) : (r2 - r) / (4 * Math.PI * k * r * r2)); labels.push('layer ' + (i + 1)); r = r2; radii.push(r);
      });
      if (v.ho > 0) { R.push(1 / (v.ho * area(r))); labels.push('conv. outside'); }
      const Rt = R.reduce((a, b) => a + b, 0), Q = (v.Ti - v.To) / Rt;
      let T = v.Ti; const temps = [T]; R.forEach(x => { T -= Q * x; temps.push(T); });
      const Uo = 1 / (area(r) * Rt);
      // profile
      return {
        out: [['Heat rate Q', Q, 'W', 1], ['Total resistance ΣR', Rt, 'K/W'], ['U (based on outer area)', Uo, 'W/m²K'], ['Heat flux at outer surface', Q / area(r), 'W/m²'], ['Inner surface T', v.hi > 0 ? temps[1] : v.Ti, '°C'], ['Outer surface T', v.ho > 0 ? temps[temps.length - 2] : v.To, '°C']],
        html: '<table class="num"><tr><th>Element</th><th>R [K/W]</th><th>% of ΣR</th><th>T after element [°C]</th></tr>' + R.map((x, i) => `<tr><td>${labels[i]}</td><td>${U.fmt(x, 4)}</td><td>${U.fmt(100 * x / Rt, 3)}</td><td>${U.fmt(temps[i + 1], 5)}</td></tr>`).join('') + '</table><p class="small muted">The element with the largest share of ΣR controls the heat flow — improve that one first.</p>',
        plot(el) {
          const xs = [], ys = []; let ti = v.hi > 0 ? 1 : 0; let rr = v.r0 / 1000;
          layers.forEach(([t, k], i) => { if (i > 0 && v.Rc > 0) ti++; const Ta = temps[ti], Tb = temps[ti + 1]; for (let j = 0; j <= 20; j++) { const f = j / 20, x = rr + t * f; let TT; if (g === 'plane') TT = Ta + (Tb - Ta) * f; else if (g === 'cyl') TT = Ta + (Tb - Ta) * Math.log(x / rr) / Math.log((rr + t) / rr); else TT = Ta + (Tb - Ta) * (1 / rr - 1 / x) / (1 / rr - 1 / (rr + t)); xs.push((g === 'plane' ? x - v.r0 / 1000 : x) * 1000); ys.push(TT); } rr += t; ti++; });
          U.plot(U.canvas(el, 680, 320), { series: [{ x: xs, y: ys, label: 'T(x)' }], xlabel: g === 'plane' ? 'x [mm]' : 'r [mm]', ylabel: 'T [°C]', title: 'Temperature distribution through the layers' });
        }
      };
    }
  });

  /* ======================= Critical radius ======================= */
  U.addCalc('critrad', {
    title: 'Critical radius of insulation', cat: CAT, blurb: 'Why adding insulation to a thin wire can increase heat loss.',
    desc: R`<p>Cylinder: \(r_{cr}=k_{ins}/h\); sphere: \(r_{cr}=2k_{ins}/h\). Below \(r_{cr}\), added insulation increases surface area faster than it adds conduction resistance, so heat loss rises.</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'cyl', opts: [['cyl', 'Cylinder (wire/pipe)'], ['sph', 'Sphere']] }, { k: 'r1', l: 'Bare radius r₁', u: 'mm', v: 1.5 }, { k: 'k', l: 'Insulation k', u: 'W/m·K', v: 0.15 }, { k: 'h', l: 'Outer h', u: 'W/m²K', v: 12 }, { k: 'T1', l: 'Surface T', u: '°C', v: 80 }, { k: 'Tinf', l: 'Ambient T', u: '°C', v: 25 }, { k: 'r2', l: 'Chosen outer radius r₂', u: 'mm', v: 6 }],
    run(v) {
      const r1 = v.r1 / 1000, rcr = (v.geo === 'cyl' ? 1 : 2) * v.k / v.h;
      const Q = r2 => v.geo === 'cyl' ? (v.T1 - v.Tinf) / (Math.log(r2 / r1) / (2 * Math.PI * v.k) + 1 / (v.h * 2 * Math.PI * r2)) : (v.T1 - v.Tinf) / ((r2 - r1) / (4 * Math.PI * v.k * r1 * r2) + 1 / (v.h * 4 * Math.PI * r2 * r2));
      const r2 = v.r2 / 1000;
      return { out: [['Critical radius r<sub>cr</sub>', rcr * 1000, 'mm', 1], ['Q bare', Q(r1), v.geo === 'cyl' ? 'W/m' : 'W'], ['Q with r₂', Q(r2), v.geo === 'cyl' ? 'W/m' : 'W', 1], ['Q at r<sub>cr</sub> (maximum)', rcr > r1 ? Q(rcr) : '— (r₁ > r<sub>cr</sub>)', v.geo === 'cyl' ? 'W/m' : 'W'], ['Verdict', r1 < rcr ? 'r₁ < r_cr: thin insulation INCREASES loss (good for electrical wires)' : 'r₁ ≥ r_cr: any insulation reduces loss', '']],
        plot(el) { const rs = U.range(r1, Math.max(5 * rcr, 3 * r2, 2 * r1), 120); U.plot(U.canvas(el, 640, 320), { series: [{ x: rs.map(x => x * 1000), y: rs.map(Q), label: 'Q(r₂)' }], marks: [{ x: rcr * 1000, y: Q(Math.max(rcr, r1)), label: 'r_cr' }, { x: r2 * 1000, y: Q(r2), label: 'chosen' }], xlabel: 'Outer radius of insulation [mm]', ylabel: v.geo === 'cyl' ? 'Q [W/m]' : 'Q [W]', title: 'Heat loss vs insulation thickness' }); } };
    }
  });

  /* ======================= Heat generation ======================= */
  U.addCalc('heatgen', {
    title: 'Conduction with internal heat generation (wall, wire, sphere)', cat: CAT, blurb: 'Electrical wires, nuclear fuel rods, curing concrete: max temperature and profile.',
    desc: R`<p>Plane wall of half-thickness L, both faces cooled: \(T(x)=T_s+\dfrac{\dot gL^2}{2k}\left(1-\dfrac{x^2}{L^2}\right)\), \(T_s=T_\infty+\dot gL/h\). Cylinder: \(T(r)=T_s+\dfrac{\dot gR^2}{4k}\left(1-\dfrac{r^2}{R^2}\right)\), \(T_s=T_\infty+\dot gR/2h\). Sphere: \(\dfrac{\dot gR^2}{6k}\), \(T_s=T_\infty+\dot gR/3h\). Electric wire: \(\dot g=I^2\rho_e/A_c^2\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'cyl', opts: [['wall', 'Plane wall (half-thickness L)'], ['cyl', 'Long cylinder / wire (radius R)'], ['sph', 'Sphere (radius R)']] }, { k: 'mode', l: 'Generation specified by', v: 'wire', opts: [['g', 'Volumetric rate ġ (W/m³)'], ['wire', 'Electric current (wire)']] },
    { k: 'g', l: 'ġ', u: 'W/m³', v: 5e7 }, { k: 'I', l: 'Current I', u: 'A', v: 200 }, { k: 're', l: 'Electrical resistivity ρ<sub>e</sub>', u: 'Ω·m', v: 1.72e-8 }, { k: 'R', l: 'L or R', u: 'mm', v: 2 }, { k: 'k', l: 'Thermal conductivity k', u: 'W/m·K', v: 380 }, { k: 'h', l: 'Convection h', u: 'W/m²K', v: 100 }, { k: 'Tinf', l: 'Fluid T<sub>∞</sub>', u: '°C', v: 30 }],
    show: v => ({ g: v.mode === 'g', I: v.mode === 'wire', re: v.mode === 'wire' }),
    run(v) {
      const R = v.R / 1000; let g = v.g; if (v.mode === 'wire') { const A = v.geo === 'wall' ? 1 : Math.PI * R * R; g = v.I * v.I * v.re / (A * A); }
      const n = { wall: 1, cyl: 2, sph: 3 }[v.geo]; const Ts = v.Tinf + g * R / (n * v.h), dT = g * R * R / (2 * n * v.k), T0 = Ts + dT;
      return { out: [['Maximum (centre) T₀', T0, '°C', 1], ['Surface T<sub>s</sub>', Ts, '°C', 1], ['Centre–surface rise', dT, 'K'], ['ġ', g, 'W/m³'], ['Surface heat flux', g * R / n, 'W/m²'], ['Biot number hR/k', v.h * R / v.k, '']],
        plot(el) { const xs = U.range(-R, R, 81); U.plot(U.canvas(el, 640, 300), { series: [{ x: xs.map(x => x * 1000), y: xs.map(x => Ts + dT * (1 - x * x / (R * R))) }], xlabel: 'Position [mm]', ylabel: 'T [°C]', title: 'Parabolic temperature profile' }); } };
    }
  });

  /* ======================= Fins ======================= */
  U.addCalc('fin', {
    title: 'Fins & extended surfaces (all tip conditions, annular, triangular, arrays)', cat: CAT, blurb: 'Fin heat rate, efficiency, effectiveness, temperature profile, overall efficiency of a finned surface.',
    desc: R`<p>\(m=\sqrt{hP/kA_c}\), \(M=\sqrt{hPkA_c}\,\theta_b\). Convective tip: \(\dot q_f=M\dfrac{\sinh mL+(h/mk)\cosh mL}{\cosh mL+(h/mk)\sinh mL}\); adiabatic tip: \(M\tanh mL\); infinite: \(M\). Efficiency \(\eta_f=\dot q_f/(hA_f\theta_b)\), effectiveness \(\varepsilon_f=\dot q_f/(hA_c\theta_b)\). Array: \(\eta_o=1-\frac{NA_f}{A_t}(1-\eta_f)\).</p>`,
    inputs: [{ k: 'type', l: 'Fin type', v: 'pin', opts: [['pin', 'Pin fin (circular)'], ['rect', 'Straight rectangular'], ['tri', 'Straight triangular'], ['ann', 'Annular (circumferential)']] },
    { k: 'tip', l: 'Tip condition', v: 'conv', opts: [['conv', 'Convective tip (exact)'], ['adia', 'Adiabatic tip'], ['corr', 'Adiabatic with corrected length L<sub>c</sub>'], ['temp', 'Prescribed tip temperature'], ['inf', 'Infinitely long']] },
    { k: 'mat', l: 'Material', v: '0', opts: matOpts }, { k: 'k', l: 'k (used if no material picked)', u: 'W/m·K', v: 200 }, { k: 'L', l: 'Length L (annular: r₂ − r₁)', u: 'mm', v: 50 }, { k: 'D', l: 'Diameter (pin) / thickness t (others)', u: 'mm', v: 5 },
    { k: 'w', l: 'Width w (straight fins)', u: 'mm', v: 100 }, { k: 'r1', l: 'Base radius r₁ (annular)', u: 'mm', v: 12.5 }, { k: 'h', l: 'h', u: 'W/m²K', v: 40 }, { k: 'Tb', l: 'Base T<sub>b</sub>', u: '°C', v: 100 }, { k: 'Tinf', l: 'Fluid T<sub>∞</sub>', u: '°C', v: 25 }, { k: 'TL', l: 'Tip T (prescribed)', u: '°C', v: 40 },
    { k: 'N', l: 'Array: number of fins', v: 0 }, { k: 'Ab', l: 'Array: base plate area (incl. fin footprints)', u: 'm²', v: 0.01 }],
    show: v => ({ w: v.type === 'rect' || v.type === 'tri', r1: v.type === 'ann', TL: v.tip === 'temp', k: v.mat === '', tip: v.type === 'pin' || v.type === 'rect' }),
    run(v) {
      const k = v.mat !== '' ? U.SOLIDS[+v.mat].k : v.k, L = v.L / 1000, t = v.D / 1000, w = v.w / 1000, hh = v.h, tb = v.Tb - v.Tinf;
      let Ac, P, Af, q, eta, prof = null, mL, m;
      if (v.type === 'pin' || v.type === 'rect') {
        if (v.type === 'pin') { Ac = Math.PI * t * t / 4; P = Math.PI * t; } else { Ac = w * t; P = 2 * (w + t); }
        m = Math.sqrt(hh * P / (k * Ac)); const M = Math.sqrt(hh * P * k * Ac) * tb, a = hh / (m * k);
        const Lc = L + (v.type === 'pin' ? t / 4 : t / 2); let Leff = v.tip === 'corr' ? Lc : L; mL = m * Leff;
        if (v.tip === 'conv') { q = M * (Math.sinh(mL) + a * Math.cosh(mL)) / (Math.cosh(mL) + a * Math.sinh(mL)); prof = x => (Math.cosh(m * (L - x)) + a * Math.sinh(m * (L - x))) / (Math.cosh(mL) + a * Math.sinh(mL)); }
        else if (v.tip === 'adia' || v.tip === 'corr') { q = M * Math.tanh(mL); prof = x => Math.cosh(m * (Leff - x)) / Math.cosh(mL); }
        else if (v.tip === 'temp') { const r = (v.TL - v.Tinf) / tb; q = M * (Math.cosh(mL) - r) / Math.sinh(mL); prof = x => (r * Math.sinh(m * x) + Math.sinh(m * (L - x))) / Math.sinh(mL); }
        else { q = M; prof = x => Math.exp(-m * x); }
        Af = P * L + (v.tip === 'conv' ? Ac : 0); if (v.tip === 'corr') Af = P * Lc;
        eta = q / (hh * Af * tb);
      } else if (v.type === 'tri') {
        Ac = w * t; m = Math.sqrt(2 * hh / (k * t)); mL = m * L; Af = 2 * w * Math.sqrt(L * L + t * t / 4); eta = U.I(1, 2 * mL) / (mL * U.I(0, 2 * mL)); q = eta * hh * Af * tb;
      } else {
        const r1 = v.r1 / 1000, r2 = r1 + L, r2c = r2 + t / 2; m = Math.sqrt(2 * hh / (k * t)); mL = m * L; Ac = 2 * Math.PI * r1 * t; Af = 2 * Math.PI * (r2c * r2c - r1 * r1);
        const C2 = (2 * r1 / m) / (r2c * r2c - r1 * r1); eta = C2 * (U.K(1, m * r1) * U.I(1, m * r2c) - U.I(1, m * r1) * U.K(1, m * r2c)) / (U.I(0, m * r1) * U.K(1, m * r2c) + U.K(0, m * r1) * U.I(1, m * r2c)); q = eta * hh * Af * tb;
      }
      const eff = q / (hh * Ac * tb);
      const out = [['Fin heat rate q<sub>f</sub>', q, 'W', 1], ['Fin efficiency η<sub>f</sub>', eta, '', 1], ['Fin effectiveness ε<sub>f</sub>', eff, ''], ['mL', mL, ''], ['m', m, '1/m'], ['Biot number (h·t/2k)', hh * (t / 2) / k, ''], ['Fin surface area', Af * 1e4, 'cm²'], ['k used', k, 'W/m·K']];
      if (v.N > 0) { const At = v.N * Af + (v.Ab - v.N * Ac), eo = 1 - v.N * Af / At * (1 - eta), Qt = eo * hh * At * tb, Q0 = hh * v.Ab * tb; out.push(['Overall surface efficiency η<sub>o</sub>', eo, ''], ['Total heat rate (array)', Qt, 'W', 1], ['Without fins', Q0, 'W'], ['Enhancement factor', Qt / Q0, '']); }
      const html = R`<p>Guidance: fins are worthwhile only if \(\varepsilon_f>2\); mL ≈ 1–1.5 captures ~76–90 % of the heat an infinite fin would transfer (\(\tanh 1.5=0.905\)). ${eff < 2 ? '<b class="err">Effectiveness < 2: this fin is hardly justified.</b>' : ''}</p>`;
      return { out, html, plot(el) { if (!prof) return; const xs = U.range(0, L, 80); U.plot(U.canvas(el, 640, 300), { series: [{ x: xs.map(x => x * 1000), y: xs.map(x => v.Tinf + tb * prof(x)), label: 'T(x)' }, { x: [0, L * 1000], y: [v.Tinf, v.Tinf], dash: [5, 5], color: U.cssVar('--muted'), label: 'T∞' }], xlabel: 'x from base [mm]', ylabel: 'T [°C]', title: 'Fin temperature distribution' }); } };
    }
  });

  /* ======================= Shape factors ======================= */
  const SF = [
    ['Isothermal cylinder buried in semi-infinite medium (depth z to centre)', ['D', 'z', 'L'], v => 2 * Math.PI * v.L / Math.acosh(2 * v.z / v.D)],
    ['Isothermal sphere buried in semi-infinite medium', ['D', 'z'], v => 2 * Math.PI * v.D / (1 - v.D / (4 * v.z))],
    ['Sphere in infinite medium', ['D'], v => 2 * Math.PI * v.D],
    ['Vertical cylinder in semi-infinite medium (top flush with surface)', ['D', 'L'], v => 2 * Math.PI * v.L / Math.log(4 * v.L / v.D)],
    ['Cylinder centred in a square solid bar (side w)', ['D', 'w', 'L'], v => 2 * Math.PI * v.L / Math.log(1.08 * v.w / v.D)],
    ['Eccentric cylinders (inner d, outer D, offset z)', ['d', 'D', 'z', 'L'], v => 2 * Math.PI * v.L / Math.acosh((v.D * v.D + v.d * v.d - 4 * v.z * v.z) / (2 * v.D * v.d))],
    ['Two parallel cylinders in infinite medium (centre distance w)', ['D1', 'D2', 'w', 'L'], v => 2 * Math.PI * v.L / Math.acosh((4 * v.w * v.w - v.D1 * v.D1 - v.D2 * v.D2) / (2 * v.D1 * v.D2))],
    ['Cylinder midway between two parallel planes (planes 2z apart)', ['D', 'z', 'L'], v => 2 * Math.PI * v.L / Math.log(8 * v.z / (Math.PI * v.D))],
    ['Row of cylinders under a surface (spacing w, depth z)', ['D', 'z', 'w', 'L'], v => 2 * Math.PI * v.L / Math.log(2 * v.w / (Math.PI * v.D) * Math.sinh(2 * Math.PI * v.z / v.w))],
    ['Edge of two adjoining walls (thickness ≪ length)', ['L'], v => 0.54 * v.L],
    ['Corner of three walls (wall thickness L)', ['L'], v => 0.15 * v.L],
    ['Disk on surface of semi-infinite medium', ['D'], v => 2 * v.D],
    ['Square flow passage (inner side a, outer side b)', ['a', 'b', 'L'], v => v.b / v.a < 1.41 ? 2 * Math.PI * v.L / (0.785 * Math.log(v.b / v.a)) : 2 * Math.PI * v.L / (0.93 * Math.log(v.b / v.a) - 0.0502)]
  ];
  U.addCalc('shape', {
    title: '2-D conduction shape factors', cat: CAT, blurb: 'Buried pipes, spheres, eccentric annuli, edges and corners: Q = S k ΔT.',
    desc: R`<p>For two isothermal surfaces in a 2-D/3-D solid: \(\dot Q=Sk(T_1-T_2)\), where the conduction shape factor \(S\) [m] depends only on geometry. Dimensions in metres.</p>`,
    mount(el) {
      const sel = h('select', { class: 'inp' }, SF.map((s, i) => h('option', { value: i }, s[0]))); const box = h('div', { class: 'form' }), out = h('div');
      const k = h('input', { class: 'inp', type: 'number', value: 1.2 }), dT = h('input', { class: 'inp', type: 'number', value: 60 }); const fields = {};
      const build = () => { box.innerHTML = ''; SF[sel.value][1].forEach(p => { fields[p] = fields[p] || h('input', { class: 'inp', type: 'number', step: 'any', value: { D: 0.1, d: 0.05, z: 0.5, L: 10, w: 0.4, D1: 0.1, D2: 0.1, a: 0.2, b: 0.4 }[p] }); box.append(h('div', { class: 'fld' }, h('label', {}, p + ' [m]'), fields[p])); }); box.append(h('div', { class: 'fld' }, h('label', {}, 'k [W/m·K]'), k), h('div', { class: 'fld' }, h('label', {}, 'T₁ − T₂ [K]'), dT)); go(); };
      const go = () => { const s = SF[sel.value], vv = {}; s[1].forEach(p => vv[p] = +fields[p].value); const S = s[2](vv); out.innerHTML = ''; out.append(h('div', { class: 'out' }, h('div', { class: 'main' }, h('span', {}, 'Shape factor S'), h('b', { html: U.fmt(S, 5) + ' m' })), h('div', { class: 'main' }, h('span', {}, 'Heat rate Q'), h('b', { html: U.fmt(S * +k.value * +dT.value, 5) + ' W' })))); if (!isFinite(S)) out.append(h('p', { class: 'err' }, 'Geometry invalid (check z > D/2 etc.)')); };
      sel.onchange = build; el.append(h('div', { class: 'fld' }, h('label', {}, 'Configuration'), sel), box, out); el.addEventListener('input', go); build();
    }
  });

  /* ======================= 2-D finite-difference solver ======================= */
  U.addCalc('fd2d', {
    title: '2-D steady conduction — finite-difference solver', cat: CAT, blurb: 'Rectangular plate with any mix of fixed-T, convective, insulated or flux edges and generation; heat map & edge heat flows.',
    desc: R`<p>Interior node (Δx = Δy): \(T_{m+1,n}+T_{m-1,n}+T_{m,n+1}+T_{m,n-1}-4T_{m,n}+\dot g\Delta x^2/k=0\). Boundary nodes use energy balances on half/quarter control volumes (convection: \(h\Delta x(T_\infty-T)\)). Solved by Gauss–Seidel with over-relaxation.</p>`,
    mount(el) {
      const num = (l, v) => { const i = h('input', { class: 'inp', type: 'number', step: 'any', value: v }); return [h('div', { class: 'fld' }, h('label', { html: l }), i), i]; };
      const W = num('Width W [m]', 0.3), H = num('Height H [m]', 0.2), N = num('Nodes across width', 31), k = num('k [W/m·K]', 15), g = num('Generation ġ [W/m³]', 0);
      const sides = ['Top', 'Bottom', 'Left', 'Right'], ctl = {};
      const sideUI = sides.map((s, i) => { const t = h('select', { class: 'inp' }, [['T', 'Fixed T'], ['h', 'Convection'], ['ins', 'Insulated'], ['q', 'Heat flux in']].map(([a, b]) => h('option', { value: a }, b))); t.value = ['T', 'h', 'T', 'ins'][i]; const a = h('input', { class: 'inp', type: 'number', value: [200, 50, 30, 0][i] }), b = h('input', { class: 'inp', type: 'number', value: 25 }); ctl[s] = { t, a, b }; return h('div', { class: 'fld' }, h('label', {}, s + ' edge: type · value (T °C / h W/m²K / q W/m²) · T∞'), h('div', { class: 'row' }, t, a, b)); });
      const out = h('div'), pic = h('div');
      el.append(h('div', { class: 'form' }, W[0], H[0], N[0], k[0], g[0], ...sideUI), h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: () => solve() }, 'Solve')), out, pic);
      const cv = U.canvas(pic, 760, 520);
      const solve = () => {
        out.innerHTML = '';
        const Wd = +W[1].value, Hd = +H[1].value, nx = Math.max(5, Math.min(81, Math.round(+N[1].value))), dx = Wd / (nx - 1), ny = Math.max(3, Math.round(Hd / dx) + 1), kk = +k[1].value, gg = +g[1].value;
        const bc = {}; sides.forEach(s => bc[s] = { t: ctl[s].t.value, a: +ctl[s].a.value, b: +ctl[s].b.value });
        const T = Array.from({ length: ny }, () => new Float64Array(nx).fill(50));
        const fixed = (j, i) => { // returns fixed T or null; precedence: fixed edges
          if (j === 0 && bc.Top.t === 'T') return bc.Top.a; if (j === ny - 1 && bc.Bottom.t === 'T') return bc.Bottom.a; if (i === 0 && bc.Left.t === 'T') return bc.Left.a; if (i === nx - 1 && bc.Right.t === 'T') return bc.Right.a; return null; };
        const w = 1.85; let it = 0, res = 1;
        while (it < 20000 && res > 1e-6) {
          res = 0; it++;
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const f = fixed(j, i); if (f != null) { T[j][i] = f; continue; }
            // general energy balance with control-volume fractions
            let num = 0, den = 0; const fx = (i === 0 || i === nx - 1) ? 0.5 : 1, fy = (j === 0 || j === ny - 1) ? 0.5 : 1;
            const link = (jj, ii, area) => { num += kk * area * T[jj][ii]; den += kk * area; };
            if (i > 0) link(j, i - 1, fy); if (i < nx - 1) link(j, i + 1, fy); if (j > 0) link(j - 1, i, fx); if (j < ny - 1) link(j + 1, i, fx);
            const edge = (b, len) => { if (b.t === 'h') { num += b.a * dx * len * b.b; den += b.a * dx * len; } else if (b.t === 'q') num += b.a * dx * len; };
            if (j === 0) edge(bc.Top, fx); if (j === ny - 1) edge(bc.Bottom, fx); if (i === 0) edge(bc.Left, fy); if (i === nx - 1) edge(bc.Right, fy);
            num += gg * dx * dx * fx * fy;
            const Tn = num / den, d = Tn - T[j][i]; T[j][i] += w * d; res = Math.max(res, Math.abs(d));
          }
        }
        // heat flows into domain per edge (W per m depth)
        const edgeQ = { Top: 0, Bottom: 0, Left: 0, Right: 0 };
        const flow = (s, j, i, jn, iN, len) => { const b = bc[s]; let q; if (b.t === 'T') q = kk * len * (T[j][i] - T[jn][iN]); else if (b.t === 'h') q = b.a * dx * len * (b.b - T[j][i]); else if (b.t === 'q') q = b.a * dx * len; else q = 0; return q; };
        for (let i = 0; i < nx; i++) { const len = (i === 0 || i === nx - 1) ? 0.5 : 1; edgeQ.Top += flow('Top', 0, i, 1, i, len); edgeQ.Bottom += flow('Bottom', ny - 1, i, ny - 2, i, len); }
        for (let j = 0; j < ny; j++) { const len = (j === 0 || j === ny - 1) ? 0.5 : 1; edgeQ.Left += flow('Left', j, 0, j, 1, len); edgeQ.Right += flow('Right', j, nx - 1, j, nx - 2, len); }
        let mn = Infinity, mx = -Infinity; T.forEach(r => r.forEach(x => { mn = Math.min(mn, x); mx = Math.max(mx, x); }));
        out.append(h('div', { class: 'out' }, [['Grid', nx + ' × ' + ny + ' (Δx = ' + U.fmt(dx * 1000, 3) + ' mm)'], ['Iterations', it], ['T<sub>max</sub> / T<sub>min</sub>', U.fmt(mx, 5) + ' / ' + U.fmt(mn, 5) + ' °C'], ...sides.map(s => ['Heat in through ' + s, U.fmt(edgeQ[s], 5) + ' W/m']), ['Balance Σ + ġA', U.fmt(edgeQ.Top + edgeQ.Bottom + edgeQ.Left + edgeQ.Right + gg * Wd * Hd, 3) + ' W/m (≈0)']].map(([a, b]) => h('div', {}, h('span', { html: a }), h('b', { html: String(b) })))));
        // draw heat map
        const ctx = cv.ctx, pw = 700, ph = Math.min(460, pw * Hd / Wd), ox = 30, oy = 20, cw = pw / nx, chh = ph / ny;
        ctx.clearRect(0, 0, cv.W, cv.H);
        const col = x => { const t = (x - mn) / (mx - mn || 1); const r = Math.round(255 * Math.min(1, Math.max(0, 1.5 * t - 0.2))), gC = Math.round(255 * Math.max(0, 1 - Math.abs(t - 0.5) * 2.2)), b = Math.round(255 * Math.min(1, Math.max(0, 1.2 - 1.6 * t))); return `rgb(${r},${gC},${b})`; };
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { ctx.fillStyle = col(T[j][i]); ctx.fillRect(ox + i * cw, oy + j * chh, cw + 0.6, chh + 0.6); }
        // isotherms via marching squares (simple contour lines)
        ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1;
        for (let c = 1; c < 10; c++) { const lv = mn + (mx - mn) * c / 10; for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = T[j][i], b = T[j][i + 1], cc = T[j + 1][i + 1], d = T[j + 1][i]; const pts = []; const e = (p, q, x1, y1, x2, y2) => { if ((p - lv) * (q - lv) < 0) { const f = (lv - p) / (q - p); pts.push([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]); } };
          const X = i2 => ox + (i2 + 0.5) * cw, Y = j2 => oy + (j2 + 0.5) * chh; e(a, b, X(i), Y(j), X(i + 1), Y(j)); e(b, cc, X(i + 1), Y(j), X(i + 1), Y(j + 1)); e(cc, d, X(i + 1), Y(j + 1), X(i), Y(j + 1)); e(d, a, X(i), Y(j + 1), X(i), Y(j)); if (pts.length >= 2) { ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.stroke(); } } }
        ctx.fillStyle = U.cssVar('--fg'); ctx.font = '12px Inter'; ctx.fillText(`Isotherms every ${U.f((mx - mn) / 10, 3)} K   ·   blue ${U.f(mn, 4)} °C → red ${U.f(mx, 4)} °C`, ox, oy + ph + 18);
      };
      solve();
    }
  });

  /* ======================= Transient conduction ======================= */
  const _eigC = {};
  const eig = (geo, Bi, n) => { const key = geo + Bi + ':' + n; return _eigC[key] || (_eigC[key] = eig0(geo, Bi, n)); };
  const eig0 = (geo, Bi, n) => { // first n eigenvalues
    const f = geo === 'wall' ? (l => l * Math.sin(l) - Bi * Math.cos(l)) : geo === 'cyl' ? (l => l * U.J(1, l) - Bi * U.J(0, l)) : (l => 1 - l * Math.cos(l) / Math.sin(l) - Bi);
    const out = []; let a = 1e-9, fa = f(a); const step = 0.01;
    for (let x = step; out.length < n && x < 200; x += step) { const fx = f(x); if (isFinite(fa) && isFinite(fx) && fa * fx < 0 && Math.abs(fa - fx) < 50) out.push(U.brent(f, a, x, 1e-13)); a = x; fa = fx; }
    return out;
  };
  const coef = (geo, l) => geo === 'wall' ? 4 * Math.sin(l) / (2 * l + Math.sin(2 * l)) : geo === 'cyl' ? 2 * U.J(1, l) / (l * (U.J(0, l) ** 2 + U.J(1, l) ** 2)) : 4 * (Math.sin(l) - l * Math.cos(l)) / (2 * l - Math.sin(2 * l));
  const shape = (geo, l, xs) => geo === 'wall' ? Math.cos(l * xs) : geo === 'cyl' ? U.J(0, l * xs) : (xs === 0 ? 1 : Math.sin(l * xs) / (l * xs));
  const qfac = (geo, l) => geo === 'wall' ? Math.sin(l) / l : geo === 'cyl' ? 2 * U.J(1, l) / l : 3 * (Math.sin(l) - l * Math.cos(l)) / l ** 3;
  U.transient = (geo, Bi, Fo, xs, nterm = 30) => { const ls = eig(geo, Bi, nterm); let th = 0, th0 = 0, Q = 0; ls.forEach(l => { const C = coef(geo, l), e = Math.exp(-l * l * Fo); th += C * e * shape(geo, l, xs); th0 += C * e; Q += C * e * qfac(geo, l); }); return { th, th0, Q: 1 - Q, l1: ls[0], C1: coef(geo, ls[0]) }; };
  U.eig = eig; U.coefT = coef;
  U.addCalc('transient', {
    title: 'Transient conduction: lumped, exact series (Heisler), semi-infinite', cat: CATT, blurb: 'Bi & Fo, centre/any-point temperature, heat transferred, time to reach a temperature — quenching, cooking, annealing.',
    desc: R`<p><b>Lumped</b> (\(Bi=hL_c/k<0.1\)): \(\dfrac{T-T_\infty}{T_i-T_\infty}=e^{-t/\tau}\), \(\tau=\dfrac{\rho cV}{hA_s}\). <b>Series solution</b> for wall/cylinder/sphere: \(\theta^*=\sum C_n e^{-\lambda_n^2Fo}\,X_n(\lambda_nx^*)\) — this tool sums 30 terms (exact), and also reports the one-term values (\(Fo>0.2\)). <b>Semi-infinite</b>: \(\dfrac{T-T_i}{T_s-T_i}=\text{erfc}\,\dfrac{x}{2\sqrt{\alpha t}}\) and convection/flux variants.</p>`,
    inputs: [{ k: 'mode', l: 'Model', v: 'series', opts: [['lump', 'Lumped capacitance'], ['series', 'Plane wall / cylinder / sphere (exact series)'], ['semi', 'Semi-infinite solid'], ['time', 'Time to reach a centre temperature (series)']] },
    { k: 'geo', l: 'Geometry', v: 'cyl', opts: [['wall', 'Plane wall (half-thickness L)'], ['cyl', 'Long cylinder (radius r₀)'], ['sph', 'Sphere (radius r₀)']] }, { k: 'bc', l: 'Semi-infinite surface condition', v: 'h', opts: [['Ts', 'Sudden surface temperature T<sub>s</sub>'], ['q', 'Constant surface heat flux'], ['h', 'Convection (h, T∞)']] },
    { k: 'mat', l: 'Material', v: '9', opts: matOpts }, { k: 'k', l: 'k', u: 'W/m·K', v: 15 }, { k: 'rho', l: 'ρ', u: 'kg/m³', v: 7900 }, { k: 'c', l: 'c', u: 'J/kg·K', v: 477 },
    { k: 'L', l: 'L or r₀ (lumped: L<sub>c</sub>=V/A)', u: 'mm', v: 25 }, { k: 'h', l: 'h', u: 'W/m²K', v: 500 }, { k: 'Ti', l: 'Initial T<sub>i</sub>', u: '°C', v: 850 }, { k: 'Tinf', l: 'Fluid T<sub>∞</sub> (or T<sub>s</sub>)', u: '°C', v: 30 },
    { k: 't', l: 'Time t', u: 's', v: 300 }, { k: 'x', l: 'Position x (from centre, or depth for semi-inf.)', u: 'mm', v: 0 }, { k: 'q', l: 'Surface heat flux (semi-inf.)', u: 'W/m²', v: 1e4 }, { k: 'Tt', l: 'Target centre T', u: '°C', v: 300 }],
    show: v => ({ geo: v.mode === 'series' || v.mode === 'time', bc: v.mode === 'semi', q: v.mode === 'semi' && v.bc === 'q', Tt: v.mode === 'time' || v.mode === 'lump', t: v.mode !== 'time', x: v.mode !== 'lump' && v.mode !== 'time', k: v.mat === '', rho: v.mat === '', c: v.mat === '' }),
    run(v) {
      const M = v.mat !== '' ? U.SOLIDS[+v.mat] : { k: v.k, rho: v.rho, cp: v.c }; const k = M.k, rho = M.rho, c = M.cp, a = k / (rho * c), L = v.L / 1000;
      const Bi = v.h * L / k, Fo = a * v.t / (L * L), thi = v.Ti - v.Tinf;
      const props = [['α', a, 'm²/s'], ['Bi', Bi, ''], ['Fo', Fo, '']];
      if (v.mode === 'lump') {
        const tau = rho * c * L / v.h, T = v.Tinf + thi * Math.exp(-v.t / tau), tt = -tau * Math.log((v.Tt - v.Tinf) / thi);
        return { out: [['T(t)', T, '°C', 1], ['Time constant τ', tau, 's'], ['Time to reach target', tt, 's', 1], ['Heat transferred Q/V', rho * c * (v.Ti - T), 'J/m³'], ...props, ['Lumped valid?', Bi < 0.1 ? 'yes (Bi < 0.1)' : 'NO — Bi ≥ 0.1, use series model', '']],
          plot(el) { const ts = U.range(0, 5 * tau, 100); U.plot(U.canvas(el, 640, 300), { series: [{ x: ts, y: ts.map(t => v.Tinf + thi * Math.exp(-t / tau)), label: 'T(t)' }], marks: [{ x: v.t, y: T, label: 't' }], xlabel: 't [s]', ylabel: 'T [°C]', title: 'Exponential (Newtonian) cooling' }); } };
      }
      if (v.mode === 'series' || v.mode === 'time') {
        let t = v.t, FoU = Fo;
        if (v.mode === 'time') { const target = (v.Tt - v.Tinf) / thi; if (!(target > 0 && target < 1)) throw new Error('Target must lie between T∞ and Tᵢ'); const F = U.brent(f => U.transient(v.geo, Bi, f, 0).th0 - target, 1e-5, 50); FoU = F; t = F * L * L / a; }
        const xs = Math.min(1, Math.abs(v.x / 1000) / L), r = U.transient(v.geo, Bi, FoU, xs), one = r.C1 * Math.exp(-r.l1 * r.l1 * FoU);
        const T0 = v.Tinf + thi * r.th0, Tx = v.Tinf + thi * r.th, Ts = v.Tinf + thi * U.transient(v.geo, Bi, FoU, 1).th;
        const Vfac = { wall: 2 * L, cyl: Math.PI * L * L, sph: 4 / 3 * Math.PI * L ** 3 }[v.geo];
        return { out: [...(v.mode === 'time' ? [['Time required', t, 's', 1], ['= ', t / 60, 'min']] : []), ['Centre T₀', T0, '°C', 1], ['T at x', Tx, '°C', 1], ['Surface T<sub>s</sub>', Ts, '°C'], ['Q/Q<sub>max</sub>', r.Q, ''], ['Q per unit ' + ({ wall: 'area', cyl: 'length', sph: 'body' })[v.geo], r.Q * rho * c * Vfac * thi, { wall: 'J/m²', cyl: 'J/m', sph: 'J' }[v.geo]], ...props.slice(0, 2), ['Fo', FoU, ''], ['λ₁ , C₁', U.fmt(r.l1, 5) + ' , ' + U.fmt(r.C1, 5), ''], ['One-term θ₀ (valid Fo > 0.2)', one, ''], ['Exact θ₀', r.th0, '']],
          html: R`<p>Characteristic length for Bi here is \(L\) or \(r_0\) (not V/A). \(\theta_0^*=(T_0-T_\infty)/(T_i-T_\infty)=${U.f(r.th0, 4)}\). ${FoU < 0.2 ? 'Fo < 0.2: the one-term approximation would be inaccurate — the exact series is used.' : ''}</p>`,
          plot(el) { const xsx = U.range(0, 1, 41), fos = [0.02, 0.05, 0.1, 0.2, 0.5, 1].map(f => f * Math.max(FoU, 0.2) / 0.2); U.plot(U.canvas(el, 680, 330), { series: [...fos.map(f => ({ x: xsx.map(x => x * L * 1000), y: xsx.map(x => v.Tinf + thi * U.transient(v.geo, Bi, f, x, 20).th), label: 't = ' + U.f(f * L * L / a, 3) + ' s', width: 1.6 })), { x: xsx.map(x => x * L * 1000), y: xsx.map(x => v.Tinf + thi * U.transient(v.geo, Bi, FoU, x, 20).th), label: 'your t', width: 3, color: U.cssVar('--fg') }], xlabel: 'distance from centre [mm]', ylabel: 'T [°C]', title: 'Temperature profiles at successive times' }); } };
      }
      // semi-infinite
      const x = v.x / 1000, t = v.t, eta = x / (2 * Math.sqrt(a * t)); let T, qs;
      if (v.bc === 'Ts') { T = v.Tinf + (v.Ti - v.Tinf) * U.erf(eta); qs = k * (v.Tinf - v.Ti) / Math.sqrt(Math.PI * a * t); }
      else if (v.bc === 'q') { T = v.Ti + 2 * v.q * Math.sqrt(a * t / Math.PI) / k * Math.exp(-eta * eta) - v.q * x / k * U.erfc(eta); qs = v.q; }
      else { const b = v.h * Math.sqrt(a * t) / k; const th = U.erfc(eta) - Math.exp(v.h * x / k + b * b - (eta + b) ** 2) * U.erfcx(eta + b); T = v.Ti + (v.Tinf - v.Ti) * th; const ths = 1 - U.erfcx(b); qs = v.h * (v.Tinf - (v.Ti + (v.Tinf - v.Ti) * ths)); }
      const pen = 4 * Math.sqrt(a * t);
      return { out: [['T(x, t)', T, '°C', 1], ['Surface heat flux (into solid)', qs, 'W/m²'], ['Similarity variable η = x/2√(αt)', eta, ''], ['Thermal penetration depth ≈ 4√(αt)', pen * 1000, 'mm'], ['α', a, 'm²/s']],
        html: '<p>A finite body behaves as semi-infinite while the penetration depth is smaller than its thickness — e.g. the first seconds of a quench, or soil under a daily temperature wave.</p>' };
    }
  });

  /* ======================= Contact temperature ======================= */
  U.addCalc('contactT', {
    title: 'Interface temperature of two semi-infinite bodies in contact', cat: CATT, blurb: 'Why metal feels colder than wood at the same temperature.',
    desc: R`<p>\(T_s=\dfrac{\sqrt{(k\rho c)_A}\,T_A+\sqrt{(k\rho c)_B}\,T_B}{\sqrt{(k\rho c)_A}+\sqrt{(k\rho c)_B}}\) — the contact temperature depends on thermal effusivity \(e=\sqrt{k\rho c}\).</p>`,
    inputs: [{ k: 'A', l: 'Body A', v: '3', opts: matOpts.slice(1) }, { k: 'TA', l: 'T<sub>A</sub>', u: '°C', v: 20 }, { k: 'B', l: 'Body B (default: approx. human skin k=0.37, ρ=1000, c=3600)', v: 'skin', opts: [['skin', 'Human skin (approx.)'], ...matOpts.slice(1)] }, { k: 'TB', l: 'T<sub>B</sub>', u: '°C', v: 34 }],
    run(v) { const e = m => m === 'skin' ? Math.sqrt(0.37 * 1000 * 3600) : Math.sqrt(U.SOLIDS[+m].k * U.SOLIDS[+m].rho * U.SOLIDS[+m].cp); const eA = e(v.A), eB = e(v.B); return { out: [['Contact temperature', (eA * v.TA + eB * v.TB) / (eA + eB), '°C', 1], ['Effusivity A', eA, 'W·s½/m²K'], ['Effusivity B', eB, 'W·s½/m²K']] }; }
  });
})();
