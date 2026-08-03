# Contributing to Murmur

Thanks for your interest in Murmur. This project is a desktop Electron app with a hexagonal core and spec-driven features under `docs/features/`.

## Prerequisites

- **Node.js 20** (matches [Release workflow](.github/workflows/release.yml))
- **npm**
- Platform tools to build native modules (**canvas**, **sharp**) if `npm ci` fails on your OS

## Local setup

```bash
git clone https://github.com/mbaiges/murmur.git
cd murmur
npm ci
npm run dev
```

`npm run dev` starts electron-vite with watch. If the app misbehaves in an embedded terminal, unset `ELECTRON_RUN_AS_NODE` (see [architecture.md](docs/architecture.md)).

Do **not** commit real Gemini API keys. Use the setup wizard or local user config only.

## Quality gates

Before opening a pull request:

```bash
npm run lint
npm run test:unit
```

For UI or integration changes, run targeted E2E (build first):

```bash
npm run build
env -u ELECTRON_RUN_AS_NODE npm run test:e2e:repo-restructure
```

Other feature groups are listed in `package.json` under `test:e2e:*`. Full suite:

```bash
env -u ELECTRON_RUN_AS_NODE npm run test:e2e
```

E2E uses isolated user data and `MURMUR_E2E` stubs unless a spec explicitly tests live Gemini. In-app auto-update is disabled for unpackaged and E2E runs (`shouldEnableAppUpdate` in `@shared/app-update`).

## Architecture expectations

Read [docs/architecture.md](docs/architecture.md) before structural changes:

- Domain in `src/core/`; Electron IO in `src/main/infrastructure/`
- Renderer and preload must not import `@core/ports` or `@main/**` (enforced by ESLint)
- Wallpaper-visible changes need parity in `WallpaperView` and the canvas painter
- New IPC: extend `src/shared/ipc-contract.ts`, handlers, and preload `window.api`

## Spec-driven features

Non-trivial product behavior should have (or update) specs in `docs/features/<feature>/`:

- `functional-spec.md` — acceptance criteria
- `technical-spec.md` — engineering design

See [docs/agent-skills-setup.md](docs/agent-skills-setup.md) for optional agent skills used in this repo.

## Pull requests

1. Branch from `main` with a focused change.
2. Describe **what** and **why**; link issues if applicable.
3. Note tests run in the PR description.
4. Update user docs (`README.md`, `docs/user/`) when install or settings behavior changes.
5. After visible Settings or wallpaper UI changes, run `npm run docs:screenshots` and commit updated files under `assets/screenshots/` if appropriate.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.
