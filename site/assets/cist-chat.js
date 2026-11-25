/* CIST home-page assistant. Self-contained: adds a small chat bubble.
   Uses /api/chat (AI) when the CIST server has an API key; otherwise answers from CISTDATA in the browser. */
(function () {
  var D = window.CISTDATA || { districts: [], villages: [], projects: [], courses: [] };
  var css = '#cc-b{position:fixed;right:20px;bottom:20px;z-index:50;width:58px;height:58px;border-radius:50%;border:0;background:#7e2da1;color:#fff;cursor:pointer;box-shadow:0 10px 28px rgba(58,15,92,.35);display:flex;align-items:center;justify-content:center}#cc-b:hover{transform:translateY(-2px)}#cc-b svg{width:28px;height:28px}' +
    '#cc-p{position:fixed;right:20px;bottom:90px;z-index:50;width:min(370px,calc(100vw - 32px));height:min(520px,calc(100vh - 120px));background:#fff;border:1px solid rgba(58,15,92,.14);border-radius:18px;box-shadow:0 24px 60px rgba(58,15,92,.3);display:none;flex-direction:column;overflow:hidden;font:400 .95rem/1.5 "DM Sans",system-ui,sans-serif;color:#24113a}#cc-p.on{display:flex}' +
    '#cc-h{background:#3a0f5c;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}#cc-h b{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.05rem;flex:1}#cc-h small{display:block;font:400 .75rem "DM Sans",sans-serif;opacity:.8}#cc-x{background:none;border:0;color:#fff;font-size:1.5rem;cursor:pointer;line-height:1}' +
    '#cc-l{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f0fb}.cc-m{max-width:86%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}.cc-m.a{background:#fff;border:1px solid rgba(58,15,92,.12);align-self:flex-start;border-bottom-left-radius:4px}.cc-m.u{background:#7e2da1;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '#cc-q{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px;background:#f6f0fb}#cc-q button{font:inherit;font-size:.82rem;padding:5px 11px;border-radius:99px;border:1px solid #7e2da1;background:#fff;color:#7e2da1;cursor:pointer}' +
    '#cc-f{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(58,15,92,.14);background:#fff}#cc-i{flex:1;font:inherit;padding:9px 12px;border:1.5px solid rgba(58,15,92,.2);border-radius:99px;min-width:0}#cc-i:focus{outline:3px solid rgba(126,45,161,.3);border-color:#7e2da1}#cc-s{background:#7e2da1;color:#fff;border:0;border-radius:99px;padding:0 16px;font:700 .9rem "DM Sans",sans-serif;cursor:pointer}#cc-s:disabled{opacity:.5}' +
    '.cc-fl{color:inherit;font-size:inherit}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function mk(t, id, cls, txt) { var e = document.createElement(t); if (id) e.id = id; if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var b = mk('button', 'cc-b'); b.type = 'button'; b.setAttribute('aria-label', 'Ask CIST assistant'); b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var p = mk('div', 'cc-p'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'CIST assistant');
  var h = mk('div', 'cc-h'); var ht = mk('b', '', 'CIST assistant'); ht.appendChild(mk('small', '', 'Ask about villages, projects and courses')); var x = mk('button', 'cc-x', '', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Close chat'); h.appendChild(ht); h.appendChild(x);
  var l = mk('div', 'cc-l'); l.setAttribute('aria-live', 'polite');
  var q = mk('div', 'cc-q');
  var f = mk('form', 'cc-f'); var i = mk('input', 'cc-i'); i.placeholder = 'Type your question'; i.maxLength = 300; i.setAttribute('aria-label', 'Your question'); i.autocomplete = 'off'; var s = mk('button', 'cc-s', '', 'Send'); s.type = 'submit'; f.appendChild(i); f.appendChild(s);
  p.appendChild(h); p.appendChild(l); p.appendChild(q); p.appendChild(f); document.body.appendChild(b); document.body.appendChild(p);

  var hist = [];
  function say(t, who) { var m = mk('div', '', 'cc-m ' + who, t); l.appendChild(m); l.scrollTop = l.scrollHeight; return m; }
  ['What is CIST?', 'Which villages do you work with?', 'What projects are deployed?', 'What courses are offered?'].forEach(function (t) { var c = mk('button', '', '', t); c.type = 'button'; c.onclick = function () { ask(t); }; q.appendChild(c); });
  say('Hello! I can answer questions about CIST, our villages, projects and courses.', 'a');

  function open(on) { p.classList.toggle('on', on); b.setAttribute('aria-expanded', on); if (on) i.focus(); else b.focus(); }
  b.onclick = function () { open(!p.classList.contains('on')); }; x.onclick = function () { open(false); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('on')) open(false); });
  f.onsubmit = function (e) { e.preventDefault(); var t = i.value.trim(); if (t) { i.value = ''; ask(t); } };

  /* ---- local answers (no server / no API key) ---- */
  var STOP = /\b(the|a|an|is|are|of|in|at|to|and|or|do|does|you|your|we|our|what|which|who|where|how|about|tell|me|please|can|about|with|for|on)\b/g;
  function words(t) { return t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(STOP, ' ').split(/\s+/).filter(function (w) { return w.length > 2; }); }
  function dn(id) { var d = D.districts.filter(function (x) { return x.id === id; })[0]; return d ? d.name : ''; }
  function local(t) {
    var lt = t.toLowerCase(), w = words(t);
    if (/^(hi|hello|hey|namaste)\b/.test(lt)) return 'Hello! Ask me about CIST villages, projects or courses.';
    var vs = D.villages.filter(function (v) { return lt.indexOf(v.name.toLowerCase()) > -1; });
    if (vs.length) return vs.map(function (v) { var pr = D.projects.filter(function (p) { return p.villageId === v.id; }); return v.name + ' (' + dn(v.district) + '): ' + v.focus + (pr.length ? ' Projects there: ' + pr.map(function (p) { return p.name; }).join(', ') + '.' : ''); }).join('\n\n');
    if (/collaborat|contact|reach|join|partner with|address|where is the college|location|visit/.test(lt)) return 'CIST is at KG Reddy College of Engineering & Technology, beside Moinabad PS, Chilkur (V), Moinabad (M), Hyderabad, Telangana. To work with us, use the "Collaborate with us" button in the Contact section at the bottom of this page.';
    if (/course|syllabus|year|semester|subject|curriculum/.test(lt)) { var y = /(?:year\s*|\b)([1-4])(?:st|nd|rd|th)?\s*year|year\s*([1-4])/.exec(lt), n = y && (y[1] || y[2]); var c = D.courses.filter(function (c) { return !n || c.year === +n; }); return (n ? 'Year ' + n + ' courses:\n' : 'CIST courses across four years:\n') + c.map(function (c) { return 'Year ' + c.year + ' ' + c.sem + ': ' + c.name; }).join('\n'); }
    if (/how many|number of|count/.test(lt) && /village/.test(lt)) return 'CIST partners with ' + D.villages.length + ' villages across ' + D.districts.length + ' districts: ' + D.districts.map(function (d) { return d.name; }).join(', ') + '.';
    if (/district/.test(lt)) return 'Our ' + D.villages.length + ' villages are in ' + D.districts.length + ' districts: ' + D.districts.map(function (d) { return d.name + ' (' + (function (n) { return n + (n === 1 ? ' village' : ' villages'); })(D.villages.filter(function (v) { return v.district === d.id; }).length) + ')'; }).join(', ') + '.';
    if (/village/.test(lt) && !/project/.test(lt)) return 'Our villages: ' + D.villages.map(function (v) { return v.name + ' (' + dn(v.district) + ')'; }).join(', ') + '. Ask about any of them for details.';
    var pr = D.projects.map(function (p) { var hay = (p.name + ' ' + p.village + ' ' + p.category + ' ' + p.description + ' ' + p.faculty).toLowerCase(), sc = 0; w.forEach(function (k) { if (hay.indexOf(k) > -1) sc++; }); return { p: p, sc: sc }; }).filter(function (r) { return r.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; });
    if (pr.length && (pr[0].sc > 1 || !/project|innovation|deploy|solar|machine/.test(lt) || true)) return pr.slice(0, 3).map(function (r) { var p = r.p; return p.name + ' (' + p.village + '): ' + p.description + (p.faculty ? ' Monitored by ' + p.faculty + '.' : ''); }).join('\n\n');
    if (/project|innovation|deploy/.test(lt)) return D.projects.length + ' projects are deployed in villages: ' + D.projects.map(function (p) { return p.name; }).join('; ') + '. Select a project in the Innovations section for details.';
    if (/cist|about|what is|mission|vision|purpose/.test(lt)) return 'CIST (Centre for Innovation & Social Transformation) at KG Reddy College helps students work with villagers, find pressing problems and build technology-based solutions. It brings the UN Sustainable Development Goals and service-learning into the curriculum.';
    if (/award|recogni/.test(lt)) return 'See the Recognition section on this page for CIST\u2019s awards.';
    return 'I am not sure about that. You can ask about our villages, projects or courses, or use the Contact section to reach the CIST team.';
  }

  function ask(t) {
    say(t, 'u'); hist.push({ role: 'user', content: t }); if (hist.length > 8) hist = hist.slice(-8);
    s.disabled = true; var w = say('Thinking\u2026', 'a');
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist }) })
      .then(function (r) { if (r.status === 429) return r.json().then(function (j) { return { reply: j.error }; }); if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (j.mode === 'local' || !j.reply) throw 0; return j.reply; })
      .catch(function () { return local(t); })
      .then(function (a) { w.textContent = a; hist.push({ role: 'assistant', content: a }); l.scrollTop = l.scrollHeight; s.disabled = false; i.focus(); });
  }

  /* discreet faculty link in the footer */
  var ft = document.querySelector('footer .w'); if (ft) { var a = document.createElement('a'); a.href = 'faculty.html'; a.className = 'cc-fl'; a.textContent = 'Faculty login'; a.style.cssText = 'margin-left:14px;opacity:.7;font-size:.85em'; ft.appendChild(a); }
})();
