# React Bits source components

React Bits components are vendored as source into `components/bits`; they are
not consumed as a runtime package. Use the upstream `jsrepo` registry and choose
the **TypeScript + CSS** variant so the result matches this repository's strict
TypeScript setup and existing authored CSS architecture.

React Bits now publishes its generated jsrepo manifest from the repository's
`public/r` directory. Phase 1 initialized that registry in `jsrepo.config.ts`
and installed Splash Cursor with:

```sh
npx jsrepo add SplashCursor-TS-CSS --yes
```

Before committing a vendored component:

- move its source and styles into `components/bits/<ComponentName>/` if the CLI
  uses a different destination;
- remove demos and unused variants;
- restyle every color and type choice to the Atlas palette and typography;
- replace permissive upstream types with the smallest strict public interface;
- expose animation ownership only through the component's dedicated wrapper;
- add focused tests for reduced motion, cleanup, and user-visible behavior.

Once customized, vendored files are source-owned by this repository. Do not use
`jsrepo update` over local changes; review upstream changes and port them
intentionally.

Phase 4 vendors a strict, GSAP-owned `TiltedCard` adaptation with only the
bounded pointer tilt used by flight-log dossiers. Its PixelTransition reference
is deliberately translated into the existing Atlas chapter-wipe owner as a CSS
dot-screen mask; adding a second React owner for those chapter nodes would break
the one-owner rule.
