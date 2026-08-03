# E2E (Playwright + Electron)

## Why tests feel “stuck”

1. **Missing locators** — Playwright waits up to **`actionTimeout`** (15s in `playwright.config.ts`) per click/fill/`selectOption`. Old specs used `select.nth(4)` after UI refactors; each miss cost ~30s before we lowered the timeout.
2. **One worker** — `workers: 1` and `fullyParallel: false` run ~35 tests back-to-back (~4–6 min total). That is expected, not a hang.
3. **`describe.serial`** — One failure skips later tests in the same file (“did not run”) but you still pay for timeouts in the failing test.
4. **Live phrase capture** — `magazine-layouts-live-phrase` can call Gemini once if the fixture is missing (`ensureCapturedPhraseFixture`). Reuse `tests/e2e/fixtures/captured-phrase.json`; avoid `MURMUR_RECAPTURE_PHRASE=1` unless you mean it.

Prefer **`data-testid`** helpers in `tests/e2e/helpers/styleSettings.ts` and `settingsFlow.ts` over `nth()` selectors.

## Run only what you need

Full suite:

```bash
npm run build && npm run test:e2e
```

Feature / group scripts (see root `package.json`):

```bash
npm run test:e2e:app-auto-update
npm run test:e2e:style-voice-settings-polish
npm run test:e2e:magazine-layouts
npm run test:e2e:presets
npm run test:e2e:clickbait
npm run test:e2e:layout-regression   # formerly flaky layout-related specs
```

Single file or test:

```bash
npx playwright test tests/e2e/magazine-layouts-live-phrase.spec.ts
npx playwright test tests/e2e/presets.spec.ts -g "Custom Apply"
```

UI mode (debug one test):

```bash
npm run test:e2e:ui
```

## Update feed (product note)

In-app update checks use **`electron-updater`** + **`electron-builder`** GitHub publish config — not a custom URL in app code. At runtime the packaged app reads embedded **`app-update.yml`** (owner/repo from build). Checks call GitHub Releases for **`latest.yml`** / **`latest-mac.yml`** and compare semver to `app.getVersion()`. Periodic checks: **30s** after startup, then every **4 hours** via `setInterval` in `createAppUpdater.ts` (dev/E2E disabled).
