# Murmur — architecture & agent guide

This document describes how the Murmur desktop app is structured, how features are extended, and how automated tests (especially E2E screenshots) are organized. Use it when changing wallpaper rendering, settings UI, or test harnesses.

## Product shape

Murmur is an **Electron** tray app that:

1. Fetches RSS headlines on a schedule  
2. Calls **Gemini** with a configurable system prompt to produce a short phrase  
3. Renders that phrase as a **desktop wallpaper** (live overlay window and/or painted PNG on the native desktop)

The **Settings** window is a React dashboard; each monitor can have a full-screen **WallpaperView** (`?view=wallpaper&monitorId=…`).

## Layering (ports & adapters)

The codebase follows a **hexagonal** style:

| Layer | Location | Role |
|--------|-----------|------|
| **Domain** | `src/domain/` | `MurmurService`, config types, scheduling — no Electron/IO |
| **Ports** | `src/ports/` | Interfaces (`IWallpaperRenderer`, `IConfigStore`, …) |
| **Adapters** | `src/adapters/` | Platform and library implementations |
| **Main** | `src/main/` | Electron lifecycle, IPC, window management, composition root |
| **Renderer** | `src/renderer/` | React UI (`App.tsx`, `WallpaperView.tsx`, `MoodsTab.tsx`) |
| **Preload** | `src/preload/` | `contextBridge` API exposed as `window.api` |
| **Shared** | `src/shared/` | Pure helpers (prompt presets, phrase markup, layout split, appearance rules) |

**Composition root:** `src/main/index.ts` wires adapters into `MurmurService` and registers IPC handlers.

### Wallpaper rendering (two paths)

1. **Live overlay** — `BrowserWindow` with `type: 'desktop'` (macOS) or WorkerW injection (Windows). Renders `WallpaperView.tsx` with CSS animations.  
2. **Static paint** — `NodeCanvasWallpaperPainterAdapter` draws PNGs; `MacDesktopWallpaperAdapter` / `WinDesktopWallpaperAdapter` sets the OS wallpaper.

When `animation === 'Instant'` on **Windows**, overlay windows are destroyed and only static paint is used. On **macOS**, the overlay is kept so the phrase stays visible.

### Config & state

- User config: `app.getPath('userData')/murmur.config.json` via `JsonConfigStoreAdapter`  
- Phrase history: `murmur.history.json`  
- IPC: `config:get` / `config:save`, `state:updated`, `action:refresh`, etc.

Shared registries (keep UI and migrations in sync):

- `src/shared/promptPresets.ts` — mood-linked vs standalone AI prompts  
- `src/shared/clickbaitPreset.ts` — Clickbait Press detection + config migration  
- `src/shared/appearanceRegenerate.ts` — when a config change should trigger `refresh()` vs re-render only  

## Renderer conventions

- **Settings chrome:** custom title bar on macOS (`titleBarStyle: 'hidden'`, extra left padding for traffic lights).  
- **Moods:** `MoodsTab.tsx` + `handleMoodChange` in `App.tsx` apply coordinated prompt, theme, font, layout, animation.  
- **Layouts:** `layoutStyle` on config; implemented in **both** `WallpaperView.tsx` (CSS) and `NodeCanvasWallpaperPainterAdapter.ts` (canvas). New layouts need `data-testid` on root nodes for E2E.  
- **Phrase markup:** Gemini may return `**bold**`, `*italic*`, `[font:…]`; parsed in renderer and canvas via `phraseFormatFlags` / `phrasePlainText`.

## Testing strategy

| Tier | Command | Location |
|------|---------|----------|
| Unit | `npm run test:unit` | `tests/unit/` — pure logic, canvas smoke |
| Integration | `npm run test:integration` | `tests/integration/` — pipeline with mocks |
| E2E | `npm run test:e2e` | `tests/e2e/` — Playwright + `_electron` |

### E2E stub mode

When `MURMUR_E2E=true` (set in Playwright launch env), `src/main/index.ts` substitutes:

- Stub RSS, stub phrase (`"stubbed surreal phrase"`), no-op or fake wallpaper IO  

This avoids real API keys and OS wallpaper changes during CI/local E2E.

**Exception:** `clickbait-live.spec.ts` omits `MURMUR_E2E` and uses the real user config; it is skipped on `CI` and non-macOS.

