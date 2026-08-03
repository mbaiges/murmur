# Functional Spec: In-app auto-update

| Field | Value |
|-------|-------|
| Status | **Locked** (2026-08-02) |
| Author | Murmur product |
| Created | 2026-08-02 |
| Updated | 2026-08-02 (tray/OS notify on download; latest-stable only) |
| Feature folder | `docs/features/app-auto-update/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [architecture.md](../../architecture.md) (packaging / dist) |

## Summary

Users who install Murmur from a **release build** should receive **new stable versions** without manually finding installers. The app **checks for updates in the background**, **downloads** when a newer release exists, and asks the user to **restart when ready**. If automatic update fails, the user can still install from the **public release page**.

## Background & Problem

Murmur ships as a desktop app (Windows and macOS) from a **public repository**. Today, staying current means noticing a new release and re-running an installer. That friction delays bug fixes and makes support harder (“which version are you on?”). As the app reaches more users, predictable **stable releases** and **in-app update awareness** become part of the product contract.

## Goals

1. **Stay current** — Windows and macOS installed users can move to the latest **stable** release with minimal effort.
2. **Unobtrusive checks** — The app checks for updates **after startup (short delay)** and **periodically** while running, without blocking wallpaper or settings work.
3. **Clear status** — **Settings → General** shows app version, update state, progress when downloading, and actions to check manually or restart to install.
4. **Timely awareness** — When a download completes, the user gets a **platform-appropriate notification** (tray/OS) in addition to Settings status, without forcing restart.
5. **Trustworthy releases** — Each stable release is published with **installable artifacts** on the project’s GitHub Releases page (maintainer process; see technical spec for CI).

## Non-goals (v1)

- Beta or pre-release **channels** (stable only).
- **Linux** in-app auto-update.
- **Forced restart** for routine updates (a future **critical security** policy may override; not v1).
- Private update hosting or custom CDN.
- **Downgrade** to an older version via the app.
- In-app **release notes** reader or changelog UI.

## Terminology

| Term | Meaning |
|------|---------|
| Release build | Packaged, installed Murmur (not dev/e2e from source). |
| Stable release | A semver-tagged public release (e.g. `v0.2.0`) marked as a full release, not pre-release. |
| Update check | Compare installed version to latest stable release on the feed. |
| Ready to install | New version fully downloaded and verified; user must restart to apply. |
| Update notification | Short, non-modal alert that a restart is available (wording and chrome differ by OS). |
| Manual fallback | User downloads installer from GitHub Releases in a browser. |

## Actors

| Actor | Capabilities |
|-------|--------------|
| End user | Runs Murmur; views update status; checks manually; restarts when ready; defers restart. |
| Maintainer | Creates semver stable releases with platform installers; documents signing expectations for auto-update on macOS. |

## Availability Rules

- In-app update behavior applies only to **release builds** on **Windows and macOS**.
- **Development**, **unpackaged**, and **automated test (E2E)** runs must **not** contact the update feed (no flaky tests, no surprise downloads in dev).

## Screens & Information Architecture

| Surface | Content |
|---------|---------|
| Settings → General → **App updates** | Current version; status text; download progress when applicable; **Check for updates**; **Restart to update** when ready; link to **Manual download** (releases page). |
| **Tray / OS notification** | When download completes: brief notice that an update is ready and restart is required to install (platform-native presentation). |

## User Journeys

### Journey A — Background update (happy path)

1. User runs an installed Murmur build.
2. After a short delay, the app checks for a newer stable release; one exists.
3. Download runs in the background; General shows progress.
4. When complete, General shows **Restart to update** and the target version; user receives an **update notification** appropriate to their OS.
5. User chooses restart or dismisses the notification and continues working; Murmur applies the update only after user-initiated restart (including normal **wallpaper restore on quit** before relaunch).

### Journey B — Already up to date

1. A check runs; no newer stable release.
2. General indicates the app is up to date (or last check succeeded); no restart prompt.

### Journey C — Manual check

1. User opens Settings → General and taps **Check for updates**.
2. UI shows checking, then the same outcomes as Journey A or B.

### Journey D — Offline or feed error

1. Check or download fails (network, missing release, platform not supported).
2. User sees a **non-blocking** error in General; Murmur keeps running.
3. User can retry or use **Manual download**.

### Journey E — User defers restart

1. Download completes; user ignores **Restart to update**.
2. App continues on the current version until the user restarts or quits normally.

### Journey F — Dev / E2E / unpackaged

1. No automatic checks; General explains updates apply to installed builds only (or equivalent).
2. E2E and local dev are unaffected by network update traffic.

### Journey G — Notification after download

1. User is not on the Settings window when download completes.
2. A **platform-appropriate notification** appears (tray balloon, notification center, or equivalent).
3. Activating the notification opens Settings (General) or focuses Murmur so the user can **Restart to update**; dismissing does not install the update.

## Edge Cases

| Case | Expected behavior |
|------|-------------------|
| Quit from tray (no pending install) | Existing quit flow (e.g. wallpaper restore) unchanged. |
| Restart to update | Same pre-quit responsibilities as normal quit, then apply update and relaunch. |
| macOS build not properly signed | OS may block seamless auto-update; **Manual download** remains documented for users. |
| First install | No “update from nothing”; only forward updates to newer stable releases. |
| User on older stable while multiple releases exist | App targets **latest** stable only (single hop). |
| OS denies notification permission | Settings still shows **Restart to update**; no crash or repeated spam |

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| Support asks “how do I update?” decrease | Self-serve path works |
| Users on current stable within N days of release | Background checks + restart prompt effective |
| Failed update reports rare vs manual fallback usage | Feed and UX are reliable |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Update source | **GitHub Releases** (public repo), stable tags only |
| 2 | Channels | **Stable only** (semver tags, e.g. `v0.2.0`) |
| 3 | Check policy | **Startup (delayed)** + **periodic** background checks |
| 4 | Download | **Automatic** when a newer stable release is available |
| 5 | Install moment | **User-initiated restart** when download is complete |
| 6 | Manual fallback | Link to GitHub Releases from General |
| 7 | Awareness surfaces | **Settings → General** + **platform notification** when download completes |
| 8 | Notification model | **Per-OS adapter** (same port/adapter style as other Murmur platform concerns); no single UI implementation shared across Windows and macOS |
| 9 | Version target | Always **latest stable** release (skip intermediate versions) |
| 10 | Platforms | **Windows + macOS** in-app; Linux out of scope v1 |

## Acceptance Criteria

1. General shows the **installed app version** for release builds.
2. Release builds perform an automatic update **check after startup** without freezing the UI.
3. Release builds perform **periodic** checks while running (exact interval in technical spec).
4. When a newer **stable** GitHub Release exists, the app **downloads** it and General shows **Restart to update** with the target version.
5. When download completes, a **platform-appropriate notification** is shown once per ready update (unless OS blocks notifications).
6. After the user restarts to install, General shows the **new version** matching that release.
7. **Check for updates** in General triggers an immediate check and updates status.
8. **Manual download** opens the public releases page in the system browser.
9. Dev, unpackaged, and E2E modes **do not** perform update feed requests or show production notifications.
10. For each stable tag, maintainers publish **Windows and macOS install artifacts** on GitHub Releases suitable for install and update (packaging detail in technical spec).
11. Documentation states that **signed/notarized macOS** (and signed Windows) builds are required for a smooth auto-update experience in production.
12. With releases `v0.1.2` and `v0.2.0` available, a user on `v0.1.0` is offered **`v0.2.0`** (latest stable), not intermediate versions only.

## Out-of-Scope Follow-ups (post-v1)

- Release notes / “What’s new” in Settings
- Staged rollout (percentage of users)
- Beta channel opt-in
- Linux auto-update

## Engineering pointer

Implementation (library choice, CI workflow, IPC, signing secrets) belongs in [technical-spec.md](./technical-spec.md).
