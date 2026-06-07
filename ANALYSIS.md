# Neon Terminus — Technical Analysis

A complete, code-grounded reference for how this app is built and how it runs.
Pair this with `docs/DESIGN.md` (visual + code style guide) before writing code.

> The folder is `Neon_Wave/`; the package, app, and game are all named **neon-terminus**
> (`package.json` name `neon-terminus`, `app.json` name "Neon Terminus").

---

## 1. What it is

A cyberpunk turn-based roguelite for **iOS/Android**, built with **React Native 0.83 + Expo SDK 55**.
You create a single mercenary, then tap **`ADVANCE_CYCLE`** to push time forward one turn at a
time. Between turns you manage a crew, buy and install cyberware, run multi-stage contracts that can
drop into tactical dice-combat, trade crypto, and buy lifestyle assets. Death is permanent for the
*run*, but an **account layer** (titles, perks, lifetime stats) persists across runs via AsyncStorage.

The mood: a CRT terminal — scanlines, neon glow, Kode Mono monospace, `UPPERCASE_SNAKE` labels.

---

## 2. Orientation — file map

```
App.js                      state-machine shell: fonts → game-over → init → battle → main
global.css / tailwind…      NativeWind setup (sharp corners, neon palette)
src/
  theme/      colors.js (hex tokens + glow presets), fonts.js (Kode Mono + label styles)
  store/      index.js (13 slices, immer) + slices/*
  engine/     turnPipeline.js (the heartbeat), recruitGenerator.js
  data/       all game content as plain JS (no content hardcoded in logic)
  screens/    LogScreen, Haven, Cyber, Jobs, Lifestyle, Battle, GameOver, DevPanel, init/*
  components/ shell (CRT/banner/nav), overlays (ChoiceModal…), battle/ cyber/ recruit/ init/
docs/         ARCHITECTURE.md (stale skeleton), DESIGN.md (style guide), designs/*.html (Stitch mocks)
CLAUDE.md     agent instructions (partly stale — see §13)
```

---

## 3. Boot & navigation (`App.js`)

There is **no navigation library**. `App.js` is a single component that renders exactly one of five
states, evaluated top-down (first match wins):

1. **Fonts not loaded** → blank dark loading view (`useFonts(fontMap)`).
2. **`world.gameOver`** → `GameOverScreen` (death recap + restart).
3. **Init flow** — triggered when no crew member has `isPlayer` (`!crew.members.some(m => m.isPlayer)`).
   A local `initStep` (1→2→3) walks `PathScreen → IdentityScreen → FinalizeScreen`, accumulating a
   local `initDraft` (`{ path, gender, name, starterCyberware }`). `Finalize` calls
   `initCharacter(draft)`, which builds the player as `crew.members[0]` and exits init.
4. **`battleActive`** → `BattleScreen` takeover. Set when a contract stage triggers combat
   (`contract.phase === 'combat'` → a `useEffect` runs `startTestBattle()` and flips `battleActive`),
   or directly from the Jobs "TEST_BATTLE" activity.
5. **Main game** → `ActiveScreen(activeTab)` (a `switch` over `neural|haven|cyber|jobs|lifestyle`)
   plus the persistent chrome: `TopBanner`, `BottomNav`, overlays (`ChoiceModal`, `LevelUpBanner`,
   `AchievementToast`), the CRT layers (`CRTBackground`, `NoiseTexture`, `ScanlineOverlay`), and `DevPanel`.

`activeTab` is plain `useState` (default `'neural'`). On mount `App` runs
`initializeOperatives()`, `initDevMode()`, `initAchievements()`.

---

## 4. The turn loop — the heartbeat

The only player action that advances time is the **`ADVANCE_CYCLE`** FAB on `LogScreen`, which calls
`advanceTurn()` (`src/engine/turnPipeline.js`). It invokes store actions in this fixed order:

```
incrementTurn        character.turnNumber += 1
tickTurn             world.turnNumber += 1        (two counters; UI reads character.turnNumber)
tickPrices           exchange: snapshot portfolio, drift every coin price
tickFeed             contract: age feed items, refresh feed if empty/expired (only while phase 'feed')
tickVendor           vendor: countdown; rebuild rotating stock when it hits 0
trySpawnRecruit      crew: maybe add a generated recruit (gated, see §6)
tickAvailableOperatives  crew: expire generated recruits past their TTL
— achievement polling —  incrementLifetime('totalTurnsSurvived'); recordMaxTeamLevel(); checkMilestones()
selectAndFireRandomEvent  ONLY if not blocked (no combat / active contract / pending choice)
fallback narration   if nothing fired, push one PLACEHOLDER_LINES entry
```

`devAdvanceTurns(n)` repeats the same body `n` times (without the fallback line), then logs a
`[DEV]` summary.

Two other places quietly advance the turn counter: `dismissResolution` (finishing a contract debrief
bumps `character.turnNumber += 1`) and `executeActivity` flows on Jobs call `advanceTurn()` directly.

---

## 5. State architecture — 13 Zustand slices

Created in `src/store/index.js` with the **immer** middleware (`enableMapSet()` is called because
`world.flags` and `event.firedEventIds` are `Set`s). Every slice is `(set, get) => ({ state, …actions })`.

| Slice | State it owns | Notable actions |
|-------|---------------|------------------|
| `character` | name, gender, path, credits, district, `turnNumber`, renown(+label), morale, asset id arrays | `initCharacter`, `incrementTurn`, `purchaseAsset` |
| `crew` | `members[]`, `availableOperatives[]`, `turnsSinceLastSpawn`, `spawnEnabled` | `recruitOperative`, `trySpawnRecruit`, `equip/unequipCyberware`, `purchaseRecharge`, `dismissMember` |
| `world` | `flags:Set`, `turnNumber`, `pendingLevelUp`, `gameOver`, `gameOverReason` | `tickTurn`, `triggerGameOver`, level-up banner |
| `log` | `entries[]` | `addEntry` |
| `event` | cooldown counters, `activeChoiceEventId`, `pendingChoiceOutcome`, `firedEventIds:Set` | `selectAndFireRandomEvent`, `resolveChoiceEvent`, dev forces |
| `contract` | feed, `phase`, active contract id/stage, `stageResults`, `resolution`, `pendingCombatResult`, fixerRep, history | `refreshContractFeed`, `acceptContract`, `resolveStageChoice`, `handleCombatResolution`, `dismissResolution` |
| `vendor` | `rotatingStock`, `refreshCountdown`, `purchasedThisRotation`, `quickhackModules` | `refreshVendorStock`, `tickVendor`, `purchaseCyberware`, `purchase/installQuickhackModule` |
| `exchange` | `coins{}`, `holdings{}`, `portfolioValueAtTurnStart`, `marketEvents` | `tickPrices`, `buyCoin`, `sellCoin` |
| `faction` | `rep{factionId:number}` | `adjustFactionRep`, `getRepTier`, `resetFactionRep` |
| `achievement` | `account{unlocked,selectedTitle,selectedTheme}`, `lifetime{…counters}`, `run{unlocked}`, `unseen`, `toastQueue` | `initAchievements`, `unlockAchievement`, `triggerAchievement`, `checkMilestones`, `incrementLifetime`, `recordPlayerDeath` |
| `legacy` | `runs`, `highestTurn`, `unlockedFlags` | **stub** — see §12 |
| `dev` | `enabled`, `panelOpen`, tap tracking | 7-tap unlock, ~40 debug actions |
| `testCombat` | `combat{…}` full battle model | see §6.7 |

Components subscribe with **narrow selectors** (`useStore(s => s.log.entries)`), never the whole store.
Cross-slice writes happen freely inside one immer `set` (e.g. `eventSlice` mutates `character.credits`
and `world.flags`; `contractSlice` mutates `faction.rep` via the shared `applyRepToDraft` helper).

---

## 6. Subsystems in detail

