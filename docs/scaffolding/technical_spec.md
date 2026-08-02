# Murmur — Technical Specification

> **Superseded:** This draft is retained for history only. For engineering design and implementation phases, use [`docs/features/`](../features/) technical specs and [architecture.md](../architecture.md).

> **Version:** 0.2 (Draft)
> **Status:** Awaiting User Approval
> **Date:** 2026-07-17
> **Author:** Product Owner + Antigravity AI
> **References:** Functional Specification v0.3
> **Changelog:** v0.2 — Updated for multi-monitor support (COM-based SetWallpaper per display), Tailwind CSS (v4), local phrase history store, curated fonts (EB Garamond, Playfair Display, Outfit), and startup options.

---

## 1. Overview

This document defines the technical implementation of **Murmur**: the stack, architecture, data flows, module contracts, and all design decisions with explicit rationale. It is written for the developer implementing the system and supplements — not replaces — the Functional Specification.

### 1.1 Guiding Principles

1. **Ports & adapters, strictly enforced.** The domain is a pure island. All I/O passes through typed interfaces. This is the same discipline used in `memas`.
2. **Electron as the framework.** Chosen deliberately — see trade-off analysis in Section 6.
3. **PNG pipeline, not transparent window.** The wallpaper is rendered to a PNG file and set via OS API. No hacks, no z-order fighting.
4. **TypeScript end-to-end.** Same as `memas`. Compiler is the first test suite.
5. **No magic DI containers.** Manual constructor injection at a single composition root per platform.
6. **macOS portability by design.** Platform-specific code lives only in named adapters. Porting = adding adapters, touching nothing else.
7. **Three-tier test pyramid.** Unit → Integration → E2E. Domain logic is fully unit-testable via mock adapters. Adapters are integration-tested. The full Electron app is E2E-tested with Playwright.

---

## 2. Technology Stack

### 2.1 Core Framework

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Desktop runtime | **Electron** | Latest stable (v35+) | Cross-platform out of the box; runs on macOS today with zero additional porting work for non-OS-specific code; massive ecosystem; proven tray + window management. |
| Language | **TypeScript** | ~5.8 | Same as memas; type safety, IntelliSense, interface-first DI. |
| Package manager | **npm** | — | Consistency with memas. |
| Bundler | **Vite** (via `electron-vite`) | Latest | Fast dev loop, HMR in renderer, single config for main + renderer + preload. |
| Packaging | **electron-builder** | Latest | Industry standard NSIS installer for Windows, DMG for macOS. |

### 2.2 Key Dependencies

| Package | Purpose | Notes |
|---|---|---|
| `@google/genai` | Gemini API SDK | Same as memas — `gemini-2.5-flash-lite` |
| `node-canvas` | Server-side canvas rendering | Renders phrase + theme to PNG buffer |
| `sharp` | Image processing and PNG output | Final PNG compression and file write; must be in `asarUnpack` |
| `fast-xml-parser` | RSS/XML parsing | Fastest, dependency-free XML-to-object; paired with native `fetch` |
| `electron-vite` | Build tooling for Electron | Vite-native Electron build system |
| `@tailwindcss/vite` | Tailwind CSS v4 compiler integration | Built into Vite bundler step |
| `tailwindcss` | Utility CSS framework | Styled Settings UI |
| `electron-builder` | Packaging | Windows NSIS, macOS DMG |
| `vitest` | Unit testing | Same as memas |
| `zod` | Config validation | Runtime schema validation of `murmur.config.json` |
| `dotenv` | Dev environment config | API key from `.env` during development |

*Note: The third-party `wallpaper` npm package has been removed because it only supports setting a single global wallpaper. We will use native COM interfaces on Windows and AppleScript/osascript on macOS to support setting distinct wallpapers per monitor.*

### 2.3 Why NOT Tauri

Tauri v2 is compelling but disqualified for Murmur for one decisive reason: **the backend is Rust**. The team is TypeScript-fluent (see: memas). The `@google/genai` SDK, all RSS logic, and the wallpaper library all live in the Node.js ecosystem. Rewriting or bridging them to Rust adds significant cost with no offsetting benefit for a single-user personal tool. Electron's weight (~150 MB bundle) is acceptable here since Murmur is a developer tool.

### 2.4 Why NOT a headless Node.js daemon

A pure Node.js daemon has no built-in tray, no window management, and requires complex OS-level distribution (e.g., packaging a Node runtime). Electron provides all of this for free. The only overhead is bundle size, which is irrelevant for a wallpaper daemon that runs once at login.

---

## 3. Architecture

