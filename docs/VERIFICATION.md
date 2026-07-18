# Awwwards portfolio verification

Verified on 2026-07-18 from `codex/phase-d-submission-polish`. This pass covers
the GSAP + ScrollTrigger + Lenis engine, the re-choreographed atlas, the Phase C
signature motion, and the lazy contact flock.

## Release gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 30 files / 128 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 90.74% statements, 83.13% branches, 80.81% functions, 94.20% lines |
| `npm run test:e2e` | Passed: 13 tests, 3 intentional project skips, 4 browser/device projects |
| Static export | Passed; six HTML files contain `/atlas.js` and no React/Next.js runtime |
| Motion bundle | `atlas.js`: 83,145 bytes gzip, below the 100 KiB gate |
| Lazy finale bundle | `horizon.js`: 1,461 bytes gzip, below the 220 KiB gate |
| Source file budget | Passed; no source file exceeds the repository's 800-line limit |

The production postbuild injects a content-hashed deferred `/atlas.js` URL.
`horizon.js` is absent from initial HTML: Atlas injects its content-hashed URL
once, only when a fine-pointer desktop approaches `#contact`. It is not requested
on mobile, coarse pointers, no-JS, or reduced-motion visits.

## Lighthouse

Lighthouse ran against the stripped `out/` export through the repository's
Brotli/gzip production server.

| Profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Speed index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 100 | 100 | 1.35 s | 0 | 18 ms | 1.23 s |
| Desktop | 100 | 100 | 100 | 100 | 0.43 s | 0 | 0 ms | 0.42 s |

The mobile browser selects the new 768 px hero AVIF (29,696 bytes). The hero
plate now paints immediately instead of waiting for an entrance clip, preserving
the editorial composition while keeping LCP inside the 1.8-second guardrail.

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
| Chromium desktop | SwiftShader headless | 108.9 | 31.9 | 43.2 | 46.0 | 26.7 |
| Firefox desktop | Apple GPU | 120.0 | 107.0 | 71.5 | 91.9 | 30.4 |
| WebKit desktop | 30 fps runner cap | 30.2 | 30.2 | 30.0 | 29.8 | 30.2 |
| WebKit iPhone | 30 fps runner cap | 30.0 | 30.1 | 29.9 | 30.1 | 30.0 |

Chromium's contact result was isolated to software rendering: the same headless
run measured about 49 fps with the flock and about 96 fps with its canvas hidden,
while hardware Chrome held 120 fps through the finale. The flock itself caps
simulation work at 60 Hz and pauses whenever its section is not visible.

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
gate. The local production export proves the application itself ships only the
deferred atlas entry initially and the gated horizon entry on approach.
