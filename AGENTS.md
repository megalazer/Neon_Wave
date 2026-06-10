# Repository Guidelines

## Project Overview
**Neon Terminus** is a cyberpunk emergent life-sim for mobile (React Native + Expo) — "BitLife meets Shadowrun." The player advances turns via an `ADVANCE_CYCLE` action; each turn emits procedural narration and weighted random events. Death occurs only on combat defeat; achievements persist across runs.

Authoritative references (read before structural changes):
- `docs/ARCHITECTURE.md` — file tree, store slices, turn pipeline, combat, persistence.
- `docs/DESIGN.md` — visual system and component conventions (non-negotiable).
- `docs/designs/*.html` — Stitch exports; visual source of truth for each screen.
- `ANALYSIS.md` — deep technical walkthrough of every subsystem.
- `CLAUDE.md` — project rules and gameplay constants.
- `docs/WORLD_LORE.md` — narrative tone, factions, fixers.

## Architecture & Data Flow
- **No navigation library.** `App.js` is a 5-state guard machine: fonts-loading → `gameOver` → init flow (3 steps) → `battleActive` → main game. The active tab (`neural`/`haven`/`cyber`/`jobs`/`lifestyle`) is a `useState`. Shell chrome (`TopBanner`, `BottomNav`) and overlays (`ChoiceModal`, `LevelUpBanner`, `AchievementToast`) plus CRT layers (`CRTBackground`/`NoiseTexture`/`ScanlineOverlay`) are always mounted.
- **State** lives in one Zustand store (`src/store/index.js`) composed of 13 immer slices. All mutations are immer drafts: `set(s => { s.slice.field = ... })`. Components read via **narrow selectors**, never the whole store.
- **Turn loop** is the heartbeat: `advanceTurn()` in `src/engine/turnPipeline.js` runs a fixed sequence — `incrementTurn → tickTurn → tickPrices → tickFeed → tickVendor → trySpawnRecruit → tickAvailableOperatives → achievement checks → selectAndFireRandomEvent → crew banter` — then falls back to ambient narration.
- **Content** is fully data-driven: every game object (events, contracts, cyberware, factions, enemies, …) is a plain JS value in `src/data/`. Engine and UI read data; they never hardcode content.
- **Persistence**: account + lifetime achievement data is saved to AsyncStorage under `neon_terminus_account_achievements` and reloaded at boot. Per-run character/crew/world state is in-memory and wiped on death.

## Key Directories
- `src/store/slices/` — 13 Zustand slices: `character`, `crew`, `world`, `log`, `event`, `contract`, `vendor`, `exchange`, `faction`, `achievement`, `legacy` (stub), `dev`, `testCombat`.
- `src/engine/` — pure-ish game logic: `turnPipeline.js`, `recruitGenerator.js`, `encounterGenerator.js`, `enemyTurn.js`, `crewInteractionEngine.js`.
- `src/data/` — all game content; grouped `events/{flavor,choices}.js`, `contracts/{low,mid,high,faction}.js`, plus flat content files (`cyberware.js`, `factions.js`, `achievements.js`, `leveling.js`, …).
- `src/screens/` — one screen per tab + `init/` flow + `BattleScreen`, `GameOverScreen`, `DevPanel`.
- `src/components/` — UI split by area: `shell/`, `overlays/`, `battle/`, `cyber/`, `recruit/`, `init/`.
- `src/theme/` — `colors.js` (tokens + glow presets), `fonts.js` (Kode Mono loading + typography presets).
- `docs/` — architecture/design/lore; `docs/designs/` holds the Stitch HTML references.
- `scripts/` — `sim_balance.mjs` balance simulator.

## Development Commands
Package manager is **npm** (only `package-lock.json` is committed).
- `npm install` — install dependencies.
- `npm start` — start the Expo dev server (Metro).
- `npm run android` / `npm run ios` / `npm run web` — launch on a target platform.
- `node scripts/sim_balance.mjs` — run the Monte-Carlo combat balance simulation (imports real `src/engine` + `src/data` formulas; prints a table of win%, rounds, hp-lost% across origins/levels/tiers).

There is **no build/test/lint command** — see Testing & QA.

