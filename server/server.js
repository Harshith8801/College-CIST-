'use strict';
/* CIST site server: zero dependencies, Node 18+.
   Serves ../site, faculty login, AI polish + publish, and the public chatbot. */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA = path.join(__dirname, 'data');
const DATAFILE = path.join(SITE, 'assets', 'cist-data.js');
const SURVEY = path.join(SITE, 'villages-data.js');
const PORT = +process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY || '';
const POLISH_MODEL = process.env.CLAUDE_POLISH_MODEL || 'claude-sonnet-5-5';
const CHAT_MODEL = process.env.CLAUDE_CHAT_MODEL || 'claude-haiku-5-5';
const GKEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const AI_ON = !!(KEY || GKEY);
const SECURE = process.env.COOKIE_SECURE === '1';
const API_BASE = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

fs.mkdirSync(path.join(DATA, 'backups'), { recursive: true });
const secretFile = path.join(DATA, 'secret.key');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
const SECRET = process.env.SESSION_SECRET || fs.readFileSync(secretFile, 'utf8').trim();

/* ---------- helpers ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const send = (res, code, obj, headers = {}) => { const b = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }); res.end(b); };
const readBody = req => new Promise((ok, no) => { let s = ''; req.on('data', c => { s += c; if (s.length > 40000) { no(new Error('too large')); req.destroy(); } }); req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { no(new Error('bad json')); } }); });
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

function loadData() { const s = fs.readFileSync(DATAFILE, 'utf8'); return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); }
function saveData(d) {
  const old = fs.readFileSync(DATAFILE, 'utf8');
  const head = old.slice(0, old.indexOf('window.CISTDATA'));
  fs.writeFileSync(path.join(DATA, 'backups', 'cist-data-' + new Date().toISOString().replace(/[:.]/g, '-') + '.js'), old);
  const tmp = DATAFILE + '.tmp';
  fs.writeFileSync(tmp, head + 'window.CISTDATA=' + JSON.stringify(d, null, 1) + ';\n');
  fs.renameSync(tmp, DATAFILE);
  const bk = fs.readdirSync(path.join(DATA, 'backups')).sort(); // keep the newest 200 backups
  bk.slice(0, Math.max(0, bk.length - 200)).forEach(f => fs.unlinkSync(path.join(DATA, 'backups', f)));
}
function audit(user, action, detail) { fs.appendFileSync(path.join(DATA, 'audit.log'), JSON.stringify({ t: new Date().toISOString(), user, action, detail }) + '\n'); }
function recentAudit(n) { try { return fs.readFileSync(path.join(DATA, 'audit.log'), 'utf8').trim().split('\n').slice(-n).reverse().map(l => JSON.parse(l)); } catch (e) { return []; } }

/* ---------- accounts + sessions ---------- */
const usersFile = path.join(DATA, 'faculty.json');
const users = () => { try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')); } catch (e) { return []; } };
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function sign(p) { const b = Buffer.from(JSON.stringify(p)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); }
function verify(t) {
  if (!t || t.indexOf('.') < 0) return null; const [b, m] = t.split('.');
  const good = crypto.createHmac('sha256', SECRET).update(b).digest('base64url');
  if (m.length !== good.length || !crypto.timingSafeEqual(Buffer.from(m), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(b, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (e) { return null; }
}
const cookie = req => { const m = /(?:^|;\s*)cist_sess=([^;]+)/.exec(req.headers.cookie || ''); return m ? m[1] : ''; };
const session = req => verify(cookie(req));
const fails = new Map();
function throttled(k) { const f = fails.get(k); return f && f.n >= 5 && Date.now() - f.t < 15 * 60000; }
function noteFail(k) { const f = fails.get(k); fails.set(k, { n: f && Date.now() - f.t < 15 * 60000 ? f.n + 1 : 1, t: Date.now() }); }

const hits = new Map();
function limited(ip, max, ms) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < ms); a.push(now); hits.set(ip, a); return a.length > max; }

/* ---------- Claude ---------- */
async function claude(model, system, messages, max) {
  if (!KEY && GKEY) { // free option: Google Gemini
    const r = await fetch((process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com') + '/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': GKEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: Math.max(max, 800) } }), signal: AbortSignal.timeout(30000)
    });
    if (!r.ok) throw new Error('AI error ' + r.status + ' (check GEMINI_API_KEY and GEMINI_MODEL)');
    const j = await r.json();
    return ((j.candidates && j.candidates[0] && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
  }
  const r = await fetch(API_BASE + '/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: max, system, messages }), signal: AbortSignal.timeout(30000)
  });
  if (!r.ok) throw new Error('AI error ' + r.status);
  const j = await r.json();
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

const RULES = `Rules you must follow:
- Use ONLY facts the faculty member wrote or that are already in the current entry. Never invent numbers, dates, names, places, results or claims. If something is unclear, leave it out.
- Do not include phone numbers, email addresses, or names of villagers. Leave out crime, communal and political-dispute content.
- Plain, warm, factual English for a college website. No hype, no marketing words, no emojis.`;
const LIMITS = {
  project: { name: 90, category: 60, description: 320 },
  village: { focus: 200 },
  course: { name: 100, text: 220 }
};
const FIELD_HELP = {
  project: '{"name": short project name (keep the existing name unless the notes rename it), "category": 2-5 words such as "Livelihood and solar energy", "description": 1-2 sentences, max 300 characters}',
  village: '{"focus": ONE sentence, max 180 characters, on what CIST does in this village}',
  course: '{"name": course title (keep existing unless notes rename it), "text": 1 sentence, max 200 characters, on what the course covers}'
};
const PII = /(\+?\d[\d\s-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.-]+)/;

function basicCleanup(type, notes, cur) { // used only when no API key is set
  const t = clean(notes, 600).replace(/\s*[.;]\s*/g, '. ').replace(/\.\s*\./g, '.').trim();
  const s = t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
  if (type === 'village') return { focus: s.slice(0, 200) };
  if (type === 'course') return { name: cur.name || '', text: s.slice(0, 220) };
  return { name: cur.name || '', category: cur.category || '', description: s.slice(0, 320) };
}

async function polish(type, cur, notes) {
  const warnings = [];
  if (PII.test(notes)) warnings.push('Your notes contain what looks like a phone number or email. Remove it: the site must not publish contact details.');
  if (!AI_ON) return { mode: 'basic', fields: basicCleanup(type, notes, cur), warnings: warnings.concat('AI is not connected (no ANTHROPIC_API_KEY), so this is only a basic tidy-up.') };
  const sys = `You help CIST (Centre for Innovation & Social Transformation, KG Reddy College of Engineering & Technology) faculty keep the college website accurate.\nYou receive the CURRENT entry and the faculty member's rough NOTES. Rewrite the entry so it reads well while keeping every fact from the notes. Merge with the current entry; keep current facts unless the notes replace them.\n${RULES}\nReply with ONLY a JSON object, no markdown fences, in this shape: ${FIELD_HELP[type]}`;
  const out = await claude(POLISH_MODEL, sys, [{ role: 'user', content: `Type: ${type}\nCURRENT: ${JSON.stringify(cur)}\nNOTES: ${notes}` }], 600);
  let o; try { o = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch (e) { throw new Error('The AI reply could not be read. Please try again.'); }
  const fields = {}; for (const k of Object.keys(LIMITS[type])) fields[k] = clean(o[k] != null ? o[k] : cur[k], LIMITS[type][k]);
  if (Object.values(fields).some(v => PII.test(v))) warnings.push('The result contains something that looks like a phone number or email. Please remove it before publishing.');
  return { mode: 'ai', fields, warnings };
}

/* ---------- chatbot context ---------- */
function chatContext() {
  const d = loadData(); let survey = null; try { const s = fs.readFileSync(SURVEY, 'utf8'); survey = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); } catch (e) { }
  const dn = id => (d.districts.find(x => x.id === id) || {}).name || '';
  const L = [];
  L.push('ABOUT: CIST (Centre for Innovation & Social Transformation) at KG Reddy College of Engineering & Technology (autonomous), Chilkur, Moinabad, Hyderabad, Telangana. Students work with villagers to find pressing problems and build technology-based solutions; the curriculum brings in the UN Sustainable Development Goals and service-learning with non-profits.');
  L.push('VISION: a recognised centre of excellence fostering an active ecosystem of community engagement, continuous innovation and collaborative research for sustainable socio-economic development.');
  L.push('MISSION: inspire faculty and students to be innovators and change makers; build reciprocal partnerships with rural communities to solve real problems; service-learning with non-profits aimed at the SDGs; community-based participatory research.');
  L.push('NETWORK: ' + d.villages.length + ' villages in ' + d.districts.length + ' districts (' + d.districts.map(x => x.name).join(', ') + ').');
  L.push('VILLAGES: ' + d.villages.map(v => `${v.name} (${dn(v.district)}): ${v.focus}`).join(' | '));
  L.push('PROJECTS (' + d.projects.length + '): ' + d.projects.map(p => `${p.name} in ${p.village} [${p.category}; ${p.status}${p.faculty ? '; monitored by ' + p.faculty : ''}]: ${p.description}`).join(' | '));
  L.push('COURSES: ' + d.courses.map(c => `Year ${c.year} ${c.sem}: ${c.name}: ${c.text}`).join(' | '));
  if (survey) L.push('VILLAGE SURVEY DATA (Census 2011 and student surveys; estimates approximate): ' + survey.villages.map(v => `${v.name}${v.census2011 ? ' census 2011 population ' + v.census2011.population : ''}${v.estimate2026 ? ', approx. 2026 ' + v.estimate2026.base : ''}${v.strengths && v.strengths.length ? '; strengths: ' + v.strengths.slice(0, 3).join('; ') : ''}${v.needs && v.needs.length ? '; needs: ' + v.needs.slice(0, 3).join('; ') : ''}`).join(' | '));
  L.push('PAGES: home page sections are About, Innovations, Villages, Awards, SDGs, Courses, Gallery, Partners, Contact; a separate Village data page has survey details. To collaborate, use the "Collaborate with us" button in the Contact section.');
  return L.join('\n');
}
async function chat(msgs) {
  const sys = `You are the CIST website assistant. Answer visitors' questions about CIST, its villages, projects, courses and the college using ONLY the information below. Be short (2-4 sentences), friendly and accurate. If the answer is not in the information, say you are not sure and suggest the Contact section. Never invent facts, phone numbers or emails. Do not discuss politics or crime. Reply in the language the visitor writes in.\n\n${chatContext()}`;
  return claude(CHAT_MODEL, sys, msgs, 400);
}

/* ---------- routes ---------- */
async function api(req, res, url) {
  const ip = req.socket.remoteAddress || '?';
  if (req.method === 'POST' && !/application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only' });
  const s = session(req);
  try {
    if (url === '/api/chat' && req.method === 'POST') {
      if (limited('chat' + ip, 20, 60000)) return send(res, 429, { error: 'Too many questions, please wait a minute.' });
      if (!AI_ON) return send(res, 200, { mode: 'local' });
      const b = await readBody(req);
      const m = (Array.isArray(b.messages) ? b.messages : []).slice(-6).map(x => ({ role: x.role === 'assistant' ? 'assistant' : 'user', content: clean(x.content, 500) })).filter(x => x.content);
      while (m.length && m[0].role !== 'user') m.shift();
      if (!m.length || m[m.length - 1].role !== 'user') return send(res, 400, { error: 'Ask a question first.' });
      return send(res, 200, { mode: 'ai', reply: clean(await chat(m), 1200) });
    }
    if (url === '/api/login' && req.method === 'POST') {
      const b = await readBody(req), u = clean(b.username, 40).toLowerCase(), k = ip + '|' + u;
      if (throttled(k)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const acct = users().find(x => x.username === u);
      const ok = acct && crypto.timingSafeEqual(Buffer.from(hashPw(String(b.password || ''), acct.salt), 'hex'), Buffer.from(acct.hash, 'hex'));
      if (!ok) { noteFail(k); audit(u || '?', 'login-failed', ip); return send(res, 401, { error: 'Wrong username or password.' }); }
      fails.delete(k); audit(u, 'login', ip);
      const t = sign({ u, n: acct.name, exp: Date.now() + 8 * 3600e3 });
      return send(res, 200, { ok: true, name: acct.name }, { 'Set-Cookie': `cist_sess=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${SECURE ? '; Secure' : ''}` });
    }
    if (url === '/api/logout' && req.method === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': 'cist_sess=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    if (url === '/api/me') return send(res, s ? 200 : 401, s ? { name: s.n, username: s.u, ai: AI_ON } : { error: 'Not signed in' });

    if (!s) return send(res, 401, { error: 'Please sign in.' });
    if (url === '/api/content' && req.method === 'GET') { const d = loadData(); return send(res, 200, { villages: d.villages.map(v => ({ id: v.id, name: v.name, district: v.district, focus: v.focus })), projects: d.projects, courses: d.courses.map((c, i) => ({ ...c, idx: i })), recent: recentAudit(8) }); }
    if (url === '/api/polish' && req.method === 'POST') {
      if (limited('pol' + s.u, 30, 3600e3)) return send(res, 429, { error: 'Hourly limit reached.' });
      const b = await readBody(req), type = b.type, notes = clean(b.notes, 1200);
      if (!LIMITS[type]) return send(res, 400, { error: 'Unknown type.' });
      if (notes.length < 15) return send(res, 400, { error: 'Write a few lines first (at least a sentence).' });
      const d = loadData(); let cur = {};
      if (type === 'project' && b.id) cur = d.projects.find(p => p.id === b.id) || {};
      if (type === 'village') cur = d.villages.find(v => v.id === b.id) || {};
      if (type === 'course' && b.id !== '' && b.id != null) cur = d.courses[+b.id] || {};
      if (type === 'village' && !cur.id) return send(res, 400, { error: 'Choose a village.' });
      return send(res, 200, await polish(type, cur, notes));
    }
    if (url === '/api/publish' && req.method === 'POST') {
      const b = await readBody(req), type = b.type, f = b.fields || {}, d = loadData();
      if (!LIMITS[type]) return send(res, 400, { error: 'Unknown type.' });
      const v = {}; for (const k of Object.keys(LIMITS[type])) { v[k] = clean(f[k], LIMITS[type][k]); if (!v[k]) return send(res, 400, { error: 'Field "' + k + '" is empty.' }); if (PII.test(v[k])) return send(res, 400, { error: 'Remove phone numbers or emails from "' + k + '".' }); }
      let label;
      if (type === 'village') { const t = d.villages.find(x => x.id === b.id); if (!t) return send(res, 400, { error: 'Unknown village.' }); t.focus = v.focus; label = t.name; }
      else if (type === 'project') {
        const vil = d.villages.find(x => x.id === b.villageId), fac = clean(f.faculty, 80), st = ['Deployed', 'In progress', 'Planned'].includes(f.status) ? f.status : 'Deployed';
        if (b.id) { const t = d.projects.find(x => x.id === b.id); if (!t) return send(res, 400, { error: 'Unknown project.' }); Object.assign(t, v, { faculty: fac, status: st }); if (vil) { t.village = vil.name; t.villageId = vil.id; } label = t.name; }
        else { if (!vil) return send(res, 400, { error: 'Choose a village.' }); const n = Math.max(0, ...d.projects.map(p => +String(p.id).replace(/\D/g, '') || 0)) + 1; d.projects.push({ id: 'p' + n, name: v.name, village: vil.name, villageId: vil.id, siteId: null, status: st, category: v.category, description: v.description, faculty: fac }); label = v.name + ' (new)'; }
      } else {
        const yr = Math.min(4, Math.max(1, +f.year || 1)), sem = f.sem === 'Sem II' ? 'Sem II' : 'Sem I';
        if (b.id !== '' && b.id != null) { const t = d.courses[+b.id]; if (!t) return send(res, 400, { error: 'Unknown course.' }); Object.assign(t, v); label = t.name; }
        else { d.courses.push({ year: yr, sem, name: v.name, text: v.text }); d.courses.sort((a, c) => a.year - c.year || a.sem.localeCompare(c.sem)); label = v.name + ' (new)'; }
      }
      saveData(d); audit(s.u, 'publish-' + type, label);
      return send(res, 200, { ok: true, label });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (e) { return send(res, 500, { error: e.message || 'Server error' }); }
}

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url.startsWith('/api/')) return api(req, res, url);
  let p = path.normalize(path.join(SITE, url === '/' ? 'index.html' : url));
  if (!p.startsWith(SITE + path.sep) && p !== SITE) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(p, (e, st) => {
    if (!e && st.isDirectory()) p = path.join(p, 'index.html');
    fs.readFile(p, (err, buf) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
      const h = { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
      if (/cist-data\.js$/.test(p)) h['Cache-Control'] = 'no-cache';
      res.writeHead(200, h); res.end(buf);
    });
  });
}).listen(PORT, () => console.log(`CIST site running at http://localhost:${PORT}  (AI ${KEY ? 'Claude' : GKEY ? 'Gemini' : 'NOT connected: set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY'})`));