### 3.1 Hexagonal Architecture — Layer Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON MAIN PROCESS                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  COMPOSITION ROOT                        │   │
│  │  (platform/windows/index.ts  |  platform/macos/index.ts) │   │
│  │  Wires: adapters → ports → domain services               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────────────────────────┐   │
│  │   DOMAIN     │   │           ADAPTERS                   │   │
│  │              │◄──│  (implement ports, have OS knowledge) │   │
│  │  Pure logic  │   │                                      │   │
│  │  No imports  │   │  • GeminiPhraseGeneratorAdapter       │   │
│  │  from outside│   │  • RssFetcherAdapter                 │   │
│  │              │   │  • WinDesktopWallpaperAdapter        │   │
│  │  Services:   │   │  • NodeCanvasWallpaperRenderAdapter  │   │
│  │  • MurmurSvc │   │  • JsonConfigStoreAdapter            │   │
│  │  • Scheduler │   │  • JsonHistoryStoreAdapter           │   │
│  │  • Sampler   │   │  • WinStartupAdapter / MacStartupAdp  │   │
│  │              │   │  • ElectronTrayAdapter               │   │
│  └──────┬───────┘   └──────────────────────────────────────┘   │
│         │                                                       │
│         │  (depends on via constructor injection)               │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        PORTS                              │  │
│  │  (TypeScript interfaces — no implementations here)        │  │
│  │                                                           │  │
│  │  IRssFetcher  │  IPhraseGenerator  │  IWallpaperRenderer  │  │
│  │  IConfigStore │  IWallpaperBackup  │  ISystemTray         │  │
│  │  IStartup     │  IFontProvider     │  IWallpaperPainter   │  │
│  │  IHistoryStore│                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  ELECTRON RENDERER PROCESS                      │
│  (Settings UI — React + Vite + Tailwind, IPC only)             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow — Hourly Refresh Cycle

```
Scheduler (domain) fires
       │
       ▼
IRssFetcher.fetchAll(feeds[])
       │  returns: RssItem[] (title, source)
       ▼
Sampler.sample(items, config.headlineSampleSize)
       │  returns: string[] (sampled titles)
       ▼
For each enabled monitor:
  IPhraseGenerator.generate(titles[], language)
       │  returns: string (unique phrase)
  IWallpaperPainter.paint(phrase, theme, overlays, fontFamily, resolution)
       │  returns: Buffer (PNG adjusted for that screen)
  IWallpaperRenderer.set(monitorId, pngBuffer)
       │  writes PNG to unique temp file, invokes COM / AppleScript API
  IHistoryStore.save(monitorId, phrase)
       │  saves phrase to the local history logs
       ▼
ISystemTray.setTooltip(monitorPhrasesSummary)
```

### 3.3 IPC Communication (Main ↔ Renderer)

Electron enforces process isolation. All communication between the Main process (domain, adapters) and the Renderer (Settings UI) goes through typed IPC channels defined in a shared `ipc.types.ts` file.

| Channel | Direction | Payload | Purpose |
|---|---|---|---|
| `config:get` | Renderer → Main | — | Request current config |
| `config:set` | Renderer → Main | `Partial<MurmurConfig>` | Update config |
| `murmur:refresh` | Renderer → Main | — | Trigger immediate refresh |
| `murmur:pause` | Renderer → Main | `boolean` | Pause / resume |
| `murmur:state` | Main → Renderer | `MurmurState` | Push current app state |
| `theme:preview` | Renderer → Main | `{ monitorId: string, theme: ThemeName }` | Preview theme without saving |

---

## 4. Module Structure

