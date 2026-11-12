/* Property engine: real fluids from tabulated IAPWS-95 / Helmholtz EOS data (CoolProp-generated),
   ideal-gas species from NASA polynomials (GRI-Mech 3.0, via Cantera). SI: T[K], P[Pa], v[m3/kg], h,u[kJ/kg], s[kJ/kg.K] */
'use strict';
class Fluid {
  constructor(key, d) {
    this.key = key; this.d = d; this.name = d.name; this.Tc = d.Tc; this.Pc = d.Pc; this.M = d.M;
    this.R = 8.314462618 / d.M; // kJ/kg.K
    const s = d.sat; this.sat = s; this.lnPs = s.P.map(Math.log);
    this.rows = d.rows; this.lnP = d.rows.map(r => Math.log(r.P));
    this.Tmin = s.T[0]; this.Tmax = d.Tmax; this.Pmin = d.rows[0].P; this.Pmax = d.rows[d.rows.length - 1].P;
    for (const r of this.rows) for (const side of ['vap', 'liq']) { r[side + 'd'] = r[side].map(a => a[0]); }
  }
  /* saturation by T */
  satT(T) {
    const s = this.sat; if (T < s.T[0] - 1e-6 || T > this.Tc + 1e-6) throw new Error(`T outside saturation range (${(s.T[0] - 273.15).toFixed(2)}–${(this.Tc - 273.15).toFixed(2)} °C)`);
    if (T >= s.T[s.T.length - 1]) T = Math.min(T, s.T[s.T.length - 1]);
    const i = U.bsearch(s.T, T), f = (T - s.T[i]) / (s.T[i + 1] - s.T[i]);
    const L = k => s[k][i] + f * (s[k][i + 1] - s[k][i]);
    // Clausius–Clapeyron-friendly: ln P linear in 1/T
    const inv = (1 / T - 1 / s.T[i]) / (1 / s.T[i + 1] - 1 / s.T[i]);
    const P = Math.exp(this.lnPs[i] + inv * (this.lnPs[i + 1] - this.lnPs[i]));
    const o = { T, P, vf: L('vf'), vg: Math.exp(Math.log(s.vg[i]) + f * (Math.log(s.vg[i + 1]) - Math.log(s.vg[i]))), hf: L('hf'), hg: L('hg'), sf: L('sf'), sg: L('sg') };
    o.uf = o.hf - P * o.vf / 1000; o.ug = o.hg - P * o.vg / 1000; o.hfg = o.hg - o.hf; o.sfg = o.sg - o.sf; o.vfg = o.vg - o.vf; o.ufg = o.ug - o.uf;
    return o;
  }
  Tsat(P) {
    const s = this.sat; if (P < s.P[0] * 0.9999 || P > this.Pc * 1.0001) throw new Error(`P outside saturation range (${U.f(s.P[0] / 1e3)}–${U.f(this.Pc / 1e3)} kPa)`);
    const lp = Math.log(P), i = U.bsearch(this.lnPs, lp);
    const f = (lp - this.lnPs[i]) / (this.lnPs[i + 1] - this.lnPs[i]);
    return 1 / (1 / s.T[i] + f * (1 / s.T[i + 1] - 1 / s.T[i]));
  }
  satP(P) { return this.satT(this.Tsat(P)); }
  Tref(P) { return P < this.Pc ? this.Tsat(P) : this.Tc; }
  /* single-phase state from (P,T) using reduced coordinate dT = |T - Tref(P)| */
  _row(r, side, d) {
    const ds = r[side + 'd'], a = r[side]; if (!a.length) return null;
    if (d > ds[ds.length - 1] + 1e-9) return null;
    const i = U.bsearch(ds, d), f = (d - ds[i]) / (ds[i + 1] - ds[i] || 1);
    const A = a[i], B = a[Math.min(i + 1, a.length - 1)];
    return side === 'vap' ? [Math.exp(Math.log(A[1]) + f * (Math.log(B[1]) - Math.log(A[1]))), A[2] + f * (B[2] - A[2]), A[3] + f * (B[3] - A[3])]
      : [A[1] + f * (B[1] - A[1]), A[2] + f * (B[2] - A[2]), A[3] + f * (B[3] - A[3])];
  }
  PT(P, T, sideHint) {
    if (P < this.Pmin * 0.999 || P > this.Pmax * 1.001) throw new Error(`P outside table (${U.f(this.Pmin / 1e3)} kPa – ${U.f(this.Pmax / 1e6)} MPa)`);
    if (T < this.Tmin - 1e-6 || T > this.Tmax + 1e-6) throw new Error(`T outside table (${(this.Tmin - 273.15).toFixed(2)}–${(this.Tmax - 273.15).toFixed(0)} °C)`);
    const Tr = this.Tref(P); let side = sideHint || (T >= Tr ? 'vap' : 'liq'); const d = Math.abs(T - Tr);
    const lp = Math.log(P), i = U.bsearch(this.lnP, lp), f = (lp - this.lnP[i]) / (this.lnP[i + 1] - this.lnP[i]);
    const a = this._row(this.rows[i], side, d), b = this._row(this.rows[i + 1], side, d);
    let v, h, s;
    if (a && b) { v = side === 'vap' ? Math.exp(Math.log(a[0]) + f * (Math.log(b[0]) - Math.log(a[0]))) : a[0] + f * (b[0] - a[0]); h = a[1] + f * (b[1] - a[1]); s = a[2] + f * (b[2] - a[2]); }
    else if (a || b) { const c = a || b; v = c[0]; h = c[1]; s = c[2]; }
    else throw new Error('State outside tabulated range');
    const phase = P >= this.Pc ? (T >= this.Tc ? 'supercritical fluid' : 'compressed liquid (P > Pc)') : (side === 'vap' ? (d < 1e-9 ? 'saturated vapour' : 'superheated vapour') : (d < 1e-9 ? 'saturated liquid' : 'compressed (subcooled) liquid'));
    return this._mk({ T, P, v, h, s, x: null, phase });
  }
  _mk(o) { o.u = o.h - o.P * o.v / 1000; o.rho = 1 / o.v; return o; }
  _two(T, x) {
    const s = this.satT(T);
    return this._mk({ T, P: s.P, x, v: s.vf + x * (s.vg - s.vf), h: s.hf + x * s.hfg, s: s.sf + x * s.sfg, phase: x <= 0 ? 'saturated liquid' : x >= 1 ? 'saturated vapour' : 'saturated mixture (wet)', sat: s });
  }
  /* general state: give any two of T,P,v,h,s,u,x (SI, T in K, P in Pa) */
  state(inp) {
    const k = Object.keys(inp).filter(k => inp[k] != null && inp[k] !== '' && !Number.isNaN(inp[k]));
    if (k.length !== 2) throw new Error('Specify exactly two independent properties');
    const has = n => k.includes(n), g = n => +inp[n];
    if (has('x')) {
      const x = g('x'); if (x < 0 || x > 1) throw new Error('Quality must be 0–1');
      if (has('T')) return this._two(g('T'), x);
      if (has('P')) return this._two(this.Tsat(g('P')), x);
      // x with h/s/v/u -> solve T
      const p = k.find(n => n !== 'x');
      const T = U.solve(T => this._two(T, x)[p] - g(p), this.Tmin, this.sat.T[this.sat.T.length - 1], 200);
      if (!isFinite(T)) throw new Error('No saturated state found'); return this._two(T, x);
    }
    if (has('T') && has('P')) return this.PT(g('P'), g('T'));
    if (has('P')) { const p = k.find(n => n !== 'P'); return this._Pz(g('P'), p, g(p)); }
    if (has('T')) { const p = k.find(n => n !== 'T'); return this._Tz(g('T'), p, g(p)); }
    // two of h,s,v,u : outer search on P
    const [p1, p2] = k;
    const fP = P => { try { return this._Pz(P, p1, g(p1))[p2] - g(p2); } catch (e) { return NaN; } };
    const P = this._logScan(fP, this.Pmin * 1.001, this.Pmax * 0.999);
    if (!isFinite(P)) throw new Error('No state found for that pair'); return this._Pz(P, p1, g(p1));
  }
  _logScan(f, a, b) {
    const n = 120, la = Math.log(a), lb = Math.log(b); let x0 = la, f0 = f(a);
    for (let i = 1; i <= n; i++) { const x1 = la + (lb - la) * i / n, f1 = f(Math.exp(x1)); if (isFinite(f0) && isFinite(f1) && f0 * f1 <= 0) return Math.exp(U.brent(t => f(Math.exp(t)), x0, x1, 1e-12)); x0 = x1; f0 = f1; }
    return NaN;
  }
  _Pz(P, p, z) { // P and one of h,s,v,u
    if (P < this.Pc) {
      const s = this.satP(P), zf = s[p + 'f'], zg = s[p + 'g'];
      if (z >= Math.min(zf, zg) && z <= Math.max(zf, zg)) return this._two(s.T, (z - zf) / (zg - zf));
      if (z > zg) { const T = U.solve(T => this.PT(P, T, 'vap')[p] - z, s.T, this.Tmax, 120); if (!isFinite(T)) throw new Error('Beyond table (too hot)'); return this.PT(P, T, 'vap'); }
      const T = U.solve(T => this.PT(P, T, 'liq')[p] - z, this.Tmin, s.T, 120); if (!isFinite(T)) throw new Error('Below table (too cold)'); return this.PT(P, T, 'liq');
    }
    const T = U.solve(T => this.PT(P, T)[p] - z, this.Tmin, this.Tmax, 200); if (!isFinite(T)) throw new Error('No state found'); return this.PT(P, T);
  }
  _Tz(T, p, z) { // T and one of h,s,v,u
    if (T < this.Tc - 0.05) {
      const s = this.satT(T), zf = s[p + 'f'], zg = s[p + 'g'];
      if (z >= Math.min(zf, zg) && z <= Math.max(zf, zg)) return this._two(T, (z - zf) / (zg - zf));
      const vapSide = (p === 'h' || p === 'u') ? z > zg : z > zg; // s,v,h,u larger than g -> vapour (lower P)
      if (vapSide) { const P = this._logScan(P => this.PT(P, T, 'vap')[p] - z, this.Pmin * 1.001, s.P * 0.9999); if (!isFinite(P)) throw new Error('Beyond table'); return this.PT(P, T, 'vap'); }
      const P = this._logScan(P => this.PT(P, T, 'liq')[p] - z, s.P * 1.0001, this.Pmax * 0.999); if (!isFinite(P)) throw new Error('No compressed-liquid state found'); return this.PT(P, T, 'liq');
    }
    const P = this._logScan(P => this.PT(P, T)[p] - z, this.Pmin * 1.001, this.Pmax * 0.999); if (!isFinite(P)) throw new Error('No state found'); return this.PT(P, T);
  }
}
U.Fluid = Fluid;
U.FLUIDS = { water: 'Water / Steam', r134a: 'R-134a', r1234yf: 'R-1234yf', r410a: 'R-410A', r717: 'R-717 Ammonia', r744: 'R-744 CO₂' };
const _fl = {};
U.fluid = async key => { if (_fl[key]) return _fl[key]; await U.need(key); return (_fl[key] = new Fluid(key, D[key])); };
U.fl = key => { if (_fl[key]) return _fl[key]; if (!window.D || !D[key]) throw new Error('Property data still loading — press 🎲 New values'); return (_fl[key] = new Fluid(key, D[key])); };

