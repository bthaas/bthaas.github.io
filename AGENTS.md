# Repository Agent Instructions

## Visual asset and section pipeline

Use this pipeline for every new hero, major 3D section, or reference-driven
visual asset. Treat each gate as required; do not jump directly from a reference
to modeling or UI implementation.

### 1. Analyze the reference before modeling

1. Save source media under `design-refs/video/` and verify it with `ffprobe`.
2. Extract a representative frame sequence with `ffmpeg` (3 fps is the default
   for short motion references) into `tmp/frames/`.
3. Actually open and inspect the extracted frames. Do not infer the design from
   a thumbnail or prompt text.
4. Curate the frames that establish composition, lighting, intact structure,
   damaged structure, and close-up geometry into `design-refs/frames/` with
   descriptive stable filenames.
5. Write `design-refs/ANALYSIS.md` before writing modeling code. At minimum,
   document:

   - subject placement, silhouette, camera height, field of view, and horizon;
   - key/fill direction, color temperature, haze and fog colors;
   - cloud or environment density and depth cues;
   - repeated-part counts, overlap, size gradients, and local variation;
   - damage/fracture locations, negative spaces, detached parts, and motion order;
   - explicit implementation targets for geometry, material, camera, and motion.

`ANALYSIS.md` and its curated frames are the visual ground truth for every later
phase. If they are missing or vague, stop and complete the analysis first.

### 2. Build procedural assets headlessly

- Never open the Blender GUI for this pipeline. Run builders and renders with:

  ```sh
  blender --background --python-exit-code 1 --python scripts/<builder>.py
  ```

- Keep asset-specific layout, silhouette, seeded variation, fracture maps, and
  naming in the asset builder. Import reusable primitives and infrastructure from
  `scripts/asset_lib.py`; do not duplicate them in another builder.
- `asset_lib.py` owns feather and fragment primitives, mesh accumulation and
  pivots, the base marble material, GLB export/compression/budget validation, and
  the standard turntable rig. Extend it when a future procedural asset needs a
  generally useful primitive.
- Use deterministic random seeds. Re-running a builder must reproduce the same
  geometry and node names.
- Repeated organic parts should use 2–3 low-poly variants, graded size/angle, and
  small deterministic rotation, curl, and depth offsets. Preserve the silhouette
  before adding surface detail.
- Export animation units as separate, semantically named objects. For wings use
  `wingL_root`, `wingL_mid`, `wingL_tip`, `wingR_root`, `wingR_mid`,
  `wingR_tip`, and zero-padded `loose_feather_01`-style names. Future assets
  should follow the same `<asset><side>_<zone>` and `<part>_NN` pattern.
- Place each object's pivot near its local bounds center so R3F can detach and
  rotate it without an artificial orbit.
- Blender materials stay texture-free and simple. Use `create_marble_material()`
  for this scene; complex marble reflection and gold interaction belong in R3F.

Run the Blender library contract after changing procedural helpers:

```sh
blender --background --python-exit-code 1 --python scripts/test_asset_lib.py
```

### 3. Compare turntables and iterate

- Render six warm product-lighting orbit stills through
  `scripts/render_turntable.py`, which imports the shared rig from
  `scripts/asset_lib.py`.
- Save exploratory passes in numbered iteration directories and the accepted six
  images in `design-refs/blender-renders/turntable-01.png` through
  `turntable-06.png`.
- Open the renders and compare them directly with the curated reference frames.
  Review silhouette, row density, overlap, camera-facing thickness, fracture
  gaps, loose-part distribution, and light transmission.
- Complete at least two build/render/review iterations. More are required while
  a material silhouette or structural mismatch is obvious. Do not claim visual
  verification based only on a successful render command.

### 4. Export, compress, and enforce budgets

- Builders must call `export_and_compress_glb()` from `scripts/asset_lib.py`.
  It exports named objects, runs glTF Transform with Draco through a temporary
  file, validates strict budgets, and replaces the target atomically.
- Preserve independent animation nodes. Compression must keep `--flatten false`,
  `--join false`, `--instance false`, and `--simplify false` unless the section's
  animation contract has explicitly changed.
