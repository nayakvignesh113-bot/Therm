/* Universal formula library (solve for any variable) + simultaneous equation solver with property functions */
'use strict';
(() => {
  const { h } = U; const SIG = 5.670374e-8;
  // [category, name, tex, 'sym|desc|unit;...', residual(v)]
  const L = [
    ['Thermo basics', 'Ideal gas law (mass basis)', 'PV=mRT', 'P|pressure|kPa;V|volume|m³;m|mass|kg;R|gas constant|kJ/kg·K;T|temperature|K', v => v.P * v.V - v.m * v.R * v.T],
    ['Thermo basics', 'Ideal gas law (molar)', 'PV=n\\bar R T', 'P|pressure|kPa;V|volume|m³;n|moles|kmol;T|temperature|K', v => v.P * v.V - v.n * 8.314462618 * v.T],
    ['Thermo basics', 'Gas constant from molar mass', 'R=\\bar R/M', 'R|gas constant|kJ/kg·K;M|molar mass|kg/kmol', v => v.R - 8.314462618 / v.M],
    ['Thermo basics', 'Hydrostatic pressure', 'P=P_{atm}+\\rho g h', 'P|absolute pressure|Pa;Patm|atmospheric|Pa;rho|density|kg/m³;h|depth|m', v => v.P - v.Patm - v.rho * 9.80665 * v.h],
    ['Thermo basics', 'Quality – mixture property', 'y=y_f+x(y_g-y_f)', 'y|mixture property|;yf|sat. liquid value|;yg|sat. vapour value|;x|quality|–', v => v.y - v.yf - v.x * (v.yg - v.yf)],
    ['Thermo basics', 'Compressibility factor', 'Pv=ZRT', 'P|pressure|kPa;v|specific volume|m³/kg;Z|compressibility|–;R|gas constant|kJ/kg·K;T|temperature|K', v => v.P * v.v - v.Z * v.R * v.T],
    ['Thermo basics', 'cp – cv relation (ideal gas)', 'c_p-c_v=R,\\;k=c_p/c_v', 'cp|cp|kJ/kg·K;cv|cv|kJ/kg·K;R|R|kJ/kg·K', v => v.cp - v.cv - v.R],
    ['Work & first law', 'Boundary work – isobaric', 'W=P(V_2-V_1)', 'W|work|kJ;P|pressure|kPa;V1|initial volume|m³;V2|final volume|m³', v => v.W - v.P * (v.V2 - v.V1)],
    ['Work & first law', 'Boundary work – isothermal', 'W=P_1V_1\\ln(V_2/V_1)', 'W|work|kJ;P1|P₁|kPa;V1|V₁|m³;V2|V₂|m³', v => v.W - v.P1 * v.V1 * Math.log(v.V2 / v.V1)],
    ['Work & first law', 'Boundary work – polytropic', 'W=\\frac{P_2V_2-P_1V_1}{1-n}', 'W|work|kJ;P1|P₁|kPa;V1|V₁|m³;P2|P₂|kPa;V2|V₂|m³;n|polytropic index|–', v => v.W - (v.P2 * v.V2 - v.P1 * v.V1) / (1 - v.n)],
    ['Work & first law', 'Polytropic relation', 'P_1V_1^n=P_2V_2^n', 'P1|P₁|kPa;V1|V₁|m³;P2|P₂|kPa;V2|V₂|m³;n|index|–', v => v.P1 * Math.pow(v.V1, v.n) - v.P2 * Math.pow(v.V2, v.n)],
    ['Work & first law', 'Isentropic T–P relation', 'T_2/T_1=(P_2/P_1)^{(k-1)/k}', 'T1|T₁|K;T2|T₂|K;P1|P₁|kPa;P2|P₂|kPa;k|cp/cv|–', v => v.T2 / v.T1 - Math.pow(v.P2 / v.P1, (v.k - 1) / v.k)],
    ['Work & first law', 'Isentropic T–v relation', 'T_2/T_1=(v_1/v_2)^{k-1}', 'T1|T₁|K;T2|T₂|K;v1|v₁|m³/kg;v2|v₂|m³/kg;k|cp/cv|–', v => v.T2 / v.T1 - Math.pow(v.v1 / v.v2, v.k - 1)],
    ['Work & first law', 'Spring work', 'W=\\tfrac12k(x_2^2-x_1^2)', 'W|work|kJ;k|spring constant|kN/m;x1|initial deflection|m;x2|final deflection|m', v => v.W - 0.5 * v.k * (v.x2 * v.x2 - v.x1 * v.x1)],
    ['Work & first law', 'Shaft work', 'W=2\\pi nT', 'W|power|kW;n|speed|rev/s;T|torque|kN·m', v => v.W - 2 * Math.PI * v.n * v.T],
    ['Work & first law', 'First law closed system', 'Q-W=m(u_2-u_1)', 'Q|heat in|kJ;W|work out|kJ;m|mass|kg;u1|u₁|kJ/kg;u2|u₂|kJ/kg', v => v.Q - v.W - v.m * (v.u2 - v.u1)],
    ['Work & first law', 'Steady-flow energy equation', '\\dot Q-\\dot W=\\dot m[h_2-h_1+\\frac{V_2^2-V_1^2}{2000}+\\frac{g(z_2-z_1)}{1000}]', 'Q|heat in|kW;W|power out|kW;m|mass flow|kg/s;h1|h₁|kJ/kg;h2|h₂|kJ/kg;V1|V₁|m/s;V2|V₂|m/s;z1|z₁|m;z2|z₂|m', v => v.Q - v.W - v.m * (v.h2 - v.h1 + (v.V2 ** 2 - v.V1 ** 2) / 2000 + 9.81 * (v.z2 - v.z1) / 1000)],
    ['Work & first law', 'Nozzle exit velocity', 'V_2=\\sqrt{V_1^2+2000(h_1-h_2)}', 'V2|exit velocity|m/s;V1|inlet velocity|m/s;h1|h₁|kJ/kg;h2|h₂|kJ/kg', v => v.V2 * v.V2 - v.V1 * v.V1 - 2000 * (v.h1 - v.h2)],
    ['Work & first law', 'Pump work (incompressible)', 'w=v\\Delta P/\\eta', 'w|work in|kJ/kg;v|specific volume|m³/kg;dP|pressure rise|kPa;eta|efficiency|–', v => v.w - v.v * v.dP / v.eta],
    ['Work & first law', 'Continuity', '\\dot m=\\rho AV=AV/v', 'm|mass flow|kg/s;rho|density|kg/m³;A|area|m²;V|velocity|m/s', v => v.m - v.rho * v.A * v.V],
    ['Second law', 'Carnot efficiency', '\\eta=1-T_L/T_H', 'eta|efficiency|–;TL|cold T|K;TH|hot T|K', v => v.eta - 1 + v.TL / v.TH],
    ['Second law', 'Carnot COP refrigerator', 'COP_R=T_L/(T_H-T_L)', 'COP|COP|–;TL|cold T|K;TH|hot T|K', v => v.COP - v.TL / (v.TH - v.TL)],
    ['Second law', 'Carnot COP heat pump', 'COP_{HP}=T_H/(T_H-T_L)', 'COP|COP|–;TL|cold T|K;TH|hot T|K', v => v.COP - v.TH / (v.TH - v.TL)],
    ['Second law', 'Thermal efficiency', '\\eta=W/Q_H=1-Q_L/Q_H', 'eta|efficiency|–;W|net work|kJ;QH|heat in|kJ', v => v.eta - v.W / v.QH],
    ['Second law', 'Entropy change ideal gas', '\\Delta s=c_p\\ln\\frac{T_2}{T_1}-R\\ln\\frac{P_2}{P_1}', 'ds|Δs|kJ/kg·K;cp|cp|kJ/kg·K;R|R|kJ/kg·K;T1|T₁|K;T2|T₂|K;P1|P₁|kPa;P2|P₂|kPa', v => v.ds - v.cp * Math.log(v.T2 / v.T1) + v.R * Math.log(v.P2 / v.P1)],
    ['Second law', 'Entropy change incompressible', '\\Delta S=mc\\ln(T_2/T_1)', 'dS|ΔS|kJ/K;m|mass|kg;c|specific heat|kJ/kg·K;T1|T₁|K;T2|T₂|K', v => v.dS - v.m * v.c * Math.log(v.T2 / v.T1)],
    ['Second law', 'Turbine isentropic efficiency', '\\eta_T=\\frac{h_1-h_2}{h_1-h_{2s}}', 'eta|ηT|–;h1|h₁|kJ/kg;h2|h₂|kJ/kg;h2s|h₂ₛ|kJ/kg', v => v.eta * (v.h1 - v.h2s) - (v.h1 - v.h2)],
    ['Second law', 'Compressor isentropic efficiency', '\\eta_C=\\frac{h_{2s}-h_1}{h_2-h_1}', 'eta|ηC|–;h1|h₁|kJ/kg;h2|h₂|kJ/kg;h2s|h₂ₛ|kJ/kg', v => v.eta * (v.h2 - v.h1) - (v.h2s - v.h1)],
    ['Second law', 'Exergy of heat', 'X=Q(1-T_0/T)', 'X|exergy|kJ;Q|heat|kJ;T0|dead-state T|K;T|source T|K', v => v.X - v.Q * (1 - v.T0 / v.T)],
    ['Second law', 'Gouy–Stodola', 'X_d=T_0S_{gen}', 'Xd|exergy destroyed|kW;T0|dead-state T|K;Sgen|entropy generation|kW/K', v => v.Xd - v.T0 * v.Sgen],
    ['Cycles', 'Otto efficiency', '\\eta=1-r^{1-k}', 'eta|η|–;r|compression ratio|–;k|cp/cv|–', v => v.eta - 1 + Math.pow(v.r, 1 - v.k)],
    ['Cycles', 'Diesel efficiency', '\\eta=1-\\frac{1}{r^{k-1}}\\frac{r_c^k-1}{k(r_c-1)}', 'eta|η|–;r|compression ratio|–;rc|cut-off ratio|–;k|cp/cv|–', v => v.eta - 1 + Math.pow(v.r, 1 - v.k) * (Math.pow(v.rc, v.k) - 1) / (v.k * (v.rc - 1))],
    ['Cycles', 'Brayton ideal efficiency', '\\eta=1-r_p^{(1-k)/k}', 'eta|η|–;rp|pressure ratio|–;k|cp/cv|–', v => v.eta - 1 + Math.pow(v.rp, (1 - v.k) / v.k)],
    ['Cycles', 'Brayton optimum pressure ratio (max work)', 'r_p=(T_{max}/T_{min})^{k/[2(k-1)]}', 'rp|pressure ratio|–;Tmax|T₃|K;Tmin|T₁|K;k|cp/cv|–', v => v.rp - Math.pow(v.Tmax / v.Tmin, v.k / (2 * (v.k - 1)))],
    ['Cycles', 'Mean effective pressure', 'MEP=w_{net}/(v_1-v_2)', 'MEP|MEP|kPa;w|net work|kJ/kg;v1|v_max|m³/kg;v2|v_min|m³/kg', v => v.MEP * (v.v1 - v.v2) - v.w],
    ['Cycles', 'Engine indicated power', 'P=\\frac{MEP\\cdot V_d\\cdot N}{n_R}', 'P|power|kW;MEP|MEP|kPa;Vd|displacement|m³;N|speed|rev/s;nR|revs per cycle (2 for 4-stroke)|–', v => v.P - v.MEP * v.Vd * v.N / v.nR],
    ['Cycles', 'Volumetric efficiency of compressor', '\\eta_v=1+c-c(P_2/P_1)^{1/n}', 'ev|ηv|–;c|clearance ratio|–;P1|P₁|kPa;P2|P₂|kPa;n|index|–', v => v.ev - 1 - v.c + v.c * Math.pow(v.P2 / v.P1, 1 / v.n)],
    ['Cycles', 'Refrigeration capacity', '\\dot Q_L=\\dot m(h_1-h_4)', 'QL|capacity|kW;m|mass flow|kg/s;h1|h₁|kJ/kg;h4|h₄|kJ/kg', v => v.QL - v.m * (v.h1 - v.h4)],
    ['Psychrometry', 'Humidity ratio', '\\omega=0.622\\frac{P_v}{P-P_v}', 'w|ω|kg/kg;Pv|vapour pressure|kPa;P|total pressure|kPa', v => v.w - 0.621945 * v.Pv / (v.P - v.Pv)],
    ['Psychrometry', 'Relative humidity', '\\phi=P_v/P_g', 'phi|φ|–;Pv|vapour pressure|kPa;Pg|saturation pressure|kPa', v => v.phi - v.Pv / v.Pg],
    ['Psychrometry', 'Moist-air enthalpy', 'h=1.006T+\\omega(2501+1.86T)', 'h|enthalpy|kJ/kg da;T|dry-bulb|°C;w|ω|kg/kg', v => v.h - 1.006 * v.T - v.w * (2501 + 1.86 * v.T)],
    ['Psychrometry', 'Adiabatic mixing (lever rule)', '\\omega_3=\\frac{\\dot m_1\\omega_1+\\dot m_2\\omega_2}{\\dot m_1+\\dot m_2}', 'w3|ω₃|–;m1|ṁ₁|kg/s;w1|ω₁|–;m2|ṁ₂|kg/s;w2|ω₂|–', v => v.w3 * (v.m1 + v.m2) - v.m1 * v.w1 - v.m2 * v.w2],
    ['Conduction', 'Fourier’s law (plane wall)', '\\dot Q=kA\\frac{T_1-T_2}{L}', 'Q|heat rate|W;k|conductivity|W/m·K;A|area|m²;T1|T₁|°C;T2|T₂|°C;L|thickness|m', v => v.Q - v.k * v.A * (v.T1 - v.T2) / v.L],
    ['Conduction', 'Cylinder conduction', '\\dot Q=\\frac{2\\pi kL(T_1-T_2)}{\\ln(r_2/r_1)}', 'Q|heat rate|W;k|conductivity|W/m·K;L|length|m;T1|T₁|°C;T2|T₂|°C;r1|inner radius|m;r2|outer radius|m', v => v.Q - 2 * Math.PI * v.k * v.L * (v.T1 - v.T2) / Math.log(v.r2 / v.r1)],
    ['Conduction', 'Sphere conduction', '\\dot Q=\\frac{4\\pi kr_1r_2(T_1-T_2)}{r_2-r_1}', 'Q|heat rate|W;k|conductivity|W/m·K;r1|inner radius|m;r2|outer radius|m;T1|T₁|°C;T2|T₂|°C', v => v.Q - 4 * Math.PI * v.k * v.r1 * v.r2 * (v.T1 - v.T2) / (v.r2 - v.r1)],
    ['Conduction', 'Thermal resistance network', '\\dot Q=\\Delta T/R_{tot}', 'Q|heat rate|W;dT|temperature difference|K;R|total resistance|K/W', v => v.Q * v.R - v.dT],
    ['Conduction', 'Critical radius (cylinder)', 'r_{cr}=k/h', 'r|critical radius|m;k|insulation k|W/m·K;h|outer h|W/m²K', v => v.r - v.k / v.h],
    ['Conduction', 'Heat generation – wall centre T', 'T_0=T_s+\\frac{\\dot gL^2}{2k}', 'T0|centre T|°C;Ts|surface T|°C;g|generation|W/m³;L|half-thickness|m;k|conductivity|W/m·K', v => v.T0 - v.Ts - v.g * v.L * v.L / (2 * v.k)],
    ['Conduction', 'Heat generation – cylinder centre T', 'T_0=T_s+\\frac{\\dot gr_0^2}{4k}', 'T0|centre T|°C;Ts|surface T|°C;g|generation|W/m³;r|radius|m;k|conductivity|W/m·K', v => v.T0 - v.Ts - v.g * v.r * v.r / (4 * v.k)],
    ['Conduction', 'Fin parameter', 'm=\\sqrt{hP/kA_c}', 'm|fin parameter|1/m;h|h|W/m²K;P|perimeter|m;k|k|W/m·K;Ac|cross-section|m²', v => v.m * v.m - v.h * v.P / (v.k * v.Ac)],
    ['Conduction', 'Fin – adiabatic tip heat rate', 'q=\\sqrt{hPkA_c}\\,\\theta_b\\tanh(mL)', 'q|fin heat rate|W;h|h|W/m²K;P|perimeter|m;k|k|W/m·K;Ac|cross-section|m²;thb|Tb−T∞|K;L|length|m', v => v.q - Math.sqrt(v.h * v.P * v.k * v.Ac) * v.thb * Math.tanh(Math.sqrt(v.h * v.P / (v.k * v.Ac)) * v.L)],
    ['Conduction', 'Pin-fin efficiency (adiabatic, corrected length)', '\\eta_f=\\tanh(mL_c)/(mL_c)', 'eta|efficiency|–;m|m|1/m;Lc|corrected length|m', v => v.eta - Math.tanh(v.m * v.Lc) / (v.m * v.Lc)],
    ['Conduction', 'Shape factor heat flow', '\\dot Q=Sk\\Delta T', 'Q|heat rate|W;S|shape factor|m;k|conductivity|W/m·K;dT|ΔT|K', v => v.Q - v.S * v.k * v.dT],
    ['Transient', 'Biot number', 'Bi=hL_c/k', 'Bi|Biot|–;h|h|W/m²K;Lc|characteristic length|m;k|solid k|W/m·K', v => v.Bi - v.h * v.Lc / v.k],
    ['Transient', 'Fourier number', 'Fo=\\alpha t/L^2', 'Fo|Fourier|–;alpha|diffusivity|m²/s;t|time|s;L|length|m', v => v.Fo - v.alpha * v.t / (v.L * v.L)],
    ['Transient', 'Lumped capacitance cooling', '\\frac{T-T_\\infty}{T_i-T_\\infty}=e^{-\\frac{hA}{\\rho Vc}t}', 'T|temperature at t|°C;Tinf|fluid T|°C;Ti|initial T|°C;h|h|W/m²K;A|surface area|m²;rho|density|kg/m³;V|volume|m³;c|specific heat|J/kg·K;t|time|s', v => (v.T - v.Tinf) / (v.Ti - v.Tinf) - Math.exp(-v.h * v.A * v.t / (v.rho * v.V * v.c))],
    ['Transient', 'Semi-infinite solid, sudden surface T', '\\frac{T-T_s}{T_i-T_s}=\\mathrm{erf}\\frac{x}{2\\sqrt{\\alpha t}}', 'T|temperature|°C;Ts|surface T|°C;Ti|initial T|°C;x|depth|m;alpha|diffusivity|m²/s;t|time|s', v => (v.T - v.Ts) / (v.Ti - v.Ts) - U.erf(v.x / (2 * Math.sqrt(v.alpha * v.t)))],
    ['Convection', 'Newton’s law of cooling', '\\dot Q=hA(T_s-T_\\infty)', 'Q|heat rate|W;h|h|W/m²K;A|area|m²;Ts|surface T|°C;Tinf|fluid T|°C', v => v.Q - v.h * v.A * (v.Ts - v.Tinf)],
    ['Convection', 'Reynolds number', 'Re=VL/\\nu', 'Re|Reynolds|–;V|velocity|m/s;L|length|m;nu|kinematic viscosity|m²/s', v => v.Re - v.V * v.L / v.nu],
    ['Convection', 'Nusselt number', 'Nu=hL/k', 'Nu|Nusselt|–;h|h|W/m²K;L|length|m;k|fluid k|W/m·K', v => v.Nu - v.h * v.L / v.k],
    ['Convection', 'Laminar flat plate average', '\\overline{Nu}=0.664Re^{1/2}Pr^{1/3}', 'Nu|Nusselt|–;Re|Reynolds|–;Pr|Prandtl|–', v => v.Nu - 0.664 * Math.sqrt(v.Re) * Math.cbrt(v.Pr)],
    ['Convection', 'Turbulent flat plate average', '\\overline{Nu}=0.037Re^{0.8}Pr^{1/3}', 'Nu|Nusselt|–;Re|Reynolds|–;Pr|Prandtl|–', v => v.Nu - 0.037 * Math.pow(v.Re, 0.8) * Math.cbrt(v.Pr)],
    ['Convection', 'Dittus–Boelter', 'Nu=0.023Re^{0.8}Pr^{n}', 'Nu|Nusselt|–;Re|Reynolds|–;Pr|Prandtl|–;n|0.4 heating, 0.3 cooling|–', v => v.Nu - 0.023 * Math.pow(v.Re, 0.8) * Math.pow(v.Pr, v.n)],
    ['Convection', 'Tube outlet temperature (const Ts)', '\\frac{T_s-T_e}{T_s-T_i}=e^{-hA_s/\\dot mc_p}', 'Te|outlet T|°C;Ts|surface T|°C;Ti|inlet T|°C;h|h|W/m²K;As|surface area|m²;m|mass flow|kg/s;cp|cp|J/kg·K', v => (v.Ts - v.Te) / (v.Ts - v.Ti) - Math.exp(-v.h * v.As / (v.m * v.cp))],
    ['Convection', 'Rayleigh number', 'Ra=\\frac{g\\beta\\Delta TL^3}{\\nu\\alpha}', 'Ra|Rayleigh|–;beta|expansion coeff.|1/K;dT|ΔT|K;L|length|m;nu|ν|m²/s;alpha|α|m²/s', v => v.Ra - 9.81 * v.beta * v.dT * v.L ** 3 / (v.nu * v.alpha)],
    ['Convection', 'Darcy friction pressure drop', '\\Delta P=f\\frac{L}{D}\\frac{\\rho V^2}{2}', 'dP|pressure drop|Pa;f|friction factor|–;L|length|m;D|diameter|m;rho|density|kg/m³;V|velocity|m/s', v => v.dP - v.f * v.L / v.D * v.rho * v.V * v.V / 2],
    ['Heat exchangers', 'LMTD', '\\Delta T_{lm}=\\frac{\\Delta T_1-\\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)}', 'LMTD|LMTD|K;dT1|ΔT₁|K;dT2|ΔT₂|K', v => v.LMTD - (v.dT1 - v.dT2) / Math.log(v.dT1 / v.dT2)],
    ['Heat exchangers', 'LMTD rate equation', '\\dot Q=UAF\\Delta T_{lm}', 'Q|duty|W;U|U|W/m²K;A|area|m²;F|correction|–;LMTD|LMTD|K', v => v.Q - v.U * v.A * v.F * v.LMTD],
    ['Heat exchangers', 'Energy balance one stream', '\\dot Q=\\dot mc_p\\Delta T', 'Q|duty|W;m|mass flow|kg/s;cp|cp|J/kg·K;dT|temperature change|K', v => v.Q - v.m * v.cp * v.dT],
    ['Heat exchangers', 'Counter-flow effectiveness', '\\varepsilon=\\frac{1-e^{-NTU(1-C_r)}}{1-C_re^{-NTU(1-C_r)}}', 'eps|ε|–;NTU|NTU|–;Cr|Cmin/Cmax|–', v => v.eps - U.EPS.cnt[1](v.NTU, v.Cr)],
    ['Heat exchangers', 'Parallel-flow effectiveness', '\\varepsilon=\\frac{1-e^{-NTU(1+C_r)}}{1+C_r}', 'eps|ε|–;NTU|NTU|–;Cr|Cmin/Cmax|–', v => v.eps - U.EPS.par[1](v.NTU, v.Cr)],
    ['Heat exchangers', 'NTU definition', 'NTU=UA/C_{min}', 'NTU|NTU|–;U|U|W/m²K;A|area|m²;Cmin|Cmin|W/K', v => v.NTU - v.U * v.A / v.Cmin],
    ['Radiation', 'Stefan–Boltzmann (gray)', '\\dot Q=\\varepsilon\\sigma AT^4', 'Q|emitted|W;eps|emissivity|–;A|area|m²;T|temperature|K', v => v.Q - v.eps * SIG * v.A * v.T ** 4],
    ['Radiation', 'Small body in large enclosure', '\\dot Q=\\varepsilon\\sigma A(T_s^4-T_{sur}^4)', 'Q|net exchange|W;eps|emissivity|–;A|area|m²;Ts|surface T|K;Tsur|surroundings T|K', v => v.Q - v.eps * SIG * v.A * (v.Ts ** 4 - v.Tsur ** 4)],
    ['Radiation', 'Parallel gray plates', 'q=\\frac{\\sigma(T_1^4-T_2^4)}{1/\\varepsilon_1+1/\\varepsilon_2-1}', 'q|flux|W/m²;T1|T₁|K;T2|T₂|K;e1|ε₁|–;e2|ε₂|–', v => v.q - SIG * (v.T1 ** 4 - v.T2 ** 4) / (1 / v.e1 + 1 / v.e2 - 1)],
    ['Radiation', 'Wien’s displacement law', '\\lambda_{max}T=2897.8\\;\\mu m\\,K', 'lam|peak wavelength|μm;T|temperature|K', v => v.lam * v.T - 2897.77],
    ['Radiation', 'Reciprocity', 'A_1F_{12}=A_2F_{21}', 'A1|A₁|m²;F12|F₁₂|–;A2|A₂|m²;F21|F₂₁|–', v => v.A1 * v.F12 - v.A2 * v.F21],
    ['Mass transfer', 'Fick’s law (molar, stationary medium)', '\\dot N=D_{AB}A\\frac{C_1-C_2}{L}', 'N|molar rate|kmol/s;D|diffusivity|m²/s;A|area|m²;C1|C₁|kmol/m³;C2|C₂|kmol/m³;L|thickness|m', v => v.N - v.D * v.A * (v.C1 - v.C2) / v.L],
    ['Mass transfer', 'Carburizing (erf solution)', '\\frac{C_s-C_x}{C_s-C_0}=\\mathrm{erf}\\frac{x}{2\\sqrt{Dt}}', 'Cx|content at x|wt%;Cs|surface|wt%;C0|initial|wt%;x|depth|m;D|diffusivity|m²/s;t|time|s', v => (v.Cs - v.Cx) / (v.Cs - v.C0) - U.erf(v.x / (2 * Math.sqrt(v.D * v.t)))],
    ['Mass transfer', 'Arrhenius diffusivity', 'D=D_0e^{-Q/RT}', 'D|diffusivity|m²/s;D0|pre-exponential|m²/s;Q|activation energy|J/mol;T|temperature|K', v => v.D - v.D0 * Math.exp(-v.Q / (8.314 * v.T))],
    ['Mass transfer', 'Sherwood number', 'Sh=h_mL/D_{AB}', 'Sh|Sherwood|–;hm|mass-transfer coeff.|m/s;L|length|m;D|diffusivity|m²/s', v => v.Sh - v.hm * v.L / v.D],
    ['Mass transfer', 'Chilton–Colburn analogy', 'h=h_m\\rho c_pLe^{2/3}', 'h|heat-transfer coeff.|W/m²K;hm|mass-transfer coeff.|m/s;rho|density|kg/m³;cp|cp|J/kg·K;Le|Lewis|–', v => v.h - v.hm * v.rho * v.cp * Math.pow(v.Le, 2 / 3)],
    ['Mass transfer', 'Evaporation rate', '\\dot m=h_mA(\\rho_{v,s}-\\rho_{v,\\infty})', 'm|evaporation|kg/s;hm|hm|m/s;A|area|m²;rs|ρv at surface|kg/m³;rinf|ρv in air|kg/m³', v => v.m - v.hm * v.A * (v.rs - v.rinf)]
  ];
  U.FORMULAS = L.map(([cat, n, tex, vs, f]) => ({ cat, n, tex, vars: vs.split(';').map(s => s.split('|')), f }));

  const solveFor = (F, vals, x) => {
    const res = z => { const o = { ...vals, [x]: z }; return F.f(o); };
    const roots = [];
    const tryR = (a, b) => { const r = U.brent(res, a, b, 1e-13); if (isFinite(r) && Math.abs(res(r)) < 1e-6 * (1 + Math.abs(res(a)) + Math.abs(res(b))) && !roots.some(q => Math.abs(q - r) < 1e-9 * (1 + Math.abs(r)))) roots.push(r); };
    for (const sgn of [1, -1]) { let a = sgn * 1e-12, fa = res(a); for (let e = -12; e <= 12; e += 0.05) { const b = sgn * Math.pow(10, e), fb = res(b); if (isFinite(fa) && isFinite(fb) && fa * fb < 0) tryR(a, b); a = b; fa = fb; } }
    { const fa = res(0); if (Math.abs(fa) < 1e-12) roots.push(0); }
    return roots.sort((p, q) => Math.abs(p) - Math.abs(q));
  };

  U.addCalc('formula', {
    title: 'Universal formula solver — solve any equation for any variable', cat: 'Utilities', blurb: U.FORMULAS ? L.length + ' core equations of thermodynamics, heat and mass transfer; leave one field empty and solve.' : '',
    mount(el) {
      el.append(h('p', { class: 'prose' }, 'Pick an equation, fill in every variable you know and leave exactly one blank — it is solved numerically (all real roots are reported). Units are shown next to each symbol; keep them consistent.'));
      const cats = [...new Set(U.FORMULAS.map(f => f.cat))];
      const sel = h('select', { class: 'inp' }, cats.map(c => h('optgroup', { label: c }, U.FORMULAS.map((f, i) => f.cat === c ? h('option', { value: i }, f.n) : null))));
      const q = (location.hash.split('?')[1] || ''); if (q && U.FORMULAS[+q]) sel.value = q;
      const filt = h('input', { class: 'inp', placeholder: 'Filter equations…' });
      const eq = h('div', { class: 'eq' }), box = h('div', { class: 'form' }), out = h('div'); let ins = {};
      const build = () => { const F = U.FORMULAS[sel.value]; eq.innerHTML = `\\[${F.tex}\\]`; U.math(eq); box.innerHTML = ''; ins = {}; F.vars.forEach(([s, d, u]) => { ins[s] = h('input', { class: 'inp', type: 'number', step: 'any', placeholder: '? (unknown)' }); box.append(h('div', { class: 'fld' }, h('label', { html: `<b>${s}</b> — ${d} ${u ? '<span class="u">[' + u + ']</span>' : ''}` }), ins[s])); }); out.innerHTML = ''; };
      const go = () => { const F = U.FORMULAS[sel.value]; const blanks = F.vars.filter(([s]) => ins[s].value === ''); out.innerHTML = ''; if (blanks.length !== 1) { out.append(h('p', { class: 'muted' }, blanks.length ? 'Leave exactly one field blank (' + blanks.length + ' blank now).' : 'Clear the field you want to solve for.')); return; }
        const vals = {}; F.vars.forEach(([s]) => { if (ins[s].value !== '') vals[s] = +ins[s].value; }); const x = blanks[0][0], r = solveFor(F, vals, x);
        out.append(h('div', { class: 'out' }, r.length ? r.map((z, i) => h('div', { class: 'main' }, h('span', {}, x + (r.length > 1 ? ' (root ' + (i + 1) + ')' : '')), h('b', { html: U.fmt(z, 7) + ' <small>' + blanks[0][2] + '</small>' }))) : [h('div', {}, h('span', {}, 'Result'), h('b', {}, 'No real solution found'))])); };
      filt.oninput = () => { const t = filt.value.toLowerCase(); [...sel.querySelectorAll('option')].forEach(o => o.hidden = t && !o.textContent.toLowerCase().includes(t)); };
      sel.onchange = build; box.addEventListener('input', go);
      el.append(h('div', { class: 'form' }, h('div', { class: 'fld' }, h('label', {}, 'Search'), filt), h('div', { class: 'fld', style: 'grid-column:span 2' }, h('label', {}, 'Equation'), sel)), eq, box, h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: go }, 'Solve')), out); build();
    }
  });

  /* ======================= Equation-system solver (EES-lite) ======================= */
  const FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, sqrt: Math.sqrt, abs: Math.abs, pow: Math.pow, min: Math.min, max: Math.max, cbrt: Math.cbrt,
    erf: x => U.erf(x), erfc: x => U.erfc(x), J0: x => U.J(0, x), J1: x => U.J(1, x), I0: x => U.I(0, x), I1: x => U.I(1, x), K0: x => U.K(0, x), K1: x => U.K(1, x),
    pi: Math.PI, sigma: SIG, g: 9.80665, Ru: 8.314462618,
    prop: (fl, out, a, av, b, bv) => { const F = U._flc[fl]; if (!F) throw new Error('Fluid ' + fl + ' not loaded'); const st = F.state({ [a]: av, [b]: bv }); return st[out]; },
    tsat: (fl, P) => U._flc[fl].Tsat(P), psat: (fl, T) => U._flc[fl].satT(T).P,
    air: (p, T) => U.IG.air(p, T), airT: (p, v) => U.IG.airT(p, v),
    hbar: (sp, T) => U.IG.hbar(sp, T), s0: (sp, T) => U.IG.s0(sp, T), cpbar: (sp, T) => U.IG.cp(sp, T),
    tr: (fl, p, T) => U.TR.get(fl, T)[p], C2K: x => x + 273.15, K2C: x => x - 273.15
  };
  U._flc = {};
  const parse = src => {
    const eqs = [], guesses = {};
    src.split('\n').forEach((raw, ln) => {
      let line = raw.replace(/\/\/.*$|#.*$/, '').trim(); if (!line) return;
      line.split(';').forEach(part => {
        part = part.trim(); if (!part) return;
        const gm = part.match(/^guess\s+([A-Za-z_]\w*)\s*=\s*(.+)$/i); if (gm) { guesses[gm[1]] = +Function('return (' + gm[2] + ')')(); return; }
        const i = part.indexOf('='); if (i < 0) throw new Error(`Line ${ln + 1}: no "=" found`);
        const lhs = part.slice(0, i), rhs = part.slice(i + 1); const vars = new Set();
        const conv = s => s.replace(/\^/g, '**').replace(/(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|'[^']*'|"[^"]*"|[A-Za-z_]\w*(\s*\()?/g, m => { if (/^['"\d.]/.test(m)) return m; if (m.includes('(')) return m; if (m in FN) return m; if (/^(e|E)$/.test(m)) return m; vars.add(m); return `V["${m}"]`; });
        const code = `with(F){return (${conv(lhs)})-(${conv(rhs)});}`;
        let fn; try { fn = new Function('V', 'F', code); } catch (e) { throw new Error(`Line ${ln + 1}: ${e.message}`); }
        eqs.push({ src: part, line: ln + 1, fn: V => fn(V, FN), vars: [...vars], simple: /^\s*[A-Za-z_]\w*\s*$/.test(lhs) ? lhs.trim() : null });
      });
    });
    return { eqs, guesses };
  };
  const solveSystem = (src) => {
    const { eqs, guesses } = parse(src); const V = {}, known = new Set(), log = [];
    const all = new Set(); eqs.forEach(e => e.vars.forEach(x => all.add(x)));
    if (eqs.length !== all.size) log.push(`⚠ ${eqs.length} equations, ${all.size} unknowns — ${eqs.length < all.size ? 'under' : 'over'}-specified.`);
    let rest = eqs.slice(), changed = true;
    while (changed) {
      changed = false;
      for (const e of rest.slice()) {
        const unk = e.vars.filter(x => !known.has(x)); if (unk.length !== 1) { if (!unk.length) { rest.splice(rest.indexOf(e), 1); const r = e.fn(V); if (Math.abs(r) > 1e-6 * (1 + Math.abs(r))) log.push(`⚠ Over-determined/inconsistent: "${e.src}" residual ${U.f(r, 3)}`); } continue; }
        const x = unk[0]; let ok = false;
        if (e.simple === x) { V[x] = 0; let r; try { r = e.fn(V); } catch (er) { r = NaN; } if (isFinite(r)) { V[x] = -r; try { if (Math.abs(e.fn(V)) < 1e-9 * (1 + Math.abs(V[x]))) ok = true; } catch (er) { } } }
        if (!ok) { // 1-D numeric
          const f = z => { V[x] = z; try { return e.fn(V); } catch (er) { return NaN; } };
          let z = guesses[x] ?? 1, done = false;
          for (let it = 0; it < 60; it++) { const fz = f(z), d = Math.max(1e-7, Math.abs(z) * 1e-7), fp = (f(z + d) - fz) / d; if (!isFinite(fz) || !isFinite(fp) || fp === 0) break; const zn = z - fz / fp; if (Math.abs(zn - z) < 1e-11 * (1 + Math.abs(z))) { z = zn; done = true; break; } z = zn; }
          if (!done || !isFinite(f(z)) || Math.abs(f(z)) > 1e-6) { const cand = []; for (const sgn of [1, -1]) { let a = sgn * 1e-10, fa = f(a); for (let ex = -10; ex <= 10; ex += 0.05) { const b = sgn * Math.pow(10, ex), fb = f(b); if (isFinite(fa) && isFinite(fb) && fa * fb < 0) { cand.push(U.brent(f, a, b, 1e-13)); } a = b; fa = fb; } } const gz = guesses[x] ?? 1; cand.sort((p, q) => Math.abs(p - gz) - Math.abs(q - gz)); if (cand.length) { z = cand[0]; done = true; } }
          if (!done) throw new Error(`Could not solve "${e.src}" for ${x} — supply a guess: guess ${x} = …`);
          V[x] = z; f(z);
        }
        known.add(x); rest.splice(rest.indexOf(e), 1); changed = true; log.push(`✓ ${x} from line ${e.line}`);
      }
    }
    if (rest.length) { // simultaneous block — Newton–Raphson
      const unk = [...new Set(rest.flatMap(e => e.vars.filter(x => !known.has(x))))];
      if (unk.length !== rest.length) throw new Error(`Remaining block has ${rest.length} equations but ${unk.length} unknowns (${unk.join(', ')})`);
      let x = unk.map(u => guesses[u] ?? 1);
      const Fv = xx => { unk.forEach((u, i) => V[u] = xx[i]); return rest.map(e => e.fn(V)); };
      for (let it = 0; it < 200; it++) {
        const f0 = Fv(x), n0 = Math.hypot(...f0); if (n0 < 1e-10) break;
        const J = unk.map(() => []); unk.forEach((u, j) => { const d = Math.max(1e-7, Math.abs(x[j]) * 1e-7), xx = x.slice(); xx[j] += d; const f1 = Fv(xx); f1.forEach((fi, i) => J[i][j] = (fi - f0[i]) / d); });
        const dx = U.linsolve(J, f0.map(z => -z)); if (dx.some(z => !isFinite(z))) throw new Error('Singular Jacobian — try different guesses');
        let lam = 1; for (let k = 0; k < 30; k++) { const xn = x.map((xi, i) => xi + lam * dx[i]); const fn = Fv(xn); if (fn.every(isFinite) && Math.hypot(...fn) < n0) { x = xn; break; } lam /= 2; if (k === 29) x = xn; }
      }
      const fin = Fv(x); if (Math.hypot(...fin) > 1e-6) log.push('⚠ Newton did not fully converge (residual ' + U.f(Math.hypot(...fin), 3) + ') — adjust guesses');
      unk.forEach(u => known.add(u)); log.push(`✓ simultaneous block solved for ${unk.join(', ')}`);
    }
    return { V, log };
  };
  U.solveSystem = solveSystem;
  const EX = {
    'Rankine cycle with steam tables': `// SI units: P [Pa], T [K], h [kJ/kg], s [kJ/kg.K]
P_hi = 8e6;  T3 = C2K(500);  P_lo = 10e3;  eta_t = 0.85;  eta_p = 0.9
h1 = prop('water','h','P',P_lo,'x',0);  v1 = prop('water','v','P',P_lo,'x',0)
h2 = h1 + v1*(P_hi-P_lo)/1000/eta_p
h3 = prop('water','h','P',P_hi,'T',T3);  s3 = prop('water','s','P',P_hi,'T',T3)
h4s = prop('water','h','P',P_lo,'s',s3)
h4 = h3 - eta_t*(h3-h4s)
x4 = prop('water','x','P',P_lo,'h',h4)
w_net = (h3-h4) - (h2-h1);  q_in = h3 - h2
eta = w_net/q_in`,
    'Composite wall: unknown interface temperatures (simultaneous)': `// Furnace wall: firebrick + insulation, convection both sides
Ti = 1000; To = 30; hi = 60; ho = 12
k1 = 1.2; L1 = 0.2; k2 = 0.08; L2 = 0.1
q = hi*(Ti - T1)        // inner convection [W/m2]
q = k1*(T1 - T2)/L1      // firebrick
q = k2*(T2 - T3)/L2      // insulation
q = ho*(T3 - To)         // outer convection
guess T1 = 900; guess T2 = 800; guess T3 = 60; guess q = 500`,
    'Fin + radiation (implicit)': `// Sphere of radius r cooled by convection + radiation: find steady T given internal power
Pw = 50; r = 0.05; h = 10; eps = 0.8; Tinf = 300; Tsur = 300
A = 4*pi*r^2
Pw = h*A*(T - Tinf) + eps*sigma*A*(T^4 - Tsur^4)
guess T = 400`,
    'Otto cycle with variable specific heats': `// Air tables: air('u',T), air('vr',T), airT('vr', value)
r = 9; T1 = 300; T3 = 1800
u1 = air('u',T1); vr1 = air('vr',T1)
vr2 = vr1/r; T2 = airT('vr',vr2); u2 = air('u',T2)
u3 = air('u',T3); vr3 = air('vr',T3)
vr4 = vr3*r; T4 = airT('vr',vr4); u4 = air('u',T4)
q_in = u3-u2; q_out = u4-u1; eta = 1 - q_out/q_in`,
    'Adiabatic flame temperature of methane': `// NASA species data: hbar(species,T) in kJ/kmol (includes formation enthalpy)
HR = hbar('CH4',298.15) + 2*(hbar('O2',298.15) + 3.76*hbar('N2',298.15))
HR = hbar('CO2',Tad) + 2*hbar('H2O',Tad) + 7.52*hbar('N2',Tad)
guess Tad = 2000`,
    'Heat exchanger outlet temperatures (simultaneous)': `mh = 2; cph = 2100; Thi = 150; mc = 1.2; cpc = 4180; Tci = 20; U = 400; A = 15
Ch = mh*cph; Cc = mc*cpc
Q = Ch*(Thi - Tho)
Q = Cc*(Tco - Tci)
Q = U*A*((Thi-Tco) - (Tho-Tci))/ln((Thi-Tco)/(Tho-Tci))
guess Tho = 90; guess Tco = 60; guess Q = 2e5`
  };
  U.addCalc('ees', {
    title: 'Equation-system solver (EES-style) with built-in property functions', cat: 'Utilities', blurb: 'Type the governing equations of ANY problem in any order — implicit, simultaneous, with steam/refrigerant/air/gas properties. It finds the unknowns.',
    desc: `<p>Write one equation per line (or separate with <code>;</code>), in any order — as you would on paper. The solver first peels off equations with a single unknown, then solves any remaining simultaneous set by damped Newton–Raphson. Use <code>guess x = …</code> to help nonlinear problems. Comments start with <code>//</code>.</p>
<details class="card small"><summary><b>Built-in functions & properties</b> (click)</summary>
<p>Math: <code>sin cos tan asin acos atan atan2 sinh cosh tanh exp ln log10 sqrt abs pow min max erf erfc J0 J1 I0 I1 K0 K1</code>; constants <code>pi sigma g Ru</code>; <code>C2K(x) K2C(x)</code>.</p>
<p>Real fluids (SI: P in Pa, T in K, h/u in kJ/kg, s in kJ/kg·K, v in m³/kg): <code>prop('water','h','P',P,'T',T)</code> — any output among T,P,v,u,h,s,x and any input pair; fluids: <code>water r134a r1234yf r410a r717 r744</code>; <code>tsat('water',P)</code>, <code>psat('water',T)</code>.</p>
<p>Ideal-gas air tables: <code>air('h'|'u'|'s0'|'Pr'|'vr'|'cp', T)</code>, inverse <code>airT('vr', value)</code>. Species (NASA, kJ/kmol): <code>hbar('CO2',T)</code> (incl. formation), <code>s0('H2O',T)</code>, <code>cpbar('N2',T)</code>. Transport (T in K): <code>tr('air','k',T)</code> with props rho cp k mu nu alpha Pr beta and fluids air water steam eg50 n2 o2 co2 h2 he.</p></details>`,
    mount(el) {
      const ex = h('select', { class: 'inp' }, Object.keys(EX).map(k => h('option', {}, k)));
      const ta = h('textarea', { rows: 14, style: 'font-family:var(--mono);font-size:.9rem', spellcheck: 'false' }); ta.value = EX[ex.value];
      const out = h('div');
      const run = async () => {
        out.innerHTML = '';
        try {
          const need = [...new Set([...ta.value.matchAll(/(?:prop|tsat|psat)\(\s*'(\w+)'/g)].map(m => m[1]))];
          for (const f of need) U._flc[f] = await U.fluid(f);
          if (/air\(|airT\(|hbar\(|s0\(|cpbar\(/.test(ta.value)) await U.IG.load();
          if (/tr\(/.test(ta.value)) await U.TR.load();
          const { V, log } = solveSystem(ta.value);
          const t = h('table', { class: 'num' }, h('tr', {}, h('th', {}, 'Variable'), h('th', {}, 'Value')));
          Object.keys(V).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(k => t.append(h('tr', {}, h('td', {}, k), h('td', { html: U.fmt(V[k], 7) }))));
          out.append(h('div', { class: 'tablewrap' }, t), h('details', { class: 'small muted' }, h('summary', {}, 'Solution log'), h('pre', {}, log.join('\n'))));
        } catch (e) { out.append(h('p', { class: 'err' }, '⚠ ' + e.message)); }
      };
      ex.onchange = () => { ta.value = EX[ex.value]; run(); };
      el.append(h('div', { class: 'fld' }, h('label', {}, 'Load an example'), ex), ta, h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: run }, '▶ Solve'), h('span', { class: 'small muted' }, 'Ctrl+Enter also solves')), out);
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });
      run();
    }
  });
})();
