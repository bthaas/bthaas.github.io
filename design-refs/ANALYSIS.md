# Hero Wings Reference Analysis

Source: `video/01-hero-wings.mp4` (1280×720, 10.005 seconds, 24 fps). The curated
frames in `frames/` are the visual ground truth for modeling, lighting, framing,
and motion.

## Composition and camera

- The hero composition is a wide 16:9 view. The wings occupy roughly 82% of the
  image width and 52% of its height. Their fractured inner shoulders nearly meet
  at the horizontal center, with the intact left wing carrying most of the visual
  weight and the broken right wing ending about one third sooner.
- The wing roots sit just above mid-frame. The top of the intact primaries reaches
  about 16% from the top; the dense cloud deck begins around 52–56% from the top.
  Loose feathers extend the silhouette into the upper and lower thirds.
- The camera is approximately level with the roots and only slightly above the
  wing center (about a 3–6° downward look). It sees the broad carved faces of the
  feathers rather than a steep top or underside view. A 38–43° perspective field
  of view matches the restrained, product-film perspective.
- The move is a slow clockwise orbit around the pair with a gentle push-in. The
  subject remains centered while parallax reveals the thickness of the feathers.
  For the initial website frame, match `hero-composition.png`, not the later
  typographic frames.

## Light and atmosphere

- The sun is low behind the wings, slightly camera-right of the central fracture
  in the front view. It is approximately 4–7° above the cloud horizon. The key
  should therefore come from world upper-right/back, aimed toward the roots.
- Direct light is warm amber/ivory, approximately 3600–4100 K. It produces a
  pale gold rim and visible shafts through primary-feather gaps without turning
  the marble orange. Sky fill is cool neutral gray-blue and much softer.
- `hero-lighting.png` is the clearest lighting target: the sun is partially
  occluded by the inner broken edge, creating a hot white-gold core, translucent
  gaps between primaries, and long soft highlights along feather ridges.
- Haze is warm ivory, anchored at `#FAF8F4`. Near the horizon it shifts toward
  muted peach (`#E7D0AE`); upper shadow haze is a quiet gray (`#C8C9C7`). Contrast
  is low except at fracture edges and sun-facing rims.
- The cloud field is a continuous, dense stratocumulus sea with no visible land
  or sky gap. Large soft billows dominate the foreground; smaller flatter forms
  compress toward the horizon. Clouds fill the lower 45–48% of the frame and
  remain brighter near the sun, cooler and denser at the lower corners.
- Fine dust is sparse and slow. Loose feathers, not particles, create most of the
  foreground depth. Depth of field is shallow but subtle: the wings stay readable
  while the nearest loose feathers and distant clouds soften.

## Feather construction

- Each feather is a thickened elongated blade with a rounded-tapered tip, a short
  narrower quill, and a gentle longitudinal curve. The center shaft is a low
  raised ridge. The vane has a slight shallow-V cross section and faint diagonal
  barb cuts, but the silhouette remains clean and sculptural.
- The wings read as four principal overlapping rows plus a dense shoulder cap:
  1. 9–11 long primaries form the outer fan.
  2. 10–12 medium secondaries form the lower/inner flight row.
  3. 12–16 medium coverts bridge the flight feathers and shoulder.
  4. 16–22 short coverts form a scalloped upper row.
  5. Tiny tile-like scapular feathers cluster around the root.
- Size changes continuously. Primaries are longest near the outer third, then
  shorten toward both tip and root. Each inner row is about 68–82% of the row
  beneath it. Shoulder tiles shrink to roughly one quarter of primary length.
- Adjacent feathers overlap by 22–35% of their width. Rotations vary by a few
  degrees, with small curl and depth offsets; the rows should never look like a
  rigid radial stamp.

## Intact wing

- Use `wing-intact.png` for row spacing and the swept arc. The left wing rises
  gently from the root, broadens through the middle, then fans outward with an
  almost horizontal upper edge. The lower flight-feather edge drops in a smooth
  convex curve toward the root.
- Its span is about 1.45× its maximum height. The shoulder is dense and rounded;
  the outer fan is airier so sunlight can pass between the long feathers.
- It is nearly complete, but not pristine: thin gold-filled cracks cross the
  shoulder/coverts in two or three places and introduce slight discontinuities.

## Broken wing and fracture map

- In the front hero view the broken wing is on camera-right. It retains only
  about 62–68% of the intact wing's apparent span and about 78% of its height.
- The dominant break runs from the upper inner shoulder diagonally down through
  the lower inner secondaries, exposing an irregular jagged stump beside the
  center gap. A second broken band cuts across the middle coverts, and a smaller
  void interrupts the upper outer fan.
- Remove clusters rather than alternating single feathers. The key negative
  spaces are: a narrow split at the root, a larger lower-middle notch that removes
  2–3 secondaries, and an upper/outer gap that shortens the primary fan. Preserve
  a coherent outer arc so it still reads immediately as a wing.
