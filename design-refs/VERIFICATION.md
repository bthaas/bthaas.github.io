# Icarus Editorial Atlas Verification

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

## Automated release gates

- Unit/component/content tests: 25/25 passing across six files.
- Coverage: 97.91% statements, 94.73% branches, 100% functions, and 100% lines.
- TypeScript: `tsc --noEmit` passing.
- Production build and postbuild: passing; all routes are statically generated and the unused client
  runtime is removed from three HTML files.
- Dependency cleanup: GSAP, Lenis, and Motion are absent from the active source and lockfile.
- `git diff --check`: clean.
- Secret/debug scan: no credential patterns, debugger statements, TODOs, or FIXME markers in active
  application code. The postbuild script's single `console.log` is a build-status message and never
  ships to the browser.
- Package audit: zero known vulnerabilities after dependency removal.
