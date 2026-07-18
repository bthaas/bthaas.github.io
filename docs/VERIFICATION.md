# Awwwards portfolio verification

Verified on 2026-07-18 from `codex/phase-5-micro-insanity`. Phase 5 adds one
session-gated “too close to the sun” spectacle, an ink-on-paper missing plate,
iridescent print varnish, and the tab-title wink without changing copy, artwork,
palette, typography, or section order.

## Phase 5 micro-insanity gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 45 files / 179 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 89.76% statements, 80.27% branches, 82.29% functions, 93.12% lines |
| `npm run test:e2e` | Passed: 21 journeys and 15 intentional single-engine skips across Chromium, Firefox, desktop WebKit, and iPhone WebKit |
| Sun spectacle | Five native-button activations or the Konami sequence release one session-gated 3.81 s flare/blizzard/landing timeline |
| Reduced motion | No flare, blizzard, golden feather, sheen, glitch canvas, or decorative WebGL canvas runs; the title wink remains available |
| 404 fallback | Semantic copy and return link server-render; the React Bits ink field and low-density Phase 2 feather scene are decoration only |

The existing travelling sun remains Atlas-owned. React adds a dedicated native
button centered over the sun badge and dispatches a hit event; the spectacle
controller owns only its fixed flare and the dedicated golden-feather node beside
the email action. The feather scene receives the same one-shot event through a
mutable ref. Its frame loop performs no spectacle clock read while inactive and
reuses the existing frame record when active. Pure choreography maps the first
flash, peak blizzard, and final landing over 3,800 ms and unit tests cover its
Konami recovery, clamping, and ordered beats.

The source-vendored React Bits `LetterGlitch` keeps one strict TypeScript canvas
variant, derives its glyph set from the missing-plate sentence, and uses the
shared GSAP ticker. The 404 reuses the Phase 2 feather GLB at the hero keyframe,
which exposes roughly 17 of 120 desktop records rather than creating another
scene or asset. Reduced motion never creates either canvas. Plate sheen is a
CSS gradient/mask pseudo-element; removing permanent `will-change` promotion
restored Firefox project-flight pacing while retaining promotion only during
hover/focus.

Production JavaScript is 250,223 bytes gzip for the initial Next chunks and
332,852 bytes including lazy Atlas, 127,948 bytes below the 450 KiB initial soft
ceiling. The shared Three/R3F scene is 258,925 bytes gzip and the fluid chunk is
5,747 bytes, producing 597,524 bytes after every homepage showpiece mounts.
`/horizon.js` remains an independent 1,504-byte gzip finale. The 404 shares the
same deferred scene runtime instead of duplicating Three.

Final page-level frame pacing through 0/25/50/75/100% scroll:

| Project | Renderer / tier | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chromium desktop automation | SwiftShader, software WebGL | 29.7 | 25.6 | 22.3 | 22.4 | 24.9 |
| Firefox desktop automation | Apple GPU | 62.2 | 54.9 | 22.1 | 25.8 | 34.7 |
| WebKit desktop automation | Apple GPU | 60.5 | 60.9 | 60.8 | 60.8 | 59.3 |
| WebKit iPhone automation | Apple GPU, mobile-40 | 60.0 | 60.0 | 60.0 | 60.0 | 60.0 |

Phase 5 desktop and 390 px mobile captures are in
`docs/awwwards/screenshots/step-19/`. The inspected varnish, blizzard, golden
landing, and missing-plate montage is
`design-refs/comparison-phase5.png` and the current `comparison.png`.

Verified on 2026-07-18 from `codex/phase-4-project-flight-path`. Phase 4 turns
the three accepted field-study plates into a native-scroll horizontal flight
path on desktop, keeps mobile in normal vertical flow, replaces rectangular
chapter curtains with halftone print dissolves, and adds bounded dossier tilt.

## Phase 4 project-flight gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 41 files / 169 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 89.83% statements, 80.02% branches, 81.69% functions, 93.43% lines |
| `npm run test:e2e` | Passed: 19 journeys and 9 intentional project skips across Chromium, Firefox, desktop WebKit, and iPhone WebKit |
| Horizontal navigation | Native wheel/touch scroll drives one GSAP pin; focused cards and `#project-*` fragments map to exact normal-document positions in Chromium, Firefox, and WebKit |
| Static and mobile paths | No pin or project canvas under 768 px, reduced motion, no WebGL, or no JavaScript; all three case-study links remain in vertical/three-column normal flow |
| Animation ownership | React owns only the homepage flight-path track, image wrappers, shared canvas, and dedicated flight-log tilt surfaces; Atlas project effects remain on case-study pages |