- Fractured edges are short, displaced feather stumps with chipped, uneven tips.
  Several surviving feathers tilt 8–18° out of plane. Gold-filled seams mark the
  larger stone breaks but do not coat whole feathers.
- Detached feathers form a loose clockwise halo: several above the center gap,
  3–4 below the wings, and a few beyond each tip. They vary from small coverts to
  full primaries, sit at different depths, and rotate independently. Twelve free
  feathers are enough for the interactive scene; additional apparent fragments
  can be tiny dust/chips.

## Implementation targets

- Initial camera: wide 40–42° FOV, wings centered at root height, cloud line at
  54% of the viewport, sun immediately behind/right of the fracture.
- Materials: warm white marble (`#F5F2EC`), roughness about 0.4, low metalness,
  soft environment reflection, and restrained `#D4AF37` at rims/fractures.
- Motion: sub-degree whole-wing drift, slow orbit/parallax, and independent loose
  feather rotation. Scroll fracture should open in grouped clusters, beginning at
  `wingR_tip`, then `wingR_mid`, followed by the intact tip as the camera advances.

# Scene 02 — Cloud Transition

Source: `video/02-cloud-transition.mp4` (1280×720, 10.005 seconds). Curated
sequence: `02-cloud-transition-a.png` (before), `-b.png` (inside), and `-c.png`
(after). The generated clip does not contain a literal featureless white frame;
the inside target is the brightest ivory tunnel in frame B. The web transition
may lift that state another 8–12% toward white while retaining faint texture.

## Composition, camera, and motion

- The move is a slow vertical descent with a level horizon and roughly 45–50°
  FOV. Before entry, the dense cloud deck fills about 78% of the frame and the
  horizon sits near the upper fifth. The camera aims 8–12° downward.
- During entry, nearby billows grow beyond the frame edges and form a soft oval
  tunnel with the clearest negative space just below center. The readable horizon
  disappears; forward/downward parallax is the only depth cue.
- After exit, the horizon returns near 35% of frame height. The foreground deck
  remains at the bottom third while a cooler, flatter haze layer occupies the
  middle. The move must feel continuous, with no cut or acceleration spike.

## Light, haze, and cloud structure

- Before entry, a warm upper-right/back sun gives broad champagne highlights
  (about 3900–4300 K) and a pale neutral-gray fill. Lens flare is extremely soft.
- Use three or four cloud depth layers: large soft foreground billows, medium
  tunnel walls, smaller horizon forms, and a thin far haze sheet. Density peaks
  at transition progress 0.5; texture contrast falls almost to zero there.
- The after state is visibly cooler and more diffuse than the hero: reduce warm
  key contribution about 18%, shift fog from `#FAF8F4` toward `#E8EBEA`, and
  retain a weak warm reflection at camera-right. This begins the descent gradient.
- Implementation target: two overlapping cloud-plane sweeps before the camera,
  one soft radial veil, and a background exposure lift. Swap scene mounts only
  while opacity is above 0.96 and the canvas is visually hidden.

## Phase 7 — The Skill Sphere / Craft

Source: the approved “Fig. 5” product brief supplied on July 20, 2026. It
supersedes the earlier dark constellation concept and explicitly specifies a
light, hand-rolled DOM projection with evenly distributed brand-logo chips.

### Composition and projection

- Preserve the citron Craft board, artwork, copy, and marquee without edits.
  Insert one cream, hairline-framed plate between the board and marquee.
- Center a circular cloud of all 28 catalog skills. A Fibonacci lattice supplies
  an even unit-sphere distribution; a fixed yaw/pitch creates the initial view.
  Desktop uses a 2:1 plate and a 31% short-axis radius. Mobile uses a 4:5 plate
  with a 36% radius ratio so touch targets remain distinct while both read as a
  compact, graspable object.
- Perspective is communicated only through projected position, scale, opacity,
  and z-order. Near-side chips render at full scale/opacity; the far side reaches
  0.55 scale and 0.3 opacity. There is no Earth texture, geography, canvas, WebGL,
  or connecting-line decoration.

### Materials and typography

- The plate stays on the site’s `--paper` cream with the established subtle
  grain, citron reflected at the center, and a restrained ghost sphere outline.
- Each chip is cream with a hairline ink border, a 44–52 px circular hit target,
  and the existing Simple Icons glyph in its catalog brand color.
- Use existing tiny uppercase wayfinding for `Fig. 5 — The skill sphere` at the
  top left and `drag to navigate` at bottom right. An active chip lifts, adopts
  its brand-color border, and reveals an ink pill with cream label text.

### Interaction and motion

- Pointer Events rotate yaw and pitch in any direction. Pointer capture retains
  control outside the plate, pitch clamps at ±1.5 radians, and velocity decays
  into a 0.006-radian desktop idle rotation (0.0038 on coarse pointers).
- Hover and keyboard focus pause autonomous rotation and reveal the label. Escape
  and blur clear it. Touch taps toggle a persistent label while drag-spin and
  inertia remain available. Catalog order is also DOM/tab order.