/* ---------- ideal-gas species ---------- */
U.IG = {
  Ru: 8.314462618,
  async load() { await U.need('igas'); return this; },
  sp(n) { return D.igas.sp[n]; },
  _i(T) { const t = D.igas.T; return U.bsearch(t, T); },
  _p(arr, T) { const t = D.igas.T, i = U.bsearch(t, T); return U.lerp(T, t[i], t[i + 1], arr[i], arr[i + 1]); },
  cp(n, T) { return this._p(this.sp(n).cp, T); },          // kJ/kmol.K
  dh(n, T) { return this._p(this.sp(n).dh, T); },          // h(T) - h(298.15), kJ/kmol
  hbar(n, T) { return this.sp(n).hf + this.dh(n, T); },    // absolute (formation-based) enthalpy kJ/kmol
  s0(n, T) { return this._p(this.sp(n).s0, T); },          // kJ/kmol.K at 1 bar
  M(n) { return this.sp(n).M; },
  air(prop, T) { return this._p(D.igas.air[prop], T); },   // h,u,s0,cp,Pr,vr per kg (Cengel-referenced)
  airT(prop, val) { const a = D.igas.air; return U.interp(a[prop], a.T, val); }
};
U.SPECIES_NAMES = { N2: 'Nitrogen N₂', O2: 'Oxygen O₂', CO2: 'Carbon dioxide CO₂', H2O: 'Water vapour H₂O', CO: 'Carbon monoxide CO', H2: 'Hydrogen H₂', OH: 'Hydroxyl OH', NO: 'Nitric oxide NO', CH4: 'Methane CH₄', AR: 'Argon Ar', C2H6: 'Ethane C₂H₆', C3H8: 'Propane C₃H₈', C2H4: 'Ethylene C₂H₄', C2H2: 'Acetylene C₂H₂', H: 'Atomic H', O: 'Atomic O', N: 'Atomic N', NO2: 'Nitrogen dioxide NO₂', N2O: 'Nitrous oxide N₂O', CH3OH: 'Methanol vapour CH₃OH' };

