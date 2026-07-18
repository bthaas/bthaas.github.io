# The Atlas Comes Alive — Awwwards Upgrade Plan

**Concept in one line:** keep every plate, every color, every word of the Icarus
editorial atlas — and make scrolling through it feel like the atlas is being
printed, lit, and flown in real time.

The theme and the artwork are the identity and they do not change. What changes
is that the page stops being a static document and becomes a choreographed
reading experience: type that arrives like a letterpress impression, plates that
breathe with depth, chapters that wipe in like turned pages, and a sun that
tracks your descent from ambition to horizon.

---

## 1. Where the site stands today

Strong foundation — this is already a coherent, disciplined design:

- Distinct identity: cream paper + grain, Iowan/Baskerville display serif at
  aggressive negative tracking, tiny uppercase wayfinding labels, 12-column
  editorial grid, painterly Aegean plates, color-blocked chapters
  (citron / dusk / cobalt).
- Real content with verified numbers (616K+, 28.9%, 55%, 99.5%).
- Excellent bones: AVIF/WebP pipeline, static export, zero client JS
  (`scripts/strip-static-runtime.mjs`), a11y basics (skip link, focus rings,
  reduced-motion kill switch), tested media contract.

The gap to Awwwards is **motion, depth, and micro-craft** — currently the only
choreography is one CSS `view()` fade-up (`.frame-reveal`). Everything else is
inert: headlines sit, metrics sit, plates are flat `<img>`s, section boundaries
are hard cuts, hovers are a single underline pattern.

Dead weight to clean up: `SiteGate` (unused client component with a hardcoded
password), `_legacy/`, root-level `portfolio.jsx` / `index.html` / `vite.config.js`.

## 2. What the reference sites actually teach

| Site | Signature | Transferable lesson |
|---|---|---|
| shader.se | Retro-OS world with BIOS loader, CRT post-processing | Total commitment to one concept; the loader *is* the brand; every pixel in-world |
| vincent-lowe.info | Scroll-scrubbed liquid image transitions, frosted mono captions | The scrollbar is a timeline you scrub, not a way to move a document; images are a continuous material |
| longshotfeatures.com | Vertical scroll drives a horizontal "visual index"; character loader | One spatial metaphor carried end-to-end; playful progress feedback |
| cyphers-final-round | Game-grade branded loading, 3D showcase | Production polish on the first 3 seconds |

Common DNA: **(1)** a considered entrance, **(2)** scroll-scrubbed narrative
choreography, **(3)** images treated as living material (parallax/distortion/
reveal), **(4)** kinetic typography, **(5)** bespoke cursor + hover micro-
interactions, **(6)** flawless perf/a11y under all of it.

We adopt the DNA, not the skins. No CRT, no liquid WebGL melt, no horizontal
site — those belong to their concepts. Ours is *an atlas of the Icarus flight*.

## 3. The narrative spine

The page already tells a story in order: rising sun → workshop → dusk flight
log → field studies → calm horizon. We make scroll position literally trace
that arc:

> **A small sun glyph in the header travels a shallow arc as you scroll the
> page — rising through Craft, peaking at Trajectory, descending through Work,
> and settling on the horizon line at Contact.**

That one persistent element (cheap: one SVG + scroll progress) turns navigation
into storytelling and is the kind of detail juries remember. It doubles as
scroll progress and active-section indicator.

## 4. Architecture decision: motion stack

> **Superseded — July 17, 2026.** The owner-approved **“GSAP + ScrollTrigger +
> Lenis Motion System Upgrade” brief** supersedes this section's original
> no-GSAP/no-Lenis recommendation. The shipped CSS/vanilla phase remains the
> static and reduced-motion baseline, while `gsap`, the approved GSAP plugins,
> ScrollTrigger, and Lenis now form the progressive-enhancement motion core in
> `atlas.js`. The static export still ships no React runtime, Lenis is driven by
> the GSAP ticker with native touch behavior, and the global reduced-motion
> kill switch remains authoritative.

**Historical recommendation (completed and shipped): no framework runtime, no
GSAP, no Lenis. CSS scroll-driven animations first, plus one hand-authored
vanilla module (~8–10 KB gz).**

Rationale:

- The site currently ships **zero JS** and paints instantly. That is itself an
  Awwwards signal (judges score performance) and it matches the personal brand
  — "systems that hold up in the real world."
