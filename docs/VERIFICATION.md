# Awwwards portfolio verification

Verified on 2026-07-15 from `codex/step-8-qa-submission-kit`, based on the Step 7 merge commit `436f1ac` on `source`.

## Step 8 findings and fixes

The browser and performance baseline was visually correct. Full axe-core testing found one markup defect that Lighthouse's accessibility subset did not report: four `<article role="listitem">` elements used a role that axe considers invalid for that element. The flight log now uses a native `<ol>`/`<li>` structure. Four generic elements with accessible names also received appropriate `group`, `list`, `region`, and `timer` roles.

A contrast probe found that the tiny project case and technology labels dipped below 4.5:1 at the first frame of their scroll-linked entrance. Their starting opacity increased from `0.35` to `0.72`; the transform choreography and final appearance are unchanged. The follow-up probe reports zero contrast violations.

## Automated gates

| Gate | Result |
| --- | --- |
| `npm run verify` | Passed: 18 files / 91 tests, typecheck, and production build |
| `npm run test:coverage` | Passed: 92.71% statements, 81.76% branches, 85.45% functions, 95.61% lines |
| Production export | Passed; `/`, `/404.html`, robots, and sitemap generated |
| Source file budget | Passed; largest source file is 763 lines, below 800 |
| Static script audit | Passed; `/atlas.js` is the only script in every exported HTML file |
| Atlas bundle | 21,793 bytes raw; 6,864 bytes gzip |

## Performance

Lighthouse 13.4.0 ran against the local `out/` export through a compression-capable production static server. A non-compressing Python server was rejected as unrepresentative after it inflated the simulated mobile LCP to about 1.88 seconds while the observed LCP was only 118 milliseconds.

| Profile | Runs | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 3 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 1.503 s median | 0 | 0 ms |
| Desktop | 1 | 100 | 100 | 100 | 100 | 408 ms | 0 | 0 ms |

Event Timing traces were captured after the target chapter had settled, matching real interaction conditions:

| Interaction | Worst event duration | Long tasks | State check |
| --- | ---: | ---: | --- |
| Flight-log expander | 56 ms | 0 | `aria-expanded` changed to `true` |
| Magnetic repository link | 24 ms | 0 | magnetic enhancement initialized |

Both traces are below the 200 ms INP budget. A deliberately invalid trace that clicked during programmatic smooth scrolling was discarded because it measured the scripted scroll's presentation delay, not a settled user interaction.

## Accessibility

- axe-core 4.12.1: zero violations and 42 passing rules.
- Contrast follow-up with pseudo-elements disabled: zero violations. The remaining incomplete result contains image-backed/decorative text that axe cannot resolve automatically and was reviewed visually.
- Keyboard journey: the skip link is first, lands at `#main-content`, then continues through the hero call to action, the focusable craft ticker, all three field-note toggles, project links, contact, and footer links.
- Expander keyboard behavior: Enter opens and Space closes while focus remains on the button.
- Reduced motion at 390 × 844: media query matched, zero running animations, no horizontal overflow, and all unsplit headings retained their native text.
- Screen-reader spot checks: the split masthead and finale expose intact heading names; the native flight-log list contains four direct items; current navigation uses `aria-current="true"`; dossiers expose button state and controlled content.

## Browser matrix

| Browser / device | Viewport | Result and notes |
| --- | --- | --- |
| Chrome 150 / Chromium desktop | 1440 × 1000 and 1600 × 1200 | Hero entrance, sticky hero copy, lime chapter wipe, trajectory panels, sun arc, project pans, cursor, magnetic links, and finale passed. |
| Chrome 150 / Android DevTools-size profile | 390 × 844 | No horizontal overflow; responsive navigation, portrait art, chapter anchors, sun arc, expanders, and contact stack passed. |
| Safari 26.5 on macOS | Desktop app window | Hero, chapter wipe, sticky trajectory state, sun navigation, and field-note expansion passed visually and through the accessibility tree. |
| Firefox 137.0.2 on macOS | Desktop app window | Hero, craft plate/ticker, project transition, sticky states, keyboard scroll, and navigation passed. |
| iOS Safari, iOS 18.5 Simulator, iPhone 16 Pro | Device viewport | Hero portrait crop, responsive navigation, sun arc, craft anchor/wipe, and trajectory sticky composition passed. |

Application-origin console errors: none observed. No dependency warning affected runtime behavior.

## Content and metadata

- Title: `Brett Haas`.
- Description: `Brett Haas is a software engineer building ambitious products across AI, web, mobile, and intelligent systems.`
- Canonical URL: `https://bthaas.github.io`.
- Open Graph image: `/icarus-atlas/hero-social-1600.webp` at 1600 × 900.
- `robots.txt` allows crawling and points to the sitemap.
- `sitemap.xml` contains the canonical homepage.
- Project, GitHub, LinkedIn, email, and in-page destinations are present and keyboard reachable.

## Script and deployment boundary

The local production export contains exactly one script tag in each HTML file, all pointing to `/atlas.js`. The Next.js framework runtime is removed by the postbuild step.

Cloudflare remains explicitly out of scope. No Cloudflare page, setting, or live-domain script audit was opened or changed. Confirming the live domain's edge-injected scripts remains a deferred, manually handled follow-up; it is not a blocker for the local production gate.

## Submission artifacts

- [Submission kit](./awwwards/SUBMISSION.md)
- [Desktop PR screenshot](./awwwards/screenshots/step-8/portfolio-1440.png)
- [Mobile PR screenshot](./awwwards/screenshots/step-8/portfolio-390.png)
- [Hero capture](./awwwards/submission/01-hero-1600x1200.png)
- [Craft wipe capture](./awwwards/submission/02-craft-wipe-mid-1600x1200.png)
- [Project pan capture](./awwwards/submission/03-project-pan-1600x1200.png)
- [Finale capture](./awwwards/submission/04-finale-1600x1200.png)

## Issue triage

No nonblocking product findings remain from this pass. The repository had zero open issues immediately before the pull request handoff.
