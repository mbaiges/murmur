# Loop state: background-image

Updated: 2026-08-04T06:40:00Z  
Iteration: 4  
Spec:

- docs/features/background-image/functional-spec.md
- docs/features/background-image/technical-spec.md

E2E screenshot dir (gitignored): `tests/e2e/artifacts/screenshots/background-image/`

## Verification commands

- Feature E2E: `npm run test:e2e:background-image`
- Unit: `npm run test:unit`
- Full E2E (final gate): `npm run test:e2e`

## Acceptance checklist

- [x] AC1–AC13 (core background modes, Cloudflare, overlay IPC)
- [x] AC14–AC17 (in-image phrase, Apply regen, data URL)
- [x] AC18–AC21 (phrase hidden, phrase caption widget, Absurd connections, verbatim FLUX phrase)

## Last verification

- Unit: pass — 109 tests
- Feature E2E: pass in prior iteration (`background-image.spec.ts`)
- Full E2E gate: run `npm run test:e2e` before merge to main

## Iteration 4 changes (product + docs)

- **Phrase on wallpaper (AI):** Murmur overlay | Inside AI image | **Hidden**
- **`showHeroPhrase`** + **`overlays.phraseWidget`**; bottom-row layout (concepts | caption | sources)
- **`BottomPhraseWidget`** + canvas **`drawPhraseWidget`**
- **`Absurd connections`** background preset
- **`finalizeIntegratedImagePrompt`** for full in-image phrase text
- Nine in-image phrase presets; Repository port naming; specs synced

## Status

**COMPLETE** for feature branch pending optional full E2E gate on merge.
