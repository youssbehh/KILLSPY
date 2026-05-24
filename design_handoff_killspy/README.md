# Handoff · KILLSPY Mobile Game UI

> **Project:** KILLSPY by MIMIR STUDIO
> **Platform:** React Native (iOS + Android + Web via React Native Web)
> **Design fidelity:** **High-fidelity** — pixel-perfect mockups with finalized colors, typography, spacing, motion direction, and game-state logic.
> **Style direction:** Sleek spy noir × neon street culture × premium esport. Playful, energetic, readable on a 6″ phone screen in sunlight. **Not** gritty, dark, corporate, or cartoony.

---

## 0 · About the design files

The `reference/` folder contains an **HTML/React prototype** of the full visual system. It is a **design reference**, not production code to copy verbatim:

- It uses CSS features that don't exist in React Native (`clip-path`, `backdrop-filter`, `mix-blend-mode`, CSS variables, `@keyframes`).
- It uses inline `<style>` strings to inject keyframes — React Native uses Reanimated / Animated APIs instead.
- Babel-in-the-browser JSX is for live preview only.

**Your job:** recreate every screen and component **pixel-perfectly** in React Native using its native primitives. Where a CSS feature has no RN equivalent, the section "React Native translation notes" below tells you what to substitute.

To preview the design, open `reference/index.html` in any modern browser. The pan/zoom canvas has all 9 artboards side-by-side. Click the expand icon on any artboard label to view that screen fullscreen.

---

## 1 · Recommended stack

| Concern | Choice |
|---|---|
| Framework | **Expo** (managed workflow) — fastest path to iOS + Android + Web |
| Navigation | `@react-navigation/native` + `@react-navigation/native-stack` |
| Fonts | `@expo-google-fonts/barlow-condensed`, `@expo-google-fonts/rajdhani`, `@expo-google-fonts/jetbrains-mono` |
| SVG / icons | `react-native-svg` (REQUIRED — used for hex shapes, badges, glyphs, sparklines) |
| Blur | `expo-blur` (`<BlurView>`) |
| Linear gradients | `expo-linear-gradient` |
| Animation | `react-native-reanimated` v3 |
| One-shot reveals | `lottie-react-native` (optional — for the splash logo reveal + win burst, you can also drive them with Reanimated) |
| Haptics | `expo-haptics` |
| State | Zustand or Redux Toolkit — your call. The pieces of state below are small enough that React Context + reducer is also fine. |

---

## 2 · Project structure (suggested)

```
src/
├── theme/
│   ├── colors.ts           // KS tokens — copy verbatim from §3
│   ├── typography.ts       // font scales
│   └── motion.ts           // animation durations + easings
├── components/
│   ├── HexAvatar.tsx
│   ├── RankBadge.tsx
│   ├── GlassCard.tsx
│   ├── ChamferContainer.tsx
│   ├── Logo.tsx
│   ├── PrimaryButton.tsx
│   ├── SecondaryButton.tsx
│   ├── DangerButton.tsx
│   ├── ProgressBar.tsx
│   ├── NotificationPill.tsx
│   ├── SectionLabel.tsx
│   ├── BottomNav.tsx
│   ├── Currency.tsx
│   ├── PlayerTag.tsx
│   ├── ActionCard.tsx           // game HUD card
│   ├── Countdown.tsx            // game HUD timer
│   ├── Lives.tsx
│   ├── Ammo.tsx
│   ├── ShopCard.tsx
│   └── TopoBg.tsx
├── screens/
│   ├── SplashScreen.tsx
│   ├── HomeScreen.tsx
│   ├── MatchmakingScreen.tsx
│   ├── HUDScreen.tsx            // in-game
│   ├── EndMatchScreen.tsx       // win + lose variants
│   ├── ProfileScreen.tsx
│   ├── LeaderboardScreen.tsx
│   └── ShopScreen.tsx
└── navigation/
    └── RootNavigator.tsx
```

---

## 3 · Design tokens (copy verbatim)

### 3.1 · Color palette — `Futur Urbain` (default theme)

```ts
// src/theme/colors.ts
export const KS = {
  // Surfaces (deepest → highest)
  bg:        '#1f242a',
  surface:   '#343a40',
  surfaceHi: '#3f464d',
  glass:     'rgba(52,58,64,0.62)',     // glassmorphic card fill
  glassHi:   'rgba(63,70,77,0.78)',

  // Ink (typography)
  ink:       '#ffffff',
  inkMute:   '#d3d3d3',
  inkDim:    'rgba(211,211,211,0.55)',
  inkFaint:  'rgba(211,211,211,0.25)',

  // Action / state
  primary:    '#007bff',                // electric blue — CTA
  primaryGlow:'rgba(0,123,255,0.55)',
  alert:      '#ffc107',                // amber — premium / sale / warning
  live:       '#39ff14',                // neon green — LIVE-state ONLY
  danger:     '#ff3b30',                // alarm red
  enemy:      '#ff6b35',                // enemy player highlight

  // Structure
  hair:      'rgba(0,123,255,0.45)',    // 1px electric blue card stroke
  hairSoft:  'rgba(255,255,255,0.08)',
  divider:   'rgba(255,255,255,0.06)',

  // Rank tier colors
  tier: {
    bronze:  '#cd7f32',
    silver:  '#c0c0c0',
    gold:    '#ffc107',
    diamond: '#7be0ff',
    phantom: '#ff3b30',
  },

  // Rarity (shop)
  rarity: {
    common:    '#d3d3d3',
    rare:      '#007bff',
    epic:      '#a040ff',
    legendary: '#ffc107',
  },
};
```

