# Awwwards submission kit

## Captures

All submission captures are PNG at exactly 1600 × 1200.

Phase 1 verification adds the DrawSVG entrance and active citron/dusk ink trail
in [step 15](./screenshots/step-15/); Phase 2 adds the scroll-narrated feather
field in [step 16](./screenshots/step-16/); and Phase 3 adds the liquid hero,
reversible masthead scatter, kinetic band, and mobile tier in
[step 17](./screenshots/step-17/). Phase 4's horizontal flight and halftone
printing are in [step 18](./screenshots/step-18/); Phase 5's varnish, sun
blizzard, golden landing, and missing plate are in
[step 19](./screenshots/step-19/). The four final submission frames remain the
Phase 0 set until the complete maximalist sequence is assembled in Phase 6.

| Frame | File | Purpose |
| --- | --- | --- |
| 01 | [Hero](./submission/01-hero-1600x1200.png) | Establishes the sunlit atlas, responsive hero plate, masthead, and editorial grid. |
| 02 | [Projects-to-craft transition](./submission/02-craft-wipe-mid-1600x1200.png) | Shows a color-blocked page turn and the craft plate's halftone print reveal. |
| 03 | [Project print reveal](./submission/03-project-pan-1600x1200.png) | Shows the project plate, editorial evidence, and restrained living-material treatment. |
| 04 | [Flock finale](./submission/04-finale-1600x1200.png) | Resolves the sun on the horizon as the bespoke flock crosses behind the contact statement. |

## 50-second recording script

| Time | Direction | Voiceover / caption |
| --- | --- | --- |
| 0–7 s | Hold through the fast wing/sun draw and curtain lift, move the pointer once through the ink, then begin a deliberate scroll. | “An editorial atlas for engineering, applied AI, and product craft.” |
| 7–16 s | Let the masthead release, metrics count, and sun begin its route. | “Verified outcomes lead; motion gives the evidence pace and direction.” |
| 16–25 s | Enter Experience, open the first Field notes dossier, then close it. | “The flight log expands from concise experience into keyboard-accessible technical detail.” |
| 25–34 s | Move through Projects and hold as a plate comes off the halftone press. | “Each case study keeps its full narrative in the page while the plates behave like living print.” |
| 34–42 s | Cross the chapter wipe into Craft and let the capability marquee settle. | “Color, rhythm, and spatial behavior change by chapter without changing the reading order.” |
| 42–50 s | Arrive at Contact and hold as the sun lands and flock crosses the horizon. | “The flight resolves where it began: ambition, engineered to hold up in the real world.” |

Record at 1440 px or wider and 60 fps when available. Use one deliberate scroll,
briefly pause for the dossier and print reveal, and leave one second of stillness
at the opening and closing frames.

## 100-word description

Brett Haas’s portfolio is an editorial, scroll-led atlas of software engineering,
applied AI, and product craft. A travelling sun connects five chapters while
monumental serif typography, cinematic Mediterranean plates, page-turn wipes,
expandable flight logs, and print-inspired reveals turn a concise résumé into a
paced story. GSAP, ScrollTrigger, and Lenis make the motion fluid across
modern browsers; a fast drawn-glyph curtain opens the flight and a lazy fluid
cursor bleeds citron and dusk ink into the paper before a tiny, separately
loaded canvas flock completes the Icarus arc at contact. Every project remains
readable without JavaScript, every dossier
works from the keyboard, and reduced-motion visitors receive the complete static
composition. The result pairs measurable engineering outcomes with a calm,
optimistic visual identity.

## 300-word description

Brett Haas’s portfolio reframes a software-engineering résumé as an
editorial journey. It opens above a sunlit Aegean city, pairing a monumental
nameplate with a statement of practice: intelligent systems that hold up in the
real world. A sun follows an SVG route as readers travel through Experience,
Projects, Craft, and Contact.

