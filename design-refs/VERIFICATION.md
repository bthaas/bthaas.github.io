# Icarus Editorial Atlas Verification

The current release state is the 2026-07-18 Phase 6 section below. Earlier
sections are retained as dated baselines; their zero-runtime and initial-layout
statements were explicitly superseded by the hydrated maximalist motion brief.

Verified July 14, 2026 against the built Next.js static export and the superseding Editorial Atlas
direction in `design-refs/ANALYSIS.md`.

## Reference and artwork gates

- The four format boards and one art-style board are preserved in `design-refs/video/` and were
  verified with `ffprobe` at their original dimensions: 1628×2048, 1200×1093, 1592×2048,
  2048×1568, and 2048×1493.
- Stable format and art crops are in `design-refs/frames/atlas/`. Both contact sheets were opened
  and inspected before UI implementation.
- Two text-free generated candidates were inspected for each of the seven illustration slots. The
  selected masters are in `design-refs/generated/atlas/`; final prompts and generation mode are
  recorded in `design-refs/ATLAS_PROMPTS.md`.
- The accepted set uses one literal Icarus composition in the hero and symbolic wings, lighthouse,
  court, signal ribbons, labyrinth, and horizon imagery elsewhere.
- All labels, metrics, case-study copy, and navigation remain semantic DOM text. No generated image
  contains interface copy or fabricated logos.

## Responsive media

- `public/icarus-atlas/` contains 30 delivered AVIF/WebP assets: 1600/960 panorama variants,
  1200/640 project variants, and the social crop.
- The largest delivered variant is 189,938 bytes, below the 250 KB hard ceiling.
- The initial mobile hero AVIF is 13,976 bytes. All other editorial images use native lazy loading,
  keeping the initial mobile image payload far below the 900 KB allowance.
- Explicit dimensions, responsive source descriptors, and fixed CSS aspect ratios produced a
  measured cumulative layout shift of 0.

## Browser and visual verification

The production export was served with the same `/static-v1/_next` copy used by the GitHub Pages
workflow. Verification covered 375×812, 768×900, and 1440×900.

- Document `scrollWidth` matched `clientWidth` at every viewport; no horizontal overflow was found.
- Final aligned screenshots are in `design-refs/site-screenshots/atlas/`. They cover the hero,
  metrics/craft boundary, trajectory, all three project chapters, and ending on desktop, plus the
  complete equivalent mobile sequence and the tablet hero.
- Every captured section reported its target top at 54 px mobile or 64 px desktop, and its lazy image
  was fully decoded before capture.
- `design-refs/comparison.png` places the inspected format/art references beside the seven labeled
  final desktop captures.
- The remaining intentional difference is typography: the site uses restrained local system
  serif/sans stacks rather than matching any reference brand font. This removes webfont latency and
  keeps the presentation independent of third-party assets.

## Static behavior and accessibility

- The semantic order is Hero → Craft → Trajectory → Selected Work → Contact. Navigation remains
  sticky and links directly to each region.
- The built export contains zero script tags. `scripts/strip-static-runtime.mjs` removes Next's
  unused hydration runtime after export because this page has no client state or scripted controls.
  Native anchor navigation was verified after stripping: the Work link reached `#projects` with the
  section at an 80 px top offset.
- The keyboard order begins with Skip to content, then proceeds through the compact navigation,
  primary project link, and repository links. Every tested focus target displayed a 3 px outline.
- Progressive view animations are scoped to `prefers-reduced-motion: no-preference`; the explicit
  reduced-motion rule collapses animation and transition duration. The complete layout remains
  visible without animation support.
- The fresh production-console pass contained no application-origin errors or warnings. Browser
  extension warnings were excluded by URL and are not emitted by the site.
- The page contains no canvas, video, WebGL marker, cloud transition, descent rail, dialog, or
  modal-only project content.

## Performance

Lighthouse was run against the final built static export.

| Profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 100 | 1.3 s | 0 | 0 ms |
| Desktop | 100 | 100 | 100 | 100 | 0.3 s | 0 | 0 ms |

The mobile LCP is below the 2.5-second acceptance target, and both Lighthouse performance targets
(90 mobile / 95 desktop) are exceeded. Reports are preserved as
`design-refs/lighthouse-mobile.json` and `design-refs/lighthouse-desktop.json`.

## 2026-07-18 — Feather fall showpiece verification

- `video/01-hero-wings.mp4` was re-verified as H.264, 1280×720, 24 fps,
  10.005 seconds, then extracted at 3 fps. Five stable Phase 2 frames cover the
  sparse opening, depth build, peak fall, gold-rim close-up, and final profile.
- Two new headless Blender build/render/review iterations are retained in
  `blender-renders/phase2-iteration-01/` and `phase2-iteration-02/`. Iteration 01
  was rejected as too broad and leaf-like. Iteration 02 lengthened the vane,
  narrowed all profiles, and clarified the quill; its accepted six views are
  copied to `blender-renders/turntable-01.png` through `turntable-06.png`.
- The final `feather-variants.glb` is 6,108 bytes and 804 triangles. glTF
  Transform inspection reports required `KHR_draco_mesh_compression`, no
  textures, and independent nodes `feather_variant_01`, `_02`, and `_03`.
  Headless Blender re-import decoded all three Draco meshes and preserved names.
- The live scene was captured at load and 25/50/75/100% document progress in
  `site-screenshots/phase2-*.png`. `comparison.png` places those five labeled
  captures beside the peak reference, and the montage was opened and inspected.
- The narrative correspondence is intact: sparse silhouettes lead from Hero;
  the dark flight log carries the fall; Projects/Craft thin the field; Contact
  settles almost entirely below the horizon. Copy remains in the higher stacking
  layer and the central reading corridor receives smaller, fainter geometry.
