# Deep linking

Expo Router maps inbound paths to the file-based route tree. Each build variant
uses a distinct custom scheme:

- Production: `pouchless://`
- Preview: `pouchless-preview://`
- Development: `pouchless-dev://`

Examples after a native build:

```sh
xcrun simctl openurl booted 'pouchless-dev://paywall'
xcrun simctl openurl booted 'pouchless-dev://share'
```

Expo Go uses its development URL instead:

```sh
xcrun simctl openurl booted 'exp://127.0.0.1:8081/--/paywall'
```

Paid destinations still pass through their entitlement gates; a deep link
does not grant access.

## Universal links (deferred until a domain is ready)

Do not enable `associatedDomains` until the HTTPS marketing domain serves a
valid `apple-app-site-association` file for the production application
identifier. At that point:

1. Uncomment the documented `associatedDomains` block in `app.config.ts` and
   replace `YOUR_DOMAIN`.
2. Host `https://YOUR_DOMAIN/.well-known/apple-app-site-association` without a
   redirect or file extension.
3. Add only the intentional public route paths to its `components` list.
4. Build a new native binary; this entitlement cannot be added with an OTA
   update.
5. Test install, cold launch, background launch, Free/Pro gates, malformed
   paths, and the website fallback.