```
murmur/
├── electron.vite.config.ts         # Build config for all three processes
├── package.json
├── tsconfig.json
│
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts                # Entry point
│   │   ├── platform/
│   │   │   ├── windows/
│   │   │   │   └── index.ts        # Windows composition root
│   │   │   └── macos/
│   │   │       └── index.ts        # macOS composition root (v2)
│   │   └── tray.ts                 # Tray menu builder
│   │
│   ├── domain/                     # Pure domain logic — zero OS imports
│   │   ├── MurmurService.ts        # Orchestrates full refresh cycle
│   │   ├── Scheduler.ts            # Interval-based refresh trigger
│   │   ├── HeadlineSampler.ts      # Random sampling of RSS titles
│   │   ├── config.schema.ts        # Zod schema for MurmurConfig
│   │   └── types.ts                # All shared domain types
│   │
│   ├── ports/                      # Interfaces — no implementations
│   │   ├── IRssFetcher.ts
│   │   ├── IPhraseGenerator.ts
│   │   ├── IWallpaperPainter.ts    # Renders phrase+theme → PNG buffer
│   │   ├── IWallpaperRenderer.ts   # Writes buffer → sets OS wallpaper
│   │   ├── IWallpaperBackup.ts     # Save/restore previous wallpaper
│   │   ├── IConfigStore.ts
│   │   ├── ISystemTray.ts
│   │   ├── IStartupIntegration.ts
│   │   ├── IFontProvider.ts
│   │   └── IHistoryStore.ts
│   │
│   ├── adapters/
│   │   ├── gemini/
│   │   │   └── GeminiPhraseGeneratorAdapter.ts
│   │   ├── rss/
│   │   │   └── FastXmlRssFetcherAdapter.ts
│   │   ├── canvas/
│   │   │   └── NodeCanvasWallpaperPainterAdapter.ts
│   │   ├── wallpaper/
│   │   │   └── WinDesktopWallpaperAdapter.ts # Native COM implementation
│   │   ├── config/
│   │   │   └── JsonConfigStoreAdapter.ts
│   │   ├── history/
│   │   │   └── JsonHistoryStoreAdapter.ts # Locally saves phrase logs
│   │   ├── tray/
│   │   │   └── ElectronTrayAdapter.ts
│   │   ├── startup/
│   │   │   ├── WinStartupAdapter.ts    # Uses app.setLoginItemSettings
│   │   │   └── MacStartupAdapter.ts    # Uses app.setLoginItemSettings (macOS)
│   │   └── fonts/
│   │       └── BundledFontProvider.ts  # Serves fonts from app resources
│   │
│   ├── renderer/                   # Settings UI (Electron renderer process)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css               # Tailwind directives
│   │   └── components/
│   │       ├── FeedManager.tsx
│   │       ├── ThemePicker.tsx
│   │       ├── AnimationPicker.tsx
│   │       ├── OverlayToggles.tsx
│   │       ├── LanguageSelector.tsx
│   │       └── ApiKeyInput.tsx
│   │
│   ├── preload/
│   │   └── index.ts               # contextBridge exposure of IPC channels
│   │
│   └── shared/
│       ├── ipc.types.ts           # Typed IPC channel definitions
│       ├── config.types.ts        # MurmurConfig type (consumed by all)
│       └── constants.ts           # App name, default config, etc.
│
├── resources/
│   └── fonts/                     # Bundled free poetic typefaces
│       ├── EB-Garamond.ttf        # Classical, intellectual
│       ├── Playfair-Display.ttf   # High-contrast elegant serif
│       └── Outfit.ttf             # Clean geometric sans-serif
│
└── docs/
    └── scaffolding/
        ├── functional_spec.md
        └── technical_spec.md      ← this file
```

---

## 5. Component Specifications

### 5.1 Domain — MurmurService

The central use-case orchestrator. Injected with all ports at construction.

```typescript
class MurmurService {
  constructor(
    private readonly rss: IRssFetcher,
    private readonly ai: IPhraseGenerator,
    private readonly painter: IWallpaperPainter,
    private readonly renderer: IWallpaperRenderer,
    private readonly config: IConfigStore,
    private readonly history: IHistoryStore,
    private readonly tray: ISystemTray,
  ) {}

  async refresh(): Promise<void>
  async previewTheme(monitorId: string, theme: ThemeName): Promise<void>
}
```

- `refresh()` detects all active screens via the Electron `screen` API, maps them against configured monitors, performs feed fetching, runs independent Gemini generation per active monitor, paints a canvas optimized for each monitor's target resolution and selected font, updates the desktop background per screen, logs phrases to `IHistoryStore`, and sets the tray tooltip.
- `previewTheme()` temporarily paints and updates the background of a single monitor to preview visual changes.

### 5.2 Domain — Scheduler

```typescript
class Scheduler {
  constructor(private readonly service: MurmurService) {}

  start(intervalMinutes: number): void
  stop(): void
  triggerNow(): Promise<void>
}
```

Uses `setInterval` internally. The interval is restarted whenever config changes the interval value. Emits an event on each tick so the tray can show "last updated" time.

### 5.3 Domain — HeadlineSampler

```typescript
function sampleHeadlines(items: RssItem[], n: number): string[]
```

Pure function. Fisher-Yates shuffle, then take first `n`. No state, fully testable.

### 5.4 Port Contracts

#### IRssFetcher
```typescript
interface IRssFetcher {
  fetchAll(feeds: string[]): Promise<RssItem[]>
}
type RssItem = { title: string; source: string; feedUrl: string }
```

#### IPhraseGenerator
```typescript
interface IPhraseGenerator {
  generate(headlines: string[], language: string): Promise<string>
}
```

#### IWallpaperPainter
```typescript
interface IWallpaperPainter {
  paint(options: PaintOptions): Promise<Buffer>
}
type PaintOptions = {
  phrase: string
  theme: ThemeName
  fontFamily: string              // "EB Garamond" | "Playfair Display" | "Outfit"
  animation: AnimationName        // stored, applied at transition time
  overlays: OverlayConfig
  resolution: { width: number; height: number }
  headlines?: string[]            // shown if overlay.inspiringHeadlines = true
  sources?: string[]              // shown if overlay.sourceCredit = true
}
```

#### IWallpaperRenderer
```typescript
interface IWallpaperRenderer {
  set(monitorId: string, pngBuffer: Buffer): Promise<void>
  backup(): Promise<void>           // saves mapping of monitorId -> current wallpaper file path
  restore(): Promise<void>          // restores original wallpapers on app quit
}
```

