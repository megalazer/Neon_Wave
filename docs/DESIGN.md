# Neon Terminus — Style Guide

How this codebase *looks* and how it's *written*. Follow these so new code is indistinguishable from
the existing code. Every rule here is extracted from the current source — when in doubt, copy a nearby
file. (`ANALYSIS.md` covers what each system does; this covers how to build in the same voice.)

---

## 1. Visual identity — the CRT terminal

The whole app is a fake cyberpunk computer terminal. Five non-negotiables, every screen:

1. **Monospace everywhere** — Kode Mono on every text node. No system-font fallbacks.
2. **Sharp corners** — `borderRadius: 0` on everything *except* avatars/pills (`rounded-full` / 9999).
   This is baked into `tailwind.config.js` (`borderRadius.DEFAULT/lg/xl = "0px"`).
3. **`UPPERCASE_SNAKE` chrome** — labels, buttons, headers are uppercase with letter-spacing
   (`labelCaps`: `letterSpacing 1.2`, `textTransform 'uppercase'`). Bracketed actions: `[LEND_IT]`, `[ABORT]`.
4. **CRT layers on top of every screen** — `<NoiseTexture/>` (zIndex 99) + `<ScanlineOverlay/>` (zIndex 100),
   wrapped by `<CRTBackground>`. Don't remove them; new full-screen states must include them.
5. **Neon glow, mechanical motion** — cyan/magenta/green glows via shadow; animations are linear or
   ease-in-out, never spring-bounce on UI chrome.

The Stitch HTML mocks in `docs/designs/*` are the original visual source of truth; `theme/colors.js`
hex values are transcribed from `neuralscreen` ("do not approximate").

---

## 2. Color — use the tokens, never raw hex in components

All color lives in `src/theme/colors.js` (`colors` object + `glows` shadow presets) and mirrors into
`tailwind.config.js`. **Import `colors`; do not hardcode hex in a component** (the theme files and a few
animated `shadowColor`s are the only places literal hex appears).

Core palette:
- **Primary / cyan** `#00f3ff` — the default accent, active states, player.
- **Secondary / magenta** `#fe00fe` (`secondaryContainer`), `#ffabf3` (`secondary`) — nav top border, rare.
- **Tertiary / green** `#36fd0f` / `#79ff5b` (`tertiaryFixed`) — success, heal, positive.
- **Error / red** `#ffb4ab` (`error`), `#93000a` (`errorContainer`) — danger, defeat, dev chip.
- **Surfaces** `background #0e0e10`, `surface #131315`, `surfaceContainerLow #1c1b1d` … up to `…Highest`.
- **Text** `onBackground/onSurface #e5e1e4`, `onSurfaceVariant #b9cacb`, `outline #849495` (muted/disabled).

**Accent tokens** are a recurring pattern — data entries carry an `accent` string
(`'primary'|'secondary'|'tertiary'|'error'|'outline'`) and components map it to a color via a local
`ACCENT_MAP`/`ACCENT_COLORS`. Reuse that pattern instead of inventing per-component color logic.

**Opacity** is expressed as an 8-digit hex suffix on a token, e.g. `` `${colors.primary}1A` `` (10%),
`4D` (30%), `66` (40%), `B3` (70%), `0D` (5%). Keep using this idiom.

**Glows** come from `glows.*` presets (`cyanSoft`, `cyanStrong`, `magentaNavTop`, `bannerBottom`…) —
spread them into a `StyleSheet` entry (`...glows.cyanSoft`). Animated glows set `shadowColor/Opacity/Radius`
inside `useAnimatedStyle` (literal `'#00f3ff'` is acceptable there because reanimated worklets can't read
the JS `colors` object reliably).

---

## 3. Typography

From `src/theme/fonts.js`. Four weights are loaded: `KodeMono_400Regular/500Medium/600SemiBold/700Bold`.
Use the exported style objects, don't re-specify `fontFamily` ad hoc:
- `labelCaps` — uppercase, bold, `letterSpacing 1.2`, size 12. The default for chrome/labels.
- `bodyMd` — regular, size 14 / lineHeight 22. Body copy and log text.
- `headlineMd` — bold, size 24. Headlines.
- `fontStyles.{regular,medium,semibold,bold}` — when you need a bare family.

