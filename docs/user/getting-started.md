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
4. Click **Start Murmur**. The settings window may show a short hint to explore **Style**; the app also appears in the **system tray**.

Open **Settings** anytime from the tray menu to change feeds, voice, appearance, or refresh interval.

## Staying up to date

| Platform | Behavior |
|----------|----------|
| **Windows** | **Settings → General** checks GitHub for stable releases. When an update is downloaded, restart when prompted. |
| **macOS** | **Settings → General** checks for newer releases. Download the new `.dmg` from the link or Releases page and replace the app (no silent in-app install while builds are unsigned). |

## Where data lives

Murmur stores configuration and history under the app’s user data directory (Electron `userData`), including:

- `murmur.config.json` — settings and your Gemini API key
- `murmur.history.json` — recent phrases per display

Headlines are fetched from URLs you configure. Text sent to **Google Gemini** for generation is subject to [Google’s terms](https://ai.google.dev/gemini-api/terms) for your API key.

Murmur does not operate a Murmur-owned cloud service in v1; network use is RSS + Gemini from your machine.

## Troubleshooting

| Symptom | Things to check |
|---------|-----------------|
| “Refresh failed” toast | API key valid, internet up, Gemini quota |
| Empty or stale wallpaper | **Refresh Now** in Settings; feeds reachable; display enabled in config |
| SmartScreen / Gatekeeper blocks install | Expected for unsigned builds; follow platform steps above |

Report bugs via [GitHub Issues](https://github.com/mbaiges/murmur/issues). Security concerns: [SECURITY.md](../../SECURITY.md).

## Build from source

For contributors, see [CONTRIBUTING.md](../../CONTRIBUTING.md). End users should prefer **Releases** installers.