- Cache the plate size in a ResizeObserver. The requestAnimationFrame loop writes
  only transform, opacity, and z-index; it performs no per-frame DOM reads and
  uses preallocated projection records.
- Reduced motion retains the fixed projected sphere and direct manipulation but
  starts no animation frame loop, inertia, or idle spin. The server-rendered
  chips plus noscript grid ensure all skills remain present without JavaScript.

### Asset and verification exception

- This section intentionally has no modeled asset. Its visual subject is the DOM
  itself and the accepted implementation technique forbids Three.js/canvas and
  new dependencies, so Blender, GLB compression, Draco, and turntables do not
  apply.
- Verification uses the real hydrated page at 1440 px and 390 px. Rest, mid-spin,
  and focused-chip captures must confirm density, depth attenuation, readable
  labels, the cream-on-citron relationship, and an unchanged marquee.

# Scene 03 — Ruins Ring / About

Source: `video/03-ruins-ring.mp4` (1280×720, 10.005 seconds). Curated references:
`03-ruins-ring-a.png` through `-d.png`.

## Composition and camera

- A loose architectural ring encircles a central empty volume. In wide views the
  ring occupies roughly 88% of image width and 72% of height, with its open center
  about 38% of the frame. The camera sits slightly above the ring plane and looks
  down 8–12° with a 43–48° FOV.
- The camera rotates clockwise inside the ring while drifting through foreground
  fragments. Close frames use arches as a natural vignette and allow one column
  to cross the camera plane with shallow depth of field.
- The horizon is the cloud sea, around 58–62% of frame height in the wide shots.
  The ring remains readable as a circle even when two foreground pieces occlude it.

## Geometry, repetition, and damage

- Target 12 major content-readable pieces: 4 triple-arch segments, 4 broken
  columns, 2 curved entablature slabs, and 2 irregular wall/plinth fragments.
  Add 26–34 small chips for depth, never evenly spaced.
- Ring radius varies from 5.8–7.6 m, with 1.5–2.4 m vertical variation and a
  12–18% size gradient. Neighboring major pieces overlap in screen space by
  roughly 8–20%; alternating pieces tilt 9–24° and sit at different depths.
- Arches are tall and restrained: opening width about 0.55× opening height,
  narrow piers, shallow relief, and chipped ends. Columns are 5.5–7 diameters
  tall, mostly fluted, with one capital or base missing on each damaged unit.
- Damage is clustered at arch corners, column mid-shafts, and entablature ends.
  Preserve large arch negative spaces and the circular center. Detached chips
  drift after their parent fragments, not as a synchronized particle explosion.

## Light, mood, and implementation targets

- The warm key remains upper-right/back but is softer than the hero. Use a
  4300–4600 K edge light plus cool gray-blue fill. Haze is medium-light and
  slightly cooler than scene 01, anchored near `#E7E9E8` with ivory highlights.
- Gold appears as thin repaired seams, not decorative trim. Unvisited objects get
  a low-amplitude 4–6 second shimmer. Cursor proximity increases the vein response
  specified in scene 07 and adds at most 3° of spring-damped facing rotation.
- Named animation units: `ruin_arch_01`–`04`, `ruin_column_01`–`04`,
  `ruin_slab_01`–`02`, `ruin_fragment_01`–`02`, and zero-padded `ruin_chip_NN`.
  Pivots sit at local bounds centers so overlay selection can dolly toward a unit.

# Scene 04 — Stair Timeline / Experience

Source: `video/04-stair-timeline.mp4` (1280×720, 10.005 seconds). Curated
references: `04-stair-timeline-a.png` through `-d.png`.

## Composition and camera

- The structure is a vertical architectural timeline, not a normal staircase.
  Three large stair runs and four landings descend through the center-left while
  broken arch/facade masses anchor the right. A single run spans 48–66% of frame
  width and rises at about 32–38° in screen space.
- Camera height tracks the active landing and descends nearly parallel to the
  facade, using a 42–46° FOV with only mild perspective. Foreground stairs clip
  the frame edges while distant columns compress into haze.
- The cloud horizon remains near mid-frame but repeatedly disappears behind
  facade voids. Movement is downward with slight rightward drift; each landing
  holds long enough for its entry text to become readable.

## Geometry, repetition, and damage

- Each stair run uses 18–24 broad steps. Tread depth is about 0.34× riser width;
  total stair width is 5–7 riser heights. Landings are 1.3–1.7× stair width and
  0.22–0.32 stair widths thick.
- Build four independent `stair_landing_01`–`04` groups, each containing a stair
  run, landing slab, supporting arch/column remnant, and 2–4 `stair_chip_NN`
  pieces. Add `temple_facade_01` as the larger mid-sequence silhouette.
- Breaks remove whole corners and supports, creating large under-stair voids.
  Fracture faces are irregular and low-poly; do not scatter damage uniformly.
  Gold seams follow only a few load-bearing cracks and vertical inset channels.

## Light, mood, and implementation targets

