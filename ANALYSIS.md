# Neon Terminus — Project Analysis

## What You're Building

**Neon Terminus** is a cyberpunk emergent life sim for **iOS/Android** built with **React Native + Expo SDK 55**. Think BitLife meets Shadowrun — a turn-based roguelite where you manage a crew of mercenaries in a neon-drenched dystopia.

---

## Core Loop

1. **Character creation** — Pick an origin (Corpo, Street Kid, Nomad, Techie, Media, Netrunner), name, and handle
2. **Advance turns** — Tap the ADVANCE_CYCLE button to progress time
3. **Each turn:**
   - Cred/Rep income from passive assets
   - Recruit spawn chance (~18% per turn)
   - Random flavor events fire (car crashes, gang disputes, etc.)
   - Choice events every ~6-7 turns (multi-branch decisions with consequences)
   - **~3% flat death chance per turn** — no scaling, permadeath
4. **Between turns** — Manage your crew in HAVEN, install cyberware in CYBER, take contracts in JOBS, manage lifestyle in LIFESTYLE, read the NEURAL log
5. **Combat** — Turn-based tactical battles triggered by contracts
6. **Death → Legacy** — Character resets, but lifetime achievements and unlocks persist via AsyncStorage

---

## Current State (MVP)

The project is **partially implemented** — many systems are stubbed or in progress. Here's the breakdown:

### ✅ Implemented / Shippable

| System | Details |
|--------|---------|
| **Turn pipeline** | Full cycle: increment → tick economy → spawn recruits → fire events → fallback narration |
| **Combat system** | Turn-based battles with initiative, HP, damage types, armor, quickhacks, abilities, victory/defeat/retreat |
| **Crew/Roster management** | Recruit, dismiss, equip cyberware, purchase recharges, dismiss from pool |
| **Contracts** | 3 tiers (LOW/MID/HIGH) with multi-stage objectives, combat triggers, branching outcomes, fixer rep |
| **Cyberware** | Equip/unequip system on crew members, class-specific items (Sandevistan, Gorilla Arms, etc.) |
| **Leveling** | XP thresholds, stat gains per level, max level cap, team-level calculation |
| **Character origins** | 6 origins with stat modifiers and opening narration |
| **Events system** | Flavor events (30+) and choice events (20+) with eligibility flags, weighted selection, cooldowns |
| **All 5 main screens** | Log, Haven, Cyber, Jobs, Lifestyle — fully wired to store |
| **Init flow** | Path → Identity → Finalize screens before entering main game |
| **Game over screen** | Post-death recap with restart option |
| **Lifetime achievements** | Rooted, milestone, and stat-tracking achievements with unlock perks |
| **Lifestyle economy** | Mortgages, vehicles, luxury goods, passive income/expenses |
| **Vendor economy** | Weapons, gear, recharges with dynamic pricing (limited supply / price ticks) |
| **CRT aesthetic** | Scanlines, noise overlay, linear gradients, Kode Mono font, mechanical animations |
| **Dev panel** | Full debug panel: force events, spawn enemies, edit stats, advance turns, reset run |
| **Bottom nav** | 5 tabs with animated active indicator, NEURAL centered & enlarged |

### 🚧 Partially Implemented / Stubbed

| System | Status |
|--------|--------|
| **Legacy/permadeath persistence** | Legacy slice exists but minimal — AsyncStorage integration not wired |
| **Choice modal** | Component exists but MVP says "not yet" for choice popups |
| **Recruit generation** | Works but quality/probability tuning is rough |
| **Battle screen** | Functional but UI polish incomplete |
| **Enemy data** | Only test battles wired — no real enemy encounters |
| **Event pacing** | Cooldown system exists but choice event firing isn't active |
| **Noise texture / scanlines** | Implemented but overlay rendering may need tuning |

### ❌ Not Started (Future Phases)

| Feature | Phase |
|---------|-------|
| LLM narrator | Phase 2+ |
| Map / district navigation | Phase 2+ |
| Faction reputation system | Phase 2+ |
| Minigames | Phase 3 |
| Multi-run legacy unlocks | Phase 3 |
| Push notifications | Phase 3+ |

---

## Architecture

### Store — 12 Zustand Slices (grew from original 6)

1. **character** — name, credits, morale, turn counter, renown, inventory
2. **crew** — roster of members, available recruits, spawn tracking, cyberware
3. **world** — global flags, faction power, game-over state
4. **log** — narration entry array
5. **event** — active/fired events, choice modals, pending outcomes
6. **contract** — active contract, feed items, completed, modifiers
7. **vendor** — inventory tick, prices, stock
8. **exchange** — stock market / crypto mini-economy
9. **legacy** — lifetime stats, unlocks (AsyncStorage target)
10. **dev** — debug flags, dev-mode toggles
11. **testCombat** — combat state (HP, initiative, buffs, loot)
12. **achievement** — unlocked achievements, milestones, perks

### Engine

Pure-ish functions that orchestrate store actions:
- `turnPipeline.js` — `advanceTurn()` is the main heartbeat
- `recruitGenerator.js` — generate procedurally-named crew members with classes

### Data

All game content in `src/data/` as exported JS objects/arrays. Content includes: 6 origins, 20+ cyberware items, 10+ quickhacks, 3 tiers of contracts with branching paths, 30+ flavor events, 20+ choice events, class profiles, leveling tables, achievements, vendor items, lifestyle assets, operatives, recruit names, event pacing constants.

### Screens

7 screens + 3 init screens + dev panel:
- **LogScreen** — scrolling feed of turn narration
- **HavenScreen** — crew roster, stats, recruit pool, recharges
- **CyberScreen** — cyberware inventory, equip/unequip per member
- **JobsScreen** — contract feed, active contract tracking
- **LifestyleScreen** — housing, vehicles, luxury items, passive income
- **BattleScreen** — full turn-based combat
- **GameOverScreen** — death recap, restart
- **PathScreen / IdentityScreen / FinalizeScreen** — character creation flow

### Visual Aesthetic

CRT monitor terminal aesthetic:
- Kode Mono font everywhere
- Scanline overlay + noise texture
- Sharp corners (borderRadius: 0)
- UPPERCASE labels with letter-spacing
- Cyan/neon-green/purple palette from Tailwind config
- MaterialIcons replacing SVG/Lucide from the HTML mocks
- Full-screen CRTBackground wrapping everything

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native 0.83 + Expo SDK 55 |
| State | Zustand 5 + immer middleware |
| Styling | NativeWind 4 (Tailwind) + StyleSheet |
| Animations | react-native-reanimated 4 |
| Fonts | Kode Mono (via expo-font) |
| Icons | @expo/vector-icons (MaterialIcons) |
| Persistence | AsyncStorage (planned for legacy layer) |
| Build | Expo (Android + iOS targets) |
| Haptics | expo-haptics |
| Blur | expo-blur |

---

## Verification

- `npm start` / `bun start` — loads in Expo Go or dev build
- No formal test suite currently
- Dev panel provides manual testing of most game systems
