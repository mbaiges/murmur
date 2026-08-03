# Unsigned releases (free)

You can ship Murmur **without paying Apple or a Windows CA**. GitHub (public repo), GitHub Actions, and GitHub Releases are free for open source. Murmur’s **Release** workflow builds **unsigned** installers when signing secrets are **not** set.

Paid signing is optional later — see [signing-setup.md](./signing-setup.md).

## What “free” gives you

| Piece | Cost | Works? |
|-------|------|--------|
| CI build + GitHub Release | $0 | Yes |
| Windows installer + `latest.yml` | $0 | Yes |
| **In-app auto-update on Windows** | $0 | Yes (unsigned; Settings → General) |
| macOS DMG + zip on Releases | $0 | Yes |
| **Mac in-app install of updates** | $0 | **No** — the app checks GitHub and prompts you to download the `.dmg` |
| Mac/Windows “trusted publisher” UX | $0 | **No** — OS warnings are expected |

Apple does **not** offer a free way to notarize apps for arbitrary downloaders. There is no workaround that feels like a normal App Store app without the Developer Program ($99/year). You can still distribute for free; users just jump through security prompts.

---

## Release process (maintainer)

Same as the [release runbook](./release-runbook.md):

1. Bump `version` in `package.json`.
2. Commit and push `main`.
3. Tag and push: `git tag v0.1.1 && git push origin v0.1.1`.
4. Wait for **Actions → Release** (mac + windows jobs).
5. Check **GitHub Releases**: installers + `latest.yml` / `latest-mac.yml`.

**Do not** add signing secrets in GitHub if you want unsigned builds.

---

## What to tell your users

### Windows

1. Download the `.exe` from [Releases](https://github.com/mbaiges/murmur/releases).
2. If SmartScreen says “Windows protected your PC”, click **More info** → **Run anyway**.
3. Updates: the app should download and install new versions from GitHub (Settings → General).

### macOS

1. Download the `.dmg` from Releases.
2. First open: **right-click Murmur → Open** (or **System Settings → Privacy & Security → Open Anyway**).
3. Updates: Settings → General **checks GitHub** and shows **Download from GitHub** when a newer release exists — install by replacing the app from the new `.dmg` (no in-app auto-install on Mac while builds are unsigned).

Add a short **Installing** section to the README when you go public.

---

## Honest recommendation

- **Windows-first audience, $0 budget:** unsigned GitHub Releases + in-app update on Windows.
- **Mac users:** same Releases page; the app notifies when a newer tag is published but installation stays manual until Apple signing.

---

## Upgrade path

When you can pay for certificates, add the secrets from [signing-setup.md](./signing-setup.md). The **same** workflow automatically switches to signed + notarized (Mac) / Authenticode (Windows) on the next tag — no workflow fork needed.

Signed macOS builds use hardened runtime + notarization flags in CI when `MACOS_CERTIFICATE_BASE64` is present.