#### IHistoryStore
```typescript
interface IHistoryStore {
  save(monitorId: string, phrase: string): Promise<void>
  get(monitorId: string): Promise<string[]>
  clear(monitorId: string): Promise<void>
}
```

### 5.5 Adapter — GeminiPhraseGeneratorAdapter

Uses `@google/genai` exactly as in `memas`. Key details:

- **Model:** `gemini-2.5-flash-lite` (cheapest viable; configurable to allow model override)
- **Temperature:** 1.1 (creative, surrealist)
- **Max output tokens:** 80 (one short phrase — hard cap to minimize cost)
- **System prompt pattern:**

```
You are a surrealist poet. Given a list of news headlines, 
generate exactly ONE short poetic phrase (maximum 20 words) 
that weaves together unrelated concepts from different headlines 
into something metaphorical, absurd, or evocative. 
Do NOT summarize the news. Do NOT use quotation marks. 
Language: {{language}}.
Headlines: {{headlines}}
```

**Cost estimate (at 24 refreshes/day):**
- Input tokens per call: ~300 (system prompt + 15 headlines)
- Output tokens per call: ~30 (one phrase)
- Daily: 24 × 330 tokens = ~7,920 tokens
- At $0.10/M input + $0.40/M output: **< $0.002/day** (effectively free)

### 5.6 Adapter — NodeCanvasWallpaperPainterAdapter

- Creates a canvas matching the specific monitor's target resolution (e.g. 1920x1080 or 2560x1440) passed in `PaintOptions`.
- Draws the background layer based on theme (gradients, noise, parchment overlay).
- Loads and registers fonts from application resources using `canvas.registerFont(path, { family })` mapping to "EB Garamond", "Playfair Display", or "Outfit".
- Draws the phrase text centered using high-quality anti-aliased type rendering.
- Converts to PNG buffer via `canvas.toBuffer('image/png')` and compresses using `sharp` to minimize disk write lag.

**Theme rendering strategy:**

