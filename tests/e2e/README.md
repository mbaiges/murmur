# E2E tests

Playwright specs live in this directory. See **[docs/architecture.md](../../docs/architecture.md)** for:

- E2E stub mode (`MURMUR_E2E`)
- Screenshot path convention: `artifacts/screenshots/{test-case-slug}/`
- Helpers in `helpers/`

Run (after build):

```bash
env -u ELECTRON_RUN_AS_NODE npm run test:e2e
```

### Live phrase for layout screenshots (one Gemini call)

To screenshot magazine layouts with a **real** phrase from your feeds/API key:

```bash
npm run build
env -u ELECTRON_RUN_AS_NODE npx playwright test tests/e2e/magazine-layouts-live-phrase.spec.ts
```

- First run (or `MURMUR_RECAPTURE_PHRASE=1`) launches the **real** app once, clicks **Refresh Now** (single Gemini generation), and saves `tests/e2e/fixtures/captured-phrase.json` (gitignored).
- Subsequent layout tests use **E2E stubs** that return that fixed phrase; **`MURMUR_E2E_REUSE_CAPTURED_PHRASE=true`** skips re-generation when only `layoutStyle` changes.

Screenshots: `tests/e2e/artifacts/screenshots/magazine-layouts-live-phrase-*/wallpaper.png`

Artifacts under `artifacts/` are gitignored.