- Hard limits are **strictly under 3 MiB** compressed and **strictly under
  150,000 triangles**. Prefer substantially lower numbers for hero assets.
- Inspect the compressed GLB with glTF Transform and re-import it headlessly when
  node identity matters. Verify triangle count, file size, Draco extension, and
  every required animation object name.
- Serve compatible local Draco decoder files from `public/draco/`; do not depend
  on a third-party decoder CDN.

### 5. Integrate the section in R3F

Use `components/scenes/HeroScene.tsx` and
`components/scenes/HeroExperience.tsx` as the conventions for future hero-class
sections:

- Load Draco GLBs with `useGLTF` inside `Suspense`. Clone the imported scene
  before mutating materials or named nodes.
- Use a warm-white `MeshPhysicalMaterial` base (`#F5F2EC`, roughness `0.4`, low
  metalness), soft environment reflections, and a restrained view-dependent
  `#D4AF37` Fresnel response. Keep the interaction shader in Three.js rather than
  baking it into the GLB.
- Anchor atmosphere with `#FAF8F4` background and fog. Match the analyzed
  reference with a warm upper-right/back key, cool soft fill, and a soft daylight
  `Environment`. Desktop may use screen-space god rays from the same key
  direction; do not fake a second unrelated sun.
- Build clouds/environment as three or four layered, transparent procedural
  planes below the subject and horizon. Keep them drifting slowly and dispose
  generated textures on unmount.
- Add sparse instanced/point dust. Nothing in the hero should be perfectly still:
  use slow sinusoidal group motion and independent loose-part drift.
- Mouse parallax is damped and limited to a few degrees. The camera moves toward
  the pointer while the subject counter-rotates more subtly.
- Scroll choreography is scrubbed with GSAP ScrollTrigger and coordinated with
  Lenis. Pass progress through a mutable ref into the render loop rather than
  triggering React renders every frame. Keep progress mapping and ordered cluster
  windows in a pure tested module such as `lib/hero-choreography.ts`.
- Detachment order must follow `ANALYSIS.md`; for the wings it begins with
  `wingR_tip`, then `wingR_mid`, then `wingL_tip`, with roots moving last.
- Lazy-mount the canvas near the viewport. Always retain a static render fallback
  for no-WebGL and `prefers-reduced-motion`, and replace that fallback whenever
  the accepted hero composition materially changes.

### 6. Performance budgets

- Target a stable **60 fps desktop** and **30 fps mobile** throughout the hero's
  complete scroll choreography, not only at the initial frame.
- Use bounded DPR, avoid per-frame allocations, reuse materials and generated
  textures, and keep draw calls/postprocessing proportional to the scene.
- Mobile keeps the real 3D scene but disables depth of field, multisampling, and
  expensive desktop-only god rays. Use an intentional 30 fps render loop where
  needed.
- Expose Stats with `?stats=1` for measurement. Record viewport, observed range,
  and any throttling. Check load and at least the 25%, 50%, and 75% scroll states.
- Application-origin console errors are release blockers. Dependency deprecation
  warnings must be documented if they cannot be removed safely.

### 7. Screenshot verification and handoff

1. Run the real development or production server in a browser.
2. Capture the hero at load and at 25%, 50%, 75%, and 100% of the scroll
   choreography into `design-refs/site-screenshots/`.
3. Assemble `design-refs/comparison.png` with the reference composition and all
   five labeled site captures. Open and inspect the montage.
4. Fix visible composition, hierarchy, lighting, or transition mismatches. Record
   any remaining difference and its performance/technical tradeoff in
   `design-refs/VERIFICATION.md`.
5. Capture a clean scene-only image for the reduced-motion/no-WebGL fallback.
6. Run the full test, coverage, typecheck, production-build, secret/debug scan,
   and diff-review gates. Report GLB size/triangles and desktop/mobile FPS in the
   verification document.

A section is complete only when the reference analysis, two-or-more turntable
iterations, compressed named-node asset, R3F experience, fallbacks, performance
measurements, comparison montage, and automated verification all exist.