### E2E screenshot artifacts (required pattern)

All ** intentional** E2E screenshots (not Playwright failure dumps) must be written under:

```text
tests/e2e/artifacts/screenshots/{test-case-slug}/{filename}.png
```

- **`tests/e2e/artifacts/`** is **gitignored** (see root `.gitignore`).  
- Use the helper **`e2eScreenshotPath(testCaseSlug, filename)`** from `tests/e2e/helpers/screenshotPaths.ts` — it creates the directory.  
- **`test-case-slug`:** kebab-case, stable name matching the test scenario (e.g. `magazine-layouts-split-spread`, `settings-dashboard`, `presets-aesthetic-moods`).  
- Log the full path with `console.log('Screenshot:', path)` so CI logs and agents can find files.

**Validation:** For layout/visual tests, use `validateScreenshotImage()` from `tests/e2e/helpers/validateScreenshot.ts` (file size + luminance spread via `sharp`) plus DOM assertions (`data-testid`, computed styles, text content).

**Playwright failure artifacts** (`test-results/`, `playwright-report/`) are also gitignored; do not move those into `artifacts/screenshots`.

### Live captured phrase (layout gallery, one Gemini call)

For realistic layout screenshots without burning quota on every layout change:

1. `magazine-layouts-live-phrase.spec.ts` calls `ensureCapturedPhraseFixture()` — if `tests/e2e/fixtures/captured-phrase.json` is missing (or `MURMUR_RECAPTURE_PHRASE=1`), Playwright launches the **real** app once and runs **Refresh Now** (uses your `userData` config, RSS feeds, and Gemini key).
2. The phrase is saved to the fixture file (gitignored).
3. Tests relaunch with `MURMUR_E2E=true`, `MURMUR_E2E_REUSE_CAPTURED_PHRASE=true`, and a stub generator that returns the fixture text.
4. `shouldRegeneratePhraseAfterConfigSave()` in `appearanceRegenerate.ts` treats **layout-only** changes as re-render, not a new `refresh()`.

Main process loads the fixture in `loadE2eFixturePhrase()` when `MURMUR_E2E_FIXTURE_PHRASE_PATH` is set.

### E2E helpers

| File | Purpose |
|------|---------|
| `helpers/screenshotPaths.ts` | Canonical artifact paths |
| `helpers/validateScreenshot.ts` | PNG non-empty / contrast checks |
| `helpers/electronSettingsPage.ts` | Find settings vs wallpaper windows |

### Typical E2E flow

1. Launch Electron with `MURMUR_E2E: 'true'`.  
2. Complete wizard if needed (`test-api-key`).  
3. Drive UI via sidebar tabs; Appearance `select` indices are order-sensitive (document in test comments).  
4. Assert on wallpaper window URL containing `view=wallpaper`.  
5. Screenshot via `e2eScreenshotPath` + optional `validateScreenshotImage`.

## Build & dev

- **Dev:** `npm run dev` → `scripts/run-dev.mjs` (macOS Dock name, unset `ELECTRON_RUN_AS_NODE` in Cursor).  
- **Build:** `npm run build` → `out/main`, `out/preload`, `out/renderer`.  
- **E2E:** `env -u ELECTRON_RUN_AS_NODE npm run test:e2e` after build.

## Extending the app (checklist)

1. **New AI prompt preset** — constant in `src/domain/types.ts`, entry in `src/shared/promptPresets.ts`, optgroup in `App.tsx` if mood-linked.  
2. **New mood** — `MoodsTab.tsx`, `handleMoodChange`, `isMoodActive` checks, optional e2e in `presets.spec.ts`.  
3. **New layout** — extend `LayoutStyleName` + Zod schema, `WallpaperView` + canvas painter, Appearance `<select>`, E2E with `data-testid` + screenshot under `magazine-layouts-*` or similar.  
4. **Config migration** — `JsonConfigStoreAdapter.get()` with dirty write-back (see Clickbait Instant → Fade).

## Related docs

- `docs/scaffolding/functional_spec.md` — product requirements  
- `docs/scaffolding/technical_spec.md` — detailed technical spec  

When in doubt, prefer **small diffs**, **match existing adapter/UI patterns**, and **pair renderer + canvas** for anything visible on the wallpaper.