- The remaining intentional difference is atmosphere. The source uses clouds,
  a detached marble wing pair, and heavy depth of field; the active scene uses a
  transparent canvas over the unchanged editorial chapters. Reintroducing the
  cloud environment would violate identity, obscure content, and exceed the
  performance tier, so depth is limited to scale, roughness, opacity, and z.
- A clean reduced-motion fallback capture is stored at
  `docs/awwwards/screenshots/step-16/reduced-motion-fallback-desktop-1600.png`.
  The reduced-motion and no-WebGL paths mount no feather canvas.
- Hardware Chromium reports 120 fps for the 120-record scene; WebKit desktop
  holds 59.5–61 fps; mobile intentionally renders 40 records at 30 Hz. The
  detected software-WebGL tier also uses 40 records/DPR 1/30 Hz.

## 2026-07-18 — Liquid hero and kinetic type verification

- Phase 3 intentionally reuses the accepted 1600×1130 hero painting as a
  subdivided shader plane. Because no new mesh silhouette, fracture, or material
  asset is introduced, exporting a flat Blender rectangle and rendering two
  turntable iterations would add no visual evidence; the documented exception
  in `ANALYSIS.md` keeps the source painting and browser crop as ground truth.
- The accepted source, desktop layout, and mobile layout are curated as
  `frames/phase3-hero-liquid-source.png`, `phase3-hero-layout-desktop.png`, and
  `phase3-hero-layout-mobile.png`. They were opened before the component and
  shader implementation.
- Production captures at load and 25/50/75/100% of the masthead release live in
  `site-screenshots/phase3-*.png`. `comparison.png` places the source and five
  labeled states together; the montage was opened and inspected after capture.
- The composition remains faithful at rest: the sun, city, Aegean horizon, crop,
  caption, masthead, copy grid, palette, and section order are unchanged. The
  maximum pointer ring is 0.009 UV and the maximum velocity shift/bulge is 0.006,
  so motion bends the light without turning the painting into a lava surface.
- At 25/50/75%, the masthead releases outward like nine large shed feathers;
  outer characters travel farther, alternating characters rise and fall, and
  rotation stays within 18 degrees. At 100% the outlined `FLIGHT LOG` band
  carries the fall into the dusk chapter. Returning to the top restores every
  character to identity transform and opacity 1.
- The four kinetic labels repeat existing wayfinding only. The circular
  `EX ALIS — BELLEVUE — 47.61° N —` label follows the same Atlas sun-progress
  event while React owns only its dedicated overlay; Atlas retains sole
  ownership of the SVG path and sun group.
- Static and reduced-motion verification retains the responsive hero `<picture>`
  as the LCP element and mounts no liquid canvas. The existing fallback did not
  require replacement because the accepted composition did not change.
- The shared deferred scene chunk prevents a second Three/R3F runtime. The
  liquid plane renders only while pointer/scroll energy is active and unmounts
  away from the hero. Software WebGL deliberately lowers the fluid and finale
  tiers; WebKit desktop and iPhone remain at display rate through the full page.
- The remaining intentional difference is that a still capture can only show
  displaced light at one instant. The interaction is therefore also covered by
  E2E assertions for canvas readiness, velocity-driven type, scatter progress,
  top reversal, reduced motion, no-JS fallback, and application-console health.

## 2026-07-18 — Horizontal flight path and print-dissolve verification

- The three accepted 1200 px project plates and the pre-Phase-4 desktop grid are
  curated in `frames/phase4-*` and were opened before choreography or component
  work. This phase adds no modeled subject: each R3F object is a subdivided flat
  carrier for an accepted AVIF, so Blender/GLB/turntable work would add no visual
  evidence and is explicitly inapplicable in `ANALYSIS.md`.
- The accepted start, midpoint, mobile flow, 50% dot-screen dissolve, and dossier
  tilt captures live in `docs/awwwards/screenshots/step-18/`.
  `comparison-phase4.png` places all three source plates, the old grid, and those
  five final states together. The same inspected montage is the current
  `comparison.png` required by the section pipeline.
- The lateral composition preserves the landmarks documented in analysis: both
  Court Vision hoops and gold arc, Beat Stream's near ribbons and bell tower,
  and Vision Bias's observatory/fork. Rounded shader corners align with the DOM
  plate radius, copy stays above the decorative canvas, and one dominant plate
  plus the next edge remains visible throughout the pin.
- The remaining intentional crop difference is the desktop card ratio. The
  source paintings are wider or taller than the common 72vw×72svh flight plate,
  so each uses the previously accepted cover focus rather than squeezing the
  art. The required narrative landmarks remain visible at every stop.
- The gallery has one ScrollTrigger pin and no wheel/touch listener. Keyboard
  focus and `#project-*` hashes translate to normal document scroll, while
  mobile, reduced motion, no WebGL, and no JavaScript retain complete unpinned
  reading order. Chromium, Firefox, desktop WebKit, and iPhone WebKit pass the
  same anchor, focus, overflow, mask, and application-console assertions.
- The chapter midpoint reports a 4.5 px dot radius and 6 px grid offset, then
  completes at 9 px / 0 px. Standard and WebKit radial masks give browser parity
  without a rectangular edge. Flight-log tilt is bounded to 6° on its dedicated
  inner surface, so Atlas's Flip dossier state remains unchanged.
- Page-level final automation is 29.6/25.6/22.2/24.9/21.7 fps on Chromium
  SwiftShader, 61.0/54.0/21.8/25.3/34.0 on Firefox Apple GPU,
  61.6/61.2/60.1/60.0/59.5 on desktop WebKit, and approximately 60 throughout
  iPhone WebKit. The shared project scene uses DPR 1 and demand rendering;
  mobile deliberately mounts no project canvas.

## 2026-07-18 — Micro-insanity and missing-plate verification