/* ---------- transport property tables ---------- */
U.TR = {
  async load() { await U.need('trans'); return this; },
  list() { return Object.keys(D.trans).filter(k => D.trans[k].name); },
  get(f, T) {
    const t = D.trans[f]; if (!t) throw new Error('unknown fluid');
    const lo = t.T[0], hi = t.T[t.T.length - 1];
    if (T < lo - 0.01 || T > hi + 0.01) throw new Error(`${t.name}: T must be ${lo}–${hi} K (${(lo - 273.15).toFixed(0)}–${(hi - 273.15).toFixed(0)} °C)`);
    const o = { T, name: t.name };
    for (const k of ['rho', 'cp', 'k', 'mu', 'nu', 'alpha', 'Pr', 'beta']) o[k] = U.interp(t.T, t[k], T);
    if (f === 'air' || f === 'n2' || f === 'o2' || f === 'co2' || f === 'h2' || f === 'he' || f === 'steam') o.beta = 1 / T; // ideal-gas β
    return o;
  },
  watersat(T) { const t = D.trans.watersat, o = { T }; for (const k in t) if (k !== 'T') o[k] = U.interp(t.T, t[k], T); return o; }
};
U.TR_NAMES = { air: 'Air (1 atm)', water: 'Water (sat. liquid)', eg50: 'Ethylene glycol–water 50%', steam: 'Steam (1 atm)', n2: 'Nitrogen (1 atm)', o2: 'Oxygen (1 atm)', co2: 'CO₂ (1 atm)', h2: 'Hydrogen (1 atm)', he: 'Helium (1 atm)', r134a_l: 'R-134a (sat. liquid)', nh3_l: 'Ammonia (sat. liquid)' };