Convention: spread the base then override (`{ ...labelCaps, color: colors.primary, fontSize: 13 }`).
Numbers/telemetry are bold mono (`CR: 1,240`, `RN: GHOST`, `Lvl_07`, `ENTRY_001` — zero-padded with
`String(n).padStart(...)`).

---

## 4. Styling mechanics — `StyleSheet.create`, not className

Despite NativeWind being installed, **screens and components use `StyleSheet.create` with theme tokens**,
not Tailwind `className` strings. Match that. NativeWind/`global.css` is wired but className usage is
effectively absent in app code — don't introduce it for new components.

Conventions seen throughout:
- One `const styles = StyleSheet.create({...})` at the bottom of the file. Large screens use **multiple
  named blocks** (`styles`, `team`, `pool` in HavenScreen; `scr`, `cBtn`, `badge`, `out`, `res` in
  ChoiceModal) to scope sub-component styles. Keep this — it reads better than one giant block.
- Inline styles only for **dynamic** values (a computed color, a width %): `style={[styles.bar, { width }]}`,
  `style={[styles.row, { borderLeftColor: accentColor }]}`. Everything static goes in the sheet.
- Borders carry the aesthetic: thin neon borders (`borderWidth: 1, borderColor: colors.primary`),
  left accent bars (`borderLeftWidth: 4`), corner brackets (separate absolutely-positioned views), and
  "chunky" offset bottom/right border views for the tactile button look (see `AdvanceCycleFAB`).

---

## 5. Component conventions

- **Functional components only**, hooks at the top. No class components.
- **Keep components small**; factor sub-components in the same file (e.g. `CrewSlot`, `SectionHeader`,
  `RosterRow`, `ContractCard`) above the default export. This is the dominant pattern — a screen file is
  one default export plus a stack of local presentational helpers + its StyleSheet blocks.
- **Narrow store selectors** — one `useStore(s => s.slice.field)` per value; never subscribe to the whole
  store. Pull actions the same way (`const recruit = useStore(s => s.recruitOperative)`).
- **Props**: presentational components take plain data + `on*` callbacks (`onPress`, `onAccept`,
  `onNavigate`, `onExit`, `onDismiss`). Reusable cards accept the entity + the handful of values they
  render (see `ContractCard({ feedItem, playerLevel, credits, factionRep, onAccept })`).
- **Icons**: `@expo/vector-icons` `MaterialIcons` only (`name`, `size`, `color`). Data entries carry an
  `icon` string that's a MaterialIcons name (`'terminal'`, `'memory'`, `'psychology'`, `'bolt'`).
- **Haptics**: fire `Haptics.impactAsync(...)` on meaningful taps — `Light` for nav, `Medium` for
  recruit/choice/advance, `Heavy` for combat hits/abort.

---

## 6. Animation (react-native-reanimated 4)

The house style: `useSharedValue` + `useAnimatedStyle`, driven in a `useEffect`. Patterns to reuse:

**Looping pulse/glow** (active nav tab, FAB, banners):
```js
const opacity = useSharedValue(0.5);
useEffect(() => {
  opacity.value = withRepeat(
    withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
    -1, true,           // infinite, reverse
  );
}, []);
const animStyle = useAnimatedStyle(() => ({
  shadowColor: '#00f3ff', shadowOpacity: opacity.value, shadowRadius: glowRadius.value, elevation: 12,
}));
```

**Glitch jitter** (transmission headers, GameOver) — `withSequence` of tiny ±2px `translateX` timings
inside a `withRepeat`.

**List/entry entrance** — a `'worklet'` `entering` factory + `LinearTransition.duration(350)` so new log
entries unfold (`scaleY 0→1`, `opacity 0→1`) and siblings slide (`LogEntry.unfoldFromTop`).

Rules: durations ~200–1000ms; easing `Easing.inOut(Easing.ease)` or `Easing.out(Easing.cubic)`; never
springy on chrome. Animated `shadow*`/`opacity`/`transform` only (cheap, RN-safe).

---

## 7. State & data conventions

- **Slices** are `(set, get) => ({ sliceKey: {…initial}, ...actions })`, composed in `store/index.js`.
  Always use **immer** style: mutate the draft inside `set(state => { state.x.y = … })`. `enableMapSet()`
  is on, so `Set`s (`world.flags`, `event.firedEventIds`) are fine.
- **All game content lives in `src/data/`** as exported plain objects/arrays. Logic reads data; it never
  hardcodes content. Adding content = add a data entry, not a code branch.
