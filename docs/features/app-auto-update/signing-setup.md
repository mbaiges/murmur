# Code signing setup (macOS + Windows) — optional

**Default for this project:** unsigned, free releases — see [unsigned-releases.md](./unsigned-releases.md).

Use this guide when you want **trusted publisher** UX and reliable **macOS auto-update**, and you are OK paying Apple (~$99/year) and optionally a Windows code signing CA.

One-time setup so GitHub Actions builds **signed** installers. After secrets are in place, the Release workflow detects them automatically (same tag flow as the [release runbook](./release-runbook.md)).

## What you need (summary)

| Platform | What you buy / create | GitHub secrets |
|----------|----------------------|----------------|
| **macOS** | Apple Developer Program ($99/year) + **Developer ID Application** certificate | `MACOS_CERTIFICATE_BASE64`, `MACOS_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| **Windows** | Code signing cert from a CA (e.g. SSL.com, DigiCert; often ~$200+/year) | `WINDOWS_CERTIFICATE_BASE64`, `WINDOWS_CERTIFICATE_PASSWORD` |

macOS builds also **notarize** with Apple (uses the `APPLE_*` secrets). Without notarization, Gatekeeper blocks many users and in-app updates on Mac are unreliable.

You can finish **macOS first**, publish a Mac release, and add Windows signing later—the workflow checks secrets per job.

---

## Part 1 — Apple Developer Program

1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) (Apple ID, $99/year).
2. After approval, open [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list).
3. Note your **Team ID** (Membership details) — you will store it as `APPLE_TEAM_ID`.

---

## Part 2 — Developer ID certificate (on your Mac)

Do this on a Mac logged into the same Apple ID as the developer account.

1. Open **Keychain Access** → menu **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**.
2. Enter your email, name, **Saved to disk**, continue. You get a `.certSigningRequest` file.
3. In the Apple Developer portal: **Certificates → +** → **Developer ID Application** → upload the CSR → download the `.cer`.
4. Double-click the `.cer` to add it to **login** keychain. You should see **Developer ID Application: Your Name (TEAMID)**.
5. Export for CI:
   - In Keychain Access, expand the certificate, select **both** the cert and its **private key**.
   - Right-click → **Export 2 items…** → format **Personal Information Exchange (.p12)** → set a strong export password (remember it).

---

## Part 3 — macOS GitHub secrets

Repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value |
|-------------|--------|
| `MACOS_CERTIFICATE_BASE64` | Entire `.p12` file as one line of base64 (see command below) |
| `MACOS_CERTIFICATE_PASSWORD` | Password you set when exporting the `.p12` |
| `APPLE_ID` | Apple ID email used for the developer account |
| `APPLE_APP_SPECIFIC_PASSWORD` | [Create at appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-character Team ID from developer membership |

Encode the certificate (run on your Mac, replace path):

```bash
base64 -i ~/Downloads/murmur-developer-id.p12 | pbcopy
```

Paste into `MACOS_CERTIFICATE_BASE64` (no line breaks in the secret value).

**Security:** Treat the `.p12` like a password. Do not commit it. Rotate if leaked.

---

## Part 4 — Windows code signing (for other users on Windows)

Apple certs do **not** sign Windows installers. You need a separate **Authenticode** certificate (`.pfx` / `.p12` from your CA).

1. Purchase an **Extended Validation (EV)** or standard code signing cert from a Microsoft-trusted CA (EV reduces SmartScreen “unknown publisher” time).
2. Complete identity verification with the CA; install or export the cert as **.pfx** with a password.
3. Add GitHub secrets:

| Secret name | Value |
|-------------|--------|
| `WINDOWS_CERTIFICATE_BASE64` | `base64 -i your-cert.pfx` (single line, same idea as Mac) |
| `WINDOWS_CERTIFICATE_PASSWORD` | PFX export password |

Until these exist, the **Windows release job will fail on purpose** with a pointer to this doc. macOS releases can still ship.

---

## Part 5 — Checklist before your next tag

- [ ] All **five** macOS-related secrets set
- [ ] `package.json` `version` matches the tag you will push (e.g. `0.1.1` → `v0.1.1`)
- [ ] Windows secrets set **or** you accept skipping Windows until later (job will fail without them)

Push the tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Open **Actions → Release**. When green:

- GitHub **Releases** should list NSIS (Windows), DMG + **zip** (Mac), plus `latest.yml` / `latest-mac.yml`.
- On a clean Mac, download the DMG, open the app—no “unidentified developer” if signing + notarization succeeded.

---

## Part 6 — Local test (optional, on your Mac)

With the cert in your keychain (not via secrets), you can build without publishing:

```bash
npm ci
npm run dist -- --publish never
```

For a full signed + notarized local build matching CI:

```bash
export CSC_LINK="$(base64 -i path/to/cert.p12)"
export CSC_KEY_PASSWORD="your-p12-password"
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run dist -- --publish never
```

Inspect `dist/` for `.dmg`, `.zip`, and `-mac.zip` update artifact.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `not a file` / empty CSC errors | Empty signing env vars—use the secrets names in this doc; do not set blank `CSC_LINK`. |
| Notarization failed | Wrong app-specific password, wrong Team ID, or cert not **Developer ID Application**. |
| `author is missed` | Fixed in `package.json`; pull latest `main`. |
| Mac job ok, Windows fails | Missing `WINDOWS_*` secrets—expected until you add a Windows cert. |
| Auto-update does not apply on Mac | Release must include **zip** + `latest-mac.yml`; app must be notarized. |

More detail: [electron-builder code signing](https://www.electron.build/code-signing).