- Light remains warm from upper-right/back, but the environment is moderately
  dimmer than scene 03. Each landing receives one soft shaft peaking as its scroll
  window crosses center; inactive structures fall into cool diffuse fill.
- Fog is moderate (`#E0E2E1` toward `#D7DADB` in depth), with cloud ribbons
  crossing in front of landings. Keep shadow contrast low enough for carved text.
- Inscription typography should look cut into the adjacent landing plaque via
  restrained inset/highlight CSS, not baked mesh text. The active entry's beam,
  text opacity, and camera position share one pure choreography value.

# Scene 05 — Monolith Field / Projects

Source: `video/05-monolith-field.mp4` (1280×720, 10.005 seconds). Curated
references: `05-monolith-field-a.png` through `-d.png`.

## Composition and camera

- Tall smooth monoliths emerge from a heavy cloud deck at irregular depths. Wide
  shots show 9–12 readable forms; the nearest fills 42–58% of frame height while
  far silhouettes shrink to 12–20%. The lower quarter is dense cloud and the
  horizon is deliberately indistinct.
- Monoliths are rounded rectangular slabs, about 2.7–3.8× taller than wide and
  0.28–0.42× as deep as wide. Top corners vary from chipped diagonals to broad
  10–18% radii. Spacing ranges 1.2–3.4 slab widths with no visible grid.
- Camera glides laterally with a slight forward drift at monolith mid-height,
  40–44° FOV. Foreground objects cross the frame; background rows provide strong
  parallax and fade quickly into haze.

## Geometry, light, and mood

- Build one named `monolith_NN` unit per project from 3 low-poly silhouette
  variants. Add 4–7% deterministic scale variation, 2–8° yaw, and small depth
  offsets. Surface cracks are sparse, branching, and unique per unit.
- Scene 05 is the dimmest layer: cool charcoal-gray-green ambient haze
  (`#C9CECA` near to `#AEB5B2` far), heavy density, and a restrained warm upper-
  right key. Marble remains warm white but is often half-shadowed.
- Veins are the primary contrast. Use the scene-07 shader response instead of
  baked emissive textures. At rest, distant projects should show only occasional
  hairline amber; hover/approach reveals the branching network and a few sparks.
- Named units: `monolith_01` upward in content order, with centered pivots and
  per-object metadata supplied by the content layer. A selected monolith receives
  a short camera dolly while the rest deepen into fog; it must remain keyboard-
  reachable through a parallel DOM control.

# Scene 06 — Ending Ascent

No video reference exists. This scene is synthesized from the scene-01 wings and
sun, the scene-02 ivory cloud treatment, and the requested ending description.
`06-ending-ascent-a.png` is the lower/deeper state; `-b.png` is the near-white
resolution. These images are composited reference stills, not evidence of a
generated motion reference.

- The camera stops descending, then tilts from roughly level to 58–68° upward.
  Passed ruins occupy the lower haze in several subdued depth layers. The wings
  are a small centered silhouette high above, about 12–16% of frame width at the
  start, with the sun a smaller warm point above them.
- The lower frame begins cool gray and low contrast. Progressively lift fog toward
  `#FAF8F4`, reduce all silhouette contrast, and expand/bloom the sun until it
  becomes the frame's warm-white core. The final 15% dissolves to near-white.
- Reuse distant silhouettes or static impostors; do not keep every prior 3D scene
  mounted. Wing and ruin layers move at different parallax rates during the tilt.
- Only after the image settles near white should the DOM line “Keep Building.”
  appear in small centered type, followed by the minimal contact footer. No quote.

# Scene 07 — Gold Vein Detail / Interaction Signature

No separate video exists. `07-gold-vein-detail-a.png` and `-b.png` are cropped
and enlarged from scene-05 frames nearest to an active monolith.

- Primary veins are irregular 5–12 px lines at 1280×720 reference scale, with
  locally widened 14–22 px repair nodes. Secondary branches taper to 1–4 px and
  split at acute 25–55° angles. Branches form asymmetric Y and X junctions rather
  than a uniform Voronoi web.
- The hot core is pale champagne (`#FFE7A0`) surrounded by `#D4AF37` and a very
  soft amber falloff extending roughly 2–3 primary-vein widths. Surface-adjacent
  marble warms slightly but never becomes orange.
- Brightness rises over about 450–650 ms as proximity enters, carries a subtle
  1.8–2.4 second breathing pulse, and fades more slowly over 700–950 ms. Small
  golden dust flecks appear only near peak response.
- Implement with a deterministic object-space branching mask plus Fresnel and
  proximity uniforms. Rest state: 0.08–0.16 intensity; unvisited shimmer peak:
  0.24–0.32; hover/keyboard focus peak: 0.85–1.0. Preserve the same signature on
  ruins, stairs, and monoliths, but scene 05 may use the strongest bloom.

# 2026 Editorial Atlas — Superseding Active-Site Direction

The Atlas redesign replaces the active site's pale marble descent with a
static, image-led editorial presentation. The earlier scene analysis remains as
historical source material for the Icarus narrative, but its WebGL geometry,
cloud-whiteout pacing, monolith gallery, and gray marble material are no longer
implementation targets.

