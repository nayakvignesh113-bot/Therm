/* Narrated lesson scripts — Thermodynamics */
'use strict';
(() => {
  const L = U.addLesson;
  L('td-basics', [
    ['title', 'Basic concepts & the zeroth law', 'The vocabulary of thermodynamics', 'Welcome. In this lesson we build the vocabulary of thermodynamics: systems, properties, states, processes, and the zeroth law that makes temperature measurable.'],
    ['bul', 'Choosing a system', ['<b>Closed system</b>: fixed mass; heat and work can cross the boundary', '<b>Open system</b> or control volume: mass flows in and out', '<b>Isolated system</b>: neither mass nor energy crosses', 'The boundary can be real or imaginary, fixed or moving'], 'Every problem starts by drawing a boundary. If no mass crosses it, we have a closed system, like gas in a piston cylinder. If mass flows through, like steam through a turbine, it is a control volume. An isolated system exchanges nothing at all.'],
    ['bul', 'Properties and state', ['<b>Intensive</b>: independent of size — T, P, ρ', '<b>Extensive</b>: proportional to mass — V, U, H', 'Specific property = extensive ÷ mass, e.g. v = V/m', '<b>State postulate</b>: two independent intensive properties fix the state'], 'Properties describe a state. Intensive ones like temperature and pressure do not depend on size; extensive ones like volume do. The state postulate says two independent intensive properties fix the state of a simple compressible substance. But careful: during boiling, temperature and pressure are not independent.'],
    ['anim', 'piston', 'A process on a property diagram', 'A process takes a system from one equilibrium state to another. If it happens slowly enough to stay near equilibrium, we call it quasi-static, and we can draw its path on a diagram, like this pressure volume plot.'],
    ['eq', 'Temperature and pressure scales', R`T[\mathrm K]=T[^\circ\mathrm C]+273.15\qquad P_{abs}=P_{atm}+P_{gauge}`, [['K', 'absolute temperature — always use it in equations'], ['gauge', 'reading of most pressure gauges'], ['ΔT', '1 K equals 1 °C for differences']], 'The zeroth law says that two bodies in thermal equilibrium with a third are in equilibrium with each other. That is why a thermometer works. In all thermodynamic equations use absolute temperature in kelvin and absolute pressure, not gauge pressure.'],
    ['q', 0],
    ['eq', 'Hydrostatics and manometers', R`\Delta P=\rho g h`, [['ρ', 'density of manometer fluid'], ['h', 'height difference']], 'Pressure in a fluid increases with depth as rho g h. A manometer uses this: the height difference of a liquid column measures the pressure difference.'],
    ['q', 3],
    ['sum', ['Draw the boundary first: closed, open or isolated', 'Two independent intensive properties fix a state', 'Quasi-static processes can be drawn on diagrams', 'Use kelvin and absolute pressure in all relations'], 'To summarise: draw the boundary, identify the state with two independent properties, and always use absolute temperature and pressure.'],
    ['links', 'td-basics', 'Now read the full module and try the practice questions.']
  ]);
  L('td-energy', [
    ['title', 'Energy, work, heat & the first law', 'Closed systems', 'In this lesson we meet the first law of thermodynamics for closed systems: energy is conserved, and it crosses the boundary only as heat or work.'],
    ['bul', 'Heat and work', ['Energy crosses a closed boundary only as <b>heat</b> (due to ΔT) or <b>work</b>', 'Both are <b>path functions</b> — never write ΔQ or ΔW', 'Internal energy U is a <b>property</b>'], 'Heat is energy transfer driven by a temperature difference. Everything else is work. Both depend on the path taken, so they are not properties. Internal energy, on the other hand, is a property.'],
    ['anim', 'piston', 'Boundary work is the area under the P–V curve', 'Watch the piston. As it moves, the gas does boundary work equal to the area under the pressure volume curve. Change the process and see how the work and heat change.'],
    ['eq', 'Boundary work for common processes', R`W_b=\int P\,dV:\quad P(V_2-V_1),\;\;P_1V_1\ln\frac{V_2}{V_1},\;\;\frac{P_2V_2-P_1V_1}{1-n}`, [['isobaric', 'P constant'], ['isothermal', 'ideal gas, PV constant'], ['polytropic', 'PVⁿ constant']], 'For constant pressure, work is P times the volume change. For an isothermal ideal gas it is P one V one times the log of the volume ratio. For a polytropic process it is P two V two minus P one V one over one minus n.'],
    ['eq', 'The first law', R`Q-W=\Delta U+\Delta KE+\Delta PE`, [['Q', 'heat into the system'], ['W', 'work done by the system'], ['ΔU', 'change of internal energy']], 'The first law: heat in minus work out equals the change of energy of the system. For a cycle, the net heat equals the net work.'],
    ['q', 0],
    ['eq', 'Specific heats', R`du=c_v\,dT,\quad dh=c_p\,dT,\quad c_p-c_v=R`, [['h = u + Pv', 'enthalpy'], ['solids, liquids', 'c_p ≈ c_v = c']], 'For an ideal gas, du equals c v d T and dh equals c p d T for any process. The difference c p minus c v equals the gas constant. For solids and liquids the two specific heats are almost equal.'],
    ['q', 2],
    ['sum', ['W and Q are path functions; U is a property', 'Boundary work = ∫P dV = area under the P–V curve', 'Q − W = ΔU for closed systems', 'Ideal gas: Δu = c_v ΔT for every process'], 'Remember: work is the area under the P V curve, the first law balances heat, work and internal energy, and for ideal gases delta u is always c v delta T.'],
    ['links', 'td-energy', 'Try the polytropic and quench-bath problems next.']
  ]);
  L('td-pure', [
    ['title', 'Pure substances & property tables', 'Phases, the vapour dome and quality', 'This lesson explains how a pure substance like water changes phase, and how to use steam tables.'],
    ['anim', 'phase', 'Heating water at constant pressure', 'Watch water being heated at constant pressure. First the liquid warms up. Then it boils at a fixed saturation temperature while the quality rises from zero to one. Finally the vapour superheats.'],
    ['bul', 'Five regions', ['Compressed (subcooled) liquid: T < T_sat', 'Saturated liquid: x = 0', 'Saturated mixture: 0 < x < 1', 'Saturated vapour: x = 1', 'Superheated vapour: T > T_sat'], 'There are five regions: compressed liquid, saturated liquid, wet mixture, saturated vapour, and superheated vapour. Identifying the region is the first step of every steam problem.'],
    ['eq', 'Quality and mixture properties', R`x=\frac{m_g}{m},\qquad y=y_f+x\,(y_g-y_f)`, [['y', 'v, u, h or s'], ['f, g', 'saturated liquid, saturated vapour']], 'Quality x is the mass fraction of vapour. Any mixture property equals the liquid value plus x times the difference between vapour and liquid values.'],
    ['bul', 'Table look-up procedure', ['Given P and T: compare T with T_sat(P)', 'Given P and h (or v, s): compare with h_f and h_g', 'Inside the dome find x; outside use superheated or compressed-liquid tables', 'Compressed liquid: y ≈ y_f(T)'], 'To use the tables: compare the given temperature with the saturation temperature, or the given enthalpy with h f and h g. That tells you which table to open.'],
    ['q', 0],
    ['fig', 'tsdome', 'Isobars on the T–s diagram', 'On the temperature entropy diagram, isobars are flat inside the dome. Above the critical pressure, 22 megapascals, there is no flat part at all: no distinct boiling.'],
    ['q', 2],
    ['sum', ['Identify the region before reading any table', 'x is defined only inside the dome', 'y = y_f + x·y_fg', 'Never use the ideal-gas law for steam near saturation'], 'Summary: find the region first, use quality only inside the dome, and avoid the ideal gas law near saturation.'],
    ['links', 'td-pure', 'Use the property calculator to check your table readings.']
  ]);
  L('td-idealgas', [
    ['title', 'Ideal & real gases', 'When PV = mRT works, and when it doesn’t', 'In this lesson we look at the ideal gas law, the compressibility factor, and real-gas equations of state.'],
    ['eq', 'Ideal-gas equation of state', R`PV=mRT,\qquad R=\frac{\bar R}{M},\;\bar R=8.314\ \mathrm{kJ/kmol\,K}`, [['R air', '0.287 kJ/kg·K'], ['T', 'kelvin'], ['P', 'absolute']], 'The ideal gas law: P V equals m R T, where R is the universal gas constant divided by molar mass. For air, R is 0.287 kilojoules per kilogram kelvin.'],
    ['bul', 'When is a gas ideal?', ['Low density: low pressure and/or high temperature', 'Reduced pressure P_R ≪ 1 or reduced temperature T_R > 2', 'Air, combustion gases, water vapour in the atmosphere: ideal', 'Steam near saturation, refrigerants, CO₂ near 7 MPa: NOT ideal'], 'A gas behaves ideally when its molecules are far apart, that is, at low pressure or high temperature compared with its critical point.'],
    ['eq', 'Compressibility factor', R`Z=\frac{Pv}{RT},\qquad P_R=\frac{P}{P_{cr}},\;T_R=\frac{T}{T_{cr}}`, [['Z = 1', 'ideal'], ['Z < 1', 'attraction dominates'], ['Z > 1', 'repulsion dominates']], 'The compressibility factor Z measures the deviation from ideal behaviour. By the principle of corresponding states, all gases have roughly the same Z at the same reduced pressure and temperature.'],
    ['q', 0],
    ['eq', 'van der Waals and Peng–Robinson', R`\left(P+\frac{a}{v^2}\right)(v-b)=RT\qquad P=\frac{RT}{v-b}-\frac{a\alpha}{v^2+2bv-b^2}`, [['a', 'attraction'], ['b', 'molecular volume'], ['α(T, ω)', 'Peng–Robinson temperature function']], 'Van der Waals added two corrections: a for attraction and b for the volume of molecules. Peng Robinson improves accuracy using the acentric factor, and is widely used in industry.'],
    ['q', 1],
    ['sum', ['PV = mRT with absolute P and T', 'Check P_R and T_R before assuming ideal behaviour', 'Z from charts or cubic equations of state', 'Peng–Robinson is the industrial workhorse'], 'Summary: use the ideal gas law with absolute units, check reduced properties, and use Z or a cubic equation of state for real gases.'],
    ['links', 'td-idealgas', 'Compare ideal gas, van der Waals and Peng Robinson in the real gas solver.']
  ]);
  L('td-cv', [
    ['title', 'First law for control volumes', 'Nozzles, turbines, pumps, valves, heat exchangers', 'This lesson applies the first law to devices with flowing fluid: the steady flow energy equation.'],
    ['eq', 'Mass and energy for steady flow', R`\dot Q-\dot W=\dot m\left[(h_2-h_1)+\frac{V_2^2-V_1^2}{2}+g(z_2-z_1)\right]`, [['h = u + Pv', 'flowing fluid carries flow work'], ['V²/2', 'J/kg — divide by 1000 for kJ/kg']], 'For steady flow, mass in equals mass out, and the energy equation uses enthalpy, because flowing fluid carries flow work P v with it.'],
    ['anim', 'nozzle', 'Nozzle, diffuser and throttle', 'In a nozzle, enthalpy turns into kinetic energy. A diffuser does the reverse. A throttling valve drops the pressure but keeps the enthalpy constant.'],
    ['bul', 'Device assumptions', ['Nozzle/diffuser: q ≈ 0, w = 0 ⇒ h + V²/2 conserved', 'Turbine: w_out = h₁ − h₂ (adiabatic)', 'Compressor/pump: w_in = h₂ − h₁; pump ≈ vΔP', 'Throttle: h₂ = h₁', 'Mixing chamber & heat exchanger: Σṁh_in = Σṁh_out'], 'Each device has standard simplifications. Turbines and compressors are usually adiabatic, nozzles have no work, throttles keep enthalpy constant, and mixers and heat exchangers balance enthalpy flows.'],
    ['q', 0],
    ['eq', 'Unsteady flow: filling a tank', R`m_2u_2-m_1u_1=m_ih_i\quad\Rightarrow\quad T_2=kT_{line}\ (\text{evacuated tank})`, [['u in tank', 'h of incoming gas']], 'When an evacuated tank is filled from a line, the incoming enthalpy becomes internal energy in the tank. For air the final temperature is 1.4 times the line temperature in kelvin.'],
    ['q', 2],
    ['sum', ['Use h, not u, for flowing streams', 'Convert V²/2 to kJ/kg', 'Throttling is isenthalpic', 'Tank filling: tank gets hotter than the line'], 'Summary: enthalpy for streams, convert kinetic energy units, throttling keeps h constant, and filling a tank heats the gas.'],
    ['links', 'td-cv', 'Use the steady flow device solver to check turbine and nozzle problems.']
  ]);
  L('td-second', [
    ['title', 'The second law & Carnot', 'Why processes have a direction', 'The first law conserves energy, but it cannot tell us which way processes go. That is the job of the second law.'],
    ['bul', 'Two statements', ['<b>Kelvin–Planck</b>: no cyclic device can convert all heat from one reservoir into work', '<b>Clausius</b>: heat cannot flow from cold to hot without external work', 'The two statements are equivalent'], 'Kelvin Planck says no engine can be one hundred percent efficient. Clausius says heat does not flow from cold to hot by itself. Violating one violates the other.'],
    ['eq', 'Efficiency and COP', R`\eta=\frac{W}{Q_H}=1-\frac{Q_L}{Q_H}\qquad COP_R=\frac{Q_L}{W}\qquad COP_{HP}=\frac{Q_H}{W}`, [], 'Thermal efficiency is work out over heat in. Refrigerators and heat pumps are rated by coefficient of performance, which can be greater than one.'],
    ['anim', 'cycle', 'The Carnot cycle', 'Choose the Carnot cycle. It has two isothermal and two adiabatic processes, and on the T s diagram it is a rectangle.'],
    ['eq', 'Carnot limits', R`\eta_{rev}=1-\frac{T_L}{T_H},\quad COP_{R,rev}=\frac{T_L}{T_H-T_L},\quad COP_{HP,rev}=\frac{T_H}{T_H-T_L}`, [['T', 'kelvin!']], 'No engine between two reservoirs can beat the Carnot efficiency, one minus T low over T high, in kelvin. Similar limits apply to refrigerators and heat pumps.'],
    ['q', 1],
    ['q', 4],
    ['sum', ['η < η_Carnot: possible; = : reversible; > : impossible', 'Irreversibilities: friction, mixing, finite-ΔT heat transfer, free expansion', 'Raise T_H, lower T_L, reduce irreversibilities'], 'To check any claim, compare it with the Carnot limit. To improve real devices, raise the hot temperature, lower the cold one, and reduce irreversibilities.'],
    ['links', 'td-second', 'Test inventors’ claims with the second law checker.']
  ]);
  L('td-entropy', [
    ['title', 'Entropy', 'Measuring irreversibility', 'Entropy turns the second law into numbers. In this lesson we compute entropy changes and use isentropic efficiencies.'],
    ['eq', 'Definition and balance', R`dS=\left(\frac{\delta Q}{T}\right)_{rev},\qquad S_2-S_1=\int\frac{\delta Q}{T}+S_{gen},\;S_{gen}\ge0`, [], 'Entropy is defined from reversible heat transfer divided by temperature. For any process, entropy change equals entropy transfer with heat plus entropy generated, which can never be negative.'],
    ['anim', 'mixing', 'Entropy of mixing', 'Remove the partition and watch the gases mix. Energy is unchanged, but entropy rises, and the process never reverses by itself.'],
    ['eq', 'Entropy change formulas', R`\Delta s=c_p\ln\frac{T_2}{T_1}-R\ln\frac{P_2}{P_1}\qquad\Delta s=c\ln\frac{T_2}{T_1}`, [['ideal gas', 'left'], ['solid / liquid', 'right']], 'For ideal gases, entropy change has a temperature term and a pressure term. For solids and liquids only the temperature term remains.'],
    ['q', 2],
    ['eq', 'Isentropic efficiencies', R`\eta_T=\frac{h_1-h_2}{h_1-h_{2s}}\qquad\eta_C=\frac{h_{2s}-h_1}{h_2-h_1}`, [['2s', 'ideal (isentropic) exit state']], 'Real turbines produce less work than isentropic ones, and real compressors need more. Isentropic efficiency compares them.'],
    ['q', 5],
    ['sum', ['Entropy of an isolated system never decreases', 'Gas: two terms; solid/liquid: one term', 'Find h₂s at the exit pressure with s₁', 'Work carries no entropy; heat and mass do'], 'Remember: S gen is never negative, find the isentropic state first, and only heat and mass carry entropy.'],
    ['links', 'td-entropy', 'Practise with the quench entropy and turbine problems.']
  ]);
  L('td-exergy', [
    ['title', 'Exergy', 'The quality of energy', 'Exergy is the useful work potential of energy relative to the environment. This lesson shows why it matters.'],
    ['bul', 'Key ideas', ['Dead state: T₀ = 25 °C, P₀ = 1 atm — zero exergy', 'Work and electricity: 100 % exergy', 'Heat at T: exergy = Q(1 − T₀/T)', 'Exergy is destroyed by irreversibility'], 'At the dead state a system can do no more work. Work and electricity are pure exergy, while heat is only partly useful, depending on its temperature.'],
    ['eq', 'Exergy of a flowing stream', R`\psi=(h-h_0)-T_0(s-s_0)+\frac{V^2}{2}+gz`, [], 'For a flowing stream, exergy equals enthalpy above the dead state minus T zero times the entropy above the dead state, plus kinetic and potential energy.'],
    ['eq', 'Gouy–Stodola theorem', R`X_{destroyed}=T_0S_{gen},\qquad\eta_{II}=\frac{X_{recovered}}{X_{expended}}`, [], 'Exergy destroyed equals dead-state temperature times entropy generated. Second-law efficiency compares the exergy recovered with the exergy spent.'],
    ['q', 1],
    ['q', 5],
    ['sum', ['Energy is conserved, exergy is not', 'Biggest power-plant losses: combustion and boiler, not condenser', 'Use η_II to find the real inefficiencies'], 'Energy analysis blames the condenser, but exergy analysis shows that combustion and the boiler destroy the most work potential.'],
    ['links', 'td-exergy', 'Compute exergy of steam with the exergy solver.']
  ]);
  L('td-gascycles', [
    ['title', 'Gas power cycles', 'Otto, Diesel, Brayton and more', 'This lesson covers the air-standard cycles that model petrol engines, diesel engines and gas turbines.'],
    ['anim', 'engine', 'The four-stroke engine', 'Watch the four strokes: intake, compression, power and exhaust, and how they trace the indicator diagram.'],
    ['eq', 'Otto cycle', R`\eta_{Otto}=1-\frac{1}{r^{k-1}}`, [['r', 'compression ratio V_max/V_min'], ['k', '1.4 for air']], 'The Otto cycle efficiency depends only on compression ratio. It is limited to about ten to twelve in petrol engines because of knock.'],
    ['eq', 'Diesel cycle', R`\eta_{Diesel}=1-\frac{1}{r^{k-1}}\,\frac{r_c^k-1}{k(r_c-1)}`, [['r_c', 'cut-off ratio']], 'In the Diesel cycle heat is added at constant pressure. For the same compression ratio it is less efficient than Otto, but diesels use much higher compression ratios.'],
    ['fig', 'mollier', 'Efficiency vs compression ratio', 'This chart compares Otto and Diesel efficiencies as compression ratio rises.'],
    ['q', 0],
    ['anim', 'cycle', 'Brayton cycle', 'Select the Brayton cycle. Gas turbines compress, heat at constant pressure, and expand. A large share of turbine work drives the compressor.'],
    ['bul', 'Improving gas turbines', ['Regeneration: exhaust preheats compressed air (only if T₄ > T₂)', 'Intercooling and reheating raise net work', 'Combined cycle: exhaust raises steam — η ≈ 60 %'], 'Regeneration, intercooling and reheat improve gas turbines. Combining a gas turbine with a steam cycle gives about sixty percent efficiency.'],
    ['q', 3],
    ['sum', ['Otto η depends only on r', 'Diesel: lower η at same r, but higher r in practice', 'Brayton: high back-work ratio', 'MEP = net work / displacement'], 'Summary: compression ratio drives Otto efficiency, diesels win by using higher ratios, and gas turbines are sensitive to component efficiencies.'],
    ['links', 'td-gascycles', 'Explore the air-standard and Brayton cycle solvers.']
  ]);
  L('td-vapcycles', [
    ['title', 'Vapour power cycles', 'The Rankine cycle and its improvements', 'This lesson explains how steam power plants work and how their efficiency is improved.'],
    ['anim', 'rankine', 'Follow the water', 'Follow the water around the plant: pump, boiler, turbine and condenser, and watch the state move on the T s diagram.'],
    ['eq', 'Rankine cycle', R`\eta=\frac{(h_3-h_4)-(h_2-h_1)}{h_3-h_2},\qquad w_P=v_1(P_2-P_1)`, [['1', 'saturated liquid from condenser'], ['3', 'turbine inlet']], 'Efficiency is turbine work minus pump work, divided by boiler heat. Pump work is small because liquid has a small specific volume.'],
    ['bul', 'Raising efficiency', ['Lower condenser pressure', 'Superheat to higher temperature', 'Raise boiler pressure (needs reheat to limit moisture)', 'Reheat and regeneration (feedwater heaters)'], 'Lower the condenser pressure, raise the superheat temperature, and raise the boiler pressure. Reheat keeps the turbine exit dry enough, and feedwater heating raises the mean temperature of heat addition.'],
    ['q', 1],
    ['eq', 'Open feedwater heater', R`y\,h_{bleed}+(1-y)\,h_{pump1}=h_f(P_{FWH})`, [['y', 'fraction of steam bled']], 'In an open feedwater heater, bled steam mixes with feedwater. A mass and energy balance gives the bleed fraction y.'],
    ['q', 2],
    ['sum', ['Back-work ratio ≈ 1 %', 'Exit quality ≥ 0.88 to protect blades', 'Remember (1 − y) after bleeding', 'Supercritical plants: 24–30 MPa'], 'Remember the tiny pump work, keep exit quality high, and account for the bled mass fraction.'],
    ['links', 'td-vapcycles', 'Build reheat and regenerative cycles in the Rankine solver.']
  ]);
  L('td-refrig', [
    ['title', 'Refrigeration & heat pumps', 'Moving heat uphill', 'This lesson explains how refrigerators, air conditioners and heat pumps move heat from cold to hot.'],
    ['anim', 'vcr', 'Follow the refrigerant', 'Follow the refrigerant through compressor, condenser, expansion valve and evaporator, and see its state on the pressure enthalpy chart.'],
    ['eq', 'Performance', R`COP_R=\frac{h_1-h_4}{h_2-h_1},\quad h_4=h_3,\quad 1\,\mathrm{TR}=3.517\ \mathrm{kW}`, [], 'The coefficient of performance is the refrigerating effect divided by compressor work. Throttling keeps enthalpy constant, so h four equals h three.'],
    ['q', 0],
    ['bul', 'Practical cycle', ['Superheat at evaporator exit protects the compressor', 'Subcooling at condenser exit raises capacity', 'Evaporator 5–10 K below space; condenser 10–15 K above ambient', 'Cascade systems for very low temperatures'], 'Real systems superheat the suction vapour and subcool the liquid. Temperature differences are needed for heat transfer in the evaporator and condenser.'],
    ['bul', 'Refrigerant choice', ['R-134a (GWP 1430) being phased down', 'R-1234yf, R-32, ammonia, CO₂, propane', 'Safety, efficiency and environment trade-off'], 'Refrigerant choice balances efficiency, safety and environmental impact. High global warming refrigerants are being replaced.'],
    ['q', 5],
    ['sum', ['COP can exceed 1', 'h₄ = h₃', 'Smaller lift ⇒ higher COP'], 'Summary: COP can be larger than one, throttling keeps enthalpy constant, and a smaller temperature lift gives a higher COP.'],
    ['links', 'td-refrig', 'Analyse any refrigerant in the vapour compression solver.']
  ]);
  L('td-relations', [
    ['title', 'Thermodynamic property relations', 'Maxwell, Clapeyron, Joule–Thomson', 'How do we get enthalpy and entropy from measurable pressure, volume and temperature? Through property relations.'],
    ['eq', 'Gibbs equations', R`du=Tds-Pdv,\;dh=Tds+vdP,\;da=-sdT-Pdv,\;dg=-sdT+vdP`, [], 'The four Gibbs equations connect the thermodynamic potentials. Because they are exact differentials, their mixed derivatives are equal.'],
    ['eq', 'Maxwell relations', R`\left(\frac{\partial s}{\partial v}\right)_T=\left(\frac{\partial P}{\partial T}\right)_v,\quad\left(\frac{\partial s}{\partial P}\right)_T=-\left(\frac{\partial v}{\partial T}\right)_P`, [], 'The Maxwell relations let us replace unmeasurable entropy derivatives with measurable pressure volume temperature derivatives.'],
    ['eq', 'Clapeyron equation', R`\left(\frac{dP}{dT}\right)_{sat}=\frac{h_{fg}}{T\,v_{fg}}`, [], 'The Clapeyron equation gives the latent heat from the slope of the saturation curve.'],
    ['q', 2],
    ['eq', 'Joule–Thomson coefficient', R`\mu_{JT}=\left(\frac{\partial T}{\partial P}\right)_h`, [['μ > 0', 'cools on throttling'], ['ideal gas', 'μ = 0']], 'The Joule Thomson coefficient tells whether a gas cools on throttling. It is zero for an ideal gas.'],
    ['q', 1],
    ['sum', ['Maxwell relations convert s-derivatives to P–v–T', 'Clapeyron gives h_fg from vapour pressure', 'c_p ≥ c_v always'], 'Property relations are how tables are built from measurements.'],
    ['links', 'td-relations', 'Estimate h fg from tables in the practice problem.']
  ]);
  L('td-mixtures', [
    ['title', 'Psychrometry & air conditioning', 'Moist air made simple', 'This lesson covers moist air: humidity, dew point, wet bulb, and the processes used in air conditioning.'],
    ['eq', 'Humidity', R`\omega=0.622\frac{P_v}{P-P_v},\qquad\phi=\frac{P_v}{P_g(T)}`, [['ω', 'kg water per kg dry air'], ['φ', 'relative humidity']], 'Humidity ratio is kilograms of water vapour per kilogram of dry air. Relative humidity compares vapour pressure with saturation pressure at the same temperature.'],
    ['eq', 'Enthalpy of moist air', R`h=1.006T+\omega(2501+1.86T)\ \mathrm{kJ/kg\ dry\ air}`, [], 'Enthalpy is per kilogram of dry air: the sensible heat of air plus the enthalpy of the vapour it carries.'],
    ['bul', 'Three temperatures', ['Dry bulb: ordinary temperature', 'Wet bulb: evaporative equilibrium of a wetted thermometer', 'Dew point: saturation temperature at the vapour pressure', 'T_db ≥ T_wb ≥ T_dp; equal at 100 % RH'], 'Dry bulb, wet bulb and dew point temperatures. Dew point depends only on the moisture content.'],
    ['q', 0],
    ['bul', 'Processes on the chart', ['Sensible heating/cooling: horizontal line', 'Cooling & dehumidifying: to the saturation curve', 'Evaporative cooling: along a wet-bulb line', 'Mixing: straight line (lever rule)'], 'On the psychrometric chart, sensible heating is horizontal, dehumidifying cooling moves towards saturation, evaporative cooling follows a wet bulb line, and mixing lies on a straight line.'],
    ['q', 1],
    ['sum', ['Work per kg of dry air', 'Dew point depends on ω only', 'Hot-humid climates need dehumidification'], 'Always work per kilogram of dry air.'],
    ['links', 'td-mixtures', 'Click on the live psychrometric chart in the solver.']
  ]);
  L('td-combustion', [
    ['title', 'Combustion', 'Fuels, air and flames', 'This lesson covers combustion: balancing equations, air fuel ratio, heating values and flame temperature.'],
    ['eq', 'Stoichiometric combustion', R`C_xH_y+a(O_2+3.76N_2)\to xCO_2+\tfrac y2H_2O+3.76aN_2,\quad a=x+\tfrac y4`, [], 'Air brings 3.76 moles of nitrogen with every mole of oxygen. The theoretical oxygen is x plus y over four.'],
    ['eq', 'Air–fuel ratio', R`AF=\frac{4.76\,a\,M_{air}}{M_{fuel}},\qquad\phi=\frac{AF_{st}}{AF}`, [['CH₄', 'AF ≈ 17.2'], ['petrol', 'AF ≈ 14.7']], 'Air fuel ratio is the mass of air per mass of fuel. The equivalence ratio tells whether a mixture is rich or lean.'],
    ['q', 0],
    ['bul', 'Energy of combustion', ['Enthalpy of formation: 0 for stable elements', 'HHV: water condensed; LHV: water vapour', 'Adiabatic flame temperature: H_products = H_reactants', 'Dissociation lowers real flame temperature'], 'Heating values come from enthalpies of formation. The adiabatic flame temperature is found when product enthalpy equals reactant enthalpy.'],
    ['q', 3],
    ['sum', ['Remember 3.76 N₂', 'HHV − LHV = latent heat of product water', 'T_ad peaks near stoichiometric'], 'Remember the nitrogen, distinguish higher and lower heating values, and expect the hottest flame near stoichiometric.'],
    ['links', 'td-combustion', 'Compute flame temperatures with the combustion solver.']
  ]);
})();