/* ---------- solid materials (typical values near 300 K; Incropera App. A order-of-magnitude reference) ---------- */
U.SOLIDS = [
  ['Aluminium, pure', 2702, 903, 237], ['Aluminium alloy 2024-T6', 2770, 875, 177], ['Aluminium alloy 6061', 2700, 896, 167],
  ['Copper, pure', 8933, 385, 401], ['Brass (70Cu–30Zn)', 8530, 380, 110], ['Bronze (commercial)', 8800, 420, 52],
  ['Iron, pure', 7870, 447, 80.2], ['Carbon steel, plain', 7854, 434, 60.5], ['AISI 1010 steel', 7832, 434, 63.9],
  ['Stainless steel AISI 304', 7900, 477, 14.9], ['Stainless steel AISI 316', 8238, 468, 13.4], ['Cast iron (grey)', 7200, 420, 52],
  ['Nickel, pure', 8900, 444, 90.7], ['Inconel X-750', 8510, 439, 11.7], ['Titanium, pure', 4500, 522, 21.9], ['Ti-6Al-4V', 4430, 526, 6.7],
  ['Gold', 19300, 129, 317], ['Silver', 10500, 235, 429], ['Lead', 11340, 129, 35.3], ['Tungsten', 19300, 132, 174], ['Zinc', 7140, 389, 116],
  ['Silicon', 2330, 712, 148], ['Brick, common', 1920, 835, 0.72], ['Fireclay brick', 2050, 960, 1.0], ['Concrete (stone mix)', 2300, 880, 1.4],
  ['Glass, plate', 2500, 750, 1.4], ['Pyrex', 2225, 835, 1.4], ['Ice (273 K)', 920, 2040, 1.88], ['Wood, oak (across grain)', 545, 2385, 0.17],
  ['Wood, pine', 640, 2805, 0.12], ['Gypsum plaster', 1680, 1085, 0.22], ['Teflon (PTFE)', 2200, 1050, 0.35], ['Rubber, hard', 1190, 2010, 0.16],
  ['Glass fibre insulation', 32, 835, 0.038], ['Expanded polystyrene', 30, 1210, 0.034], ['Polyurethane foam', 70, 1045, 0.026],
  ['Mineral wool', 100, 840, 0.04], ['Soil (dry)', 2050, 1840, 0.52], ['Granite', 2630, 775, 2.79], ['Sand', 1515, 800, 0.27]
].map(([n, rho, cp, k]) => ({ n, rho, cp, k, alpha: k / (rho * cp) }));
U.EMISS = [
  ['Aluminium, polished', 0.05], ['Aluminium, oxidised', 0.25], ['Aluminium, anodised', 0.84], ['Copper, polished', 0.03], ['Copper, oxidised', 0.65],
  ['Stainless steel, polished', 0.17], ['Steel, oxidised', 0.80], ['Gold, polished', 0.02], ['Silver, polished', 0.02], ['Nickel, polished', 0.07],
  ['Paint, black (Parsons)', 0.98], ['Paint, white acrylic', 0.90], ['Brick, red', 0.93], ['Concrete', 0.90], ['Glass', 0.92],
  ['Water', 0.96], ['Ice', 0.97], ['Snow', 0.82], ['Human skin', 0.95], ['Wood', 0.90], ['Asphalt', 0.90], ['Soil', 0.93], ['Paper', 0.92]
];
U.HF = { // enthalpy of formation kJ/kmol at 298 K, 1 atm (gas unless noted) — for fuels absent from GRI
  'C8H18(l)': -249950, 'C8H18(g)': -208450, 'C12H26(g)': -291010, 'C2H5OH(l)': -277690, 'C2H5OH(g)': -235310, 'CH3OH(l)': -238660,
  'H2O(l)': -285830, 'C6H6(g)': 82930, 'C4H10(g)': -126150
};