## Verified source boards

- `video/08-presentation-board-01.jpg` — 1628×2048 editorial landing-page pair.
- `video/08-presentation-board-02.jpg` — 1200×1093 modular black-and-butter
  identity system.
- `video/08-presentation-board-03.jpg` — 1592×2048 rounded product-page pair.
- `video/08-presentation-board-04.jpg` — 2048×1568 monochrome case-study grid.
- `video/09-art-style-board.jpg` — 2048×1493 four-scene stylized environment
  board.

All five sources were verified as MJPEG stills with `ffprobe`. The presentation
boards are curated in `frames/atlas/08-format-*.jpg`; the four art quadrants are
curated as `frames/atlas/09-art-*.jpg`.

## Format and presentation targets

- Use a centered page frame with a disciplined twelve-column grid and 24–32 px
  desktop gutters. Sections are designed as compact boards rather than
  viewport-height cinematic scenes.
- Establish one dominant image panel per board, then support it with small
  evidence modules: section index, short copy, metrics, technology labels, and a
  single action. Avoid repeating identical cards.
- Hero copy sits in the DOM above and below the artwork, never baked into the
  image. The hero artwork occupies roughly 68–76% of the first viewport and is
  bounded by a 12–16 px radius.
- Major display lines use restrained high-contrast serif type; navigation,
  evidence labels, tags, and project metadata use a compact neutral sans. Cap
  display headings at about 6.5rem on wide screens and 3.2rem on mobile.
- Use thin black rules, small uppercase indices, explicit alignment, and
  asymmetric but balanced white space. Decorative elements must align to the
  same grid rather than float independently.
- Desktop project chapters alternate image/copy emphasis without changing their
  information order. Tablet and mobile collapse to image-first single-column
  flow. There is no pinned horizontal gallery or modal-only content.

## Art style and camera targets

- Rendering language: stylized cinematic 3D illustration with simplified,
  clean architectural volumes; matte surfaces; soft ambient occlusion; subtle
  painterly grain; and intentionally reduced detail. Do not return to
  photorealistic marble, glossy game rendering, or generic fantasy concept art.
- Camera: wide 35–45° establishing views, usually slightly elevated. Foreground
  geometry anchors one lower corner while cities, landscapes, or monuments
  recede through two or three clear depth bands.
- Lighting: one large warm sun or cloud-bounced source against a cool sky.
  Shadows are broad and legible; volumetric atmosphere separates planes but
  never erases silhouettes.
- Palette progression: cobalt sky (`#337BE8`) and powder blue (`#9CBDF4`) in the
  hero; citron (`#C9E64B`) and moss (`#536C29`) in Craft; muted violet
  (`#756D91`), coral (`#E98E69`), and solar butter (`#F2D36D`) through
  Experience and projects; cream (`#F4F0E5`) and near-black (`#171914`) anchor
  the UI throughout.
- Surface variation comes from fine grain, mild stipple, and large tonal planes.
  Avoid small noisy textures, legible text, logos, fake UI, or watermarks inside
  generated images.

## Subject and composition map

1. **Hero / Flight** — a small, readable Icarus silhouette glides above a
   geometric Aegean city toward an oversized sun. The wing span remains intact;
   the figure occupies under 12% of frame width so the city and light carry the
   composition.
2. **Craft** — a cliffside workshop landscape with sculptural wing forms and
   olive-like terrain. No visible worker is required; the scene represents the
   practice, not a second character beat.
3. **Trajectory / Experience** — a rising coastal city, stair, and lighthouse
   sequence at dusk. Architecture ascends from lower-left to upper-right, leaving
   a calm sky band for adjacent DOM copy.
4. **Court Vision** — a geometric amphitheater/basketball court with a few clean
   analytical trajectory arcs. No players, team marks, scoreboard text, or
   branded sports imagery.
5. **Beat Stream** — coastal structures crossed by broad rhythmic wind/signal
   ribbons. The ribbons imply playback and flow without notes, speakers, logos,
   or interface chrome.
6. **Vision Bias Steering** — a bifurcating labyrinth-observatory with two
   controlled light paths. The paths imply steering and evaluation without
   anthropomorphic AI imagery.
7. **Horizon** — distant wings pass over a calm sunrise sea. Keep the lower third
   dark enough for a clean transition into the cream contact/footer board.

## Motion, accessibility, and performance targets

- The presentation must be complete without JavaScript animation. Native scroll
  and progressive CSS view animations may add 12–24 px vertical movement and a
  small opacity lift; no image scrub, scroll hijacking, cursor tilt, or parallax.
- `prefers-reduced-motion` removes all transforms and transitions. Keyboard focus
  must remain visible on every navigation and repository/contact link.
- Serve AVIF first with WebP fallback. Panoramas receive 1600/960 variants;
  project art receives 1200/640 variants. Each delivered file remains below
  250 KB, the hero LCP source remains below 250 KB, and no offscreen art is eager
  loaded.