### 6.1 Character creation & stats
- **3 origins** (`data/origins.js`): `corpo`, `street_kid`, `nomad`. Each gives stat modifiers + starting
  credits + opening narration. (Note: 3 origins, but **6 stats** — `chrome, edge, ghost, face, grit, wire`,
  base 10 each.) `deriveStats(path)` = base + origin mods.
- `initCharacter(draft)` builds the player as `crew.members[0]` (`id:'player'`, `isPlayer:true`,
  class mapped `corpo→FIXER / street_kid→STREET_SAMURAI / nomad→GHOST`, level 1, vitals/neural 100,
  humanity `80 − starterHumanityCost`, `maxCyberwareSlots:3`, starter cyberware equipped), seeds the
  opening log line, and applies account perks.

### 6.2 Crew & recruits
- **Member shape**: `{ id, name, class, faction, quality?, cost, exp, level, vitals{current,max},
  neural{current,max}, humanity{current,max}, stats{6}, equippedCyberware[], maxCyberwareSlots,
  quickhacks?, isPlayer? }`. **Crew cap = 4.**
- **Seed pool**: 5 hand-authored `OPERATIVES` (`data/operatives.js`) load at boot.
- **Procedural spawns** (`trySpawnRecruit`): min gap 6 turns, then chance `min(0.7, 0.2 + (gap−6)*0.1)`,
  capped at 5 pending generated recruits. Generated recruits expire `currentTurn + 15`.
- **Quality** (`data/recruitQuality.js`): `common / rare / legendary`, each defining stat/vitals/neural
  ranges, cost, starting cyberware loadouts, slots, and arrival narration. Spawn weights scale with
  lifetime `contractsCompleted` (e.g. 0 contracts → 90/10/0; 20+ → 25/50/25). `recruitGenerator.js`
  shapes stats by class role (primary/secondary/dump) and nudges faction by class affinity + player rep.
- `recruitOperative` charges `cost`, moves the operative into `members`; legendary hire fires
  `acc_legendary_recruit` + `legendaryRecruits++`. `purchaseRecharge` spends credits to restore
  vitals/neural (`data/rechargeItems.js`, 4 consumables). `dismissMember` removes a member.

### 6.3 Cyberware & quickhacks
- **Cyberware** (`data/cyberware.js`): 7 slot types (`neural, optic, os, arms, internal, chip,
  subdermal`); ~11 blueprints (8 advanced + 3 starter). Each: `{ slot, humanityCost, bonuses,
  cost, vendorCategory, vendorTier }`. `equipCyberware` enforces humanity cost, swaps a same-slot item
  back to inventory, and respects `maxCyberwareSlots`; `unequipCyberware` refunds humanity.
- **Quickhacks** (`data/quickhacks.js`): 6, keyed `low/mid/high` install tiers and `basic/intermediate/elite`
  vendor tiers. Netrunner recruits get a generated quickhack loadout.

### 6.4 Leveling (`data/leveling.js`)
- `MAX_LEVEL = 10`; `XP_THRESHOLDS = [0,100,250,450,700,1050,1500,2100,2900,4000]` (cumulative).
- `applyXPToCrewMember` raises level, grants **+1 to a random stat per level gained** (capped 20),
  logs a `LEVEL_UP` line, and arms `world.pendingLevelUp` (first level-up per tick wins → `LevelUpBanner`).
- `calculateTeamLevel` = floor(mean level of living members). `distributeCombatXP` splits XP equally
  among living members (the player counts as a member).

### 6.5 Events (`data/events/`, `eventSlice`)
- **42 flavor events** + **19 choice events**. Pacing constants (`data/eventPacing.js`):
  `EVENT_COOLDOWN=4`, `FLAVOR_MIN_GAP=3`, `FLAVOR_MAX_GAP=7`, `FLAVOR_CHANCE=0.4`.
- Each turn `selectAndFireRandomEvent`: after the choice cooldown, choice chance escalates
  `min(0.85, (turnsSinceChoice−4)*0.2)`; otherwise a flavor event fires at 40% inside its window,
  forced past turn 7. Selection is **weighted** (`weight`) and biased by faction standing.
