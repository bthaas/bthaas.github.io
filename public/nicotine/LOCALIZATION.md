# Localization scaffold

All interface copy lives in `src/i18n/strings.ts`. Components consume the
typed `strings` object, and the custom ESLint rule
`design/no-raw-user-facing-strings` rejects new rendered copy, user-facing
props, Alert copy, and copy-bearing object fields in app/component files.

`src/i18n/index.ts` reads the primary locale and currency from
`expo-localization`. Dates, times, numbers, percentages, and money use the
shared `Intl` helpers. RevenueCat continues to supply its own localized
App Store price strings.

At onboarding, the app records the device currency code on the quit profile.
That preserves the meaning of historical cost and savings if the device
locale later changes. Profiles created before this field existed migrate to
`USD`, because prior releases displayed and interpreted every entered cost as
US dollars. Imported profiles also normalize invalid or missing codes to that
documented fallback.

English is the only catalog in the launch build. To add a translation, keep
the same `AppStrings` shape, select a catalog from the detected language tag,
and add locale-specific plural handling where the English catalog currently
receives a singular flag. No screen-level copy extraction should be needed.
