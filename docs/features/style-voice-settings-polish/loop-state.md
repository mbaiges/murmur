# Loop state: style-voice-settings-polish

Updated: 2026-08-02
Iteration: 1
Spec:

- docs/features/style-voice-settings-polish/functional-spec.md
- docs/features/style-voice-settings-polish/technical-spec.md

E2E screenshot dir (gitignored): `e2e/artifacts/screenshots/style-voice-settings-polish/`

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:style-voice-settings-polish`
- Feature unit (in-loop): `npm run test:unit -- tests/unit/core/lib/presets/configDelta.test.ts tests/unit/core/lib/presets/appearanceRegenerate.test.ts`
- Full unit (final gate): `npm run test:unit`
- Full E2E (final gate): `npm run test:e2e`

## Acceptance checklist

- [ ] AC1: Style IA Background / Phrase / Widgets
- [ ] AC2: Mood stages prompt + tone in draft
- [ ] AC3: Apply / Reset unified draft
- [ ] AC4: No Gemini while drafting
- [ ] AC5: Visual-only Apply → zero Gemini
- [ ] AC6: Content Apply → one Gemini
- [ ] AC7: Mood Apply parity
- [ ] AC8: Mini preview draft styling
- [ ] AC9: Voice tone row + no prompt Apply
- [ ] AC10: Dirty navigation confirm
- [ ] AC11: Apply toasts
- [ ] AC12: Presets draft-only

## Unit test plan

- `configDelta.test.ts` → visual vs content vs none; field lists
- `appearanceRegenerate.test.ts` → delegates to configDelta; E2E reuse path
- `config-save` handler tests (later iteration) → refresh vs reRender call counts

## E2E scenarios + screenshot manifest

Paths under `e2e/artifacts/screenshots/style-voice-settings-polish/`.

| # | Step | File | Status |
|---|------|------|--------|
| 1 | Style tab with mini preview + section cards | `01-style-preview.png` | pending |
| 2 | Dirty Apply bar visible after draft edit | `02-apply-bar.png` | pending |
| 3 | Voice tone chips + language row | `03-voice-tone-row.png` | pending |

## Last verification

- Unit (in-loop): pending
- E2E (in-loop): pending
- Final full-suite gate: pending

## Screenshot review notes

- (none yet)

## Open issues

- Critical: none
- Improvement: WallpaperView extraction is large — slice in phase 5

## Next iteration focus

1. Implement `configDelta.ts` + refactor `appearanceRegenerate.ts` + `config-save.ts` + `reRenderWallpapers`
2. Unit tests green for delta classification
3. Add stub E2E spec + npm script (smoke)
4. Then `useSettingsDraft` + Apply bar (iteration 2)
