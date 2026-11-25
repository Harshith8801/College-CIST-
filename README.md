# CIST website v2

Your original site is unchanged (same design, same files). Added:
- `site/faculty.html`: faculty login + AI-assisted editor
- `site/assets/cist-chat.js`: small chatbot on the home page (one `<script>` line added at the end of `site/index.html`; it also adds a small "Faculty login" link in the footer)
- `server/`: tiny Node server (no packages to install)

## Run
    node server/server.js           # opens at http://localhost:3000
    # with AI turned on:
    ANTHROPIC_API_KEY=sk-ant-... node server/server.js

Needs Node 18 or newer. Free AI: get a key at aistudio.google.com and start with GEMINI_API_KEY=... (model via GEMINI_MODEL if the default is retired). Or use ANTHROPIC_API_KEY. With no key the chatbot answers from site data and the editor does a basic tidy-up.

## Faculty accounts
    node server/add-faculty.js ramesh "Dr. Ramesh Kumar" "a-strong-password"
Leave the password out to get a random one. Running it again for the same username resets the password.

## How faculty update the site
Sign in at /faculty.html, choose Projects / Villages / Courses, pick an item (or add a new project or course), write 3-4 lines, press **Polish with AI**, check the result, press **Publish**. Publishing rewrites `site/assets/cist-data.js` (the file the site already reads) and saves a backup of the previous version in `server/data/backups/`. Every change is logged in `server/data/audit.log`.

## Safety built in
- AI may only use facts in the faculty member's notes; it must not invent facts, add phone/email or villager names.
- Server rejects phone numbers/emails; faculty must approve before anything is published.
- Passwords are hashed (scrypt), login is rate-limited, sessions expire after 8 hours.
- Only `site/` is served; `server/` is never reachable from the browser.

## Notes
- Headline numbers on the home page ("15 villages", "12 projects") are written in the page itself, so adding a new project updates the project list but not those counters.
- Village survey data (`villages-data.js`) is not editable from the portal on purpose; it stays under your accuracy checks.
- For a real launch: host with HTTPS and set `COOKIE_SECURE=1`. Model names can be changed with `CLAUDE_POLISH_MODEL` and `CLAUDE_CHAT_MODEL`.