| Theme | Implementation |
|---|---|
| Midnight | `fillRect` with deep gradient (#0a0015 → #1a0030) + faint star noise |
| Drift | HSL gradient computed from `Date.now()` hour (0–23 → hue 200–340) |
| Parchment | Warm off-white fill (#f5e6c8) + noise texture overlay + sepia font |
| Blanc | Pure `#f8f8f8` fill; very minimal |
| Static | Black fill + white noise pixel scatter using typed array fill |

### 5.7 Adapter — WinDesktopWallpaperAdapter

Uses native Windows COM scripting via PowerShell invocation (`child_process.execSync`) to set individual monitor wallpapers without external binary compiled DLLs:
- **Set Wallpaper:** Invokes a PowerShell inline script that instantiates the `DesktopWallpaper` COM class:
  ```powershell
  $wp = New-Object -ComObject DesktopWallpaper
  $wp.SetWallpaper('DEVICE_ID_HERE', 'C:\Path\To\murmur_wallpaper.png')
  ```
- **Backup & Restore:** Queries current wallpapers using `$wp.GetWallpaper('DEVICE_ID_HERE')` and saves the paths, restoring them on quit.

*Note: For macOS, `MacOsDesktopWallpaperAdapter` will invoke AppleScript / `osascript` targeting specific desktop displays using native window index mapping.*

PNG temp files are saved as: `app.getPath('temp') + '/murmur_wallpaper_[monitor_id_sanitized].png'`

### 5.8 Adapter — FastXmlRssFetcherAdapter

- Uses native `fetch` (available in Electron's Node.js runtime) for HTTP.
- Parses XML with `fast-xml-parser`.
- Per-feed timeout: 8 seconds.
- On fetch failure: logs error, returns `[]` for that feed (skipped silently).
- Normalizes items from both RSS 2.0 (`<item>`) and Atom (`<entry>`) formats.

### 5.9 Adapter — JsonConfigStoreAdapter

- Reads/writes `murmur.config.json` in `app.getPath('userData')`.
- On first read, if file doesn't exist: writes default config and returns it.
- Validates config on read using Zod schema — falls back to defaults on parse error.
- File is written atomically (write to `.tmp`, then `rename`) to avoid corruption.

### 5.10 Adapter — JsonHistoryStoreAdapter

- Implements `IHistoryStore` by writing history logs to a dedicated `murmur.history.json` file in `app.getPath('userData')` to prevent config file bloat.
- Limits history array size to 10 entries per monitor ID (FIFO).

---

## 6. Trade-offs & Alternatives Considered

### 6.1 Framework Choice

| Option | Verdict | Reason |
|---|---|---|
| **Electron** | ✅ Chosen | TypeScript-native, cross-platform tray + window, macOS ready today, same ecosystem as memas |
| **Tauri v2** | ❌ Rejected | Rust backend required; @google/genai and wallpaper npm don't port trivially |
| **Node.js daemon** | ❌ Rejected | No built-in tray; complex distribution; would still need Electron for Settings UI |
| **Wails (Go)** | ❌ Rejected | Go runtime; same ecosystem mismatch as Tauri |

### 6.2 Wallpaper Strategy

| Option | Verdict | Reason |
|---|---|---|
| **Generate PNG → set via OS API** | ✅ Chosen | Stable, low CPU, works on all OS. We use COM interface on Windows and AppleScript on macOS. |
| **Transparent always-on-bottom BrowserWindow** | ❌ Rejected | Z-order hacks unreliable on Windows 10/11. GPU compositing cost is high. Black-background bugs on some drivers. Requires WorkerW injection which breaks with Windows updates. |

### 6.3 Image Rendering

| Option | Verdict | Reason |
|---|---|---|
| **node-canvas + sharp** | ✅ Chosen | Full Canvas 2D API for creative rendering; sharp for fast PNG output. |
| **SVG → PNG via sharp** | 🔶 Considered | Good for simple text; harder for particle effects and noise themes. |
| **Puppeteer / headless Chrome** | ❌ Rejected | Massive overhead; ships another Chromium inside an Electron app. |
| **Renderer-process canvas (HTML canvas)** | ❌ Rejected | Would require a hidden BrowserWindow just to render; wasteful. |

### 6.4 RSS Parsing

| Option | Verdict | Reason |
|---|---|---|
| **fast-xml-parser** | ✅ Chosen | Fastest, no deps, TypeScript-native. |
| **Feedsmith** | 🔶 Strong alternative | Better namespace support; overkill for title-only extraction. |
| **rss-parser** | 🔶 Viable | Simpler API; slower and less maintained vs fast-xml-parser. |

---

## 7. Platform Considerations

### 7.1 Windows (v1)

| Concern | Approach |
|---|---|
| Wallpaper setting | Windows COM DesktopWallpaper object via native PowerShell invocation |
| Startup at login | `app.setLoginItemSettings({ openAtLogin: true })` |
| Config location | `%APPDATA%/murmur/murmur.config.json` via `app.getPath('userData')` |
| Temp PNG location | `%TEMP%/murmur_wallpaper_[monitor_id].png` |
| Admin rights required | No. Per-user install + per-user registry key. |
| Multiple monitors | Supported natively: each monitor has a unique generated wallpaper |

### 7.2 macOS (v2 — planned)

| Concern | Approach |
|---|---|
| Wallpaper setting | AppleScript/osascript commands targeting specific screen indices |
| Startup at login | `app.setLoginItemSettings({ openAtLogin: true })` (Electron handles macOS Login Items API) |
| Config location | `~/Library/Application Support/murmur/murmur.config.json` |
| Permission | App may need Full Disk Access if SIP-protected. Electron handles the prompt. |
| Adapters to write | `MacOsDesktopWallpaperAdapter`, macOS composition root |
| Menu bar | Electron `Tray` works identically on macOS — no new adapter needed |

### 7.3 Build Matrix

| Target | Command | Output |
|---|---|---|
| Windows (dev) | `npm run dev` | Electron in dev mode |
| Windows (package) | `npm run build:win` | `dist/Murmur-Setup.exe` (NSIS) |
| macOS (dev) | `npm run dev` | Same codebase |
| macOS (package) | `npm run build:mac` | `dist/Murmur.dmg` |

---

## 8. Configuration Schema (Zod)

```typescript
import { z } from 'zod'

const MonitorConfigSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  themeOverride: z.string().optional(),
})

const MurmurConfigSchema = z.object({
  geminiApiKey: z.string().min(1),
  feeds: z.array(z.string().url()).min(1),
  refreshIntervalMinutes: z.number().int().min(5).max(1440).default(60),
  language: z.string().default('auto'),
  theme: z.enum(['Midnight','Drift','Parchment','Blanc','Static']).default('Midnight'),
  animation: z.enum(['Fade','DriftIn','Typewriter','Morph','Instant']).default('Fade'),
  overlays: z.object({
    dateTime: z.boolean().default(true),
    sourceCredit: z.boolean().default(false),
    inspiringHeadlines: z.boolean().default(false),
  }),
  headlineSampleSize: z.number().int().min(5).max(50).default(15),
  launchAtLogin: z.boolean().default(false),
  fontFamily: z.enum(['EB Garamond','Playfair Display','Outfit']).default('EB Garamond'),
  monitors: z.array(MonitorConfigSchema).default([]),
})

type MurmurConfig = z.infer<typeof MurmurConfigSchema>
```

---

## 9. Settings UI

Built with **React + Vite** in the Electron renderer process. Styled with **Tailwind CSS (v4)** using the official `@tailwindcss/vite` plugin. Communicates with Main via IPC only (typed channels in preload/index.ts via contextBridge).

### 9.1 UI Screens

| Screen | Description |
|---|---|
| **Setup Wizard** | First-run only. API key → feeds → theme → "Start Murmuring" |
| **Main Settings** | Tabbed layout: Feeds | Appearance | Monitors & History | General |

### 9.2 Settings Tabs

**Feeds tab:** Add/remove/reorder feed URLs. Manual "Test Feed" button to validate URL. Styled with Tailwind inputs.
**Appearance tab:** Theme grid (5 cards with visual preview), animation picker, overlay toggles, font picker (EB Garamond, Playfair Display, Outfit).
**Monitors & History tab:** List of detected screens with toggle switches. Below each screen is a chronological list of its last 10 generated nonsense phrases.
**General tab:** Launch at Login toggle, API key configuration, language dropdown, and refresh interval slider.

### 9.3 Live Preview

When the user selects a theme or animation in the Settings UI:
1. Renderer sends `theme:preview` with the target `monitorId` and `themeName` via IPC.
2. Main calls `painter.paint(...)` and updates that specific screen.
3. If user cancels, Main restores the original config.

---

## 10. Error Handling Strategy

| Error Type | Behavior |
|---|---|
| RSS feed unreachable | Skip that feed, proceed with others. Log to console (dev) / tray tooltip. |
| All feeds fail | Use last successful headline set from a short in-memory cache. |
| Gemini API error (rate limit, network) | Retain last phrase. Retry on next scheduled cycle. Show "⚠" in tray icon tooltip. |
| Gemini API auth error (bad key) | Show notification via tray: "Invalid API key — open Settings." |
| Config parse error | Fall back to hardcoded defaults. Alert user via tray notification. |
| Wallpaper write failure | Log error. Do not crash. Try next cycle. |
| Screen resolution 0x0 (display not ready) | Retry after 5 second delay, up to 3 attempts. |

---

## 11. Testing Strategy

Murmur follows a **three-tier test pyramid**: fast unit tests at the base, integration tests in the middle, and E2E tests with Playwright at the top. Because domain logic depends only on port interfaces, every service can be tested with in-memory mock adapters — no Electron required for the bulk of testing.

### 11.1 Test Folder Structure

```
murmur/
├── src/
│   ├── domain/
│   │   └── __tests__/             # Unit tests co-located with domain
│   └── adapters/
│       └── __tests__/             # Unit tests for adapter internals
├── tests/
│   ├── unit/                      # Vitest — pure domain logic
│   ├── integration/               # Vitest — real I/O, real network (opt-in)
│   └── e2e/                       # Playwright — full Electron app
│       ├── setup-wizard.spec.ts
│       ├── settings-ui.spec.ts
│       ├── tray.spec.ts
│       └── refresh-cycle.spec.ts
├── vitest.config.ts               # Unit + integration config
├── playwright.config.ts           # E2E config
└── package.json
```

### 11.2 Test Scripts

```json
"scripts": {
  "test"              : "vitest run tests/unit",
  "test:watch"        : "vitest tests/unit",
  "test:unit"         : "vitest run tests/unit",
  "test:integration"  : "vitest run tests/integration",
  "test:e2e"          : "playwright test",
  "test:e2e:ui"       : "playwright test --ui",
  "test:all"          : "vitest run && playwright test"
}
```

---

### 11.3 Unit Tests (Vitest)

Run fast, zero OS dependencies, zero network. All domain services are tested with in-memory stubs implementing the port interfaces.

#### Domain Logic

| Test Suite | What's Tested | Key Assertions |
|---|---|---|
| `HeadlineSampler` | `sampleHeadlines(items, n)` | Returns exactly `n` items; no duplicates; handles `n > items.length` gracefully |
| `MurmurConfig` Zod schema | Valid, invalid, and partial configs | Defaults applied correctly; invalid URLs/keys rejected; `_wallpaperBackupPath` is optional |
| `MurmurService.refresh()` | Full pipeline orchestration | Calls `rss.fetchAll` → `ai.generate` → `painter.paint` → `renderer.set` → `tray.setTooltip` in correct order |
| `MurmurService` error paths | RSS failure, AI failure, render failure | Does not throw; retains last phrase; calls appropriate tray notification method |
| `Scheduler` | `start()`, `stop()`, `triggerNow()` | Fires at correct interval; stops cleanly; `triggerNow()` calls service immediately |
| `Scheduler` pause/resume | `pause()` and `resume()` | Does not fire while paused; resumes on `resume()` |

#### Adapter Unit Tests (with mocks)

| Test Suite | What's Tested |
|---|---|
| `GeminiPhraseGeneratorAdapter` | Mocks `@google/genai` SDK; asserts correct model name, temperature, max tokens, system prompt structure |
| `FastXmlRssFetcherAdapter` | Mocks `fetch`; feeds RSS 2.0 and Atom XML fixtures; asserts correct title extraction and source tagging |
| `JsonConfigStoreAdapter` | Mocks `fs`; asserts atomic write (tmp → rename); Zod validation fallback to defaults on corrupt JSON |
| `NodeCanvasWallpaperPainterAdapter` | Mocks `node-canvas` and `sharp`; asserts `paint()` calls correct Canvas 2D operations per theme |

#### Mock Adapter Pattern

```typescript
// tests/unit/mocks/MockPhraseGenerator.ts
export class MockPhraseGenerator implements IPhraseGenerator {
  public lastHeadlines: string[] = []
  public returnValue = 'the fog remembers its exits'

  async generate(headlines: string[], _lang: string): Promise<string> {
    this.lastHeadlines = headlines
    return this.returnValue
  }
}
```

All ports have a corresponding `Mock*` class in `tests/unit/mocks/`. Injected into `MurmurService` via constructor — no monkey-patching, no module interception.

---

### 11.4 Integration Tests (Vitest)

Test real adapter behavior against real I/O. Slower, some require network access. Tagged with `@integration` in test names and skipped by default in CI without the `INTEGRATION=true` env flag.

| Test Suite | Requires | What's Tested |
|---|---|---|
| `FastXmlRssFetcherAdapter` (live) | Network | Fetches from 2–3 real RSS feeds; asserts non-empty title list; handles one intentionally broken URL |
| `JsonConfigStoreAdapter` (real fs) | Temp dir | Full read → write → read roundtrip in OS temp dir; asserts atomic write leaves no `.tmp` file on success |
| `NodeCanvasWallpaperPainterAdapter` (real render) | `node-canvas`, `sharp` | Renders all 5 themes at 1920×1080; writes PNG to temp; asserts valid PNG header magic bytes (`PNG`) |
| `NodeCanvasWallpaperPainterAdapter` (overlays) | Same | Asserts each overlay flag (`dateTime`, `sourceCredit`, `inspiringHeadlines`) produces a different buffer |
| `GeminiPhraseGeneratorAdapter` (live) | Network + API key | Calls real Gemini endpoint; asserts non-empty string returned; skipped unless `GEMINI_API_KEY` env set |

```typescript
// tests/integration/rss.integration.test.ts
describe('@integration FastXmlRssFetcherAdapter', () => {
  it('fetches titles from live BBC RSS feed', async () => {
    const adapter = new FastXmlRssFetcherAdapter()
    const items = await adapter.fetchAll(['https://feeds.bbci.co.uk/news/rss.xml'])
    expect(items.length).toBeGreaterThan(0)
    expect(items[0].title).toBeTruthy()
  })

  it('skips unreachable feeds and returns partial results', async () => {
    const adapter = new FastXmlRssFetcherAdapter()
    const items = await adapter.fetchAll([
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://this-does-not-exist.invalid/feed.xml',
    ])
    expect(items.length).toBeGreaterThan(0) // BBC items still returned
  })
})
```

---

### 11.5 E2E Tests (Playwright + `electron-playwright-helpers`)

Launch the real packaged Electron app (development build) via Playwright. Test the Settings UI, tray interactions, and the full refresh cycle in an isolated environment.

#### Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    // Launched via electron-playwright-helpers
    launchOptions: { args: ['--murmur-e2e'] },
  },
})
```

```typescript
// tests/e2e/_electron.ts  — shared launcher
import { _electron as electron } from 'playwright'

