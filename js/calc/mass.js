/* Mass transfer calculators */
'use strict';
(() => {
  const { h } = U; const K = 273.15, Ru = 8.314462618;
  const CAT = 'Mass transfer';
  // Fuller diffusion volumes (Poling, Prausnitz & O'Connell)
  const FV = { Air: [19.7, 28.97], N2: [18.5, 28.013], O2: [16.3, 31.999], H2O: [13.1, 18.015], CO2: [26.7, 44.01], H2: [6.12, 2.016], He: [2.67, 4.003], NH3: [20.7, 17.031], CO: [18.0, 28.01], Ar: [16.2, 39.948], SO2: [41.8, 64.06], 'Ethanol C2H5OH': [50.36, 46.07], 'Methanol CH3OH': [29.9, 32.04], 'Benzene C6H6': [90.68, 78.11], 'Acetone C3H6O': [66.86, 58.08], 'Naphthalene C10H8': [130.2, 128.17] };
  U.Dfuller = (a, b, T, P) => { const [va, ma] = FV[a], [vb, mb] = FV[b], Mab = 2 / (1 / ma + 1 / mb); return 1.43e-3 * Math.pow(T, 1.75) / ((P / 1e5) * Math.sqrt(Mab) * Math.pow(Math.cbrt(va) + Math.cbrt(vb), 2)) * 1e-4; }; // m2/s
  U.Dh2oair = (T, P) => 1.87e-10 * Math.pow(T, 2.072) / (P / 101325); // Marrero–Mason, 280–450 K
  const spOpts = Object.keys(FV);

  U.addCalc('diffcoef', {
    title: 'Binary diffusion coefficient of gases (Fuller correlation)', cat: CAT, blurb: 'D_AB for any pair of common gases/vapours at any T and P; water vapour–air special correlation.',
    desc: R`<p>Fuller–Schettler–Giddings: \(D_{AB}=\dfrac{1.43\times10^{-3}\,T^{1.75}}{P\,M_{AB}^{1/2}\left[(\Sigma_v)_A^{1/3}+(\Sigma_v)_B^{1/3}\right]^2}\) cm²/s (T in K, P in bar, \(M_{AB}=2/(1/M_A+1/M_B)\)), accuracy ≈ ±5 %. Water vapour in air (Marrero–Mason): \(D=1.87\times10^{-10}\,T^{2.072}/P\) [m²/s, P in atm]. Scaling: \(D\propto T^{1.75}/P\). Liquids: \(D\sim10^{-9}\), solids \(10^{-14}\)–\(10^{-10}\) m²/s.</p>`,
    inputs: [{ k: 'a', l: 'Species A', v: 'H2O', opts: spOpts }, { k: 'b', l: 'Species B', v: 'Air', opts: spOpts }, { k: 'T', l: 'Temperature', u: '°C', v: 25 }, { k: 'P', l: 'Pressure', u: 'kPa', v: 101.325 }],
    run(v) { const T = v.T + K, P = v.P * 1e3, D = U.Dfuller(v.a, v.b, T, P); const out = [['D<sub>AB</sub> (Fuller)', D, 'm²/s', 1], ['= ', D * 1e4, 'cm²/s']]; if ((v.a === 'H2O' && v.b === 'Air') || (v.b === 'H2O' && v.a === 'Air')) out.push(['Marrero–Mason (H₂O–air)', U.Dh2oair(T, P), 'm²/s']);
      return { out, html: '<p class="small muted">Schmidt number of the vapour in air ≈ ν/D ≈ ' + U.fmt(1.5e-5 * Math.pow(T / 298, 1.7) / D, 3) + ' (air ν approximated).</p>' }; }
  });

  U.addCalc('diffsteady', {
    title: 'Steady diffusion: walls, cylinders, spheres, membranes, Stefan tube, equimolar counter-diffusion', cat: CAT, blurb: 'Mass flux through stationary media, gas permeation through polymer/metal walls, evaporation in a column.',
    desc: R`<p>Fick’s law \(j_A=-\rho D_{AB}\dfrac{dw_A}{dx}\). Stationary medium resistances (analogous to conduction): plane \(R=\frac{L}{D_{AB}A}\), cylinder \(\frac{\ln(r_2/r_1)}{2\pi LD_{AB}}\), sphere \(\frac{r_2-r_1}{4\pi r_1r_2D_{AB}}\). Gas through a solid wall with solubility \(S\) (kmol/m³·bar): \(\dot N=D_{AB}SA\dfrac{P_{A,1}-P_{A,2}}{L}=\mathcal P A\dfrac{\Delta P_A}{L}\). Stefan tube (A diffusing through stagnant B): \(\dot N_A/A=\dfrac{CD_{AB}}{L}\ln\dfrac{1-y_{A,L}}{1-y_{A,0}}\). Equimolar counter-diffusion: \(\dot N_A/A=\dfrac{D_{AB}}{R_uT}\dfrac{P_{A,1}-P_{A,2}}{L}\).</p>`,
    inputs: [{ k: 'mode', l: 'Case', v: 'stefan', opts: [['wall', 'Stationary medium: plane wall (concentrations)'], ['cyl', 'Stationary medium: cylindrical shell'], ['sph', 'Stationary medium: spherical shell'], ['perm', 'Gas through a membrane/wall (solubility)'], ['stefan', 'Evaporation through stagnant gas (Stefan tube)'], ['eq', 'Equimolar counter-diffusion']] },
    { k: 'D', l: 'Diffusion coefficient D<sub>AB</sub>', u: 'm²/s', v: 2.6e-5 }, { k: 'L', l: 'Thickness / column length L (or r₁ for shells)', u: 'm', v: 0.1 }, { k: 'r2', l: 'Outer radius r₂ (shells)', u: 'm', v: 0.2 }, { k: 'A', l: 'Area A (or length for cylinder)', u: 'm² / m', v: 1e-4 },
    { k: 'C1', l: 'Concentration C<sub>A,1</sub> (or P<sub>A,1</sub> in kPa)', u: 'kmol/m³ / kPa', v: 0.05 }, { k: 'C2', l: 'Concentration C<sub>A,2</sub> (or P<sub>A,2</sub> in kPa)', u: 'kmol/m³ / kPa', v: 0 }, { k: 'S', l: 'Solubility S (membrane)', u: 'kmol/m³·bar', v: 0.00901 }, { k: 'T', l: 'Temperature', u: '°C', v: 25 }, { k: 'P', l: 'Total pressure', u: 'kPa', v: 101.325 }, { k: 'M', l: 'Molar mass of A', u: 'kg/kmol', v: 18.015 }],
    show: v => ({ r2: v.mode === 'cyl' || v.mode === 'sph', S: v.mode === 'perm' }),
    run(v) {
      const T = v.T + K, C = v.P / (Ru * T); let N, extra = [];
      if (v.mode === 'wall') N = v.D * v.A * (v.C1 - v.C2) / v.L;
      else if (v.mode === 'cyl') N = 2 * Math.PI * v.A * v.D * (v.C1 - v.C2) / Math.log(v.r2 / v.L);
      else if (v.mode === 'sph') N = 4 * Math.PI * v.L * v.r2 * v.D * (v.C1 - v.C2) / (v.r2 - v.L);
      else if (v.mode === 'perm') { N = v.D * v.S * v.A * (v.C1 - v.C2) / 100 / v.L; extra.push(['Permeability 𝒫 = D·S', v.D * v.S, 'kmol/m·s·bar'], ['Surface concentration C<sub>A,1</sub> = S·P<sub>A,1</sub>', v.S * v.C1 / 100, 'kmol/m³']); }
      else if (v.mode === 'stefan') { const y0 = v.C1 / v.P, yL = v.C2 / v.P; if (y0 >= 1) throw new Error('Partial pressure must be below total pressure'); N = C * v.D / v.L * Math.log((1 - yL) / (1 - y0)) * v.A; const Nf = C * v.D / v.L * (y0 - yL) * v.A; extra.push(['Mole fraction at surface y<sub>A,0</sub>', y0, ''], ['Fick-only estimate (no bulk flow)', Nf, 'kmol/s'], ['Stefan-flow enhancement', N / Nf, '×']); }
      else { N = v.D / (Ru * T) * (v.C1 - v.C2) / v.L * v.A; }
      return { out: [['Molar rate Ṅ<sub>A</sub>', N, 'kmol/s', 1], ['Mass rate ṁ<sub>A</sub>', N * v.M, 'kg/s', 1], ['= ', N * v.M * 3600 * 1000, 'g/h'], ['Total molar concentration C = P/R<sub>u</sub>T', C, 'kmol/m³'], ...extra],
        html: '<p class="small muted">For the Stefan tube and equimolar cases enter <b>partial pressures in kPa</b> in the C<sub>A,1</sub>, C<sub>A,2</sub> boxes (e.g. P<sub>sat</sub> of the liquid at the surface, ≈ 0 at the open top).</p>' };
    }
  });

  U.addCalc('diffsemi', {
    title: 'Transient diffusion: carburizing, decarburizing, doping (semi-infinite solid)', cat: CAT, blurb: 'Case depth, time to reach a carbon content, Arrhenius diffusivity of C in γ-Fe / α-Fe.',
    desc: R`<p>\(\dfrac{C(x,t)-C_s}{C_0-C_s}=\text{erf}\left(\dfrac{x}{2\sqrt{Dt}}\right)\) — identical in form to transient conduction in a semi-infinite solid. Diffusivity \(D=D_0\exp(-Q_d/RT)\); defaults (Callister): C in γ-Fe \(D_0=2.3\times10^{-5}\) m²/s, \(Q_d=148\) kJ/mol; C in α-Fe \(1.1\times10^{-6}\), 87.4 kJ/mol. Rule of thumb: case depth \(\propto\sqrt{Dt}\).</p>`,
    inputs: [{ k: 'sys', l: 'Diffusion couple', v: 'cg', opts: [['cg', 'Carbon in austenite (γ-Fe)'], ['ca', 'Carbon in ferrite (α-Fe)'], ['custom', 'Custom D₀, Q']] }, { k: 'D0', l: 'D₀', u: 'm²/s', v: 2.3e-5 }, { k: 'Q', l: 'Activation energy Q<sub>d</sub>', u: 'kJ/mol', v: 148 }, { k: 'T', l: 'Treatment temperature', u: '°C', v: 927 },
    { k: 'C0', l: 'Initial content C₀', u: 'wt%', v: 0.2 }, { k: 'Cs', l: 'Surface content C<sub>s</sub> (atmosphere)', u: 'wt%', v: 1.0 }, { k: 'mode', l: 'Find', v: 'C', opts: [['C', 'Content at depth x after time t'], ['t', 'Time to reach content C<sub>x</sub> at depth x'], ['x', 'Depth with content C<sub>x</sub> after time t']] },
    { k: 'x', l: 'Depth x', u: 'mm', v: 0.5 }, { k: 't', l: 'Time t', u: 'h', v: 4 }, { k: 'Cx', l: 'Target content C<sub>x</sub>', u: 'wt%', v: 0.5 }],
    show: v => ({ D0: v.sys === 'custom', Q: v.sys === 'custom', x: v.mode !== 'x', t: v.mode !== 't', Cx: v.mode !== 'C' }),
    run(v) {
      const [D0, Q] = v.sys === 'cg' ? [2.3e-5, 148] : v.sys === 'ca' ? [1.1e-6, 87.4] : [v.D0, v.Q];
      const T = v.T + K, D = D0 * Math.exp(-Q * 1e3 / (8.314 * T));
      const C = (x, t) => v.Cs - (v.Cs - v.C0) * U.erf(x / (2 * Math.sqrt(D * t)));
      let x = v.x / 1000, t = v.t * 3600, res;
      if (v.mode === 'C') res = ['Content at x', C(x, t), 'wt%'];
      else { const z = U.erfinv((v.Cs - v.Cx) / (v.Cs - v.C0)); if (!isFinite(z)) throw new Error('Target must lie between C₀ and Cₛ'); if (v.mode === 't') { t = (x / (2 * z)) ** 2 / D; res = ['Time required', t / 3600, 'h']; } else { x = 2 * z * Math.sqrt(D * t); res = ['Depth', x * 1000, 'mm']; } }
      return { out: [[res[0], res[1], res[2], 1], ['Diffusivity D at T', D, 'm²/s', 1], ['Diffusion length √(Dt)', Math.sqrt(D * t) * 1000, 'mm'], ['erf argument x/2√(Dt)', x / (2 * Math.sqrt(D * t)), '']],
        plot(el) { const xs = U.range(0, Math.max(4 * Math.sqrt(D * t), x * 1.5), 80); U.plot(U.canvas(el, 640, 300), { series: [0.25, 0.5, 1].map(f => ({ x: xs.map(q => q * 1000), y: xs.map(q => C(q, t * f)), label: 't = ' + U.f(t * f / 3600, 3) + ' h' })), xlabel: 'Depth below surface [mm]', ylabel: 'Carbon [wt%]', title: 'Concentration profiles (erf solution)' }); } };
    }
  });

  U.addCalc('convmass', {
    title: 'Convective mass transfer & heat–mass analogy (evaporation, wet-bulb)', cat: CAT, blurb: 'Sherwood correlations, Chilton–Colburn analogy, evaporation rate from a water surface, psychrometer wet-bulb.',
    desc: R`<p>Analogous numbers: \(Sh=h_mL/D_{AB}\) ↔ \(Nu\), \(Sc=\nu/D_{AB}\) ↔ \(Pr\), \(Le=\alpha/D_{AB}\). Chilton–Colburn: \(\dfrac{h}{h_m}=\rho c_p Le^{2/3}\). Flat plate: \(Sh=0.664Re^{1/2}Sc^{1/3}\) (laminar). Sphere (Ranz–Marshall): \(Sh=2+0.6Re^{1/2}Sc^{1/3}\). Evaporation: \(\dot m_v=h_mA(\rho_{v,s}-\rho_{v,\infty})\). Wet-bulb: \(h(T_\infty-T_s)=h_{fg}h_m(\rho_{v,s}-\rho_{v,\infty})\).</p>`,
    inputs: [{ k: 'geo', l: 'Geometry', v: 'plate', opts: [['plate', 'Flat water surface / plate (length L)'], ['sph', 'Droplet / sphere (diameter D)'], ['wb', 'Wet-bulb thermometer (cylinder, diameter D)']] }, { k: 'V', l: 'Air velocity', u: 'm/s', v: 3 }, { k: 'L', l: 'L or D', u: 'm', v: 0.5 }, { k: 'W', l: 'Width (plate)', u: 'm', v: 0.5 },
    { k: 'Tinf', l: 'Air T<sub>∞</sub>', u: '°C', v: 30 }, { k: 'phi', l: 'Air relative humidity', u: '%', v: 40 }, { k: 'Ts', l: 'Water surface T (plate/sphere)', u: '°C', v: 20 }],
    show: v => ({ W: v.geo === 'plate', Ts: v.geo !== 'wb' }),
    async run(v) {
      await U.TR.load(); await U.need('water'); const Fw = await U.fluid('water');
      const Tf = v.geo === 'wb' ? v.Tinf : (v.Tinf + v.Ts) / 2, p = U.TR.get('air', Tf + K), D = U.Dh2oair(Tf + K, 101325), Sc = p.nu / D, Le = p.alpha / D;
      const rhov = (TC, phi) => phi * Fw.satT(TC + K).P / (461.5 * (TC + K));
      const ShNu = (Re, X) => v.geo === 'plate' ? (Re < 5e5 ? 0.664 * Math.sqrt(Re) * Math.cbrt(X) : (0.037 * Math.pow(Re, 0.8) - 871) * Math.cbrt(X)) : v.geo === 'sph' ? 2 + 0.6 * Math.sqrt(Re) * Math.cbrt(X) : 0.3 + 0.62 * Math.sqrt(Re) * Math.cbrt(X) / Math.pow(1 + Math.pow(0.4 / X, 2 / 3), 0.25);
      const Re = v.V * v.L / p.nu, hh = ShNu(Re, p.Pr) * p.k / v.L, hm = ShNu(Re, Sc) * D / v.L;
      if (v.geo === 'wb') {
        const rinf = rhov(v.Tinf, v.phi / 100);
        const Ts = U.brent(T => hh * (v.Tinf - T) - 2.45e6 * hm * (rhov(T, 1) - rinf), -10, v.Tinf);
        return { out: [['Wet-bulb temperature', Ts, '°C', 1], ['h', hh, 'W/m²K'], ['h<sub>m</sub>', hm, 'm/s'], ['Sc', Sc, ''], ['Le', Le, ''], ['D (H₂O–air)', D, 'm²/s']], html: '<p class="small muted">Compare with the adiabatic-saturation (thermodynamic) wet-bulb from the psychrometric solver — for air–water Le ≈ 0.85, which is why the two nearly coincide (Lewis relation).</p>' };
      }
      const A = v.geo === 'plate' ? v.L * v.W : Math.PI * v.L * v.L;
      const mv = hm * A * (rhov(v.Ts, 1) - rhov(v.Tinf, v.phi / 100)), hfg = Fw.satT(v.Ts + K).hfg;
      return { out: [['Evaporation rate', mv * 3600, 'kg/h', 1], ['h<sub>m</sub>', hm, 'm/s', 1], ['Evaporative heat loss', mv * hfg * 1e3, 'W'], ['Convective heat gain h A (T∞−Ts)', hh * A * (v.Tinf - v.Ts), 'W'], ['h', hh, 'W/m²K'], ['Re', Re, ''], ['Sc / Le', U.fmt(Sc, 3) + ' / ' + U.fmt(Le, 3), ''], ['Chilton–Colburn h/(h<sub>m</sub>ρc<sub>p</sub>Le<sup>2/3</sup>)', hh / (hm * p.rho * p.cp * Math.pow(Le, 2 / 3)), '≈1']], html: propLine2(p, Tf) };
    }
  });
  const propLine2 = (p, T) => U.propLine ? U.propLine(p, T, 'film temperature') : '';
})();
