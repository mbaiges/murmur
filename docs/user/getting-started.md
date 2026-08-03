# Getting started

Murmur turns RSS headlines into a short phrase on your desktop wallpaper, refreshed on a schedule. You need a **Google Gemini API key** and at least one **RSS feed URL**.

## Install

Download the latest installer from **[GitHub Releases](https://github.com/mbaiges/murmur/releases)**.

### Windows

1. Download the `.exe` installer from the release assets.
2. If **SmartScreen** shows “Windows protected your PC”, choose **More info** → **Run anyway** (builds are unsigned).
3. Complete the installer; launch Murmur from the Start menu or desktop shortcut.

### macOS

1. Download the `.dmg` from the release assets.
2. Open the disk image and drag **Murmur** to **Applications**.
3. **First launch:** right-click Murmur → **Open**, or use **System Settings → Privacy & Security → Open Anyway**.

Unsigned builds are expected. See [unsigned releases](../features/app-auto-update/unsigned-releases.md) for maintainer context.

## First run

1. Murmur opens the **setup wizard** when no API key is stored yet.
2. Create a key in [Google AI Studio](https://aistudio.google.com/apikey) and paste it into **Gemini API Key** (stored only on your computer).
3. Enter at least one RSS feed URL (a default BBC News feed is provided).
4. Click **Start Murmur**. Settings stays open on **General** and shows a toast nudging you toward **Style**; Murmur is also available from the **menu bar** (macOS) or **system tray** (Windows).

On **later launches** of an installed release (after your API key is saved), Murmur typically starts in the menu bar / tray only—open **Settings** from the menu when you need it. Closing the Settings window does **not** quit the app.

When you **Quit** from the menu, Murmur restores your previous desktop wallpaper (release builds).

## Staying up to date

| Platform | Behavior |
|----------|----------|
| **Windows** | **Installed release builds** check GitHub in the background. **Settings → General → App updates** shows progress; use **Restart to update** when ready. Dev builds from source do not update in-app. |
| **macOS** | **Installed release builds** can **Check for updates** under **App updates**. Use **Download from GitHub** when offered, then replace the app from the new `.dmg` (no silent in-app install while builds are unsigned). |

Automatic checks run after startup (with a short delay) and periodically while the app runs. Only **stable** tagged releases on GitHub are offered—not pre-releases.

## Where data lives

Murmur stores configuration and history in the app user data folder:

| Platform | Typical location |
|----------|------------------|
| **macOS** | `~/Library/Application Support/Murmur/` |
| **Windows** | `%APPDATA%\murmur\` |

Files include:

- `murmur.config.json` — settings and your Gemini API key
- `murmur.history.json` — up to **10** recent phrases per display
- `murmur.log` — main-process log (refresh, wallpaper apply, errors); rotates when large
- `wallpapers/` — last painted PNG per display (check timestamps when debugging)

Headlines are fetched from URLs you configure. **RSS item titles** (and related text sent in the generation prompt) are transmitted to the **Google Gemini API** using your key, subject to [Google’s terms](https://ai.google.dev/gemini-api/terms).

Murmur does not operate a Murmur-owned cloud service in v1; network use is RSS + Gemini from your machine.

## Troubleshooting

| Symptom | Things to check |
|---------|-----------------|
| “Refresh failed” toast | API key valid, internet up, Gemini quota |
| Empty or stale wallpaper | **Refresh Now** in Settings; at least one RSS feed on the selected display; network up; on Windows, see `murmur.log` and confirm `resources\\bin\\WallpaperHelper.exe` exists under the install folder |
| SmartScreen / Gatekeeper blocks install | Expected for unsigned builds; follow platform steps above |

Report bugs via [GitHub Issues](https://github.com/mbaiges/murmur/issues). See also [SUPPORT.md](../../SUPPORT.md). Security concerns: [SECURITY.md](../../SECURITY.md).

## Build from source

For contributors, see [CONTRIBUTING.md](../../CONTRIBUTING.md). End users should prefer **Releases** installers.