# 2026-07-18 — Feather Fall Showpiece Supersession

The maximalist motion brief supersedes only the previous prohibition on WebGL
for the active site. The existing editorial atlas remains the content, palette,
typography, artwork, and section-order ground truth. Scene 01's detached-feather
construction and light are reactivated as a fixed decorative fall behind that
editorial content; the original marble-wing hero, cloud environment, and
cinematic scene sequence are not returning.

Verified source: `video/01-hero-wings.mp4` (H.264, 1280×720, 24 fps, 10.005 s).
The video was re-extracted at 3 fps into `tmp/frames/phase2-feather/` and inspected
as a 30-frame sequence. Stable Phase 2 ground truth is curated as:

- `frames/phase2-feather-sparse-hero.png` — sparse opening distribution;
- `frames/phase2-feather-depth-building.png` — foreground/middle/far layering;
- `frames/phase2-feather-peak-fall.png` — maximum readable density;
- `frames/phase2-feather-gold-rim-close.png` — material and edge-light target;
- `frames/phase2-feather-settle-profile.png` — quiet landing silhouette.

## Composition, silhouette, and camera

- The source feathers orbit a centered wing pair, but the active scene removes
  the parent wings and distributes their detached parts across the whole 16:9
  viewport. Large feathers remain the main silhouette: desktop projected lengths
  target 8–17% of viewport height and mobile 11–24%, never confetti scale.
- Use an orthographic camera with a 16:9-equivalent field matching a restrained
  40–42° perspective view. The camera is level, with no horizon plane or camera
  travel; depth comes from scale, opacity, z separation, and a small far-layer
  blur. This keeps document scroll authoritative.
- Hero density is six to twelve simultaneously visible feathers with generous
  negative space around the masthead and plate. The flight-log fall builds to
  roughly 28–38 readable desktop silhouettes, then thins to 14–22 over projects
  and Craft. Contact retains only 5–9 settling forms.
- Copy columns remain negative space. Opacity is attenuated within the central
  reading corridor and near the major heading bands, while outer-gutter feathers
  may carry the brightest gold edges.

## Light, material, and atmosphere

- The key remains upper-right/back at approximately 3900–4200 K, producing a
  thin pale-gold Fresnel response on camera-facing edges. A broad cool-neutral
  fill keeps the paper-white vane readable without gray photorealism.
- Feather bodies use the atlas paper white `#F5F2EC`, roughness `0.4`, negligible
  metalness, and restrained `#D4AF37` Fresnel. There are no textures, veins, or
  glossy marble noise: geometry and light do the work.
- The canvas background is transparent so section color and painterly plates
  remain untouched. The near layer is clearer and reaches at most 0.34 opacity;
  the far layer is softer, smaller, and capped near 0.17 opacity. No fog volume,
  clouds, bloom, or unrelated sun is introduced.

## Geometry, repetition, and local variation

- Build three deterministic low-poly curved-plane variants from the shared
  feather primitive. Each has a rounded tapered tip, short quill, shallow-V
  cross-section, raised center ridge, and slight longitudinal curl. Variant 01
  is broad/neutral, 02 narrow/positive curl, and 03 broad/negative curl.
- Export the variants as independent named nodes `feather_variant_01` through
  `feather_variant_03`, each with a centered local pivot. Runtime instancing uses
  about 120 seeded records on desktop and 40 on mobile; visibility windows keep
  only a narrative subset legible at once.
- The near/far split is approximately 42/58. Scale varies continuously around
  the three meshes, rotations are seeded on every axis, and neighboring parts
  avoid uniform spacing. Projected overlaps stay mostly below 20%, with brief
  crossings during the flight-log peak.
- The detached-feather reference contains no new fracture event to reproduce.
  The negative space is the readable document itself. Motion order is sparse
  single drifts over Hero, accelerating grouped fall over Experience, thinning
  residual drift over Projects/Craft, then downward settling and fade at Contact.

## Motion and interaction targets

- Document progress is mapped in pure tested choreography. Density, fall speed,
  tumble, scatter, vertical settling, and opacity interpolate continuously and
  reversibly across the five section windows.
- Existing Lenis/Atlas scroll velocity supplies lateral wind and short vertical
  streak scale. It must decay back to zero with no React state updates per frame.
- Pointer motion above a velocity threshold emits one bounded radial gust. Each
  nearby feather receives a spring-damped offset and returns to its seeded path;
  touch does not synthesize gusts.
- Desktop targets 60 fps with 120 instance records; mobile targets stable 30 fps
  with 40. Matrices, colors, vectors, and dummy transforms are allocated once and
  reused. The scene is absent for reduced motion and no-WebGL clients.

# 2026-07-18 — Liquid Hero and Kinetic Type Supersession

Phase 3 keeps the accepted editorial hero artwork and layout exactly as shipped;
the enhancement is a subdivided WebGL image plane that makes the existing light
and sky feel glassy under pointer and scroll velocity. This phase introduces no
new modeled subject or visual asset. The Blender/GLB build and turntable gates do
not apply to a texture-backed plane: exporting the same rectangle as a GLB would
add no visual ground truth and would conflict with the brief's required preloaded
`<img>` fallback. The existing Phase 2 asset library and local Three/R3F runtime
remain the shared 3D infrastructure.

