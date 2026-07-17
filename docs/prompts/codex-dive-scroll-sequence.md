# Codex Task: Scroll-Scrubbed "Dive" Video Sequence Into the Experience Section

## Goal

Add an Apple-style scroll-scrubbed frame sequence between the hero and experience
sections of this portfolio. The source is an 8-second AI-generated video (Google
Flow/Veo): the camera glides from a sunlit white classical city on the sea, dives
into the water, and descends until the frame is a flat deep navy. As the visitor
scrolls, a sticky full-viewport canvas scrubs through the **exact frames extracted
from that video with ffmpeg** (no video element, no interpolation). The sequence
ends by washing into solid `#202A44`, and the experience section's background
becomes `#202A44`, so the scene lands you seamlessly "inside" the experience
chapter.

Read `AGENTS.md` first and follow its visual-asset pipeline.

## Source video — measured facts

- Source: an 8 s Veo mp4, h264, 1280×720, 24 fps, **192 frames**. It lives
  locally in `design-refs/video/` which is gitignored (`.git/info/exclude`) —
  you do not need it; the extracted frames are already committed (see Step 1).
- Frames 0–~47 are pillarboxed with black side bars (a Veo intro artifact). The
  bars are fully gone by **frame 48 (t=2.0s)**, which is the full-bleed
  establishing shot of the city. Start extraction at frame 48.
- A faint "Veo" watermark sits in the bottom-right of every frame, occupying
  rows ~692–705 (measured by zooming the original pixels). Cropping the bottom
  32 px (`crop=1280:688:0:0`) removes it entirely — this was verified on real
  cropped output at the start, middle, and end of the sequence. Keep this crop
  exactly; do not "improve" it to a delogo filter.
- The final frame's average color is `#1c293f` — very close to the target
  `#202A44`, so a short end-of-scrub color wash makes the handoff invisible.
- **Frame count ceiling:** after trimming the 48 pillarboxed intro frames, the
  video contains exactly **144 usable frames** (48–191). Ship all 144 — that is
  every frame that exists. Do NOT generate additional frames via optical-flow
  or AI interpolation (`minterpolate`, RIFE, etc.); the requirement is exact
  extracted frames only. 144 frames across a ~400vh track is one frame per
  ~25 px of scroll, which is smoother than typical Apple product sequences.

## Architecture constraints (critical — read before writing any code)

This is a Next.js static export (`output: 'export'` in `next.config.ts`)
deployed to GitHub Pages. **The postbuild script
`scripts/strip-static-runtime.mjs` strips every `<script>` from the exported
HTML except a single `/atlas.js`.** There is no React runtime in production.

Therefore:

- **Do NOT write a React client component, hook, or `use client` file for the
  animation.** All interactivity lives in vanilla TypeScript under `src/atlas/`,
  bundled by `scripts/build-atlas.mjs` (esbuild, IIFE, es2020) into
  `public/atlas.js`.
- `atlas.js` has a **hard 12 KB gzip budget** enforced by `assertAtlasBudget`
  in `scripts/strip-static-runtime.mjs`. Current usage is ~7.1 KB gzipped, so
  you have roughly 4.9 KB of headroom. Keep the new module lean (~2 KB gz);
  the frames themselves are static assets and do not count against the budget.
- Module pattern: see `src/atlas/runtime.ts`. Each feature is a
  `setupX(document, window)` function returning a cleanup function, wired into
  `initializeAtlas`. A shared `ScrollBus` (`src/atlas/scroll-bus.ts`) publishes
  `{ documentProgress, scrollY }` on rAF-throttled scroll/resize.
- **Reduced motion / no JS:** `initializeAtlas` returns early under
  `prefers-reduced-motion: reduce` and only adds the `atlas-js` class to
  `<html>` on the full-motion path. Gate all dive layout behind `.atlas-js` in
  CSS so that no-JS and reduced-motion visitors get today's hero → experience
  flow with the dive section completely hidden (`display: none` default).
