# Awwwards submission kit

## Captures

All submission captures are PNG at exactly 1600 × 1200.

| Frame | File | Purpose |
| --- | --- | --- |
| 01 | [Hero](./submission/01-hero-1600x1200.png) | Establishes the sunlit atlas, masthead, editorial grid, and core positioning. |
| 02 | [Craft wipe, mid-transition](./submission/02-craft-wipe-mid-1600x1200.png) | Shows the cream-to-citron chapter handoff at approximately 50% clip progress. |
| 03 | [Project pan](./submission/03-project-pan-1600x1200.png) | Shows the Court Vision plate, sticky title, case-study copy, and lateral image state. |
| 04 | [Finale](./submission/04-finale-1600x1200.png) | Resolves the header sun with the sunrise plate, contact statement, and footer. |

## 50-second recording script

| Time | Direction | Voiceover / caption |
| --- | --- | --- |
| 0–6 s | Hold on the hero, then begin a slow scroll. | “An editorial atlas for engineering, applied AI, and product craft.” |
| 6–13 s | Let the nameplate release and the signal metrics count into place. | “Verified outcomes lead; the motion supports the evidence.” |
| 13–21 s | Cross the cream-to-citron wipe and pause on the workshop plate. | “Each chapter changes color, rhythm, and spatial behavior without changing the reading order.” |
| 21–30 s | Enter Trajectory, open the first Field notes dossier, then close it. | “The flight log expands from concise experience into keyboard-accessible technical detail.” |
| 30–40 s | Move through Court Vision and one alternating project transition. | “Full project studies pan and pin in place—no cards, modals, or hidden narrative.” |
| 40–50 s | Arrive at the sunrise finale; hover Email Brett and hold. | “The sun, glow, and type resolve together: keep building.” |

Record at 1440 px or wider, 60 fps when available. Use a deliberate single scroll, no abrupt wheel bursts, and leave one second of stillness at the opening and closing frames.

## 100-word description

Brett Haas’s portfolio is an editorial, scroll-led atlas of software engineering, applied AI research, and product craft. A rising sun navigates five chapters while bold serif typography, cinematic Mediterranean plates, chapter wipes, sticky flight logs, and lateral project pans turn a concise résumé into a paced visual story. The experience stays deliberately lightweight: static HTML, CSS scroll timelines with IntersectionObserver fallbacks, and one small enhancement bundle. Every project remains readable without JavaScript, every interaction works from the keyboard, and reduced-motion visitors receive the complete composition without choreography. The result pairs measurable engineering outcomes with a distinctive, calm, optimistic visual system.

## 300-word description

Brett Haas’s portfolio reframes a software-engineering résumé as a single editorial journey. The experience opens on a sunlit Aegean city, pairing a monumental nameplate with a clear statement of practice: intelligent systems that hold up in the real world. A small sun travels across the navigation arc as readers move through Craft, Trajectory, Work, and the final invitation to connect.

Each chapter has its own visual and kinetic grammar. Citron introduces craft through a directional wipe, masked plate reveal, and gently moving capability ticker. The dusk flight log makes professional experience feel sequential, with sticky composition, stepped light, verified metrics, and keyboard-accessible field-note dossiers. Three full project studies then alternate color, direction, image pan, and type lockups without hiding content inside cards or modals. The finale returns to sunrise; “Keep building.” subtly exhales across its characters while the contact glow and header sun resolve together.

The site is designed as progressive enhancement, not a JavaScript application disguised as a portfolio. Next.js exports semantic static HTML, the framework runtime is removed after build, and `/atlas.js` is the only shipped script. That 6.9 KB gzip bundle adds split text, count-ups, scroll choreography, the sun arc, dossier behavior, local time, cursor craft, and magnetic links. CSS Scroll-Driven Animations provide the primary path, with IntersectionObserver and requestAnimationFrame fallbacks where needed.

Performance and access are treated as part of the visual idea. Production Lighthouse scores are 100 across performance, accessibility, best practices, and SEO on both mobile and desktop. Mobile median LCP is 1.50 seconds, CLS is zero, and traced interactions stay well below 200 milliseconds. The layout has been checked in Chromium, Safari, Firefox, iOS Safari, and Android-size Chrome, with complete keyboard, screen-reader, axe-core, and reduced-motion coverage. Every composition remains readable without enhancement, preserving the portfolio’s narrative, hierarchy, evidence, and contact path by default.

## Technical notes

- Next.js 16 static export with React 19 and TypeScript; no client framework runtime ships.
- One esbuild bundle, `/atlas.js`, is 6,864 bytes gzip and owns progressive enhancement only.
- CSS Scroll-Driven Animations handle the primary scroll choreography. IntersectionObserver and requestAnimationFrame provide capability-based fallbacks.
- Scroll-linked work is limited to `transform`, `opacity`, and `clip-path`; no layout property, color, filter, or background-position is scrubbed.
- The contact headline uses static letter spacing and per-character `translateX` spread from its center.
- Responsive AVIF/WebP artwork, explicit dimensions, high-priority hero loading, and static HTML keep LCP and CLS controlled.
- Semantic landmarks, native lists, intact split-heading labels, keyboard dossiers, visible focus, reduced motion, and progressive enhancement preserve the full journey across access modes.
- Verified in Chrome/Chromium, Safari macOS, Firefox macOS, iOS Safari Simulator, and a 390 px Android Chrome profile.
- Local production Lighthouse: 100 in all four categories; mobile median LCP 1.503 s, desktop LCP 408 ms, CLS 0, TBT 0.
- Cloudflare and the live-domain edge-script audit are outside this kit; local `out/` proves that only `/atlas.js` ships from the application.
