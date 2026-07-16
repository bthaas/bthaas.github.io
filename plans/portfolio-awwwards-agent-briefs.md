# Agent Briefs — Awwwards Upgrade ("The Atlas Comes Alive")

Construction plan for executing `docs/AWWWARDS-PLAN.md` as a series of
self-contained agent runs. One step = one PR. A fresh agent must be able to
execute any step from this file plus the files it lists — no prior chat
context.

**Mode:** full git/gh workflow (gh authenticated as `bthaas`).

---

## Shared context (read this block before any step)

Every agent brief below assumes these repo facts:

- **Repo:** `bthaas/bthaas.github.io`, site: https://bretthaas.com
- **Branching:** source code lives on branch **`source`**. `main` is build
  output — never commit to it. Branch from `source`, PR into `source`.
- **⚠️ Deploys:** merging to `source` auto-builds and deploys to production
  (`.github/workflows/deploy.yml`). Every PR must leave the site complete,
  correct, and visually coherent on its own.
- **Stack:** Next.js 16 static export (`output: 'export'`,
  `assetPrefix: '/static-v1'`), React 19 **server components only**.
  `scripts/strip-static-runtime.mjs` (postbuild) deletes ALL `<script>` tags
  from `out/**/*.html` — the shipped site has no framework runtime.
- **Commands:** `npm ci` · dev `npm run dev` · gate `npm run verify`
  (vitest + tsc + next build). `npm run verify` must be green before every PR.
- **Key files:**
  - `components/portfolio/Portfolio.tsx` — the entire page (server component)
  - `app/globals.css` — all styles (split into `app/styles/*` by Step 1)
  - `app/layout.tsx` — metadata, hero preload
  - `content/site-content.ts` — all copy/data (single source of truth)
  - `content/editorial-visuals.ts` — responsive image manifest
  - `lib/descent-choreography.ts` + test — the "pure curve module + vitest"
    pattern all motion math must follow
  - `docs/AWWWARDS-PLAN.md` — the design spec; your step references a section
- **Design tokens:** `--cream #f3efe3` paper, `--ink #11130f`,
  `--cobalt #0d4eb8`, `--citron #d8ef4b`, `--solar #f4bf35`,
  `--coral #f4775f`, `--dusk #393152`, `--dusk-deep #19192b`;
  display serif "Iowan Old Style"/Baskerville; ease
  `cubic-bezier(0.16, 1, 0.3, 1)`.

### Invariants — verified at the end of EVERY step

1. `npm run verify` green.
2. The only JavaScript shipped is `/atlas.js` (Step 1+), **≤ 12 KB gzip**
   (enforced by the postbuild budget gate). No framework runtime returns.
3. `prefers-reduced-motion: reduce` ⇒ behavior identical to the pre-upgrade
   static site (motion off, content complete). Verify in-browser via DevTools
   emulation.
4. Browsers without CSS scroll-driven animations (Firefox) get the static
   layout + basic IO reveals — never broken layout. Spot-check.
5. No artwork, palette, typeface, or copy changes. No scroll hijacking. No
   modal case studies.
6. New interactive elements are keyboard-operable with visible focus and
   correct ARIA.
7. No file exceeds 800 lines.
8. Scroll-linked and continuous animation uses compositor-friendly
   properties only (`transform`, `opacity`, `clip-path`), compositor-side or
   rAF-batched — never scrub `filter`, `background-*`, or any layout
   property with scroll; achieve color/light shifts with opacity-scrubbed
   overlay layers. Discrete, user-triggered transitions (e.g. the Step 5
   dossier expanders) may animate a layout property such as
   `grid-template-rows` when they are ≤400 ms, below the fold or
   self-contained, and a DevTools performance trace shows no dropped frames.
   *(Amended 2026-07-15 — see Amendments.)*

### Dependency graph

```
Step 0 (cleanup) ──────────────┐
Step 1 (foundation) ──► Step 2 ──► Step 3 ──► Step 4 ──► Step 5 ──► Step 6 ──► Step 7 ──► Step 8
```

- Step 0 is independent — run any time before Step 8 (parallel with Step 1 OK:
  no shared files).