- **Flavor**: `{ weight, narration, effects, accent, faction? }` → applies effects, pushes an ambient log line.
- **Choice**: `{ weight, triggers{minTurn,requiredFlags,excludeFlags,faction,repAtLeast}, title, prompt,
  choices[] }`. A choice is either a flat `outcome` or a `statCheck{stat,threshold}` with `pass`/`fail`
  branches (roll = stat + `rand(0..5)`). Resolved via `resolveChoiceEvent` → effects applied + brief
  outcome shown. Effects keys: `credits, morale, addFlags, factionDelta`.

### 6.6 Contracts (`data/contracts/`, `contractSlice`)
- **19 contracts**: `low` 4, `mid` 4, `high` 3, `faction` 8. Shape: `{ tier, teamLevelRequired,
  fixerId, name, faction, factionRepReward/Penalty, minFactionRep?, payout, deposit, exp,
  stages[], success/failure/abortNarration }`. A stage: `{ label, title, prompt, choices[] }`; a
  choice mirrors choice-events (`statCheck` or flat), and its branch is one of
  `advance | complete | fail | triggersBattle` (battle branches carry `onVictory/onDefeat/encounterId`).
- **Lifecycle (`phase`)**: `feed → active → (combat) → resolving → feed`.
  - *feed* — `_pickFeedContracts` keeps ≤3, tier-diverse, gated by player level (and `minFactionRep`).
  - *active* — `resolveStageChoice`; `triggersBattle` stores `pendingCombatResult` and sets `phase:'combat'`.
  - *resolving* — `_setResolution` computes payout: success = `round(payout*(1+modifier))`,
    failure = `floor(payout/4)`, abort = 0. Stage pass threshold = `ceil(stages/2)`.
  - `dismissResolution` applies credits + XP, records completion, bumps fixer rep, applies faction rep
    (±, with rivalry bleed), advances the turn, and fires achievement hooks (`contractsCompleted`,
    `totalCreditsEarned`, `run_pacifist` if no combat).
- **Fixers** (`data/fixers.js`): 5 (`remi, pyre, nyx, kade, dusk`) — cosmetic rep + accent color.

### 6.7 Combat (`testCombatSlice`, `BattleScreen`)
A dice-driven, round-based tactical layer. State lives under `combat`.
- **Setup** (`startTestBattle`): friendly = living crew snapshotted with `hp`. Hostile is resolved by
  `engine/encounterGenerator.js`: if the stage carries an explicit `encounterId` it builds + scales that
  named/boss encounter (`data/encounters.js`, e.g. `enc_cyberpsycho`), otherwise it **generates** a
  faction- and tier-appropriate group from the active contract's `faction`+`tier` and the party level.
  Every unit is run through `scaleEnemy` (level-interpolated HP + damage). Enemies are faction-tagged
  (`data/enemies.js`, 21 templates across `low/medium/high/boss` bands).
  **Cyber pool** = `min(10, floor(totalTeamNeural / 40))`, regenerating +1/round (capped at the fight's max).
- **Round phases**: `roll → targeting → executing → enemy_turn → endRound`.
  - Each living friendly has a **d10**; reroll up to **2×** per round. Assign a die to an enemy → its
    value is the attack damage. Cyber **abilities** (`data/cyberAbilities.js`, one per class) queue
    against the pool: single-target/AoE damage, squad heal, or squad buff (e.g. Ghost = 50% damage
    reduction one round). Quickhacks similarly draw on the pool.
  - `confirmAllAttacks` attributes ability/quickhack pool cost to the responsible member, snapshots
    HP previews; `BattleScreen` drains `pendingAttacks` one-by-one (`applyPendingAttack`, haptics + delays).
  - **Enemy turn** (`engine/enemyTurn.js` `planEnemyTurn`): each living enemy expands its `move` into one
    or more id'd hit assignments by type — `basic` (random), `focus` (lowest-HP), `priority` (the player,
    but only one attacker may pile on per turn), `aoe` (one hit per friendly), `ramp` (+damage each round),
    `telegraph` (×2 every 3rd round). `applyEnemyHit(assignmentId)` applies each, reduced by active
    `damage_reduction` buffs (min 1). A `block` trait rolls a per-round shield that absorbs one incoming
    player attack (rolled at battle start / re-rolled in `endRound`). Player vitals → 0 sets
    `world.gameOver = 'FLATLINE'` + defeat.
  - `endRound` ages buffs, regens pool, re-rolls block shields, resets dice/rerolls, increments `round`.
