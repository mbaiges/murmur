# Loop state: repo-restructure

Updated: 2026-08-02 (COMPLETE + post-review logo fix)
Iteration: 12
Status: **COMPLETE**
Spec:

- docs/features/repo-restructure/functional-spec.md
- docs/features/repo-restructure/technical-spec.md

## Verification commands

- Feature E2E (in-loop): `npm run test:e2e:repo-restructure`
- Full gate: `npm run lint && npm run test:unit && npm run test:integration && npm run build && env -u ELECTRON_RUN_AS_NODE npm run test:e2e`

## Acceptance checklist

All AC-1–19 marked complete in iteration 12; see functional/technical specs.

## Migration structure audit (2026-08-02)

| Area | Expected (technical spec) | Actual | Verdict |
|------|---------------------------|--------|---------|
| `src/core/domain` | Service, Scheduler, config-types, prompts, types barrel | Present | OK |
| `src/core/ports` | I* ports; no IWallpaperBackup | Present; no legacy `src/ports/` on disk | OK |
| `src/core/lib` | layout/, phrase/, presets/, generation/ | Present | OK |
| `src/main` | bootstrap, ipc, windows, infrastructure, e2e, lib | Present | OK |
| `src/shared` | ipc-contract.ts only | Single file | OK |
| `src/renderer` | features/*, app/AppShell, types/window-api | Present | OK |
| `renderer/components/` | Optional shared UI | Removed empty dir (MoodsTab → features/moods) | OK (minor spec drift) |
| `tests/unit` | Mirrors core + main/infrastructure | 12 files mirrored | OK |
| `tests/integration/core` | pipeline.test.ts | Present | OK |
| Legacy `src/domain`, `src/adapters` | Gone | Not on disk | OK |

**Gaps (non-blocking):** No unit tests for `WinDesktopWallpaperAdapter`, `WinStartupAdapter`, `gemini` adapter, or `rss` (same as pre-restructure). `tests/unit/core/lib` could add subfolder paths later for parity with `core/lib/*` (optional).

## E2E screenshot manifest — agentic review

Reviewed PNGs from last full E2E run (23 tests) plus post-fix `murmur.spec` at 12:04 after `./logo.png` + `renderer.base: './'`.

| Slug / file | Visual review |
|-------------|----------------|
| `settings-dashboard/01` | Wizard or feeds entry; sidebar chrome OK; logo OK after fix |
| `settings-dashboard/02` | Filled wizard (legacy capture) |
| `settings-dashboard/03` | Feeds tab, prompt, RSS; success toast; logo OK after fix |
| `settings-dashboard/04` | Appearance controls intact |
| `settings-dashboard/05` | Monitors card, stub phrase, theme override |
| `settings-dashboard/06` | History preview list, Raw JSON toggle |
| `clickbait-diagnostics-fade/wallpaper` | Crimson bg, stub phrase, clock overlay |
| `clickbait-diagnostics-instant/settings-appearance` | Instant + save toast |
| `clickbait-diagnostics-instant/monitors-phrase` | Monitors tab phrase visible |
| `clickbait-live-overlay/wallpaper` | Real headline on overlay (live spec) |
| `clickbait-live-overlay/settings` | Clickbait Press mood active |
| `magazine-layouts-editorial/01–03` | Feature opener, sidebar rail, byline/lede stub copy |
| `magazine-layouts-live-phrase-*` | Live fixture phrase; split/tabloid/pull-quote markup |
| `magazine-layouts-split-spread` | Left/right stub halves |
| `magazine-layouts-tabloid-stack` | Headline + deck stub |
| `magazine-layouts-pull-quote` | Quote bar + stub text |
| `presets-aesthetic-moods/*` | Four mood wallpapers (terminal, zen, gothic, clickbait) |
| `presets-custom-prompt/applied` | Custom prompt Applied toast |
| `structured-layout-semantics/01–05` | Structured proverb layouts + history raw JSON |
| `structured-phrase-generation/01–02` | History preview + raw JSON |

**Logo fix:** `/logo.png` broke under `loadFile` (`file://`); switched to `./logo.png` and Vite `base: './'`. Pre-fix PNGs (timestamps ~11:56) may show broken sidebar icon; post-fix murmur.spec confirms logo.

## Last verification

- Lint: pass — `npm run lint`
- Unit: pass — 35 tests
- Integration: pass — 1 test
- Build: pass — `npm run build` (renderer `base: './'`)
- E2E feature smoke: pass — `test:e2e:repo-restructure`
- E2E (full): pass — 23/23 (~1.9m), post logo fix
- Agentic PNG spot-check: `settings-dashboard/03-main-dashboard-feeds.png` — sidebar logo visible (not broken placeholder)

## Next iteration focus

None — restructure complete. Optional follow-up: copy smoke PNGs to `screenshots/repo-restructure/` slug for loop-build convention.
