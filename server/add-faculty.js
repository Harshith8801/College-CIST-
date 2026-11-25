'use strict';
/* Usage: node server/add-faculty.js <username> "<Full Name>" [password]
   If no password is given, a random one is generated and printed once. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [u, name, pw0] = process.argv.slice(2);
if (!u || !name) { console.log('Usage: node server/add-faculty.js <username> "<Full Name>" [password]'); process.exit(1); }
const f = path.join(__dirname, 'data', 'faculty.json'); fs.mkdirSync(path.dirname(f), { recursive: true });
let list = []; try { list = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { }
const pw = pw0 || crypto.randomBytes(6).toString('base64url');
if (pw.length < 8) { console.log('Password must be at least 8 characters.'); process.exit(1); }
const salt = crypto.randomBytes(16).toString('hex'), hash = crypto.scryptSync(pw, salt, 64).toString('hex');
list = list.filter(x => x.username !== u.toLowerCase()); list.push({ username: u.toLowerCase(), name, salt, hash });
fs.writeFileSync(f, JSON.stringify(list, null, 1), { mode: 0o600 });
console.log(`Saved faculty account "${u.toLowerCase()}" (${name}).` + (pw0 ? '' : `\nPassword (shown once): ${pw}`));
