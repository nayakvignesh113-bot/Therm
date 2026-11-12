/* Narrated lesson player: animated scenes + captions + device text-to-speech + in-lesson MCQs (works offline) */
'use strict';
(() => {
  const { h, $ } = U, V = U.routes;
  U.LESSONS = {};
  U.addLesson = (id, scenes) => { U.LESSONS[id] = scenes; };
  const store = U.store;
  const lp = () => store.get('lessons', {});
  const saveLp = o => store.set('lessons', o);

  /* ---------- speech ---------- */
  const S = { voices: [], voice: null, rate: store.get('lrate', 1), on: store.get('lvoice', true) };
  const pickVoices = () => {
    if (!('speechSynthesis' in window)) return;
    S.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const want = store.get('lvoiceName', '');
    S.voice = S.voices.find(v => v.name === want) || S.voices.find(v => /en[-_]IN/i.test(v.lang)) || S.voices.find(v => /en[-_]GB/i.test(v.lang)) || S.voices[0] || null;
  };
  if ('speechSynthesis' in window) { pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }
  const speak = (text, onend) => {
    const words = text.split(/\s+/).length, est = Math.max(2.5, words / (2.55 * S.rate)) * 1000;
    if (!S.on || !('speechSynthesis' in window)) { const t = setTimeout(onend, est); return () => clearTimeout(t); }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); if (S.voice) u.voice = S.voice; u.rate = S.rate; u.lang = S.voice ? S.voice.lang : 'en-IN';
    let done = false; const fin = () => { if (!done) { done = true; clearTimeout(guard); onend(); } };
    u.onend = fin; u.onerror = fin;
    const guard = setTimeout(fin, est * 2.2 + 3000); // some engines never fire onend
    speechSynthesis.speak(u);
    return () => { done = true; clearTimeout(guard); speechSynthesis.cancel(); };
  };

  /* ---------- scene renderers: return {dur(ms)?, cleanup?} ---------- */
  const R_ = {
    title(st, [_, title, sub]) { st.append(h('div', { class: 'ls-title' }, h('div', { class: 'ls-kicker' }, '🎬 Narrated lesson'), h('h2', {}, title), sub ? h('p', {}, sub) : null)); },
    bul(st, [_, head, items], ctx) { const ul = h('ul', { class: 'ls-bul' }); items.forEach((it, i) => { const li = h('li', { html: it, style: 'opacity:0' }); ul.append(li); }); st.append(h('h3', { class: 'ls-h' }, head), ul); U.math(ul);
      ctx.reveal = f => [...ul.children].forEach((li, i) => { if (f >= i / items.length) li.style.opacity = 1; }); },
    eq(st, [_, head, tex, terms]) { st.append(h('h3', { class: 'ls-h' }, head)); const e = h('div', { class: 'ls-eq', html: `\\[${tex}\\]` }); st.append(e); if (terms) { const t = h('div', { class: 'ls-terms' }); terms.forEach(([a, b]) => t.append(h('div', { html: `<b>${a}</b> — ${b}` }))); st.append(t); } U.math(st); },
    anim(st, [_, id, head]) { const A = U.anims[id]; if (!A) return; if (head) st.append(h('h3', { class: 'ls-h' }, head)); const box = h('div', { class: 'ls-anim' }); st.append(box); const stop = A.mount(box); U.math(box); return { cleanup: typeof stop === 'function' ? stop : null }; },
    fig(st, [_, key, head]) { if (head) st.append(h('h3', { class: 'ls-h' }, head)); const f = FIG[key]; if (f) f(st); U.math(st); },
    sum(st, [_, items]) { st.append(h('h3', { class: 'ls-h' }, '✅ Key take-aways')); const ul = h('ul', { class: 'ls-bul' }); items.forEach(i => ul.append(h('li', { html: i }))); st.append(ul); U.math(ul); },
    links(st, [_, mod]) { const m = U.modById[mod]; st.append(h('h3', { class: 'ls-h' }, 'Continue learning'), h('div', { class: 'ls-links', html: `<a class="btn" href="#/m/${mod}/fund">📖 Read the module</a> <a class="btn" href="#/m/${mod}/qs">📝 Practise questions</a> ${(m.calcs || []).slice(0, 2).map(c => `<a class="btn" href="#/solve/${c}">🧮 ${U.calcs[c] ? U.calcs[c].title.split('(')[0].split(':')[0] : c}</a>`).join(' ')}` })); }
  };
  /* static figures used by lessons */
  const FIG = {
    resist(st) { st.append(h('div', { class: 'ls-eq', html: `<svg viewBox="0 0 700 120" style="width:100%"><g font-family="Inter" font-size="15" fill="currentColor"><text x="10" y="65">T∞,1</text><line x1="55" y1="60" x2="90" y2="60" stroke="currentColor" stroke-width="2"/>${[0, 1, 2, 3].map(i => `<rect x="${90 + i * 140}" y="45" width="100" height="30" fill="none" stroke="currentColor" stroke-width="2"/><text x="${140 + i * 140}" y="100" text-anchor="middle" font-size="13">${['1/(h₁A)', 'L₁/(k₁A)', 'L₂/(k₂A)', '1/(h₂A)'][i]}</text><line x1="${190 + i * 140}" y1="60" x2="${230 + i * 140}" y2="60" stroke="currentColor" stroke-width="2"/>`).join('')}<text x="640" y="65">T∞,2</text><text x="350" y="25" text-anchor="middle" font-weight="700">Q̇ = ΔT / ΣR</text></g></svg>` })); },
    blprof(st) { const cv = U.canvas(st, 760, 330); const eta = U.range(0, 1.5, 60); U.plot(cv, { series: [{ x: eta.map(e => e < 1 ? 2 * e - e * e : 1), y: eta, label: 'velocity u/U∞' }, { x: eta.map(e => e * 1.4 < 1 ? 1 - (1.5 * e * 1.4 - 0.5 * (e * 1.4) ** 3) : 0), y: eta, label: 'temperature (Ts → T∞)', color: U.cssVar('--hot') }], xlabel: 'dimensionless value', ylabel: 'y / δ', title: 'Profiles inside the boundary layer' }); },
    boilcurve(st) { const ts = []; for (let t = 1; t <= 1200; t *= 1.05) ts.push(t); U.plot(U.canvas(st, 760, 360), { series: [{ x: ts, y: ts.map(U.boilModel), label: 'water, 1 atm' }], marks: [{ x: 5, y: U.boilModel(5), label: 'A onset' }, { x: 30, y: U.boilModel(30), label: 'C CHF' }, { x: 120, y: U.boilModel(120), label: 'D Leidenfrost' }], logx: true, logy: true, ylim: [1e2, 3e6], xlabel: 'ΔTe = Ts − Tsat [K]', ylabel: 'q″ [W/m²]', title: 'Boiling curve' }); },
    epsntu(st) { const N = U.range(0, 5, 80); U.plot(U.canvas(st, 760, 340), { series: [{ x: N, y: N.map(n => U.EPS.cnt[1](n, 0.5)), label: 'counter flow, Cr = 0.5' }, { x: N, y: N.map(n => U.EPS.par[1](n, 0.5)), label: 'parallel flow, Cr = 0.5', color: U.cssVar('--cool') }, { x: N, y: N.map(n => 1 - Math.exp(-n)), label: 'Cr = 0 (phase change)', dash: [5, 4], color: U.cssVar('--muted') }], ylim: [0, 1], xlabel: 'NTU', ylabel: 'ε', title: 'Effectiveness vs NTU' }); },
    erf(st) { const x = U.range(0, 3, 60); U.plot(U.canvas(st, 760, 320), { series: [{ x, y: x.map(U.erf), label: 'erf η' }, { x, y: x.map(U.erfc), label: 'erfc η', color: U.cssVar('--cool') }], xlabel: 'η = x / 2√(αt)  or  x / 2√(Dt)', ylabel: 'value', title: 'Error function' }); },
    tsdome(st) { const F = U.FL_W || (window.D && D.water ? (U.FL_W = new U.Fluid('water', D.water)) : null); if (!F) { st.append(h('p', {}, 'Loading steam data…')); return; } U.drawTs(U.canvas(st, 760, 380), F, [], { lines: [{ ...U.isobarTs(F, 1e5, 280, 800), label: '0.1 MPa', color: U.cssVar('--cool'), width: 1.5 }, { ...U.isobarTs(F, 3e6, 280, 900), label: '3 MPa', color: U.cssVar('--hot'), width: 1.5 }, { ...U.isobarTs(F, 3e7, 280, 1000), label: '30 MPa (supercritical)', color: U.cssVar('--violet'), width: 1.5 }] }); },
    planck(st) { const ls = []; for (let l = 0.1; l < 60; l *= 1.04) ls.push(l); U.plot(U.canvas(st, 760, 340), { series: [5800, 1500, 800, 300].map(T => ({ x: ls, y: ls.map(l => U.Eblam(l, T)), label: T + ' K' })), logx: true, logy: true, ylim: [1e-2, 1e9], xlabel: 'λ [μm]', ylabel: 'E_bλ [W/m²·μm]', title: 'Blackbody spectra' }); },
    mollier(st) { const r = [2, 4, 8, 12, 16, 20], k = 1.4; U.plot(U.canvas(st, 760, 320), { series: [{ x: r, y: r.map(x => 1 - Math.pow(x, 1 - k)), label: 'Otto, k = 1.4', points: false }, { x: r, y: r.map(x => 1 - Math.pow(x, 1 - k) * (Math.pow(2, k) - 1) / (k * 1)), label: 'Diesel, rc = 2', color: U.cssVar('--cool') }], xlabel: 'compression ratio r', ylabel: 'η', title: 'Air-standard efficiency vs compression ratio' }); }
  };

  /* ---------- player ---------- */
  const play = (el, id) => {
    const m = U.modById[id], sc = U.LESSONS[id]; if (!sc) { el.append(h('p', {}, 'No lesson yet.')); return; }
    const scenes = sc.map(s => s[0] === 'q' ? ['q', m.mcq[s[1]], s[1]] : s); let logged = false;
    el.append(h('div', { class: 'crumbs', html: `<a href="#/lessons">Lessons</a> › ${U.parts[m.part].name}` }), h('h1', {}, '🎬 ' + m.title));
    const stage = h('div', { class: 'ls-stage' }), cap = h('div', { class: 'ls-cap' }), bar = h('div', { class: 'ls-bar' }), ctl = h('div', { class: 'ctrl ls-ctl' });
    const shell = h('div', { class: 'ls-shell' }, stage, cap, bar, ctl); el.append(shell);
    let i = 0, playing = false, stopSpeech = null, cleanup = null, ctx = {}, t0 = 0, raf = 0;
    const prog = lp(); prog[id] = prog[id] || { seen: 0, q: {} };
    const markers = scenes.map((s, k) => { const b = h('button', { class: 'ls-seg' + (s[0] === 'q' ? ' q' : ''), title: (k + 1) + '', onclick: () => go(k) }); bar.append(b); return b; });
    const btnPlay = h('button', { class: 'btn pri sm', onclick: () => playing ? pause() : resume() }, '▶ Play');
    const vsel = h('select', { class: 'inp', style: 'width:auto;max-width:220px' }); const fillV = () => { vsel.innerHTML = ''; S.voices.forEach(v => vsel.append(h('option', { value: v.name }, v.name + ' (' + v.lang + ')'))); if (S.voice) vsel.value = S.voice.name; }; fillV(); if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillV);
    vsel.onchange = () => { S.voice = S.voices.find(v => v.name === vsel.value); store.set('lvoiceName', vsel.value); };
    const rate = h('select', { class: 'inp', style: 'width:auto' }, [0.8, 0.9, 1, 1.1, 1.25, 1.5].map(r => h('option', { value: r }, r + '×'))); rate.value = S.rate; rate.onchange = () => { S.rate = +rate.value; store.set('lrate', S.rate); };
    const mute = h('button', { class: 'btn sm', onclick: () => { S.on = !S.on; store.set('lvoice', S.on); mute.textContent = S.on ? '🔊 Voice on' : '🔇 Captions only'; if (!S.on && 'speechSynthesis' in window) speechSynthesis.cancel(); } }, S.on ? '🔊 Voice on' : '🔇 Captions only');
    ctl.append(h('button', { class: 'btn sm', onclick: () => go(Math.max(0, i - 1)) }, '⏮'), btnPlay, h('button', { class: 'btn sm', onclick: () => go(Math.min(scenes.length - 1, i + 1)) }, '⏭'), mute, h('label', {}, 'Speed', rate), h('label', {}, 'Voice', vsel), h('button', { class: 'btn sm ghost', onclick: () => shell.requestFullscreen && shell.requestFullscreen() }, '⛶ Full screen'));
    if (!('speechSynthesis' in window)) ctl.append(h('span', { class: 'small muted' }, 'This browser has no speech engine — captions will advance automatically.'));
    const clear = () => { if (stopSpeech) stopSpeech(); stopSpeech = null; if (cleanup) try { cleanup(); } catch (e) { } cleanup = null; cancelAnimationFrame(raf); };
    const draw = () => {
      clear(); stage.innerHTML = ''; cap.innerHTML = ''; ctx = {}; markers.forEach((b, k) => b.classList.toggle('on', k <= i)); const s = scenes[i];
      if (s[0] === 'q') {
        const [q, opts, a, ex] = s[1]; stage.append(h('h3', { class: 'ls-h' }, '❓ Quick check — the lesson waits for your answer'), h('div', { class: 'ls-q', html: q }));
        const ol = h('div', { class: 'opts' }); let done = false; const fb = h('div');
        opts.forEach((o, k) => { const b = h('button', { class: 'opt', html: String.fromCharCode(65 + k) + '. ' + o, onclick: () => { if (done) return; done = true; b.classList.add(k === a ? 'right' : 'wrong'); ol.children[a].classList.add('right'); fb.innerHTML = `<div class="${k === a ? 'sol' : 'hint'}"><b>${k === a ? '✔ Correct.' : '✘ Answer ' + String.fromCharCode(65 + a) + '.'}</b> ${ex}</div>`; U.math(fb); prog[id].q[i] = k === a ? 1 : 0; saveLp(Object.assign(lp(), { [id]: prog[id] })); U.track && U.track({ kind: 'lessonq', module: id, item: id + ':' + s[2], correct: k === a });
          stopSpeech = speak((k === a ? 'Correct. ' : 'Not quite. The answer is option ' + String.fromCharCode(65 + a) + '. ') + plain(ex), () => { if (playing) next(); }); } }); ol.append(b); });
        stage.append(h('div', { class: 'q' }, ol, fb)); U.math(stage); cap.textContent = 'Choose an option to continue.';
        prog[id].seen = Math.max(prog[id].seen, i + 1); prog[id].n = scenes.length; saveLp(Object.assign(lp(), { [id]: prog[id] }));
        if (playing) stopSpeech = speak('Quick check. ' + plain(q) + ' ' + opts.map((o, k) => 'Option ' + String.fromCharCode(65 + k) + ': ' + plain(o) + '.').join(' '), () => { });
        return;
      }
      const say = s[s.length - 1]; const r = (R_[s[0]] || (() => { }))(stage, s, ctx) || {}; cleanup = r.cleanup || null;
      cap.textContent = typeof say === 'string' ? say : '';
      if (ctx.reveal) ctx.reveal(playing ? 0 : 1);
      if (playing && typeof say === 'string') {
        const est = Math.max(2500, say.split(/\s+/).length / (2.55 * S.rate) * 1000); t0 = performance.now();
        const tick = () => { if (ctx.reveal) ctx.reveal((performance.now() - t0) / est); raf = requestAnimationFrame(tick); }; tick();
        stopSpeech = speak(say, () => { if (ctx.reveal) ctx.reveal(1); setTimeout(() => { if (playing) next(); }, s[0] === 'anim' ? 2500 : 600); });
      }
      prog[id].seen = Math.max(prog[id].seen, i + 1); prog[id].n = scenes.length; saveLp(Object.assign(lp(), { [id]: prog[id] }));
    };
    const next = () => { if (i < scenes.length - 1) { i++; draw(); } else { pause(); if (!logged && U.track) { logged = true; U.track({ kind: 'lesson', module: id, score: scenes.length, total: scenes.length }); } stage.append(h('div', { class: 'sol', html: '<b>Lesson complete.</b> ' + (() => { const q = Object.values(prog[id].q); return q.length ? `Quick checks: ${q.filter(x => x).length}/${q.length} correct.` : ''; })() })); } };
    const go = k => { i = k; draw(); };
    const pause = () => { playing = false; btnPlay.textContent = '▶ Play'; clear(); if (ctx.reveal) ctx.reveal(1); };
    const resume = () => { playing = true; btnPlay.textContent = '⏸ Pause'; if ('speechSynthesis' in window && !S.voices.length) pickVoices(); draw(); };
    U.onLeave(() => { playing = false; clear(); if (!logged && prog[id].seen > 1 && U.track) U.track({ kind: 'lesson', module: id, score: prog[id].seen, total: scenes.length }); });
    draw();
    document.addEventListener('keydown', function kh(e) { if (!document.body.contains(shell)) { document.removeEventListener('keydown', kh); return; } if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; if (e.key === ' ') { e.preventDefault(); playing ? pause() : resume(); } if (e.key === 'ArrowRight') go(Math.min(scenes.length - 1, i + 1)); if (e.key === 'ArrowLeft') go(Math.max(0, i - 1)); });
    el.append(h('p', { class: 'small muted' }, 'Keys: Space = play/pause, ← → = previous/next scene. Narration uses your device’s built-in voice (works offline once the app is installed). Choose an Indian-English voice in the Voice list if available.'));
  };
  const plain = s => String(s).replace(/<[^>]+>/g, '').replace(/\\\(|\\\)|\\\[|\\\]/g, '').replace(/\\[a-z]+/gi, '').replace(/[{}^_]/g, ' ');

  V['lesson'] = (el, id) => play(el, id);
  V['lessons'] = el => {
    const P = lp(); el.append(h('h1', {}, '🎬 Narrated lessons'), h('p', { class: 'prose muted' }, 'Short animated lessons (3–5 minutes) for every module, narrated by your device’s voice with captions, and quick-check questions that pause the lesson until you answer. Watch first, then read the module and practise.'));
    for (const [pk, p] of Object.entries(U.parts)) el.append(h('h2', {}, p.name), h('div', { class: 'grid' }, U.modules.filter(m => m.part === pk && U.LESSONS[m.id]).map(m => { const pr = P[m.id]; const pct = pr && pr.n ? Math.round(100 * pr.seen / pr.n) : 0; return h('a', { class: 'card tile', href: '#/lesson/' + m.id }, h('h3', {}, '🎬 ' + m.title), h('p', {}, U.LESSONS[m.id].length + ' scenes · ' + U.LESSONS[m.id].filter(s => s[0] === 'q').length + ' quick checks'), h('div', { class: 'progressbar', style: 'margin-top:8px' }, h('i', { style: `width:${pct}%` }))); })));
  };
})();
