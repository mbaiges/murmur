# Loop state: repo-restructure

Updated: 2026-08-02 (COMPLETE — Phase 12 final gate)
Iteration: 12
Status: **COMPLETE**
Spec:

- docs/features/repo-restructure/functional-spec.md
- docs/features/repo-restructure/technical-spec.md

E2E screenshot dir (gitignored): `tests/e2e/artifacts/screenshots/repo-restructure/` (repo convention; slug `repo-restructure` for this feature)

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:repo-restructure`
- Feature unit (in-loop): `npm run test:unit`
- Full unit (final gate): `npm run test:unit`
- Full integration (final gate): `npm run test:integration`
- Full E2E (final gate): `env -u ELECTRON_RUN_AS_NODE npm run test:e2e`
- Lint: `npm run lint`

## Acceptance checklist

- [x] AC-1 layout (core + main/infrastructure + main/lib + shared/ipc)
- [x] AC-2 composition (bootstrap + ipc + windows; index.ts lifecycle/tray/state)
- [x] AC-3 IPC parity (IpcChannel wired in main + preload)
- [x] AC-4 lint boundaries (ESLint on renderer/preload; @core/ports blocked)
- [x] AC-5 aliases (Vite/tsconfig/vitest)
- [x] AC-6 unit (35 tests, mirrored paths)
- [x] AC-7 integration
- [x] AC-8 E2E (full suite 23 passed)
- [x] AC-9 build
- [x] AC-10 architecture rewrite (`docs/architecture.md` + scaffolding superseded)
- [x] AC-11 data (unchanged userData files / adapters)
- [x] AC-12 lint script
- [x] AC-13 core/lib subfolders
- [x] AC-14 domain split
- [x] AC-15 settings granularity
- [x] AC-16 test mirror
- [x] AC-17 window.api types
- [x] AC-18 wallpaper port (`IWallpaperBackup` removed; `IWallpaperRenderer` backup/restore)
- [x] AC-19 E2E stub location (`main/e2e/`)

## Unit test plan

- Mirrored under `tests/unit/core/**` and `tests/unit/main/infrastructure/**`.
- `placeholder.test.ts` removed.

## E2E scenarios + screenshot manifest

In-loop smoke: `murmur.spec.ts`. Final gate: full `npm run test:e2e` (23 tests).

| # | Step | File | Status |
|---|------|------|--------|
| 1 | Settings/wizard entry | `tests/e2e/artifacts/screenshots/settings-dashboard/01-wizard-or-dashboard.png` | pass |
| 2 | Main dashboard | `tests/e2e/artifacts/screenshots/settings-dashboard/03-main-dashboard-feeds.png` | pass |
| 3 | Appearance tab | `tests/e2e/artifacts/screenshots/settings-dashboard/04-appearance-tab.png` | pass |

## Last verification

- Lint: pass — `npm run lint`
- Unit: pass — `npm run test:unit` (35)
- Integration: pass — `npm run test:integration`
- Build: pass — `npm run build`
- E2E (full): pass — `env -u ELECTRON_RUN_AS_NODE npm run test:e2e` (23/23)
- Final full-suite gate: **pass**

## Screenshot review notes

- Settings dashboard flow unchanged after restructure; sidebar tabs and wizard OK.
- Full E2E suite green including magazine layouts, presets, structured semantics.

## Next iteration focus

None — restructure complete. Follow-up work is new features via `docs/features/<feature>/` pipeline.
