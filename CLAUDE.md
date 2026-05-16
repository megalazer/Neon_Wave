# CLAUDE.md

## Project
Neon Terminus — a cyberpunk emergent life sim for mobile (React Native + Expo). BitLife meets Shadowrun. The player taps "ADVANCE_CYCLE" to advance turns. Most turns produce narration that just appears. Choice popups will fire every ~6-7 turns (not in MVP yet). Flat death probability per turn. Legacy carryover between runs.

## Required Reading (read before any task)
Always read these before making structural decisions or writing code:

1. `docs/ARCHITECTURE.md` — store slices, event schema, turn pipeline, legacy system, full implementation phases
2. `docs/DESIGN.md` — visual design system, per-screen interaction notes, file naming
3. `docs/designs/*.html` — Stitch exports defining the exact aesthetic. **These are the source of truth for how every screen looks.** Open the relevant HTML file before building any screen.

If a design decision conflicts between this file and the HTML exports, the HTML wins.

## Tech Stack
- Expo SDK 55+, React Native 0.83+
- Zustand 5 with `immer` middleware, sliced stores (6 slices per ARCHITECTURE.md)
- NativeWind for Tailwind-style styling
- react-native-reanimated 3 for animations
- expo-linear-gradient, expo-blur, expo-font, expo-haptics
- @expo/vector-icons (MaterialIcons replaces `material-symbols-outlined` from HTML)

## Visual Design — Non-Negotiable Rules
- **Font:** Kode Mono on every single text node. No system font fallbacks in UI.
- **Colors:** Exact hex codes from the Tailwind config in `docs/designs/LogScreen.html`. Don't approximate.
- **Corners:** Sharp (`borderRadius: 0`) on everything except avatars and pills (`rounded-full`).
- **Labels:** UPPERCASE with `letter-spacing: 0.1em` on all UI chrome.
- **Scanlines + CRT background + noise overlay:** Visible on every screen, always.
- **Animations:** Mechanical and electric — linear or ease-in-out. Never spring-bounce on UI elements.
- **Top banner:** `NEURAL_CHRONICLE_OS` consistent across all screens (subtitle slug changes per screen).
- **Bottom nav:** 5 tabs (HAVEN / CYBER / NEURAL / JOBS / LIFESTYLE). NEURAL is centered and ~1.4x larger than the others, always visually emphasized. Active tab has cyan border-top, tint background, pulsing cyan glow (2s loop, opacity 0.3→0.8→0.3).

## Architectural Rules
- Zustand store is sliced — 6 domain slices, never one monolith. Always use `immer` middleware.
- Components subscribe to narrow selectors, never the full store: `useStore(s => s.log.entries)` not `useStore()`.
- Engine functions are pure where possible — take state, return new state.
- All game content lives in `src/data/` as JS objects. No hardcoded content in engine code.
- Legacy slice persists separately in AsyncStorage (not implemented in MVP, but architecture should support it).
- LLM narrator is a future add-on — not in MVP. Use template/placeholder narration for now.

## Gameplay Constants
- Flat death probability per turn: ~3% (`BASE_DEATH_CHANCE` in `src/engine/deathCheck.js`). No scaling.
- Choice events fire every ~6-7 turns via cooldown system (not in MVP).
- ~15% of turns are quiet (nothing happens) (not in MVP).
- World state persists across runs; character state resets.

## File Structure
Match `docs/ARCHITECTURE.md` section 10. Don't invent alternative structures. Stub files for unbuilt features rather than reorganizing.

## Code Style
- Functional components only, no class components.
- Hooks at the top of components.
- Keep components under ~150 lines — split when they grow.
- No inline styles for anything non-trivial — use NativeWind classes or `StyleSheet.create`.
- Comments explain "why," not "what."

## What NOT to Do
- Don't introduce navigation libraries for the MVP — use a single `activeTab` `useState` in `App.js`.
- Don't add features outside the current scope without asking. If `ARCHITECTURE.md` lists something for Phase 3 and we're on MVP, leave it as a stub.
- Don't render the Stitch HTML directly. The HTML files are visual references — build native components that match.
- Don't write the LLM narrator layer. Use the hardcoded placeholder array for narration.
- Don't refactor the store shape without consulting `ARCHITECTURE.md`.

## When Stuck
Re-read `docs/ARCHITECTURE.md` and the relevant HTML in `docs/designs/`. Ask me a clarifying question rather than guessing.