## Code Conventions & Common Patterns
- **Components**: functional only (no classes); hooks at the top; keep components small (~150 lines, split when larger). Sub-components may be defined inline above the default export.
- **Styling**: use `StyleSheet.create` (large screens split into multiple named style blocks). Do **not** use NativeWind `className` in app code even though NativeWind is build-wired — DESIGN.md mandates `StyleSheet`. Pull colors from `src/theme/colors.js`; never inline raw hex. Inline styles only for dynamic values.
- **Visual rules** (non-negotiable, see `docs/DESIGN.md`): Kode Mono on every text node; sharp corners (`borderRadius: 0`) except avatars/pills; `UPPERCASE_SNAKE` labels with letter-spacing; CRT scanline/noise overlays on every screen; mechanical animations (linear/ease via `react-native-reanimated`, never spring).
- **State / store**: each slice is a factory `export const createXSlice = (set, get) => ({ namespace: {...}, action: () => set(state => { /* mutate draft */ }) })`. Namespace state under one key; co-locate actions. Cross-slice writes go through shared helpers (e.g. `applyRepToDraft`) inside `set`. Subscribe with narrow selectors: `useStore(s => s.crew.members)`.
- **Engine purity**: generators (`generateRecruit`, `generateEncounter`, `planEnemyTurn`) are pure — state in, value out, no store access. `advanceTurn()` is the impure orchestrator. `tryFireCrewInteraction(state)` mutates the immer draft it is handed.
- **Content/data naming**: ids use snake_case type prefixes (`flv_`, `chc_`, `con_`, `cyb_`, `qh_`, `fac_`, `acc_`, `op_`, `act_`); display labels are `UPPERCASE_SNAKE`; stat keys are lowercase. Each content type shares schema fields (`id`, `weight`, `effects`/`outcome`, stat checks) and a lookup helper (`getContract`, `getFaction`, `pickNarration`).
- **Async / errors**: AsyncStorage access is wrapped in try/catch with silent fallback; side-effects (persistence, achievement saves) run after the immer `set` completes, outside the draft.
- **Icons & feedback**: MaterialIcons from `@expo/vector-icons`; `expo-haptics` on meaningful taps.
- **Formatting**: 2-space indent, semicolons, single quotes. Comments explain *why*, not *what*. There is no autoformatter — match surrounding style.

## Important Files
- `App.js` — root state machine, tab routing, global overlay/shell mounting.
- `src/store/index.js` — store composition (`create(immer(...))`, `enableMapSet()`, 13 slices).
- `src/engine/turnPipeline.js` — `advanceTurn()` turn heartbeat.
- `src/data/` — all game content (data-driven; no content in engine/UI).
- `src/theme/colors.js`, `src/theme/fonts.js` — design tokens and font loading.
- `babel.config.js` — `babel-preset-expo` (jsxImportSource `nativewind`) → `nativewind/babel`; `react-native-reanimated/plugin` (order matters).
- `metro.config.js` — `withNativeWind(..., { input: './global.css' })`.
- `tailwind.config.js` / `global.css` — NativeWind/Tailwind setup (cyberpunk palette, sharp corners, Kode Mono).
- `app.json` — Expo app config (name "Neon Terminus", portrait, dark UI, `expo-font` plugin).

## Runtime / Tooling Preferences
- **Runtime**: Expo SDK ~54 / React Native 0.81.5 / React 19.1.0. Run through the Expo CLI / Metro bundler.
- **Package manager**: **npm** — do not introduce yarn/pnpm lockfiles.
- **State**: Zustand 5 + `zustand/middleware/immer`; `enableMapSet()` must be called before store creation (flags use `Set`). Do not add persist/devtools middleware to the main store.
- **No TypeScript** — the codebase is plain JS (`.js`/`.mjs`).
- **Do not** add a navigation library, render Stitch HTML directly, or implement an LLM narrator (use placeholder narration). Leave unbuilt subsystems as stubs (e.g. `legacySlice`).

## Testing & QA
- **No automated test suite exists** (no jest, no `*.test.js`/`*.spec.js`/`__tests__`, no test npm script) and **no ESLint/Prettier config**.
- Primary QA tool is `node scripts/sim_balance.mjs` for combat-balance sanity (win-rate / rounds / hp-loss tables).
- Manual verification path: run `npm start` and exercise the affected screen/flow in Expo (web is fastest: `npm run web`).
- When adding logic worth testing, prefer extending the simulation harness or adding small pure-function checks against `src/engine`/`src/data`, since those modules are dependency-free and Node-runnable.