Desktop uses measured track overflow as its pin distance, without wheel or touch
handlers. One lazily mounted R3F canvas travels inside the track and draws three
40×28 image planes with the Phase 3 liquid shader family. Velocity is bounded to
5° skew and 0.008 UV/bend response; the three DOM pictures stay rendered below
the canvas until all textures, layout measurements, and the first WebGL frame are
ready. A scene error returns immediately to those fallbacks. Mobile deliberately
uses the image plates with bounded velocity skew and no pin or project WebGL.
Mesh refs, material refs, cover vectors, and choreography targets are allocated
once; the R3F frame loop mutates those objects without per-frame allocations.

Each panel has a stable `#project-{slug}` id. Keyboard focus scrolls its matching
pinned progress while preserving the link's Enter behavior, and hash navigation
does the same after initial load or `hashchange`. E2E verifies the focused middle
card is centered, the final fragment is visible, mobile top positions remain
strictly vertical, and document width never exceeds the viewport.

The chapter layer now uses a reversible 12 px radial mask grid instead of a
clip-path edge. Both standard and WebKit mask declarations were exercised in
Firefox, Chromium, desktop Safari/WebKit, and iPhone WebKit. The source-vendored
React Bits `TiltedCard` adaptation owns a dedicated inner flight-log surface and
caps both axes at 6°, leaving Atlas DrawSVG, SplitText, and Flip dossier geometry
unchanged.

Production JavaScript is 245,862 bytes gzip for the initial Next chunks and
328,738 bytes including lazy Atlas, 132,062 bytes below the 450 KiB initial soft
ceiling. The shared Three/R3F scene chunk is 259,579 bytes gzip and the fluid
cursor chunk is 5,791 bytes, producing 594,108 bytes after every showpiece has
mounted. Phase 4 adds the gallery scene to the existing shared deferred chunk
rather than loading another Three runtime.

Final page-level frame pacing through 0/25/50/75/100% scroll:

| Project | Renderer / tier | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chromium desktop automation | SwiftShader, software WebGL | 29.6 | 25.6 | 22.2 | 24.9 | 21.7 |
| Firefox desktop automation | Apple GPU | 61.0 | 54.0 | 21.8 | 25.3 | 34.0 |
| WebKit desktop automation | Apple GPU | 61.6 | 61.2 | 60.1 | 60.0 | 59.5 |
| WebKit iPhone automation | Apple GPU, mobile-40 | 60.1 | 60.0 | 60.0 | 60.0 | 60.0 |

SwiftShader is the documented CPU-rendered tier. The new gallery uses DPR 1 and
demand rendering; hardware-backed WebKit remains at display rate, while iPhone
does not mount the project canvas. Phase 4 captures are in
`docs/awwwards/screenshots/step-18/`; the inspected source/before/after montage
is `design-refs/comparison-phase4.png` and the current `comparison.png`.

Verified on 2026-07-18 from `codex/phase-3-hero-kinetic-type`. Phase 3 turns
the accepted hero plate into an interaction-driven liquid WebGL surface, moves
masthead ownership from Atlas DOM code to React/GSAP, and introduces four
full-bleed kinetic chapter bands plus the travelling circular sun label.

## Phase 3 hero and kinetic-type gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 38 files / 157 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 90.61% statements, 81.53% branches, 82.22% functions, 94.02% lines |
| `npm run test:e2e` | Passed: 15 journeys and 9 intentional project skips across Chromium, Firefox, desktop WebKit, and iPhone WebKit |
| Hero fallback | The responsive `<picture>` remains server-rendered, preloaded, and `fetchpriority="high"`; no-JS, reduced-motion, and failed-WebGL paths never require the canvas |
| Animation ownership | React exclusively owns hero parallax and masthead SplitText/scatter; the corresponding Atlas setup functions and runtime hooks were deleted in the same change |
| Reduced motion | No hero, feather, fluid, or horizon canvas mounts; type and sun decoration remain static and the complete editorial document is readable |