Verified source files:

- `public/icarus-atlas/hero-flight-1600.webp` — WebP, 1600×1130, 98,138 bytes;
- `public/icarus-atlas/hero-flight-1600.avif` — AV1 still, 1600×1130,
  63,395 bytes;
- `frames/phase3-hero-liquid-source.png` — stable full-art source frame;
- `frames/phase3-hero-layout-desktop.png` — accepted 1600 px composition;
- `frames/phase3-hero-layout-mobile.png` — accepted 390 px crop.

## Composition, crop, and readable structure

- Desktop retains the current 16:8.7 plate inside the 12-column shell. The city
  fills the lower 44%, its sun sits at roughly 69% x / 45% y, and the upper blue
  field preserves broad negative space. The shader may not shift the sun, central
  tower, horizon, caption, or rounded plate boundary by more than a few pixels.
- Mobile retains the 4:4.5 crop with `object-position: 55% center`; the sun/city
  remain in the lower-right half and the left tower stays visible. The shader
  plane must reproduce CSS `cover` cropping rather than squeeze the 1600×1130
  source into the portrait viewport.
- The existing `<picture>` remains the first-painted LCP element and visual
  fallback. Canvas opacity rises only after the texture and first WebGL frame are
  ready; no-JS, no-WebGL, loading, error, and reduced-motion states never hide it.
- The art caption remains a DOM element above the canvas. The scene is decorative
  and carries no accessible image role; the fallback image retains the original
  descriptive alt text.

## Light, color, and material response

- The dominant source is the oversized solar disc behind the right-hand city.
  Warm yellow-white spreads through nearby architecture while the upper/left sky
  stays cobalt and powder blue. Displacement must refract the existing color; it
  may not add a second highlight, new palette color, bloom, or chromatic split.
- Pointer ripples behave like pressure on museum glass: one broad damped bulge
  with two low-amplitude rings, a radius around 12–18% of plate width, and a peak
  UV displacement below 0.009. The city remains readable at maximum input.
- Scroll velocity adds a centered shallow bow and no more than 0.006 UV offset.
  It decays toward a glass-flat plane within about 450 ms after scrolling stops.
- Idle motion is nearly still: a sub-pixel low-frequency wave may keep reflected
  light alive, but the painting must never resemble liquid lava or a flag.

## Geometry, camera, and shader targets

- Use one 48×32 subdivided plane sized to the actual hero layout box. An
  orthographic R3F camera faces it squarely; there is no 3D environment, fog,
  postprocessing, or additional draw call.
- Vertex displacement supplies restrained z bulge for light response; fragment
  UV displacement supplies the visible ripple. `uTextureCover` reproduces cover
  scaling from source and viewport aspect. Uniform vectors and material are
  allocated once and updated through refs.
- Pointer position is normalized within the plate, spring-damped, and ignored on
  coarse pointers. Leaving the plate returns the target to center/zero without a
  snap. Existing Lenis velocity arrives through `atlas:scroll` and never causes a
  React render.
- The old Atlas picture/image/caption parallax transfers to the React hero
  component in the same PR. Its scale 1.05→1, internal 0→10.7% travel, and caption
  0→−2.5vh timing remain the baseline, now coordinated with shader velocity.

## Masthead, bands, and sun-badge choreography

- `Brett Haas` keeps its accessible DOM text and the existing once-per-session
  masked character entrance. Ownership transfers from `src/atlas/hero.ts` to a
  React component using `useGSAP`; Atlas removes both entrance and hero parallax.
- Leaving Hero scatters the nine characters like shed feathers. Outer characters
  travel farther than inner characters, alternating vertical direction and
  rotating at most 18°. The final spread remains visually connected to the name,
  and scrolling to the top restores every transform exactly.
- Four 20vh outline-serif bands reuse only visible wayfinding phrases: `FLIGHT
  LOG`, `FIELD STUDIES`, `SKILLS`, and `NEXT HORIZON`. They translate horizontally
  at alternating base directions; Lenis velocity raises time scale and adds at
  most 8° skew. Reduced motion leaves a quiet static outline band.
- The circular header label reads `EX ALIS — BELLEVUE — 47.61° N —` around the
  existing sun glyph. It is decorative, tiny uppercase, slow at rest, and speeds
  on hover. Atlas continues to own the existing sun path/group; React owns only
  the new circular text element.

# 2026-07-18 — Horizontal Flight Path and Print Dissolves

Phase 4 converts the accepted three-card Projects board into a desktop pinned
lateral passage. It keeps the same three project images, names, evidence, order,
links, cream paper, and cobalt/citron/dusk palette. The motion is the flight-path
beat: vertical descent becomes a left-to-right traverse across three printed
field-study plates. Mobile retains the existing vertical reading order and adds
only a restrained velocity bend.

