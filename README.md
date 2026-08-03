# Murmur

<div align="center">

<img src="assets/logo.png" alt="Murmur logo" width="96" height="96" />

*The world's noise, distilled into one quiet sentence. On a schedule. On your desktop.*

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/mbaiges/murmur?style=flat-square)](https://github.com/mbaiges/murmur/releases)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS-lightgrey?style=flat-square)](#download)

<br />

<img src="assets/screenshots/hero-wallpaper.png" alt="Murmur wallpaper overlay showing a generated phrase (Zen Study mood)" width="720" />

</div>

**Murmur** is a desktop app for **Windows and macOS** that reads RSS headlines from feeds you choose, synthesizes them with **Google Gemini**, and shows the result as living wallpaper—refreshed on a schedule, controlled from the **menu bar / system tray**.

## What it does

- Pulls titles from your RSS feeds on an interval you choose (15 minutes to 24 hours; default is hourly)
- Generates a short phrase (plain or layout-aware “magazine” styles) via Gemini
- Renders on one or more displays with moods, fonts, themes, and animations
- Runs in the **menu bar** (macOS) or **system tray** (Windows) with a settings window for feeds, voice, style, and history
- Keeps phrase **history** locally per display

## Quick start (after install)

1. Install from [GitHub Releases](https://github.com/mbaiges/murmur/releases) (see [Getting started](docs/user/getting-started.md) for SmartScreen / Gatekeeper steps).
2. On first launch, complete the **setup wizard**: [Gemini API key](https://aistudio.google.com/apikey) and at least one RSS URL.
3. Click **Start Murmur**—Settings opens on **General** with a short hint to try **Style**; Murmur also runs from the **menu bar / system tray**.
4. Pick a look under **Style**, click **Apply changes** if prompted, then **Refresh Now** in the sidebar to generate your first phrase.

<p align="center">
  <img src="assets/screenshots/setup-wizard.png" alt="First-time setup wizard for API key and RSS feed" width="420" />
</p>

## Download

| Platform | Install | Updates |
|----------|---------|---------|
| **Windows** | Run the `.exe` installer (*More info → Run anyway* if SmartScreen warns) | **Release builds only:** download in background; **Restart to update** in **Settings → General** |
| **macOS** | Open the `.dmg`, drag Murmur to Applications; first launch: *right-click → Open* | **Release builds only:** **Check for updates** / **Download from GitHub** in **Settings → General**, then replace the app from a new `.dmg` |

Builds are **unsigned** (no paid Apple/Windows certificates). Details: [unsigned releases](docs/features/app-auto-update/unsigned-releases.md).

**Requirements:** **Windows or macOS** (Linux is not supported in v1), network access, and your own **Google Gemini API key** (stored locally on your machine).

## Configuration

Settings are grouped by task:

| Tab | Purpose |
|-----|---------|
| **General** | API key, refresh interval, launch at login, **App updates** (version, check, install) |
| **News sources** | RSS feed URLs |
| **Voice & prompts** | Presets, tone, language, system prompt |
| **Style** | Aesthetic moods and appearance |
| **History** | Past phrases per display |

See [Configuration guide](docs/user/configuration.md) and the screenshots below.

<p align="center">
  <img src="assets/screenshots/settings-general.png" alt="Murmur Settings — General tab" width="640" />
  &nbsp;
  <img src="assets/screenshots/settings-style-moods.png" alt="Murmur Settings — Style moods" width="640" />
</p>

## Documentation

- [Documentation index](docs/README.md)
- [Getting started](docs/user/getting-started.md) — install, first run, updates, privacy
- [Configuration](docs/user/configuration.md) — tabs, displays, moods
- [Architecture](docs/architecture.md) — for contributors (layout, tests, IPC)
- [Support](SUPPORT.md) — help and bug reports

Product and engineering specs live under [`docs/features/`](docs/features/) (spec-driven development).

## Development

Requires **Node.js 20** and npm.

```bash
git clone https://github.com/mbaiges/murmur.git
cd murmur
npm ci
npm run dev
```

Run tests: `npm run lint`, `npm run test:unit`, and `npm run build && env -u ELECTRON_RUN_AS_NODE npm run test:e2e`. See [CONTRIBUTING.md](CONTRIBUTING.md).

Refresh README screenshots: `npm run docs:screenshots`.

## Status

Active development.

## License

[BSD 3-Clause](LICENSE) — permissive use with attribution; names may not be used to endorse derived products without permission.
