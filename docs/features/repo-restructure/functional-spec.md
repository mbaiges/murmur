# Functional Spec: Murmur repository restructure (all-desktop)

| Field | Value |
|-------|-------|
| Status | **Locked** (approved 2026-08-02) |
| Author | Murmur product |
| Created | 2026-08-02 |
| Updated | 2026-08-02 (expanded scope) |
| Feature folder | `docs/features/repo-restructure/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [architecture](../../architecture.md), [structured phrase generation](../structured-phrase-generation/functional-spec.md) |

## Summary

Reorganize the Murmur **single installable Electron desktop app** so the codebase matches industry Electron and hexagonal practices: a portable **core** (domain, ports, pure libraries), a **main process shell** (bootstrap, IPC, windows, infrastructure adapters), and a **feature-oriented renderer**—without changing end-user product behavior, install flow, or data on disk.

The app remains **all-in-one** (one process for product logic at ship time). There is **no** bundled local HTTP API, **no** monorepo `apps/` + `packages/` split, and **no** separate Rust/Node API in the installer for v1.

## Goals

1. **Maintainability** — New contributors can find domain logic, platform IO, IPC, and UI in predictable places; the main entry file is an orchestrator, not a god file.
2. **Security-aligned boundaries** — Renderer and preload follow Electron guidance: narrow preload API, no access to infrastructure adapters or main-only modules.
3. **Preserve hexagonal intent** — Business orchestration and **ports** stay framework-free in core; Electron, filesystem, Gemini, canvas, and OS wallpaper code live in main **infrastructure** only.
4. **Zero product regression** — Same tray/settings/wallpaper behavior, config/history file locations, IPC surface exposed as `window.api`, and E2E stub semantics after refactor.
5. **Testability unchanged or improved** — Existing unit, integration, and E2E suites remain the arbiter of correctness; no reduction in coverage as a trade for structure.
6. **Documentation truth** — [architecture.md](../../architecture.md) is **fully rewritten** as the canonical guide for future features (tree, boundaries, checklists, wallpaper backup, tests, assets).
7. **Internal granularity** — Split oversized modules (`App.tsx`, `types.ts`, flat `core/lib`) into navigable subfolders/files without behavior change.
8. **Test layout mirrors `src/`** — Unit tests live under paths that mirror production code (`tests/unit/core/…`, `tests/unit/main/infrastructure/…`) for scalability.
9. **Dead code hygiene** — Remove unused abstractions (e.g. orphan ports) and placeholder tests; document real backup/restore behavior on the correct port.

## Non-goals (v1)

- Splitting the repo into `apps/desktop` + `apps/api` or adding `packages/` workspaces.
- Shipping or spawning a local API sidecar; optional **remote** cloud API remains a future product decision.
- Rewriting `MurmurService` behavior, layout/structured phrase product rules, or Gemini/RSS business rules beyond import path moves.
- Introducing a DI container (NestJS, tsyringe, etc.) in the desktop app.
- tRPC or a new IPC transport (keep `ipcMain.handle` / `invoke`; centralize **contracts** only).
- Mobile, web client, or multi-user backend.

## Background & Problem

Murmur already documents hexagonal layering (`domain`, `ports`, `adapters`, `main`, `renderer`), but **adapters and domain sit beside each other at `src/`**, the **main process entry mixes** window lifecycle, IPC, E2E wiring, and composition, and **build aliases expose `@adapters` to the renderer** even though only main should use infrastructure. As features grow, this increases accidental coupling and makes refactors riskier. The team wants a **planned, test-gated restructure** aligned with electron-vite conventions and maintainers’ hybrid model (core + main infrastructure + feature UI).

## Terminology

| Term | Meaning |
|------|---------|
| Core | Process-agnostic business logic: domain entities/services, port interfaces, pure libraries (prompt/layout/phrase helpers). No Electron, Node `fs`, or native modules in domain services. |
| Infrastructure | Main-only adapters implementing ports (config JSON, Gemini, RSS, canvas painter, wallpaper OS, tray, startup). |
| Bootstrap / composition root | Main-only module that constructs adapters and `MurmurService` (manual dependency injection). |
| IPC contract | Shared channel names (and optional payload type re-exports) safe for preload + main; lives in `src/shared/ipc-contract.ts` — not domain logic. |
| Entrypoint (desktop) | IPC handler in main that validates input and delegates to `MurmurService` or stores—not an HTTP route. |
| Feature folder (renderer) | UI module grouping (`settings`, `wallpaper`, `moods`) with colocated components, hooks, and sub-tabs. |
| Wallpaper backup / restore | Product behavior: save user’s OS wallpaper on startup, restore on quit. Implemented via **`IWallpaperRenderer.backup()` / `restore()`** on platform adapters—not a separate unused port. |
| `IWallpaperRenderer` | Port for OS wallpaper IO **including** backup/restore (Mac/Win adapters + main lifecycle calls). |

## Actors

| Actor | Capabilities |
|-------|----------------|
| Desktop user | Uses Murmur as today; does not install or run extra services. |
| Maintainer / developer | Navigates core vs main vs renderer; extends features without breaking process boundaries. |
| CI / agent | Runs unit, integration, and E2E commands; ESLint enforces import boundaries. |

## Availability Rules

- Restructure applies to **all platforms** Murmur supports (macOS, Windows); platform adapters remain under main infrastructure.
- **Offline/local-first** unchanged: config and history under `userData`; no new network dependency introduced by this project.
- **E2E mode** (`MURMUR_E2E`, fixtures, live phrase capture rules) behaves identically after refactor; only internal file paths and module names change.

## User Journeys

### Journey A — End user after upgrade (no visible change)

1. User installs or updates Murmur and launches from Dock/taskbar/tray.
2. Settings, moods, appearance, refresh, and wallpaper overlays behave as before.
3. Existing `murmur.config.json` and `murmur.history.json` load without migration beyond current adapter logic.

### Journey B — Maintainer adds a new port adapter

1. Developer adds or extends a port in `core/ports`.
2. Implements adapter under `main/infrastructure/…`.
3. Registers implementation only in `main/bootstrap/composition-root` (not in renderer).
4. Unit tests live under **`tests/unit/…`** paths mirroring `src/…` (e.g. `tests/unit/core/domain/MurmurService.test.ts`).

### Journey C — Maintainer extends Settings UI

1. Developer works under `renderer/features/settings/` (or sibling feature folder).
2. UI calls only `window.api` / typed preload surface—never imports infrastructure.
3. ESLint passes; E2E settings flows still pass.

### Journey D — Blocked: renderer imports infrastructure (error path)

1. Developer accidentally imports `main/infrastructure` or `@main` from renderer or preload code.
2. **ESLint fails** on `npm run lint`; change is not merged until fixed.

## Screens & Information Architecture

**No user-facing IA change.** All product surfaces (Settings dashboard, wallpaper view, tray, wizard) remain the same routes and URLs (`?view=wallpaper&monitorId=…`). This project is internal structure only.

## Edge Cases

| Case | Expected behavior |
|------|-------------------|
| Import path updates break tests | Fix imports; tests must pass before complete. |
| Preload imports heavy main module | Preload may import **types and IPC constants from core/shared contract only**—not infrastructure. |
| Dual renderer + canvas layout parity | Any moved shared pure logic stays in `core/lib`; wallpaper CSS and canvas painter both import from core as today. |
| Clickbait live E2E (non-stub) | Still skipped on CI/non-macOS; unaffected by folder names. |
| Hot reload in dev | `npm run dev` still launches; main/preload/renderer rebuild behavior unchanged in outcome. |
| User quits app (real quit) | OS wallpaper **restored** as today via `wallpaperRenderer.restore()` on quit; dev hot-reload skip rules unchanged. |
| Orphan `IWallpaperBackup` port | Removed from codebase; backup/restore documented only on **`IWallpaperRenderer`**. |

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| Full unit + integration + E2E green | Proves no behavioral regression |
| Main entry file below ~100 lines of orchestration | God-file split succeeded |
| Zero renderer imports of infrastructure (lint) | Security/architecture boundary held |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Deployable shape | **Single all-desktop Electron app**; one user-facing install. |
| 2 | Monorepo | **No** `apps/` / `packages/` in v1; everything under existing repo root and `src/`. |
| 3 | API / sidecar | **Out of scope** for ship path; no bundled local API. |
| 4 | Core layout | Introduce **`src/core/`** with `domain/`, `ports/`, `lib/` (today’s `shared/` pure code moves to `lib/`). |
| 5 | Adapters | Move to **`src/main/infrastructure/`** (main-only). |
| 6 | Main shell | Split **`bootstrap/`**, **`ipc/`**, **`windows/`**; thin `main/index.ts`. |
| 7 | IPC | Central **`ipc` contract** (channel constants + shared payload types); handlers in `main/ipc/`. |
| 8 | Renderer | **Full feature refactor**: `features/settings`, `features/wallpaper`, `features/moods`; thin app shell. |
| 9 | DI | **Manual composition root** in bootstrap; no DI framework. |
| 10 | Process boundaries | **ESLint required**: renderer and preload cannot import main/infrastructure; tighten Vite/tsconfig aliases accordingly. |
| 11 | User-visible behavior | **Must not change** except bugfixes discovered during test failures. |
| 12 | Docs | **Rewrite** **`docs/architecture.md`** end-to-end (see AC-10); mark **`docs/scaffolding/`** as superseded by feature specs. |
| 13 | IPC contract location | **`src/shared/ipc-contract.ts` only** — small process-safe shared layer; domain types stay in `core/domain`. |
| 14 | Pure core/lib | **`core/lib` has no Electron/Node `fs`/native imports**; main-only helpers (e.g. `resolveBrandIcon`) live under `main/lib/`. |
| 15 | Lint script | Root **`npm run lint`** required for completion (AC-12). |
| 16 | Spec status | Locked; expanded scope 2026-08-02. |
| 17 | Granularity | Split **`core/lib`** into subfolders; split **`core/domain/types`** (prompts vs config/layout types); **`features/settings`** into tabs/hooks/components; shared **`renderer/components`** for dumb UI. |
| 18 | E2E-only main code | **`e2eStructuredPhraseStub`** (and related) under **`main/bootstrap/e2e/`** or **`main/e2e/`**, not `core/lib`. |
| 19 | Test mirroring | **`tests/unit/**` mirrors `src/**`**; remove **`placeholder.test.ts`**; update vitest `include` globs. |
| 20 | Wallpaper backup | **Keep behavior**; clarify in docs: **`IWallpaperRenderer`**, adapters, `wallpaper_backup.json` / `userData`; **delete unused `IWallpaperBackup.ts`**. |

## Acceptance Criteria

1. **AC-1 (layout)** — Repository uses `src/core/{domain,ports,lib}`, `src/main/{bootstrap,ipc,windows,infrastructure}`, `src/shared/ipc-contract.ts` (sole file or module under `src/shared/` for IPC constants), `src/preload/`, and `src/renderer/features/{settings,wallpaper,moods}/` with a thin renderer entry shell.
2. **AC-2 (composition)** — All adapter construction and `MurmurService` wiring live in `main/bootstrap/`; `main/index.ts` contains lifecycle, window registration, and IPC registration only (no inline adapter `new` spread across hundreds of lines).
3. **AC-3 (IPC parity)** — Preload exposes the same `window.api` methods and channel names as before refactor (`config:get`, `config:save`, `history:get`, `history:clear`, `action:refresh`, `action:previewTheme`, `state:get`, `state:updated`, `config:updated`).
4. **AC-4 (lint boundaries)** — ESLint `no-restricted-imports` (or equivalent) prevents `src/renderer/**` and `src/preload/**` from importing `src/main/infrastructure/**`, `src/main/bootstrap/**`, and `@main/**`.
5. **AC-5 (aliases)** — At project completion (after alias tightening phase), renderer and preload Vite/tsconfig aliases do **not** expose infrastructure or main-only paths; `@core/**` is available where pure/types are needed.
6. **AC-6 (tests unit)** — `npm run test:unit` passes with no intentional test deletion.
7. **AC-7 (tests integration)** — `npm run test:integration` passes.
8. **AC-8 (tests E2E)** — `npm run test:e2e` passes in the same environments as today (including CI constraints for live Gemini specs).
9. **AC-9 (build)** — `npm run build` produces working `out/main`, `out/preload`, `out/renderer`; packaged app smoke (dev launch) succeeds.
10. **AC-10 (architecture rewrite)** — `docs/architecture.md` is rewritten (not a minimal diff) and includes at minimum: full repo/`src` tree; process boundaries and ESLint rules; path aliases; IPC + preload contract; **wallpaper backup/restore** (`IWallpaperRenderer`, `userData` files, dev vs quit); **`resources/`** vs `renderer/public/` assets; **how to add a feature** (checklist: port → adapter → IPC → UI → dual render → tests); test folder mirroring; links to agent/skills docs. **`docs/scaffolding/`** header notes superseded by `docs/features/`.
11. **AC-11 (data)** — No new config/history file paths or schema migrations introduced by this project alone; **`wallpaper_backup.json`** behavior unchanged.
12. **AC-12 (lint script)** — Root `npm run lint` exists and passes (includes renderer + preload boundary rules from AC-4).
13. **AC-13 (core/lib granularity)** — `src/core/lib/` uses subfolders (e.g. `layout/`, `phrase/`, `presets/`, `generation/`) with no flat dump of all former `shared/*.ts` at one level.
14. **AC-14 (domain granularity)** — Domain types split: at minimum separate modules for **prompt constants** vs **config/state/layout types** (exact filenames in technical spec).
15. **AC-15 (settings UI granularity)** — No single file over ~400 lines in `renderer/features/settings/`; wizard, appearance, history, and shell live in separate modules; **`renderer/components/`** holds cross-feature dumb UI.
16. **AC-16 (test mirroring)** — Every `tests/unit/**/*.test.ts` path mirrors production code under `src/` (e.g. `tests/unit/main/infrastructure/wallpaper/MacDesktopWallpaperAdapter.test.ts`); **`placeholder.test.ts` removed**.
17. **AC-17 (typed preload)** — `renderer/types/window-api.d.ts` (or equivalent) types **`window.api`** from preload surface.
18. **AC-18 (wallpaper port clarity)** — **`IWallpaperBackup.ts` deleted**; [architecture.md](../../architecture.md) documents backup/restore on **`IWallpaperRenderer`**; unit tests for Mac/Win backup behavior remain green.
19. **AC-19 (E2E stub location)** — Main-process E2E stub builders live under **`src/main/e2e/`** (or `bootstrap/e2e/`), not under `core/lib`.

## Out-of-Scope Follow-ups (post-v1)

- pnpm workspaces + Turborepo if a second deployable (cloud API) appears.
- Optional remote API client in desktop config.
- tRPC-over-IPC for stricter typing.
- Native ESLint plugin for cross-package boundaries if the repo becomes a monorepo.
- Per-process `tsconfig.main.json` / `tsconfig.renderer.json` split (optional later).
