# Release runbook: Murmur desktop

For maintainers publishing versions consumed by in-app auto-update. Product context: [functional-spec.md](./functional-spec.md).

## Prerequisites

- `package.json` `version` matches the git tag (without `v` prefix).
- Repo secrets configured for production builds (see below).
- macOS builds must be **signed and notarized** for reliable auto-update on Mac.

## Publish a stable release

1. Update `version` in `package.json` (semver, e.g. `0.2.0`).
2. Commit on `main` (or your release branch).
3. Create and push an annotated tag: `git tag v0.2.0 && git push origin v0.2.0`.
4. GitHub Actions **Release** workflow builds macOS + Windows and runs `electron-builder --publish always`.
5. On GitHub, open the new Release:
   - Confirm artifacts: Windows NSIS installer, macOS DMG + **zip**, and update metadata (`latest.yml`, `latest-mac.yml`).
   - Mark as **latest** stable (not pre-release).

## Local publish (optional)

```bash
GH_TOKEN=<personal access token with repo scope> npm run dist -- --publish always
```

## Signing secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `GH_TOKEN` | Provided automatically as `GITHUB_TOKEN` in workflow |
| `CSC_LINK` | Base64-encoded certificate (Windows Authenticode; optional mac cert) |
| `CSC_KEY_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Team ID |

Unsigned artifacts are useful for CI smoke tests; end-user auto-update on macOS requires notarized builds.

## Verify auto-update (manual)

1. Install the previous stable release on a VM or test machine.
2. Publish the new tag and wait for CI.
3. Launch Murmur; wait for background check (or use **Check for updates** in Settings → General).
4. Confirm download completes, notification appears (if OS allows), and **Restart to update** installs the new version.
5. Confirm General shows the new version string.

## Version targeting

The app always offers the **latest stable** GitHub Release (not intermediate versions). Pre-releases are ignored (`allowPrerelease: false`).