- Phase 5 introduces no new hero-class section, modeled geometry, texture, or
  material asset. The blizzard and 404 deliberately reuse the Phase 2 feather
  GLB, seed field, Fresnel material, and accepted Icarus reference; the varnish,
  flare, golden landing, and LetterGlitch are screen-space print/light effects.
  A Blender turntable would therefore duplicate already accepted geometry and
  provide no new visual evidence.
- Production captures for the hovered varnish, 720 ms flare/blizzard beat,
  settled golden feather, and animated missing plate live in
  `docs/awwwards/screenshots/step-19/`. `comparison-phase5.png` assembles the
  four labeled states and was opened at original resolution after capture.
- The flare warms the existing header sun instead of introducing a second
  light. The feather field becomes a brief full-density fall, then returns to
  document choreography. One gold line-art feather completes the route beside
  email. The missing page reads as a lightly misregistered atlas plate with
  sparse edge drift, not as a separate visual identity.
- Hover varnish uses citron, cobalt, coral, and paper highlights through a
  masked gradient. It creates no permanent compositor layers; promotion exists
  only while hovered or focused. Firefox automation recovered from 18.4 to
  22.1 fps at the project-flight midpoint after that correction.
- Reduced-motion inspection creates no 404 glitch or feather canvas and hides
  flare, golden feather, sheen, and sun trigger. The static message, return link,
  portfolio content, and title visibility behavior remain intact.
- The spectacle's own completion callback measured 3,810 ms. Five button
  activations, Konami input, session replay prevention, hover sheen, 404 canvas,
  reduced motion, console health, and cross-browser scroll journeys are covered
  by the final Playwright suite.

## 2026-07-18 — Phase 6 resubmission verification

- Phase 6 introduces no new hero-class section, modeled geometry, texture, or
  material asset. It verifies and tunes the already accepted liquid plane,
  feather GLB, project planes, and screen-space print effects; repeating the
  Blender pipeline would create no new visual evidence.
- Four production captures at exactly 1600×1200 are in
  `docs/awwwards/submission/`: liquid ascent, peak fall, horizontal field-study
  route, and golden-feather landing. Five QA captures are in
  `docs/awwwards/screenshots/step-20/`. The labeled, inspected two-by-two montage
  is `comparison-phase6.png` and the current `comparison.png`.
- A real pointer, wheel, touch, or key gesture now gates the shared Three/R3F
  boundary. Passive first paint and Lighthouse do not execute the 260 KB gzip
  scene chunk; the fallback hero remains painted and preloaded. The entrance was
  tightened from 1.18 s to 0.84 s while preserving the DrawSVG glyph and both
  print curtains.
- Mobile Lighthouse reports Performance 92, Accessibility 100, Best Practices
  100, and SEO 100. Desktop reports 100 in all four categories. Simulated mobile
  LCP is 2.90 s because the visual curtain remains part of the filmstrip;
  trace-observed LCP is 2.29 s, below the 2.5 s real-paint gate. Desktop LCP is
  0.50 s, CLS is at most 0.00012, and mobile TBT is 14 ms.
- The explicit reduced-motion capture records zero canvases, no WebGL activation
  attribute, and no preloader. The complete editorial picture, masthead, copy,
  navigation, projects, and contact actions remain visible and usable.
- Hardware WebKit desktop holds 59.8–60.5 fps and iPhone WebKit holds 59.7–60.7 fps at
  load and 25/50/75/100% scroll with the feather and fluid systems active.
  Chromium automation is the documented CPU SwiftShader tier. Firefox retains
  full pin/mask/anchor behavior and now uses the 40-feather/DPR-1 tier; its
  Playwright compositor ranges from 23.0 to 102.6 fps, with the low points inside
  the transformed/masked middle chapters rather than the R3F frame loops.
- The existing application-console, overflow, keyboard, fragment, no-JavaScript,
  404, spectacle, reduced-motion, cross-browser, and frame-pacing journeys all
  run against the production export.

## 2026-07-20 — Skill Sphere verification

- The approved light `Fig. 5` plate replaces the rejected dark constellation.
  The craft board, copy, artwork, and marquee remain unchanged. All 28 catalog
  skills render as server-owned, ordered buttons; the no-JavaScript export also
  retains the existing logo grid.
- The pure Fibonacci distribution, rotation, projection, pitch clamp, and
  velocity helpers have dedicated Vitest coverage. The React owner performs no
  frame-time layout reads: a ResizeObserver caches geometry, preallocated
  records receive projection output, and an IntersectionObserver stops
  transform writes while the plate is offscreen.
- Dragging works in both axes with pointer capture and bounded pitch. Desktop
  hover, keyboard focus, Escape, touch toggles, inertia, and idle rotation were
  exercised in Chromium, Firefox, desktop WebKit, and iPhone WebKit. Focus rings
  remain visible and every chip keeps at least a 44 px target.
- Reduced motion starts no requestAnimationFrame loop and keeps the fixed sphere
  fully readable and draggable. A hydrated capture pass reported zero console
  errors after initial projection values were normalized to stable SSR precision.
- Six inspected captures live in `docs/awwwards/screenshots/step-22/`: rest,
  mid-spin, and focused TypeScript states at 1440×1000 and 390×844. The full-color
  cream/citron plate reads harmoniously between the craft board and unchanged
  marquee at both widths.
- Hydrated Chromium telemetry reported 78 fps for the visible sphere. Mobile
  WebKit held 29.9–30 fps through the complete-page pacing journey. The feature
  uses no canvas, WebGL, blur animation, GSAP loop, or new dependency.
- A clean build of `origin/source` measured 250,564 bytes gzip across the 11
  initial homepage JavaScript chunks. The Skill Sphere build measures 252,901
  bytes gzip: a +2,337 byte gzip delta with zero dependency delta.

## 2026-07-21 — Skill Sphere wireframe extension

