/* Extra views: field map, problem-solving method & decision guide */
'use strict';
(() => {
  const { h } = U, V = U.routes;
  const link = (id, t) => `<a href="#/m/${id}">${t || (U.modById[id] || {}).title || id}</a>`;
  const tool = (id, t) => `<a href="#/solve/${id}">${t || (U.calcs[id] || {}).title || id}</a>`;

  V['map'] = el => {
    el.append(h('h1', {}, 'The field at a glance'));
    el.append(h('div', { class: 'prose', html: R`<p>Three sciences, one subject: energy. <b>Thermodynamics</b> tells you <i>how much</i> energy is exchanged and what is possible; <b>heat transfer</b> tells you <i>how fast</i> thermal energy moves and what temperatures result; <b>mass transfer</b> describes how species move by the same mathematics. Every engineering thermal system — a power plant, a refrigerator, an engine, a furnace, a quench tank, a CPU cooler — needs all three.</p>` }));
    el.append(h('div', { class: 'card', html: `<svg viewBox="0 0 900 420" style="width:100%;height:auto" font-family="Inter,system-ui" font-size="13">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--muted)">
        <path d="M300 95 L420 170" marker-end="url(#ar)"/><path d="M600 95 L480 170" marker-end="url(#ar)"/><path d="M450 240 L450 300" marker-end="url(#ar)"/>
        <path d="M200 140 L200 300" marker-end="url(#ar)"/><path d="M700 140 L700 300" marker-end="url(#ar)"/><path d="M330 60 L570 60" stroke-dasharray="5 4"/></g>
      <g><rect x="80" y="20" width="250" height="120" rx="14" fill="var(--accsoft)" stroke="var(--hot)"/><text x="205" y="48" text-anchor="middle" font-weight="700" fill="var(--hot)">THERMODYNAMICS</text>
        <text x="205" y="70" text-anchor="middle" fill="var(--fg)">laws: 0th · 1st · 2nd · 3rd</text><text x="205" y="90" text-anchor="middle" fill="var(--fg)">properties · cycles · exergy</text><text x="205" y="110" text-anchor="middle" fill="var(--fg)">mixtures · combustion</text><text x="205" y="128" text-anchor="middle" fill="var(--muted)" font-size="11">“how much, how efficient, is it possible?”</text></g>
      <g><rect x="570" y="20" width="250" height="120" rx="14" fill="var(--coolsoft)" stroke="var(--cool)"/><text x="695" y="48" text-anchor="middle" font-weight="700" fill="var(--cool)">MASS TRANSFER</text>
        <text x="695" y="70" text-anchor="middle" fill="var(--fg)">Fick’s law · diffusion</text><text x="695" y="90" text-anchor="middle" fill="var(--fg)">carburizing · evaporation</text><text x="695" y="110" text-anchor="middle" fill="var(--fg)">Sh = f(Re, Sc)</text><text x="695" y="128" text-anchor="middle" fill="var(--muted)" font-size="11">“how fast do species move?”</text></g>
      <text x="450" y="52" text-anchor="middle" fill="var(--muted)" font-size="11">same mathematics (analogy)</text>
      <g><rect x="325" y="170" width="250" height="70" rx="14" fill="var(--warnsoft)" stroke="var(--warm)"/><text x="450" y="198" text-anchor="middle" font-weight="700" fill="var(--warm)">HEAT TRANSFER</text><text x="450" y="220" text-anchor="middle" fill="var(--fg)">conduction · convection · radiation</text></g>
      <g><rect x="60" y="300" width="280" height="100" rx="14" fill="var(--panel2)" stroke="var(--line2)"/><text x="200" y="326" text-anchor="middle" font-weight="700" fill="var(--fg)">Energy conversion</text><text x="200" y="348" text-anchor="middle" fill="var(--muted)">power plants · engines · gas turbines</text><text x="200" y="368" text-anchor="middle" fill="var(--muted)">refrigeration · heat pumps · HVAC</text><text x="200" y="388" text-anchor="middle" fill="var(--muted)">combustion · fuel cells</text></g>
      <g><rect x="360" y="300" width="180" height="100" rx="14" fill="var(--panel2)" stroke="var(--line2)"/><text x="450" y="326" text-anchor="middle" font-weight="700" fill="var(--fg)">Thermal design</text><text x="450" y="348" text-anchor="middle" fill="var(--muted)">heat exchangers</text><text x="450" y="368" text-anchor="middle" fill="var(--muted)">electronics cooling</text><text x="450" y="388" text-anchor="middle" fill="var(--muted)">insulation · fins</text></g>
      <g><rect x="560" y="300" width="280" height="100" rx="14" fill="var(--panel2)" stroke="var(--line2)"/><text x="700" y="326" text-anchor="middle" font-weight="700" fill="var(--fg)">Materials & processing</text><text x="700" y="348" text-anchor="middle" fill="var(--muted)">heat treatment · quenching</text><text x="700" y="368" text-anchor="middle" fill="var(--muted)">casting · welding · drying</text><text x="700" y="388" text-anchor="middle" fill="var(--muted)">case hardening · coatings</text></g></svg>` }));
    el.append(h('h2', {}, 'Learning paths'));
    const paths = [
      ['Path A — Basic Thermodynamics (first course)', ['td-basics', 'td-energy', 'td-pure', 'td-idealgas', 'td-cv', 'td-second', 'td-entropy']],
      ['Path B — Applied Thermodynamics', ['td-exergy', 'td-gascycles', 'td-vapcycles', 'td-refrig', 'td-mixtures', 'td-combustion', 'td-relations']],
      ['Path C — Heat Transfer (core course)', ['ht-intro', 'ht-cond1', 'ht-fins', 'ht-cond2d', 'ht-transient', 'ht-external', 'ht-internal', 'ht-natural', 'ht-boilcond', 'ht-hx', 'ht-rad1', 'ht-rad2']],
      ['Path D — Mass Transfer', ['mt-diffusion', 'mt-transient', 'mt-convective']],
      ['Path E — Heat treatment & quenching (cross-cutting)', ['ht-transient', 'ht-boilcond', 'mt-transient', 'td-combustion', 'ht-rad2']],
      ['Path F — HVAC & refrigeration engineer', ['td-refrig', 'td-mixtures', 'ht-hx', 'ht-external', 'mt-convective']]
    ];
    el.append(h('div', { class: 'grid' }, paths.map(([t, ids]) => h('div', { class: 'card', html: `<h3>${t}</h3><ol class="small">${ids.map(i => '<li>' + link(i) + '</li>').join('')}</ol>` }))));
    el.append(h('h2', {}, 'How each module is organised'));
    el.append(h('div', { class: 'prose', html: `<ul><li><b>① Fundamentals</b> — concepts and the governing laws (broad overview).</li><li><b>② Technical</b> — methods, correlations, procedures, common mistakes (working depth).</li><li><b>③ Advanced</b> — derivations, modern research and refinements (narrow depth).</li><li><b>⚙️ Practice & industry</b> — real numbers, equipment and applications.</li><li><b>∑ Formula sheet</b> — every key equation in one place.</li><li><b>🎞️ Animations & solvers</b> — see it, then compute it.</li><li><b>📝 Questions</b> — MCQs with explanations, descriptive questions with model answers, and numerical generators with progressive hints and full solutions (new values every time).</li></ul>` }));
  };

  /* ---------- method + decision guide ---------- */
  const TREE = {
    q: 'What is the problem fundamentally about?', o: [
      ['How much energy / work / heat, or is a device possible?', {
        q: 'What kind of system?', o: [
          ['Fixed mass (piston–cylinder, rigid tank, closed vessel)', { r: ['td-energy', 'td-pure', 'td-idealgas'], t: ['igproc', 'props', 'ees'], s: 'Closed-system first law Q − W = ΔU. Find states with tables/ideal gas; W from the process path.' }],
          ['Flowing fluid through a device (turbine, nozzle, pump, valve, mixer, HX)', { r: ['td-cv'], t: ['sfdev', 'props', 'ees'], s: 'SFEE per device; properties from tables; check isentropic efficiency.' }],
          ['Tank being filled or emptied (unsteady)', { r: ['td-cv'], t: ['tank', 'ees'], s: 'Uniform-flow balances: m₂u₂ − m₁u₁ = m_ih_i − m_eh_e + Q − W.' }],
          ['A whole cycle (power plant, engine, refrigerator, heat pump)', {
            q: 'Which cycle?', o: [
              ['Gas cycle: Otto / Diesel / Dual / Stirling', { r: ['td-gascycles'], t: ['aircycle'], s: 'Air-standard analysis; decide cold-air vs variable cp.' }],
              ['Gas turbine / jet engine', { r: ['td-gascycles'], t: ['brayton', 'turbojet', 'combined'], s: 'Brayton with η_C, η_T; regeneration only if T₄ > T₂.' }],
              ['Steam power plant', { r: ['td-vapcycles'], t: ['rankine', 'combined'], s: 'Rankine states from steam tables; mass fractions for bleeds.' }],
              ['Refrigerator / heat pump / A/C', { r: ['td-refrig'], t: ['vcr', 'gasref'], s: 'States 1–4 on P–h; h₄ = h₃; COP.' }],
              ['Air compressor', { r: ['td-gascycles'], t: ['recip'], s: 'Polytropic work, multistaging, volumetric efficiency.' }]]
          }],
          ['Feasibility / efficiency limit / entropy / exergy', { r: ['td-second', 'td-entropy', 'td-exergy'], t: ['carnot', 'entropy', 'exergy'], s: 'Compare with Carnot; S_gen ≥ 0; X_dest = T₀S_gen.' }],
          ['Moist air, A/C, drying, cooling tower', { r: ['td-mixtures'], t: ['psychro'], s: 'Per kg dry air; ω, h, φ; mass + energy balances; chart.' }],
          ['Combustion / fuel / flame temperature', { r: ['td-combustion'], t: ['combust', 'ees'], s: 'Balance the equation; AF; first law with h_f°; T_ad by iteration.' }],
          ['Real gas / high pressure / near critical', { r: ['td-idealgas', 'td-relations'], t: ['realgas', 'props'], s: 'Check P_R, T_R; use Z or a cubic EOS / real-fluid tables.' }]]
      }],
      ['How fast is heat transferred / what are temperatures?', {
        q: 'Is the problem steady or does it change with time?', o: [
          ['Steady', {
            q: 'Dominant mechanism?', o: [
              ['Conduction through layers (wall, pipe, sphere), insulation', { r: ['ht-cond1'], t: ['composite', 'critrad'], s: 'Thermal-resistance network.' }],
              ['Conduction with internal heat generation (wires, fuel rods)', { r: ['ht-cond1'], t: ['heatgen'], s: 'Parabolic profiles; Ts from energy balance.' }],
              ['Fins / extended surfaces / heat sinks', { r: ['ht-fins'], t: ['fin'], s: 'm, mL, tip condition; η_f, ε_f, η_o.' }],
              ['2-D conduction, buried pipes, corners', { r: ['ht-cond2d'], t: ['shape', 'fd2d'], s: 'Shape factor or finite differences.' }],
              ['Forced convection over a body', { r: ['ht-external'], t: ['extconv'], s: 'Re → correlation → Nu → h; properties at film T.' }],
              ['Flow inside pipes/ducts', { r: ['ht-internal'], t: ['intconv'], s: 'Re; laminar/turbulent; LMTD; properties at bulk mean T.' }],
              ['Natural convection / enclosures', { r: ['ht-natural'], t: ['natconv'], s: 'Ra → correlation; β = 1/T for gases.' }],
              ['Boiling or condensation', { r: ['ht-boilcond'], t: ['boil', 'cond'], s: 'ΔTe and regime; Rohsenow/CHF or Nusselt film theory.' }],
              ['Heat exchanger', { r: ['ht-hx'], t: ['hx', 'overallU'], s: 'Sizing: LMTD; rating: ε–NTU.' }],
              ['Radiation between surfaces / shields / furnaces', { r: ['ht-rad1', 'ht-rad2'], t: ['viewf', 'rad2', 'radN', 'blackbody'], s: 'View factors + radiosity network.' }],
              ['Surface losing by convection + radiation; thermocouple errors', { r: ['ht-rad2'], t: ['combrad', 'tcerror'], s: 'Surface energy balance (non-linear).' }]]
          }],
          ['Transient (heating, cooling, quenching)', { r: ['ht-transient'], t: ['transient', 'contactT'], s: 'Compute Bi: < 0.1 lumped; otherwise series/Heisler or semi-infinite; product solutions for 2-D/3-D shapes.' }]]
      }],
      ['How fast does a species (mass) move?', {
        q: 'What kind of mass-transfer problem?', o: [
          ['Diffusion through a wall / membrane / stagnant gas', { r: ['mt-diffusion'], t: ['diffsteady', 'diffcoef'], s: 'Fick’s law resistances; Stefan flow if y_A large.' }],
          ['Time-dependent diffusion into solids (carburizing, nitriding, doping)', { r: ['mt-transient'], t: ['diffsemi'], s: 'erf solution; Arrhenius D.' }],
          ['Evaporation, drying, humidification, wet-bulb', { r: ['mt-convective', 'td-mixtures'], t: ['convmass', 'psychro'], s: 'Sh correlations via heat–mass analogy.' }]]
      }],
      ['I have my own set of equations / none of the above', { r: [], t: ['ees', 'formula', 'units'], s: 'Write the governing equations in the equation-system solver — it handles implicit and simultaneous equations with steam, refrigerant, air and gas properties built in.' }]
    ]
  };
  V['method'] = el => {
    el.append(h('h1', {}, 'How to solve any thermal problem'));
    el.append(h('div', { class: 'prose', html: R`<h2>The universal procedure</h2><ol>
<li><b>Read and sketch.</b> Draw the system, its boundary (closed system or control volume), all mass flows, heat and work interactions with arrows. Label states 1, 2, 3…</li>
<li><b>Known / find.</b> List given data with units; state exactly what is asked.</li>
<li><b>Assumptions.</b> Steady or transient? Ideal gas? Constant properties? KE/PE negligible? Adiabatic? One-dimensional? Radiation negligible? Write them down — examiners and reviewers award marks for them.</li>
<li><b>Physical laws.</b> Conservation of mass, energy (first law), entropy (second law) for thermodynamics; plus a <i>rate equation</i> (Fourier, Newton, Stefan–Boltzmann, Fick) for transfer problems.</li>
<li><b>Properties.</b> Use tables for vapours/refrigerants, ideal-gas relations for gases, and evaluate convection properties at the right temperature (film for external flow, bulk mean for internal).</li>
<li><b>Solve symbolically first,</b> substitute numbers last; carry units throughout (SI: kPa·m³ = kJ).</li>
<li><b>Check.</b> Signs (is heat leaving?), magnitudes (h of air 10–100 W/m²K, η < Carnot), limiting cases, energy balances closing, dimensionless numbers in correlation ranges.</li>
<li><b>Interpret.</b> What dominates? What would you change to improve the design?</li></ol>
<div class="box key"><b>Unit traps</b>Absolute T (K) in all thermodynamic relations and T⁴; absolute P; V²/2 in J/kg → divide by 1000 for kJ/kg; kPa·m³ = kJ; 1 W = 1 J/s; 1 TR = 3.517 kW.</div>
<h2>Decision guide — find the right theory and tool</h2><p>Answer the questions; the guide sends you to the relevant module and solver.</p>` }));
    const box = h('div', { class: 'card' }); el.append(box);
    const crumbs = [];
    const show = node => {
      box.innerHTML = '';
      if (crumbs.length) box.append(h('div', { class: 'crumbs' }, crumbs.map(c => c[0]).join(' › ')), h('button', { class: 'btn sm ghost', onclick: () => { crumbs.pop(); show(crumbs.length ? crumbs[crumbs.length - 1][1] : TREE); } }, '← back'));
      if (node.q) { box.append(h('h3', {}, node.q)); node.o.forEach(([t, nx]) => box.append(h('button', { class: 'opt', style: 'display:block;width:100%;margin:6px 0;text-align:left;padding:10px 14px;border:1px solid var(--line2);border-radius:9px;background:var(--panel2);color:var(--fg);cursor:pointer;font:inherit', onclick: () => { crumbs.push([t, nx]); show(nx); } }, t))); }
      else { box.append(h('div', { class: 'box ok', html: '<b>Strategy</b>' + node.s }), node.r.length ? h('p', { html: '<b>Theory:</b> ' + node.r.map(id => link(id)).join(' · ') }) : '', h('p', { html: '<b>Solvers:</b> ' + node.t.map(id => tool(id)).join(' · ') }), h('button', { class: 'btn sm', onclick: () => { crumbs.length = 0; show(TREE); } }, '↺ Start again')); }
    };
    show(TREE);
    el.append(h('div', { class: 'prose', html: R`<h2>Dimensionless numbers cheat-sheet</h2><table><tr><th>Number</th><th>Definition</th><th>Use</th></tr>
<tr><td>Biot</td><td>\(hL/k_{solid}\)</td><td>transient conduction, fins (lumped if < 0.1)</td></tr><tr><td>Fourier</td><td>\(\alpha t/L^2\)</td><td>dimensionless time</td></tr><tr><td>Reynolds</td><td>\(VL/\nu\)</td><td>flow regime</td></tr><tr><td>Prandtl</td><td>\(\nu/\alpha\)</td><td>BL thickness ratio</td></tr><tr><td>Nusselt</td><td>\(hL/k_{fluid}\)</td><td>dimensionless h</td></tr><tr><td>Grashof / Rayleigh</td><td>\(g\beta\Delta TL^3/\nu^2\) · Pr</td><td>natural convection</td></tr><tr><td>Stanton</td><td>\(Nu/(RePr)\)</td><td>analogies</td></tr><tr><td>Peclet</td><td>\(RePr\)</td><td>advection vs conduction</td></tr><tr><td>Schmidt</td><td>\(\nu/D_{AB}\)</td><td>mass-transfer Pr</td></tr><tr><td>Sherwood</td><td>\(h_mL/D_{AB}\)</td><td>mass-transfer Nu</td></tr><tr><td>Lewis</td><td>\(\alpha/D_{AB}\)</td><td>heat–mass coupling</td></tr><tr><td>Jakob</td><td>\(c_p\Delta T/h_{fg}\)</td><td>boiling/condensation</td></tr><tr><td>Mach</td><td>\(V/c\)</td><td>compressibility</td></tr><tr><td>Knudsen</td><td>\(\lambda/L\)</td><td>continuum validity</td></tr></table>` }));
  };
})();