The liquid plane reuses the accepted hero AVIF and exact 16:8.7 / 4:4.5 layout
box. Pointer rings are bounded to 0.009 UV displacement; Lenis velocity is
bounded to 0.006 UV shift/bulge. The plane renders on demand while pointer or
scroll energy is present, sleeps glass-flat at idle, and unmounts after the hero
leaves its observer margin. The 9 masthead characters scatter deterministically
to at most 18 degrees and return to identity transforms and full opacity at the
top. `FLIGHT LOG`, `FIELD STUDIES`, `SKILLS`, and `NEXT HORIZON` are duplicate,
`aria-hidden` outline bands using the vendored React Bits ScrollVelocity pattern.

The two R3F experiences import one shared deferred scene module. Production
JavaScript is 243,463 bytes gzip for the initial Next chunks and 326,246 bytes
including the lazy Atlas runtime, 124,554 bytes below the 450 KiB soft ceiling
before WebGL mounts. The shared Three/R3F/scene line is 259,069 bytes gzip and
the fluid chunk is 5,774 bytes, producing 591,089 bytes after every showpiece
has mounted. This is 54,317 bytes above Phase 2's already documented post-mount
exception, but avoids the 236 KB duplicate Three runtime emitted by separate
dynamic boundaries. `/horizon.js` remains an independent 1,501-byte gzip finale.

Local production paint instrumentation confirms the preloaded hero AVIF remains
the LCP element: desktop LCP 456 ms / CLS 0.00011 and mobile LCP 304 ms / CLS
0.00025. These local values are regression checks rather than throttled
Lighthouse replacements; the Phase 1 throttled 1.40 s mobile gate remains the
release baseline.

Final page-level frame pacing through 0/25/50/75/100% scroll:

| Project | Renderer / tier | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chromium desktop automation | SwiftShader, software WebGL | 28.3 | 20.6 | 21.9 | 24.1 | 18.4 |
| Firefox desktop automation | Apple GPU | 54.5 | 38.5 | 23.4 | 37.9 | 29.9 |
| WebKit desktop automation | Apple GPU | 60.0 | 59.8 | 60.0 | 60.5 | 59.4 |
| WebKit iPhone automation | Apple GPU, mobile-40 | 60.0 | 59.9 | 59.9 | 60.0 | 60.0 |

The software tier uses 40 feathers/DPR 1, a 32 px fluid solve with a 128 px dye
buffer, and a 12-bird/DPR 1 finale. Fluid and liquid loops sleep after input;
the hardware WebKit tiers remain at display rate. Phase 3 captures are in
`docs/awwwards/screenshots/step-17/`; the inspected reference/load/scatter/band
montage is `design-refs/comparison.png`.

Verified on 2026-07-18 from `codex/phase-2-feather-fall`. This pass adds the
fixed R3F feather narrative to the hydrated export while retaining the Phase 1
entrance, React Bits fluid cursor, GSAP + ScrollTrigger + Lenis choreography,
and lazy contact flock.

## Phase 2 feather-fall gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 35 files / 148 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 90.18% statements, 81.34% branches, 81.47% functions, 93.87% lines |
| `npm run test:e2e` | Passed: 14 tests, 6 intentional project skips, Chromium/Firefox/WebKit desktop plus WebKit iPhone |
| Blender helper contract | Passed in Blender 5.1.2: four deterministic primitive/material/export tests |
| Feather GLB | 6,108 bytes, 804 triangles, three centered named nodes, required `KHR_draco_mesh_compression`, no textures |
| Runtime tiers | 120 records and bounded DPR on hardware desktop; 40 records, DPR 1, and intentional 30 Hz rendering on mobile or detected software WebGL |
| Reduced motion / no WebGL | The React shell server-renders nothing and never mounts a canvas when either gate fails |

The scroll bus now publishes Lenis velocity with document progress. The R3F
scene consumes both through mutable refs, allocates matrices, spring arrays,
materials, and seed records once, and performs no React state updates or object
allocation in its frame loop. Its three variant/layer batches share two
materials: a clearer near layer and a softer, lower-opacity far layer. Pointer
motion above 500 px/s emits a bounded radial impulse and every affected feather
returns through a damped spring.

