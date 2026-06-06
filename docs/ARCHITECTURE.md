neon-terminus/
├── App.js                      state-machine shell: fonts → gameOver → init → battleActive → main
├── global.css / tailwind.config.js  NativeWind setup (sharp corners, neon palette)
├── app.json / package.json
├── CLAUDE.md
├── ANALYSIS.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md               style guide for agents
│   └── designs/                Stitch HTML visual references
└── src/
    ├── theme/
    │   ├── colors.js           hex tokens + glow presets
    │   └── fonts.js            Kode Mono loading
    ├── store/
    │   ├── index.js            13 slices, immer middleware + enableMapSet()
    │   └── slices/
    │       ├── characterSlice.js
    │       ├── crewSlice.js
    │       ├── worldSlice.js
    │       ├── logSlice.js
    │       ├── eventSlice.js
    │       ├── contractSlice.js
    │       ├── vendorSlice.js
    │       ├── exchangeSlice.js
    │       ├── factionSlice.js
    │       ├── achievementSlice.js
    │       ├── legacySlice.js       stub — unused; real persistence in achievementSlice
    │       ├── devSlice.js
    │       └── testCombatSlice.js
    ├── engine/
    │   ├── turnPipeline.js      the heartbeat: advanceTurn()
    │   └── recruitGenerator.js  procedural crew spawns
    ├── data/
    │   ├── origins.js           3 origins (corpo, street_kid, nomad)
    │   ├── operatives.js        5 seed crew members
    │   ├── classProfiles.js     5 classes
    │   ├── leveling.js          XP thresholds, level-up logic
    │   ├── recruitQuality.js    spawn weights by quality tier
    │   ├── cyberware.js         ~11 blueprints, 7 slot types
    │   ├── quickhacks.js        6 quickhacks
    │   ├── cyberAbilities.js    one per class
    │   ├── rechargeItems.js     4 consumables
    │   ├── vendor.js            rotating stock tiers
    │   ├── coins.js             5 coins with basePrice/volatility
    │   ├── lifestyle.js         4 real-estate + 4 vehicles
    │   ├── activities.js        6 activities (incl. test battle)
    │   ├── fixers.js            5 fixers
    │   ├── factions.js          6 factions
    │   ├── achievements.js      25 achievements (17 account, 8 run)
    │   ├── eventPacing.js       cooldown + escalation constants
    │   ├── placeholderNarration.js  15 fallback lines
    │   ├── events/
    │   │   ├── flavor.js        42 flavor events
    │   │   └── choices.js       19 choice events
    │   ├── contracts/
    │   │   ├── low.js           4 contracts
    │   │   ├── mid.js           4 contracts
    │   │   ├── high.js          3 contracts
    │   │   └── faction.js       8 contracts
    │   └── encounters.js / enemies.js  minimal; combat mostly uses TEST_HOSTILE_UNITS
    ├── screens/
    │   ├── LogScreen.js         NEURAL tab — turn feed + ADVANCE_CYCLE
    │   ├── HavenScreen.js       crew management
    │   ├── CyberScreen.js       cyberware loadout + vendor
    │   ├── JobsScreen.js        contract feed + activities
    │   ├── LifestyleScreen.js   assets + exchange + achievements
    │   ├── BattleScreen.js      dice combat
    │   ├── GameOverScreen.js    death recap + restart
    │   ├── DevPanel.js          debug (~40 actions, 7-tap unlock)
    │   └── init/
    │       ├── PathScreen.js
    │       ├── IdentityScreen.js
    │       └── FinalizeScreen.js
    └── components/
        ├── shell/
        │   ├── TopBanner.js
        │   ├── BottomNav.js
        │   ├── CRTBackground.js
        │   ├── NoiseTexture.js
        │   ├── ScanlineOverlay.js
        │   ├── AdvanceCycleFAB.js
        │   └── LogEntry.js
        ├── overlays/
        │   ├── ChoiceModal.js        unified: choices + contract stages + resolution
        │   ├── LevelUpBanner.js
        │   ├── AchievementToast.js
        │   ├── ConfirmModal.js
        │   └── TradeModal.js
        ├── battle/
        │   ├── UnitCard.js
        │   ├── Die.js
        │   ├── PhaseBanner.js
        │   ├── RoundInfo.js
        │   ├── TargetingOverlay.js
        │   ├── CyberDock.js
        │   ├── CommandButton.js
        │   ├── CompactRollControls.js
        │   ├── AbilityButton.js
        │   ├── ActionButton.js
        │   └── BattleOutcomeOverlay.js
        ├── cyber/
        │   ├── StatsTab.js
        │   ├── VendorTab.js
        │   ├── VendorItemCard.js
        │   ├── EquipPreviewModal.js
        │   └── QuickhackModuleSection.js
        ├── recruit/
        │   ├── RecruitCard.js
        │   ├── RecruitButton.js
        │   └── AnimatedRainbowBorder.js
        └── init/
            ├── InitHeader.js
            └── InitFooter.js

### Navigation
No navigation library. `App.js` is a 5-state machine (fonts→gameOver→init→battleActive→main). `activeTab` is `useState`. `ChoiceModal` is the unified overlay (always mounted).

### Store (13 Zustand slices, immer + enableMapSet)
character, crew, world, log, event, contract, vendor, exchange, faction, achievement, legacy (stub), dev, testCombat. Cross-slice writes happen inside immer `set`. Components subscribe with narrow selectors.

### Turn Pipeline
`advanceTurn()` in `engine/turnPipeline.js`: incrementTurn → tickTurn → tickPrices → tickFeed → tickVendor → trySpawnRecruit → tickAvailableOperatives → achievement polling → selectAndFireRandomEvent (if not blocked) → fallback narration. `devAdvanceTurns(n)` repeats n times without fallback.

### Events
42 flavor + 19 choice. Cooldown 4 turns, escalating choice probability. `ChoiceModal` handles both random events and contract stages.

### Contracts
19 contracts (low/mid/high/faction) across 4 phase files. Lifecycle: feed → active → (combat) → resolving → feed. Multi-stage with stat checks. Combat bridge via `pendingCombatResult`.

### Combat
Dice-driven in `testCombatSlice`. Round phases: roll→targeting→executing→enemy_turn→endRound. Cyber pool from team neural. Victory/defeat → `handleCombatResolution` if contract-active.

### Persistence
`achievementSlice` persists account+lifetime to AsyncStorage (key: `neon_terminus_account_achievements`). `devSlice` persists `dev_enabled`. Per-run state is in-memory, wiped on death.

### Dev Panel
7-tap banner title within 3s. ~40 debug actions. Persisted enable state.
