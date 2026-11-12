/* Narrated lesson scripts — Heat & Mass Transfer */
'use strict';
(() => {
  const L = U.addLesson;
  L('ht-intro', [
    ['title', 'Modes of heat transfer', 'Conduction, convection, radiation', 'Thermodynamics tells us how much energy moves. Heat transfer tells us how fast. This lesson introduces the three modes.'],
    ['anim', 'modes', 'Three mechanisms', 'In conduction, energy passes between vibrating particles. In convection, moving fluid carries it away. In radiation, electromagnetic waves carry it, even through vacuum.'],
    ['eq', 'The three rate laws', R`\dot q''=-k\frac{dT}{dx}\qquad\dot q''=h(T_s-T_\infty)\qquad\dot q''=\varepsilon\sigma(T_s^4-T_{sur}^4)`, [['k', 'thermal conductivity'], ['h', 'convection coefficient'], ['σ', '5.67×10⁻⁸ W/m²K⁴']], 'Fourier’s law for conduction, Newton’s law of cooling for convection, and the Stefan Boltzmann law for radiation. Use kelvin in the radiation law.'],
    ['q', 2],
    ['bul', 'Typical values', ['k: copper 401, steel 15–60, water 0.6, air 0.026 W/m·K', 'h: free convection in air 2–25 W/m²K', 'h: forced liquids up to 20 000; boiling up to 100 000', 'α = k/ρc: how fast a material responds'], 'Remember typical magnitudes: copper conducts fifteen thousand times better than air, and boiling gives the highest heat transfer coefficients.'],
    ['q', 5],
    ['sum', ['Conduction, convection, radiation', 'h is not a property', 'Radiation needs T in kelvin', 'Surface energy balance: conduction in = convection + radiation out'], 'Summary: three modes, three laws, and a surface energy balance links them.'],
    ['links', 'ht-intro', 'Next: steady conduction.']
  ]);
  L('ht-cond1', [
    ['title', 'Steady one-dimensional conduction', 'Walls, pipes, spheres and generation', 'This lesson shows how to calculate steady heat flow through layers using thermal resistances.'],
    ['anim', 'wall', 'Thermal resistance network', 'Change the conductivities and the insulation thickness. The steepest temperature drop occurs where the resistance is largest.'],
    ['fig', 'resist', 'Resistances in series', 'Heat flow equals total temperature difference divided by the sum of resistances, exactly like current in a series circuit.'],
    ['eq', 'Resistances', R`R_{wall}=\frac{L}{kA},\quad R_{cyl}=\frac{\ln(r_2/r_1)}{2\pi kL},\quad R_{sph}=\frac{r_2-r_1}{4\pi kr_1r_2},\quad R_{conv}=\frac{1}{hA}`, [], 'Each geometry has its own conduction resistance. For pipes, use the logarithmic form.'],
    ['q', 1],
    ['eq', 'Critical radius of insulation', R`r_{cr}=\frac{k}{h}\ \text{(cylinder)},\quad\frac{2k}{h}\ \text{(sphere)}`, [], 'For thin wires, adding a little insulation can increase heat loss until the critical radius is reached. That helps electrical cables stay cool.'],
    ['eq', 'Internal heat generation', R`T_0-T_s=\frac{\dot g r_0^2}{4k}\ \text{(cylinder)},\qquad T_s=T_\infty+\frac{\dot g r_0}{2h}`, [], 'With internal heat generation, the temperature profile is parabolic and the centre is hottest.'],
    ['q', 3],
    ['sum', ['Q = ΔT / ΣR', 'Logarithmic resistance for pipes', 'Check critical radius for small wires', 'Generation gives parabolic profiles'], 'Summary: resistance networks solve most steady conduction problems.'],
    ['links', 'ht-cond1', 'Try the composite wall solver.']
  ]);
  L('ht-fins', [
    ['title', 'Fins & extended surfaces', 'More area, more heat', 'When the convection coefficient is small, we add area with fins. This lesson explains fin performance.'],
    ['anim', 'finanim', 'Temperature along a fin', 'The fin is hottest at the base and cools towards the tip. Increase m L and see how the far end contributes less and less.'],
    ['eq', 'Fin parameter and heat rate', R`m=\sqrt{\frac{hP}{kA_c}},\qquad\dot q_f=\sqrt{hPkA_c}\,\theta_b\tanh(mL)`, [['θ_b', 'T_b − T∞'], ['adiabatic tip', 'tanh formula']], 'The fin parameter m combines convection and conduction. For an adiabatic tip, fin heat equals the square root of h P k A c times theta b times tanh m L.'],
    ['eq', 'Efficiency and effectiveness', R`\eta_f=\frac{\dot q_f}{hA_f\theta_b},\qquad\varepsilon_f=\frac{\dot q_f}{hA_c\theta_b}`, [['η_f', 'less than 1'], ['ε_f', 'should exceed 2']], 'Efficiency compares the fin with an ideal fin at base temperature. Effectiveness compares it with no fin at all. A useful fin has effectiveness above two.'],
    ['q', 0],
    ['q', 4],
    ['sum', ['Fins help most when h is low and k is high', 'mL ≈ 1–1.5 is efficient', 'Use corrected length Lc for tip convection'], 'Use fins on the low h side, with high conductivity material, and keep m L moderate.'],
    ['links', 'ht-fins', 'Design a heat sink with the fin solver and the fin efficiency chart.']
  ]);
  L('ht-cond2d', [
    ['title', 'Two-dimensional conduction', 'Shape factors and finite differences', 'Some problems are two dimensional: buried pipes, corners and plates with several boundary temperatures.'],
    ['eq', 'Laplace equation and shape factor', R`\nabla^2T=0,\qquad\dot Q=Sk\Delta T`, [['S', 'shape factor in metres']], 'Without generation, steady temperature satisfies the Laplace equation. For standard geometries the heat flow is shape factor times k times delta T.'],
    ['eq', 'Finite-difference node', R`T_{m,n}=\tfrac14\left(T_{m+1,n}+T_{m-1,n}+T_{m,n+1}+T_{m,n-1}\right)`, [], 'On a square grid, each interior node equals the average of its four neighbours. Boundary nodes use energy balances on half cells.'],
    ['q', 0],
    ['bul', 'Solving numerically', ['Write one equation per node', 'Gauss–Seidel iteration with over-relaxation', 'Stop when changes are tiny; check the energy balance', 'Refine the grid until results stop changing'], 'Solve the node equations iteratively, check that heat in equals heat out, and refine the grid until the answer stops changing.'],
    ['q', 1],
    ['sum', ['Shape factors for standard geometries', 'Nodal equations from energy balances', 'Always verify with an energy balance'], 'Shape factors for quick answers, finite differences for anything else.'],
    ['links', 'ht-cond2d', 'Solve a plate in the two dimensional finite difference solver.']
  ]);
  L('ht-transient', [
    ['title', 'Transient conduction', 'Heating and cooling with time', 'When temperatures change with time — quenching, cooking, annealing — we need transient conduction.'],
    ['eq', 'Biot and Fourier numbers', R`Bi=\frac{hL}{k},\qquad Fo=\frac{\alpha t}{L^2}`, [['Bi', 'internal ÷ external resistance'], ['Fo', 'dimensionless time']], 'The Biot number compares internal and surface resistance. The Fourier number is dimensionless time.'],
    ['anim', 'transient', 'Effect of Biot number', 'Change the Biot number. At low Bi, the slab cools uniformly. At high Bi, the surface drops at once and the centre lags behind.'],
    ['eq', 'Lumped capacitance', R`\frac{T-T_\infty}{T_i-T_\infty}=e^{-t/\tau},\qquad\tau=\frac{\rho Vc}{hA_s},\quad Bi<0.1`, [], 'If Bi is below 0.1, temperature decays exponentially with time constant rho V c over h A.'],
    ['q', 0],
    ['bul', 'When Bi > 0.1', ['Heisler/Gröber charts or the series solution', 'Use half-thickness or r₀ (not V/A) for Bi and Fo', 'One-term approximation valid for Fo > 0.2', 'Early times: semi-infinite solid with erf'], 'For larger Biot numbers use the Heisler charts or the exact series. At early times, treat the body as semi infinite.'],
    ['anim', 'quench', 'Quenching', 'In real quenching, h changes enormously: vapour blanket, then nucleate boiling, then convection.'],
    ['q', 2],
    ['sum', ['Compute Bi first', 'Lumped if Bi < 0.1', 'Heisler charts / series otherwise', 'Quenching: h varies with surface temperature'], 'Always compute the Biot number first; it tells you which method to use.'],
    ['links', 'ht-transient', 'Use the transient solver and the Heisler charts in the data book.']
  ]);
  L('ht-external', [
    ['title', 'Convection over bodies', 'Boundary layers and correlations', 'This lesson explains boundary layers and how to find h for flow over plates, cylinders and spheres.'],
    ['anim', 'bl', 'Boundary layers', 'Fluid sticks to the wall, so a velocity boundary layer grows along the plate. Heat diffuses into the slow fluid, forming a thermal boundary layer. The Prandtl number sets their ratio.'],
    ['fig', 'blprof', 'Profiles near the wall', 'Heat transfer is set by the temperature gradient right at the wall.'],
    ['eq', 'Dimensionless groups', R`Re=\frac{VL}{\nu},\quad Pr=\frac{\nu}{\alpha},\quad Nu=\frac{hL}{k}=f(Re,Pr)`, [], 'Forced convection correlations give Nusselt number as a function of Reynolds and Prandtl numbers.'],
    ['eq', 'Flat plate', R`\overline{Nu}=0.664Re_L^{1/2}Pr^{1/3}\ \text{(laminar)},\quad(0.037Re_L^{0.8}-871)Pr^{1/3}\ \text{(mixed)}`, [['properties', 'at film temperature']], 'For a flat plate, use the laminar correlation below a Reynolds number of five times ten to the five, and the mixed one above it. Evaluate properties at the film temperature.'],
    ['q', 1],
    ['bul', 'Other geometries', ['Cylinder: Churchill–Bernstein or Hilpert', 'Sphere: Whitaker (Nu → 2 at Re → 0)', 'Tube banks: Žukauskas with V_max'], 'For cylinders, spheres and tube banks, use the correlations in the data book correlation selector.'],
    ['q', 2],
    ['sum', ['Film temperature for properties', 'Re decides laminar or turbulent', 'Nu → h = Nu k/L'], 'Find properties at film temperature, compute Re, pick the correlation, and convert Nu to h.'],
    ['links', 'ht-external', 'Use the data book navigator: air over a body.']
  ]);
  L('ht-internal', [
    ['title', 'Convection inside pipes', 'Internal flow', 'This lesson covers convection inside tubes and ducts, the heart of heat exchangers.'],
    ['anim', 'pipe', 'Entry and fully developed flow', 'Near the inlet the boundary layers grow. Downstream the profile becomes fully developed: parabolic in laminar flow, flatter in turbulent flow.'],
    ['eq', 'Key results', R`Re=\frac{4\dot m}{\pi D\mu},\quad Nu=3.66\ (T_s),\ 4.36\ (q''),\quad Nu=0.023Re^{0.8}Pr^n`, [['laminar', 'Re < 2300'], ['properties', 'bulk mean T']], 'Laminar fully developed flow has constant Nusselt numbers. For turbulent flow use Dittus Boelter or, better, Gnielinski. Use bulk mean properties.'],
    ['eq', 'Outlet temperature', R`\frac{T_s-T_e}{T_s-T_i}=\exp\left(-\frac{hA_s}{\dot mc_p}\right),\quad\dot Q=hA_s\Delta T_{lm}`, [], 'With constant wall temperature, the fluid approaches wall temperature exponentially, and heat rate uses the log mean temperature difference.'],
    ['q', 0],
    ['q', 1],
    ['sum', ['Bulk mean temperature for properties', 'LMTD, not arithmetic mean', 'f from Moody chart for ΔP'], 'Use bulk mean properties, the log mean temperature difference, and the Moody chart for pressure drop.'],
    ['links', 'ht-internal', 'Solve pipe problems with the internal flow solver.']
  ]);
  L('ht-natural', [
    ['title', 'Natural convection', 'Buoyancy-driven flow', 'When no fan or pump is present, buoyancy drives the flow. This is natural convection.'],
    ['anim', 'natconv', 'Flow along a heated plate', 'Fluid near the hot plate becomes lighter and rises, drawing in cooler fluid from the side.'],
    ['eq', 'Rayleigh number', R`Ra=\frac{g\beta\Delta TL^3}{\nu\alpha},\qquad\beta=\frac1T\ \text{(ideal gas)}`, [['Ra < 10⁹', 'laminar (vertical plate)']], 'The Rayleigh number governs natural convection. For gases, beta is one over absolute film temperature.'],
    ['eq', 'Vertical plate', R`\overline{Nu}=\left\{0.825+\frac{0.387Ra^{1/6}}{[1+(0.492/Pr)^{9/16}]^{8/27}}\right\}^2`, [], 'The Churchill Chu correlation covers the whole range of Rayleigh numbers for vertical plates.'],
    ['q', 0],
    ['q', 4],
    ['sum', ['h is small (2–25 W/m²K in gases)', 'Horizontal plates use L = A/P', 'Add radiation — often comparable'], 'Natural convection coefficients are small, so radiation often matters just as much.'],
    ['links', 'ht-natural', 'Try the natural convection solver.']
  ]);
  L('ht-boilcond', [
    ['title', 'Boiling & condensation', 'Phase-change heat transfer', 'Phase change gives the highest heat transfer coefficients. This lesson covers boiling, condensation and quenching.'],
    ['anim', 'boiling', 'Regimes of boiling', 'Increase the excess temperature and watch the regimes: natural convection, nucleate boiling, the critical heat flux, transition, and film boiling.'],
    ['fig', 'boilcurve', 'The boiling curve', 'Points on the boiling curve: onset of boiling, critical heat flux, and the Leidenfrost point.'],
    ['eq', 'Key correlations', R`\dot q''\propto\Delta T_e^3\ (\text{Rohsenow}),\qquad\dot q''_{max}=0.149h_{fg}\rho_v\left[\frac{\sigma g(\rho_l-\rho_v)}{\rho_v^2}\right]^{1/4}`, [], 'In nucleate boiling, heat flux rises with the cube of excess temperature. The critical heat flux limits safe operation.'],
    ['q', 0],
    ['anim', 'quench', 'Quenching runs the curve backwards', 'A quenched part travels the boiling curve backwards: vapour blanket first, then nucleate boiling where cooling is fastest, then convection.'],
    ['eq', 'Film condensation', R`\bar h=0.943\left[\frac{g\rho_l(\rho_l-\rho_v)k_l^3h'_{fg}}{\mu_l(T_{sat}-T_s)L}\right]^{1/4}`, [], 'Nusselt’s theory gives the condensation coefficient on a vertical plate. Dropwise condensation is ten times better but hard to sustain.'],
    ['q', 7],
    ['sum', ['ΔTe = Ts − Tsat', 'Never exceed CHF in flux-controlled heaters', 'Quench: film → nucleate → convection'], 'Keep heaters below the critical heat flux, and remember the three stages of quenching.'],
    ['links', 'ht-boilcond', 'Explore the boiling and condensation solvers.']
  ]);
  L('ht-hx', [
    ['title', 'Heat exchangers', 'LMTD and effectiveness–NTU', 'This lesson shows the two methods used to design and rate heat exchangers.'],
    ['anim', 'hxflow', 'Parallel vs counter flow', 'Compare parallel and counter flow. Counter flow keeps a more uniform temperature difference and can even heat the cold fluid above the hot outlet.'],
    ['eq', 'LMTD method', R`\dot Q=UAF\Delta T_{lm},\qquad\Delta T_{lm}=\frac{\Delta T_1-\Delta T_2}{\ln(\Delta T_1/\Delta T_2)}`, [['F', 'correction factor ≤ 1 (multipass)']], 'When all temperatures are known, use the log mean temperature difference with a correction factor for multipass exchangers.'],
    ['eq', 'ε–NTU method', R`\varepsilon=\frac{\dot Q}{C_{min}(T_{h,i}-T_{c,i})},\qquad NTU=\frac{UA}{C_{min}}`, [], 'When outlet temperatures are unknown, use effectiveness and the number of transfer units.'],
    ['fig', 'epsntu', 'Effectiveness charts', 'Effectiveness rises with NTU but with diminishing returns. Counter flow always gives the highest effectiveness.'],
    ['q', 1],
    ['q', 4],
    ['sum', ['Sizing: LMTD', 'Rating: ε–NTU', 'Q_max uses C_min', 'Phase change: ε = 1 − e^(−NTU)'], 'Use LMTD for sizing, effectiveness NTU for rating, and remember Q max uses C min.'],
    ['links', 'ht-hx', 'Design one with the heat exchanger solver and the F charts.']
  ]);
  L('ht-rad1', [
    ['title', 'Radiation fundamentals', 'Blackbodies and real surfaces', 'Every hot body emits radiation. This lesson covers blackbody laws and surface properties.'],
    ['anim', 'planck', 'Planck spectrum', 'Raise the temperature. Emission grows as T to the fourth, and the peak shifts to shorter wavelengths, which is why hot steel glows red, then orange.'],
    ['eq', 'Blackbody laws', R`E_b=\sigma T^4,\qquad\lambda_{max}T=2897.8\ \mu\mathrm{m\,K}`, [], 'The Stefan Boltzmann law gives total emission. Wien’s law gives the peak wavelength.'],
    ['fig', 'planck', 'Spectra at different temperatures', 'The sun peaks in the visible; a room-temperature wall peaks near ten micrometres in the infrared.'],
    ['bul', 'Surface properties', ['ε = E/E_b; α + ρ + τ = 1', 'Kirchhoff: ε_λ = α_λ', 'Gray surface: properties independent of λ', 'Polished metals ε ≈ 0.05; paints ≈ 0.9'], 'Real surfaces emit a fraction epsilon of blackbody radiation. Kirchhoff’s law says emissivity equals absorptivity at each wavelength.'],
    ['q', 0],
    ['q', 2],
    ['sum', ['T⁴ dependence — use kelvin', 'Peak shifts with temperature', 'Selective surfaces: high α_solar, low ε_IR'], 'Radiation grows as T to the fourth, and surface finish matters enormously.'],
    ['links', 'ht-rad1', 'Compute band fractions with the blackbody solver.']
  ]);
  L('ht-rad2', [
    ['title', 'Radiation exchange', 'View factors and networks', 'This lesson shows how to calculate radiation exchange between surfaces.'],
    ['bul', 'View factor rules', ['F_ij = fraction leaving i that reaches j', 'Reciprocity: A_iF_ij = A_jF_ji', 'Summation: ΣF_ij = 1', 'Flat or convex surface: F_ii = 0'], 'The view factor is the fraction of radiation leaving one surface that strikes another. Reciprocity and summation rules let us find unknown factors.'],
    ['eq', 'Two-surface enclosure', R`\dot Q_{12}=\frac{\sigma(T_1^4-T_2^4)}{\frac{1-\varepsilon_1}{\varepsilon_1A_1}+\frac{1}{A_1F_{12}}+\frac{1-\varepsilon_2}{\varepsilon_2A_2}}`, [['surface resistance', '(1−ε)/εA'], ['space resistance', '1/A₁F₁₂']], 'Exchange between two gray surfaces is like a circuit with two surface resistances and one space resistance.'],
    ['q', 0],
    ['bul', 'Radiation shields', ['Each shield adds two surface and one space resistance', 'Low-ε shields cut radiation drastically', 'Used in vacuum furnaces, cryogenics, thermocouples'], 'A thin shiny shield between two surfaces greatly reduces radiation, which is how multilayer insulation works.'],
    ['q', 4],
    ['sum', ['View factors from charts or formulas', 'Radiosity network for gray enclosures', 'Shields reduce radiation'], 'Find view factors, build the resistance network, and solve.'],
    ['links', 'ht-rad2', 'Solve enclosures with the N surface solver.']
  ]);
  L('mt-diffusion', [
    ['title', 'Mass transfer & diffusion', 'Fick’s law', 'Mass transfer moves species by concentration differences, just as heat moves by temperature differences.'],
    ['anim', 'diffusion', 'Random walks', 'Each molecule moves randomly, yet more cross from the crowded side, giving a net flux down the concentration gradient.'],
    ['eq', 'Fick’s law', R`j_A=-\rho D_{AB}\frac{dw_A}{dx}`, [['D_AB', 'gases ~10⁻⁵, liquids ~10⁻⁹, solids ~10⁻¹² m²/s']], 'Fick’s law has the same form as Fourier’s law, with diffusivity in place of conductivity.'],
    ['q', 1],
    ['bul', 'Steady diffusion cases', ['Stationary medium: same resistances as conduction', 'Membranes: permeability = D × solubility', 'Stefan tube: bulk flow enhances evaporation', 'Interface concentrations are discontinuous'], 'Diffusion through walls uses the conduction analogy. Evaporation through stagnant gas needs the Stefan flow correction.'],
    ['q', 5],
    ['sum', ['Fick ↔ Fourier', 'Gases diffuse much faster than solids', 'Concentration jumps at interfaces'], 'Use the heat conduction analogy, but remember concentration is discontinuous at interfaces.'],
    ['links', 'mt-diffusion', 'Estimate diffusion coefficients with the Fuller solver.']
  ]);
  L('mt-transient', [
    ['title', 'Transient diffusion & carburizing', 'Case hardening by diffusion', 'This lesson applies transient diffusion to carburizing and nitriding of steel.'],
    ['eq', 'Erf solution', R`\frac{C_s-C_x}{C_s-C_0}=\mathrm{erf}\frac{x}{2\sqrt{Dt}}`, [], 'With constant surface carbon, the profile follows the error function, exactly like transient conduction into a thick solid.'],
    ['fig', 'erf', 'Error function', 'Read the error function from the chart or table to find depth or time.'],
    ['eq', 'Arrhenius diffusivity', R`D=D_0e^{-Q/RT}`, [['C in γ-Fe', 'D₀ = 2.3×10⁻⁵ m²/s, Q = 148 kJ/mol']], 'Diffusivity rises exponentially with temperature, so carburizing hotter is much faster.'],
    ['q', 0],
    ['q', 1],
    ['sum', ['Depth ∝ √(Dt)', 'Double depth ⇒ four times the time', 'Higher T ⇒ exponentially faster'], 'Case depth grows with the square root of time, and temperature has an exponential effect.'],
    ['links', 'mt-transient', 'Plan a carburizing cycle with the diffusion solver.']
  ]);
  L('mt-convective', [
    ['title', 'Convective mass transfer', 'The heat–mass analogy', 'Evaporation, drying and humidification are convective mass transfer. This lesson uses the heat mass analogy.'],
    ['eq', 'Analogous numbers', R`Sh=\frac{h_mL}{D},\quad Sc=\frac{\nu}{D},\quad Le=\frac{\alpha}{D}`, [['Sh ↔ Nu', ''], ['Sc ↔ Pr', '']], 'Replace Nusselt by Sherwood and Prandtl by Schmidt, and any heat transfer correlation becomes a mass transfer correlation.'],
    ['eq', 'Chilton–Colburn', R`\frac{h}{h_m}=\rho c_pLe^{2/3}`, [], 'The Chilton Colburn analogy links heat and mass transfer coefficients directly.'],
    ['q', 0],
    ['bul', 'Applications', ['Evaporation from pools and droplets', 'Wet-bulb thermometer', 'Cooling towers and evaporative coolers', 'Drying of solids'], 'The analogy explains the wet bulb thermometer, cooling towers and drying.'],
    ['q', 3],
    ['sum', ['Swap Pr→Sc, Nu→Sh', 'Le ≈ 1 for air–water', 'ṁ = h_m A Δρ_v'], 'Use the analogy, and remember evaporation rate equals h m times area times the vapour density difference.'],
    ['links', 'mt-convective', 'Compute evaporation rates with the convective mass transfer solver.']
  ]);
})();
