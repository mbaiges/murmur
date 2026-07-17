# Murmur — Functional Specification

> **Version:** 0.3 (Draft)
> **Status:** Awaiting User Approval
> **Date:** 2026-07-17
> **Author:** Product Owner + Antigravity AI
> **Changelog:** v0.3 — Integrated user choices: multi-monitor independent phrases, local phrase history, curated fonts (EB Garamond, Playfair Display, Outfit), launch at login integration, and Tailwind CSS.

---

## 1. Overview

### 1.1 Purpose

This document defines the functional behavior of **Murmur**, a desktop application for Windows that transforms the headlines of the day into a single, ephemeral, poetic phrase — displayed as the user's wallpaper.

Murmur runs silently in the background, consuming RSS feeds from a curated list of sources, synthesizing them through an AI language model (Google Gemini 2.5 Flash), and rendering the resulting phrase as a living, breathing desktop wallpaper.

### 1.2 Vision Statement

> *"The world's noise, distilled into one quiet sentence. Every hour. On your desktop."*

Murmur is not a news reader. It is not an aggregator. It is an ambient poetic oracle — a desktop that whispers the spirit of the moment to whoever sits before it.

### 1.3 Scope

**In scope (v1 — Windows):**
- RSS feed fetching and headline extraction
- AI-powered nonsense phrase generation via Gemini API (independent generation per monitor)
- Wallpaper rendering with poetic typography (supporting unique phrases per monitor)
- User configuration via config file and UI panel (styled with Tailwind CSS)
- System tray controls
- Multiple visual themes and animation styles
- Clean architecture: ports & adapters, dependency injection
- **Platform abstraction layer** — all OS-specific operations behind interfaces so future platforms can plug in without touching core logic
- **Phrase history** — maintains local log of last 10 generated phrases per monitor, viewable in the UI
- **Launch at login** — configuration option exposed in Settings UI
- **Curated free fonts** — EB Garamond, Playfair Display, and Outfit bundled directly

**Planned (v2 — macOS):**
- macOS wallpaper support via a `MacOsWallpaperAdapter` (supporting multi-display if supported by macOS APIs)
- macOS menu bar (system tray equivalent) via a `MacOsMenuBarAdapter`
- macOS login item integration
- No changes to domain, ports, or adapters other than adding new platform implementations

**Out of scope (all versions currently):**
- Mobile (iOS/Android)
- Social sharing of phrases
- Image generation or AI-generated visual backgrounds (text on curated themes only)

### 1.4 Target Audience

A single power user (the developer) running Murmur on a Windows personal machine. Murmur is a personal creative tool built with enough structural rigor to be shared or open-sourced later, including on macOS.

---

## 2. User Personas

### Primary Persona: "The Distracted Creator"

- Has many RSS feeds saved but never reads them fully
- Wants ambient awareness of the world without doom-scrolling
- Appreciates aesthetic desktop setups
- Comfortable editing a config file but also enjoys a GUI for quick tweaks
- Speaks a language other than English (default: system locale)

---

## 3. Functional Requirements

### 3.1 RSS Feed Ingestion

| ID | Requirement |
|----|-------------|
| RSS-01 | The system shall maintain a user-defined list of RSS feed URLs. |
| RSS-02 | On each refresh cycle, Murmur shall fetch all configured RSS feeds. |
| RSS-03 | The system shall extract the **title** field from each RSS item in the most recent fetch. |
| RSS-04 | Failed or unreachable feeds shall be silently skipped; the system proceeds with available titles. |
| RSS-05 | The system shall collect a random sample of titles (configurable, default: 15) from the full set. |
| RSS-06 | Feed sources are configurable via murmur.config.json and editable via the Settings UI. |

---

### 3.2 AI Phrase Generation

| ID | Requirement |
|----|-------------|
| AI-01 | The system shall use the **Google Gemini API** (gemini-2.5-flash or gemini-2.5-flash-lite) to generate phrases. |
| AI-02 | The system shall send a sampled selection of news titles as context to Gemini. |
| AI-03 | The prompt shall instruct the model to produce **one single poetic phrase** — haiku-like — blending concepts from different headlines into something absurd, surrealist, or evocative. |
| AI-03a | **Per-Monitor Generation:** The system shall call the Gemini API independently for each active screen to generate a unique poetic phrase per monitor. |
| AI-04 | The generated phrase shall NOT directly summarize any single headline. It must be a poetic distillation. |
| AI-05 | The phrase language shall be user-configurable. Default: auto-detect system locale. |
| AI-06 | The Gemini API key shall be stored in the local config file only. |
| AI-07 | On generation failure, Murmur shall retain the last successful phrase for the affected monitor and retry on the next cycle. |
| AI-08 | **Phrase History:** The system shall retain a local database or log of the last 10 generated phrases per monitor, exposing them to the Settings UI. |

