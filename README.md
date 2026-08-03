# Murmur 🌊

> *The world's noise, distilled into one quiet sentence. Every hour. On your desktop.*

Murmur is a desktop app for **Windows and macOS** that fetches RSS headlines from a curated list of news sources, synthesizes them through Google Gemini AI, and renders the resulting poetic phrase as your wallpaper.

## Download

Install the latest build from **[GitHub Releases](https://github.com/mbaiges/murmur/releases)**.

| Platform | Install | Updates |
|----------|---------|---------|
| **Windows** | Run the `.exe` installer (use *More info → Run anyway* if SmartScreen warns) | In-app, via Settings → General |
| **macOS** | Open the `.dmg`, drag Murmur to Applications; first launch: *right-click → Open* | Download a new `.dmg` from Releases when a update is available |

Unsigned builds (no paid Apple/Windows certificates). See [unsigned releases](docs/features/app-auto-update/unsigned-releases.md) for maintainers.

## Status

🚧 Active development.

## Docs

- [docs/scaffolding/functional_spec.md](docs/scaffolding/functional_spec.md) — Functional Specification (v0.1, Draft)
- [docs/scaffolding/technical_spec.md](docs/scaffolding/technical_spec.md) — Technical Specification (Pending)

## Architecture

Murmur follows a clean ports & adapters (hexagonal) architecture with dependency injection.
See the Technical Specification for details once approved.

## License

[BSD 3-Clause](LICENSE) — permissive use with attribution; names may not be used to endorse derived products without permission.