- Pure math/choreography helpers live in `lib/atlas-motion/*` with colocated
  vitest tests (see `lib/atlas-motion/progress.ts` + `progress.test.ts` as the
  pattern). Put testable logic there, DOM wiring in `src/atlas/dive.ts`.
- Markup is server-rendered at build time in
  `components/portfolio/Portfolio.tsx` — adding static JSX there is fine.
- Assets in `public/` are served from the site root (custom domain via CNAME);
  reference frames as `/frames/dive/frame_000.webp` etc. Do not use
  `assetPrefix` for public files.

## Step 1 — Frames (already extracted and committed — verify, do not redo)

The **144 frames are already committed** at
`public/frames/dive/frame_000.webp` … `frame_143.webp` (1280×688 WebP,
~25 KB average, ~3.5 MB total). They were produced by
`scripts/extract-dive-frames.sh` (also committed), which encodes the exact
pipeline: every frame from 48→191, bottom-32px watermark crop, quality 72.
The output was already visually verified: no pillarbox bars, no "Veo"
watermark trace in zoomed bottom-right corners of first/middle/last frames.

Your job here is only to sanity-check, not re-extract:

1. `ls public/frames/dive | wc -l` → must be 144.
2. Open `frame_000` (full-bleed sunlit city, no black side bars),
   `frame_070` (half-submerged split shot), and `frame_143` (flat deep navy).
3. Do not re-run the extraction, re-encode, resize, or "optimize" the frames.

## Step 2 — Markup (`components/portfolio/Portfolio.tsx`)

Insert a new decorative section **between the closing `</section>` of
`#hero` and the opening of `#experience`** (currently adjacent around lines
173–175):

```tsx
<section className="dive-section" id="dive" aria-hidden="true">
  <div className="dive-track">
    <div className="dive-sticky">
      <canvas className="dive-canvas" data-dive-canvas />
    </div>
  </div>
</section>
```

- `aria-hidden="true"`: purely decorative, no heading, not in the nav or
  wayfinding. Verify `setupSectionWayfinding` in `src/atlas/sun-arc.ts` and the
  header anchor nav ignore it (they key off nav anchors / labelled sections —
  confirm, don't assume).
- Check `Portfolio.test.tsx` and `app/styles/split-sections.test.ts` for
  assertions about section order/adjacency and update them deliberately.

## Step 3 — Styles (new `app/styles/dive.css`, imported like the others)

- Default (no `.atlas-js`): `.dive-section { display: none; }` — no-JS and
  reduced-motion visitors keep the current hero → experience seam.
- Under `html.atlas-js`:
  - `.dive-track { height: 400vh; }` (the scrub distance — tune 350–450vh)
  - `.dive-sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }`
  - `.dive-canvas { width: 100%; height: 100%; display: block; }`
  - `.dive-section { background: #202a44; }` so any unpainted moment reads as
    the destination color, never white.
- Add a token in `app/styles/base.css`: `--abyss: #202a44;`
- Change `.experience-section` in `app/styles/experience.css` from
  `background: var(--dusk-deep)` to `background: var(--abyss)`. Leave
  `--dusk-deep` itself untouched (other rules use it). Check the experience
  section's inner plates/text still read well on the new background (they use
  `--paper`/`--ink`/`--dusk` — contrast is fine, but eyeball it).

## Step 4 — Atlas module (`src/atlas/dive.ts` + `lib/atlas-motion/dive.ts`)

`setupDiveScroll(document, window)` returning a cleanup function, wired into
`src/atlas/runtime.ts` exactly like the other `prepareX` modules (including an
injectable option for tests and a call to its cleanup in `destroy`).

Pure helpers in `lib/atlas-motion/dive.ts` (unit-tested):

- `getSectionProgress(rect, viewportHeight)` → 0..1 progress of the track
  through the viewport (0 when the track top hits the viewport top, 1 when the
  track bottom reaches the viewport bottom).
