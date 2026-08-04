# Loop state: background-image

Updated: 2026-08-04T05:22:00Z  
Iteration: 1  
Spec:

- docs/features/background-image/functional-spec.md
- docs/features/background-image/technical-spec.md

E2E screenshot dir (gitignored): `e2e/artifacts/screenshots/background-image/`

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:background-image` (not added yet — iteration 2+)
- Feature unit (in-loop): `npm run test:unit -- tests/unit/core/lib/presets/backgroundPromptPresets.test.ts tests/unit/core/lib/config/configMigrate.test.ts tests/unit/main/infrastructure/background/`
- Full unit (final gate): `npm run test:unit`
- Full E2E (final gate): `npm run test:e2e`

## Acceptance checklist

- [ ] AC1: Style background mode selector (draft)
- [ ] AC2: Gradient themes unchanged
- [ ] AC3: Personal photo import + paint
- [ ] AC4: AI preset UI
- [ ] AC5: General Cloudflare fields
- [ ] AC6: Refresh pipeline Gemini + Cloudflare once per AI monitor
- [ ] AC7: Headlines in image prompt
- [ ] AC8: Provider failure fallback
- [ ] AC9: Missing Cloudflare creds fallback
- [ ] AC10: Per-display modes
- [ ] AC11: Style sync mesh
- [ ] AC12: E2E stubs
- [ ] AC13: No Imagen API

## Unit test plan

- `backgroundPromptPresets.test.ts` → custom vs preset instructions
- `configMigrate.test.ts` → v1 → v3 defaults
- `FsBackgroundAssetStoreAdapter.test.ts` → import + resolve path
- (next) Cloudflare adapter mocked fetch
- (next) `resolveBackgroundPaintInput` unit test

## E2E scenarios + screenshot manifest

| # | Step | File | Status |
|---|------|------|--------|
| 1 | Style → Background mode Gradient | `01-style-gradient.png` | pending |
| 2 | Photo mode + Apply | `02-photo-applied.png` | pending |
| 3 | AI mode + refresh (stub) | `03-ai-refresh.png` | pending |

## Last verification

- Unit (in-loop): pass — `npm run test:unit` (90 tests)
- E2E (in-loop): not run (no spec yet)
- Final full-suite gate: pending

## Screenshot review notes

(none yet)

## Open issues

- Critical: none
- Improvement: register `murmur-background://` protocol (iteration 2)
- Improvement: MurmurService pipeline + adapters not wired yet

## Next iteration focus

1. Add `CloudflareFluxBackgroundImageProviderAdapter` + `GeminiImagePromptComposerAdapter` + wire in `composition-root.ts` / `e2e-overrides.ts`.
2. Extend `MurmurService.refresh` + `paintOptionsFromProfile` + canvas painter `baseImagePath` (sharp).
3. IPC `background:pickPhoto` / `background:importPhoto`, General + Style UI.
4. Add `tests/e2e/background-image.spec.ts` + `test:e2e:background-image` npm script; capture manifest screenshots.