- Steps 2–7 all edit `components/portfolio/Portfolio.tsx` and section CSS, so
  they run **serially** (order 2→7 is the intended narrative build-up; 3,4,5
  may be reordered if needed, 7 needs 3's sun module).
- Step 8 runs last.

### Rollback protocol (all steps)

Each step is a single PR. Rollback = `git revert -m 1 <merge-sha>` on
`source` (plain `git revert <sha>` if the PR was squash-merged); CI redeploys
the previous state automatically. Never force-push.

---

## Step 0 — Dead code & repo hygiene

**Model:** default · **Depends on:** nothing · **Parallel with:** Step 1

**Mission:** remove everything the current site does not use, so later steps
work in a clean repo.

**Read first:** shared context above; `package.json`; `vitest.config.ts`;
`deployment.test.ts`.

**Tasks**
1. `grep` for references before each deletion. Expected removals:
   - `components/portfolio/SiteGate.tsx` + `SiteGate.test.tsx` (unused client
     component with hardcoded password; page renders `Portfolio` directly and
     stripped runtime means it could never work). Also remove its
     `construction-*` CSS block from `app/globals.css` if present.
   - `_legacy/`, `dist/`, root `portfolio.jsx`, root `index.html`,
     `vite.config.js`, `src/index.css` (and `src/` if then empty),
     `postcss.config.js` (keep `postcss.config.mjs` — confirm which one
     PostCSS actually loads before choosing).
   - Root-level duplicate images that also exist under `public/`
     (`UVA-Symbol.png`, `refraction.webp`, `scale.webp`) — verify byte-level
     duplicates or unreferenced first.
   - `lucide-react` dependency (confirmed unimported).
2. Keep `deployment.test.ts` and all `content/`, `lib/`, `public/` assets.
3. Update `vitest.config.ts`/`tsconfig.json` includes if they referenced
   removed paths.

**Verification:** `npm run verify`; `git grep -l SiteGate` returns nothing;
`npm run dev` renders the page identically (screenshot before/after).

**Exit criteria:** verify green, zero references to removed files, PR merged.

---

## Step 1 — Motion foundation: `atlas.js` pipeline + CSS split

**Model:** strongest · **Depends on:** nothing (merge before Steps 2–7)

**Mission:** create the entire motion delivery mechanism with zero visible
design change. After this step the site looks the same but has a tested,
budget-gated vanilla-JS enhancement layer and modular CSS.

**Read first:** shared context; `docs/AWWWARDS-PLAN.md` §4 & §6;
`scripts/strip-static-runtime.mjs`; `lib/descent-choreography.ts` + test;
`app/layout.tsx`; `app/globals.css`.

**Tasks**
1. **Source layout:** motion math as pure, unit-tested TS in
   `lib/atlas-motion/` (curves, progress mapping, split-text planning,
   count-up sequencing — no DOM). DOM glue in `src/atlas/` (entry
   `src/atlas/index.ts`), importing from `lib/atlas-motion/`.
2. **Bundle:** add `esbuild` (devDependency) and a `scripts/build-atlas.mjs`
   that bundles/minifies `src/atlas/index.ts` → `public/atlas.js` (ES2020,
   no sourcemap in output). Wire it as the `prebuild` npm script plus a
   standalone `npm run build:atlas`. `prebuild` runs automatically inside
   CI's existing `npm run build` — do NOT edit `deploy.yml`. Add
   `public/atlas.js` to `.gitignore` (generated artifact, never stale, never
   committed).
3. **Budget gate:** in postbuild, fail the build if
   `gzip(public/atlas.js) > 12 * 1024` bytes.
4. **Runtime gates inside atlas.js:** no-op entirely when
   `matchMedia('(prefers-reduced-motion: reduce)')`; feature-detect
   IntersectionObserver; pointer-precision checks (`(pointer: fine)`) guard
   pointer-only features. Expose one `data-atlas` init on
   `DOMContentLoaded`/`defer`. On init (and only when not reduced-motion),
   add class `atlas-js` to `<html>` — the site-wide progressive-enhancement
   marker. Base CSS = full static content; enhancement states hang off
   `html.atlas-js …`. Later steps (2, 5) depend on this marker.
5. **Ship it:** add `<script src="/atlas.js" defer></script>` in
   `app/layout.tsx`. Amend `strip-static-runtime.mjs` to preserve exactly
   that tag (match `src="/atlas.js"`) while still stripping the Next runtime.
   Note: `assetPrefix` only affects `_next` assets; `public/` files serve
   from `/`.
6. **Postbuild contract test:** extend `deployment.test.ts` (or add
   `scripts/postbuild.test.ts`) asserting built HTML retains the atlas tag
   and contains no `_next` script tags.
7. **Core capabilities** (used by all later steps):
   - single passive scroll listener + rAF bus publishing document progress;
   - IO-based reveal orchestrator honoring `data-reveal` /
     `data-reveal-stagger` attributes;
   - `splitText(el)` producing masked per-word/char spans (aria: keep
     original text accessible — `aria-label` on container, spans
     `aria-hidden`);
   - `countUp(el, target, opts)` for the signal strip (Step 2 wires it).
8. **CSS split (no visual change):** break `app/globals.css` (1028 lines)
   into `app/styles/{base,header,hero,craft,experience,projects,contact,motion}.css`,
   imported in that order from `globals.css`. Byte-identical rendering —
   verify by visual diff at 1440px and 390px. Land the split as its own
   commit inside the PR so it reviews as a pure move.
9. Replace the `.frame-reveal` `view()` animation with the dual path: CSS
   scroll-driven where `@supports (animation-timeline: view())`, else
   `data-reveal` IO class from atlas.js.

**Verification:** `npm run verify`; then
`grep -o '<script[^>]*src="[^"]*"' out/index.html` lists exactly one entry
(`/atlas.js`) and `grep -c '/_next/' out/index.html` shows no script
references (image/CSS asset paths are fine); budget gate prints size;
dev-server visual parity screenshots; reduced-motion emulation shows zero
motion; Firefox profile shows intact layout.

**Exit criteria:** invariants pass; page visually unchanged; `atlas.js`
loads and logs nothing; unit tests exist for every `lib/atlas-motion` module;
PR merged.

---

## Step 2 — Entrance sequence + hero choreography

**Model:** strongest · **Depends on:** Step 1

**Mission:** the first 1.2 seconds and the first viewport — plate-press
entrance, kinetic masthead, living hero plate, counting metrics.
Spec: `docs/AWWWARDS-PLAN.md` §5.0–§5.1.

**Read first:** shared context; plan §5.0–§5.1; `lib/atlas-motion/*`;
`src/atlas/index.ts`; `app/styles/hero.css`; hero JSX in
`components/portfolio/Portfolio.tsx`; media tests in
`components/portfolio/Portfolio.scroll.test.tsx` (their assertions must stay
green — hero img keeps `fetchpriority=high`, no `loading=lazy`).

**Tasks**
1. **Entrance (once per session):** hero plate `clip-path` inset wipe upward
   (~700 ms), one-step grain flicker, then "Brett Haas" per-character masked
   baseline rise (60 ms stagger) via `splitText`, then meta row + nav fade.
   Total ≤ 1.2 s. Guard with `sessionStorage('atlas-entered')`; repeat visits
   and reduced-motion render the final state instantly. Progressive
   enhancement via Step 1's `html.atlas-js` marker: default (no-JS) state is
   the fully revealed page; entrance start-states apply only under
   `html.atlas-js` and atlas.js plays them immediately on init. If a
   flash-of-revealed-content appears before init, fix by moving the class
   toggle earlier (still inside atlas.js), never by hiding content in base
   CSS.
2. **Plate parallax:** hero image sized 112% of frame height, translated at
   ~0.85× scroll via CSS `animation-timeline: view()` (fallback: rAF bus).
   Caption drifts at ~1.05×. Plate scales 1.05→1.0 over the first viewport.
3. **Masthead release:** hero copy block sticky for ~40vh then releases
   (`position: sticky` only).
4. **Signal strip:** IO-triggered `countUp` for `616K+`, `28.9%`, `55%`,
   `99.5%` (parse prefix/suffix from `content/site-content.ts` values —
   don't hardcode); ~900 ms stepped easing; `<small>` sources stagger in
   after. Numbers must render complete without JS and under reduced motion.
5. New curves (parallax mapping, entrance timeline offsets, count-up easing)
   live in `lib/atlas-motion/hero-choreography.ts` with vitest coverage.

**Verification:** `npm run verify`; browser: entrance plays once then never
again in session; hard-reload with reduced-motion = static; disable JS =
fully readable page with correct metric values; CLS during entrance ≤ 0.02
(DevTools performance trace); media contract tests green.

**Exit criteria:** invariants; entrance ≤1.2 s; hero LCP unchanged (±10%);
PR merged.

---

## Step 3 — Header sun-arc: progress, wayfinding, narrative

**Model:** default · **Depends on:** Step 1 (serial after Step 2 — shared
files)

**Mission:** the signature persistent element — a small SVG sun glyph
traveling a shallow arc across the sticky header, tracking document scroll:
rising through Craft, peaking at Trajectory, descending through Work,
settling on a horizon rule at Contact. Doubles as scroll progress + active
section indicator. Spec: plan §3, §5.6 (nav notes).

**Read first:** shared context; plan §3; header JSX in `Portfolio.tsx`;
`app/styles/header.css`; scroll bus + IO utilities from Step 1.

**Tasks**
1. Inline SVG in the header (server-rendered, `aria-hidden`, ~24px): sun disc
   + a subtle arc path + horizon tick at far right. Solar/ink colors only.
2. `src/atlas/sun-arc.ts`: position = f(document progress) along the arc;
   pure math (`lib/atlas-motion/sun-arc.ts` + tests: monotonic x, apex at the
   Trajectory scroll band, lands on horizon at ≥98%).
3. Active section: IO on the four sections toggles a persistent
   half-underline on the matching nav link (`aria-current="true"`).
4. No JS ⇒ glyph rests at its start position (static decoration); reduced
   motion ⇒ active-section underline only, sun static.
5. Expose current progress via a custom event or module export for Step 7's
   finale handshake; document it in a comment block in `sun-arc.ts`.

**Verification:** `npm run verify`; scroll the page — sun apex lands within
the Trajectory section band at 1440px and 390px; keyboard-tab through nav
unaffected; reduced-motion static check.

**Exit criteria:** invariants; sun lands on horizon tick at page bottom
exactly; nav `aria-current` correct in all four sections; PR merged.

---

## Step 4 — Craft chapter choreography

**Model:** default · **Depends on:** Step 1 (serial after Step 3)

**Mission:** the citron chapter becomes the first "page turn": chapter wipe,
pinned heading, ghost numeral, plate un-clip, capability marquee.
Spec: plan §5.2.

**Read first:** shared context; plan §5.2; craft JSX in `Portfolio.tsx`;
`app/styles/craft.css`; Step 1 utilities.

**Tasks**
1. **Chapter wipe #1:** citron background enters as a scroll-driven
   horizontal wipe (scroll-timeline scrub on a full-bleed pseudo-element /
   inset `clip-path`; IO-triggered transition fallback). Cream shows through
   until wiped. Content stays legible mid-wipe.
2. **Pinned heading:** "The craft behind the flight." sticky while lede/body
   scroll past; release before the plate. Ghost "01" numeral behind at ~8%
   opacity, counter-parallax (moves slightly against scroll).
3. **Plate reveal:** workshop image `clip-path` un-clips from bottom, scrubbed
   by view progress, with internal parallax like the hero.
4. **Capability marquee:** "Research systems · Production engineering ·
   Human-centered interfaces" (from `siteContent` — do not hardcode) as a
   slow marginal ticker along the section's bottom edge. CSS animation,
   duplicated track with `aria-hidden` dupe; pauses on hover AND
   focus-within; reduced motion / no-JS ⇒ the existing static
   `.craft-notes` list (keep it as the base state, marquee is the
   enhancement).

**Verification:** `npm run verify`; scrub the section slowly at 1440/390px —
no text unreadable mid-transition; marquee pauses on hover and keyboard
focus; Firefox: no wipe, clean static section; reduced-motion parity.

**Exit criteria:** invariants; wipe scrubs with scroll (not time-triggered)
in Chromium/Safari; PR merged.

---

## Step 5 — Trajectory chapter: dusk lighting + living flight log

**Model:** default · **Depends on:** Step 1 (serial after Step 4)

**Mission:** the dusk chapter darkens as you descend through it, entries
arrive like log lines, and each entry opens into a dossier revealing the
currently-unused `highlights[]` content. Spec: plan §5.3.

**Read first:** shared context; plan §5.3; experience JSX in
`Portfolio.tsx`; `app/styles/experience.css`;
`lib/descent-choreography.ts` (+ test) — reuse/adapt `getDescentLighting`;
`content/site-content.ts` (`experience[].highlights`, `technologies`).

**Tasks**
1. **Dusk deepens:** a full-section darkening overlay (near-black ink
   layer, `pointer-events: none`, behind content) whose `opacity` scrubs
   0 → ~0.35 across the section's scroll span (scroll-timeline; fallback:
   three IO-stepped opacity values). Do NOT scrub `background-color` or a
   color custom property (invariant 8). Use/adapt `getDescentLighting` so
   the curve stays unit-tested; tune the max opacity visually.
2. **Plate:** lighthouse image parallax + a warm-tint overlay inside the
   plate frame (solar/coral tint, `mix-blend-mode: soft-light` or plain)
   whose `opacity` scrubs subtly with view progress. Do NOT animate
   `filter` (invariant 8) — the overlay is the visual equivalent.
3. **Entry entrances:** per `flight-entry`: bottom rule draws `scaleX 0→1`,
   index numeral odometer-flips, then title/summary rise. IO + stagger from
   Step 1 orchestrator.
4. **Dossier expanders:** each experience entry gets a `<button>` toggle
   ("Field notes +") revealing `highlights[]` bullets + technology tags with
   a smooth `grid-template-rows: 0fr→1fr` height animation — explicitly
   sanctioned by invariant 8 as a discrete, user-triggered, below-the-fold
   transition ≤400 ms (FLIP is not required; verify with a performance
   trace).
   - Server-rendered markup: content present in DOM. No-JS/SEO base state =
     expanded (via `html:not(.atlas-js)` styling); collapsed under
     `html.atlas-js` (Step 1's marker). The section is far below the fold,
     so the init-time collapse cannot cause visible CLS — still, collapse on
     init, not lazily on IO.
   - Full ARIA: `aria-expanded`, `aria-controls`, focus stays on button;
     Enter/Space work.
   - Education entry: no expander (no highlights) — skip gracefully.
5. DOM tests (vitest + testing-library): expander renders highlights from
   content, toggles `aria-expanded`, education entry has no button.

**Verification:** `npm run verify`; keyboard-only walkthrough of all
expanders; no-JS: highlights visible; reduced motion: instant expand/collapse
(no animation) but functional; background interpolation visible on slow
scroll.

**Exit criteria:** invariants; all three experience entries expose their
three highlights; new DOM tests green; PR merged.

---

## Step 6 — Project chapters: wipes, pinned mastheads, plate pans

**Model:** strongest · **Depends on:** Step 1 (serial after Step 5)

**Mission:** the three color chapters (cobalt/citron/dusk) become turned
pages with panning plates and magnetic repository links — the flagship
scroll sequence. Spec: plan §5.4.

**Read first:** shared context; plan §5.4; projects JSX in `Portfolio.tsx`
(note chapter-2's mirrored grid layout); `app/styles/projects.css`; Step 4's
merged wipe implementation (reuse the mechanism, don't fork it — extract a
shared `chapter-wipe` utility if Step 4 didn't).

**Tasks**
1. **Wipes #2–4:** each chapter background wipes in with its color;
   direction alternates L→R / R→L / L→R. Same mechanism as Step 4
   (generalize if needed).
2. **Pinned case masthead:** per chapter, "Case 0N" meta and the tech list
   slide from opposite edges into lockup while the title pins briefly
   (sticky), then releases. Chapter 2's mirrored layout mirrors the motion.
3. **Plate pan:** project art sized ~115% of frame width, translating
   laterally through its frame scrubbed by chapter view progress
   (scroll-timeline; rAF fallback). Direction alternates per chapter.
   `object-position` end states must never crop out the focal subject —
   check each of the three images visually.
4. **Case copy cascade:** Brief/Approach/Technical-focus blocks stagger in;
   their separator rules draw scaleX.
5. **Magnetic repository pill:** promote `.repository-link` to a bordered
   pill; fine-pointer-only magnetic translate ≤6px toward cursor
   (rAF-damped, from Step 1 pointer utilities — build `magnetic.ts` here if
   not present), arrow nudges ↗ on hover, colors invert on press. Keyboard
   focus gets the full hover treatment sans magnetism.
6. Curves/mappings in `lib/atlas-motion/project-choreography.ts` + tests
   (pan progress mapping, alternate-direction table keyed by index).

**Verification:** `npm run verify`; slow-scrub all three chapters at
1440/1024/390px — pans stay within frames, no focal cropping, chapter 2
mirror correct; magnetic link does nothing on touch emulation; Firefox
static parity; reduced motion parity.

**Exit criteria:** invariants; all three chapters choreographed with
alternating directions; `data-testid="project-case-study"` count still 3 in
tests; PR merged.

---

## Step 7 — Contact finale + global micro-craft

**Model:** default · **Depends on:** Steps 1 & 3 (serial after Step 6)

**Mission:** land the narrative (sunrise + sun-arc handshake) and add the
site-wide craft details juries hunt for: custom cursor, live grain, themed
404, footer local time. Spec: plan §5.5–§5.6.

**Read first:** shared context; plan §5.5–§5.6; contact JSX in
`Portfolio.tsx`; `app/styles/contact.css`; `src/atlas/sun-arc.ts` (progress
handshake documented in Step 3); `app/not-found.tsx` if present (check —
Next static export serves `404.html`).

**Tasks**
1. **Sunrise finale:** as the ending plate enters, a soft radial glow
   brightens behind the ridge line (overlay div, `mix-blend-mode:
   soft-light`/`overlay`, scrubbed opacity — artwork file untouched);
   simultaneously the header sun glyph lands on its horizon tick (consume
   Step 3's progress handshake).
2. **"Keep building."** word-level mask reveal on enter. The "type
   exhales" effect is transform-only (invariant 8): `letter-spacing` stays
   static at its current CSS value and is never animated. Instead, split
   the headline into characters (Step 1's `splitText`) and scrub each
   character's `translateX` outward from the headline's center,
   proportional to its distance from center, across the section scroll
   span — max spread ≈0.02em-equivalent per gap, so it reads as tracking
   easing, not movement. If per-character offsets look noisy at display
   size, fall back to one subtle `scaleX(1 → 1.01)` scrub on the headline
   block (transform-origin center). Either way: no `letter-spacing`,
   `font-*`, or other layout property in any scroll-linked animation.
3. **Email link:** underline draw on enter + magnetic hover (reuse Step 6
   utility); keep serif scale.
4. **Footer local time:** "Bellevue, WA — HH:MM" rendered by
   atlas.js, updating per minute; server markup shows the location string
   only (no wrong-time flash; no hydration involved).
5. **Custom cursor:** ink dot + trailing ring, `(pointer: fine)` +
   no-reduced-motion only; ring morphs to "↗" over external links, "+" over
   dossier expanders, "read" over plates. Never `cursor: none` — native
   cursor remains; element is `aria-hidden`, `pointer-events: none`.
6. **Live grain:** size the existing `body::before` noise layer to ~130%
   of the viewport and loop an 8-step `steps()` `transform: translate(…)`
   through offset positions (compositor-only; do NOT animate
   `background-position` — invariant 8) at current opacity; static under
   reduced motion.
7. **Themed 404:** create `app/not-found.tsx` — "This plate is missing from
   the atlas." + wing mark + link home; styled entirely with existing
   tokens; verify `404.html` in `out/` after build (script stripping
   applies — page must be pure static).

**Verification:** `npm run verify`; full-page scroll: sun lands as glow
completes; cursor behaviors on each interactive type; touch emulation ⇒ no
cursor element; `out/404.html` exists and renders; time renders correctly in
a second timezone (set system TZ or mock).

**Exit criteria:** invariants; finale handshake works at both 1440/390px;
404 in-theme; PR merged.

---

## Step 8 — QA, performance certification, submission kit

**Model:** default · **Depends on:** all previous steps

**Mission:** prove the budgets, fix what QA finds, and produce the Awwwards
submission package. Spec: plan §6–§7 (P3).

**Read first:** shared context; plan §6; all `docs/`; this file's invariants.

**Tasks**
1. **Browser matrix:** Chromium, Safari (macOS), Firefox, iOS Safari
   (simulator), Android Chrome (DevTools emulation min). Record results in
   `docs/VERIFICATION.md`: per-browser notes on wipes, pans, sticky, sun-arc,
   cursor, expanders.
2. **Performance certification:** Lighthouse (mobile + desktop) on the
   production build served locally — all categories ≥ 95; LCP ≤ 1.8 s,
   CLS ≤ 0.02, INP ≤ 200 ms (interaction traces on expanders + magnetic
   links). Record atlas.js gzip size. Fix regressions found.
3. **Accessibility audit:** axe DevTools pass; keyboard-only full journey;
   reduced-motion full journey (must match pre-upgrade static site);
   screen-reader spot-check of split-text headings (aria-label intact),
   expanders, nav `aria-current`.
4. **Content/meta sweep:** OG image still representative; sitemap/robots
   fine; favicon set; page `<title>`/description unchanged unless hero
   framing changed.
5. **Submission kit** in `docs/awwwards/`: 1600×1200 cover captures of hero,
   craft wipe mid-state, project pan, finale; 30–60 s screen recording
   script; 100-word and 300-word site descriptions (voice: the site's own
   editorial tone); tech notes paragraph (zero-framework enhancement layer,
   budgets, a11y posture).
6. File any non-blocking findings as GitHub issues.

**Verification:** every number in `docs/VERIFICATION.md` reproduced by
command or documented procedure; `npm run verify` green.

**Exit criteria:** invariants; Lighthouse ≥95 ×4 documented; VERIFICATION.md
+ submission kit merged; open issues list empty or triaged.

---

## Execution notes for the operator

- Dispatch one agent per step, in graph order; paste the step brief + shared
  context block as the task prompt, or point the agent at this file and name
  the step.
- Steps 2 and 6 are the aesthetic make-or-break — give them the strongest
  model and review their PRs visually (screenshots at 1440px and 390px are
  required in every PR description).
- If a step balloons: split at a named task boundary, land the working
  subset, file the remainder as a follow-up step appended to this file
  (mutation protocol: append, never rewrite history of completed steps).
- After each merge, watch the `Deploy to GitHub Pages` action and the live
  site before dispatching the next step.

---

## Amendments

**2026-07-15 — invariant 8 clarified; Steps 5 & 7 made consistent with it.**
The Step 5 executor correctly flagged that the original Step 5 tasks required
animating `filter` and `grid-template-rows` while invariant 8 permitted only
transform/opacity/clip-path. Resolution: invariant 8 now states its actual
intent — compositor-only properties for anything scroll-linked/continuous,
with a narrow allowance for discrete user-triggered layout transitions
(≤400 ms, below the fold, trace-verified). Step 5's dusk deepening and plate
warmth became opacity-scrubbed overlay layers; the dossier expander keeps
`grid-template-rows` under the discrete allowance; Step 7's grain loop became
a stepped transform on an oversized layer. No completed steps (0–4) are
affected. Cloudflare dashboard changes (script-injection settings) are out of
scope for Steps 5–7; the "only /atlas.js ships" check runs against the local
production build (`out/`), and the live-domain Cloudflare script audit is a
deferred Step 8 item.

**2026-07-15 (later) — Step 7 task 2 letter-spacing scrub replaced.**
The Step 7 executor correctly flagged that scroll-scrubbing `letter-spacing`
is a layout animation with no exemption under invariant 8. Resolution: the
static `letter-spacing` is unchanged; the exhale effect is now per-character
`translateX` spread (via Step 1's `splitText`) or, as fallback, a subtle
headline `scaleX` scrub — both compositor-only. A full sweep of the
remaining unexecuted steps (7–8) found no other scroll-linked layout or
paint property animations. Completed steps (0–6) are untouched.
