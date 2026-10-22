# G5V: frontend for a CS2 tournament panel (MatchZy)

Vue web panel for G5API (`../G5API`): matches, live scoreboard, teams, servers, seasons, leaderboards.
It started as a fork of PhlexPlexico/G5V and now **diverges freely** from upstream.
Roadmap and progress: [../G5API/IMPROVEMENT_PLAN.md](../G5API/IMPROVEMENT_PLAN.md) (shared by both repos).
Backend facts (API, MatchZy integration) are in [../G5API/CLAUDE.md](../G5API/CLAUDE.md).

## Stack
- Vite 8, Vue 3.5 (`<script setup lang="ts">`), Vuetify 4, vue-router 5, Pinia 4, vue-i18n 11, axios 1, TypeScript strict
- Dependencies are pinned to exact versions that were at least two weeks old when added (`package.json`
  `resolutions` pins transitive ones). Keep it that way when adding packages.
- Vuetify 4 differs from 3: MD3 typography classes (`text-headline-small`, `text-body-medium`, …), `v-row` has no
  `align`/`justify` props (use `class="align-center"`), buttons aren't uppercase, the theme is set explicitly.

## Commands
Yarn 1 (`npx yarn@1.22.22 <cmd>` if not installed).
- `yarn dev`: dev server on :5173 (also on the LAN). `vite.config.ts` proxies `/api` → `http://localhost:3301`.
- `yarn build`: `vue-tsc --noEmit` then `vite build` to `dist/`. `yarn typecheck` runs only vue-tsc.
- `yarn lint` (ESLint flat config, 0 warnings allowed), `yarn format` / `yarn format:check` (Prettier),
  `yarn i18n` (fails when a literal `$t()`/`t()` key is missing in English). CI runs all four plus the build.
- Deployment: static `dist/` behind nginx or Caddy (`default.conf` and `Caddyfile` have SPA fallback, cache and
  security headers, and a commented `/api` proxy with SSE settings). Docker: `DockerfileFull` builds and serves.

## Runtime config
`public/config.json` (`{"apiUrl": "/api", "title": "CS2 Panel"}`) is fetched at startup (`src/config.ts`), so one
build works anywhere;
`VITE_API_URL` is only a fallback. Build API URLs with `apiUrl("/path")`.

## Layout
- `src/api/http.ts`: one axios instance. Requests throw `ApiError` (`status`, `data`, message from the API);
  `orEmpty()` turns the API's "404 = empty list" into an empty result.
- `src/api/index.ts`: typed modules (`auth`, `users`, `maps`, `teams`, `matches`, `servers`, `seasons`, `stats`,
  `vetoes`, `leaderboard`). The API expects bodies wrapped in an array (`[body]`); the modules do that.
- `src/api/types.ts`: response types. `src/stores/auth.ts` (user, `isAdmin`, `isSuperAdmin`, `canEdit(ownerId)`;
  `load()` asks `/isloggedin` once), `src/stores/ui.ts` (`notify`, `notifyError` snackbar).
- `src/composables/useEventSource.ts`: SSE that closes on unmount. Call it in `setup`, never after an `await`;
  mount a component only while the stream is needed (see `components/match/MatchStreams.vue`).
- `src/router.ts`: `meta.requiresAuth` / `requiresAdmin` / `requiresSuperAdmin`. The old "My …" URLs redirect to the
  lists with `?mine=1`; lists use `composables/useOnlyMine.ts` ("Only mine" toggle, remembered per browser).
- Sidebar (`AppNavbar.vue`): one entry per area, grouped Play / Manage / Stats; create/add actions live on the
  lists, not in the sidebar. `GlobalSearch.vue` in the app bar uses `GET /search`.
- `src/views/`: one page per route. `src/components/match/`: match page parts (header, scoreboards, vetoes, admin
  menu, live stream). Shared: `MatchesTable`, `TeamLogo` (png → svg fallback), `CvarEditor`, `ServerDialog`,
  `SeasonDialog`, `TeamInfoForm`, `UserMapList`.
- `src/utils/format.ts` (flags, map images, ratings, dates), `matchStatus.ts`, `seasonDefaults.ts` (season match
  defaults are season cvars with reserved names; shared by the season dialog and create match), `image.ts` (logos).
- `src/translations/translations.json`: `en`, `fr`, `ja`. Add every new key to all three; `en` is the fallback.

## Conventions
- Every async handler: loading flag, `try/catch` → `ui.notifyError(error)`, guard against double submit.
- Forms validate client-side with the same rules as the API (SteamID, cvar names/values, map names), and keep their
  input when the API rejects it.
- Never put secrets into the DOM unless the user asked to reveal them (RCON password, own API key).
- Admin actions and logout are POST; the backend refuses GET (CSRF).
- Style: Prettier (2 spaces, double quotes, 100 columns), `$t()` for all user-visible text.
