/* Heat transfer: convection, boiling/condensation, heat exchangers, radiation */
'use strict';
(() => {
  const { h } = U; const K = 273.15, g = 9.81, SIG = 5.670374e-8;
  const CATC = 'Heat transfer — convection', CATB = 'Heat transfer — boiling & condensation', CATX = 'Heat transfer — heat exchangers', CATR = 'Heat transfer — radiation';
  const fluidOpts = Object.entries(U.TR_NAMES);
  const P = async (f, TC) => { await U.TR.load(); return U.TR.get(f, TC + K); };
  const propLine = (p, T, lab) => R`<p class="small muted">Properties of ${p.name} at ${lab || 'T'} = ${U.f(T, 4)} °C: \(\rho=${U.f(p.rho, 4)}\) kg/m³, \(c_p=${U.f(p.cp, 4)}\) J/kg·K, \(k=${U.f(p.k, 4)}\) W/m·K, \(\nu=${U.f(p.nu, 4)}\) m²/s, \(Pr=${U.f(p.Pr, 4)}\).</p>`;
  U.propLine = propLine;

  /* ======================= External forced convection ======================= */
  U.addCalc('extconv', {
    title: 'External forced convection: flat plate, cylinder, sphere, tube bank', cat: CATC, blurb: 'Automatic property evaluation; laminar, turbulent & mixed BLs; Churchill–Bernstein, Hilpert, Whitaker, Žukauskas.',
    desc: R`<p>Flat plate (film T): laminar \(\overline{Nu}=0.664Re_L^{1/2}Pr^{1/3}\); mixed \(\overline{Nu}=(0.037Re_L^{4/5}-A)Pr^{1/3}\), \(A=0.037Re_{cr}^{4/5}-0.664Re_{cr}^{1/2}\). Cylinder: \(\overline{Nu}=0.3+\dfrac{0.62Re^{1/2}Pr^{1/3}}{[1+(0.4/Pr)^{2/3}]^{1/4}}\left[1+\left(\dfrac{Re}{282000}\right)^{5/8}\right]^{4/5}\). Sphere (Whitaker, props at \(T_\infty\)): \(\overline{Nu}=2+(0.4Re^{1/2}+0.06Re^{2/3})Pr^{0.4}(\mu/\mu_s)^{1/4}\). Tube bank: \(\overline{Nu}=C\,Re_{max}^mPr^{0.36}(Pr/Pr_s)^{1/4}\cdot C_2\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'plate', opts: [['plate', 'Flat plate (parallel flow)'], ['cyl', 'Cylinder in cross-flow'], ['sph', 'Sphere'], ['bank', 'Tube bank (cross-flow)']] }, { k: 'fl', l: 'Fluid', v: 'air', opts: fluidOpts },
    { k: 'V', l: 'Free-stream velocity V', u: 'm/s', v: 10 }, { k: 'Tinf', l: 'Fluid T<sub>∞</sub> (tube bank: inlet)', u: '°C', v: 25 }, { k: 'Ts', l: 'Surface T<sub>s</sub>', u: '°C', v: 80 },
    { k: 'L', l: 'Plate length L / diameter D', u: 'm', v: 0.5 }, { k: 'W', l: 'Plate width (heat rate) / cylinder length', u: 'm', v: 1 }, { k: 'Recr', l: 'Critical Re (plate)', v: 5e5 }, { k: 'bc', l: 'Plate thermal condition', v: 'T', opts: [['T', 'Uniform surface temperature'], ['q', 'Uniform heat flux']] },
    { k: 'arr', l: 'Tube arrangement', v: 'stag', opts: [['inl', 'In-line (aligned)'], ['stag', 'Staggered']] }, { k: 'ST', l: 'Transverse pitch S<sub>T</sub>', u: 'm', v: 0.05 }, { k: 'SL', l: 'Longitudinal pitch S<sub>L</sub>', u: 'm', v: 0.05 }, { k: 'NL', l: 'Rows in flow direction N<sub>L</sub>', v: 10 }, { k: 'NT', l: 'Tubes per row N<sub>T</sub>', v: 10 }],
    show: v => ({ Recr: v.geo === 'plate', bc: v.geo === 'plate', arr: v.geo === 'bank', ST: v.geo === 'bank', SL: v.geo === 'bank', NL: v.geo === 'bank', NT: v.geo === 'bank', W: v.geo !== 'sph' }),
    async run(v) {
      const L = v.L; const TfC = (v.Tinf + v.Ts) / 2;
      if (v.geo === 'plate') {
        const p = await P(v.fl, TfC), Re = v.V * L / p.nu, Pr = p.Pr, Rc = Math.min(v.Recr, Re);
        let Nu, Cf, regime; const q = v.bc === 'q';
        if (Re <= v.Recr) { Nu = (q ? 0.680 : 0.664) * Math.sqrt(Re) * Math.cbrt(Pr); Cf = 1.328 / Math.sqrt(Re); regime = 'laminar'; }
        else { const A = 0.037 * Math.pow(Rc, 0.8) - 0.664 * Math.sqrt(Rc); Nu = (0.037 * Math.pow(Re, 0.8) - A) * Math.cbrt(Pr); Cf = 0.074 * Math.pow(Re, -0.2) - (0.074 * Math.pow(Rc, -0.2) - 1.328 / Math.sqrt(Rc)) * Rc / Re; regime = 'mixed laminar–turbulent'; }
        const hh = Nu * p.k / L, Q = hh * L * v.W * (v.Ts - v.Tinf), xcr = v.Recr * p.nu / v.V;
        const dl = 5 * L / Math.sqrt(Re), dt = 0.37 * L * Math.pow(Re, -0.2);
        return { out: [['Average h', hh, 'W/m²K', 1], ['Heat rate Q', Q, 'W', 1], ['Re<sub>L</sub>', Re, ''], ['Regime', regime, ''], ['Nu<sub>L</sub>', Nu, ''], ['Transition at x<sub>cr</sub>', xcr < L ? xcr : 'beyond plate', 'm'], ['Friction coefficient C<sub>f</sub>', Cf, ''], ['Drag force (one side)', Cf * 0.5 * p.rho * v.V * v.V * L * v.W, 'N'], ['BL thickness at L', (Re < v.Recr ? dl : dt) * 1000, 'mm'], ['Thermal BL δ<sub>t</sub> ≈ δ/Pr<sup>1/3</sup> (laminar)', Re < v.Recr ? dl / Math.cbrt(Pr) * 1000 : '—', 'mm']],
          html: propLine(p, TfC, 'film temperature T<sub>f</sub>') + R`<p>Reynolds analogy check: \(St\,Pr^{2/3}=${U.f(Nu / (Re * Pr) * Math.pow(Pr, 2 / 3), 4)}\) vs \(C_f/2=${U.f(Cf / 2, 4)}\).</p>`,
          plot(el) { const xs = U.range(L / 200, L, 200); U.plot(U.canvas(el, 640, 300), { series: [{ x: xs, y: xs.map(x => { const Rx = v.V * x / p.nu; return (Rx < v.Recr ? (q ? 0.453 : 0.332) * Math.sqrt(Rx) : (q ? 0.0308 : 0.0296) * Math.pow(Rx, 0.8)) * Math.cbrt(Pr) * p.k / x; }), label: 'local h_x' }], xlabel: 'x [m]', ylabel: 'h_x [W/m²K]', title: 'Local heat-transfer coefficient (jump at transition)' }); } };
      }
      if (v.geo === 'cyl') {
        const p = await P(v.fl, TfC), Re = v.V * L / p.nu, Pr = p.Pr;
        const Nu = 0.3 + 0.62 * Math.sqrt(Re) * Math.cbrt(Pr) / Math.pow(1 + Math.pow(0.4 / Pr, 2 / 3), 0.25) * Math.pow(1 + Math.pow(Re / 282000, 5 / 8), 0.8);
        const H = [[0.4, 4, 0.989, 0.330], [4, 40, 0.911, 0.385], [40, 4000, 0.683, 0.466], [4000, 40000, 0.193, 0.618], [40000, 400000, 0.027, 0.805]].find(r => Re >= r[0] && Re < r[1]);
        const NuH = H ? H[2] * Math.pow(Re, H[3]) * Math.cbrt(Pr) : NaN, hh = Nu * p.k / L;
        return { out: [['Average h (Churchill–Bernstein)', hh, 'W/m²K', 1], ['Heat rate Q', hh * Math.PI * L * v.W * (v.Ts - v.Tinf), 'W', 1], ['Re<sub>D</sub>', Re, ''], ['Nu (Churchill–Bernstein)', Nu, ''], ['Nu (Hilpert)', NuH, ''], ['Vortex shedding f ≈ 0.2V/D (Re 300–2×10⁵)', 0.2 * v.V / L, 'Hz']], html: propLine(p, TfC, 'film temperature') };
      }
      if (v.geo === 'sph') {
        const p = await P(v.fl, v.Tinf), ps = await P(v.fl, v.Ts), Re = v.V * L / p.nu, Pr = p.Pr, mu = p.mu, mus = ps.mu;
        const Nu = 2 + (0.4 * Math.sqrt(Re) + 0.06 * Math.pow(Re, 2 / 3)) * Math.pow(Pr, 0.4) * Math.pow(mu / mus, 0.25), hh = Nu * p.k / L;
        const CD = Re < 1 ? 24 / Re : 24 / Re * (1 + 0.15 * Math.pow(Re, 0.687)) + 0.42 / (1 + 42500 / Math.pow(Re, 1.16));
        return { out: [['Average h', hh, 'W/m²K', 1], ['Heat rate Q', hh * Math.PI * L * L * (v.Ts - v.Tinf), 'W', 1], ['Re<sub>D</sub>', Re, ''], ['Nu (Whitaker)', Nu, ''], ['Ranz–Marshall Nu = 2+0.6Re½Pr⅓', 2 + 0.6 * Math.sqrt(Re) * Math.cbrt(Pr), ''], ['Drag coefficient (Clift–Gauvin)', CD, '']], html: propLine(p, v.Tinf, 'T<sub>∞</sub>') };
      }
      // tube bank
      const p = await P(v.fl, v.Tinf), ps = await P(v.fl, v.Ts), D = L, ST = v.ST, SL = v.SL;
      const SD = Math.sqrt(SL * SL + (ST / 2) ** 2); const Vmax = v.arr === 'inl' ? ST / (ST - D) * v.V : (SD < (ST + D) / 2 ? ST / (2 * (SD - D)) * v.V : ST / (ST - D) * v.V);
      const Re = Vmax * D / p.nu, Pr = p.Pr, Prs = ps.Pr;
      const tab = v.arr === 'inl' ? [[0, 100, 0.9, 0.4], [100, 1000, 0.52, 0.5], [1000, 2e5, 0.27, 0.63], [2e5, 2e6, 0.033, 0.8]] : [[0, 500, 1.04, 0.4], [500, 1000, 0.71, 0.5], [1000, 2e5, 0.35 * Math.pow(ST / SL, 0.2), 0.6], [2e5, 2e6, 0.031 * Math.pow(ST / SL, 0.2), 0.8]];
      const row = tab.find(r => Re >= r[0] && Re < r[1]) || tab[tab.length - 1];
      const NLc = [1, 2, 3, 4, 5, 7, 10, 13, 16], C2s = v.arr === 'inl' ? [0.70, 0.80, 0.86, 0.90, 0.93, 0.96, 0.98, 0.99, 1] : [0.64, 0.76, 0.84, 0.89, 0.93, 0.96, 0.98, 0.99, 1];
      const C2 = v.NL >= 16 ? 1 : U.interp(NLc, C2s, v.NL);
      const Nu = row[2] * Math.pow(Re, row[3]) * Math.pow(Pr, 0.36) * Math.pow(Pr / Prs, 0.25) * C2, hh = Nu * p.k / D;
      const N = v.NL * v.NT, Te = v.Ts - (v.Ts - v.Tinf) * Math.exp(-Math.PI * D * N * hh / (p.rho * v.V * v.NT * ST * p.cp));
      const dTlm = ((v.Ts - v.Tinf) - (v.Ts - Te)) / Math.log((v.Ts - v.Tinf) / (v.Ts - Te)); const Q = hh * N * Math.PI * D * v.W * dTlm;
      return { out: [['Average h', hh, 'W/m²K', 1], ['Outlet fluid T<sub>e</sub>', Te, '°C', 1], ['Heat rate Q', Q, 'W', 1], ['V<sub>max</sub>', Vmax, 'm/s'], ['Re<sub>max</sub>', Re, ''], ['Nu', Nu, ''], ['Row-number correction C₂', C2, ''], ['ΔT<sub>lm</sub>', dTlm, 'K']], html: propLine(p, v.Tinf, 'inlet T') + '<p class="small muted">Žukauskas correlation constants per Çengel Table 7-2; refine by re-evaluating properties at the mean of inlet and outlet temperatures.</p>' };
    }
  });

  /* ======================= Internal forced convection ======================= */
  const RECT = [[1, 2.98, 3.61, 56.92], [2, 3.39, 4.12, 62.2], [3, 3.96, 4.79, 68.36], [4, 4.44, 5.33, 72.92], [6, 5.14, 6.05, 78.8], [8, 5.6, 6.49, 82.32], [1e9, 7.54, 8.23, 96]];
  U.friction = (Re, rel = 0) => { if (Re < 2300) return 64 / Re; let f = 0.02; for (let i = 0; i < 50; i++) f = Math.pow(-2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2); return f; };
  U.addCalc('intconv', {
    title: 'Internal flow in pipes & ducts (laminar/turbulent, entry effects, ΔP)', cat: CATC, blurb: 'Outlet temperature, h, heat rate, LMTD, friction factor (Colebrook), pressure drop and pumping power.',
    desc: R`<p>\(Re=\dfrac{4\dot m}{\pi D\mu}\). Fully developed laminar: \(Nu=3.66\) (const \(T_s\)), \(4.36\) (const \(q''\)); thermal entry (Hausen) \(Nu=3.66+\dfrac{0.065(D/L)RePr}{1+0.04[(D/L)RePr]^{2/3}}\). Turbulent (Gnielinski): \(Nu=\dfrac{(f/8)(Re-1000)Pr}{1+12.7\sqrt{f/8}(Pr^{2/3}-1)}\). Constant \(T_s\): \(T_e=T_s-(T_s-T_i)e^{-hA_s/\dot mc_p}\). \(\Delta P=f\dfrac{L}{D}\dfrac{\rho V^2}{2}\).</p>`,
    inputs: [{ k: 'fl', l: 'Fluid', v: 'water', opts: fluidOpts }, { k: 'sec', l: 'Cross-section', v: 'circ', opts: [['circ', 'Circular tube'], ['rect', 'Rectangular duct'], ['ann', 'Concentric annulus']] }, { k: 'D', l: 'Diameter D (rect: side a; annulus: outer D<sub>o</sub>)', u: 'mm', v: 25 }, { k: 'b', l: 'Rect side b / annulus inner D<sub>i</sub>', u: 'mm', v: 10 },
    { k: 'L', l: 'Length L', u: 'm', v: 5 }, { k: 'm', l: 'Mass flow ṁ', u: 'kg/s', v: 0.1 }, { k: 'Ti', l: 'Inlet T<sub>i</sub>', u: '°C', v: 20 }, { k: 'bc', l: 'Wall condition', v: 'T', opts: [['T', 'Constant surface temperature'], ['q', 'Constant heat flux']] }, { k: 'Ts', l: 'Surface T<sub>s</sub> or flux q″', u: '°C or W/m²', v: 80 },
    { k: 'eps', l: 'Wall roughness ε', u: 'mm', v: 0.0015 }, { k: 'corr', l: 'Turbulent correlation', v: 'gn', opts: [['gn', 'Gnielinski'], ['db', 'Dittus–Boelter'], ['st', 'Sieder–Tate']] }],
    show: v => ({ b: v.sec !== 'circ' }),
    async run(v) {
      await U.TR.load(); const D0 = v.D / 1000, b = v.b / 1000;
      let Ac, Pw, Dh, ar = 1;
      if (v.sec === 'circ') { Ac = Math.PI * D0 * D0 / 4; Pw = Math.PI * D0; } else if (v.sec === 'rect') { Ac = D0 * b; Pw = 2 * (D0 + b); ar = Math.max(D0, b) / Math.min(D0, b); } else { Ac = Math.PI * (D0 * D0 - b * b) / 4; Pw = Math.PI * D0; }
      Dh = v.sec === 'ann' ? D0 - b : 4 * Ac / Pw;
      let Tm = v.Ti + 10, res;
      for (let it = 0; it < 30; it++) {
        const p = U.TR.get(v.fl, Tm + K), Re = v.m * Dh / (Ac * p.mu), Pr = p.Pr, Vel = v.m / (p.rho * Ac);
        const f = Re < 2300 ? (v.sec === 'rect' ? U.interp(RECT.map(r => r[0]), RECT.map(r => r[3]), ar) / Re : 64 / Re) : U.friction(Re, v.eps / 1000 / Dh);
        let Nu, how;
        if (Re < 2300) {
          const base = v.sec === 'rect' ? U.interp(RECT.map(r => r[0]), RECT.map(r => v.bc === 'T' ? r[1] : r[2]), ar) : (v.bc === 'T' ? 3.66 : 4.36);
          const Gz = Dh / v.L * Re * Pr; Nu = v.bc === 'T' && v.sec === 'circ' ? 3.66 + 0.065 * Gz / (1 + 0.04 * Math.pow(Gz, 2 / 3)) : base; how = v.bc === 'T' && v.sec === 'circ' ? 'laminar, Hausen (developing thermal)' : 'laminar, fully developed';
        } else {
          const fs = Math.pow(0.790 * Math.log(Re) - 1.64, -2);
          if (v.corr === 'db') { Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, v.bc === 'T' ? (v.Ts > Tm ? 0.4 : 0.3) : 0.4); how = 'Dittus–Boelter'; }
          else if (v.corr === 'st') { const ps = U.TR.get(v.fl, (v.bc === 'T' ? v.Ts : Tm) + K); Nu = 0.027 * Math.pow(Re, 0.8) * Math.cbrt(Pr) * Math.pow(p.mu / ps.mu, 0.14); how = 'Sieder–Tate'; }
          else { const ff = v.eps > 0 ? f : fs; Nu = (ff / 8) * (Re - 1000) * Pr / (1 + 12.7 * Math.sqrt(ff / 8) * (Math.pow(Pr, 2 / 3) - 1)); how = 'Gnielinski'; }
          if (Re < 10000) how += ' (transitional — uncertainty ±25%)';
        }
        const hh = Nu * p.k / Dh, As = Pw * v.L; let Te, Q, Tse = null, dTlm = null;
        if (v.bc === 'T') { Te = v.Ts - (v.Ts - v.Ti) * Math.exp(-hh * As / (v.m * p.cp)); Q = v.m * p.cp * (Te - v.Ti); dTlm = (Te - v.Ti) / Math.log((v.Ts - v.Ti) / (v.Ts - Te)); }
        else { Q = v.Ts * As; Te = v.Ti + Q / (v.m * p.cp); Tse = Te + v.Ts / hh; }
        res = { p, Re, Pr, Vel, f, Nu, how, hh, Te, Q, Tse, dTlm, As };
        const Tn = (v.Ti + Te) / 2; if (Math.abs(Tn - Tm) < 0.01) break; Tm = Tn;
      }
      const r = res, dP = r.f * v.L / Dh * r.p.rho * r.Vel * r.Vel / 2;
      return {
        out: [['Outlet T<sub>e</sub>', r.Te, '°C', 1], ['Heat rate Q', r.Q, 'W', 1], ['h', r.hh, 'W/m²K', 1], ['Re', r.Re, ''], ['Correlation', r.how, ''], ['Nu', r.Nu, ''], ['Mean velocity', r.Vel, 'm/s'], ['Hydraulic diameter', Dh * 1000, 'mm'], ['Friction factor f', r.f, ''], ['Pressure drop ΔP', dP, 'Pa', 1], ['Pumping power', dP * v.m / r.p.rho, 'W'], ['ΔT<sub>lm</sub>', r.dTlm ?? '—', 'K'], ['Max wall T (const q″, at exit)', r.Tse ?? '—', '°C'], ['Hydrodynamic entry length', (r.Re < 2300 ? 0.05 * r.Re * Dh : 10 * Dh), 'm'], ['Thermal entry length', (r.Re < 2300 ? 0.05 * r.Re * r.Pr * Dh : 10 * Dh), 'm']],
        html: propLine(r.p, (v.Ti + r.Te) / 2, 'bulk mean temperature (iterated)')
      };
    }
  });

  /* ======================= Natural convection ======================= */
  U.addCalc('natconv', {
    title: 'Natural (free) convection: plates, cylinders, spheres, enclosures', cat: CATC, blurb: 'Rayleigh number, Churchill–Chu correlations, horizontal plates, rectangular enclosures, mixed-convection check.',
    desc: R`<p>\(Ra_L=Gr_LPr=\dfrac{g\beta(T_s-T_\infty)L^3}{\nu\alpha}\). Vertical plate (Churchill–Chu, all Ra): \(\overline{Nu}=\left\{0.825+\dfrac{0.387Ra^{1/6}}{[1+(0.492/Pr)^{9/16}]^{8/27}}\right\}^2\). Horizontal cylinder: \(\left\{0.60+\dfrac{0.387Ra_D^{1/6}}{[1+(0.559/Pr)^{9/16}]^{8/27}}\right\}^2\). Sphere: \(2+\dfrac{0.589Ra_D^{1/4}}{[1+(0.469/Pr)^{9/16}]^{4/9}}\).</p>`,
    inputs: [{ k: 'geo', l: 'Configuration', v: 'vplate', opts: [['vplate', 'Vertical plate / vertical cylinder (height L)'], ['hup', 'Horizontal plate: hot surface facing up (or cold facing down)'], ['hdown', 'Horizontal plate: hot surface facing down (or cold facing up)'], ['hcyl', 'Horizontal cylinder (diameter D)'], ['sph', 'Sphere (diameter D)'], ['venc', 'Vertical rectangular enclosure (gap L, height H)'], ['henc', 'Horizontal enclosure heated from below (gap L)']] },
    { k: 'fl', l: 'Fluid', v: 'air', opts: fluidOpts }, { k: 'Ts', l: 'Hot surface T<sub>s</sub> (enclosure: T₁)', u: '°C', v: 60 }, { k: 'Tinf', l: 'Ambient T<sub>∞</sub> (enclosure: T₂)', u: '°C', v: 20 },
    { k: 'L', l: 'L (height / D / gap)', u: 'm', v: 0.5 }, { k: 'W', l: 'Width / length (for heat rate); horiz. plate: other side', u: 'm', v: 0.5 }, { k: 'H', l: 'Enclosure height H', u: 'm', v: 0.5 }, { k: 'V', l: 'Any forced velocity present (mixed-convection check)', u: 'm/s', v: 0 }],
    show: v => ({ H: v.geo === 'venc' }),
    async run(v) {
      const Tf = (v.Ts + v.Tinf) / 2, p = await P(v.fl, Tf), dT = Math.abs(v.Ts - v.Tinf), Pr = p.Pr;
      let Lc = v.L, A, note = '';
      if (v.geo === 'hup' || v.geo === 'hdown') { A = v.L * v.W; Lc = A / (2 * (v.L + v.W)); note = 'Characteristic length L<sub>c</sub> = A<sub>s</sub>/P = ' + U.fmt(Lc, 4) + ' m. '; }
      const beta = p.beta, Ra = g * beta * dT * Lc ** 3 / (p.nu * p.alpha), Gr = Ra / Pr;
      let Nu, As;
      switch (v.geo) {
        case 'vplate': Nu = Math.pow(0.825 + 0.387 * Math.pow(Ra, 1 / 6) / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 8 / 27), 2); As = v.L * v.W; break;
        case 'hup': Nu = Ra < 1e7 ? 0.54 * Math.pow(Ra, 0.25) : 0.15 * Math.cbrt(Ra); As = A; break;
        case 'hdown': Nu = 0.27 * Math.pow(Ra, 0.25); As = A; break;
        case 'hcyl': Nu = Math.pow(0.60 + 0.387 * Math.pow(Ra, 1 / 6) / Math.pow(1 + Math.pow(0.559 / Pr, 9 / 16), 8 / 27), 2); As = Math.PI * v.L * v.W; break;
        case 'sph': Nu = 2 + 0.589 * Math.pow(Ra, 0.25) / Math.pow(1 + Math.pow(0.469 / Pr, 9 / 16), 4 / 9); As = Math.PI * v.L * v.L; break;
        case 'venc': { const HL = v.H / v.L; Nu = Ra < 1e3 ? 1 : HL < 2 ? 0.18 * Math.pow(Pr / (0.2 + Pr) * Ra, 0.29) : HL <= 10 ? 0.22 * Math.pow(Pr / (0.2 + Pr) * Ra, 0.28) * Math.pow(HL, -0.25) : 0.42 * Math.pow(Ra, 0.25) * Math.pow(Pr, 0.012) * Math.pow(HL, -0.3); Nu = Math.max(1, Nu); As = v.H * v.W; note = 'Enclosure: q = Nu·k·A·(T₁−T₂)/L (Nu = k<sub>eff</sub>/k). '; break; }
        case 'henc': Nu = Ra < 1708 ? 1 : 0.069 * Math.cbrt(Ra) * Math.pow(Pr, 0.074); As = v.W * v.W; note = Ra < 1708 ? 'Ra < 1708: no convection cells — pure conduction. ' : 'Bénard cells present. '; break;
      }
      const hh = Nu * p.k / Lc, Q = hh * As * (v.Ts - v.Tinf);
      const Re = v.V * Lc / p.nu, ratio = v.V > 0 ? Gr / (Re * Re) : Infinity;
      return { out: [['h', hh, 'W/m²K', 1], ['Heat rate Q', Q, 'W', 1], ['Ra', Ra, ''], ['Gr', Gr, ''], ['Nu', Nu, ''], ['Flow regime (vertical plate)', v.geo === 'vplate' ? (Ra < 1e9 ? 'laminar' : 'turbulent') : '—', ''], ['Gr/Re² (mixed convection)', v.V > 0 ? ratio : '—', ''], ['Interpretation', v.V > 0 ? (ratio < 0.1 ? 'forced convection dominates' : ratio > 10 ? 'natural convection dominates' : 'MIXED convection — both matter') : 'pure natural convection', '']],
        html: '<p class="small">' + note + '</p>' + propLine(p, Tf, 'film temperature') + R`<p class="small muted">\(\beta=${U.f(beta, 4)}\) 1/K ${['air', 'n2', 'o2', 'co2', 'h2', 'he', 'steam'].includes(v.fl) ? '(ideal gas: β = 1/T<sub>f</sub>)' : ''}.</p>` };
    }
  });

  /* ======================= Boiling ======================= */
  const CSF = [['Water–copper (polished)', 0.013], ['Water–copper (scored)', 0.0068], ['Water–stainless steel (mech. polished)', 0.013], ['Water–stainless steel (ground & polished)', 0.006], ['Water–stainless steel (Teflon pitted)', 0.0058], ['Water–stainless steel (chemically etched)', 0.013], ['Water–brass', 0.006], ['Water–nickel', 0.006], ['Water–platinum', 0.013]];
  U.addCalc('boil', {
    title: 'Pool boiling: nucleate (Rohsenow), critical & minimum heat flux, film boiling', cat: CATB, blurb: 'Full boiling curve for water at any saturation pressure; burnout warning.',
    desc: R`<p>Nucleate: \(\dot q''=\mu_lh_{fg}\left[\dfrac{g(\rho_l-\rho_v)}{\sigma}\right]^{1/2}\left[\dfrac{c_{p,l}\Delta T_e}{C_{sf}h_{fg}Pr_l^n}\right]^3\). CHF (Zuber–Kutateladze): \(\dot q''_{max}=C_{cr}h_{fg}\rho_v\left[\dfrac{\sigma g(\rho_l-\rho_v)}{\rho_v^2}\right]^{1/4}\), \(C_{cr}=0.149\) (large heater). Minimum (Leidenfrost): \(\dot q''_{min}=0.09\rho_vh_{fg}\left[\dfrac{\sigma g(\rho_l-\rho_v)}{(\rho_l+\rho_v)^2}\right]^{1/4}\). Film boiling, horizontal cylinder: \(h=0.62\left[\dfrac{k_v^3\rho_v(\rho_l-\rho_v)g(h_{fg}+0.4c_{p,v}\Delta T_e)}{\mu_vD\Delta T_e}\right]^{1/4}\).</p>`,
    inputs: [{ k: 'Tsat', l: 'Saturation temperature', u: '°C', v: 100 }, { k: 'Ts', l: 'Heater surface temperature', u: '°C', v: 110 }, { k: 'csf', l: 'Surface–fluid combination', v: '0', opts: CSF.map((c, i) => [i, c[0] + ' (C_sf=' + c[1] + ')']) }, { k: 'A', l: 'Heater area', u: 'm²', v: 0.01 }, { k: 'D', l: 'Heater diameter (film boiling)', u: 'mm', v: 5 }, { k: 'eps', l: 'Heater emissivity (film boiling radiation)', v: 0.8 }],
    async run(v) {
      await U.TR.load(); const s = U.TR.watersat(v.Tsat + K), hfg = s.hfg * 1e3, dTe = v.Ts - v.Tsat, Csf = CSF[+v.csf][1];
      const rhol = s.rhol, rhov = s.rhov, sig = s.sigma;
      const qn = dT => s.mul * hfg * Math.sqrt(g * (rhol - rhov) / sig) * Math.pow(s.cpl * dT / (Csf * hfg * s.Prl), 3);
      const qmax = 0.149 * hfg * rhov * Math.pow(sig * g * (rhol - rhov) / (rhov * rhov), 0.25), qmin = 0.09 * rhov * hfg * Math.pow(sig * g * (rhol - rhov) / ((rhol + rhov) ** 2), 0.25);
      const D = v.D / 1000;
      const qfilm = dT => { const hf = 0.62 * Math.pow(s.kv ** 3 * rhov * (rhol - rhov) * g * (hfg + 0.4 * s.cpv * dT) / (s.muv * D * dT), 0.25); const Tw = v.Tsat + dT + K, Tv = v.Tsat + K; const hr = v.eps * SIG * (Tw ** 4 - Tv ** 4) / dT; return (hf + 0.75 * hr) * dT; };
      let q, regime;
      if (dTe <= 0) throw new Error('Surface must be hotter than T_sat');
      if (dTe < 5) { q = qn(dTe); regime = 'natural convection / onset of nucleate boiling (ΔTe < 5 K) — Rohsenow shown'; }
      else { q = qn(dTe); regime = 'nucleate boiling'; }
      const dTcr = Math.cbrt(qmax / qn(1));
      if (q > qmax) { q = qfilm(dTe); regime = dTe > 120 ? 'film boiling' : 'transition / film boiling (beyond CHF — burnout risk)'; }
      return {
        out: [['Heat flux q″', q, 'W/m²', 1], ['Regime', regime, ''], ['Heat rate', q * v.A, 'W', 1], ['h = q″/ΔT<sub>e</sub>', q / dTe, 'W/m²K'], ['Critical heat flux q″<sub>max</sub>', qmax, 'W/m²', 1], ['Excess T at CHF (Rohsenow)', dTcr, 'K'], ['Minimum heat flux q″<sub>min</sub>', qmin, 'W/m²'], ['Film-boiling q″ at this ΔT<sub>e</sub>', qfilm(dTe), 'W/m²'], ['P<sub>sat</sub>', s.P / 1e3, 'kPa']],
        html: '<p class="small muted">Saturated water properties at T<sub>sat</sub> from IAPWS data. Rohsenow scatter is about ±100 % in q″ (±25 % in ΔT). In a heat-flux-controlled heater (electric), exceeding q″<sub>max</sub> causes a jump to film boiling at ~1000 °C → burnout.</p>',
        plot(el) { const ts = []; for (let t = 1; t <= 1200; t *= 1.06) ts.push(t); const nb = ts.map(t => t < dTcr ? qn(t) : NaN), fb = ts.map(t => { const qf = qfilm(t); return qf > qmin ? qf : NaN; }), nc = ts.map(t => t < 6 ? 1.31 * Math.pow(t, 4 / 3) * t : NaN);
          U.plot(U.canvas(el, 680, 360), { series: [{ x: ts, y: nb, label: 'nucleate (Rohsenow)' }, { x: ts, y: fb, label: 'film boiling', color: U.cssVar('--cool') }, { x: [dTcr, dTcr * 4], y: [qmax, qmin], label: 'transition (schematic)', dash: [6, 4], color: U.cssVar('--muted') }, { x: [1, 1200], y: [qmax, qmax], dash: [2, 3], label: 'q″max', color: U.cssVar('--red') }], marks: [{ x: dTe, y: q, label: 'operating point' }], logx: true, logy: true, xlabel: 'Excess temperature ΔTe = Ts − Tsat [K]', ylabel: 'q″ [W/m²]', title: 'Boiling curve (water)', ylim: [1e3, 1e7] }); }
      };
    }
  });

  /* ======================= Condensation ======================= */
  U.addCalc('cond', {
    title: 'Film condensation: vertical plates, horizontal tubes, tube banks', cat: CATB, blurb: 'Nusselt theory with laminar, wavy-laminar and turbulent film correlations; condensation rate.',
    desc: R`<p>Modified latent heat \(h^*_{fg}=h_{fg}+0.68c_{p,l}(T_{sat}-T_s)\). Vertical plate laminar (Nusselt): \(h=0.943\left[\dfrac{g\rho_l(\rho_l-\rho_v)k_l^3h^*_{fg}}{\mu_l(T_{sat}-T_s)L}\right]^{1/4}\); wavy/turbulent films via film Reynolds number (Kutateladze/Labuntsov forms). Horizontal tube: constant 0.729 with D in place of L; N tubes in a vertical tier: \(h_N=h_1N^{-1/4}\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'vert', opts: [['vert', 'Vertical plate / tube (height L)'], ['htube', 'Horizontal tube (diameter D)'], ['bank', 'Vertical tier of N horizontal tubes']] }, { k: 'Tsat', l: 'Steam saturation T', u: '°C', v: 100 }, { k: 'Ts', l: 'Wall T', u: '°C', v: 80 }, { k: 'L', l: 'Height L or diameter D', u: 'm', v: 1 }, { k: 'W', l: 'Width (plate) or tube length', u: 'm', v: 1 }, { k: 'N', l: 'Tubes in tier N', v: 10 }],
    async run(v) {
      await U.TR.load(); const sat = U.TR.watersat(v.Tsat + K), Tf = (v.Tsat + v.Ts) / 2, l = U.TR.watersat(Tf + K), rhov = sat.rhov, hfg = sat.hfg * 1e3, dT = v.Tsat - v.Ts;
      if (dT <= 0) throw new Error('Wall must be colder than saturation');
      const rl = l.rhol, kl = l.kl, mul = l.mul, nul = mul / rl, Pr = l.Prl, hs = hfg + 0.68 * l.cpl * dT, G = Math.cbrt(g / (nul * nul));
      let hh, Re, regime, A;
      if (v.geo === 'vert') {
        A = v.L * v.W;
        hh = 0.943 * Math.pow(g * rl * (rl - rhov) * kl ** 3 * hs / (mul * dT * v.L), 0.25); Re = 4 * hh * v.L * dT / (mul * hs); regime = 'laminar (wave-free)';
        if (Re > 30) { Re = 4.81 + Math.pow(3.70 * v.L * kl * dT / (mul * hs) * G, 0.820); hh = Re * kl * G / (1.08 * Math.pow(Re, 1.22) - 5.2); regime = 'wavy laminar'; }
        if (Re > 1800) { Re = Math.pow(0.0690 * v.L * kl * Math.sqrt(Pr) * dT / (mul * hs) * G - 151 * Math.sqrt(Pr) + 253, 4 / 3); hh = Re * kl * G / (8750 + 58 / Math.sqrt(Pr) * (Math.pow(Re, 0.75) - 253)); regime = 'turbulent'; }
      } else {
        const D = v.L; A = Math.PI * D * v.W * (v.geo === 'bank' ? v.N : 1);
        hh = 0.729 * Math.pow(g * rl * (rl - rhov) * kl ** 3 * hs / (mul * dT * D), 0.25); if (v.geo === 'bank') hh /= Math.pow(v.N, 0.25); regime = 'laminar film around tube'; Re = NaN;
      }
      const Q = hh * A * dT, mc = Q / hs;
      return { out: [['h', hh, 'W/m²K', 1], ['Heat rate Q', Q, 'W', 1], ['Condensation rate', mc * 3600, 'kg/h', 1], ['Film regime', regime, ''], ['Film Reynolds number', Re, ''], ['h*<sub>fg</sub>', hs / 1e3, 'kJ/kg'], ['Liquid Pr (at film T)', Pr, '']], html: '<p class="small muted">Liquid properties at film temperature, ρ<sub>v</sub> and h<sub>fg</sub> at T<sub>sat</sub>. Dropwise condensation (promoted surfaces) gives h an order of magnitude higher; non-condensable gases (air) drastically reduce h.</p>' };
    }
  });

  /* ======================= Heat exchangers ======================= */
  const EPS = {
    par: ['Parallel flow', (N, C) => (1 - Math.exp(-N * (1 + C))) / (1 + C)],
    cnt: ['Counter flow', (N, C) => Math.abs(1 - C) < 1e-9 ? N / (1 + N) : (1 - Math.exp(-N * (1 - C))) / (1 - C * Math.exp(-N * (1 - C)))],
    st1: ['Shell & tube: 1 shell pass, 2/4/… tube passes', (N, C) => { const s = Math.sqrt(1 + C * C), e = Math.exp(-N * s); return 2 / (1 + C + s * (1 + e) / (1 - e)); }],
    st2: ['Shell & tube: 2 shell passes, 4/8/… tube passes', (N, C) => { const e1 = EPS.st1[1](N / 2, C); if (Math.abs(1 - C) < 1e-9) return 2 * e1 / (1 + e1); const a = Math.pow((1 - e1 * C) / (1 - e1), 2); return (a - 1) / (a - C); }],
    cfu: ['Cross-flow: both fluids unmixed', (N, C) => C === 0 ? 1 - Math.exp(-N) : 1 - Math.exp(Math.pow(N, 0.22) / C * (Math.exp(-C * Math.pow(N, 0.78)) - 1))],
    cfmax: ['Cross-flow: C<sub>max</sub> mixed, C<sub>min</sub> unmixed', (N, C) => C === 0 ? 1 - Math.exp(-N) : (1 / C) * (1 - Math.exp(-C * (1 - Math.exp(-N))))],
    cfmin: ['Cross-flow: C<sub>min</sub> mixed, C<sub>max</sub> unmixed', (N, C) => C === 0 ? 1 - Math.exp(-N) : 1 - Math.exp(-(1 / C) * (1 - Math.exp(-C * N)))]
  };
  U.EPS = EPS;
  U.addCalc('hx', {
    title: 'Heat exchanger design & rating (ε–NTU and LMTD with F-factor)', cat: CATX, blurb: 'Seven flow arrangements; rating (find outlets) or sizing (find area); temperature profiles; ε–NTU chart.',
    desc: R`<p>\(C=\dot mc_p\), \(C_r=C_{min}/C_{max}\), \(NTU=UA/C_{min}\), \(\dot q=\varepsilon C_{min}(T_{h,i}-T_{c,i})\). LMTD method: \(\dot q=UAF\Delta T_{lm,CF}\), \(\Delta T_{lm}=\dfrac{\Delta T_1-\Delta T_2}{\ln(\Delta T_1/\Delta T_2)}\). The correction factor here is computed exactly as \(F=NTU_{CF}(\varepsilon)/NTU(\varepsilon)\).</p>`,
    inputs: [{ k: 'cfg', l: 'Flow arrangement', v: 'cnt', opts: Object.entries(EPS).map(([k, e]) => [k, e[0]]) }, { k: 'mode', l: 'Problem type', v: 'rate', opts: [['rate', 'Rating: U and A known → outlet temperatures'], ['size', 'Sizing: required hot outlet T known → area']] },
    { k: 'mh', l: 'Hot flow ṁ<sub>h</sub>', u: 'kg/s', v: 2 }, { k: 'cph', l: 'Hot c<sub>p,h</sub>', u: 'kJ/kg·K', v: 2.1 }, { k: 'Thi', l: 'Hot inlet T<sub>h,i</sub>', u: '°C', v: 150 },
    { k: 'mc', l: 'Cold flow ṁ<sub>c</sub>', u: 'kg/s', v: 1.2 }, { k: 'cpc', l: 'Cold c<sub>p,c</sub>', u: 'kJ/kg·K', v: 4.18 }, { k: 'Tci', l: 'Cold inlet T<sub>c,i</sub>', u: '°C', v: 20 },
    { k: 'U', l: 'Overall U', u: 'W/m²K', v: 400 }, { k: 'A', l: 'Area A (rating)', u: 'm²', v: 15 }, { k: 'Tho', l: 'Required hot outlet (sizing)', u: '°C', v: 80 }, { k: 'pc', l: 'Phase change on one side (C → ∞)?', v: 'no', opts: [['no', 'No'], ['h', 'Hot side condensing'], ['c', 'Cold side boiling']] }],
    show: v => ({ A: v.mode === 'rate', Tho: v.mode === 'size' }),
    run(v) {
      let Ch = v.mh * v.cph * 1e3, Cc = v.mc * v.cpc * 1e3; if (v.pc === 'h') Ch = 1e15; if (v.pc === 'c') Cc = 1e15;
      const Cmin = Math.min(Ch, Cc), Cmax = Math.max(Ch, Cc), Cr = v.pc !== 'no' ? 0 : Cmin / Cmax, qmax = Cmin * (v.Thi - v.Tci);
      const f = EPS[v.cfg][1]; let NTU, eps, A;
      if (v.mode === 'rate') { A = v.A; NTU = v.U * A / Cmin; eps = f(NTU, Cr); }
      else { if (v.pc === 'h') throw new Error('Condensing hot side has fixed T — use a cold-side outlet target instead'); const q = Ch * (v.Thi - v.Tho); eps = q / qmax; const emax = f(60, Cr); if (eps >= emax) throw new Error(`Required ε = ${U.f(eps, 4)} exceeds what this arrangement can reach (${U.f(emax, 4)}) — temperature cross. Use counter-flow or more shells.`); NTU = U.solveLog(N => f(N, Cr) - eps, 1e-4, 60); A = NTU * Cmin / v.U; }
      const q = eps * qmax, Tho = v.Thi - q / Ch, Tco = v.Tci + q / Cc;
      const d1 = v.Thi - Tco, d2 = Tho - v.Tci, lmtd = Math.abs(d1 - d2) < 1e-9 ? d1 : (d1 - d2) / Math.log(d1 / d2);
      const NTUcf = Cr === 1 ? eps / (1 - eps) : Math.log((1 - eps * Cr) / (1 - eps)) / (1 - Cr), F = v.cfg === 'cnt' ? 1 : (Cr === 0 ? 1 : NTUcf / NTU);
      return {
        out: [['Heat duty q', q / 1e3, 'kW', 1], ['Hot outlet T<sub>h,o</sub>', Tho, '°C', 1], ['Cold outlet T<sub>c,o</sub>', Tco, '°C', 1], ['Area A', A, 'm²', v.mode === 'size'], ['Effectiveness ε', eps, ''], ['NTU', NTU, ''], ['C<sub>r</sub>', Cr, ''], ['ΔT<sub>lm</sub> (counter-flow basis)', lmtd, 'K'], ['LMTD correction factor F', F, ''], ['C<sub>min</sub> side', Ch <= Cc ? 'hot' : 'cold', '']],
        html: (F < 0.75 ? '<div class="box warn"><b>F < 0.75</b>Poor use of area — consider more shell passes or a counter-flow design.</div>' : '') + R`<p>Check by LMTD: \(UAF\Delta T_{lm}=${U.f(v.U * A * F * lmtd / 1e3, 5)}\) kW ✔.</p>`,
        plot(el) {
          const w = h('div', { class: 'two' }); el.append(w); const a = h('div'), b = h('div'); w.append(a, b);
          const Ns = U.range(0, Math.max(5, NTU * 1.4), 80);
          U.plot(U.canvas(a, 520, 360), { series: [0, 0.25, 0.5, 0.75, 1].map(c => ({ x: Ns, y: Ns.map(N => f(N, c)), label: 'Cr = ' + c, width: 1.6 })), marks: [{ x: NTU, y: eps, label: 'design' }], xlabel: 'NTU', ylabel: 'ε', title: EPS[v.cfg][0].replace(/<[^>]+>/g, '') + ' — ε–NTU', ylim: [0, 1] });
          if (v.cfg === 'par' || v.cfg === 'cnt') { // axial profiles
            const xs = U.range(0, 1, 60); const UA = v.U * A; let Th, Tc;
            if (v.cfg === 'par') { const k = UA * (1 / Ch + 1 / Cc); Th = xs.map(x => { const d = (v.Thi - v.Tci) * Math.exp(-k * x); const qx = (v.Thi - v.Tci - d) / (1 / Ch + 1 / Cc); return v.Thi - qx / Ch; }); Tc = xs.map((x, i) => v.Tci + (v.Thi - Th[i]) * Ch / Cc); }
            else { Th = xs.map(x => { const qx = (() => { const fx = EPS.cnt[1]; return 0; })(); return 0; }); // counter: solve via ΔT(x) from hot inlet end
              const k = UA * (1 / Ch - 1 / Cc), dT0 = v.Thi - Tco; Th = xs.map(x => { const dT = Math.abs(k) < 1e-12 ? dT0 : dT0 * Math.exp(-k * x); const qx = Math.abs(k) < 1e-12 ? UA * dT0 * x : (dT0 - dT) / (1 / Ch - 1 / Cc); return v.Thi - qx / Ch; }); Tc = xs.map((x, i) => Tco - (v.Thi - Th[i]) * Ch / Cc); }
            U.plot(U.canvas(b, 520, 360), { series: [{ x: xs, y: Th, label: 'hot fluid' }, { x: xs, y: Tc, label: 'cold fluid', color: U.cssVar('--cool') }], xlabel: 'Fraction of exchanger length (from hot inlet)', ylabel: 'T [°C]', title: 'Axial temperature profiles' });
          }
        }
      };
    }
  });
  U.addCalc('overallU', {
    title: 'Overall heat-transfer coefficient of a tube (with fouling)', cat: CATX, blurb: 'Inner/outer film coefficients, wall conduction, fouling factors → U_i, U_o and controlling resistance.',
    desc: R`<p>\(\dfrac{1}{U_oA_o}=\dfrac1{h_iA_i}+\dfrac{R''_{f,i}}{A_i}+\dfrac{\ln(D_o/D_i)}{2\pi kL}+\dfrac{R''_{f,o}}{A_o}+\dfrac1{h_oA_o}\). Typical fouling factors (m²K/W): sea water < 50 °C 0.0001; treated boiler feed water 0.0001–0.0002; river water 0.0002–0.001; fuel oil 0.0009; refrigerant liquids 0.0002; steam (oil-free) 0.0001.</p>`,
    inputs: [{ k: 'Di', l: 'Inner diameter', u: 'mm', v: 20 }, { k: 'Do', l: 'Outer diameter', u: 'mm', v: 25 }, { k: 'k', l: 'Wall k', u: 'W/m·K', v: 380 }, { k: 'hi', l: 'Inside h<sub>i</sub>', u: 'W/m²K', v: 3000 }, { k: 'ho', l: 'Outside h<sub>o</sub>', u: 'W/m²K', v: 800 }, { k: 'Rfi', l: 'Inner fouling R″<sub>f,i</sub>', u: 'm²K/W', v: 0.0002 }, { k: 'Rfo', l: 'Outer fouling R″<sub>f,o</sub>', u: 'm²K/W', v: 0.0001 }],
    run(v) { const Di = v.Di / 1000, Do = v.Do / 1000, Ai = Math.PI * Di, Ao = Math.PI * Do; const R = [1 / (v.hi * Ai), v.Rfi / Ai, Math.log(Do / Di) / (2 * Math.PI * v.k), v.Rfo / Ao, 1 / (v.ho * Ao)], Rt = R.reduce((a, b) => a + b), n = ['inside film', 'inside fouling', 'wall', 'outside fouling', 'outside film'];
      const Rc = R.map(x => x / Rt); const imax = Rc.indexOf(Math.max(...Rc));
      return { out: [['U<sub>o</sub> (outer area)', 1 / (Ao * Rt), 'W/m²K', 1], ['U<sub>i</sub> (inner area)', 1 / (Ai * Rt), 'W/m²K', 1], ['Clean U<sub>o</sub>', 1 / (Ao * (Rt - R[1] - R[3])), 'W/m²K'], ['Controlling resistance', n[imax] + ' (' + U.fmt(100 * Rc[imax], 3) + ' %)', '']] }; }
  });

  /* ======================= Radiation: blackbody ======================= */
  const C1 = 3.741771852e8, C2 = 14387.7688; // W·μm⁴/m², μm·K
  U.Eblam = (lam, T) => C1 / (Math.pow(lam, 5) * (Math.exp(C2 / (lam * T)) - 1));
  U.F0l = lT => { const z = C2 / lT; let s = 0; for (let n = 1; n <= 60; n++) s += Math.exp(-n * z) / n * (z ** 3 + 3 * z * z / n + 6 * z / (n * n) + 6 / (n ** 3)); return 15 / Math.PI ** 4 * s; };
  U.addCalc('blackbody', {
    title: 'Blackbody radiation: Planck, Wien, Stefan–Boltzmann, band fractions', cat: CATR, blurb: 'Spectral emissive power curves, peak wavelength, fraction of energy in any band (visible, IR…).',
    desc: R`<p>\(E_{b\lambda}=\dfrac{C_1}{\lambda^5[\exp(C_2/\lambda T)-1]}\), \(C_1=3.742\times10^8\) W·μm⁴/m², \(C_2=1.4388\times10^4\) μm·K. \(\lambda_{max}T=2897.8\) μm·K, \(E_b=\sigma T^4\). Band fraction \(F_{\lambda_1-\lambda_2}=F_{0-\lambda_2T}-F_{0-\lambda_1T}\) (evaluated by the exact series).</p>`,
    inputs: [{ k: 'T', l: 'Temperature', u: 'K', v: 5800 }, { k: 'l1', l: 'Band λ₁', u: 'μm', v: 0.4 }, { k: 'l2', l: 'Band λ₂', u: 'μm', v: 0.76 }, { k: 'eps', l: 'Emissivity (gray body)', v: 1 }, { k: 'A', l: 'Area', u: 'm²', v: 1 }],
    run(v) {
      const Eb = SIG * v.T ** 4, F = U.F0l(v.l2 * v.T) - U.F0l(v.l1 * v.T);
      return { out: [['E<sub>b</sub> = σT⁴', Eb, 'W/m²', 1], ['Emitted (gray) εσT⁴A', v.eps * Eb * v.A, 'W'], ['λ<sub>max</sub>', 2897.77 / v.T, 'μm', 1], ['Band fraction F<sub>λ₁–λ₂</sub>', F, '', 1], ['Energy in band', F * v.eps * Eb * v.A, 'W'], ['F<sub>0–λ₁</sub>', U.F0l(v.l1 * v.T), ''], ['F<sub>0–λ₂</sub>', U.F0l(v.l2 * v.T), '']],
        plot(el) { const ls = []; for (let l = 0.1; l < 100; l *= 1.04) ls.push(l); const Ts = [v.T, v.T * 0.7, v.T * 0.4]; U.plot(U.canvas(el, 680, 340), { series: Ts.map(T => ({ x: ls, y: ls.map(l => U.Eblam(l, T)), label: U.f(T, 4) + ' K' })), logx: true, logy: true, xlabel: 'Wavelength λ [μm]', ylabel: 'E_bλ [W/m²·μm]', title: 'Planck distribution (peak shifts left as T rises — Wien)', ylim: [U.Eblam(2897.77 / (v.T * 0.4), v.T * 0.4) * 1e-4, U.Eblam(2897.77 / v.T, v.T) * 3] }); } };
    }
  });

  /* ======================= View factors ======================= */
  const VF = [
    ['Coaxial parallel disks (radii rᵢ, rⱼ, spacing L)', ['ri', 'rj', 'L'], v => { const Ri = v.ri / v.L, Rj = v.rj / v.L, S = 1 + (1 + Rj * Rj) / (Ri * Ri); return 0.5 * (S - Math.sqrt(S * S - 4 * (v.rj / v.ri) ** 2)); }],
    ['Aligned parallel rectangles X × Y, spacing L', ['X', 'Y', 'L'], v => { const X = v.X / v.L, Y = v.Y / v.L, a = Math.sqrt(1 + X * X), b = Math.sqrt(1 + Y * Y); return 2 / (Math.PI * X * Y) * (Math.log(Math.sqrt((1 + X * X) * (1 + Y * Y) / (1 + X * X + Y * Y))) + X * b * Math.atan(X / b) + Y * a * Math.atan(Y / a) - X * Math.atan(X) - Y * Math.atan(Y)); }],
    ['Perpendicular rectangles with common edge (edge X; i has width Y, j has width Z)', ['X', 'Y', 'Z'], v => { const H = v.Z / v.X, W = v.Y / v.X, s = H * H + W * W; const t1 = W * Math.atan(1 / W) + H * Math.atan(1 / H) - Math.sqrt(s) * Math.atan(1 / Math.sqrt(s)); const l = Math.log((1 + W * W) * (1 + H * H) / (1 + s)) + W * W * Math.log(W * W * (1 + s) / ((1 + W * W) * s)) + H * H * Math.log(H * H * (1 + s) / ((1 + H * H) * s)); return (t1 + l / 4) / (Math.PI * W); }],
    ['Infinitely long parallel plates of widths wᵢ, wⱼ, centred, spacing L', ['wi', 'wj', 'L'], v => { const Wi = v.wi / v.L, Wj = v.wj / v.L; return (Math.sqrt((Wi + Wj) ** 2 + 4) - Math.sqrt((Wj - Wi) ** 2 + 4)) / (2 * Wi); }],
    ['Long inclined plates of equal width, common edge, angle α (deg)', ['alpha'], v => 1 - Math.sin(v.alpha * Math.PI / 360)],
    ['Long perpendicular plates with common edge (widths wᵢ, wⱼ)', ['wi', 'wj'], v => (1 + v.wj / v.wi - Math.sqrt(1 + (v.wj / v.wi) ** 2)) / 2],
    ['Long concentric cylinders: outer (2) to inner (1), F₂₁ (radii r₁, r₂)', ['r1', 'r2'], v => v.r1 / v.r2],
    ['Sphere (radius r₁) to coaxial disk (radius r₂) at distance L', ['r2', 'L'], v => 0.5 * (1 - 1 / Math.sqrt(1 + (v.r2 / v.L) ** 2))],
    ['Infinite plane to a row of cylinders (diameter D, pitch s)', ['D', 's'], v => 1 - Math.sqrt(1 - (v.D / v.s) ** 2) + v.D / v.s * Math.atan(Math.sqrt((v.s * v.s - v.D * v.D) / (v.D * v.D)))],
    ['Differential area to parallel coaxial disk (radius r, distance L)', ['r', 'L'], v => v.r * v.r / (v.r * v.r + v.L * v.L)]
  ];
  U.VF = VF;
  U.addCalc('viewf', {
    title: 'View (shape/configuration) factors', cat: CATR, blurb: 'Disks, rectangles, perpendicular plates, long plates, cylinders, spheres, tube rows — with reciprocity.',
    desc: R`<p>Reciprocity \(A_iF_{ij}=A_jF_{ji}\); summation \(\sum_jF_{ij}=1\); superposition for composite surfaces. Lengths in any consistent unit.</p>`,
    mount(el) {
      const sel = h('select', { class: 'inp' }, VF.map((s, i) => h('option', { value: i }, s[0]))), box = h('div', { class: 'form' }), out = h('div'), f = {};
      const build = () => { box.innerHTML = ''; VF[sel.value][1].forEach(p => { f[p] = f[p] || h('input', { class: 'inp', type: 'number', step: 'any', value: { ri: 0.5, rj: 0.5, L: 1, X: 1, Y: 1, Z: 1, wi: 1, wj: 1, alpha: 60, r1: 0.5, r2: 1, D: 0.02, s: 0.05, r: 0.5 }[p] }); box.append(h('div', { class: 'fld' }, h('label', {}, p), f[p])); }); go(); };
      const go = () => { const s = VF[sel.value], vv = {}; s[1].forEach(p => vv[p] = +f[p].value); const F = s[2](vv); out.innerHTML = ''; out.append(h('div', { class: 'out' }, h('div', { class: 'main' }, h('span', {}, 'F_ij'), h('b', { html: U.fmt(F, 5) })))); };
      sel.onchange = build; el.append(h('div', { class: 'fld' }, h('label', {}, 'Geometry'), sel), box, out); el.addEventListener('input', go); build();
    }
  });

  /* ======================= Two-surface enclosures & shields ======================= */
  U.addCalc('rad2', {
    title: 'Radiation exchange: two-surface enclosures & radiation shields', cat: CATR, blurb: 'Parallel plates, concentric cylinders/spheres, small object in large room; N shields.',
    desc: R`<p>\(\dot Q_{12}=\dfrac{\sigma(T_1^4-T_2^4)}{\dfrac{1-\varepsilon_1}{\varepsilon_1A_1}+\dfrac1{A_1F_{12}}+\dfrac{1-\varepsilon_2}{\varepsilon_2A_2}}\). Each shield adds two surface resistances and one space resistance. Infinite plates with N identical shields: \(\dot q=\dfrac{\sigma(T_1^4-T_2^4)}{(1/\varepsilon_1+1/\varepsilon_2-1)+N(2/\varepsilon_s-1)}\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'plates', opts: [['plates', 'Large parallel plates (per m²)'], ['cyl', 'Long concentric cylinders (per m length)'], ['sph', 'Concentric spheres'], ['small', 'Small convex body in large enclosure']] },
    { k: 'T1', l: 'T₁ (inner / hotter)', u: '°C', v: 500 }, { k: 'T2', l: 'T₂', u: '°C', v: 30 }, { k: 'e1', l: 'ε₁', v: 0.8 }, { k: 'e2', l: 'ε₂', v: 0.8 }, { k: 'r1', l: 'Inner radius r₁ (or body area A₁ in m² for small body)', u: 'm', v: 0.05 }, { k: 'r2', l: 'Outer radius r₂', u: 'm', v: 0.1 },
    { k: 'N', l: 'Number of shields', v: 1 }, { k: 'es', l: 'Shield emissivity (both sides)', v: 0.05 }],
    show: v => ({ r1: v.geo !== 'plates', r2: v.geo === 'cyl' || v.geo === 'sph', N: v.geo !== 'small', es: v.geo !== 'small' }),
    run(v) {
      const T1 = v.T1 + K, T2 = v.T2 + K, eb = SIG * (T1 ** 4 - T2 ** 4);
      const A = r => v.geo === 'plates' ? 1 : v.geo === 'cyl' ? 2 * Math.PI * r : 4 * Math.PI * r * r;
      if (v.geo === 'small') { const Q = v.e1 * v.r1 * eb; return { out: [['Net Q', Q, 'W', 1], ['Radiation h<sub>rad</sub>', v.e1 * SIG * (T1 * T1 + T2 * T2) * (T1 + T2), 'W/m²K']] }; }
      const r1 = v.r1, r2 = v.r2, N = Math.max(0, Math.round(v.N));
      const Rnone = (1 - v.e1) / (v.e1 * A(r1)) + 1 / A(r1) + (1 - v.e2) / (v.e2 * A(r2));
      // shields placed at geometric mean radii between r1 and r2
      let Rt = (1 - v.e1) / (v.e1 * A(r1)) + (1 - v.e2) / (v.e2 * A(r2)), rs = [r1];
      for (let i = 1; i <= N; i++) rs.push(v.geo === 'plates' ? 1 : r1 * Math.pow(r2 / r1, i / (N + 1)));
      rs.push(r2);
      for (let i = 0; i < rs.length - 1; i++) Rt += 1 / A(rs[i]);
      for (let i = 1; i <= N; i++) Rt += 2 * (1 - v.es) / (v.es * A(rs[i]));
      const Q0 = eb / Rnone, Q = eb / Rt;
      return { out: [['Net exchange without shields', Q0, 'W', 0], ['Net exchange with shields', Q, 'W', 1], ['Reduction', 100 * (1 - Q / Q0), '%', 1], ['Shield radii used', rs.slice(1, -1).map(r => U.fmt(r, 3)).join(', ') || '—', 'm']], html: '<p class="small muted">Values per m² (plates) or per m length (cylinders). Low-emissivity shields (polished Al, ε≈0.05) are why multilayer insulation in spacecraft works.</p>' };
    }
  });

  /* ======================= N-surface enclosure ======================= */
  U.addCalc('radN', {
    title: 'N-surface gray diffuse enclosure (radiosity network solver)', cat: CATR, blurb: 'Up to 5 surfaces with known T or net Q; solves radiosities J and net heat flows.',
    desc: R`<p>For each surface: known \(T\): \(\dfrac{E_{b,i}-J_i}{(1-\varepsilon_i)/(\varepsilon_iA_i)}=\sum_j A_iF_{ij}(J_i-J_j)\); known \(\dot Q\): \(\dot Q_i=\sum_jA_iF_{ij}(J_i-J_j)\). Reradiating (insulated) surface: \(\dot Q=0\). Enter view-factor rows; each row should sum to 1.</p>`,
    mount(el) {
      const n = h('select', { class: 'inp' }, [2, 3, 4, 5].map(k => h('option', { value: k }, k + ' surfaces'))); n.value = 3; const grid = h('div', { class: 'tablewrap' }), out = h('div');
      const defs = { A: [1, 1, 1, 1, 1], e: [0.8, 0.5, 0.9, 0.9, 0.9], T: [1200, 500, 300, 300, 300], typ: ['T', 'T', 'Q', 'T', 'T'], Q: [0, 0, 0, 0, 0] };
      let cells = {};
      const build = () => { const N = +n.value; grid.innerHTML = ''; cells = { A: [], e: [], typ: [], val: [], F: [] }; const t = h('table', {}); t.append(h('tr', {}, ['Surface', 'Area A [m²]', 'ε', 'Known', 'T [K] or Q [W]', ...Array.from({ length: N }, (_, j) => 'F<sub>i' + (j + 1) + '</sub>')].map(x => h('th', { html: x }))));
        for (let i = 0; i < N; i++) { const inp = (v) => h('input', { class: 'inp', type: 'number', step: 'any', value: v, style: 'min-width:70px' }); const A = inp(defs.A[i]), e = inp(defs.e[i]), typ = h('select', { class: 'inp' }, h('option', { value: 'T' }, 'T'), h('option', { value: 'Q' }, 'Q (0 = reradiating)')); typ.value = defs.typ[i]; const val = inp(defs.typ[i] === 'T' ? defs.T[i] : 0);
          const Fr = Array.from({ length: N }, (_, j) => inp(i === j ? 0 : +(1 / (N - 1)).toFixed(4))); cells.A.push(A); cells.e.push(e); cells.typ.push(typ); cells.val.push(val); cells.F.push(Fr);
          t.append(h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, A), h('td', {}, e), h('td', {}, typ), h('td', {}, val), ...Fr.map(x => h('td', {}, x)))); }
        grid.append(t); go(); };
      const go = () => {
        out.innerHTML = ''; const N = +n.value; const A = cells.A.map(x => +x.value), e = cells.e.map(x => +x.value), F = cells.F.map(r => r.map(x => +x.value)), typ = cells.typ.map(x => x.value), val = cells.val.map(x => +x.value);
        const M = [], b = [];
        for (let i = 0; i < N; i++) { const row = Array(N).fill(0); let rhs = 0;
          for (let j = 0; j < N; j++) if (j !== i) { row[i] += A[i] * F[i][j]; row[j] -= A[i] * F[i][j]; }
          if (typ[i] === 'T') { const Rs = (1 - e[i]) / (e[i] * A[i]); if (e[i] >= 1) { row.fill(0); row[i] = 1; rhs = SIG * val[i] ** 4; } else { row[i] += 1 / Rs; rhs = SIG * val[i] ** 4 / Rs; } }
          else rhs = val[i];
          M.push(row); b.push(rhs); }
        const J = U.linsolve(M, b); const Q = J.map((Ji, i) => J.reduce((s, Jj, j) => s + (j !== i ? A[i] * F[i][j] * (Ji - Jj) : 0), 0));
        const Tsol = J.map((Ji, i) => typ[i] === 'T' ? val[i] : Math.pow((Ji + Q[i] * (1 - e[i]) / (e[i] * A[i])) / SIG, 0.25));
        const sums = F.map(r => r.reduce((a, b2) => a + b2, 0));
        out.append(h('div', { html: '<table class="num"><tr><th>Surface</th><th>J [W/m²]</th><th>Net Q<sub>i</sub> [W] (+ = leaves)</th><th>T [K]</th><th>ΣF<sub>ij</sub></th></tr>' + J.map((Ji, i) => `<tr><td>${i + 1}</td><td>${U.fmt(Ji, 5)}</td><td>${U.fmt(Q[i], 5)}</td><td>${U.fmt(Tsol[i], 5)}</td><td>${Math.abs(sums[i] - 1) > 0.01 ? '<b class="err">' + U.fmt(sums[i], 3) + '</b>' : U.fmt(sums[i], 3)}</td></tr>`).join('') + `</table><p class="small muted">Energy balance ΣQ = ${U.fmt(Q.reduce((a, b2) => a + b2, 0), 3)} W (≈ 0 for consistent view factors).</p>` }));
      };
      n.onchange = build; el.append(h('div', { class: 'fld', style: 'max-width:240px' }, h('label', {}, 'Number of surfaces'), n), grid, h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: go }, 'Solve')), out); grid.addEventListener('input', go); build();
    }
  });

  /* ======================= Thermocouple error & combined modes ======================= */
  U.addCalc('tcerror', {
    title: 'Thermocouple radiation error & combined convection–radiation', cat: CATR, blurb: 'True gas temperature from a thermocouple reading in a duct with cooler walls; response time.',
    desc: R`<p>Steady energy balance on the junction: \(h(T_g-T_{tc})=\varepsilon\sigma(T_{tc}^4-T_w^4)\). Junction h from Whitaker’s sphere correlation (or entered directly). Time constant \(\tau=\rho cD/(6h)\). A radiation shield or a low-ε junction reduces the error.</p>`,
    inputs: [{ k: 'mode', l: 'Given', v: 'read', opts: [['read', 'Thermocouple reading → true gas T'], ['true', 'True gas T → expected reading']] }, { k: 'T', l: 'Reading or true gas T', u: '°C', v: 650 }, { k: 'Tw', l: 'Duct wall T', u: '°C', v: 450 }, { k: 'eps', l: 'Junction emissivity', v: 0.6 },
    { k: 'hm', l: 'Junction h source', v: 'corr', opts: [['corr', 'Compute from gas flow (air, sphere)'], ['given', 'Enter h']] }, { k: 'h', l: 'h (if entered)', u: 'W/m²K', v: 200 }, { k: 'V', l: 'Gas velocity', u: 'm/s', v: 5 }, { k: 'D', l: 'Junction diameter', u: 'mm', v: 1 }, { k: 'rhoc', l: 'Junction ρc', u: 'J/m³K', v: 3.5e6 }],
    show: v => ({ h: v.hm === 'given', V: v.hm === 'corr', D: true }),
    async run(v) {
      const D = v.D / 1000, Tw = v.Tw + K;
      const hOf = async Tg => { if (v.hm === 'given') return v.h; const p = await P('air', Math.min(1700, Tg - K)); const Re = v.V * D / p.nu; return (2 + (0.4 * Math.sqrt(Re) + 0.06 * Math.pow(Re, 2 / 3)) * Math.pow(p.Pr, 0.4)) * p.k / D; };
      let Ttc, Tg, hh;
      if (v.mode === 'read') { Ttc = v.T + K; hh = await hOf(Ttc); Tg = Ttc + v.eps * SIG * (Ttc ** 4 - Tw ** 4) / hh; hh = await hOf(Tg); Tg = Ttc + v.eps * SIG * (Ttc ** 4 - Tw ** 4) / hh; }
      else { Tg = v.T + K; hh = await hOf(Tg); Ttc = U.brent(T => hh * (Tg - T) - v.eps * SIG * (T ** 4 - Tw ** 4), Tw, Tg); }
      return { out: [['True gas T', Tg - K, '°C', 1], ['Thermocouple reading', Ttc - K, '°C', 1], ['Radiation error T<sub>g</sub> − T<sub>tc</sub>', Tg - Ttc, 'K', 1], ['Junction h', hh, 'W/m²K'], ['Time constant τ', v.rhoc * D / (6 * hh), 's']], html: '<p>Error grows with wall–gas temperature difference and junction emissivity, and falls with higher h (smaller bead, faster gas). Suction pyrometers and shielded junctions exploit exactly these levers.</p>' };
    }
  });
  U.addCalc('combrad', {
    title: 'Surface losing heat by convection and radiation', cat: CATR, blurb: 'Steam pipes, furnace walls, electronics: h_rad linearisation and total loss.',
    desc: R`<p>\(\dot q''=h(T_s-T_\infty)+\varepsilon\sigma(T_s^4-T_{sur}^4)\); radiation coefficient \(h_r=\varepsilon\sigma(T_s+T_{sur})(T_s^2+T_{sur}^2)\).</p>`,
    inputs: [{ k: 'Ts', l: 'Surface T', u: '°C', v: 150 }, { k: 'Tinf', l: 'Air T', u: '°C', v: 25 }, { k: 'Tsur', l: 'Surroundings T', u: '°C', v: 25 }, { k: 'eps', l: 'Emissivity', v: 0.85 }, { k: 'h', l: 'Convection h', u: 'W/m²K', v: 8 }, { k: 'A', l: 'Area', u: 'm²', v: 1 }],
    run(v) { const Ts = v.Ts + K, Tr = v.Tsur + K, qc = v.h * (v.Ts - v.Tinf), qr = v.eps * SIG * (Ts ** 4 - Tr ** 4); return { out: [['Total loss', (qc + qr) * v.A, 'W', 1], ['Convection', qc * v.A, 'W'], ['Radiation', qr * v.A, 'W'], ['h<sub>rad</sub>', v.eps * SIG * (Ts + Tr) * (Ts * Ts + Tr * Tr), 'W/m²K'], ['Radiation share', 100 * qr / (qc + qr), '%']] }; }
  });
})();