- **Resolution**: all hostiles at 0 HP → `victory`; all friendlies at 0 → `defeat`. `exitBattle` on
  victory grants `distributeCombatXP(100)`, syncs member vitals from combat HP, and (always) drains
  neural. Achievement hooks: `run_baptism`, `run_flawless` (+`flawlessWins`), `run_near_death` (a survivor
  at exactly 1 HP), `acc_boss_down` (high-threat kill). On exit, `BattleScreen` reads the outcome and, if a
  contract was waiting, calls `handleCombatResolution(outcome)` to resume the contract.

### 6.8 Factions & reputation (`data/factions.js`, `factionSlice`)
- **6 factions** (language/meaning/signal themed): `fac_lexicon, fac_grammaton, fac_signal,
  fac_referent, fac_undertow, fac_static`, each with an accent color and sparse `rivals`.
- Rep clamps to `[-100, 300]`; tiers `HOSTILE<COLD<NEUTRAL<FRIENDLY<ALLIED<EXALTED`.
- `applyRepToDraft(state, faction, amount)` is the shared mutator: clamps, and on positive gains
  bleeds `ceil(amount*0.5)` off rivals. `LEGACY_FACTION_MAP` resolves old string labels to canonical ids.
  Rep gates contracts (`minFactionRep`), vendor stock (`factionReq`), and nudges event/recruit weighting.

### 6.9 Economy
- **Vendor** (`vendorSlice`, `data/vendor.js`): rotating stock rebuilt every 8 turns from team-level
  unlocked tiers (`basic` always; `intermediate` ≥ TL4; `elite` ≥ TL7), filtered by `factionReq` and
  perk unlocks. Buying flags an item sold-out for the rotation.
- **Exchange** (`exchangeSlice`, `data/coins.js`): 5 coins with `basePrice`/`volatility`. `tickPrices`
  drifts each price by `±volatility` (history capped 30, used by `Sparkline`). `buyCoin`/`sellCoin`
  convert against credits. Traded on `LifestyleScreen` via `TradeModal`.
- **Lifestyle** (`data/lifestyle.js`): 4 real-estate + 4 vehicles (each with a `minigame` stub id and
  flavor `attributes`). Bought with `purchaseAsset`; assets are stored as id arrays on `character`.

### 6.10 Achievements & persistence (`achievementSlice`, `data/achievements.js`)
- **25 achievements**: 17 account-scope, 8 run-scope. `type` is `milestone` (a `condition(state)` polled
  each turn via `checkMilestones`) or `action` (fired directly via `triggerAchievement`).
- **Account perks** are *derived*, never stored: `getActiveAccountPerks` maps unlocked account ids to
  their `accountPerk`. Perk `type`s: `start_credits`, `start_neural`, `start_level`, `start_stat`,
  `unlock_vendor_cyberware`, `unlock_vendor_quickhack`, `cosmetic_title`, `cosmetic_hud_theme`.
  `applyAccountPerks` re-applies stat/credit/level perks at the start of every run.
- **Persistence (AsyncStorage)**: `achievementSlice` writes `{account, lifetime}` under
  `neon_terminus_account_achievements` on every unlock/lifetime change; `initAchievements` reloads it on
  boot. `devSlice` persists `dev_enabled`. Per-run state (character/crew/world/contract/combat) is
  in-memory and wiped on death by `devSoftReset`. **This is the real "legacy carryover"** — the
  `legacySlice` itself is an unused stub.