- Everything specced below is achievable with:
  - **CSS scroll-driven animations** (`animation-timeline: view()/scroll()`) —
    already used once; Chromium + Safari 26 support, Firefox gets the static
    layout (graceful).
  - **`position: sticky`** for all pinning (no scroll-jacking, native feel,
    zero jank).
  - **One vanilla file `public/atlas.js`** (authored in `lib/` as tested
    TypeScript modules, bundled by a tiny esbuild step): IntersectionObserver
    reveals + stagger orchestration, metric count-ups, split-text spans,
    rAF parallax fallback, header sun-arc, custom cursor, magnetic links,
    flight-log expanders.
- Native scroll stays native — no smooth-scroll hijack. Recent winners
  increasingly skip it; it's also the accessible choice.
- `strip-static-runtime.mjs` stays, amended to whitelist `atlas.js`.
- Every choreography curve lives in a pure, unit-tested module (the
  `lib/descent-choreography.ts` pattern already in the repo).

Escape hatch: if a P2 showpiece truly needs it (e.g. WebGL grain-dissolve on
the hero), it mounts lazily as an isolated `<canvas>` enhancement behind
feature/motion checks — never a prerequisite for content.

## 5. Section-by-section choreography

### 5.0 Entrance — "the plate is pressed" (first 1.2 s, once per session)
- Cream page is visible immediately (no fake loader, no blank wall).
- **Phase D performance override — July 18, 2026:** the hero plate paints
  immediately instead of running the originally planned entrance `clip-path`.
  This protects the owner-approved LCP ≤ 1.8 s gate; the masthead still rises
  from masked baselines, and the below-fold project/craft plates retain the
  halftone “coming off the press” reveal.
- "Brett Haas" masthead: per-character baseline rise with masked overflow,
  60 ms stagger; meta row and nav fade in last.
- Total ≤ 1.2 s, runs once (sessionStorage), fully skipped under
  `prefers-reduced-motion` and on repeat visits.

### 5.1 Hero — Plate 01
- **Plate parallax:** image is 112% height of its frame and translates at
  ~0.85× scroll speed; caption "Plate 01 / Ambition needs systems" drifts at
  1.05× — two layers of depth from one image, artwork untouched.
- **Slow settle:** plate scales 1.05 → 1.0 across its first viewport of scroll.
- **Masthead release:** hero copy block is sticky for ~40vh then releases —
  the editorial "masthead holds, then the page moves on."
- **Signal strip:** numerals count up (steps easing, ~900 ms) when the strip
  enters; citron digits get a one-frame ink-bleed blur→sharp. Source `<small>`
  labels stagger in after their number lands.

### 5.2 Craft — citron chapter
- **Chapter wipe #1:** citron background enters as a scroll-driven horizontal
  wipe (a fresh page pulled across), not a hard cut.
- **Pinned heading:** "The craft behind the flight." pins (`sticky`) while the
  lede + body scroll past; ghost "01" numeral sits behind at 8% opacity with
  counter-parallax.
- **Plate reveal:** workshop image un-clips from bottom (`clip-path` scrub)
  with internal parallax.
- **Capability ticker:** "Research systems · Production engineering ·
  Human-centered interfaces" becomes a slow marginal marquee along the section
  bottom edge — an atlas margin note in motion. Pauses on hover/focus; static
  list under reduced motion.

### 5.3 Trajectory — dusk chapter
- **Dusk deepens:** section background interpolates `--dusk-deep` slightly
  darker from section top → bottom (scroll-driven custom property — the
  existing `getDescentLighting()` curve finally gets used).
- **Plate:** lighthouse image parallax + slow warmth shift (CSS `filter`
  scrubbed a few degrees — dusk falling as you read).
- **Flight log entries:** per-entry choreography on enter: rule line draws
  scaleX 0→1, index numeral flips odometer-style, then title/summary rise.
- **Hidden depth:** each entry's unused `highlights[]` content becomes an
  expandable dossier — click/keyboard toggles a smooth height reveal showing
  the three bullet achievements + tech tags. Real content, zero new copy
  needed, and it rewards exploration (jury behavior).

### 5.4 Projects — cobalt / citron / dusk chapters
- **Chapter wipes #2–4:** each project chapter's background wipes in with its
  color; direction alternates (L→R, R→L) like page turns.
- **Pinned case masthead:** project title pins briefly; "Case 0N" and the tech
  list slide from opposite edges into lockup.