export async function launchApp() {
  return electron.launch({
    args: ['.'],                          // main entry
    env: {
      ...process.env,
      MURMUR_E2E: 'true',               // flag to load stub adapters
      MURMUR_DATA_DIR: tmpdir(),         // isolated config per run
    },
  })
}
```

> **E2E Stub Strategy:** When `MURMUR_E2E=true`, the composition root injects `StubPhraseGenerator` (returns a fixed phrase) and `StubWallpaperRenderer` (no-op write). This prevents real API calls and real wallpaper changes during automated tests. RSS fetcher is also replaced with a stub returning fixture headlines.

#### E2E Test Suites

**`setup-wizard.spec.ts` — First-run experience**

```typescript
test('setup wizard opens on first launch', async () => {
  const app = await launchApp()
  const window = await app.firstWindow()
  await expect(window.locator('#setup-wizard')).toBeVisible()
  await app.close()
})

test('entering API key and clicking Start closes wizard and shows tray', async () => {
  const app = await launchApp()
  const window = await app.firstWindow()
  await window.fill('#api-key-input', 'test-key-abc')
  await window.click('#start-murmuring-btn')
  await expect(window.locator('#setup-wizard')).toBeHidden()
  await app.close()
})
```

**`settings-ui.spec.ts` — Settings panel**

| Test | Assertion |
|---|---|
| Settings window opens via IPC trigger | `#settings-panel` visible |
| Feed URL input adds a new feed to the list | Feed list count increases by 1 |
| Removing a feed reduces list count | Feed list count decreases |
| Selecting a theme sends `theme:preview` IPC | IPC spy receives correct payload |
| Toggling `dateTime` overlay updates config | `config.overlays.dateTime` flips |
| API key field is masked (`type="password"`) | Input type is `password` |
| Language dropdown defaults to "Auto-detect" | `#language-select` value is `auto` |
| Saving settings writes to config file | Config file on disk reflects change |

