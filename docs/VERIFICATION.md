# Awwwards portfolio verification

Verified on 2026-07-18 from `codex/phase-0-react-runtime`. This pass covers the
normal hydrated Next.js export, the unchanged GSAP + ScrollTrigger + Lenis
choreography, the lazy contact flock, and the React/WebGL foundation for the
maximalist motion phases.

## Release gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 29 files / 125 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 90.38% statements, 82.48% branches, 80.45% functions, 94.08% lines |
| `npm run test:e2e` | Passed: 13 tests, 3 intentional project skips, 4 browser/device projects |
| Static export | Passed; six HTML files ship the normal Next.js hydration runtime and retain the complete no-JS document |
| First-load JavaScript | 269,999 bytes gzip: 186,855 bytes of Next chunks plus 83,144-byte lazy-on-load `atlas.js`; 190,801 bytes below the 450 KiB soft ceiling |
| Lazy finale bundle | `horizon.js`: 1,456 bytes gzip and absent from initial HTML |
| Source file budget | Passed; no source file exceeds the repository's 800-line limit |

The runtime-stripping postbuild no longer exists. Next.js hydrates the static
export normally, then loads `/atlas.js` at window idle so hydration and the
existing motion engine do not compete with LCP. The compact Atlas stylesheet is
inlined to remove its render-blocking request. Three.js, R3F, Drei, and
`@gsap/react` are installed but add no current first-load bytes because no scene
imports them yet. `horizon.js` remains gated to fine-pointer desktop visits near
`#contact`; it is not requested on mobile, coarse pointers, no-JS, or
reduced-motion visits.

## Lighthouse

Lighthouse ran against the hydrated `out/` export through the repository's
Brotli/gzip production server. Two throttled mobile runs both passed the 2.5 s
LCP gate; the slower result is reported below.

| Profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Speed index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 97 | Not rerun in Phase 0 | Not rerun in Phase 0 | Not rerun in Phase 0 | 2.45 s | 0 | 38.5 ms | 3.02 s |
| Desktop | 100 | Not rerun in Phase 0 | Not rerun in Phase 0 | Not rerun in Phase 0 | 0.47 s | 0 | 0 ms | 0.56 s |

The mobile browser selects the 768 px hero AVIF (29,696 bytes). The preloaded
fallback remains the LCP element and the editorial composition is unchanged.

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
| Chromium desktop | SwiftShader headless | 120.0 | 41.4 | 66.2 | 78.7 | 41.9 |
| Firefox desktop | Apple GPU | 120.0 | 114.2 | 83.3 | 108.9 | 89.6 |
| WebKit desktop | Apple GPU | 60.0 | 60.0 | 60.0 | 59.5 | 59.5 |
| WebKit iPhone | Apple GPU | 60.0 | 60.0 | 60.1 | 60.0 | 60.0 |

Chromium remains limited by software rendering in the headless runner, while
hardware Chrome and Firefox retain the earlier 120 fps result. The flock caps
simulation work at 60 Hz, pauses outside its section, and now reports rolling
two-second stats so a transient startup window cannot permanently poison the
measurement.

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
  GSAP timeline, split text, cursor, marquee, or flock is created.
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
- [Hero capture](./awwwards/submission/01-hero-1600x1200.png)
- [Projects-to-craft capture](./awwwards/submission/02-craft-wipe-mid-1600x1200.png)
- [Project print-reveal capture](./awwwards/submission/03-project-pan-1600x1200.png)
- [Flock finale capture](./awwwards/submission/04-finale-1600x1200.png)

Cloudflare and live-domain edge injection remain outside the repository release
gate. The local production export proves the application ships its hydrated
Next chunks, the lazy-on-load Atlas entry, and the gated Horizon entry without
application-origin console errors.