- The supplied globe reference is now represented by four latitude rings and
  seven meridian strands. Their 28 row-major intersections are the 28 catalog
  skills. The pointed single-node poles were replaced with seven-node shallow
  cap rings at the crown and base, so the mesh closes as an oval rather than a
  needle point. The resulting 77 quadratic SVG segments include 14 cap edges.
  Unit tests verify unique unit vectors, valid endpoints, complete cap rings,
  and exactly two latitude plus two meridian connections at every skill.
- A deterministic coprime-stride order disperses neighboring catalog entries
  without randomness between renders. React Native is at row 1/meridian 4 and
  React at row 4/meridian 6, five grid steps apart; DOM and keyboard order still
  follow the visible row-major sphere order.
- Lines rotate through the same yaw/pitch projection as the chips and attenuate
  by average segment depth. Focusing, hovering, or tapping a skill brightens its
  seven-edge latitude ring and five-edge meridian while preserving the existing
  label, focus, drag, inertia, and touch behavior.
- The mesh remains decorative and non-interactive (`aria-hidden`, no canvas,
  non-scaling hairlines). Reduced motion starts no animation frame loop. The
  full-motion loop now cancels entirely offscreen and restarts on intersection,
  avoiding idle work while the visitor is in another chapter. The production
  export reported 103 fps while the connected sphere was visible and rotating,
  with zero application console errors.
- Six inspected captures live in `docs/awwwards/screenshots/step-23/`: rest,
  mid-spin, and focused states at 1440×1000 and 390×844. They confirm that the
  dusk/ink mesh remains legible without overpowering the cream/citron plate.
- The rounded-cap desktop and mobile checks are retained in
  `docs/awwwards/screenshots/step-24/`. Both were opened at original resolution;
  the crown/base remain distinct on the 390 px composition and comfortably
  shallow on the 1440 px composition.
- The updated build measures 253,364 bytes gzip across the same 11 initial
  homepage JavaScript chunks: +217 bytes gzip over the first connected sphere
  and zero dependency delta.

## Automated release gates

- Unit/component/content tests: 211/211 passing across 51 files.
- Coverage: 90.75% statements, 81.06% branches, 83.70% functions, and 94.03% lines.
- TypeScript: `tsc --noEmit` passing.
- Production build: all eight routes are statically generated with the normal
  hydrated Next.js runtime and versioned deployment assets.
- Cross-browser Playwright: 23 passing journeys and 17 intentional project/device
  skips across Chromium, Firefox, desktop WebKit, and iPhone WebKit.
- `git diff --check`, dependency audit, credential/debug scan, and production
  console scan are release gates for the final branch.

## 2026-07-21 — Portfolio gateway carousel

### Reference and geometry evidence

- The supplied Aikawa Kenichi portfolio gateway was captured at 1280×720 as a
  4.333-second H.264 reference at 3 fps. The extracted sequence was opened as a
  contact sheet, and Work, Fashion, Journey, composition, and motion frames were
  curated before modeling. Scene 03 in `ANALYSIS.md` is the visual contract.
- The deterministic Blender builder produced four inspected six-view passes.
  Iteration 01 exposed an oversized lower shell and loose vertical gap;
  iteration 02 tightened both; iteration 03 removed coincident full-circle seam
  caps; iteration 04 wrapped the seam onto shared manifold vertices and is
  mirrored in `carousel-accepted/`.
- The accepted `portfolio-gateway.glb` is 4,760 bytes and 972 triangles. It
  requires `KHR_draco_mesh_compression`, retains `TEXCOORD_0`, and re-imports
  with `carousel_experience_panel`, `carousel_projects_panel`,
  `carousel_skills_panel`, and `carousel_reflector_shell`. The shared Blender
  contract passes 7/7 tests.

### Site comparison and fallbacks

- The full-viewport gateway is directly between Hero and Experience. Its
  oversized BRETT HAAS name, italic `Engineer · Researcher · Builder` role line,
  three 120° curved faces, mirrored lower shell,
  category chip, arrows, and orbit mark preserve the reference hierarchy at
  1280×720 and 390×844. Experience, Projects, and Skills link to the existing
  detailed chapters.
- `comparison.png` was opened at 1920×720 and compares the curated reference
  with Experience, both transition states, Projects, and Skills. The five site
  captures are in `site-screenshots/carousel-*`; the clean 390×844 no-WebGL
  composition is `carousel-fallback-mobile.png`.
- The CSS 3D ring remains the complete static composition. A lazily mounted,
  texture-mapped R3F/Draco scene adds physical curvature and light only while
  the gateway intersects the viewport. This persistent underlay also avoids a
  blank frame in multi-canvas compositors. Reduced motion and no-WebGL mount no
  gateway canvas and retain all links and controls.
- Horizontal pointer drag captures the band, follows the pointer continuously,
  and snaps to the nearest category on release. Its grab/grabbing cursor and
  `touch-action: pan-y` preserve vertical touch scrolling. Keyboard
  ArrowLeft/ArrowRight and both 44 px arrow buttons continue to wrap without
  trapping document scroll. Mobile controls remain inside the visible safe area.

### Automated and performance verification

- Vitest: 231/231 tests passing across 56 files. Coverage is 90.11% statements,
  80.22% branches, 82.97% functions, and 93.43% lines. `tsc --noEmit`, the
  production Next.js build, all eight statically generated routes, and
  `git diff --check` pass.
- The cross-browser choreography, keyboard, and pointer-drag assertions pass in
  Chromium, Firefox, desktop WebKit, and iPhone WebKit; the six-section
  no-JavaScript document also passes. The production journey reports no
  application-origin console errors or horizontal overflow.
- A July 24 in-app browser pass at 1280×720 visually confirmed the new name and
  role typography, grab cursor, horizontal snap from Experience to Projects,
  and unchanged reflection/controls hierarchy.