**`tray.spec.ts` — System tray**

> Note: Electron tray cannot be directly clicked in a headless Playwright run. Tray actions are tested by triggering the underlying IPC handlers directly.

| Test | Mechanism | Assertion |
|---|---|---|
| Refresh Now | `app.evaluate(() => ipcMain.emit('murmur:refresh'))` | `StubRenderer.setCallCount` increments |
| Pause / Resume | IPC emit `murmur:pause` `true` then `false` | Scheduler stops firing; resumes after unpause |
| Quit restores wallpaper | App close event | `StubRenderer.restoreCallCount` is 1 |

**`refresh-cycle.spec.ts` — Full pipeline E2E**

| Test | Assertion |
|---|---|
| App generates a phrase on startup | Tray tooltip set to stub phrase text |
| Manual refresh triggers new phrase | `StubPhraseGenerator.callCount` increments |
| Bad API key shows error in tray tooltip | Tooltip contains "⚠ Invalid API key" |
| All feeds failing falls back to last phrase | Last phrase remains in tray tooltip |
| Config change (refresh interval) takes effect | Scheduler interval updated without restart |

#### Playwright Artifacts

```typescript
// playwright.config.ts (additions)
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},
reporter: [['html', { outputFolder: 'playwright-report' }]],
```

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `node-canvas` native build fails on packaging | Medium | High | Use `asarUnpack`. Pin version. Pre-test on CI. |
| `sharp` asarUnpack misconfiguration | Medium | High | Document exact `electron-builder` config. Smoke test on a clean machine. |
| Windows 11 future update breaks COM interface | Low | High | DesktopWallpaper COM object is standard. Fallback to basic wallpaper API if needed. |
| macOS Sequoia / future version changes osascript wallpaper API | Low | Medium | AppleScript remains stable. Track OS updates. |
| Gemini model gemini-2.5-flash-lite deprecated | Medium | Low | Config model field allows override. Fallback to next cheapest model. |
| Outer bounds of custom fonts | Low | Low | Only ship 3-4 curated fonts. Target < 5 MB font payload. |