Modern initial JavaScript before the deferred scene remains 268,749 bytes gzip,
192,051 bytes below the 450 KiB soft ceiling. The explicitly accepted Three/R3F,
GLTFLoader, Stats, and local Draco-wrapper line adds 268,023 bytes gzip after the
canvas mounts, for 536,772 bytes post-mount (455,583 bytes Brotli). This is a
documented soft-ceiling exception rather than an initial-route regression: the
scene is `next/dynamic` with `ssr: false`, mounts after two paints plus an idle
slot, and the 6 KB model/188 KB decoder WASM are separate binary assets. Phase 3
must reuse the loaded Three/R3F runtime rather than introduce a second 3D stack.

Frame pacing through 0/25/50/75/100% scroll after Phase 2:

| Project | Renderer / tier | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Hardware in-app Chromium | Apple GPU, desktop-120 | 120 | 120 | 120 | 120 | 120 |
| Chromium desktop automation | SwiftShader, desktop-software-40 | 25.2 | 17.1 | 21.8 | 21.1 | 19.8 |
| Firefox desktop automation | Apple GPU, desktop-120 | 69.5 | 42.9 | 25.3 | 28.0 | 33.0 |
| WebKit desktop automation | Apple GPU, desktop-120 | 59.7 | 61.0 | 59.5 | 60.1 | 60.1 |
| WebKit iPhone automation | Apple GPU, mobile-40 | 60.1 | 60.0 | 60.0 | 60.1 | 59.9 |

The page-level iPhone numbers reflect display `requestAnimationFrame`; the
feather canvas itself is intentionally invalidated at 30 Hz. SwiftShader is
explicitly tiered and documented because it is a CPU software renderer, not the
mid-desktop hardware acceptance target.

Phase 2 captures are in `docs/awwwards/screenshots/step-16/`; the inspected
reference/runtime montage is `design-refs/comparison.png`.

## Release gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 32 files / 136 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 89.67% statements, 81.10% branches, 80.58% functions, 93.57% lines; the browser-only vendored shader is exercised by E2E rather than V8 unit instrumentation |
| `npm run test:e2e` | Passed: 14 tests, 6 intentional project skips, 4 browser/device projects |
| Static export | Passed; six HTML files ship the normal Next.js hydration runtime and retain the complete no-JS document |
| First-load JavaScript | 268,732 bytes gzip after the cursor lazy-mounts: 185,523 bytes of Next chunks (including the 5,685-byte fluid chunk) plus 83,209-byte lazy-on-load `atlas.js`; 192,068 bytes below the 450 KiB soft ceiling |
| Lazy finale bundle | `horizon.js`: 1,456 bytes gzip and absent from initial HTML |
| Source file budget | Authored modules remain below 800 lines; the source-vendored React Bits shader is the sole 1,200-line exception and is split from the initial route chunk |

Next.js hydrates the static export normally, then loads `/atlas.js` at window
idle. React owns only two dedicated Phase 1 overlays. The 1.18-second preloader
uses snapped percentage frames, DrawSVG, and two clip-path curtains, then emits
`atlas:preloader-complete` so Atlas can release its existing masthead entrance.
The vendored fluid simulation mounts after two paints and an idle slot, solves
at 64 px with a 256 px dye buffer, caps DPR at 1.25 and rendering at 60 fps, and
uses deterministic citron/dusk ink. It never mounts without WebGL, a fine
pointer, hover, or motion permission.

## Lighthouse

Lighthouse ran against the hydrated `out/` export through the repository's
Brotli/gzip production server. The final throttled mobile run passed the 2.5 s
LCP gate after confirming that the entrance remains an overlay rather than an
opaque paint blocker.

| Profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Speed index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | Not rerun in Phase 1 | Not rerun in Phase 1 | Not rerun in Phase 1 | 1.40 s | 0.00018 | 7 ms | 1.48 s |
| Desktop | 100 | Not rerun in Phase 0 | Not rerun in Phase 0 | Not rerun in Phase 0 | 0.47 s | 0 | 0 ms | 0.56 s |

The mobile browser selects the 768 px hero AVIF (29,696 bytes). The cream
preloader paper is optically opaque but retains 0.5% transparency, so the
already-rendered fallback remains the LCP element instead of being treated as
occluded. The editorial composition is unchanged.

## Motion performance

