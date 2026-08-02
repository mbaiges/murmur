# Loop state: repo-restructure

Updated: 2026-08-02 (iteration 1 complete — Phase 0)
Iteration: 1
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

- [ ] AC-1 layout
- [ ] AC-2 composition
- [x] AC-3 IPC parity (IpcChannel wired in main + preload)
- [ ] AC-4 lint boundaries (rules active; full alias tighten later)
- [ ] AC-5 aliases
- [ ] AC-6 unit
- [ ] AC-7 integration
- [ ] AC-8 E2E
- [ ] AC-9 build
- [ ] AC-10 architecture rewrite
- [ ] AC-11 data
- [x] AC-12 lint script (`npm run lint` passes — boundary rules on renderer/preload)
- [ ] AC-13 core/lib subfolders
- [ ] AC-14 domain split
- [ ] AC-15 settings granularity
- [ ] AC-16 test mirror
- [ ] AC-17 window.api types
- [ ] AC-18 wallpaper port (delete IWallpaperBackup)
- [ ] AC-19 E2E stub location

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

- Unit (in-loop): pass — `npm run test:unit`
- E2E (in-loop): pass — `npm run test:e2e:repo-restructure`
- Lint: pass — `npm run lint`
- Build: pass — `npm run build`
- Final full-suite gate: pending

## Screenshot review notes

- `settings-dashboard/01-wizard-or-dashboard.png`: Wizard visible (Gemini key + RSS); pass.
- `settings-dashboard/03-main-dashboard-feeds.png`: Feeds tab loaded, sidebar OK, success toast; pass.
- `settings-dashboard/04-appearance-tab.png`: Appearance controls visible; pass.

## Next iteration focus

1. **Phase 1:** Create `src/core/{domain,ports,lib}`; move modules; `resolveBrandIcon` → `main/lib`; update vitest/electron-vite aliases.
2. Run unit + integration after moves.
3. Optional: dedicated `repo-restructure` screenshot slug in E2E (currently reuses `settings-dashboard`).
