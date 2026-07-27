# Repository Agent Instructions

## Repository contract

- `source` is the source-of-truth branch and deploys to GitHub Pages.
- Run `npm run verify` before handing off changes. Run coverage and Playwright
  for behavior or rendering changes.
- Generated browser bundles (`public/atlas.js` and `public/horizon.js`) and
  build output are ignored. Rebuild them through the package scripts.
- Visual-analysis media and QA captures under `design-refs/` are intentionally
  local-only. Do not add them to Git.
- Preserve unrelated working-tree changes and local worktrees.

## Visual asset pipeline

Use this pipeline for every new hero, major 3D section, or reference-driven
visual asset. Do not model or integrate a reference before analyzing it.

### 1. Analyze the reference

1. Save source media under `design-refs/video/` and verify it with `ffprobe`.
2. Extract representative frames with `ffmpeg` (3 fps is the default for short
   references), then open and inspect them.
3. Curate the frames that establish composition, lighting, intact and damaged
   structure, and close-up geometry under `design-refs/frames/<asset>/`.
4. Document camera, lighting, atmosphere, repeated parts, negative spaces,
   damage, motion order, and implementation targets in
   `design-refs/ANALYSIS.md`.

These files remain local and are the ground truth for subsequent modeling and
visual review.

### 2. Build procedural assets headlessly

Never open the Blender GUI for this pipeline:

```sh
blender --background --python-exit-code 1 --python scripts/<builder>.py
```

- Keep asset-specific layout, seeded variation, fracture maps, and naming in
  the asset builder.
- Reuse primitives, pivots, material helpers, GLB compression, budget
  validation, and turntable infrastructure from `scripts/asset_lib.py`.
- Use deterministic seeds and semantic, stable object names.
- Keep independently animated units as separate nodes with local pivots near
  their bounds centers.
- Keep Blender materials texture-free and simple; runtime reflection and
  interaction belong in Three.js.

After changing shared helpers:

```sh
blender --background --python-exit-code 1 --python scripts/test_asset_lib.py
```

### 3. Render, compare, and export

- Render at least two six-view turntable iterations into an asset-specific
  directory under `design-refs/blender-renders/<asset>/`.
- Open the renders and compare silhouette, density, overlap, depth, damage,
  and light transmission with the curated reference frames.
- Export through `export_and_compress_glb()` from `scripts/asset_lib.py`.
- Keep compressed GLBs strictly under 3 MiB and 150,000 triangles.
- Preserve required node names and Draco compression when inspecting the
  exported model.
- Serve decoder files from `public/draco/`; never rely on a decoder CDN.

### 4. Integrate and verify

Follow the current scene conventions in
`components/scenes/ProjectSpiralScene.tsx` and
`components/scenes/FeatherFallScene.tsx`:

- Load GLBs inside `Suspense`, clone imported scenes before mutation, and
  dispose generated materials and textures.
- Retain static, reduced-motion, no-WebGL, and mobile fallbacks.
- Bound DPR, avoid per-frame allocations, and gate expensive scenes.
- Keep mutable animation progress outside React render state.
- Expose performance statistics through `?stats=1` when a scene supports them.

Capture and inspect load plus 25%, 50%, 75%, and 100% states locally. Record
remaining visual tradeoffs in `design-refs/VERIFICATION.md`. Application-origin
console errors and missing assets are release blockers.

## Verification

For ordinary changes:

```sh
npm run verify
npm run test:coverage
```

For interaction, routing, asset, or rendering changes:

```sh
npm run test:e2e
```

Before handoff, also inspect the diff, run `git diff --check`, and scan for
secrets, debug statements, missing assets, and stale documentation.
