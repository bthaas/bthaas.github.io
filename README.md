# Brett Haas — Portfolio

[![Deploy Next.js site to Pages](https://github.com/bthaas/bthaas.github.io/actions/workflows/deploy.yml/badge.svg?branch=source)](https://github.com/bthaas/bthaas.github.io/actions/workflows/deploy.yml)

[Visit the live portfolio](https://www.bretthaas.com)

![Brett Haas portfolio preview](./public/icarus-atlas/hero-social-1600.webp)

An interactive software-engineering portfolio built around an editorial atlas
metaphor. The site presents applied AI research, production engineering work,
selected projects, and a tactile skills playground through accessible,
progressively enhanced motion.

## Highlights

- A draggable four-route portfolio gateway with keyboard navigation.
- A responsive career timeline and interactive project spiral.
- GSAP- and Lenis-driven motion with reduced-motion and no-JavaScript fallbacks.
- Lazy React Three Fiber scenes with local Draco decoding and bounded rendering.
- A statically exported Next.js site deployed to GitHub Pages.

## Stack

- Next.js 16, React 19, and TypeScript
- GSAP, ScrollTrigger, and Lenis
- React Three Fiber, Drei, and Three.js
- Matter.js for the skills workbench
- Vitest, Testing Library, and Playwright
- Blender-generated GLB assets with Draco compression

## Architecture

The App Router statically exports the homepage, four portfolio screens, three
project case studies, the sitemap, and the 404 page. Copy and project data live
in `content/`; reusable motion math lives in `lib/`; browser choreography is
bundled from `src/atlas/`; and interactive scenes live in `components/scenes/`.

The committed GLBs and responsive images are sufficient to run the site.
Blender and the local visual-reference archive are only needed when rebuilding
procedural assets. That archive is intentionally ignored by Git.

## Local development

Node.js 22 and npm are required.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build and serve the same static export used by GitHub Pages:

```bash
npm start
```

## Quality gates

```bash
npm run verify        # unit tests, typecheck, production build
npm run test:coverage # coverage thresholds (80% minimum)
npm run test:e2e      # Chromium, Firefox, desktop WebKit, iPhone WebKit
```

Useful supporting commands:

```bash
npm run build:atlas
npm run prepare:deployment
npm run serve:deployment
```

The experience retains complete reading order and navigation without WebGL,
under reduced motion, and when client-side enhancements are unavailable.

## Deployment

`source` is the source-of-truth branch. Pushes to it run the verification gate,
prepare the versioned static assets, and deploy `out/` through GitHub Pages.
The custom domain is [www.bretthaas.com](https://www.bretthaas.com).

## Source components

The components in `components/bits/` are source-vendored and customized for this
site. See their local guide before updating them.

## Rights

© 2026 Brett Haas. This repository is published for portfolio review and is not
licensed for reuse. No open-source license is granted for the source code,
writing, artwork, videos, or generated assets.
