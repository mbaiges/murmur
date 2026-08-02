# Loop state: per-monitor-settings
Updated: 2026-08-02
Iteration: 1
Spec:
- docs/features/per-monitor-settings/functional-spec.md
- docs/features/per-monitor-settings/technical-spec.md

E2E screenshot dir (gitignored): `tests/e2e/artifacts/screenshots/per-monitor-settings/`

## Verification commands
- Feature E2E (in-loop): `npm run test:e2e:per-monitor-settings`
- Feature unit (in-loop): `npm test -- tests/unit/core/lib/config tests/unit/core/domain/MurmurService.test.ts`
- Full unit (final gate): `npm test`
- Full E2E (final gate): `npm run test:e2e`

## Acceptance checklist
- [x] AC1: Sidebar display selector + global General
- [x] AC2: Switch display keeps tab (implemented; single display in E2E)
- [ ] AC3: Different feeds per display + union RSS (core done; E2E not multi-display)
- [x] AC4–5: Voice/style mesh propagation (unit: monitorSync.test.ts)
- [x] AC6–8: Sync chips UI (E2E visibility)
- [x] AC9: New monitor clone primary (ensureMonitorsForScreens)
- [x] AC10: v1 migration (configMigrate.test.ts)
- [x] AC11: History scoped to selected display
- [ ] AC12: Full regression E2E suite (final gate pending)

## Unit test plan
- [x] configMigrate.test.ts
- [x] monitorSync.test.ts
- [x] configDelta + appearanceRegenerate updated
- [x] MurmurService.test.ts

## E2E scenarios + screenshot manifest

| # | Step | File | Status |
|---|------|------|--------|
| 1 | Settings + display selector | `01-display-selector.png` | pass |
| 2 | News tab + sync chip | `02-news-scoped.png` | pass |

## Last verification
- Unit (in-loop): **pass** — `npm test` (64 tests)
- E2E (in-loop): **pass** — `npm run test:e2e:per-monitor-settings`
- Build: **pass** — `npm run build`
- Final full-suite gate: **pending**

## Screenshot review notes
- `01-display-selector.png`: Display 1 dropdown + sync chip in sidebar; General tab; Refresh Now visible — **pass**
- `02-news-scoped.png`: News sources tab; sync chip in header; Add feed / Active feeds — **pass**

## Open issues
- Improvement: Multi-display E2E (two monitor ids) for AC3/AC5 mesh UI
- Improvement: Legacy tabs (FeedsTab, MonitorsTab) still reference old config shape if linked

## Next iteration focus
1. Run **final gate**: `npm test` + `npm run test:e2e` (full suite)
2. Fix any failing legacy E2E specs (settings-ui-reorg, style-voice, etc.)
3. Commit implementation on `feature/per-monitor-settings` when green
4. Set **COMPLETE** after full gate + optional multi-monitor E2E