Each chapter has its own kinetic grammar. SplitText gives the masthead a masked
baseline rise; metrics land with an ink-bleed beat; the
flight log expands through Flip without disturbing keyboard or screen-reader
semantics. Project and craft plates emerge through halftone masks, then
respond to scroll velocity like ink and paper with mass. ScrambleText decodes
wayfinding labels, while the capability marquee and magnetic
details react without hiding the native cursor or changing reading order.

The finale uses DrawSVG to complete the horizon rule as the sun lands. The atlas
then lazy-loads a separate 1.5 KB gzip canvas bundle. Its sparse,
deterministic flock drifts behind the contact copy in dusk and cobalt—the Icarus
flight completing its story without introducing a stock WebGL template.

The site remains progressive enhancement even as it becomes a hydrated canvas
for the next motion phases. Next.js exports complete static HTML and ships its
normal React runtime, while an 83.1 KB gzip Atlas bundle loads at window idle to
own the existing GSAP, ScrollTrigger, and Lenis choreography. Touch scrolling remains native;
anchor links and keyboard scrolling remain intact. Reduced motion exits before
any engine or DOM preparation, and the journey remains available with
JavaScript disabled.

Performance and access are part of the visual idea. The hydrated production
export scores 97 on throttled mobile Lighthouse and 100 on desktop; conservative
LCP is 2.45 seconds mobile and 0.47 seconds desktop, with zero CLS. Hardware
Chrome and Firefox hold roughly 120 fps. Chromium, Firefox, desktop WebKit, and iPhone WebKit journeys cover
console health, overflow, keyboard dossiers, reduced motion, no-JS, lazy loading,
and frame pacing.

## Technical notes

- Next.js 16 static export with normal React 19 hydration and TypeScript.
- Phase 5 keeps initial Next + Atlas JavaScript at 332,852 bytes gzip and reuses
  the existing deferred feather scene for both the one-shot blizzard and sparse
  404 drift. The complete post-mount homepage is 597,524 bytes gzip.
- Five native-button activations or the Konami sequence trigger one 3.81-second
  session spectacle. Reduced motion arms none of it; only the tab-title wink is
  retained.
- Phase 3 preserves the preloaded responsive hero `<img>` as LCP while a shared,
  deferred Three/R3F chunk supplies both the liquid plane and feather field.
- Hero parallax and masthead SplitText now have one React/GSAP owner; the old
  Atlas choreography was removed. Four outline-serif bands reuse existing
  chapter labels and remain `aria-hidden` decoration.
- Initial Next + Atlas JavaScript is 326,246 bytes gzip. Every deferred canvas
  showpiece totals 591,089 bytes gzip after mount; the documented post-mount
  exception reuses one Three runtime and adds 54,317 bytes over Phase 2.
- Phase 1 first-load JavaScript after the lazy cursor mount is 268,732 bytes gzip, including a 5,685-byte fluid chunk and 83,209-byte `/atlas.js`.
- Phase 1 Lighthouse Performance is 100 with 1.40 s LCP, 0.00018 CLS, and 7 ms TBT.
- `/horizon.js` is 1,456 bytes gzip and is injected only near Contact on fine-pointer desktop visits.
- GSAP 3.15 powers ScrollTrigger, SplitText, ScrambleText, Flip, DrawSVG, and MotionPath; Lenis 1.3.25 is synchronized through the GSAP ticker.
- Native touch is preserved, while programmatic, keyboard, and anchor scrolling synchronize the same progress bus.
- Scroll-linked work is limited to transforms, opacity, clip paths, filters, and CSS custom properties; pointer work uses GSAP quick setters.
- Responsive AVIF/WebP artwork, explicit dimensions, and the immediate hero plate keep LCP and CLS controlled.
- The authoritative reduced-motion kill switch creates no motion engine or decorative enhancement; the no-JS document remains complete.
- Phase 0 performance Lighthouse: 97 mobile and 100 desktop; mobile LCP 2.45 s, desktop LCP 0.47 s, CLS 0.
- Verified with Chromium, Firefox, desktop WebKit, and iPhone WebKit production journeys; hardware Chrome and Firefox sustain approximately 120 fps.
