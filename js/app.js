/* App: router, views, renderers for modules, calculators, animations, questions */
'use strict';
(() => {
  const { h, $, $$ } = U;
  const main = () => $('#main');
  let cleanups = [];
  const onLeave = f => cleanups.push(f);
  U.onLeave = onLeave;

  /* ---------- theme ---------- */
  const setTheme = t => { document.documentElement.dataset.theme = t; U.store.set('theme', t); };
  setTheme(U.store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  /* ---------- progress ---------- */
  const prog = U.store.get('progress', { mcq: {}, num: {}, read: {} });
  const saveProg = () => U.store.set('progress', prog);
  U.prog = prog;

  /* ---------- sidebar ---------- */
  function buildSide() {
    const nav = $('#nav'); nav.innerHTML = '';
    const link = (href, txt, dot) => h('a', { href: '#/' + href, 'data-r': href }, dot ? h('span', { class: 'dot', style: 'background:' + dot }) : null, txt);
    nav.append(link('', '🏠  Home'), link('map', '🗺️  Field map & learning paths'), link('method', '🧭  How to solve any problem'),
      link('lessons', '🎬  Narrated lessons'), link('solve', '🧮  Solver workbench'), link('anim', '🎞️  Animation lab'), link('practice', '📝  Practice & quizzes'),
      link('databook', '📘  HT & MT Data Book'), link('data', '📚  Property tables (all)'), link('progress', '📈  My progress'));
    for (const [pk, p] of Object.entries(U.parts)) {
      const d = h('details', { open: '' }, h('summary', {}, p.name));
      U.modules.filter(m => m.part === pk).forEach(m => d.append(link('m/' + m.id, m.title, p.color)));
      nav.append(d);
    }
  }
  function markNav() {
    const r = location.hash.slice(2);
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r || (a.dataset.r && r.startsWith(a.dataset.r + '/') && a.dataset.r !== '')));
  }

  /* ---------- generic renderers ---------- */
  U.renderEqs = eqs => h('div', {}, eqs.map(([n, tex, note]) => h('div', { class: 'eq', html: `<div class="nm">${n}</div>\\[${tex}\\]${note ? `<div class="small muted">${note}</div>` : ''}` })));

  U.renderMCQ = (item, key, idx) => {
    const [q, opts, a, ex] = item;
    const box = h('div', { class: 'q' }, h('div', { class: 'qh' }, h('span', {}, 'MCQ ' + (idx != null ? idx + 1 : '')), h('span', {}, key ? (U.modById[key.split(':')[0]] || {}).title || '' : '')),
      h('div', { html: q }));
    const ol = h('div', { class: 'opts' }), ex_ = h('div', { class: 'expl' });
    let done = false;
    opts.forEach((o, i) => {
      const b = h('button', { class: 'opt', html: String.fromCharCode(65 + i) + '. ' + o, onclick: () => {
        if (done) return; done = true;
        b.classList.add(i === a ? 'right' : 'wrong'); ol.children[a].classList.add('right');
        ex_.innerHTML = `<div class="${i === a ? 'sol' : 'hint'}"><b>${i === a ? '✔ Correct.' : '✘ Not quite — answer: ' + String.fromCharCode(65 + a)}</b> ${ex || ''}</div>`; U.math(ex_);
        if (key) { prog.mcq[key] = i === a ? 1 : (prog.mcq[key] === 1 ? 1 : 0); saveProg(); }
        box.dispatchEvent(new CustomEvent('answered', { detail: i === a, bubbles: true }));
      }
      });
      ol.append(b);
    });
    box.append(ol, ex_); return box;
  };

  U.renderDesc = ([q, a, hints], idx) => {
    const sol = h('div'), box = h('div', { class: 'q' }, h('div', { class: 'qh' }, h('span', {}, 'Descriptive ' + (idx + 1))), h('div', { html: q }));
    const hb = h('div');
    const ta = h('textarea', { rows: 4, placeholder: 'Draft your answer here first (not graded) — then compare with the model answer.' });
    const row = h('div', { class: 'ctrl' });
    if (hints) { let k = 0; row.append(h('button', { class: 'btn sm', onclick: () => { if (k < hints.length) { const d = h('div', { class: 'hint', html: '<b>Hint ' + (k + 1) + ':</b> ' + hints[k++] }); hb.append(d); U.math(d); } } }, '💡 Hint')); }
    row.append(h('button', { class: 'btn sm', onclick: () => { sol.innerHTML = '<div class="sol"><b>Model answer / key points</b>' + a + '</div>'; U.math(sol); } }, '📖 Model answer'));
    box.append(ta, row, hb, sol); return box;
  };

  U.renderNum = (gen, key, idx) => {
    const box = h('div', { class: 'q' });
    let seed = Math.floor(Math.random() * 1e9);
    const draw = () => {
      box.innerHTML = '';
      let P; try { P = gen.gen(U.rng(seed)); } catch (e) { box.append(h('div', { class: 'err' }, 'Generator error: ' + e.message)); return; }
      box.append(h('div', { class: 'qh' }, h('span', {}, 'Numerical ' + (idx != null ? idx + 1 : '') + ' · ' + gen.t), h('span', {}, prog.num[key] ? '✔ solved before' : '')));
      box.append(h('div', { html: P.q }));
      const ins = P.ans.map(([l, v, u]) => { const i = h('input', { type: 'text', inputmode: 'decimal', placeholder: 'your answer' }); return { i, l, v, u, tol: P.tol || 0.02 }; });
      box.append(h('div', { class: 'ans' }, ins.map(o => h('div', { class: 'fld' }, h('label', { html: o.l + (o.u ? ' [' + o.u + ']' : '') }), o.i))));
      const fb = h('div'), hb = h('div'), sb = h('div'); let hk = 0;
      box.append(h('div', { class: 'ctrl' },
        h('button', { class: 'btn sm pri', onclick: () => {
          let all = true; fb.innerHTML = '';
          ins.forEach(o => {
            const x = parseFloat(o.i.value.replace(/,/g, '').replace(/×10\^?/, 'e')); const ok = isFinite(x) && Math.abs(x - o.v) <= Math.abs(o.v) * o.tol + 1e-12;
            all = all && ok; fb.append(h('span', { class: 'pill ' + (ok ? 'ok' : 'no') }, (ok ? '✔ ' : '✘ ') + o.l.replace(/<[^>]+>/g, '')), ' ');
          });
          if (all) { prog.num[key] = 1; saveProg(); fb.append(h('b', {}, ' Excellent — all within ±' + (ins[0].tol * 100) + '%.')); }
          else fb.append(h('span', { class: 'muted small' }, ' Tolerance ±' + (ins[0].tol * 100) + '%. Use a hint or check units.'));
        }
        }, 'Check'),
        h('button', { class: 'btn sm', onclick: () => { if (hk < P.hints.length) { const d = h('div', { class: 'hint', html: '<b>Hint ' + (hk + 1) + '/' + P.hints.length + ':</b> ' + P.hints[hk++] }); hb.append(d); U.math(d); } else U.toast('No more hints — try the full solution.'); } }, '💡 Next hint'),
        h('button', { class: 'btn sm', onclick: () => { sb.innerHTML = '<div class="sol"><b>Full solution</b>' + P.sol + '<p><b>Answers:</b> ' + P.ans.map(([l, v, u]) => l + ' = ' + U.fmt(v, 4) + ' ' + (u || '')).join('; ') + '</p></div>'; U.math(sb); } }, '📖 Solution'),
        h('button', { class: 'btn sm ghost', onclick: () => { seed = Math.floor(Math.random() * 1e9); draw(); } }, '🎲 New values')));
      box.append(fb, hb, sb); U.math(box);
    };
    draw(); return box;
  };

  /* calculators: {title, cat, desc, inputs:[{k,l,u,v,opts,step}], run(v)->{out:[[l,v,u,main]],html,plot(el)} | mount(el)} */
  U.renderCalc = (c, el) => {
    el.append(h('h2', {}, c.title));
    if (c.desc) el.append(h('div', { class: 'prose', html: c.desc }));
    if (U.DBCALC && U.DBCALC[c.id]) el.append(h('p', { class: 'small', html: '📘 <b>Data-book pages behind this solver:</b> ' + U.DBCALC[c.id].map(U.dbLink).join(' · ') }));
    if (c.mount) { const r = c.mount(el); U.math(el); if (typeof r === 'function') onLeave(r); return; }
    const form = h('div', { class: 'form' }), vals = {};
    const fields = {};
    c.inputs.forEach(inp => {
      let ctl;
      if (inp.opts) { ctl = h('select', {}, inp.opts.map(o => Array.isArray(o) ? h('option', { value: o[0] }, o[1]) : h('option', { value: o }, o))); ctl.value = inp.v; }
      else ctl = h('input', { type: 'number', step: inp.step || 'any', value: inp.v });
      fields[inp.k] = ctl;
      const wrap = h('div', { class: 'fld', 'data-k': inp.k }, h('label', { html: inp.l + (inp.u ? ` <span class="u">[${inp.u}]</span>` : '') }), ctl);
      form.append(wrap);
    });
    const out = h('div'), plot = h('div');
    const run = async () => {
      c.inputs.forEach(inp => { const x = fields[inp.k].value; vals[inp.k] = inp.opts ? x : parseFloat(x); });
      if (c.show) Object.entries(c.show(vals) || {}).forEach(([k, on]) => { const w = form.querySelector(`[data-k="${k}"]`); if (w) w.style.display = on ? '' : 'none'; });
      out.innerHTML = ''; plot.innerHTML = '';
      try {
        const r = await c.run(vals);
        if (r.out) out.append(h('div', { class: 'out' }, r.out.map(([l, v, u, m]) => h('div', { class: m ? 'main' : '' }, h('span', { html: l }), h('b', { html: (typeof v === 'number' ? U.fmt(v, 5) : v) + (u ? ' <small>' + u + '</small>' : '') })))));
        if (r.html) out.append(h('div', { class: 'steps prose', html: r.html }));
        if (r.plot) r.plot(plot);
        U.math(out);
      } catch (e) { out.append(h('p', { class: 'err' }, '⚠ ' + e.message)); console.error(e); }
    };
    form.addEventListener('input', () => { clearTimeout(form._t); form._t = setTimeout(run, 250); });
    form.addEventListener('change', run);
    el.append(form, h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: run }, 'Calculate')), out, plot);
    run();
  };

  U.renderAnim = (a, el, compact) => {
    if (!compact) el.append(h('h2', {}, a.title));
    const stage = h('div'); el.append(stage);
    const stop = a.mount(stage); if (typeof stop === 'function') onLeave(stop);
    if (a.desc) el.append(h('div', { class: 'prose card', html: a.desc }));
    U.math(el);
  };

  /* ---------- views ---------- */
  const V = U.routes;
  V[''] = el => {
    const nm = U.modules.length, nq = U.modules.reduce((s, m) => s + (m.mcq || []).length, 0), nd = U.modules.reduce((s, m) => s + (m.desc || []).length, 0), nn = U.modules.reduce((s, m) => s + (m.num || []).length, 0);
    const hero = h('div', { class: 'hero' }, h('h1', {}, 'Thermo · Heat · Mass'),
      h('p', {}, 'An interactive engineering companion for thermodynamics, heat transfer and mass transfer — theory from first principles to advanced practice, animations you can play with, a solver workbench backed by real property data, and a question bank with hints and auto-checked numericals.'),
      h('div', { class: 'stats' }, [[nm, 'modules'], [Object.keys(U.calcs).length, 'solvers'], [Object.keys(U.anims).length, 'animations'], [nq, 'MCQs'], [nd, 'descriptive Qs'], [nn, 'numerical generators']].map(([n, l]) => h('div', {}, h('b', {}, n), l))));
    el.append(hero);
    el.append(h('div', { class: 'grid' },
      tile('#/lessons', '🎬 Narrated lessons', 'A 3–5 minute animated, narrated lesson for every module, with quick-check questions that pause until you answer. Works offline.'), tile('#/map', '🗺️ Start here: the field map', 'How thermodynamics, heat transfer and mass transfer fit together, and suggested learning paths.'),
      tile('#/method', '🧭 How to solve any problem', 'A systematic method and a decision guide that routes any problem to the right theory and solver.'),
      tile('#/solve', '🧮 Solver workbench', 'Steam & refrigerant tables, cycles, conduction, fins, transient, convection, exchangers, radiation, psychrometry, combustion, diffusion, and a universal formula solver.'),
      tile('#/anim', '🎞️ Animation lab', 'Piston–cylinders, cycles on P–v/T–s, boundary layers, transient conduction, boiling, heat exchangers, radiation, diffusion.'),
      tile('#/practice', '📝 Practice', 'Quiz mode, descriptive questions with model answers, and randomised numericals with stepwise hints.'),
      tile('#/databook', '📘 Heat & Mass Transfer Data Book', 'Tables, Heisler/F-factor/ε–NTU/fin/view-factor/Moody charts and correlation constants — every page says what it is for and how to read it.'), tile('#/data', '📚 Property tables', 'Steam, refrigerant, air, gas, liquid and solid tables, emissivities, erf, Bessel, one-term coefficients — CSV download.')));
    for (const [pk, p] of Object.entries(U.parts)) {
      el.append(h('h2', {}, p.name));
      el.append(h('div', { class: 'grid' }, U.modules.filter(m => m.part === pk).map(m => tile('#/m/' + m.id, m.title, m.sub, pk))));
    }
    el.append(h('footer', { html: 'Property data: water/steam (IAPWS-95) and refrigerants from Helmholtz-energy equations of state (generated with CoolProp); ideal-gas species from NASA 7-coefficient polynomials (GRI-Mech 3.0, via Cantera). Built for students of Mechanical Engineering, MITE Moodbidri.' }));
  };
  const tile = (href, t, d, part) => h('a', { class: 'card tile', href }, part ? h('span', { class: 'tag ' + part }, U.parts[part].name) : null, h('h3', {}, t), h('p', {}, d || ''));

  V['m'] = (el, id) => {
    const m = U.modById[id]; if (!m) { el.append(h('p', {}, 'Module not found.')); return; }
    prog.read[id] = 1; saveProg();
    el.append(h('div', { class: 'crumbs' }, h('a', { href: '#/map' }, U.parts[m.part].name), ' › ', m.title));
    el.append(h('h1', {}, m.title)); if (m.sub) el.append(h('p', { class: 'muted' }, m.sub));
    const tabs = [['lesson', '🎬 Lesson'], ['fund', '① Fundamentals'], ['tech', '② Technical'], ['adv', '③ Advanced'], ['prac', '⚙️ Practice & industry'], ['eqs', '∑ Formula sheet'], ['db', '📘 Data book'], ['vis', '🎞️ Animations & solvers'], ['qs', '📝 Questions']]
      .filter(([k]) => k === 'lesson' ? U.LESSONS[m.id] : k === 'eqs' ? m.eqs : k === 'db' ? (U.DBMOD || {})[m.id] : k === 'vis' ? (m.anims || m.calcs) : k === 'qs' ? (m.mcq || m.desc || m.num) : m[k]);
    const bar = h('div', { class: 'tabs' }), body = h('div', { class: 'prose' });
    const show = k => {
      cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = [];
      $$('button', bar).forEach(b => b.classList.toggle('on', b.dataset.k === k)); body.innerHTML = '';
      if (k === 'lesson') { location.hash = '#/lesson/' + id; return; }
      if (k === 'eqs') body.append(U.renderEqs(m.eqs));
      else if (k === 'db') { body.append(h('p', { html: 'Data-book pages you will need for this topic, in the order you normally use them. Each page tells you <b>what it is for, at which temperature to read it, and how to read it</b>. Not sure? Use the <a href="#/databook/nav">Navigator</a> and the <a href="#/databook/rules">property-temperature rules</a>.' })); const ul = h('div', { class: 'grid' }); U.DBMOD[m.id].forEach(i => { const p = U.DB[i]; ul.append(h('a', { class: 'card tile', href: '#/databook/' + i }, h('h3', { html: U.dbLink(i).replace(/<[^>]+>/g, '') }), h('p', {}, p.use))); }); body.append(ul); }
      else if (k === 'vis') {
        (m.anims || []).forEach(a => { const A = U.anims[a]; if (!A) return; const c = h('div', { class: 'card' }, h('h3', {}, '🎞️ ' + A.title)); body.append(c); U.renderAnim(A, c, true); });
        if (m.calcs) body.append(h('h3', {}, 'Solvers for this topic'), h('div', { class: 'grid' }, m.calcs.filter(c => U.calcs[c]).map(c => tile('#/solve/' + c, '🧮 ' + U.calcs[c].title, U.calcs[c].cat))));
      } else if (k === 'qs') {
        if (m.need && !m.need.every(n => window.D && D[n])) { body.append(h('p', { class: 'muted' }, 'Loading property data…')); U.need(...m.need).then(() => show('qs')); return; }
        const qn = m.num || [], qm = m.mcq || [], qd = m.desc || [];
        const sub = h('div', { class: 'ctrl' }); const area = h('div');
        const showQ = t => {
          area.innerHTML = ''; $$('button', sub).forEach(b => b.classList.toggle('pri', b.dataset.t === t));
          if (t === 'mcq') qm.forEach((q, i) => area.append(U.renderMCQ(q, id + ':' + i, i)));
          if (t === 'desc') qd.forEach((q, i) => area.append(U.renderDesc(q, i)));
          if (t === 'num') qn.forEach((g, i) => area.append(U.renderNum(g, id + ':n' + i, i)));
          U.math(area);
        };
        [['num', `Numericals with hints (${qn.length})`], ['mcq', `MCQs (${qm.length})`], ['desc', `Descriptive (${qd.length})`]].filter(([t]) => ({ num: qn, mcq: qm, desc: qd })[t].length)
          .forEach(([t, l]) => sub.append(h('button', { class: 'btn sm', 'data-t': t, onclick: () => showQ(t) }, l)));
        body.append(sub, area); showQ(qn.length ? 'num' : 'mcq');
      } else {
        body.innerHTML = m[k];
        if (k === 'fund' && m.mist) body.insertAdjacentHTML('beforeend', '');
        if (k === 'tech' && m.mist) body.insertAdjacentHTML('beforeend', '<h3>Common mistakes & misconceptions</h3><ul>' + m.mist.map(x => '<li>' + x + '</li>').join('') + '</ul>');
        // inline animations / calculators: <div data-anim="id"></div>
        $$('[data-anim]', body).forEach(d => { const A = U.anims[d.dataset.anim]; if (A) { d.classList.add('card'); U.renderAnim(A, d, true); } });
        $$('[data-plot]', body).forEach(d => { const f = U.inlinePlots[d.dataset.plot]; if (f) f(d); });
      }
      U.math(body);
      const pos = U.modules.filter(x => x.part === m.part), i = pos.indexOf(m);
      body.append(h('div', { class: 'ctrl', style: 'margin-top:30px' }, i > 0 ? h('a', { class: 'btn', href: '#/m/' + pos[i - 1].id }, '← ' + pos[i - 1].title) : null, i < pos.length - 1 ? h('a', { class: 'btn', href: '#/m/' + pos[i + 1].id }, pos[i + 1].title + ' →') : null));
    };
    tabs.forEach(([k, l]) => bar.append(h('button', { 'data-k': k, onclick: () => { show(k); history.replaceState(null, '', '#/m/' + id + '/' + k); } }, l)));
    el.append(bar, body);
    const want = location.hash.split('/')[3];
    show(tabs.some(t => t[0] === want && want !== 'lesson') ? want : 'fund');
  };
  U.inlinePlots = {};

  V['solve'] = (el, id) => {
    if (id && U.calcs[id]) { el.append(h('div', { class: 'crumbs' }, h('a', { href: '#/solve' }, 'Solver workbench'), ' › ', U.calcs[id].cat)); const c = h('div'); el.append(c); U.renderCalc(U.calcs[id], c); return; }
    el.append(h('h1', {}, 'Solver workbench'), h('p', { class: 'prose muted' }, 'Every tool shows its governing equations and intermediate steps, so you can use it to check hand calculations — not replace them. Fluid properties come from tabulated equation-of-state data; convection tools evaluate fluid properties automatically at the correct film/bulk temperature.'));
    const cats = {}; Object.values(U.calcs).forEach(c => (cats[c.cat] = cats[c.cat] || []).push(c));
    Object.entries(cats).forEach(([cat, list]) => { el.append(h('h2', {}, cat), h('div', { class: 'grid' }, list.map(c => tile('#/solve/' + c.id, c.title, c.blurb || '')))); });
  };
  V['anim'] = (el, id) => {
    if (id && U.anims[id]) { el.append(h('div', { class: 'crumbs' }, h('a', { href: '#/anim' }, 'Animation lab'))); U.renderAnim(U.anims[id], el); return; }
    el.append(h('h1', {}, 'Animation lab'), h('p', { class: 'muted' }, 'Each animation is interactive: change the sliders and watch the physics respond. Every one comes with a detailed explanation underneath.'));
    for (const [pk, p] of Object.entries(U.parts)) {
      const list = Object.values(U.anims).filter(a => a.part === pk); if (!list.length) continue;
      el.append(h('h2', {}, p.name), h('div', { class: 'grid' }, list.map(a => tile('#/anim/' + a.id, '🎞️ ' + a.title, a.blurb || '', pk))));
    }
  };

  V['practice'] = el => {
    el.append(h('h1', {}, 'Practice & quizzes'));
    const all = []; U.modules.forEach(m => (m.mcq || []).forEach((q, i) => all.push({ m, q, key: m.id + ':' + i })));
    const nums = []; U.modules.forEach(m => (m.num || []).forEach((g, i) => nums.push({ m, g, key: m.id + ':n' + i })));
    const descs = []; U.modules.forEach(m => (m.desc || []).forEach((q, i) => descs.push({ m, q })));
    const selPart = h('select', { class: 'inp' }, h('option', { value: '' }, 'All parts'), Object.entries(U.parts).map(([k, p]) => h('option', { value: k }, p.name)));
    const selMod = h('select', { class: 'inp' });
    const fillMods = () => { selMod.innerHTML = ''; selMod.append(h('option', { value: '' }, 'All modules')); U.modules.filter(m => !selPart.value || m.part === selPart.value).forEach(m => selMod.append(h('option', { value: m.id }, m.title))); };
    selPart.onchange = fillMods; fillMods();
    const nSel = h('select', { class: 'inp' }, [5, 10, 20, 30].map(n => h('option', { value: n }, n + ' questions'))); nSel.value = 10;
    const area = h('div');
    const filt = arr => arr.filter(x => (!selPart.value || x.m.part === selPart.value) && (!selMod.value || x.m.id === selMod.value));
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
    const quiz = () => {
      area.innerHTML = ''; const set = shuffle(filt(all)).slice(0, +nSel.value); let got = 0, ans = 0;
      if (!set.length) { area.append(h('p', {}, 'No MCQs for this selection.')); return; }
      const sc = h('div', { class: 'card score' }, 'Score: 0 / ' + set.length); area.append(sc);
      area.addEventListener('answered', e => { ans++; if (e.detail) got++; sc.textContent = `Score: ${got} / ${set.length}` + (ans === set.length ? `  —  ${Math.round(100 * got / set.length)}% ${got / set.length >= .8 ? '🎉 Excellent' : got / set.length >= .5 ? '👍 Good — review the misses' : '📖 Revisit the theory tabs'}` : ''); });
      set.forEach((x, i) => area.append(U.renderMCQ(x.q, x.key, i))); U.math(area);
    };
    const drill = async () => { area.innerHTML = 'Loading…'; await U.need('water', 'r134a', 'igas', 'trans'); shuffle(filt(nums)).slice(0, +nSel.value).forEach((x, i) => { area.append(h('div', { class: 'small muted' }, x.m.title)); area.append(U.renderNum(x.g, x.key, i)); }); };
    const desc = () => { area.innerHTML = ''; shuffle(filt(descs)).slice(0, +nSel.value).forEach((x, i) => { area.append(h('div', { class: 'small muted' }, x.m.title)); area.append(U.renderDesc(x.q, i)); }); U.math(area); };
    el.append(h('div', { class: 'card' }, h('div', { class: 'form' }, h('div', { class: 'fld' }, h('label', {}, 'Part'), selPart), h('div', { class: 'fld' }, h('label', {}, 'Module'), selMod), h('div', { class: 'fld' }, h('label', {}, 'Size'), nSel)),
      h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: quiz }, '▶ MCQ quiz'), h('button', { class: 'btn', onclick: drill }, '🧮 Numerical drill (with hints)'), h('button', { class: 'btn', onclick: desc }, '✍️ Descriptive set')),
      h('p', { class: 'small muted' }, `Bank: ${all.length} MCQs · ${descs.length} descriptive · ${nums.length} numerical generators (each generates unlimited variants).`)));
    el.append(area);
  };

  V['progress'] = el => {
    el.append(h('h1', {}, 'My progress'), h('p', { class: 'muted small' }, 'Stored only in this browser.'));
    const t = h('table', {}, h('tr', {}, ['Module', 'Read', 'MCQ correct', 'Numericals solved'].map(x => h('th', {}, x))));
    U.modules.forEach(m => {
      const mc = (m.mcq || []).length, mg = (m.mcq || []).filter((_, i) => prog.mcq[m.id + ':' + i] === 1).length;
      const nn = (m.num || []).length, ng = (m.num || []).filter((_, i) => prog.num[m.id + ':n' + i]).length;
      t.append(h('tr', {}, h('td', {}, h('a', { href: '#/m/' + m.id }, m.title)), h('td', {}, prog.read[m.id] ? '✔' : ''), h('td', {}, `${mg}/${mc}`), h('td', {}, `${ng}/${nn}`)));
    });
    el.append(h('div', { class: 'tablewrap' }, t), h('button', { class: 'btn', onclick: () => { if (confirmReset()) { prog.mcq = {}; prog.num = {}; prog.read = {}; saveProg(); route(); } } }, 'Reset progress'));
  };
  const confirmReset = () => { const b = U.store.get('resetArm', 0); if (Date.now() - b < 5000) return true; U.store.set('resetArm', Date.now()); U.toast('Press again within 5 s to confirm reset'); return false; };

  V['search'] = (el, q) => {
    q = decodeURIComponent(q || '').toLowerCase().trim(); el.append(h('h1', {}, 'Search: ' + q));
    if (!q) return;
    const words = q.split(/\s+/);
    const score = txt => { txt = txt.toLowerCase(); return words.every(w => txt.includes(w)) ? 1 : 0; };
    const res = [];
    U.modules.forEach(m => {
      const strip = s => (s || '').replace(/<[^>]+>/g, ' ');
      if (score(m.title + ' ' + (m.sub || '') + ' ' + (m.tags || []).join(' '))) res.push(['Module', m.title, '#/m/' + m.id]);
      ['fund', 'tech', 'adv', 'prac'].forEach(k => { const t = strip(m[k]); if (t && score(t)) { const i = t.toLowerCase().indexOf(words[0]); res.push(['Theory · ' + m.title, '…' + t.slice(Math.max(0, i - 60), i + 120) + '…', '#/m/' + m.id + '/' + k]); } });
      (m.eqs || []).forEach(e => { if (score(e[0])) res.push(['Equation · ' + m.title, e[0], '#/m/' + m.id + '/eqs']); });
      (m.mcq || []).forEach(e => { if (score(strip(e[0]))) res.push(['MCQ · ' + m.title, strip(e[0]).slice(0, 140), '#/m/' + m.id + '/qs']); });
    });
    Object.values(U.calcs).forEach(c => { if (score(c.title + ' ' + c.cat + ' ' + (c.blurb || '') + ' ' + (c.desc || ''))) res.push(['Solver', c.title, '#/solve/' + c.id]); });
    Object.values(U.anims).forEach(a => { if (score(a.title + ' ' + (a.blurb || ''))) res.push(['Animation', a.title, '#/anim/' + a.id]); });
    (U.FORMULAS || []).forEach((f, i) => { if (score(f.n + ' ' + f.cat)) res.push(['Formula solver', f.n, '#/solve/formula?' + i]); });
    el.append(h('p', { class: 'muted' }, res.length + ' results'));
    res.slice(0, 120).forEach(([k, t, href]) => el.append(h('a', { class: 'card tile', href }, h('span', { class: 'tag' }, k), h('p', { style: 'color:var(--fg)' }, t))));
  };

  /* ---------- router ---------- */
  function route() {
    cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = [];
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const [r, arg] = [parts[0].split('?')[0], parts[1]];
    const el = main(); el.innerHTML = '';
    (V[r] || V[''])(el, arg && arg.split('?')[0]);
    U.math(el); markNav(); $('#side').classList.remove('open');
    if (!(r === 'm' && parts[2])) window.scrollTo(0, 0);
    document.title = (($('h1', el) || {}).textContent || 'Thermo') + ' · Thermo–Heat–Mass';
  }
  U.route = route;
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    buildSide();
    $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = '#/search/' + encodeURIComponent(e.target.value); });
    $('#menu').onclick = () => $('#side').classList.toggle('open');
    $$('.themebtn').forEach(b => b.onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); route(); });
    route();
    // ---- offline app (PWA) ----
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').then(reg => {
        const say = t => { const o = $('#offline'); if (o) o.textContent = t; };
        navigator.serviceWorker.ready.then(r => { say('✓ Available offline'); });
        reg.addEventListener('updatefound', () => { say('⏳ Downloading for offline use…'); const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'activated') { say('✓ Updated — available offline'); } }); });
      }).catch(() => {});
    }
    let deferred = null; const ib = $('#installbtn');
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; ib.style.display = ''; });
    ib.onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; ib.style.display = 'none'; };
  });
})();
