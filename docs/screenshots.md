# README screenshots

Committed visuals live in [`assets/screenshots/`](../assets/screenshots/). The [README](../README.md) and [user/configuration.md](user/configuration.md) reference these files with **stable names**—rename only with a repo-wide search.

## Capture (automated)

From a clean build:

```bash
npm run docs:screenshots
```

This runs Playwright spec [`tests/e2e/readme-docs-screenshots.spec.ts`](../tests/e2e/readme-docs-screenshots.spec.ts), then [`scripts/optimize-docs-screenshots.mjs`](../scripts/optimize-docs-screenshots.mjs) (macOS: scales `hero-wallpaper.png` to max 1440px; no-op on other platforms—resize manually if needed).

The spec (1280×800 viewport, cropped wizard card, full settings chrome without scroll padding):

1. Uses `MURMUR_E2E` stubs (no live Gemini or RSS)
2. Writes PNGs directly into `assets/screenshots/`
3. **`setup-wizard.png`** — wizard card only (no letterboxing)
4. **`settings-*.png`** — entire settings window chrome (sidebar + content), not full-page document height

| File | Content |
|------|---------|
| `setup-wizard.png` | First-run wizard (empty key field) |
| `settings-general.png` | General tab |
| `settings-news.png` | News sources |
| `settings-voice.png` | Voice & prompts |
| `settings-style-moods.png` | Style / moods |
| `settings-history.png` | History |
| `hero-wallpaper.png` | Wallpaper overlay window after Zen Study + **Refresh Now** (E2E stub phrase; not a full-desktop photo) |

Logo for the README header: [`assets/logo.png`](../assets/logo.png) (from `resources/icon.png` when refreshed manually).

## When to refresh

- Settings IA or copy changes materially
- Default mood cards or wallpaper layout changes
- Before a major release if marketing screenshots look stale

## Guidelines

- Do not commit real API keys (E2E uses `test-api-key`)
- Prefer PNG for UI; re-export or compress large hero captures when possible (README loads faster under ~500 KB)
- Use descriptive alt text in Markdown when adding new images
- In-loop E2E screenshots for features remain under `tests/e2e/artifacts/` (gitignored); only promote curated shots here

## Manual hero (optional)

For a marketing-style full-desktop photo, capture outside E2E and replace `hero-wallpaper.png`, or add a second asset (e.g. `hero-wallpaper-desktop.jpg`) and update the README.