### 3.2 · Secondary themes (reserved for specific maps / modes)

Switch the **accent triad** (`primary` / `alert` / `live`) per map. Keep the surface ramp constant.

| Theme | Palette |
|---|---|
| Mystère Nocturne   | `#000000`, `#4a5a2d`, `#001f3f`, `#8b0000`, `#c0c0c0` |
| Infiltration Naturelle | `#228b22`, `#8b4513`, `#ff4500`, `#ffd700` |
| Technologie Avancée | `#000000`, `#00ffff`, `#800080`, `#40e0d0` |
| Élégance Classique  | `#001f3f`, `#800000`, `#ffd700`, `#cd7f32` |

### 3.3 · Typography

```ts
// src/theme/typography.ts
export const TYPO = {
  display: 'BarlowCondensed_800ExtraBold',  // classified stencil — logo, big titles, labels
  ui:      'Rajdhani_500Medium',            // body / interface — also 400/600/700
  uiBold:  'Rajdhani_700Bold',
  mono:    'JetBrainsMono_500Medium',       // numbers, timers, stats, "// classified" eyebrows
  monoBold:'JetBrainsMono_700Bold',
};

// Scales (px)
export const SIZES = {
  // Display
  logoXL: 84,  hero: 38,  titleLg: 30, titleMd: 22, titleSm: 18, labelLg: 14,
  // Body
  bodyLg: 16, body: 14, bodySm: 13,
  // Mono / eyebrow
  monoLg: 14, monoMd: 11, monoSm: 10, monoXs: 9, monoXxs: 8,
};

// Letter spacing pairs with case:
//   display + UPPERCASE → 0.04em base, 0.06–0.18em for impact
//   mono                → 0.18em–0.32em (very airy, classified-stamp feel)
//   ui body             → normal
```

Load fonts in `App.tsx` via `useFonts({ BarlowCondensed_800ExtraBold, Rajdhani_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold, JetBrainsMono_500Medium, JetBrainsMono_700Bold })` and gate render on load.

### 3.4 · Spatial system

| Token | Value |
|---|---|
| Safe horizontal padding | **16 px** |
| Touch target min | **48 px** |
| Bottom nav | **64 px** content + ~28 px home indicator → **92 px total** |
| Card border radius | **12 px** standard, **20 px** large modals/cards — but most KILLSPY cards use **chamfered clip-paths** instead (see §4.4) |
| Hairline border | **1 px**, `KS.hair` for blue or `KS.hairSoft` for neutral |
| Card padding | **12–16 px** |

### 3.5 · Motion

| Token | Value |
|---|---|
| `enter` | 180 ms, ease-out `[0.22, 1, 0.36, 1]` |
| `exit`  | 140 ms, ease-in  `[0.4, 0, 1, 1]` |
| `tap`   | scale 0.96, 100 ms ease-out |
| `glow-pulse` (CTAs) | 2400 ms infinite loop, ease-in-out, box-shadow expand/contract |
| `radar-sweep` | 2400 ms linear infinite (matchmaking), 6000 ms (splash) |
| `letter-in` (splash logo) | 220 ms per letter, stagger 60 ms, translateY 8→0 + opacity 0→1 + blur 4→0 |
| `stamp-in` (win/classified stamps) | 700 ms, scale 2.2→1 + rotate -14°→-6° |
| `blink` (urgent indicators) | 0.5–1.2 s, 50%/50% step |
| `ammo-low-shake` | When ammo ≤ 2: 60 ms left-right shake + red flash | 

---

## 4 · Component library

> Each component lists **its props, its CSS-in-RN translation, and any state**. Visual reference: open `reference/index.html` and inspect.

### 4.1 · `HexAvatar`

Hexagonal avatar with a tier-colored ring and optional live dot.

| Prop | Type | Default |
|---|---|---|
| `size` | `number` | `56` |
| `tier` | `'bronze'\|'silver'\|'gold'\|'diamond'\|'phantom'` | `'gold'` |
| `src`  | `string?` | — |
| `initials` | `string` | `'X'` |
| `live` | `boolean` | `false` |

**Implementation:**
- Use `react-native-svg`'s `<Polygon>` or a `<MaskedView>` to clip the photo to a hex shape.
- Hex polygon (CSS clip-path): `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`
- 3 layers stacked: tier ring (linear-gradient 155° from `tier[N]` → white 35% → `tier[N]` 70% → black 50%) · `bg` cutout 3 px in · photo or initials gradient 5 px in.
- Live dot: 12 px green circle bottom-right offset (-2 px, +4 px), `box-shadow 0 0 8px #39ff14`, 2 px `bg`-colored border.

### 4.2 · `RankBadge`

Stenciled hex with the tier glyph inside. 5 tiers map to 5 glyph paths:

```ts
const RANK_NAMES  = ['RECRUIT','OPERATIVE','AGENT','SPECIALIST','PHANTOM'];
const RANK_TIERS  = ['bronze','silver','gold','diamond','phantom'];
// Paths in reference/killspy-shared.jsx → RANK_GLYPHS
// 0: I chevron · 1: II · 2: III · 3: octagon-diamond · 4: 5-pointed crest
```

Props: `tier: 0..4`, `size: number`, `showName: boolean`.

### 4.3 · `Logo`

The KILLSPY wordmark — stencil, ExtraBold Barlow Condensed.

- Letter spacing 0.04em **except** between `KILL` and `SPY` → 0.18em (a deliberate visual break)
- `stamp` prop draws a 2 px border around it with a chamfered clip-path → classified-stamp look
- `animated` prop staggers letter reveals (`letter-in` motion above)

### 4.4 · `ChamferContainer` / `GlassCard`

The signature shape language. Chamfered (clipped-corner) rectangles, two variants:

```
'tr-bl'  → top-right + bottom-left clipped (default — dossier feel)
'tl-br'  → top-left + bottom-right clipped (mirrored, used for ranked card)
'all'    → all 4 corners clipped (stamps, badges)
```

**React Native implementation (since `clip-path: polygon()` doesn't exist):**

Option A (recommended): use `react-native-svg`. Render the card body as `<Svg><Polygon points="..." fill="..." /></Svg>` with the path as the chamfer polygon. Children sit inside an absolutely-positioned `<View>` aligned to the polygon's bounding box.

Option B: use the `react-native-shape-clip` or `@shopify/react-native-skia` library for true clip-paths.

Option C (last resort): approximate with `borderRadius` on two corners — visually different, only acceptable as a placeholder.

**`GlassCard` additions:**
- Background: `KS.glass` over a `<BlurView intensity={20} tint="dark">` (expo-blur)
- 1 px gradient stroke in `KS.hair` (use SVG `<Polygon stroke=>` along the chamfered edge)
- Use `chamferSize` = 8–14 px depending on card size

### 4.5 · `PrimaryButton`

The dominant CTA. Pill-shaped, electric blue, glow-pulses.

- Height `60` (large) or `48` (medium)
- Background: linear-gradient 180° `#1e90ff 0% → #007bff 55% → #0062cc 100%`
- Border-radius: half the height (full pill)
- Inner shadow: `inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 2px 0 rgba(0,0,0,0.3)`
- Glow pulse (Reanimated): scale shadow radius 0 ↔ 32 px over 2.4 s
- Shimmer sweep (optional): 40%-wide white gradient translates from -120% to 220% over 3.4 s
- Press: scale 0.96, 100 ms

Sub-label option: a small mono caption beneath the main label (e.g. `TAP TO DEPLOY`).

### 4.6 · `SecondaryButton` (Ranked / outline)

- Transparent fill, **1.5 px solid amber stroke** (`KS.alert`)
- Same pill shape, height 52
- Label in display font, amber color

### 4.7 · `DangerButton` (Abort)

- Solid `KS.danger` fill, height 48, pill-shaped
- `box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset, 0 4px 14px rgba(255,59,48,0.45)`

### 4.8 · `ProgressBar`

Segmented bar — N small filled rectangles on a dark track.

- Default: 24 segments, 10 px tall, neon green fill, 2 px padding, 2 px gap between segments
- Each filled segment glows: `box-shadow: 0 0 6px #39ff14`
- Empty segments: `rgba(255,255,255,0.04)`
- Optional `label` / `sublabel` row above (mono eyebrow + value on the right)

### 4.9 · `BottomNav`

64 px content + 28 px home-indicator padding. 4 items: HOME · MODES · SHOP · AGENT.

- Background: linear-gradient 180° transparent → `rgba(0,0,0,0.55)` 40% → `rgba(0,0,0,0.9)` over a `<BlurView>`
- Active item: primary blue color, 2 px-thick 22-px-wide indicator bar above the icon at bottom 26 px, with a `0 0 8px primary` glow
- Inactive: `KS.inkDim`
- Icons in `react-native-svg` — paths in `reference/killspy-shared.jsx → NAV_ICONS`
- SHOP badge: small neon-green pill with count `3`, positioned top-right of the icon

### 4.10 · `NotificationPill`

`◉ N` chip — green glowing dot + integer in mono, on dark surface.

### 4.11 · `Currency`

Inline value chip. Two kinds:
- `coin` → `◈` glyph in `KS.alert`, value in mono white
- `gem`  → `✦` glyph in `KS.live`, value in mono white

Background: `rgba(0,0,0,0.35)` over chamfered `tr-bl` clip, 1 px `hairSoft` border.

### 4.12 · `SectionLabel`

`[ MISSION BRIEF ]`-style header row. 14-px horizontal hairline + label in mono 10 px, letter-spacing 0.32em, in a colorable accent (primary / alert / live). Right-side fades to transparent.

### 4.13 · `PlayerTag`

Compact identity chip: hex avatar + name (display font 18 px) + small rank badge + mono eyebrow `WR 62% · K/D 2.4`.

### 4.14 · `ActionCard` (game HUD)

**The most important game-specific component.** Three of these per player, every round. See §5.4 for game mechanics.

- Size: `96 × 128` px, chamfered `tr-bl` corners 10 px
- **Face-up (mine):** amber gradient fill `linear-gradient(165deg, #ffd84a 0% → #ffc107 55% → #c79504 100%)`
  - Stenciled black glyph centered (FIRE bullet / RELOAD circular arrow / SHIELD outline) — see SVG paths in `KSActionIcons` in `reference/killspy-screens-b.jsx`
  - Stencil label below in 16 px display: `FIRE` / `RELOAD` / `SHIELD`
  - Mono sub-caption: `COST 1 AMMO` / `+1 AMMO` / `BLOCK FIRE`
  - Two corner ticks (top-left + bottom-right) for "stamped card" feel
- **Selected state:**
  - 6 px outer chamfered border-glow in `linear-gradient(135deg, primary → diamond)`, pulsing
  - Small `LOCKED` mono stamp top-right (in `KS.primary`)
- **Face-down (opponent):** darker amber `linear-gradient(165deg, #c89205 → #8a6404 → #5a4202)`, diagonal hatch pattern, big `?` glyph, `CLASSIFIED` caption
- **Disabled (FIRE when ammo = 0):** grayscale 0.8, brightness 0.55, red ⊘ overlay at center

### 4.15 · `Countdown` (game HUD)

The 5-second turn timer at the screen center.

- 132 × 132 px outer
- SVG ring: radius 60, stroke-width 3, `strokeDasharray = 2πr`, `strokeDashoffset = (1 - value/max) · 2πr`, transition `800 ms linear`
- Ring color: `live` when `> 3`, `alert` at `3`, `danger` at `≤ 2`
- Drop-shadow on stroke matching its color
- 12 tick marks around the outside (every 30°), bigger every 3rd
- Inner: 84 × 84 hex (clip-path) of `surface` gradient + 76 × 76 inner ring border in the urgency color
- Center text: 46 px mono number, `0 0 12px primary` (or red when ≤ 2 with blink animation), small `SEC` mono caption below

### 4.16 · `Lives`

3 small hex tokens, 22 × 22 px each.

- Alive: red gradient interior `linear-gradient(160deg, #ff6b6b, #ff3b30)` with a small white heart glyph centered
- Dead: dark interior with faint X glyph in `inkFaint` strokes

### 4.17 · `Ammo`

Bullet pip track — 6 thin vertical rectangles (3 × 14 px) inside a chamfered chip, plus `count/max` mono readout at the end.

- Active pips: `KS.alert` (or `KS.primary` for self / `KS.enemy` for opponent), with a 4-px glow
- Inactive pips: `rgba(255,255,255,0.08)`

### 4.18 · `Status` chip

Small status indicator with icon + label.

| Kind | Icon | Color | Label |
|---|---|---|---|
| `empty`    | `⊘` | `danger` | `NO AMMO`  |
| `armed`    | `◉` | `alert`  | `ARMED`    |
| `thinking` | `⌛` | `inkDim` | `THINKING` |
| `locked`   | `✓` | `live`   | `LOCKED`   |

### 4.19 · `TopoBg`

The full-screen background atmosphere. Stack of 4 layers:

1. Solid `KS.bg`
2. Dot grid: 14 × 14 px tile, 1 px white-5%-opacity dots
3. Soft blue blobs: radial gradients at 22% 18% and 88% 92%
4. Topographic rings: SVG pattern, 120 × 120 px tile, 3 concentric circles per tile, opacity 5%
5. CRT scanline overlay: 3-px-tall horizontal lines `mix-blend-mode: multiply`, opacity 50% — **drop on RN** (no blend modes) or substitute with a very faint repeating linear-gradient

---

## 5 · Screens

> Each screen below: **purpose · layout · components · interactions · content**.
> All screens assume a 402 × 874 logical pixel canvas (iPhone 16 Pro–ish). Use `useWindowDimensions()` and scale.

### 5.1 · `SplashScreen` (loading)

**Purpose:** App boot. Stays for the duration of asset loading.

**Layout (top → bottom):**
- ~70 px in: mono row `DOSSIER · B-2747` (left) / `● CLEARANCE 4` (blinking, right)
- 38%-vertical: `// MIMIR STUDIO PRESENTS` eyebrow → animated **KILLSPY** wordmark (84 px) → mono `[ CLASSIFIED · INTEL ]` → rotated 2 px-bordered **TOP SECRET** stamp (-6° tilt, scale-in animation)
- bottom 96 px: progress bar with title row `// LOADING MISSION ASSETS` + `67%` → 28-segment bar → mono status line with check marks + blinking arrow `› DECRYPTING MAP`
- bottom 44 px: `MIMIR STUDIO · v1.0.26 · BUILD 0524`

**Behind everything:**
- `TopoBg` at intensity 1.2
- Slow radar sweep (6 s rotation) at 50% center
- Concentric SVG range rings, 18% opacity

**Animations:**
- Logo: stagger letters in (220 ms each, 60 ms apart)
- TOP SECRET stamp: `stamp-in` 700 ms after letters complete
- Progress bar: drive from `0` to actual asset-loading progress (or animate to `100%` over 2.4 s if no real loading)

**Navigate:** to `Home` once `progress === 1`.

### 5.2 · `HomeScreen` (lobby)

**Purpose:** Player home. Choose Quick Play or Ranked, see dailies, see leaderboard.

**Layout:**
- **Top bar (60 px in):** left = hex avatar 48 px + name `AGENT_KILO` + small rank badge + `AGENT · 1,847` mono; right = coin chip + gem chip + notification bell icon with green count badge
- **Hero — Quick Play card** (full-width, 168 px tall, chamfered `tr-bl` glass)
  - Corner ticks in `KS.hair`
  - Faint spy silhouette SVG bottom-right (12% opacity, in `KS.primary`)
  - Mono live row: `● LIVE · 24,387 AGENTS DEPLOYED` (live green dot)
  - Display 38 px `QUICK PLAY` (LH 0.92)
  - Mono `4V4 · CASUAL · 2–5 MIN`
  - Primary button `DEPLOY` with sub `TAP TO DEPLOY` (full-width)
- **Ranked Ops card** (92 px tall, chamfered `tl-br` mirrored)
  - **4 px-wide left edge stripe** in `linear-gradient(180deg, alert → diamond)` with `0 0 16px alert` glow — this is the visual cue that distinguishes ranked from quick play
  - Rank badge (tier 3) + display 22 px `RANKED OPS`
  - Mono `SEASON 02 · ENDS IN 18D 04H` (with amber accent)
  - Mono `+28 RP TO NEXT TIER` in diamond color
  - Right-side chamfered 38 px tap target with `›` chevron in amber
- **Daily Missions strip**
  - Section label `Daily Missions · 2/4` + reset countdown right-aligned
  - Horizontal scroll of `MissionChip` (158 × 92 px, chamfered, displays title / reward in mono `+120 XP` / 4-px progress bar at bottom). Completed missions get a green tinted background + `✓ COMPLETE` label.
- **Leaderboard teaser** (100 px, chamfered glass)
  - Title `WEEKLY LEADERBOARD` (display 14 px) + `VIEW ›` right-aligned
  - 3-column grid of top 3 entries: rank `#1` mono in tier color, name (display 12 px), score (mono live-green)
- **Bottom nav** — HOME active

**Interactions:**
- Tap DEPLOY → `Matchmaking` screen (quick play)
- Tap Ranked card → ranked matchmaking variant (same matchmaking screen with a `mode='ranked'` prop)
- Tap a mission chip → mission detail modal (not designed — propose a simple bottom sheet)
- Tap leaderboard teaser → `Leaderboard` screen
- Tap bell → notifications drawer (not designed)

### 5.3 · `MatchmakingScreen`

**Purpose:** Search for an opponent. Cancellable.

**Layout:**
- **Top eyebrow (64 px in):** mono `● MATCHMAKING · ESTABLISHED 00:08` (blinking amber dot) → display 26 px `SEARCHING FOR TARGET` → mono `SECTOR 7 · ENCRYPTED CHANNEL OPEN`
- **Radar** (300 × 300 px, centered horizontally, 168 px from top)
  - SVG with radial-gradient fill (primary 18% → 0% at edge)
  - Concentric rings at r=140, 100, 60, 24 (decreasing opacity)
  - Horizontal + vertical centerlines, primary 18%, dashed
  - 4 amber blip dots scattered around (some at 60% opacity, some full)
  - **Rotating sweep beam** (2.4 s linear infinite): a `conic-gradient(from 0deg, rgba(57,255,20,0.35) → transparent at 70°)` rotating from center
  - **Center pulse:** 12 px solid green circle with `0 0 14px live` glow + an expanding `radar-ping` border (ease-out 1.6 s infinite)
  - Compass marks N/E/S/W at r=152, mono 9 px, `KS.inkDim`
- **Player card preview** (88 px tall, chamfered glass, 484 px from top): your own `PlayerTag` `(big, live=true)` left + right-aligned mono `MATCHES` / `284`
- **Hint band** at 124 px from bottom: mono `› AGENTS IN POOL: 1,284 · AVG WAIT: 00:14`
- **Abort button** at 52 px from bottom: full-width `DangerButton` `ABORT MISSION`

**Animations:**
- Radar sweep + center ping run continuously while on screen
- Optional: pop blip dots in as they're "discovered" (every ~1.2 s, fade-in 220 ms, fade-out 800 ms)

**Interactions:**
- Tap ABORT → confirm modal → back to Home
- On match found (server event) → navigate to HUD with the matched-opponent payload

### 5.4 · `HUDScreen` — **CRITICAL: turn-based mechanic**

**Game mechanic (must implement exactly):**

1. Each player has **3 lives** (hearts).
2. Each player carries an **ammo counter** (0–6, starts at some default — propose `2`).
3. Every **5 seconds**, a "turn" resolves. Both players choose **one of three cards** before the timer hits 0:
   - **FIRE** — consumes 1 ammo. If opponent didn't pick SHIELD this turn, opponent loses 1 life.
   - **RELOAD** — +1 ammo (max 6). Defenseless this turn.
   - **SHIELD** — blocks any incoming FIRE this turn. Doesn't consume ammo.
4. If FIRE is selected but ammo = 0, the action **misses** (treat as a no-op; show a small "MISFIRE" toast).
5. Simultaneous resolution: both players' actions resolve at the same instant. Then a new 5 s turn starts.
6. First player to **0 lives loses**.

**Layout (top → bottom):**
- **Eyebrow** (60 px in): `// LIVE OPS · ROUND 07` (left, mono primary) + `● REC · 02:47` (right, mono live, blinking dot)
- **Opponent zone** (96 px from top, 0 padding):
  - Header strip: opp hex avatar 36 px + display name `SHADOW_09` + small rank badge + mono `OPPONENT` in enemy color · right side: `Status: THINKING ⌛` chip
  - 3 face-down `ActionCard`s in a row (gap 8 px, centered)
  - Info row: opponent `Ammo` track (enemy color) · `Lives` (3 hearts) · `Status` chip (`empty`/`armed` based on their ammo)
- **Center countdown** (vertically centered): mono `RESOLVING IN` → `Countdown` component → mono `LOCK YOUR ACTION` (blinks when countdown ≤ 2)
- **Self zone** (anchored 64 px from bottom):
  - Info row: own `Status` chip (locked/armed/empty) · `Lives` · own `Ammo` track (primary color)
  - 3 face-up `ActionCard`s, the locked one with glow + LOCKED stamp
  - Footer strip: own hex avatar (live=true) + name `AGENT_KILO` + mono `YOU` (primary) · right side: chat-bubble icon button 34 px chamfered

**State (Zustand example):**

```ts
type Card = 'fire' | 'reload' | 'shield';
interface MatchState {
  round: number;
  countdownMs: number;        // ticks 5000 → 0
  my:  { ammo: number; lives: number; locked: Card | null };
  opp: { ammo: number; lives: number; locked: Card | null };
  resolving: boolean;         // briefly true during the reveal animation
}
```

**Turn loop:**

```
setInterval (every 50 ms):
  countdownMs -= 50
  if countdownMs <= 0:
    resolving = true
    server says what each player picked
    apply resolution rules (see §5.4 above)
    play reveal animation: flip opp cards, show damage hits
    after 800 ms: reset countdownMs = 5000, locked = null on both sides
    round++
```

**Animations:**
- Countdown ring stroke-dashoffset animates linearly each second
- Selected card scale-up 1.02 + glow pulse
- Damage hit: opponent/own hex life token shakes red + flashes, then renders as "dead"
- Reveal (turn boundary): opponent's 3 face-down cards flip-rotate-Y 180° to reveal which was their pick, then the picks resolve and only the selected card "executes" (FIRE → bullet shoot toward opponent etc., SHIELD → shield ripple). Lottie is great here.

### 5.5 · `EndMatchScreen` (win + lose)

**Purpose:** Debrief. Two variants share the layout; only colors + copy + animation intensity differ.

**Variant matrix:**

|                  | WIN              | LOSE             |
|---|---|---|
| Accent          | `KS.alert` (gold) | `KS.danger` (red) |
| Stamp text     | `MISSION COMPLETE` | `MISSION FAILED` |
| Sub-line       | `TARGET ELIMINATED · OBJECTIVE SECURED` | `AGENT KIA · INTEL COMPROMISED` |
| XP            | `+1,840` in live green w/ glow | `+420` in inkMute |
| RP             | `+28 RP` in live | `−15 RP` in danger |
| Confetti       | ✓ (50 particles) | ✗ |
| Burst lines   | ✓ at 40% opacity | dimmed |
| Glow pulse on CTA | ✓ | ✗ |
| Bg gradient    | warm gold | cold red |

**Layout:**
- Eyebrow `// DEBRIEF · OP NIGHTFALL` (+ `· REDACTED` on lose)
- Stamp at 124 px: 3 px-bordered chamfered box, rotated -5°, accent-glow shadow
- XP card at 280 px: glass card 132 px tall, `XP EARNED` label + huge mono number on right · then `RANK PROGRESS · AGENT III` mono row with `+28 RP` / `−15 RP` delta · 26-segment progress bar
- Stats grid at 432 px: 4 chamfered pods (KILLS / DEATHS / ACCURACY / MVP), each with a 2-px colored top stripe, mono label, big mono value
- CTAs at bottom: `PrimaryButton` (`CONTINUE` or `REMATCH`) + 2 secondary buttons (`REPLAY` + `HOME`)

### 5.6 · `ProfileScreen`

**Purpose:** Agent identity and customization.

**Layout:**
- Eyebrow `// AGENT FILE` + display `DOSSIER` (left), 2 chamfered 36 × 36 icon buttons (right): ⚙ settings, ↗ share
- **Avatar showcase card** (188 px, glass `hi` intensity): radial spotlight + huge 108 px hex avatar centered top + bottom row: name (display 22) · small rank badge + `AGENT · 1,847 RP` · right `LVL 47` mono
- **Stats strip** at 332 px: 4 pods — K/D · WIN % · MATCH · STREAK
- **Rank sparkline** at 402 px: 64 px chamfered card with `30 DAYS` mono + huge `+312` mono live-green + 200 × 36 SVG sparkline (path + area fill gradient)
- **Skins grid** at 484 px: section label `Loadout · Skins · 3/12`, 3-column grid of skin cards
  - Card 96 px tall, chamfered, rarity-colored 1 px border. Equipped card has live-green border + `EQ` corner badge.
  - Locked: grayscale + padlock SVG centered
- Bottom nav, AGENT active

**Rarity → border color:** `common → inkMute`, `rare → primary`, `epic → #a040ff`, `legendary → alert`.

### 5.7 · `LeaderboardScreen`

**Purpose:** Rankings.

**Layout:**
- Eyebrow `// INTEL · WEEK 12` + display `LEADERBOARD`
- Tab strip: `GLOBAL` (active = filled primary, others = outlined dark)
- **Podium** (200 px tall): 3 columns, the center column slightly wider (1 / 1.15 / 1)
  - Each column: hex avatar (size 56 for #1, 44 for #2/#3) → display name → mono score in tier color → pedestal block sized 100% / 78% / 64% of column height, chamfered, tier-colored border, big mono `#N` centered with glow. #1 has a small crown SVG on top.
- **Compact list** below: scrollable rows. Each row: `#N` mono → hex avatar 28 px → name (display 13) + rank name (mono 9) → score (mono 13) → delta `+12` / `−1` in live / danger / inkDim
- **Pinned own rank** at 100 px from bottom: small `// YOUR POSITION` eyebrow + same row component with `self={true}` (primary blue tint + primary border)
- Bottom nav, AGENT active (or its own nav state)

### 5.8 · `ShopScreen` (Daily Drop)

**Purpose:** Daily-rotating storefront with dual currency (coins for grind, gems for premium).

**Layout:**
- Header at 60 px in: `// MARCHÉ NOIR` eyebrow + display `BLACK MARKET` (left); coin + gem chips top-right
- **Daily-reset banner** below header: chamfered row with 2 px amber left edge, mono `DAILY DROP · ROTATES IN` + big mono `14:22:01` countdown in live green
- **Tab strip** at 178 px: `FEATURED · SKINS · WEAPONS · BUNDLES`
- **Scrollable body** starting at 220 px:
  - **Featured deal hero card** (168 px tall, horizontal layout): big rarity-bordered card, large left graphic (44% width), right side has rarity label + display name + multi-line mono description + price row at bottom (old price strikethrough + new price + currency icon + chamfered amber BUY button). Sale stamp `−33%` cuts across top-right.
  - Section label `Today's Lineup · 6 items` + `VIEW ALL ›`
  - **2-column grid** of `ShopCard`s (200 px each):
    - Rarity-colored 1 px border + matching 3 px top stripe glow + radial-gradient rarity tint behind the graphic
    - Graphic centered (placeholder SVGs in `KSItemPlaceholders`: `agent` silhouette, `weapon` pistol shape, `emote` smiley, `bundle` stacked dossiers, `crate` hex crate)
    - Bottom: rarity label (mono 9 px, rarity color) + name (display 14) + price row
    - Buy button is a small chamfered amber chip
    - Modifiers: `salePct` → red ribbon top-right; `owned` → full-card overlay with `✓ OWNED` rotated stamp in live; `soldOut` → `SOLD OUT` red stamp
  - Footer mono `// ALL TRANSACTIONS LOGGED · MIMIR LEDGER`
- Bottom nav, SHOP active

**State:**

```ts
interface ShopItem {
  id: string;
  kind: 'agent' | 'weapon' | 'emote' | 'bundle' | 'crate';
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  currency: 'coin' | 'gem';
  price: number;
  oldPrice?: number;     // when on sale
  salePct?: number;
  owned?: boolean;
  soldOut?: boolean;
  featuredUntil?: number; // unix ms
}
interface ShopState {
  rotatesAt: number;          // unix ms, drives the live countdown
  featured: ShopItem;         // hero
  items: ShopItem[];          // 6 placeholders
  coins: number;
  gems: number;
}
```

The countdown is **live** — recompute every second from `rotatesAt - Date.now()` and format as `HH:MM:SS`.

---

## 6 · React Native translation notes (where the prototype lies)

| Web feature in prototype | RN equivalent |
|---|---|
| `clip-path: polygon()` | `react-native-svg` `<Polygon>` for shape; or `<MaskedView>` for clipping children. **Required for:** hex avatars, chamfered cards, hex action pads. |
| `backdrop-filter: blur()` | `<BlurView>` from `expo-blur`. |
| `box-shadow` | `shadowColor / shadowOffset / shadowOpacity / shadowRadius` on iOS, `elevation` on Android. For *glows*, use an absolutely-positioned blurred View underneath (radial-gradient via SVG `<RadialGradient>`). |
| `linear-gradient` / `radial-gradient` | `expo-linear-gradient` or `react-native-svg`'s gradient primitives. |
| `mix-blend-mode` | **Not supported.** Drop CRT scanlines, or fake it with a low-opacity overlay. |
| `letter-spacing: 0.32em` | RN supports `letterSpacing` but only as absolute px. Convert: `letterSpacing = fontSize * 0.32`. |
| `text-shadow` | Use `react-native-text-gradient` or a layered approach. For most cases, the design's `text-shadow: 0 0 12px primary` glow can be skipped — it reads fine without on RN. |
| CSS `@keyframes` | Reanimated 3 `useSharedValue` + `useAnimatedStyle`. The keyframes are listed in §3.5 and named in `reference/killspy-shared.jsx`. |
| `cursor: pointer` | Drop (no mouse). Use `<Pressable>` with `android_ripple` + `onPressIn` scale-down. |
| `position: absolute; inset: 0` | `StyleSheet.absoluteFill` |
| Pan/zoom canvas (`design_canvas.jsx`) | Not part of the app — it's just for the prototype viewer. **Ignore.** |
| `IOSDevice` frame  | Not part of the app — it's a visual wrapper. **Ignore.** |
| `TweaksPanel`     | Not part of the app — design-system tweaking only. **Ignore.** |

---

## 7 · Copywriting style

| Element | Tone |
|---|---|
| Display headers | UPPERCASE, terse, militaristic-but-playful: `DEPLOY`, `RANKED OPS`, `SEARCHING FOR TARGET` |
| Mono eyebrows | `// PREFIXED` like a code comment — `// MISSION BRIEF`, `// AGENT FILE`, `// MARCHÉ NOIR` |
| Status copy | Brackets + UPPERCASE: `[ CLASSIFIED · INTEL ]`, `[ ARMED ]` |
| Numbers | Always tabular-num in JetBrains Mono. Comma thousand separators (`1,847`). |
| Time | Always `HH:MM:SS` or `MM:SS` in mono. |
| French flavor | Sparingly. Used as mono accents (`// MARCHÉ NOIR`, secondary theme names). UI itself is English. |

---

## 8 · Accessibility

- Touch targets: never below 48 × 48 px (already enforced in designs).
- Contrast: white-on-dark is fine. Amber on dark = ~7.5:1. Green on dark = OK at 14 px+ only; avoid for body copy.
- `accessibilityLabel` on all icon-only buttons.
- Reduced motion (`AccessibilityInfo.isReduceMotionEnabled`): disable `glow-pulse`, `radar-sweep`, `shimmer`, and `letter-in` animations. Keep functional motion (countdown ring).
- Numbers + states should have non-color cues (lives use shape change in addition to color; ammo uses count text).

---

## 9 · Performance notes

- SVG-heavy screens (Matchmaking radar, HUD countdown, every chamfered shape) — render once, animate via `transform` only. Don't recreate `<Polygon>` paths every frame.
- Use `useMemo` for the static SVG shapes per screen.
- Heavy blur (`<BlurView>`) is a known perf hit on Android — keep blur surfaces small (header strips, glass cards) and avoid full-screen blur.
- Memoize the action card list in `HUDScreen` — the countdown ticking shouldn't re-render the cards.

---

## 10 · Files in this bundle

```
design_handoff_killspy/
├── README.md                      ← you are here
└── reference/
    ├── index.html                 ← open in browser to view all 9 screens
    ├── killspy-shared.jsx         ← TOKENS + all primitives (HexAvatar, GlassCard, Logo, etc.)
    ├── killspy-screens-a.jsx      ← Splash, Home, Matchmaking
    ├── killspy-screens-b.jsx      ← HUD, EndMatch, Profile, Leaderboard, Shop
    ├── killspy-app.jsx            ← canvas wiring (ignore for the real app)
    ├── design-canvas.jsx          ← canvas viewer (ignore for the real app)
    ├── ios-frame.jsx              ← visual phone bezel (ignore for the real app)
    └── tweaks-panel.jsx           ← design-time controls (ignore for the real app)
```

To preview, open `reference/index.html` in any modern browser (Chrome/Safari/Firefox). The 9 artboards are laid out on a pan/zoom canvas; click the expand icon next to each label for fullscreen view. Arrow keys navigate between screens in fullscreen.

---

## 11 · Suggested build order

1. **Theme + fonts** — load Barlow Condensed, Rajdhani, JetBrains Mono. Stub `App.tsx` with a `KS` color check page.
2. **Primitives** — `ChamferContainer`, `GlassCard`, `HexAvatar`, `RankBadge`, `Logo`, `PrimaryButton`, `SecondaryButton`, `ProgressBar`, `TopoBg`. Verify each against the reference HTML side-by-side.
3. **Splash + Home** — verifies primitives compose correctly. Test on a real device for the BlurView perf.
4. **Matchmaking** — first screen with continuous animations.
5. **HUD** — the most complex. Build state + turn loop **first**, then layer in animations.
6. **EndMatch (both variants)** — easy once stats components exist.
7. **Profile, Leaderboard, Shop** — pattern-similar list/grid screens.
8. **Polish pass** — haptics on every primary action, sound stubs, reduced-motion fallbacks.

---

## 12 · Open questions for the team

Before final implementation, please confirm:

- [ ] **Server protocol for HUD turns.** What event shape comes back from the server when both players' locks are revealed? (`{round, my:{card,ammo,lives}, opp:{card,ammo,lives}, hits:[…]}` is the assumed shape — adjust if different.)
- [ ] **Initial ammo per match.** Currently designed assuming 2.
- [ ] **Ammo max.** Designed for 6.
- [ ] **Number of lives per match.** Designed for 3.
- [ ] **Daily shop rotation timezone.** Server UTC midnight is assumed; the countdown UI is timezone-agnostic.
- [ ] **Are skins purely cosmetic, or do they affect stats?** Design assumes purely cosmetic.
- [ ] **Friend / party system.** Not in this design pass — surface for a follow-up.
- [ ] **Settings, audio, language picker.** Stubbed as a ⚙ icon on profile; not designed in detail.