### 6.11 Dev panel (`devSlice`, `DevPanel.js`)
Unlocked by tapping the top banner title **7×** within 3s (`recordBannerTap`, persisted). Exposes ~40
actions: set credits/turn/name, fill vitals, add/set XP & level (per-member, all-crew, team), spawn
recruits by class/quality, toggle/clear recruit spawns, force events (flavor/choice/by-id), force vendor
refresh / all-tiers, force contract start/resolution/clear, set fixer & faction rep, set coin price /
spike / crash / holdings, inject/clear log, kill/heal player, drain/restore neural, level-up banner,
soft/hard reset.

---

## 7. Screens

| Screen | Player does | Key store coupling |
|--------|-------------|--------------------|
| `LogScreen` (NEURAL) | reads the turn feed; taps `ADVANCE_CYCLE` | `log.entries`, `crew.members`, `character.credits`; `advanceTurn()` |
| `HavenScreen` | recruit/dismiss crew, buy recharges, watch team/pool tiers | `crew.*`, `contract.completedContracts`; recruit/dismiss/recharge actions |
| `CyberScreen` | equip/unequip cyberware (loadout), buy from vendor, install quickhack modules | `crew.members`, `character.cyberwareInventory`; equip/unequip + vendor actions; tabs `StatsTab/VendorTab/QuickhackModuleSection` |
| `JobsScreen` | browse the contract feed + activities; accept contract / launch test battle | `contract.feedItems/phase`, `faction.rep`; `acceptContract`, `executeActivity`, `startTestBattle` |
| `LifestyleScreen` | buy real-estate/vehicles, trade crypto, view achievements/titles/themes & lifetime stats | `character` assets, `exchange.*`, `achievements.*` |
| `BattleScreen` | run dice combat (roll/target/abilities/confirm) | `combat`, orchestrates phases via effects; `exitBattle` → `handleCombatResolution` |
| `GameOverScreen` | death recap + restart | `world.gameOverReason`, `character`, `achievements.account.selectedTitle`; `onRestart` |
| `init/Path,Identity,Finalize` | pick origin/gender, name, starter cyberware | local draft → `initCharacter` |
| `DevPanel` | debug everything | all dev actions |

**`ChoiceModal` is the unified interaction surface** (always mounted in `App.js`). It is a single RN
`Modal` that drives *both* random choice events *and* contract stages (active-stage choices + the
resolution/debrief screen + abort confirm), branching on `event.activeChoiceEventId` vs `contract.phase`.

---

## 8. Components

- **Shell**: `CRTBackground` (base + RGB gradient), `NoiseTexture`, `ScanlineOverlay` (1px line / 4px),
  `TopBanner` (blurred, tappable title for dev unlock, telemetry), `BottomNav` (5 tabs, NEURAL centered
  & enlarged, pulsing cyan glow on the active tab), `AdvanceCycleFAB` (pulsing glow + haptics), `LogEntry`
  (accent-bordered, unfold-in animation).
- **Overlays**: `ChoiceModal`, `LevelUpBanner`, `AchievementToast`, `ConfirmModal`, `TradeModal`, `Sparkline`,
  `MinigameStub`.
- **Subtrees**: `battle/` (UnitCard, Die, PhaseBanner, RoundInfo, TargetingOverlay, CyberDock/Pool,
  CommandButton, CompactRollControls, AbilityButton, ActionButton, BattleOutcomeOverlay), `cyber/`
  (StatsTab, VendorTab, VendorItemCard, EquipPreviewModal, QuickhackModuleSection), `recruit/`
  (RecruitCard, RecruitButton, AnimatedRainbowBorder for legendary), `init/` (InitHeader, InitFooter).

---

## 9. Content catalog (counts)