---

### 3.3 Wallpaper Display

| ID | Requirement |
|----|-------------|
| WP-01 | Murmur shall render its output as the **Windows desktop wallpaper** (full screen takeover). |
| WP-01a | **Multi-Monitor Layout:** The system shall detect all connected monitors and set unique wallpapers with different phrases on each monitor independently. |
| WP-02 | The phrase shall be the **primary visual element**, displayed in a prominent poetic font, centered on each monitor's screen space. |
| WP-02a | **Bundled Fonts:** The wallpaper text shall render using curated free web/local fonts: *EB Garamond* (poetic serif), *Playfair Display* (elegant display serif), or *Outfit* (clean modern sans-serif). |
| WP-03 | The wallpaper background shall support **multiple visual themes** (see Section 3.4). The same theme or independent themes may be applied per monitor (user-configurable). |
| WP-04 | Users shall independently activate or deactivate the following optional overlay elements: |
| WP-04a | — **Date & Time** (subtle, secondary placement) |
| WP-04b | — **Source Credit** (e.g., "Drawn from: BBC, Reuters") |
| WP-04c | — **Inspiring Headlines** (small text, showing raw headlines used — toggleable) |
| WP-05 | The wallpaper shall **update automatically** every hour (configurable interval). |
| WP-06 | Murmur shall restore the user's previous wallpapers on all monitors when the application quits. |

---

### 3.4 Visual Themes

Users shall select from a set of pre-built visual themes. All themes are selectable from the Settings UI.

| Theme Name | Description |
|---|---|
| **Midnight** | Deep blacks, purples, midnight blues. Dark and moody. |
| **Drift** | Shifting gradients that transition with time of day (sunrise / daylight / dusk / night). |
| **Parchment** | Textured paper/parchment feel. Warm tones, aged typography. |
| **Blanc** | Minimal clean white or off-white. Almost invisible. |
| **Static** | Dynamic noise / particle effects behind the text. Digital and restless. |

Only one theme is active at a time.

---

### 3.5 Transition Animations

When a new phrase arrives, the transition shall be animated. The user selects the animation style from the Settings UI.

| Animation | Description |
|---|---|
| **Fade** | Old phrase fades out; new phrase fades in. |
| **Drift In** | New phrase gently floats in from one side or from below. |
| **Typewriter** | New phrase types itself character by character. |
| **Morph** | Background gradient morphs color simultaneously with phrase change. |
| **Instant** | No animation — immediate wallpaper swap. |

---

### 3.6 Configuration

#### 3.6.1 Config File (murmur.config.json)

The primary source of truth for all settings. Located in the app's user data directory.

```json
{
  "geminiApiKey": "YOUR_API_KEY_HERE",
  "feeds": [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
  ],
  "refreshIntervalMinutes": 60,
  "language": "auto",
  "theme": "Midnight",
  "animation": "Fade",
  "overlays": {
    "dateTime": true,
    "sourceCredit": false,
    "inspiringHeadlines": false
  },
  "headlineSampleSize": 15,
  "launchAtLogin": false,
  "fontFamily": "EB Garamond",
  "monitors": [
    { "id": "\\\\.\\DISPLAY1", "enabled": true },
    { "id": "\\\\.\\DISPLAY2", "enabled": true }
  ]
}
```

| Field | Description |
|---|---|
| geminiApiKey | User's Gemini API key from Google AI Studio |
| feeds | Array of RSS feed URLs |
| refreshIntervalMinutes | Refresh cadence (default: 60) |
| language | "auto" or BCP-47 code (e.g., "es", "en", "fr") |
| theme | Active visual theme name |
| animation | Active transition animation name |
| overlays | Boolean flags for each optional overlay element |
| headlineSampleSize | Number of headlines passed to Gemini (default: 15) |
| launchAtLogin | If true, registers Murmur as a startup application (default: false) |
| fontFamily | Selected bundled font family ("EB Garamond", "Playfair Display", "Outfit") |
| monitors | Array of detected monitors and their enabled configurations |

#### 3.6.2 Settings UI Panel

A settings panel accessible from the system tray icon. Allows users to:

- Add, remove, and reorder RSS feed URLs
- Paste or update their Gemini API key (masked input)
- Select visual theme (with live preview thumbnail)
- Select transition animation
- Toggle each overlay element independently
- Set refresh interval
- Set language preference (dropdown, with "Auto-detect" default)
- **Launch at Login:** Toggle startup integration
- **Font Selector:** Pick between EB Garamond, Playfair Display, and Outfit
- **Monitor Manager:** Enable/disable specific monitors for unique phrase rendering
- **Phrase History Panel:** View the last 10 generated phrases per monitor with a copy-to-clipboard button

The Settings UI shall be styled modernly and responsively using **Tailwind CSS**. All changes write immediately to murmur.config.json and take effect on the next refresh cycle.

---

### 3.7 System Tray

Murmur lives in the Windows system tray. Right-click context menu exposes:

| Action | Description |
|---|---|
| **Refresh Now** | Immediately fetch headlines and regenerate the phrase. |
| **Pause / Resume** | Suspend or resume automatic refresh cycles. |
| **Change Style** | Quick-access submenu to switch the active theme. |
| **Open Settings** | Open the full Settings UI panel. |
| **About Murmur** | Show app version and current phrase metadata. |
| **Quit** | Exit Murmur and restore the previous wallpaper. |

---

### 3.8 Clean Architecture

Murmur shall follow a **ports & adapters (hexagonal) architecture**, mirroring the pattern established in the memas project.

| Layer | Responsibility |
|---|---|
| **Domain** | Core business logic: phrase assembly rules, sampling logic, config schema. Zero platform knowledge. |
| **Ports** | Interfaces (contracts) that the domain depends on. Platform-agnostic by definition. |
| **Adapters** | Concrete implementations of each port. One set per platform where needed. |
| **Composition Root** | Single wiring point per platform: selects the right adapter set and injects via constructors. |

All cross-boundary dependencies must flow inward (domain is dependency-free). No adapter shall import from another adapter directly.

**Core ports (platform-agnostic):**

| Port | Description |
|---|---|
| `RssFetcher` | Fetches and parses RSS feeds. Platform-agnostic (HTTP + XML). |
| `PhraseGenerator` | Sends headlines to AI and returns a phrase. Platform-agnostic (Gemini API). |
| `WallpaperRenderer` | **Platform-specific.** Sets the desktop wallpaper image. |
| `SystemTrayProvider` | **Platform-specific.** Creates tray icon, menu, and notifications. |
| `ConfigStore` | Reads/writes `murmur.config.json`. Platform-agnostic (file I/O). |
| `WallpaperBackup` | **Platform-specific.** Saves and restores the previous wallpaper. |
| `StartupIntegration` | **Platform-specific.** Registers/deregisters the app as a login item. |

Platform-specific ports (`WallpaperRenderer`, `SystemTrayProvider`, `WallpaperBackup`, `StartupIntegration`) shall each have one adapter per supported OS, selected at the composition root.

---

### 3.9 Cross-Platform Design Constraints

Even though v1 targets Windows only, all implementation decisions must be made with macOS portability in mind.

| Constraint | Rule |
|---|---|
| **No OS calls in Domain** | The domain layer must never import `node:os`, `child_process`, Windows Registry, or any OS-specific API. |
| **Wallpaper via port only** | Setting the desktop wallpaper must always go through `WallpaperRenderer`. No inline OS calls. |
| **Tray via port only** | System tray / menu bar interaction must always go through `SystemTrayProvider`. |
| **Config path via port** | The path to `murmur.config.json` is resolved by the platform adapter, not hardcoded. |
| **Font paths via port** | Any file-system font loading must be abstracted behind a `FontProvider` port. |
| **No Windows-only npm deps in Domain** | Dependencies like `node-win-wallpaper` or `winreg` must only appear inside Windows adapters. |

**Porting contract for macOS (v2):**
To add macOS support, only these steps should be needed:
1. Implement `MacOsWallpaperAdapter` (using `osascript` or `desktoppr`).
2. Implement `MacOsMenuBarAdapter` (using `menubar` or native Electron tray on macOS).
3. Implement `MacOsWallpaperBackupAdapter`.
4. Implement `MacOsStartupAdapter` (macOS Launch Agents via `plist`).
5. Create a new composition root for macOS that wires these adapters in.
6. **Zero changes** to Domain, `RssFetcher`, `PhraseGenerator`, `ConfigStore`, themes, or animations.

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|---|---|
| NFR-01 | Performance | Full cycle (fetch + generate + render) shall complete within 15 seconds under normal network conditions. |
| NFR-02 | Cost | Use gemini-2.5-flash-lite or equivalent. Typical usage < .01/day. |
| NFR-03 | Privacy | No telemetry. Only the Gemini API call leaves the machine. |
| NFR-04 | Reliability | App shall not crash on malformed RSS, empty results, or API errors. |
| NFR-05 | Startup | Optional launch-at-login, user-configurable. |
| NFR-06 | Resources | Minimal CPU and RAM when idle (< 50 MB RAM, < 1% CPU). |
| NFR-07 | Offline | Last phrase is displayed if no internet is available. |