---

## 13. Milestones

| Phase | Scope | Deliverable |
|---|---|---|
| **M0 — Scaffold** | Project setup, electron-vite, TS config, folder structure, test harness | Running Electron shell with tray; `npm test` passes on empty suite |
| **M1 — Core pipeline** | RSS adapter, Gemini adapter, sampler, MurmurService | Console output of phrase; unit tests for all domain logic green |
| **M2 — Wallpaper render** | node-canvas painter, sharp output, WinDesktopWallpaperAdapter | First wallpaper sets on screen; integration test renders all 5 themes |
| **M3 — Themes** | All 5 themes in painter | Theme-switching works via config; PNG output validated |
| **M4 — Tray** | Tray icon, context menu, Refresh/Pause/Quit | Fully controllable from tray |
| **M5 — Settings UI** | React settings window via IPC | Full settings panel working |
| **M6 — Polish** | Animations, overlays, live preview, error handling | Feature-complete v1 |
| **M7 — Testing** | Full test suite: unit + integration + E2E Playwright | `npm run test:all` passes; E2E covers setup wizard, settings, refresh cycle, error handling |
| **M8 — Package** | electron-builder, NSIS installer, asarUnpack config | Installable `.exe`; smoke test on clean Windows VM |

---

## 14. Decisions Log

| # | Decision | Rationale |
|---|---|---|
| TD-01 | Electron as runtime | Cross-platform today; TypeScript/Node ecosystem; tray built-in |
| TD-02 | PNG pipeline for wallpaper | Stable, cross-platform, avoids z-order hacks |
| TD-03 | node-canvas for rendering | Full Canvas 2D API; most creative flexibility |
| TD-04 | Windows DesktopWallpaper COM interface | Sets independent wallpapers per display natively without C++ addons |
| TD-05 | `fast-xml-parser` for RSS | Fastest, dependency-free, TypeScript-native |
| TD-06 | Zod for config validation | Runtime safety + inferred TypeScript types |
| TD-07 | Manual DI, no IoC container | Sufficient for this scale; avoids decorator magic; same as memas |
| TD-08 | `electron-vite` as build tool | Vite-native Electron build; HMR in renderer; single config |
| TD-09 | gemini-2.5-flash-lite | .002/day at 24 refreshes; effectively free for personal use |
| TD-10 | Bundled fonts (3–4 curated) | v1 simplicity; no font loading failure risk; < 5 MB overhead |
| TD-11 | Playwright for E2E | `electron-playwright-helpers` is the standard way to drive Electron in Playwright; matches memas's existing Playwright setup |

---

*End of Technical Specification v0.2*