- Complete-page headless pacing measured Firefox at 17.4–63.8 fps, desktop
  WebKit at 28.5–30.1 fps, and iPhone WebKit at 29.9–30.1 fps. The final
  Chromium SwiftShader rerun measured 11.2–16.0 fps and passed its 10 fps
  software-renderer gate after the gateway was kept out of the hero startup
  budget with intersection gating, content containment, and lazy images.
- The real hardware in-app browser measured the visible gateway at 103 fps with
  a 67–103 fps observed range at 1280×720. The labeled evidence is
  `site-screenshots/carousel-hardware-stats.png`; this confirms the desktop
  section clears the 60 fps target despite headless WebKit's 30 Hz ceiling.
- One inherited Chromium SwiftShader gate remains below its existing threshold:
  the pre-existing fluid cursor reports 13–15 fps versus the test's 18 fps
  software floor. The gateway is not mounted during that measurement. The same
  rerun passed the gateway journey, sun spectacle, reversible hero, and complete
  frame-pacing gates. Development also surfaces Three.js's upstream `Clock`
  deprecation warning; production application errors remain zero.
- The credential/debug scan found no feature-owned diagnostics or secrets.
  `npm audit --omit=dev` currently reports three high-severity advisories in the
  existing Next.js, PostCSS, and Sharp dependency chain. This static export does
  not ship the affected Next.js server paths; dependency upgrades remain a
  separate maintenance task, so no unrelated lockfile change was applied here.

### 2026-07-24 physical-cylinder correction

- Inspection found that the accepted GLB was already a continuous curved ring,
  but the opaque DOM layer above it still used three broad rounded planes. That
  layer created a triangular-prism structure whose curvature was only optical.
- The static/loading/reduced-motion composition now uses 36 physical CSS 3D
  facets around a full 360° ring: 12 contiguous 10° slices per category, plus a
  matching 36-facet reflected ring. Back faces are culled and the old flat
  full-width shading overlay was removed.
- The initial correction allowed the CSS ring to fade completely when the first
  textured WebGL frame became ready. A live 1280×720 hardware-browser inspection
  confirmed visible neighbor panels at both curved edges, correct
  foreshortening, a complete drag from Experience to Projects, and zero
  application-console errors.
- The correction passes 235/235 Vitest assertions across 57 files, 90.16%
  statement / 80.41% branch / 83.11% function / 93.46% line coverage,
  TypeScript, production build and deployment preparation, and the targeted
  Chromium, Firefox, desktop WebKit, and iPhone WebKit production journeys.

### 2026-07-25 spin clearance and name fit

- The supplied 967×546 and 1799×550 CSS-pixel viewport references exposed two
  responsive regressions: the spinning upper rim projected beyond the canvas
  top at maximum pointer pitch, and the `BRETT HAAS` wordmark extended beyond
  the viewport while its adjacent T glyphs touched.
- The gateway camera elevation is now 0.42 scene units. A pure projection test
  covers the complete ±0.018 rad pitch range and measures 6.3% top clearance
  and 7.5% lower-reflector clearance in normalized device coordinates.
- The wordmark now uses a 14.8vw/17rem responsive ceiling, centered translation,
  and positive tracking with a 1 px floor. The 1800×550, 967×546, 721×844, and
  390×844 production-layout journey confirms at least 16 px side insets and at
  least 1 px computed tracking.
- A hardware-browser pass at 1280×720 confirmed complete upper-rim visibility
  before and after an Experience → Projects drag, a fully visible wordmark, and
  zero application-console errors.

### 2026-07-25 interaction activation continuity

- The supplied follow-up capture isolated a first-interaction regression: the
  upper cylinder was correctly framed at load, then appeared vertically cut
  after pointer activation. The geometry was not moving outside its bounds; the
  first input was crossfading from the 36-facet CSS ring to a wider,
  differently cropped WebGL panel projection.
- The physically radial CSS ring now remains the canonical upper surface before
  and after activation. The CSS reflection alone fades when the first WebGL
  frame is ready, while a 63% canvas inset exposes only the richer WebGL lower
  reflector. Category labels, pointer drag, keyboard controls, and the full
  360° facet rotation remain shared and synchronized.
- A focused production-artifact regression asserts that initial input activates
  WebGL without fading the upper ring, removes only the CSS reflection, and
  retains the canvas inset. A hardware in-app browser pass at 1280×720 confirmed
  identical upper-cylinder framing before and after hover, a complete
  Experience → Projects drag, the updated reflection, and zero application
  console errors.
- Final automated results: 236/236 Vitest assertions across 58 files; 90.23%
  statement, 80.41% branch, 83.27% function, and 93.51% line coverage;
  TypeScript and the production static build passed. The focused continuity plus
  main production journey produced five passing checks and three intentional
  activation-test skips across Chromium, Firefox, desktop WebKit, and iPhone
  WebKit.

### 2026-07-25 four-screen routes and reference proportions

- The follow-up production capture is retained as
  `frames/carousel-four-screen-proportion-feedback.png`. The live reference was
  reopened at 1280×720 and measured at approximately 592×333 px for the upper
  drum. The final production capture measures 586.3×330.6 px, with a 10.6 px
  static paper gap and a 106.6 px fallback reflector. Once WebGL is active, the
  clipped physical reflector is the intentionally quieter 45–60 px strip seen
  in the five-state comparison.
- Four 88° panels now occupy 90° category slots, leaving a real 2° seam between
  Experience, Projects, Skills, and Contact. The CSS fallback mirrors the same
  geometry with 48 radial facets per ring rather than visually curved flat
  cards. The centered face and category chip both link to the active standalone
  route.
