# Source-vendored interface components

Components in this directory began as React Bits source components and were
adapted to the portfolio’s TypeScript, accessibility, motion, and visual
contracts. They are compiled as repository-owned source rather than consumed as
a runtime package.

The `jsrepo` registry is configured to install TypeScript + CSS variants into
`components/bits`:

```sh
npx jsrepo add <ComponentName>-TS-CSS --yes
```

Before committing an addition or upstream update:

- review the upstream source and licensing;
- remove demos, variants, and dependencies that are not used;
- adapt colors and typography to the Atlas design system;
- keep the public interface small and strictly typed;
- preserve reduced-motion behavior and cleanup browser resources on unmount;
- add focused unit tests and exercise browser-only drawing behavior in
  Playwright.

Do not run an automated update over locally customized components. Port and
review upstream changes intentionally.
