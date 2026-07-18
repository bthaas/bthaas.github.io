# Awwwards submission kit

## Captures

The final four submission captures are PNG at exactly 1600 × 1200 and were
generated from the production export. The inspected two-by-two montage is
`design-refs/comparison-phase6.png`.

| Frame | File | Purpose |
| --- | --- | --- |
| 01 | [Liquid ascent](./submission/01-hero-liquid-1600x1200.png) | Establishes the sunlit atlas, live hero plane, circular sun badge, fluid ink, and editorial masthead. |
| 02 | [The fall](./submission/02-feather-fall-1600x1200.png) | Holds the dusk flight log at peak feather density during the one-shot sun flare. |
| 03 | [Horizontal flight](./submission/03-horizontal-gallery-1600x1200.png) | Shows the pinned project route, bent WebGL plates, and ghost case numerals at its midpoint. |
| 04 | [Landing](./submission/04-finale-1600x1200.png) | Resolves the sun at the Aegean horizon with the last golden feather settled beside email. |

Phase-by-phase evidence remains in [step 15](./screenshots/step-15/) through
[step 20](./screenshots/step-20/). Step 20 contains the production hero, fall,
gallery, finale, and a separately verified reduced-motion atlas with no canvas.

## 50-second recording script

| Time | Direction | Voiceover / caption |
| --- | --- | --- |
| 0–6 s | Hold through the 0.84 s drawn-glyph curtain. Move the pointer across the hero once so the plate ripples and citron/dusk ink blooms. | “An editorial flight atlas for engineering, applied AI, and product craft.” |
| 6–14 s | Scroll out of Hero. Let “Brett Haas” scatter like shed feathers while the first outline type band crosses the fold. | “Icarus is the motion system: ascent, release, fall, and a measured landing.” |
| 14–23 s | Enter Experience at peak feather density. Open and close one keyboard-accessible Field notes dossier. | “The flight log expands from concise evidence into the technical work behind it.” |
| 23–34 s | Follow the pinned Projects route through all three WebGL plates; pause on Beat Stream, then continue into the halftone chapter dissolve. | “Field studies bend with velocity while native scroll, links, focus, and reading order stay intact.” |
| 34–42 s | Cross Craft, showing the print-in dissolve, restrained dossier tilt, varnish sweep, and kinetic `SKILLS` band. | “Every material response belongs to the atlas: ink, paper, light, and flight.” |
| 42–50 s | Click the header sun five times, follow the brief blizzard, then land at Contact as the golden feather settles by email. | “The spectacle ends where the story must: ambition brought safely back to earth.” |

Record at 1440 px or wider and 60 fps on hardware-backed Safari or Chromium.
Keep the cursor movement deliberate, use one continuous native scroll, and leave
one second of stillness on the opening and closing compositions.

## 100-word description

Brett Haas’s portfolio is a maximalist editorial atlas for software engineering,
applied AI, and product craft. Icarus supplies its motion grammar: a drawn-glyph
curtain opens the ascent; a liquid Aegean plate and scattered masthead release
the hero; 120 gold-edged feathers build into the fall; and a pinned horizontal
gallery bends field-study plates with velocity. Halftone chapter dissolves,
kinetic serif bands, fluid ink, and a secret sun-triggered blizzard make print
feel physical without changing the writing, artwork, or reading order. The sun
finally lands beside a golden feather at contact. No-JavaScript and
reduced-motion visitors retain the complete, calm atlas with zero decorative
canvases.

## 300-word description

Brett Haas’s portfolio reframes a software-engineering résumé as an Icarus
editorial atlas. The page opens above a sunlit Aegean city while a wing-and-sun
glyph draws itself and two fast paper curtains lift. Pointer movement ripples the
painting like warm glass; citron and dusk ink bleed beneath the existing cursor.
On departure, the masthead breaks formation like shed feathers and a travelling
sun begins its route through Experience, Projects, Craft, and Contact.

The flight narrative controls every escalation. Sparse paper-white feathers
become a gold-rimmed fall over the dusk flight log, react to scroll wind and
pointer gusts, thin through the field studies, then settle at the horizon.
Experience dossiers expand with Flip and retain native button semantics. Giant
outline-serif bands repeat the visible chapter labels without adding copy. The
three accepted project paintings travel through one native-scroll horizontal
pin; shared WebGL planes bend and skew with velocity while ghost numerals mark
the cases. The next chapter prints itself in through a reversible halftone mask,
and restrained six-degree tilt plus varnish sheen give the paper physical mass.

Five activations of the header sun—or the Konami sequence—release one brief
flare and feather blizzard. A single golden feather completes the route beside
the contact email. The missing-page experience turns the same ink system into a
source-vendored React Bits letter glitch with sparse Phase 2 feathers. Even the
tab title keeps the atlas open when focus leaves.

The implementation is a hydrated Next.js 16 static export using React 19,
GSAP, ScrollTrigger, Lenis, React Three Fiber, Three.js, local Draco decoders,
and tightly reduced React Bits source. Complete semantic HTML and responsive
images render before enhancement. Heavy scenes wait for a real user gesture;
the hero image remains preloaded and is always the LCP fallback. Reduced motion
mounts no motion engine, preloader, simulation, or decorative canvas. Native
touch, keyboard focus, fragments, case-study links, and no-JavaScript reading
remain intact. Production Lighthouse scores 92 mobile and 100 desktop for
Performance, with Accessibility, Best Practices, and SEO at 100 on both.

## Technical notes

- Next.js 16 static export, React 19 hydration, strict TypeScript, and
  `@gsap/react` ownership for React motion components.
- GSAP 3.15 supplies ScrollTrigger, SplitText, ScrambleText, Flip, DrawSVG, and
  MotionPath; Lenis publishes scroll progress and velocity through one mutable
  bus.
- A real pointer, wheel, touch, or key gesture activates the shared deferred
  Three/R3F scene chunk. Lighthouse and passive first paint never download or
  execute it.
- The server-rendered responsive hero `<picture>` stays preloaded and visible
  until the liquid canvas has produced its first frame.
- Hardware desktop uses 120 instanced feathers. Mobile, software WebGL, and
  Firefox use the coherent 40-feather performance tier with the same seeded
  shapes, two depth layers, scroll wind, gusts, and story keyframes.
- Desktop Projects uses one native ScrollTrigger pin and one shared R3F canvas.
  Mobile remains vertical; every `#project-*` fragment and keyboard focus target
  maps to normal document scroll.
- The entrance choreography is 0.84 s. The sun spectacle is a session-gated
  3.4 s timeline and remains keyboard accessible through the native sun button
  and Konami sequence.
- The final production Lighthouse reports are 92/100 mobile/desktop Performance
  and 100/100/100 Accessibility, Best Practices, and SEO on both profiles.
- The reduced-motion audit records zero canvases, no WebGL activation attribute,
  and no preloader. The title visibility wink is the only retained behavior.
- `/horizon.js` remains a separate approximately 1.5 KB gzip contact finale;
  local Draco decoder assets avoid a third-party runtime dependency.
- Chromium, Firefox, desktop WebKit, and iPhone WebKit production journeys cover
  console health, native scrolling, overflow, dossiers, fragments, no-JavaScript,
  reduced motion, lazy activation, the spectacle, the 404, and frame pacing.
