/* Student activity tracking (Supabase, project "midastouch") + instructor dashboard */
'use strict';
(() => {
  const { h, $ } = U, V = U.routes;
  const SB = { url: 'https://pkbktfdbtsctoyprtoxq.supabase.co', key: 'sb_publishable_iOSqJMuBohcoB4y7brROeA_KkPft8ZN' };
  const st = U.store;
  const me = () => st.get('student', null);
  U.student = me;

  /* ---------- REST helpers ---------- */
  const rpc = async (fn, body, token) => {
    const r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null); if (!r.ok) throw new Error((j && (j.message || j.msg)) || ('HTTP ' + r.status)); return j;
  };

  /* ---------- event queue (works offline; flushes when online) ---------- */
  U.track = ev => {
    if (!me()) return;
    const q = st.get('tq', []); q.push({ ...ev, at: new Date().toISOString() }); if (q.length > 2000) q.splice(0, q.length - 2000); st.set('tq', q);
    clearTimeout(U._tf); U._tf = setTimeout(flush, 4000);
  };
  let flushing = false;
  const flush = async () => {
    const s = me(); if (!s || flushing || !navigator.onLine) return; let q = st.get('tq', []); if (!q.length) return; flushing = true;
    try {
      while (q.length) { const batch = q.slice(0, 100); await rpc('therm_log', { p_token: s.token, p_events: batch }); q = st.get('tq', []).slice(batch.length); st.set('tq', q); }
      st.set('tlast', Date.now()); paint();
    } catch (e) { if (/invalid session/.test(e.message)) { st.set('student', null); paint(); } }
    flushing = false;
  };
  window.addEventListener('online', flush); document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); }); setInterval(flush, 60000);

  /* ---------- sidebar badge ---------- */
  const paint = () => {
    let b = $('#who'); if (!b) { const nav = $('#nav'); if (!nav) return; b = h('div', { id: 'who', style: 'margin:6px 4px 10px;padding:8px 10px;border:1px solid #2b3a4b;border-radius:10px;font-size:.85rem' }); nav.before(b); }
    const s = me(), pend = st.get('tq', []).length;
    b.innerHTML = s ? `👤 <b style="color:#fff">${U.esc(s.name)}</b><br><span style="color:#8796a8">${s.usn} · ${pend ? pend + ' pending (sync when online)' : 'progress synced ✓'}</span> · <a href="#/signin" style="color:#fbbf24">change</a>` : `<a href="#/signin" style="color:#fbbf24;font-weight:600">👤 Sign in with your USN</a><br><span style="color:#8796a8">so your teacher can see your progress</span>`;
  };
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { paint(); flush(); }, 50));

  V['signin'] = el => {
    const s = me();
    el.append(h('h1', {}, 'Student sign-in'), h('p', { class: 'prose muted' }, 'Sign in once on each device with your USN and name. Your quiz answers, numericals, lessons and module visits are then recorded for your teacher. Everything still works without signing in — it just isn’t recorded. Activity done offline is uploaded automatically when you reconnect.'));
    if (s) el.append(h('div', { class: 'box ok', html: `<b>Signed in</b>${U.esc(s.name)} (${s.usn})` }), h('button', { class: 'btn', onclick: () => { st.set('student', null); st.set('tq', []); paint(); U.route(); } }, 'Sign out on this device'));
    const usn = h('input', { class: 'inp', placeholder: 'e.g. 4MT22ME001', autocapitalize: 'characters', value: s ? s.usn : '' }), name = h('input', { class: 'inp', placeholder: 'Full name', value: s ? s.name : '' }), msg = h('div');
    const go = async () => { msg.innerHTML = 'Signing in…'; try { const r = await rpc('therm_register', { p_usn: usn.value, p_name: name.value, p_ua: navigator.userAgent }); st.set('student', r); paint(); msg.innerHTML = `<div class="sol"><b>Welcome, ${U.esc(r.name)}.</b> You are signed in as ${r.usn}.</div>`; U.track({ kind: 'view', module: 'signin' }); } catch (e) { msg.innerHTML = `<p class="err">⚠ ${U.esc(navigator.onLine ? e.message : 'You are offline — sign in once when connected.')}</p>`; } };
    el.append(h('div', { class: 'card', style: 'max-width:520px' }, h('div', { class: 'fld' }, h('label', {}, 'USN'), usn), h('div', { class: 'fld', style: 'margin-top:10px' }, h('label', {}, 'Name'), name), h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: go }, s ? 'Switch student' : 'Sign in')), msg));
  };

  /* ================= instructor dashboard ================= */
  const auth = () => st.get('tauth', null);
  const signIn = async (email, password) => {
    const r = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error_description || j.msg || 'Sign-in failed');
    st.set('tauth', { at: j.access_token, rt: j.refresh_token, exp: Date.now() + j.expires_in * 1000 - 60000, email });
  };
  const token = async () => {
    const a = auth(); if (!a) return null; if (Date.now() < a.exp) return a.at;
    const r = await fetch(`${SB.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: a.rt }) });
    const j = await r.json(); if (!r.ok) { st.set('tauth', null); return null; } st.set('tauth', { ...a, at: j.access_token, rt: j.refresh_token, exp: Date.now() + j.expires_in * 1000 - 60000 }); return j.access_token;
  };
  const getAll = async (table, query) => { const t = await token(); const out = []; for (let off = 0; ; off += 1000) { const r = await fetch(`${SB.url}/rest/v1/${table}?${query}`, { headers: { apikey: SB.key, Authorization: 'Bearer ' + t, Range: `${off}-${off + 999}`, 'Range-Unit': 'items' } }); if (!r.ok) throw new Error('HTTP ' + r.status + ' reading ' + table); const j = await r.json(); out.push(...j); if (j.length < 1000) break; } return out; };
  const csv = (rows, name) => { const s = rows.map(r => r.map(x => typeof x === 'string' && /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x).join(',')).join('\n'); const a = h('a', { href: URL.createObjectURL(new Blob([s], { type: 'text/csv' })), download: name + '.csv' }); document.body.append(a); a.click(); a.remove(); };
  const qtext = item => { const [mid, k] = String(item || '').split(':'); const m = U.modById[mid]; if (!m || k == null) return item; if (k.startsWith('n')) return '🧮 ' + ((m.num || [])[+k.slice(1)] || {}).t; return ((m.mcq || [])[+k] || [''])[0].replace(/<[^>]+>/g, ''); };

  V['teacher'] = async el => {
    el.append(h('h1', {}, '👩‍🏫 Instructor dashboard'));
    if (!auth()) {
      const em = h('input', { class: 'inp', type: 'email', value: 'nayak.vignesh113@gmail.com' }), pw = h('input', { class: 'inp', type: 'password', placeholder: 'password (same as your CNC-lesson dashboard)' }), msg = h('div');
      const go = async () => { msg.textContent = 'Signing in…'; try { await signIn(em.value, pw.value); U.route(); } catch (e) { msg.innerHTML = '<p class="err">' + U.esc(e.message) + '</p>'; } };
      pw.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      el.append(h('div', { class: 'card', style: 'max-width:480px' }, h('div', { class: 'fld' }, h('label', {}, 'Email'), em), h('div', { class: 'fld', style: 'margin-top:10px' }, h('label', {}, 'Password'), pw), h('div', { class: 'ctrl' }, h('button', { class: 'btn pri', onclick: go }, 'Sign in')), msg)); return;
    }
    const top = h('div', { class: 'ctrl' }); el.append(top); const box = h('div', {}, h('p', { class: 'muted' }, 'Loading class data…')); el.append(box);
    let S, E; try { [S, E] = await Promise.all([getAll('therm_students', 'select=*&order=usn'), getAll('therm_events', 'select=usn,kind,module,item,correct,score,total,at&order=at.desc')]); } catch (e) { box.innerHTML = `<p class="err">${U.esc(e.message)} — if this persists, sign out and in again.</p>`; top.append(h('button', { class: 'btn sm', onclick: () => { st.set('tauth', null); U.route(); } }, 'Sign out')); return; }
    const batchSel = h('select', { class: 'inp', style: 'width:auto' }, h('option', { value: '' }, 'All students'), [...new Set(S.map(s => s.usn.slice(0, 7)))].sort().map(b => h('option', { value: b }, 'USN ' + b + '…')));
    const days = h('select', { class: 'inp', style: 'width:auto' }, [['0', 'All time'], ['1', 'Last 24 h'], ['7', 'Last 7 days'], ['30', 'Last 30 days']].map(([v, l]) => h('option', { value: v }, l)));
    top.append(h('label', {}, 'Batch', batchSel), h('label', {}, 'Period', days), h('button', { class: 'btn sm', onclick: () => U.route() }, '↻ Refresh'), h('button', { class: 'btn sm ghost', onclick: () => { st.set('tauth', null); U.route(); } }, 'Sign out ' + auth().email));
    const draw = () => {
      box.innerHTML = ''; const since = +days.value ? Date.now() - +days.value * 864e5 : 0;
      const stu = S.filter(s => !batchSel.value || s.usn.startsWith(batchSel.value)), set = new Set(stu.map(s => s.usn));
      const ev = E.filter(e => set.has(e.usn) && Date.parse(e.at) >= since);
      const per = {}; stu.forEach(s => per[s.usn] = { s, mcq: 0, mcqOk: 0, num: 0, numOk: new Set(), lessons: new Set(), lq: 0, lqOk: 0, views: new Set(), quiz: [], last: s.last_seen });
      ev.forEach(e => { const p = per[e.usn]; if (!p) return; if (e.kind === 'mcq') { p.mcq++; if (e.correct) p.mcqOk++; } if (e.kind === 'num') { p.num++; if (e.correct) p.numOk.add(e.item); } if (e.kind === 'lesson' && e.total && e.score >= e.total) p.lessons.add(e.module); if (e.kind === 'lessonq') { p.lq++; if (e.correct) p.lqOk++; } if (e.kind === 'view') p.views.add(e.module); if (e.kind === 'quiz') p.quiz.push(100 * e.score / e.total); });
      const active = Object.values(per).filter(p => p.mcq + p.num + p.views.size + p.lq > 0).length;
      box.append(h('div', { class: 'out' }, [['Students registered', stu.length], ['Active in period', active], ['MCQ answers', ev.filter(e => e.kind === 'mcq').length], ['Numerical checks', ev.filter(e => e.kind === 'num').length], ['Lessons completed', ev.filter(e => e.kind === 'lesson' && e.score >= e.total).length], ['Class MCQ accuracy', (() => { const m = ev.filter(e => e.kind === 'mcq'); return m.length ? Math.round(100 * m.filter(e => e.correct).length / m.length) + ' %' : '—'; })()]].map(([a, b]) => h('div', {}, h('span', {}, a), h('b', {}, String(b))))));
      // per student
      const rows = Object.values(per).sort((a, b) => a.s.usn.localeCompare(b.s.usn)).map(p => [p.s.usn, p.s.name, p.views.size, p.lessons.size, p.mcq, p.mcq ? Math.round(100 * p.mcqOk / p.mcq) : '', p.numOk.size, p.num, p.quiz.length ? Math.round(p.quiz.reduce((a, b) => a + b) / p.quiz.length) : '', new Date(p.last).toLocaleString()]);
      const cols = ['USN', 'Name', 'Modules opened', 'Lessons completed', 'MCQs answered', 'MCQ accuracy %', 'Numericals solved', 'Numerical attempts', 'Avg quiz %', 'Last seen'];
      box.append(h('h2', {}, 'Students'), h('button', { class: 'btn sm', onclick: () => csv([cols, ...rows], 'therm_students') }, '⬇ CSV for Excel'), h('div', { class: 'tablewrap', html: '<table class="num"><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>' + rows.map(r => '<tr>' + r.map(x => `<td>${U.esc(x)}</td>`).join('') + '</tr>').join('') + '</table>' }));
      // per module
      const mods = U.modules.map(m => { const e = ev.filter(x => x.module === m.id); const mc = e.filter(x => x.kind === 'mcq'); return [m.title, new Set(e.filter(x => x.kind === 'view').map(x => x.usn)).size, new Set(e.filter(x => x.kind === 'lesson' && x.score >= x.total).map(x => x.usn)).size, mc.length, mc.length ? Math.round(100 * mc.filter(x => x.correct).length / mc.length) : null, new Set(e.filter(x => x.kind === 'num' && x.correct).map(x => x.usn + x.item)).size]; });
      const mcols = ['Module', 'Students opened', 'Lessons completed', 'MCQ answers', 'Accuracy %', 'Numericals solved'];
      box.append(h('h2', {}, 'Modules'), h('button', { class: 'btn sm', onclick: () => csv([mcols, ...mods], 'therm_modules') }, '⬇ CSV'), h('div', { class: 'tablewrap', html: '<table class="num"><tr>' + mcols.map(c => `<th>${c}</th>`).join('') + '</tr>' + mods.map(r => '<tr>' + r.map((x, i) => `<td style="${i === 4 && x != null ? `background:${x < 50 ? 'rgba(220,38,38,.18)' : x < 70 ? 'rgba(234,179,8,.18)' : 'rgba(22,163,74,.15)'}` : ''}">${x == null ? '—' : U.esc(x)}</td>`).join('') + '</tr>').join('') + '</table>' }));
      // hardest questions
      const qs = {}; ev.filter(e => e.kind === 'mcq' || e.kind === 'num' || e.kind === 'lessonq').forEach(e => { const k = e.kind + '|' + e.item; (qs[k] = qs[k] || { k: e.kind, item: e.item, n: 0, ok: 0 }); qs[k].n++; if (e.correct) qs[k].ok++; });
      const hard = Object.values(qs).filter(q => q.n >= 3).sort((a, b) => a.ok / a.n - b.ok / b.n).slice(0, 25);
      box.append(h('h2', {}, 'Hardest questions (≥ 3 attempts)'), h('p', { class: 'small muted' }, 'Low success here points to concepts worth re-teaching in class.'), h('div', { class: 'tablewrap', html: hard.length ? '<table class="num"><tr><th>Type</th><th>Question</th><th>Attempts</th><th>Correct %</th></tr>' + hard.map(q => `<tr><td>${q.k}</td><td style="text-align:left">${U.esc(qtext(q.item.replace(/^lq:/, '')) || q.item)}</td><td>${q.n}</td><td>${Math.round(100 * q.ok / q.n)}</td></tr>`).join('') + '</table>' : '<p class="muted">Not enough data yet.</p>' }));
      box.append(h('h2', {}, 'Raw activity'), h('button', { class: 'btn sm', onclick: () => csv([['USN', 'Kind', 'Module', 'Item', 'Correct', 'Score', 'Total', 'Time'], ...ev.map(e => [e.usn, e.kind, e.module || '', e.item || '', e.correct ?? '', e.score ?? '', e.total ?? '', e.at])], 'therm_events') }, `⬇ All ${ev.length} events (CSV)`));
    };
    batchSel.onchange = draw; days.onchange = draw; draw();
  };
})();
