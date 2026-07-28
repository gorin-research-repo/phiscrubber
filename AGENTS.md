# AGENTS.md

## Cursor Cloud specific instructions

PHI Scrubber is a fully client-side, offline web app (no backend, database, build step, or npm dependencies). Standard commands are in `README.md` and `package.json`.

- Run the app: `npm start` (serves the static files with `python3 -m http.server 8080`, so Python 3 must be present). Open http://localhost:8080 — it redirects to the self-contained `phi-scrubber.html`.
- Run tests: `npm test` (uses Node's built-in runner, `node --test`; no install needed).
- There are no dependencies to install; `npm install` is a no-op.
- `index.html`/`phi-scrubber.html` is a single self-contained page (inline CSS + JS). The modular browser version in `src/app.js` + `src/detector.js` is what the tests exercise and is served over HTTP; it will not load from a `file://` path because ES modules are blocked there — always use the dev server.
- `service-worker.js` caches the app under `CACHE_NAME` (`phi-scrubber-v1`) for offline use. After editing files you may see stale content; hard-reload, clear site data for the origin, or bump `CACHE_NAME` to pick up changes.