Frame pacing was sampled after each scroll position had settled. Hardware-backed
headed runs establish the desktop result; the Playwright table records the
repeatable cross-browser release gate. Automated WebKit is intentionally capped
near 30 fps by its runner, so stability and frame variance—not a synthetic 60 fps
claim—are the meaningful result there.

| Hardware browser | Renderer | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chrome, macOS | Apple M3 Pro / Metal | 120 | 120 | 120 | 120 | 120 |
| Firefox, macOS | Apple GPU | 118.7 | 120.1 | 120.0 | 118.7 | 120.0 |

| Automated project | Renderer / constraint | 0% | 25% | 50% | 75% | 100% |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Chromium desktop | SwiftShader headless | 47.2 | 22.8 | 29.6 | 28.4 | 24.8 |
| Firefox desktop | Apple GPU | 120.0 | 82.3 | 32.5 | 35.2 | 44.5 |
| WebKit desktop | Apple GPU | 60.0 | 60.0 | 60.2 | 60.0 | 60.1 |
| WebKit iPhone | Apple GPU | 60.1 | 59.7 | 60.0 | 60.0 | 60.0 |

Chromium remains limited by software rendering in the headless runner, while
the hardware-backed in-app Chromium run reports the fluid solve at its intended
60 fps cap. The fluid canvas is absent on mobile, and the flock caps simulation
work at 60 Hz and pauses outside its section.

## Browser and behavior matrix

| Browser / device | Viewport | Result |
| --- | --- | --- |
| Chromium desktop | 1600 × 1200 | Full GSAP/ScrollTrigger choreography, Lenis, dossiers, cursor, flock, and programmatic scroll passed. |
| Firefox desktop | 1600 × 1200 | Full choreography passed; no CSS scroll-timeline fallback or static downgrade. |
| WebKit desktop | 1600 × 1200 | Choreography, keyboard scrolling, dossiers, lazy finale, and overflow checks passed. |
| WebKit iPhone | iPhone 13 profile | Native touch scroll, responsive composition, stable 30 fps, and no premature finale bundle passed. |

Every project checks application-origin console errors, failed same-origin
requests, horizontal overflow, dossier keyboard/ARIA state, and the contact
finale. None failed. Anchor and programmatic scrolling use a passive native
scroll signal in addition to Lenis/ScrollTrigger, preventing stale progress when
a browser jumps directly to a chapter.

## Accessibility and static paths

- `prefers-reduced-motion` exits before engine or DOM preparation: no Lenis,
  GSAP timeline, split text, preloader, fluid canvas, cursor, marquee, or flock
  is created.
- The reduced-motion DOM matches the static export, with zero running animations
  and intact native heading text.
- JavaScript-disabled runs retain every section, project link, contact action,
  semantic landmark, and dossier body.
- Flip dossiers keep `aria-expanded`, `aria-controls`, Enter/Space operation,
  visible focus, and settled neighboring layout.
- SplitText uses its built-in heading ARIA support. Decorative index and craft
  ghost numerals are removed from the accessibility tree.
- Lighthouse accessibility is 100 on desktop and mobile; application-origin
  console errors are zero.

## Contact-flourish decision gate

The required Vanta first attempt was evaluated and rejected. `vanta@0.5.24`
does not pin a compatible Three.js version; the current Three release failed its
runtime assumptions, while a compatible r134 test rendered but still read as a
stock Vanta preset. The shipped alternative is a deterministic, palette-aware
2D canvas flock with sparse silhouette birds. It is more bespoke, substantially
smaller, and held the hardware frame budget.

## Submission artifacts

- [Submission kit](./awwwards/SUBMISSION.md)
- [Step 13 desktop/mobile captures](./awwwards/screenshots/step-13/)
- [Step 15 entrance/fluid captures](./awwwards/screenshots/step-15/)
- [Hero capture](./awwwards/submission/01-hero-1600x1200.png)
- [Projects-to-craft capture](./awwwards/submission/02-craft-wipe-mid-1600x1200.png)
- [Project print-reveal capture](./awwwards/submission/03-project-pan-1600x1200.png)
- [Flock finale capture](./awwwards/submission/04-finale-1600x1200.png)

Cloudflare and live-domain edge injection remain outside the repository release
gate. The local production export proves the application ships its hydrated
Next chunks, the lazy-on-load Atlas entry, and the gated Horizon entry without
application-origin console errors.
