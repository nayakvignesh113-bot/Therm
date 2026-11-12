"""Generate property data files for the Thermo site from CoolProp + Cantera.
Output: site/js/data/*.js  (each assigns into window.D)"""
import json, math
import numpy as np
import CoolProp.CoolProp as CP
import cantera as ct

OUT = '/home/claude/site/js/data/'

def sig(x, n=6):
    if x is None or not math.isfinite(x): return None
    if x == 0: return 0
    return float(f'{x:.{n}g}')

def dump(name, obj):
    s = json.dumps(obj, separators=(',', ':'))
    with open(OUT + name + '.js', 'w') as f:
        f.write('window.D=window.D||{};D[%s]=%s;\n' % (json.dumps(name), s))
    print(name, len(s) // 1024, 'KB')

def P(prop, a, av, b, bv, fl):
    try:
        return CP.PropsSI(prop, a, av, b, bv, fl)
    except Exception:
        return None

# ---------------- pure fluid tables ----------------
FLUIDS = {
    # key: (CoolProp name, label, Tmin, Tmax, Pmax, nP)
    'water':  ('Water', 'Water / Steam (IAPWS-95)', 273.16, 1273.15, 100e6, 80),
    'r134a':  ('R134a', 'R-134a', 200.0, 450.0, 6e6, 50),
    'r717':   ('Ammonia', 'R-717 (Ammonia)', 200.0, 600.0, 20e6, 50),
    'r1234yf':('R1234yf', 'R-1234yf', 200.0, 410.0, 6e6, 45),
    'r410a':  ('R410A', 'R-410A', 200.0, 480.0, 8e6, 45),
    'r744':   ('CarbonDioxide', 'R-744 (CO2)', 217.0, 800.0, 30e6, 50),
}

def vapdT(span):
    g = [0, 0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100]
    x = 120
    while x <= span + 1e-9:
        g.append(x); x += 20 if x < 400 else 50
    return [d for d in g if d <= span] + ([span] if g[-1] < span else [])

for key, (fl, label, Tmin, Tmax, Pmax, nP) in FLUIDS.items():
    Tc = CP.PropsSI('Tcrit', fl); Pc = CP.PropsSI('pcrit', fl)
    Ttr = max(CP.PropsSI('Ttriple', fl), CP.PropsSI('Tmin', fl))
    Tmin = max(Tmin, Ttr)
    M = CP.PropsSI('molarmass', fl)
    # saturation table
    Ts = list(np.linspace(Tmin, Tc - 2.0, 160)) + list(np.linspace(Tc - 2.0, Tc - 0.02, 12))[1:]
    sat = {k: [] for k in ['T', 'P', 'vf', 'vg', 'hf', 'hg', 'sf', 'sg']}
    for T in Ts:
        try:
            p = CP.PropsSI('P', 'T', T, 'Q', 0, fl)
            row = [T, p, 1 / CP.PropsSI('D', 'T', T, 'Q', 0, fl), 1 / CP.PropsSI('D', 'T', T, 'Q', 1, fl),
                   CP.PropsSI('H', 'T', T, 'Q', 0, fl) / 1e3, CP.PropsSI('H', 'T', T, 'Q', 1, fl) / 1e3,
                   CP.PropsSI('S', 'T', T, 'Q', 0, fl) / 1e3, CP.PropsSI('S', 'T', T, 'Q', 1, fl) / 1e3]
        except Exception as e:
            continue
        for k, v in zip(sat, row): sat[k].append(sig(v, 7))
    Pmin = sat['P'][0]
    Ps = list(np.geomspace(Pmin * 1.0001, Pmax, nP))
    # make sure Pc neighbourhood is resolved
    Ps = sorted(set([sig(p, 5) for p in Ps] + [sig(Pc * f, 5) for f in (0.9, 0.95, 0.98, 1.02, 1.05, 1.1)]))
    rows = []
    for p in Ps:
        if p < Pc:
            Tr = CP.PropsSI('T', 'P', p, 'Q', 1, fl)
        else:
            Tr = Tc
        vap = []; liq = []
        for d in vapdT(Tmax - Tr):
            T = Tr + d
            if p < Pc and d == 0:
                st = [1 / P('D', 'P', p, 'Q', 1, fl), P('H', 'P', p, 'Q', 1, fl), P('S', 'P', p, 'Q', 1, fl)]
            else:
                dd = P('D', 'T', T, 'P', p, fl)
                if dd is None: continue
                st = [1 / dd, P('H', 'T', T, 'P', p, fl), P('S', 'T', T, 'P', p, fl)]
            if None in st: continue
            vap.append([sig(d, 6), sig(st[0], 6), sig(st[1] / 1e3, 7), sig(st[2] / 1e3, 6)])
        # liquid side: subcooling
        span = Tr - Tmin
        dl = [0, 0.5, 1, 2, 3, 5, 7.5, 10, 15, 20] + list(np.arange(30, span + 1e-6, 10)) + [span]
        for d in sorted(set([x for x in dl if x <= span])):
            T = Tr - d
            if p < Pc and d == 0:
                st = [1 / P('D', 'P', p, 'Q', 0, fl), P('H', 'P', p, 'Q', 0, fl), P('S', 'P', p, 'Q', 0, fl)]
            else:
                dd = P('D', 'T', T, 'P', p, fl)
                if dd is None: continue
                st = [1 / dd, P('H', 'T', T, 'P', p, fl), P('S', 'T', T, 'P', p, fl)]
            if None in st: continue
            liq.append([sig(d, 6), sig(st[0], 6), sig(st[1] / 1e3, 7), sig(st[2] / 1e3, 6)])
        rows.append({'P': p, 'Tr': sig(Tr, 7), 'vap': vap, 'liq': liq})
    dump(key, {'name': label, 'M': sig(M * 1e3, 6), 'Tc': sig(Tc, 7), 'Pc': sig(Pc, 7), 'Tmin': Tmin, 'Tmax': Tmax,
               'Pmax': Pmax, 'sat': sat, 'rows': rows})

# ---------------- transport properties ----------------
def transport_table(fl, Ts, p=101325, liquid_sat=False):
    out = {k: [] for k in ['T', 'rho', 'cp', 'k', 'mu', 'nu', 'alpha', 'Pr', 'beta']}
    for T in Ts:
        try:
            if liquid_sat:
                args = ('T', T, 'Q', 0)
            else:
                args = ('T', T, 'P', p)
            rho = CP.PropsSI('D', *args, fl); cp = CP.PropsSI('C', *args, fl)
            k = CP.PropsSI('L', *args, fl); mu = CP.PropsSI('V', *args, fl)
            try:
                beta = CP.PropsSI('isobaric_expansion_coefficient', *args, fl)
            except Exception:
                beta = 1 / T
        except Exception:
            continue
        for kk, v in zip(out, [T, rho, cp, k, mu, mu / rho, k / (rho * cp), mu * cp / k, beta]):
            out[kk].append(sig(v, 5))
    return out

trans = {}
trans['air'] = dict(name='Air at 1 atm', **transport_table('Air', list(range(200, 400, 10)) + list(range(400, 2001, 50))))
trans['n2'] = dict(name='Nitrogen at 1 atm', **transport_table('Nitrogen', list(range(200, 400, 10)) + list(range(400, 2001, 50))))
trans['o2'] = dict(name='Oxygen at 1 atm', **transport_table('Oxygen', list(range(200, 400, 10)) + list(range(400, 1001, 50))))
trans['co2'] = dict(name='Carbon dioxide at 1 atm', **transport_table('CarbonDioxide', list(range(220, 400, 10)) + list(range(400, 1501, 50))))
trans['h2'] = dict(name='Hydrogen at 1 atm', **transport_table('Hydrogen', list(range(100, 400, 10)) + list(range(400, 1001, 50))))
trans['he'] = dict(name='Helium at 1 atm', **transport_table('Helium', list(range(100, 400, 10)) + list(range(400, 1501, 50))))
trans['steam'] = dict(name='Water vapour at 1 atm', **transport_table('Water', list(range(380, 400, 10)) + list(range(400, 1201, 25))))
trans['water'] = dict(name='Saturated liquid water', **transport_table('Water', [273.16] + list(range(275, 640, 5)), liquid_sat=True))
trans['r134a_l'] = dict(name='Saturated liquid R-134a', **transport_table('R134a', list(range(220, 371, 5)), liquid_sat=True))
trans['nh3_l'] = dict(name='Saturated liquid ammonia', **transport_table('Ammonia', list(range(200, 401, 5)), liquid_sat=True))
eg = {k: [] for k in ['T', 'rho', 'cp', 'k', 'mu', 'nu', 'alpha', 'Pr', 'beta']}
for T in range(240, 371, 5):
    fl = 'INCOMP::MEG-50%'
    try:
        rho = CP.PropsSI('D', 'T', T, 'P', 3e5, fl); cp = CP.PropsSI('C', 'T', T, 'P', 3e5, fl)
        k = CP.PropsSI('L', 'T', T, 'P', 3e5, fl); mu = CP.PropsSI('V', 'T', T, 'P', 3e5, fl)
        rho2 = CP.PropsSI('D', 'T', T + 0.5, 'P', 3e5, fl); rho1 = CP.PropsSI('D', 'T', T - 0.5, 'P', 3e5, fl)
        beta = -(rho2 - rho1) / rho
    except Exception:
        continue
    for kk, v in zip(eg, [T, rho, cp, k, mu, mu / rho, k / (rho * cp), mu * cp / k, beta]):
        eg[kk].append(sig(v, 5))
trans['eg50'] = dict(name='Ethylene glycol–water 50% (mass)', **eg)
# saturated water extras for boiling/condensation
wx = {k: [] for k in ['T', 'P', 'hfg', 'sigma', 'rhol', 'rhov', 'mul', 'muv', 'kl', 'kv', 'cpl', 'cpv', 'Prl', 'Prv']}
for T in [273.16] + list(range(275, 645, 5)):
    try:
        g = lambda pr, q: CP.PropsSI(pr, 'T', T, 'Q', q, 'Water')
        row = [T, g('P', 0), (g('H', 1) - g('H', 0)) / 1e3, g('surface_tension', 0), g('D', 0), g('D', 1), g('V', 0), g('V', 1),
               g('L', 0), g('L', 1), g('C', 0), g('C', 1), g('Prandtl', 0), g('Prandtl', 1)]
    except Exception:
        continue
    for kk, v in zip(wx, row): wx[kk].append(sig(v, 5))
trans['watersat'] = wx
dump('trans', trans)

# ---------------- ideal-gas species (Cantera NASA polys, GRI-Mech 3.0) ----------------
gas = ct.Solution('gri30.yaml')
species = ['N2', 'O2', 'CO2', 'H2O', 'CO', 'H2', 'OH', 'NO', 'CH4', 'AR', 'C2H6', 'C3H8', 'C2H4', 'C2H2', 'H', 'O', 'N', 'NO2', 'N2O', 'CH3OH']
Tg = list(range(200, 3501, 10))
ig = {'T': Tg, 'sp': {}}
for spn in species:
    s = gas.species(spn)
    th = s.thermo
    hf = th.h(298.15) / 1e3
    if abs(hf) < 20: hf = 0.0
    M = sum(gas.atomic_weight(gas.element_index(e)) * n for e, n in s.composition.items())
    cp = [sig(th.cp(T) / 1e3, 6) for T in Tg]
    dh = [sig(th.h(T) / 1e3 - hf, 7) for T in Tg]
    s0 = [sig(th.s(T) / 1e3, 7) for T in Tg]
    ig['sp'][spn] = {'M': sig(M, 6), 'hf': sig(hf, 7), 'cp': cp, 'dh': dh, 's0': s0, 'comp': s.composition}
# Air table (Cengel-style references h(298.15)=298.18 kJ/kg, s0(298.15)=1.69528)
xa = {'N2': 0.7809, 'O2': 0.2095, 'AR': 0.0096}
Ma = sum(xa[k] * ig['sp'][k]['M'] for k in xa)
air = {'T': [], 'h': [], 'u': [], 's0': [], 'cp': [], 'Pr': [], 'vr': []}
i298 = None
H = []; S = []; CPv = []
for i, T in enumerate(Tg):
    h = sum(xa[k] * gas.species(k).thermo.h(T) for k in xa) / 1e3 / Ma
    s = sum(xa[k] * gas.species(k).thermo.s(T) for k in xa) / 1e3 / Ma
    c = sum(xa[k] * gas.species(k).thermo.cp(T) for k in xa) / 1e3 / Ma
    H.append(h); S.append(s); CPv.append(c)
h298 = sum(xa[k] * gas.species(k).thermo.h(298.15) for k in xa) / 1e3 / Ma
s298 = sum(xa[k] * gas.species(k).thermo.s(298.15) for k in xa) / 1e3 / Ma
Ra = 8.314462618 / Ma
for T, h, s, c in zip(Tg, H, S, CPv):
    hh = h - h298 + 298.18; ss = s - s298 + 1.69528
    air['T'].append(T); air['h'].append(sig(hh, 6)); air['u'].append(sig(hh - Ra * T, 6))
    air['s0'].append(sig(ss, 6)); air['cp'].append(sig(c, 5))
    pr = math.exp((ss - 1.69528) / Ra) * 1.3543  # Pr(298)≈1.3543 (Cengel scaling)
    air['Pr'].append(sig(pr, 5)); air['vr'].append(sig(10 * Ra * T / pr, 5))
ig['air'] = air; ig['airM'] = sig(Ma, 6)
dump('igas', ig)

# ---------------- critical constants ----------------
crit = {}
for fl in ['Water', 'Air', 'Nitrogen', 'Oxygen', 'CarbonDioxide', 'Hydrogen', 'Helium', 'Methane', 'Ethane', 'Propane', 'n-Butane',
           'Ammonia', 'R134a', 'R22', 'R12', 'Argon', 'CarbonMonoxide', 'Ethylene', 'n-Octane', 'Methanol', 'Ethanol', 'R1234yf']:
    try:
        crit[fl] = {'M': sig(CP.PropsSI('molarmass', fl) * 1e3, 6), 'Tc': sig(CP.PropsSI('Tcrit', fl), 6),
                    'Pc': sig(CP.PropsSI('pcrit', fl), 6), 'w': sig(CP.PropsSI('acentric', fl), 4),
                    'vc': sig(1 / CP.PropsSI('rhomolar_critical', fl), 5)}
    except Exception as e:
        print('crit fail', fl, e)
# reference Z values (CoolProp) for validation in the real-gas tool
dump('crit', crit)
print('done')
