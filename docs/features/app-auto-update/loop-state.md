# Loop state: app-auto-update

Updated: 2026-08-02T21:40:00-03:00  
Iteration: 2  
Spec:

- docs/features/app-auto-update/functional-spec.md
- docs/features/app-auto-update/technical-spec.md

E2E screenshot dir (gitignored): `e2e/artifacts/screenshots/app-auto-update/`

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:app-auto-update`
- Feature unit (in-loop): `npm run test:unit -- tests/unit/shared/app-update.test.ts`
- Full unit (final gate): `npm test` — **pass** (81 tests)
- Full E2E (final gate): `npm run test:e2e` — **fail** (8 failures, pre-existing unrelated specs; see below)

## Acceptance checklist

- [x] AC1: Version in General (`app-update-version`)
- [x] AC2: Delayed check wired in `createAppUpdater.start()` (packaged only)
- [x] AC3: Periodic 4h interval
- [x] AC4: Download + Restart UI when `downloaded` (manual on packaged release)
- [x] AC5: `IUpdateReadyNotifier` + Win/Mac adapters + `shouldNotifyForVersion` dedupe
- [ ] AC6: Restart install on packaged build (manual maintainer smoke)
- [x] AC7: Check for updates button + IPC
- [x] AC8: Manual download link
- [x] AC9: Disabled in dev/E2E (`phase: disabled`, check btn disabled in E2E)
- [x] AC10: `.github/workflows/release.yml` + publish config + mac zip
- [x] AC11: `docs/features/app-auto-update/release-runbook.md`
- [x] AC12: `allowPrerelease: false` (electron-updater)

## Unit test plan

- `tests/unit/shared/app-update.test.ts` → `shouldEnableAppUpdate`, `shouldNotifyForVersion`

## E2E scenarios + screenshot manifest

| # | Step | File | Status |
|---|------|------|--------|
| 1 | General → App updates section (E2E disabled copy) | `01-general-app-updates.png` | captured |
| 2 | News tab → e2e IPC open General | `02-settings-open-tab-general.png` | captured |

## Last verification

- Unit (in-loop): **pass** — `npm run test:unit` (81)
- Build: **pass** — `npm run build`
- E2E (in-loop): **pass** — `npm run test:e2e:app-auto-update`
- Final full-suite gate: **partial**
  - Full unit: pass
  - Full E2E: fail — 8 failures in `clickbait-*`, `magazine-layouts*`, `presets`, `structured-layout-semantics`, `style-voice-settings-polish` (not introduced by this feature)

## Screenshot review notes

- `tests/e2e/artifacts/screenshots/app-auto-update/01-general-app-updates.png`: **pass** — General tab; App updates card with version 0.1.0; Check for updates present; E2E/dev disabled messaging expected below fold (test asserts via testid).
- `tests/e2e/artifacts/screenshots/app-auto-update/02-settings-open-tab-general.png`: **pass** — General tab active after IPC; same App updates section visible.

## Open issues

- Critical: Full E2E suite red on **pre-existing** tests (unrelated to app-auto-update). Feature-scoped E2E green.
- Improvement: Packaged manual smoke for AC6 (install → update → restart) when first signed release ships.
- Improvement: Notification click E2E requires OS notification simulation (manual only v1).

## Next iteration focus

1. **User decision:** Waive full E2E final gate for this feature PR, or fix unrelated failing E2E specs repo-wide.
2. Maintainer: configure signing secrets + tag `v0.1.1` to validate real update path (AC6).
3. When full suite is green globally, set **Next iteration focus** to **`COMPLETE`**.