- Three deterministic build/render/review passes are retained under
  `blender-renders/carousel-four-iteration-01/` through `-03/`. Iteration 01
  established the four-panel silhouette, iteration 02 tightened the vertical
  gap, and iteration 03 restored enough reflector body for the runtime clip
  without returning to the oversized shadow. The accepted six-view render is
  mirrored in `blender-renders/carousel-accepted/`.
- The final `public/models/portfolio-gateway.glb` is 5,132 bytes and 1,296
  triangles. It uses and requires `KHR_draco_mesh_compression`, has no embedded
  textures, and headless Blender 5.1.2 re-import confirms
  `carousel_experience_panel`, `carousel_projects_panel`,
  `carousel_skills_panel`, `carousel_contact_panel`, and
  `carousel_reflector_shell`. The shared Blender contract passes 9/9 tests.
- `carousel-four-comparison.png` was opened at 1920×720 with the live reference
  and the real production Experience, Projects, Skills, Contact, and full-cycle
  return states. All five states preserve the restored scale, physical seams,
  small lower gap, face crop, and quiet reflector. The individual captures and
  clean no-canvas reduced-motion fallback are retained under
  `site-screenshots/carousel-four-*`.
- `/experience`, `/projects`, `/skills`, and `/contact` are statically generated
  standalone screens with one main chapter each and the global navigation.
  Carousel face links, chips, header navigation, sitemap entries, and project
  case-study back links use those routes. The homepage remains the complete
  long-form portfolio.
- Final unit/component results: 244/244 assertions across 59 files; 90.22%
  statements, 80.88% branches, 83.33% functions, and 93.52% lines. TypeScript,
  the 12-route production build, deployment preparation, GLB inspection, and
  `git diff --check` pass. The non-timing Playwright regression matrix passes 21
  applicable journeys with 23 intentional project/device skips across Chromium,
  Firefox, desktop WebKit, and iPhone WebKit. The focused reference-proportion,
  activation-continuity, and four-route journey passes 3/3 in Chromium.
- Isolated Chromium SwiftShader page pacing passes at 11.5–14.6 fps; WebKit
  desktop's successful retry measures 29.4–30.4 fps and iPhone WebKit measures
  29.9–30.1 fps. The previously recorded hardware in-app gateway result remains
  67–103 fps. The unfiltered suite still reproduces three existing timing-only
  gates: the Chromium fluid-cursor floor, the sun-spectacle wall-clock ceiling,
  and the latest production baseline's Firefox mid-page pacing floor
  (6.9–7.6 fps). The latest baseline was rebuilt in a clean detached worktree
  and reproduced the Firefox result; the checked-out production baseline
  reproduced the sun test at approximately 4.98 seconds. No application-origin
  console or route errors occurred in the passing journeys.

### 2026-07-26 solid ground shadow

- The supplied 2014×1302 production capture is retained as
  `frames/carousel-active-reflector-regression.png`. The final direction removes
  the mirrored lower surface and replaces it with a fitted black oval.
- The 48-facet upper CSS drum remains the sole carousel artwork surface. Its
  approved dimensions, typography, four-category sequence, drag behavior,
  keyboard controls, and standalone route destinations are unchanged.
- One filled `#0a0b08` CSS ellipse now grounds the drum. Its width remains
  inside the upper artwork, with restrained opacity and a soft edge; the same
  shape is present on desktop, mobile, hover, and reduced-motion states. At
  1280×720 it measures 528×37.6 px beneath a 586.3 px drum (90.0% width); at
  390×844 it measures 296.4×27.3 px.
- Both mirrored implementations remain removed: no reflected CSS facet ring
  exists and the gateway never mounts its clipped WebGL canvas. The production
  JavaScript does not contain or preload the gateway GLB path.
- `site-screenshots/carousel-ground-shadow.png` captures the hovered state at
  1007×651. `carousel-ground-shadow-comparison.png` and
  `carousel-ground-shadow-states.png` document the fitted oval across
  Experience, Projects, Skills, Contact, and the full-cycle return.
- Component and production-browser regressions assert exactly one ground
  shadow, zero reflection layers, and zero gateway canvases before interaction,
  after hover, and under reduced motion while preserving the upper dimensions.
- Final verification passes 244/244 assertions across 59 files with 90.49%
  statements, 81.59% branches, 83.97% functions, and 93.75% lines. TypeScript,
  the 12-route production build, deployment preparation, `git diff --check`,
  the two focused shadow-removal journeys, and the complete Chromium portfolio
  journey all pass without application-origin console errors.

### 2026-07-26 surface-bound carousel labels

- The formerly camera-facing `.portfolio-gateway__face-label` has been removed.
  Each category word is now rendered as 12 clipped fragments inside the same
  12 CSS facets that carry its image. The fragments inherit the ring's complete
  rotation, including unsnapped drag angles and the 860 ms category transition.
- The final readability pass replaces the low-contrast `soft-light` blend with
  98%-opaque paper-white ink, a 0.5–0.8 px charcoal edge, and a compact local
  relief shadow. The treatment remains split and clipped across the same
  rotating facets, so it reads consistently over pale sky and dark architecture
  without becoming an independent glow plane or camera-facing text layer.
- The transparent `.portfolio-gateway__surface-link` preserves the active
  category destination, accessible name, keyboard focus ring, and click target.
  The category chip, four routes, drag thresholds, 48-facet geometry, artwork
  crops, physical gaps, and fitted ground shadow are unchanged.
- The production capture audit reports 48 surface labels and zero floating
  labels on both animated and reduced-motion paths. The final 1280×720 drum
  remains 586.3×330.6 px with its 528×37.6 px ground shadow.