This phase introduces no modeled subject or new visual asset. Its WebGL objects
are subdivided rectangles carrying the already accepted AVIF textures, sharing
the Phase 3 image-plane shader family. Blender geometry, GLB export, turntables,
Draco validation, and named animation nodes therefore do not apply; exporting a
flat rectangle would add no ground truth and would make the required DOM image
fallback less direct.

Verified and inspected sources:

- `frames/phase4-project-courtvision.webp` — 1200×848 Court Vision plate;
- `frames/phase4-project-beatstream.webp` — 1200×686 Beat Stream plate;
- `frames/phase4-project-vision-bias-steering.webp` — 1200×916 Vision Bias
  Steering plate;
- `frames/phase4-projects-grid-before.jpg` — accepted pre-Phase-4 desktop card
  layout and crop reference.

## Plate composition and crop targets

- Court Vision is a level, slightly elevated 35–42° establishing view. The sea
  horizon sits near 43% height, the court ellipse fills the lower third, and the
  gold trajectory arcs bridge the center. The desktop flight card may use a
  shallow cover crop, but both hoops, the court center, and at least one complete
  gold arc must remain visible.
- Beat Stream is the strongest lateral composition: warm and blue signal ribbons
  enter from the lower-left and converge toward the coastal horizon at about 55%
  x / 42% y. Preserve the near ribbons and the right-hand bell tower so the
  gallery's travel direction stays legible.
- Vision Bias is nearly axial. The round labyrinth occupies the lower 68%, its
  observatory is centered, and two light paths diverge upward. Preserve the full
  fork, observatory dome, and enough of the circular boundary to read the choice
  metaphor; lateral bend may not make the split appear to choose one side.
- Desktop cards target about 68–74vw by 68–74svh with 5–7vw gaps. One plate is
  dominant at a time while the next edge remains visible as an invitation to
  travel. The first and last cards receive enough track padding to align their
  readable image-and-copy centers within the viewport.
- Mobile cards remain full-width in normal flow. Their original aspect ratios
  and accepted `object-fit: cover` crops remain the fallback and accessibility
  source. No canvas may replace or remove the semantic project link.

## Light, color, and shader response

- The textures already contain their narrative light: Court Vision's warm gold
  arcs over cobalt, Beat Stream's coral/citron ribbons, and Vision Bias's paired
  gold/cool beams. The shader only refracts those pixels; it adds no highlight,
  bloom, color split, or second light source.
- Travel velocity produces a shallow horizontal bow and skew, capped at 5° and
  below 0.008 UV displacement. The leading edge may compress while the trailing
  edge relaxes, like a large paper plate flexing in flight. It must settle flat
  within roughly 450 ms after scrolling stops.
- A 40×28-or-denser plane gives the curve enough segments without increasing
  draw calls. All three plates share one R3F canvas, one material program, and
  three texture-backed meshes; uniforms and measurement arrays are reused.
- The canvas is decorative, `aria-hidden`, and pointer-transparent. DOM images
  stay rendered underneath and are hidden only after textures and the first
  WebGL frame are ready. Reduced motion, no-WebGL, loading, and failure states
  show the complete static gallery.

## Horizontal choreography and navigation

- Desktop vertical progress maps linearly to track travel. The pinned distance
  equals measured overflow, with no synthetic wheel handler and no nested
  scroller. Lenis and native wheel/touch input therefore remain authoritative.
- Giant serif numerals `01`, `02`, and `03` sit behind their matching plates at
  8% ink opacity and move at a slower parallax rate. They duplicate existing case
  indices and are hidden from assistive technology.
- Each project panel is a real focusable link with a stable fragment id. Focusing
  an offscreen panel or targeting its fragment scrolls the normal document to
  the corresponding pinned progress; Enter still opens the case study. The
  section's `#projects` anchor lands at the beginning of the flight path.
- Desktop transforms belong only to the React flight-path component. The legacy
  Atlas project pan, print reveal, and velocity-plate owners no longer target
  homepage project panels. Project-detail artwork retains those Atlas effects.
- Mobile has no pin and no horizontal track transform. Pointer/touch scrolling
  remains normal vertical flow; the card image may receive only the bounded
  velocity skew. Reduced motion removes pinning, transforms, and canvases.

## Halftone dissolve and flight-log tilt

- Chapter color prints in through a 12px dot-screen grid. Circular mask dots grow
  from zero to overlap while the grid drifts no more than one cell in the wipe
  direction. There is no rectangular curtain edge. Both unprefixed and WebKit
  mask declarations provide Chromium, Firefox, and Safari parity.
- The dissolve layer remains decorative and behind chapter content. Scrubbing is
  reversible; reduced motion leaves the chapter in its final readable color with
  no generated layer.
- Flight-log hover tilt behaves like a held dossier: pointer position maps to at
  most 6° on either axis, with a short damped return. The transform belongs to a
  dedicated inner surface so Atlas's rule drawing, SplitText index entrance, and
  Flip dossier expansion keep their existing owners and geometry.