- `progressToFrame(progress, frameCount)` → clamped frame index.
- `getCoverRect(canvasW, canvasH, imageW, imageH)` → source/dest rect math for
  `object-fit: cover` drawing.
- `getWashAlpha(progress, start = 0.88)` → 0 before `start`, ramping to 1 at
  progress 1 (the `#202A44` end wash).
- `getPreloadOrder(frameCount, stride = 8)` → coarse-first frame load order
  (every 8th frame first, then fill the gaps) so scrubbing works almost
  immediately and refines as more frames decode.

DOM wiring in `src/atlas/dive.ts`:

- Frame URLs: `` `/frames/dive/frame_${String(i).padStart(3, '0')}.webp` ``,
  144 frames, dimensions 1280×688 (declare as constants).
- Lazy start: an `IntersectionObserver` with generous `rootMargin` (~"150%")
  on the section kicks off preloading before the visitor reaches it; don't
  fetch 3.5 MB at page load.
- Mobile data budget: on viewports ≤ 720 px wide, load only even-indexed
  frames (72 frames, ~1.75 MB) — the nearest-loaded-frame drawing rule below
  already makes odd target indices resolve to the adjacent even frame, so this
  needs no extra branching in the draw path.
- Load via `new Image()` + `decode()` (or `createImageBitmap`) into a sparse
  array; on scroll, draw the nearest *loaded* frame at or below the target
  index so gaps never blank the canvas.
- Subscribe to scroll via the existing `ScrollBus` if practical for module
  independence (other modules attach their own rAF'd scroll listeners — follow
  whichever pattern `setupCraftChapter`/`setupContactFinale` uses); only
  redraw when the target frame index or wash alpha actually changes.
- Canvas sizing: match the sticky element's box × `devicePixelRatio` capped at
  2; resize handler re-sizes and redraws.
- Draw order per redraw: cover-fit frame, then if `washAlpha > 0` fill the
  full canvas with `rgba(32, 42, 68, washAlpha)`. At progress 1 the canvas is
  solid `#202A44`, flush against the experience section of the same color.
- Immutability/style: follow the existing module code style (readonly types,
  small pure functions, no `console.log`), files under ~200 lines.

## Step 5 — Tests + verification

- Unit tests for every `lib/atlas-motion/dive.ts` helper (happy path + clamp
  edges), colocated `dive.test.ts`, matching the style of `progress.test.ts`.
- A DOM-level test for `setupDiveScroll` wiring (canvas found, cleanup
  detaches) following patterns in `src/atlas/atlas.test.ts`.
- Update any section-structure tests you broke knowingly in Step 2.
- `npm run verify` must pass — this runs vitest, `tsc --noEmit`, and the full
  build **including the atlas 12 KB gzip budget assertion**. If you blow the
  budget, shrink the dive module, not the budget.
- Manual QA with `npm run dev`: scrub down slowly — city → splash →
  underwater → flat navy → seamless `#202A44` experience section; scrub back
  up; jump via the "Experience" nav anchor (should land past the dive without
  breakage); test at mobile width; test with DevTools "Emulate
  prefers-reduced-motion" (dive section must not render at all); throttle
  network to Fast 4G and confirm the page is usable while frames stream in.

## Acceptance criteria

1. Exactly **144 frames** on disk, all byte-for-byte ffmpeg extractions from
   the source video — no re-generation, no AI upscaling, no interpolation, no
   dropped frames.
2. No pillarbox bars or any trace of the "Veo" watermark in any shipped frame
   (bottom-right corner zoom-checked on at least first/middle/last frames).
3. Scroll position drives frame index 1:1 within the track; no autoplaying.
4. The sequence ends in solid `#202A44` and the experience section background
   is `#202A44` — the seam must be invisible at rest and while scrolling.
5. Zero JS shipped outside `/atlas.js`; gzip budget passes.
6. Reduced-motion and no-JS visitors see the site exactly as before (no dive
   section, no 400vh dead scroll).
7. `npm run verify` green.
