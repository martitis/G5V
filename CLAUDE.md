# G5V: frontend for a CS2 tournament panel (MatchZy)

Vue web panel for G5API (`../G5API`): matches, live scoreboard, teams, servers, seasons, leaderboards.
It started as a fork of PhlexPlexico/G5V and now **diverges freely** from upstream.
Roadmap and progress: [../G5API/IMPROVEMENT_PLAN.md](../G5API/IMPROVEMENT_PLAN.md) (shared by both repos).
Backend facts (API, MatchZy integration) are in [../G5API/CLAUDE.md](../G5API/CLAUDE.md).

## Stack (current)
- Vue 2.7, Vuetify 2.6, Vue CLI 5 (webpack), vue-router 3 (history mode), vue-i18n 8, axios 0.26, vue-sse
- Vuex is installed but the store is empty (`src/store/index.js`)
- **Planned:** migrate to Vue 3, Vuetify 3, Vite, Pinia, TypeScript and vue-i18n 9 (plan Phase 4). Until then, keep
  fixes minimal and Vue-2 compatible. Update this file when the migration lands.

## Commands
Yarn 1 (`npx yarn@1.22.22 <cmd>` if not installed). `.yarnrc` disables the engines check because Vue CLI's
`@achrinza/node-ipc` declares Node ≤19 but works on Node 20+. Delete `.yarnrc` after the Vite migration.
- `yarn serve`: dev server. `vue.config.js` proxies `/api` → `http://localhost:3301` (prefix stripped).
- `yarn build`: production build to `dist/`.
- `yarn lint`: ESLint (vue plugin + prettier). **Plain `yarn lint` autofixes files**; use `yarn lint --no-fix` to only
  check. CI runs `--no-fix --max-warnings <current count>` (`.github/workflows/ci.yml`). Lower the cap as warnings get fixed.
- API base URL: build-time env `VUE_APP_G5V_API_URL`, defaulting to `/api`.
- Deployment: bare static `dist/` behind nginx/Caddy (`default.conf`, `Caddyfile` are examples) with an SPA fallback.

## Layout
- `src/main.js`: registers `src/utils/api.vue` as a **global mixin** (every component gets all the API methods), plus
  i18n and VueSSE.
- `src/utils/api.vue`: every API call. Convention: success returns data or `{message, response}`; failure returns
  `error.response.data.message` (a **string**), so callers check `typeof res == "string"`. Catch blocks must not assume
  `error.response` exists (network/CORS errors have none).
- `src/views/`: route pages (Home, Matches, Match, CreateMatch, Teams/Team, Seasons/Season, Servers, User,
  Leaderboards, Metrics). `src/router/index.js` has no auth guards; the backend enforces access.
- `src/components/`, the key ones:
  - `MatchesTable` (match list)
  - `MatchInfo` + `PlayerStatTable` + `VetoTable` (match page, live over SSE)
  - `MatchAdminButton` (pause, backups, add player, rcon, …)
  - `NewMatchForm` (3-step create wizard)
  - `TeamTable`, `ServersTable`/`ServerDialog`, `SeasonsTable`
- `src/translations/translations.json`: en / fr / jp. **Add every new key to all three.** No fallbackLocale is set,
  so a missing key renders raw.

## Pitfalls
- User state comes from `IsLoggedIn()`, and "logged out" means `user.id == null` (some code wrongly uses `-1`).
- Don't use `forEach(async …)`: it doesn't wait. Use `Promise.all` / `for…of` with await.
- Components that open SSE must set `sse: { cleanup: true }` or close the streams in `beforeDestroy`. `App.vue`
  remounts views on every path change.
- Vuetify switches: bind numeric values with `:true-value="1" :false-value="0"`.
- Never render secrets (RCON passwords, other users' API keys) into the DOM.
- Style: 2-space indent, double quotes, `$t()` for all user-visible text.
