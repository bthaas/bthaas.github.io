# Awwwards portfolio verification

Verified on 2026-07-18 from `codex/phase-1-entrance-fluid-cursor`. This pass
covers the hydrated export, the once-per-session DrawSVG curtain entrance, the
lazy React Bits fluid cursor, the unchanged GSAP + ScrollTrigger + Lenis
choreography, and the lazy contact flock.

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