---

## 5. User Journeys

### 5.1 First-Time Setup

1. User installs Murmur.
2. On first launch, Settings UI opens automatically.
3. User pastes Gemini API key.
4. User adds or confirms the default RSS feed list.
5. User selects a visual theme and animation style.
6. User clicks **"Start Murmuring"**.
7. App fetches feeds → generates first phrase → sets as wallpaper.
8. App minimizes to system tray.

### 5.2 Daily Automated Operation

1. Every configured interval, Murmur wakes.
2. Fetches latest titles from all RSS feeds.
3. Samples N titles and sends them to Gemini.
4. Gemini returns one poetic phrase.
5. Wallpaper transitions to the new phrase using the selected animation.
6. Tray icon tooltip updates with the current phrase (truncated).

### 5.3 Manual Refresh

1. User right-clicks tray icon → **"Refresh Now"**.
2. Full cycle runs immediately.

### 5.4 Style Change

1. User right-clicks tray icon → **"Change Style"**.
2. Selects new theme from submenu.
3. Wallpaper re-renders with new theme immediately.
4. Config file updates.

---

## 6. Decisions Log

| # | Decision | Rationale |
|---|---|---|
| D-01 | Full wallpaper takeover | Maximum visual impact. Murmur is the wallpaper, not an accessory. |
| D-02 | Config file as source of truth | Developer-friendly; scriptable; UI writes to it. |
| D-03 | Gemini Flash-Lite model | Cost and speed optimized. This is ambient art, not mission-critical. |
| D-04 | Independent per-monitor generation | Rather than cloning the same phrase, each monitor receives its own unique AI-generated phrase from the sampled news pool to maximize creativity. |
| D-05 | System locale as default language | Internationalization-first without forcing a choice. |
| D-06 | All themes and animations user-selectable | User fully owns the aesthetic. No forced opinion after first launch. |
| D-07 | Ports & adapters architecture | Same as memas: clean boundaries, testable, easy to swap implementations. |
| D-08 | Platform-specific ports isolated per adapter | macOS support in v2 requires only new adapters, zero domain changes. The porting cost is bounded and predictable. |
| D-09 | Local phrase history | Keeps a log of the last 10 generated phrases per monitor, resolving user request. |
| D-10 | Curated bundled fonts | EB Garamond, Playfair Display, and Outfit are bundled directly for a premium out-of-the-box look. |
| D-11 | Launch at login in settings UI | Configures auto-start directly in the GUI. |
| D-12 | Tailwind CSS for styling | Settings UI uses Tailwind CSS for visual consistency and rapid UI development, mirroring the stack of memas. |

---

## 7. Open Questions

> These questions are to be resolved before the Technical Specification is written.

| # | Question | Impact |
|---|---|---|
| Q-05 | **Settings UI rendering:** Native tray window (e.g., Electron/Tauri overlay), or local web UI (localhost)? | Tech choice: significant |
| Q-06 | **Wallpaper engine:** Generate a PNG and set via Windows API, or render via a transparent always-on-bottom window? | Tech choice: significant |
| Q-07 | **Framework for cross-platform future:** Should v1 use Electron (runs on macOS already) or a lighter Windows-only approach (Node daemon + native APIs) knowing we'll need to port later? | Tech choice: critical — affects porting cost significantly |

---

## 8. Acceptance Criteria (v1)

- [ ] App runs on Windows 10/11 without admin rights.
- [ ] Wallpaper updates with a new AI-generated phrase at the configured interval.
- [ ] At least 3 visual themes are available and selectable.
- [ ] At least 3 transition animations are available and selectable.
- [ ] System tray provides Refresh Now, Pause/Resume, Change Style, and Quit.
- [ ] Settings UI allows full configuration without manually editing the config file.
- [ ] App handles errors gracefully (bad feeds, no internet, API failure) without crashing.
- [ ] API key is never logged or displayed in plaintext.
- [ ] Quitting the app restores the previous desktop wallpaper.
- [ ] All major components sit behind interfaces (ports); adapters are independently replaceable.
- [ ] Domain layer contains zero OS-specific imports or direct system calls.
- [ ] A code review confirms that adding macOS adapters would require no changes outside of `adapters/macos/` and the macOS composition root.

---

*End of Functional Specification v0.2*