- **Plate pan:** project art is 115% width of frame and pans laterally as the
  chapter scrolls — "panning across the plate" (our honest answer to
  longshotfeatures' horizontal world; no layout change, copy stays true to
  "no hidden cards").
- **Case copy:** Brief / Approach / Technical focus blocks cascade with rule
  lines drawing between them.
- **Repository link:** becomes a magnetic pill — translates ≤6 px toward
  cursor, arrow nudges ↗ on hover, inverts colors on press.

### 5.5 Contact — the horizon
- **Sunrise finale:** as the ending plate enters, a soft radial glow overlay
  brightens behind the ridge line (blend-mode overlay, artwork intact) and the
  header sun glyph lands on its horizon rule — the arc completes.
- **"Keep building."** word-mask reveal; letter-spacing eases from -0.08em to
  -0.06em across the section (type exhales).
- **Email:** oversized serif link with underline draw + magnetic hover.
- **Footer:** add live Bellevue local time (in-theme: an atlas records
  coordinates); "Back to top ↑" gets a fast eased ascent.

### 5.6 Global micro-craft
- **Custom cursor (desktop, fine pointers only):** small ink dot + trailing
  ring; ring becomes "↗" over external links, "read" over plates, "+" over
  expandable entries. Native cursor never hidden for keyboard/touch; disabled
  under reduced motion.
- **Link underlines:** keep the scaleX pattern but add 30 ms per-item stagger
  when nav appears; active section gets a persistent half-underline.
- **Selection & details:** already have solar selection color; add in-theme
  focus states for new interactive elements; animate `::marker`-free custom
  toggles properly with ARIA.
- **404 page:** themed "This plate is missing from the atlas" with the wing
  mark — juries click around.
- **Live grain:** the fixed noise overlay gets an 8-step `steps()` position
  loop at low opacity (film-grain life for ~0 cost; off under reduced motion).

## 6. Performance & accessibility budget (release gates)

- LCP ≤ 1.8 s (hero AVIF already preloaded), CLS ≤ 0.02, INP ≤ 200 ms.
- Total JS ≤ 100 KiB gz (`atlas.js` only through Phase B/C6; the separately
  budgeted, lazy contact-finale bundle is governed by its own Phase C7 gate).
  No layout thrash: transforms/opacity/clip-path/filter/custom properties only;
  all scrub work compositor-side or GSAP-ticker-batched.
- 60 fps desktop / stable mobile; no effect may block first paint.
- `prefers-reduced-motion`: every effect above degrades to the current static
  site (the existing global kill switch stays the source of truth).
- Keyboard: all new interactive elements (expanders, toggles) fully operable,
  visible focus, correct ARIA; cursor/marquee/parallax are decoration only.
- Firefox receives the full ScrollTrigger choreography. Unsupported-JS and
  no-JS paths retain the current static layout.
- Tests: pure choreography math in `lib/*` unit-tested (existing pattern);
  media contract tests stay green; add DOM tests for expander ARIA states.

## 7. Phased roadmap

**P0 — Motion foundation (the 80% win)**
Build `lib/atlas-motion/*` + `public/atlas.js` bundling step; amend
strip-runtime whitelist. Ship: entrance sequence, split-text masthead reveal,
plate parallax + settle, metric count-ups, IO stagger reveals replacing
`.frame-reveal`, header sun-arc progress. Clean out SiteGate/_legacy/vite
leftovers.

**P1 — Chapter choreography**
Chapter color wipes, pinned craft heading + ghost numerals, clip-path plate
reveals, flight-log rule/odometer entrances, project plate lateral pan, pinned
case mastheads, case-copy cascade.

**P2 — Signature moments & micro-craft**
Flight-log highlight expanders, capability marquee, dusk lighting interpolation,
sunrise finale + sun-arc landing, custom cursor, magnetic links, live grain,
footer local time, themed 404.

**P3 — Submission polish**
Cross-browser QA (Chromium/Safari/Firefox/iOS), Lighthouse 95+ all categories,
reduced-motion audit, OG refresh if hero framing changed, Awwwards submission
copy + captures.

Each phase ends green on `npm run verify` and visually verified in-browser at
desktop + mobile widths.

## 8. What we will NOT do (identity protection)

- No replacement of any plate, color, typeface, or copy voice.
- No WebGL dependency for content; no scroll hijacking; no fake loader delay.
- No horizontal-site restructure; no modal case studies ("no hidden cards or
  modal detours" stays true).
- No motion that runs under `prefers-reduced-motion`.