- **Cross-slice writes** are fine inside one `set`, but rep changes go through the shared
  `applyRepToDraft(state, faction, amount)` (rivalry bleed + clamps + legacy-label resolution). Don't
  poke `faction.rep` directly.
- **Achievement/persistence side-effects run *after* `set`**, never inside the immer callback — e.g.
  `recruitOperative` calls `set(...)` then `get().triggerAchievement(...)`; `exitBattle` settles state in
  `set`, then fires achievement hooks. Follow this ordering (immer drafts aren't valid post-commit).
- **Dev actions** are prefixed `dev*` and live alongside the real actions in each slice; gate UI-only
  things behind `dev.enabled`.

---

## 8. Logging — the narration feed

Almost every meaningful action pushes a `log.entries` item. Shape:
```js
{ id: `${prefix}_${Date.now()}`, turn: state.character.turnNumber,
  text, timestamp: new Date().toISOString(), type, accent? }
```
- `type`: `narration | ambient | system | acquisition | choice_outcome` (drives styling/semantics).
- `text` voice: terse, present-tense, neon-noir. Prefix tags for category — `LOG:`, `ACQUISITION:`,
  `SUPPLY:`, `CRITICAL:`, `ABORT:`, `LEVEL_UP:`, `NEURAL_SYNC:`, `ACHIEVEMENT_UNLOCKED:`. Credits read as
  `+1,400 CR` / `-${cost.toLocaleString()} CR`.
- `accent` (optional) maps to the left-border color of `LogEntry`.

---

## 9. Naming & copy

- **Identifiers**: snake-prefixed kebab ids — `cyb_*`, `qh_*`, `con_low_*`, `flv_*`, `chc_*`, `fac_*`,
  `acc_*`/`run_*` (achievements), `op_*`, `rec_*` (generated recruits). Keep the prefix scheme.
- **Display labels**: `UPPERCASE_SNAKE` (`SIGNAL_TAP`, `NEURAL_CHRONICLE_OS`, `ADVANCE_CYCLE`,
  `DATA_ENCLAVE`). Names of people use `Title_Snake` (`Kaelen_Vex`, `Neural_Link_Mk4`).
- **Stats** are six lowercase keys: `chrome, edge, ghost, face, grit, wire`. UI shows them uppercased.
- **Subtitles** are slug-style with a `// ` prefix in the banner (`// HAVEN`).
- Tone: cyberpunk, dry, a little fatalistic. Short sentences. No emoji.

---

## 10. Layout chrome (don't reinvent)

- **TopBanner**: blurred bar, fixed `NEURAL_CHRONICLE_OS` title (tappable → dev unlock), per-screen
  subtitle, right-side telemetry (`CR:` / `RN:`). Cyan bottom border + `bannerBottom` glow. `paddingTop: 44`
  reserves the status bar.
- **BottomNav**: 5 tabs `HAVEN / CYBER / NEURAL / JOBS / LIFESTYLE`; **NEURAL is centered and ~1.3–1.4×
  larger** (icon 32 vs 24), magenta top border, blurred bg. Active tab: cyan `borderTop`, faint cyan
  tint (`${primary}0D`), pulsing cyan glow (~1s loop). Upward magenta glow on the whole bar.
- New full-screen takeovers (battle/init/game-over) must wrap in `CRTBackground` and include
  `NoiseTexture` + `ScanlineOverlay`, plus a translucent `StatusBar`.

---

## 11. Do / Don't checklist

**Do**
- Import `colors`/`fonts` tokens; spread `glows.*`.
- `StyleSheet.create` with token references; inline only dynamic values.
- Narrow `useStore` selectors; mutate immer drafts; run side-effects after `set`.
- Add content as data entries; reuse the `accent`/`icon`/`id`-prefix conventions.
- Push a flavorful, tagged `log.entries` line for player-visible actions.
- Keep corners sharp, labels uppercase+spaced, motion mechanical, fonts mono.

**Don't**
- Hardcode hex in components, use system fonts, or round corners (except avatars/pills).
- Subscribe to the whole store, or read another slice's `rep` without `applyRepToDraft`.
- Spring-animate chrome, or animate layout/size on the hot path.
- Add a navigation library (navigation is `activeTab` + the `App.js` state machine).
- Hardcode game content in logic, or store derived values (perks) that can be recomputed.
- Render the Stitch HTML directly — it's reference; build native components that match.
