# Loop state: repo-restructure

Updated: 2026-08-02 (iteration 11 — Phase 10 complete)
Iteration: 11
Spec:

- docs/features/repo-restructure/functional-spec.md
- docs/features/repo-restructure/technical-spec.md

E2E screenshot dir (gitignored): `tests/e2e/artifacts/screenshots/repo-restructure/` (repo convention; slug `repo-restructure` for this feature)

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:repo-restructure`
- Feature unit (in-loop): `npm run test:unit` (widens as phases touch code)
- Full unit (final gate): `npm run test:unit`
- Full integration (final gate): `npm run test:integration`
- Full E2E (final gate): `env -u ELECTRON_RUN_AS_NODE npm run test:e2e`
- Lint: `npm run lint`

## Acceptance checklist

- [x] AC-1 layout (core + main/infrastructure + main/lib + shared/ipc)
- [x] AC-18 wallpaper port (`IWallpaperBackup.ts` removed)
- [x] AC-6 unit (Phase 1 gate)
- [x] AC-7 integration (Phase 1 gate)
- [x] AC-9 build (Phase 1 gate)
- [x] AC-2 composition (bootstrap + ipc + windows; index.ts lifecycle/tray/state)
- [x] AC-3 IPC parity (IpcChannel wired in main + preload)
- [x] AC-5 aliases (Vite/tsconfig/vitest; renderer/preload use @core + @shared/ipc only)
- [ ] AC-4 lint boundaries (rules active; @core/ports blocked on renderer/preload)
- [ ] AC-6 unit
- [ ] AC-7 integration
- [ ] AC-8 E2E
- [ ] AC-9 build
- [ ] AC-10 architecture rewrite
- [ ] AC-11 data
- [x] AC-12 lint script (`npm run lint` passes — boundary rules on renderer/preload)
- [x] AC-13 core/lib subfolders
- [x] AC-14 domain split (config-types + prompts; types barrel)
- [x] AC-15 settings granularity (tabs, hooks, SetupWizard, sidebar; files under ~400 lines)
- [x] AC-16 test mirror (unit + integration paths; placeholder removed)
- [x] AC-17 window.api types (`renderer/types/window-api.d.ts`)
- [ ] AC-18 wallpaper port (delete IWallpaperBackup)
- [x] AC-19 E2E stub location (`main/e2e/`)

## Unit test plan

- Phase 0: no new unit tests; existing suite must stay green after ipc-contract wiring.
- Later phases: move tests with mirrored paths per technical spec.

## E2E scenarios + screenshot manifest

In-loop uses `murmur.spec.ts` smoke until restructure-specific spec added. Copy captures under `repo-restructure/` slug for loop-build review.

| # | Step | File | Status |
|---|------|------|--------|
| 1 | Settings/wizard entry | `tests/e2e/artifacts/screenshots/settings-dashboard/01-wizard-or-dashboard.png` | pass |
| 2 | Main dashboard | `tests/e2e/artifacts/screenshots/settings-dashboard/03-main-dashboard-feeds.png` | pass |
| 3 | Appearance tab | `tests/e2e/artifacts/screenshots/settings-dashboard/04-appearance-tab.png` | pass |

## Last verification

- Integration: pass — `npm run test:integration`
- E2E (in-loop): pass — `npm run test:e2e:repo-restructure`
- Lint: pass — `npm run lint`
- Build: pass — `npm run build`
- Final full-suite gate: pending

## Screenshot review notes

- `settings-dashboard/01-wizard-or-dashboard.png`: Wizard visible (Gemini key + RSS); pass.
- `settings-dashboard/03-main-dashboard-feeds.png`: Feeds tab loaded, sidebar OK, success toast; pass.
- `settings-dashboard/04-appearance-tab.png`: Appearance controls visible; pass.

## Next iteration focus

1. **Phase 11:** Rewrite `docs/architecture.md`; supersede `docs/scaffolding/*`.
2. Final gate: full E2E + loop-state COMPLETE.
