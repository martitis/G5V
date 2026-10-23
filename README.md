# G5V-newgen

The web panel for a CS2 tournament setup built on [MatchZy](https://shobhit-pathak.github.io/MatchZy/): create and run
matches, follow them live, and manage teams, servers, seasons, tournaments and PUG queues. It's the frontend of
[G5API](https://github.com/martitis/G5API), which talks to the game servers and stores everything.

It started as a fork of [PhlexPlexico/G5V](https://github.com/PhlexPlexico/G5V) (Vue 2, for Get5) and was renamed to
keep the two apart. It is now a rewrite in Vue 3.5, Vuetify 4, Vite, Pinia, vue-i18n and TypeScript.

## What's in it
- **Match list:** live matches first, with the current map and round score updating live. Finished matches show who
  won at a glance. There are filters and search, plus connect, copy-connect and GOTV buttons, open PUG queues and
  scheduled matches.
- **Match page:** live scoreboard per map, round history, kill feed, bomb and pause state, veto, team ready state
  before going live, a no-show warning, and demo downloads.
- **Server problems:** a banner when the game server stops answering or the match was interrupted (for example a
  restarted server). Admins get recovery actions: restore a round, load the match again, restart, end with a winner,
  or cancel.
- **Admins:** a match menu (pause, players, backups, change server, RCON, config preview); a control panel (MatchZy
  commands, live cvars, server health, connected players with kick); and an admin page with users and roles, servers,
  live matches and the audit log.
- **Create match:** pick teams or open a PUG queue; choose maps, veto and sides; apply presets or saved templates; run
  it now or schedule it.
- **Teams** (one editor, with bulk paste of Steam IDs), **servers** (practice mode, join passwords),
  **seasons**, **tournaments** (bracket, standings, live updates, optional Challonge link), **leaderboards**,
  **global search**.
- Light and dark themes; English, French and Japanese.

## Development
Requirements: Node 22.12+ and Yarn 1 (`npx yarn@1.22.22` works without installing it). Run a G5API next to it.

```sh
npx yarn@1.22.22 install
npx yarn@1.22.22 dev        # http://localhost:5173, also reachable from the LAN
```
The dev server proxies `/api` to G5API on `http://localhost:3301`, the same layout as production. To log in with
Steam, set G5API's `server.clientHome` to the panel's address.

| | |
| --- | --- |
| `yarn dev` | dev server with hot reload |
| `yarn build` | type-check (`vue-tsc`) and build to `dist/` |
| `yarn lint` | ESLint, no warnings allowed |
| `yarn format` / `format:check` | Prettier |
| `yarn i18n` | fails when a key used in the code is missing in English; lists untranslated fr/ja keys |

CI runs lint, the Prettier check, the i18n check and the build.

## Configuration
The panel reads `/config.json` at startup, so one build works for any deployment:
```json
{ "apiUrl": "/api", "title": "CS2 Panel" }
```
`apiUrl` is where G5API lives (same origin under `/api` is the default and the simplest). `title` is the name shown in
the top bar and the browser tab. Edit `config.json` in the deployed folder; no rebuild is needed.

## Production
Build once (`yarn build`) and serve `dist/` as static files, with every unknown path falling back to `index.html`.
Ready-made configs:
- **nginx:** [`default.conf`](default.conf) has cache headers, security headers and a commented `/api` proxy with the
  settings live updates need (`proxy_buffering off`, a long read timeout, a 2 GB body limit for demo uploads).
- **Caddy:** [`Caddyfile`](Caddyfile), the same with automatic HTTPS.
- **Docker:** `DockerfileLight` (nginx serving a `dist/` built beforehand), `DockerfileLightCaddy` (the same with
  Caddy), and `DockerfileFull` (builds inside the image).

G5API's [DEPLOY.md](https://github.com/martitis/G5API/blob/master/DEPLOY.md) covers the whole setup: API, database,
proxy and game server.

## Contributing
[CLAUDE.md](CLAUDE.md) describes the code (API layer, stores, live streams, translations) and its conventions. The
roadmap lives in G5API's
[IMPROVEMENT_PLAN.md](https://github.com/martitis/G5API/blob/master/IMPROVEMENT_PLAN.md). New text goes into
`src/translations/translations.json` in all three languages.

## License
[MIT](LICENSE). The original G5V is © 2019 PhlexPlexico; the license must be kept with the software.
