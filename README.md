# Thermo · Heat · Mass — interactive engineering companion

An interactive website for **thermodynamics, heat transfer and mass transfer**, built for Mechanical Engineering students at MITE, Moodbidri. Static site (no build step), runs on GitHub Pages.

## What is inside

| Part | Contents |
|---|---|
| **29 theory modules** | Thermodynamics (14), Heat transfer (12), Mass transfer (3). Each has *Fundamentals → Technical → Advanced → Practice & industry*, a formula sheet, common mistakes, animations, linked solvers and questions. |
| **47 solvers** | Steam/refrigerant property calculator (any two of T, P, v, u, h, s, x), ideal-gas processes, steady-flow devices, tank charging, Carnot/second-law checker, entropy, exergy, real-gas EOS (vdW/RK/PR), gas mixtures, reciprocating compressors, Otto/Diesel/Dual/Stirling/Ericsson/Atkinson, Brayton (regen/intercool/reheat), Rankine (reheat, open/closed FWH), VCR, gas refrigeration, combined cycle, turbojet, psychrometrics with live chart, combustion & adiabatic flame temperature, composite walls, critical radius, heat generation, fins (all tip conditions, annular, triangular, arrays), shape factors, 2-D finite-difference solver, transient (lumped, exact series, semi-infinite), external/internal/natural convection, boiling, condensation, heat exchangers (ε–NTU & LMTD, 7 arrangements), overall U, blackbody, view factors, radiation shields, N-surface enclosures, thermocouple radiation error, diffusion coefficients, steady & transient diffusion (carburizing), convective mass transfer, unit converter, **universal formula solver** (solve any of 80+ equations for any variable) and an **EES-style equation-system solver** with built-in steam/refrigerant/air/gas/transport property functions. |
| **20 animations** | Piston–cylinder processes, boiling at constant P on T–v, cycles on P–v & T–s, four-stroke engine, refrigerator and Rankine loops, entropy of mixing, nozzles/throttles, three modes, composite wall, transient slab (FD), fins, boundary layers, pipe entry flow, natural convection, boiling curve, **quench probe cooling curves**, heat-exchanger flows, Planck spectrum, diffusion random walk. |
| **Question bank** | 225 MCQs with explanations, 104 descriptive questions with model answers, 74 numerical generators (new values every time) with progressive hints, auto-checking (±2–5 %) and full solutions. Quiz mode, numerical drill and progress tracking (stored in the browser). |
| **Data handbook** | Steam (saturated T/P, superheated, compressed liquid), 5 refrigerants, air ideal-gas table, NASA species tables, enthalpies of formation, critical constants, transport properties of air/water/steam/gases/glycol, solids, emissivities, erf, Bessel functions, one-term coefficients, blackbody functions, design data. Every table downloads as CSV. |

## Data sources and accuracy
* Water/steam: IAPWS-95; refrigerants (R-134a, R-1234yf, R-410A, R-717, R-744): reference Helmholtz-energy equations of state; transport properties — all tabulated with **CoolProp** (`tools/gen_data.py`). Interpolated enthalpy agrees with CoolProp to a median 0.1 kJ/kg (worst ≈ 5 kJ/kg near the critical region).
* Ideal-gas species: NASA 7-coefficient polynomials from GRI-Mech 3.0 (via **Cantera**). Air table referenced to h(298.15 K) = 298.18 kJ/kg, s° = 1.69528 kJ/kg·K.
* Solids and emissivities: representative handbook values near 300 K.
* Solvers were checked against standard textbook worked examples (Rankine, VCR, Brayton, Diesel, psychrometrics, combustion, convection, boiling, radiation).

## Run locally
Any static server, e.g. `python3 -m http.server` in this folder, then open `http://localhost:8000`.

## Structure
```
index.html          shell
css/style.css       styles (light/dark)
js/core.js          helpers, numerics (Brent, Bessel, erf, linear algebra), plotting
js/props.js         real-fluid property engine, ideal-gas & transport lookups
js/app.js           router, module/question/solver/animation renderers
js/views.js         field map, problem-solving method & decision guide
js/calc/*.js        solvers           js/anim/*.js      animations
js/content/*.js     theory + questions js/handbook.js    data tables
js/data/*.js        generated property data (lazy-loaded)
vendor/katex        KaTeX (MIT) for equations
tools/gen_data.py   regenerates js/data from CoolProp + Cantera
```

## Licence
Content and code © Dr. Vignesh Nayak Ullal, MITE. KaTeX is MIT-licensed (see `vendor/katex/LICENSE`).