- `site-screenshots/carousel-surface-label.png` records the settled Projects
  face, while `carousel-surface-label-transition.png` catches Experience leaving
  as Projects arrives. The opened
  `carousel-surface-label-comparison.png` places the former floating label,
  settled integrated label, and mid-spin state side by side. The opened
  `carousel-surface-label-readability-comparison.png` compares the faint
  surface treatment, the higher-contrast settled word, and the higher-contrast
  mid-spin state. Browser inspection at 1280×720 and 390×844 confirms the word
  remains readable and attached to the facets on desktop and mobile.
- Final verification passes 246 assertions across 60 files with 90.56%
  statements, 81.75% branches, 84.05% functions, and 93.80% lines. TypeScript,
  the 12-route production build, deployment preparation, capture audit, and the
  isolated surface-label drag/readability journey pass in Chromium, Firefox,
  desktop WebKit, and iPhone WebKit. The wider portfolio journey still reports
  unrelated timing/interception failures in the hero-canvas and mobile sun
  navigation checks after the carousel assertions have passed.

---

# Project spiral verification

Verified July 24, 2026 in the `codex/project-spiral` worktree.

## Reference and analysis

- The supplied screenshot and live `pacomepertant.com` experience were inspected
  before modeling.
- `video/pacomepertant-spiral-reference.mp4` was verified with `ffprobe`: H.264,
  1800 × 914, 3 fps, 3 seconds.
- The extracted sequence was inspected and the stable rest, quarter, middle, and
  late frames were curated under `frames/`.
- The complete composition, camera, repetition, motion, geometry, material, and
  fallback targets are appended to `ANALYSIS.md` without replacing the earlier
  hero analysis.

## Procedural asset

- `scripts/build_project_spiral.py` deterministically builds nine independently
  animated nodes: `project_card_01` through `project_card_09`.
- Two complete build/render/review passes are retained in
  `blender-renders/project-spiral-iteration-01/` and
  `blender-renders/project-spiral-iteration-02/`. The accepted six views are
  `blender-renders/turntable-01.png` through `turntable-06.png`.
- Shared Blender library contract: 9/9 tests passed in Blender 5.1.2 after
  integrating the existing gateway-panel and new project-card primitives.
- Final GLB: `public/models/project-spiral.glb`.
  - 8,220 bytes compressed.
  - 5,184 triangles.
  - `KHR_draco_mesh_compression` used and required.
  - `NORMAL`, `POSITION`, and `TEXCOORD_0` survive optimization.
  - No embedded textures.
  - Headless Blender re-import confirmed all nine exact node names.
- Local Draco decoders are served from `public/draco/`; there is no decoder CDN
  dependency.

## Site integration and fallbacks

- The project section uses a pinned R3F helix with three real project textures
  distributed across nine curved cards.
- Scroll phase and velocity are passed through mutable refs; React state changes
  only when the active linked project changes. A native sticky stage owns the
  viewport hold while ScrollTrigger measures progress, so direct anchor jumps
  always release the spiral at the Projects section boundary.
- Desktop uses bounded DPR and continuous rendering. Mobile uses DPR 1 and an
  intentional demand-driven 30 fps loop.
- `?stats=1` exposes the R3F performance overlay.
- No-WebGL, no-JavaScript, and `prefers-reduced-motion` retain the complete
  normal-flow three-project list with the same images, titles, and routes.
- The scene is lazy-mounted near the viewport and cloned before materials and
  named nodes are used.

## Visual comparison

- Production captures exist at the start and at 25%, 50%, 75%, and 100% of the
  pinned scroll range under `site-screenshots/spiral-*.jpg`.
- `comparison.png` was opened and reviewed against the reference. The result
  preserves the black grid, open vertical helix, edge-on card silhouettes,
  depth scaling, viewport clipping, cyclic order, and scroll-driven rotation.
- A clean mobile WebGL capture and static fallback capture are retained as
  `site-screenshots/spiral-mobile.jpg` and
  `site-screenshots/spiral-fallback.jpg`.

Intentional differences:

- The portfolio has three source artworks, so the nine-card loop repeats those
  works instead of presenting the reference's 10–12 unique pieces.
- The existing cream portfolio header remains visible for wayfinding.
- Velocity skew is restrained and motion blur is omitted to preserve artwork
  clarity and mobile performance.

## Performance

- Dedicated scene, desktop 1280 × 720: Stats reported 108–120 fps at rest on the
  connected hardware-accelerated browser.
- Dedicated scene, mobile 390 × 844: Stats reported 30–44 fps with DPR 1 and the
  demand-driven mobile loop.
- The cross-browser production E2E sampler checked 0%, 25%, 50%, 75%, and 100%
  page states. WebKit desktop held 55.3–60.1 fps and WebKit iPhone held
  59.8–60.2 fps. Chromium's automated renderer identified itself as SwiftShader,
  so its lower software-rendered measurements are treated as throttled test
  infrastructure rather than the hardware target.
- No postprocessing, multisampling, per-frame React rendering, or per-frame
  object allocation was added to the spiral.

## Automated gates

- Unit/integration coverage: 56 files, 229 tests passed.
  - Statements: 90.24%.
  - Branches: 80.51%.
  - Functions: 83.07%.
  - Lines: 93.44%.
- TypeScript: `tsc --noEmit` passed.
- Production static build: passed for the home page, not-found page, and all
  three statically generated case-study routes.
- The project spiral journey passed in Chromium, Firefox, desktop WebKit, and
  iPhone WebKit. The integrated spiral/skill regression set passed 6 applicable
  journeys with 2 intentional engine skips after replacing GSAP pin ownership
  with the bounded sticky stage.
- Application-origin console errors: none in the passing E2E matrix.
- `git diff --check`: passed.

Non-release warnings:

- The test runner reports that `NO_COLOR` is overridden by `FORCE_COLOR`.
- Blender reports a deprecated world-node property during exploratory product
  renders; it does not affect the exported GLB or runtime.