| Content | Count | File |
|---------|-------|------|
| Origins / Stats | 3 / 6 | `origins.js` |
| Seed operatives | 5 | `operatives.js` |
| Classes | 5 (netrunner, street_samurai, fixer, ghost, chrome_doc) | `classProfiles.js`, `cyberAbilities.js` |
| Cyberware | ~11 (8 + 3 starter), 7 slots | `cyberware.js` |
| Quickhacks | 6 | `quickhacks.js` |
| Flavor events | 42 | `events/flavor.js` |
| Choice events | 19 | `events/choices.js` |
| Contracts | 19 (low 4 / mid 4 / high 3 / faction 8) | `contracts/*` |
| Fixers | 5 | `fixers.js` |
| Factions | 6 | `factions.js` |
| Enemies | 21 (low 7 / med 6 / high 7 / boss 1), 6 move types + block trait | `enemies.js`, `enemyTurn.js` |
| Encounters | 2 named (back-compat + boss); generic fights generated by faction+tier+level | `encounters.js`, `encounterGenerator.js` |
| Coins | 5 | `coins.js` |
| Real estate / Vehicles | 4 / 4 | `lifestyle.js` |
| Recharge items | 4 | `rechargeItems.js` |
| Activities | 6 (incl. dev test battle) | `activities.js` |
| Achievements | 25 (17 account / 8 run) | `achievements.js` |
| Placeholder narration | 15 lines | `placeholderNarration.js` |

---

## 10. Tech stack

RN 0.83 + Expo SDK 55 · Zustand 5 + immer (`enableMapSet`) · NativeWind 4 (+ `StyleSheet.create`) ·
react-native-reanimated 4 (worklets override 0.7.4) · react-native-svg 15 · expo-font (Kode Mono),
-haptics, -blur, -linear-gradient · @expo/vector-icons (MaterialIcons) · AsyncStorage.

---

## 11. Lifecycle summary (end-to-end)

```
boot → fonts + initializeOperatives/initDevMode/initAchievements
     → init flow (Path→Identity→Finalize) → initCharacter (player = crew[0])
loop → ADVANCE_CYCLE → advanceTurn() → economy/recruit ticks → maybe an event
     → JOBS: accept contract → ChoiceModal stages → maybe BattleScreen → resolution debrief
     → HAVEN/CYBER/LIFESTYLE between turns
death → combat defeat (player vitals 0) → GameOverScreen → restart
     → recordPlayerDeath (lifetime++ persists) → devSoftReset → back to init flow
```

---

## 12. Known gaps & stubs

- `legacySlice` is an unused stub; carryover actually lives in `achievementSlice` (§6.10).
- `TEST_HOSTILE_UNITS`/`TEST_FRIENDLY_UNITS` (`data/testBattle.js`) and `cloneUnits` are now unused
  legacy fallbacks — real fights come from `enemies.js` + `encounterGenerator.js`.
- `enc_cyberpsycho` boss encounter exists but isn't yet wired to a contract (reachable via dev/test).
- `MinigameStub` + lifestyle `minigame` ids are placeholders; no minigames implemented.
- `docs/DESIGN.md` was empty (now the style guide) and `docs/ARCHITECTURE.md` describes a 6-slice
  skeleton that the code outgrew (13 slices).
- No automated gameplay tests; the dev panel is the manual harness. Combat balance has a Monte-Carlo
  simulation (`scripts/sim_balance.mjs`, run with `bun`) targeting 3–5 round fights, risk scaling by tier.

## 13. Doc drift (correct these if you touch the docs)

`CLAUDE.md` / `docs/ARCHITECTURE.md` are partly stale vs. the code:
- **No flat per-turn death** — there is no `engine/deathCheck.js` or `BASE_DEATH_CHANCE`; death is combat/dev only.
- **Choice events are live**, not "not in MVP."
- **3 origins**, not 6 (the "6" is the stat count).
- **13 slices**, not 6.
- **Income** is event/contract/exchange-driven, not a passive per-turn tick.
- reanimated is **4**, not 3.

---

## 14. Verification
`npm start` (Expo Go or dev build). No test suite. Manual QA via the dev panel (tap the banner title 7×):
force events, spawn enemies/recruits, edit stats, fast-forward turns, kill/heal the player, soft reset.