- `npm audit --omit=dev` reports three high advisories in the existing Next.js,
  PostCSS, and Sharp dependency chain. This project deploys a static export and
  does not ship the affected Server Actions, middleware/proxy, rewrites, image
  optimizer, Edge runtime, or custom Next.js server paths; upgrading the
  framework remains a separate dependency-maintenance follow-up.
- The full integrated Playwright pass reproduces the live branch's inherited
  Chromium SwiftShader fluid-cursor floor failure (4–5 fps reported by that
  isolated canvas versus its 18 fps test floor). The untouched `source` worktree
  reproduces the same failure. Complete-page SwiftShader pacing remained
  19.2–23.1 fps, and WebKit remained 57.5–61 fps.

## Result

The reference analysis, two procedural iterations, compressed named-node GLB,
R3F integration, responsive/reduced-motion fallbacks, performance overlay,
five-state comparison, coverage, production build, and cross-browser E2E gates
are complete.

## July 24, 2026 — Upright texture and card-gap correction

- The live reference and deployed project section were reopened at 1800 × 914.
  The deployed image textures were vertically inverted, and the nearest cards
  intersected in both projected axes.
- Root cause: TextureLoader's default vertical flip was being applied to
  geometry using glTF UV orientation. The shared texture configuration now
  enforces `flipY = false`, sRGB output, capped anisotropy, and a texture update
  before the material becomes visible.
- The desktop card target was reduced to 19% of the R3F viewport width and the
  helix radius increased to 32%. A pure layout regression test uses the real
  Court Vision and Beat Stream aspect ratios and proves immediate neighbors do
  not intersect in projected 2D space. Mobile keeps a larger readable card ratio
  with the same negative-space invariant.
- `comparison.png` was rebuilt from the live reference plus corrected production
  captures at start, 25%, 50%, 75%, and 100%. It was opened at 1800 × 720 and
  confirms upright artwork and visible black gaps at all five states. Desktop
  and 390 × 844 browser renders were also inspected directly.
- Final verification: 234 tests across 57 files, 90.13% statements, 80.41%
  branches, 83.02% functions, and 93.44% lines. TypeScript and the eight-route
  production static export pass. The isolated production spiral journey passes
  in Chromium, Firefox, desktop WebKit, and iPhone WebKit with no
  application-origin console errors.

## July 25, 2026 — Visible helix and strict project cycle

- The user-supplied 2632 × 1672 production capture is retained as
  `frames/project-spiral-diagonal-regression.png`. It confirms that the upright
  and non-contact fixes were working, but the fourth card center sat roughly 96%
  of a viewport height from center, leaving only disconnected diagonal samples
  rather than a readable helix turn.
- Desktop vertical travel now places the fourth card on either side at 44% of
  viewport height. The horizontal radius is 44% of viewport width and target
  card width is 17%, giving every adjacent projected card pair a tested black
  gap while exposing the outward-and-returning S-curve.
- Mobile uses a 52% horizontal radius, 42% target card width, and 29% pitch
  factor. The outer center sits about 56% of viewport height from center, so the
  returning side remains visible without merging the readable cards.
- All nine slots now repeat the three real projects exactly:
  Court Vision → Beat Stream → Vision Bias Steering, three times. The texture
  material order and front-card route both consume the same exported slot
  sequence. Reverse motion naturally presents the inverse order.
- Five desktop captures at 0%, 25%, 50%, 75%, and 100% are retained as
  `site-screenshots/spiral-curve-*.png`; the inspected responsive captures are
  `spiral-curve-mobile.png` and `spiral-curve-fallback.png`.
  `comparison.png` was rebuilt and opened at 1800 × 720 with the original
  reference plus all five corrected states.
- The GLB, textures, materials, draw-call count, and render loop are unchanged;
  this refinement changes pure layout constants and project-slot data only.
- Final verification: 237 tests across 57 files pass with 90.13% statements,
  80.45% branches, 83.02% functions, and 93.44% lines. TypeScript and the
  eight-route production static export pass. The updated spiral journey verifies
  the A → B → C → A route sequence and passes in Chromium, Firefox, desktop
  WebKit, and iPhone WebKit with no application-origin console errors.

## July 25, 2026 — Reference-density refinement

- The five-state comparison from the visible-helix pass was reopened beside the
  2160 px-wide reference. Its 44% radius and 17% base card width preserved a
  curve but scattered the planes across excessive black space. The reference's
  two dominant planes instead occupy approximately 31–34% of its width with a
  narrow projected seam between them.
- Desktop now uses a 36% viewport-width radius, 24% base card width, and 21%
  viewport-height pitch. Depth scaling makes the front plane approximately 26%
  of the viewport width, while its immediate neighbor retains a tested
  0.2–1% projected horizontal gap. The fourth slot sits 40.32% of a viewport
  height from center, so the return side remains visibly curved.
- A live 1800 × 914 browser pass measured the nearest visible seams at
  approximately 18–22 px. The planes read as one compact helix without merging,
  matching the density of the reference rather than the previous diagonal
  satellite layout.
- `site-screenshots/spiral-curve-0.png` through
  `spiral-curve-100.png` were recaptured from the real WebGL scene at the five
  required scroll states. `comparison.png` was rebuilt and opened at original
  resolution; all five states preserve the compact cluster, upright artwork,
  black seams, visible return arc, and unchanged A → B → C sequence.
- Mobile ratios, the GLB, textures, materials, draw-call count, and render loop
  remain unchanged. The correction is limited to desktop layout constants and
  their reference-density regression tests.
- Final verification remains 237 tests across 57 files with 90.13% statements,
  80.45% branches, 83.02% functions, and 93.44% lines. TypeScript, the
  eight-route production static export, deployment preparation, `git diff
  --check`, and the isolated spiral journey all pass. The journey is green in
  Chromium, Firefox, desktop WebKit, and iPhone WebKit with no
  application-origin console errors.
