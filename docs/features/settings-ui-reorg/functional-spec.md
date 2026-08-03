# Functional Spec: Settings UI information architecture reorganization

| Field | Value |
|-------|-------|
| Status | **Locked** (2026-08-02) |
| Author | Murmur product |
| Created | 2026-08-02 |
| Updated | 2026-08-02 (within-tab + Tone) |
| Feature folder | `docs/features/settings-ui-reorg/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [architecture](../../architecture.md), [repo-restructure](../repo-restructure/functional-spec.md), prior UX review (settings IA Alternative 1) |
| Delivery branch (proposed) | `feature/settings-ui-reorg` |

## Summary

Reorganize the Murmur **Settings** window so navigation and on-screen grouping follow **user tasks** (account, sources, voice, look, displays)—not internal module names or pipeline jargon. **v1 also adds Tone** (generation voice layered on headlines + system prompt). Existing capabilities remain; **IPC and tray semantics** stay the same aside from persisting new config fields. Users get clearer places to edit the API key, RSS feeds, AI prompt, tone/language, visual style (including moods), and per-display options/history.

## Goals

1. **Cohesive mental model** — Settings tell one story: run the app → ingest headlines → generate phrases → style the wallpaper → apply per display → review history.
2. **Task-based top navigation** — Five sidebar destinations with plain-language labels and pipeline ordering.
3. **Single source of truth for moods** — One primary surface to activate aesthetic moods; no competing mood controls that silently diverge.
4. **Correct coupling** — Generation-related controls (prompt, formatting, language, advanced sample size) live together; pure visual controls live together; display-scoped controls live together.
5. **Wizard continuity** — First-run setup uses the same field labels and concepts as post-setup **General** and **News sources**.
6. **Backward-compatible config** — Existing `murmur.config.json` files load without user action; new fields (tone) receive documented defaults.
7. **Testable regression bar** — E2E and unit tests updated so the new IA is the long-term contract.
8. **Tone control** — Users choose generation tone independently of the visible system prompt; tone is applied at Gemini call time.

## Non-goals (v1)

- New moods, themes, RSS features, or tray items beyond Tone and IA moves.
- Changes to on-disk **history** format.
- Surfacing appended tone instructions inside the system prompt textarea (tone is configured separately in UI).
- New IPC channels or changes to preload `window.api` surface semantics.
- Settings search, deep links / URL hash routing per tab, or mobile layout.
- Renaming user-visible wallpaper/tray strings outside Settings (unless required for consistency with new tab titles).
- Merging Settings window with wallpaper view or contextual “settings on the wallpaper.”

## Background & Problem

Today’s Settings sidebar mixes **engineering labels** (“Ingestion & Feeds”) with **marketing labels** (“Aesthetic Moods”) and splits **display context** across **Monitors** and **Phrase History**. The **Feeds** tab bundles API credentials, scheduling, AI prompt, OS startup, and RSS URLs. **Moods** appear on three surfaces (dedicated tab, Appearance dropdown, Feeds prompt presets). **Appearance** mixes wallpaper design with **phrase formatting** toggles that affect AI output and regeneration. This violates common settings IA practice: group by **user intent**, keep **4–5** top-level categories, separate **account/secret** scope from creative preferences, and avoid duplicate controls for the same preset.

## Terminology

| Term | Meaning |
|------|---------|
| Settings window | Electron `BrowserWindow` hosting the React Settings dashboard (not wallpaper `?view=wallpaper`). |
| Tab | A top-level sidebar destination; switches main content without changing app routes. |
| Sub-section | In-page grouping within a tab (e.g. **Monitors** vs **History** under **Displays**); not a sixth sidebar item. |
| Mood | Bundled preset coordinating system prompt, theme, typography, layout, animation, audio, effects, and formatting flags. |
| Voice & prompts | User-facing label for AI generation instructions and markup rules—not a separate backend service. |
| Style | User-facing label for wallpaper look-and-feel, including mood cards and manual visual overrides. |
| General | Account/app lifecycle settings (API key, launch at login, refresh interval). |
| Last visited state | Persisted sidebar tab, **Displays** sub-section (Monitors vs History), and **scroll position** on long tabs (e.g. Style). |
| Advanced (Voice) | Collapsed accordion on **Voice & prompts** for rarely changed generation controls (headline sample size). |
| Tone | Product-controlled instruction layer appended at **Gemini call time**, not edited as part of the system prompt textarea. |
| Tone preset | Built-in option: **No tone**, **Neutral**, **Professional**, **Vulgar**, or **Custom** (user-provided tone text). |
| No tone | No tone instruction appended; generation uses system prompt + headlines only (headline “voice” may still follow RSS). |

## Actors

| Actor | Capabilities |
|-------|----------------|
| Desktop user | Opens Settings from tray; edits config; triggers Refresh Now; completes first-run wizard. |
| Maintainer / CI | Updates E2E selectors and screenshot manifests to match new IA. |

## Availability Rules

- Applies wherever the Settings UI is shown (macOS and Windows builds).
- **Offline/local-first** unchanged: edits still persist via existing save flow.
- **E2E mode** (`MURMUR_E2E`): same stubbed generation behavior; tests assert new labels and tab structure.
- Users with existing config see **no** forced re-setup; wizard only when API key is still empty.

## Screens & Information Architecture

### Sidebar (top → bottom)

| Order | Tab label | User job |
|------:|-----------|----------|
| 1 | **General** | Connect Gemini, control refresh schedule, launch at login |
| 2 | **News sources** | Manage RSS feed URLs |
| 3 | **Voice & prompts** | System prompt, presets, **tone & language**, phrase formatting; **Advanced** includes headline sample size |
| 4 | **Style** | Choose a mood (primary); customize theme, type, layout, motion, effects, overlays |
| 5 | **Displays** | Per-monitor enable/override/preview; phrase history per display |

**Footer (unchanged role):** **Refresh Now** primary action; last refresh time / idle status.

**Sidebar items:** Five tabs each show a **small icon** + label (flat list; no non-clickable section headers).

**Chrome copy:** Sidebar subtitle must **not** imply a single OS (replace platform-specific marketing line with neutral copy, e.g. desktop app tagline).

### Field placement (migration map)

| Control (today) | New home |
|-----------------|----------|
| Gemini API key | **General** |
| Launch at login | **General** |
| Refresh interval | **General** |
| RSS list / add / remove | **News sources** |
| System prompt, preset selector, Apply | **Voice & prompts** |
| Phrase formatting toggles (bold, italic, newlines, mixed fonts) | **Voice & prompts** |
| Output language | **Voice & prompts → Tone & language** |
| Tone (+ custom tone text when Custom) | **Voice & prompts → Tone & language** |
| Headline sample size | **Voice & prompts → Advanced** |
| Mood cards (gallery) | **Style** (top of tab) |
| Mood dropdown on Appearance | **Removed** (use Style mood cards + link/copy only) |
| Theme, font, layout, alignment, animation, audio, grain, vignette, overlays | **Style → Customize** (below moods; progressive disclosure encouraged) |
| Monitor enable, theme override, force render, current phrase snippet | **Displays → Monitors** |
| Phrase history, preview/raw, clear history | **Displays → History** |

### Mood / preset UX rules

1. **Primary activation:** Mood cards live only under **Style**.
2. **Prompt presets on Voice & prompts:** May include mood-linked and standalone presets; when user selects a **mood-linked** preset, behavior must match activating that mood on **Style** (same config outcome). User feedback: **toast only** (no confirm dialog, no persistent inline warning).
3. **No third mood dropdown** elsewhere in Settings v1.
4. **Style** uses **minimal mood state:** tab subtitle + active mood card styling only—**no** amber alert banner.
5. **Activating a mood** sets **tone** to that mood’s default tone (per mood definition); user may change tone afterward on **Voice & prompts**.

### Displays sub-navigation

**Displays** uses visible sub-navigation (tabs, segmented control, or equivalent) with exactly two sections:

- **Monitors** — today’s monitor cards and actions.
- **History** — today’s history list, monitor picker, preview/raw toggle, clear.

One shared monitor selector may be used when it reduces duplication (product preference: avoid asking for the same display twice on one screen).

### Default tab behavior

| Situation | Default sidebar tab |
|-----------|---------------------|
| First open after wizard completes | **General** |
| Returning user opens Settings | **Last visited tab** (persisted) |
| First launch ever (no API key) | Setup wizard (unchanged gate); not the five-tab shell |

Persistence (v1): survives closing and reopening the Settings window on the same machine:

- Last sidebar tab
- Last **Displays** sub-section (Monitors vs History)
- Scroll position on applicable tabs (at minimum **Style**; best effort on other long tabs)

Storage mechanism deferred to technical spec.

### Setup wizard alignment

Wizard collects minimum to start: API key + first RSS URL. Copy and field labels must align with **General** (API key) and **News sources** (first feed). After successful **Start Murmur**, show a **success toast** with one line nudging the user to pick a look in **Style** (non-blocking).

### Within-tab layout and grouping

Cross-tab rules:

| Rule | Decision |
|------|----------|
| Content width | **Mixed:** narrow (~form width) for **General**, **News sources**, **Voice & prompts**; wider for **Style** (mood grid) and **Displays** (monitor cards). |
| Page header | Each tab: **H2 title** + **one-line subtitle** (task description); no duplicate sidebar branding. |
| Cards | Use bordered cards for logical groups; consistent vertical rhythm between cards. |
| Instant save | Controls persist on change as today (except system prompt **Apply** flow unchanged). |

#### General

| Section (top → bottom) | Contents | Presentation |
|------------------------|----------|----------------|
| **Connection** | Gemini API key (password field) | **Card 1.** Inline help + link text to obtain a key (aligned with wizard). |
| **Schedule** | Refresh interval + **last refresh / idle** (mirror sidebar footer) | **Card 2.** Dropdown (15 min … 24 h presets) + helper line about when interval applies. |
| **Startup** | Launch at login | **Card 3.** Toggle row with title + short description (OS startup behavior). |

#### News sources

| Section (top → bottom) | Contents | Presentation |
|------------------------|----------|----------------|
| **Add feed** | URL input + submit | **First card** (action-first). |
| **Active feeds** | List rows | **Second card.** Each row: **primary label** (friendly domain/host), **secondary** full URL (truncate), **Remove** (when &gt;1 feed), **open externally** icon/link. |
| **Empty / edge** | Zero feeds (invalid config edge) | Centered empty state in list card + add form remains available. |

#### Voice & prompts

| Section (top → bottom) | Contents | Presentation |
|------------------------|----------|----------------|
| **Prompt & presets** | Mood-linked + standalone preset select, **Apply** when dirty, system prompt textarea | **One card:** preset row + Apply, then monospace textarea. |
| **Tone & language** | Tone select, optional custom tone text, output language | **One card:** **Tone** first, **Output language** second. When tone = **Custom**, show text field for custom tone instruction in this card. |
| **Markup rules** | Bold, italic, newlines, mixed fonts | **One card;** **2×2 toggle grid**. **Section note** at top: changing markup may regenerate the current phrase. |
| **Advanced generation** | Headline sample size | **Accordion, closed by default** at bottom of tab. |

#### Tone (generation behavior)

| Tone option | Product behavior |
|-------------|------------------|
| **No tone** | Do not append any tone instruction at Gemini call time. |
| **Neutral** | Append fixed neutral-tone instruction (impartial delivery). |
| **Professional** | Append fixed professional-tone instruction. |
| **Vulgar** | Append fixed instruction for a deliberately vulgar informal register (user-facing label **Vulgar**). |
| **Custom** | Append user’s **custom tone text** from config when non-empty. |

- Tone instructions are **not** shown in the system prompt textarea; they are stored in config and combined at generation time (technical spec defines exact prompt assembly order).
- Changing tone persists immediately and **triggers phrase regeneration** with a **toast** explaining the phrase was updated (same class of behavior as formatting-driven regen today).
- **Activating an aesthetic mood** sets tone to that mood’s configured default. **v1:** all existing moods default to **No tone**; the data model **allows per-mood defaults** later without UI change.

Exact instruction copy for built-in tones lives in core/prompts (technical spec); functional requirement is distinct, testable behavior per option above.

#### Style

| Section (top → bottom) | Contents | Presentation |
|------------------------|----------|----------------|
| **Moods** | Mood card grid | **2 columns** on desktop (1 column narrow). **Click whole card** to activate (keyboard/accessibility equivalent required). Active = card border/state. **No** amber alert banner. |
| **Customize** | Manual visual controls | **Always visible.** Four **stacked cards:** **Look** → **Type & layout** → **Motion** → **Overlays**. |
| **Type & layout** | Layout style select | **Short one-line** helper under select; **“About magazine layouts”** expands detail or tooltip—**not** a full paragraph by default. |

#### Displays

| Element | Contents | Presentation |
|---------|----------|----------------|
| **Sub-nav** | Monitors \| History | **Segmented control** under tab title. |
| **Display selector** | Shared monitor picker | Below sub-nav; used by **both** sub-sections. Hidden when only one display is known (optional simplification—if multiple exist, always show). |
| **Monitors** | Enable, override, snippet, Force Render | **Single detail card** for the **selected** display only (not a grid of all displays). |
| **History** | Phrase list, Preview / Raw JSON | Same selected display. **Clear History** top-right of History section (when history non-empty). |

## User Journeys

### Journey A — First-time user

1. User launches Murmur; wizard appears (no API key).
2. User enters API key and first RSS URL; submits **Start Murmur**.
3. Settings shell opens with **General** selected; user sees **toast** suggesting **Style** for a look.
4. User may visit **Style** to activate a mood or stay on **General** to adjust interval/login.
5. User clicks **Refresh Now**; wallpapers update as today.

### Journey B — Returning user tweaks RSS

1. User opens Settings; **last tab**, **Displays** sub-section, and **scroll position** restore when applicable.
2. User selects **News sources**; adds/removes URLs; saves as today (immediate persist).
3. Next scheduled or manual refresh uses updated feeds.

### Journey C — User changes tone

1. User opens **Voice & prompts** → **Tone & language**.
2. User selects **Vulgar** or **Custom** and enters custom text if needed.
3. Next generation reflects tone; system prompt textarea unchanged.

### Journey D — Returning user changes AI voice only

1. User opens **Voice & prompts**.
2. User selects a standalone (non-mood) preset or edits prompt; applies.
3. Wallpaper phrase updates on next regeneration; visual **Style** settings unchanged unless user also edits them.

### Journey E — User reviews past phrases

1. User opens **Displays** → **History**.
2. User picks display; toggles Preview / Raw JSON; optionally clears history.
3. Behavior matches current Phrase History tab (last 10 entries per monitor).

### Journey F — User configures multi-monitor

1. User opens **Displays** → **Monitors**.
2. User disables a display or sets theme override; uses Force Render as today.
3. If no displays known yet, empty state directs user to **Refresh Now** (same as today).

### Journey G — Blocked / error paths

| Case | Expected behavior |
|------|-------------------|
| Save fails (network/key) | Same toast/error behavior as today; user remains on current tab |
| Invalid feed URL on add | Same validation as today (HTTP URL required) |
| Generation error | Tray/state error surfacing unchanged; user may open **Voice & prompts** or **General** to fix key/prompt |
| History load fails | Same error handling as today (no silent empty state masquerading as success) |

## Edge Cases

| Case | Expected behavior |
|------|-------------------|
| User had Appearance tab “favorite” mentally | **Style** contains all former Appearance controls |
| User expects moods under separate sidebar item | **Style** opens with mood gallery first to preserve discoverability |
| Mood-linked preset chosen under Voice | Config updates including mood defaults; **tone** set to that mood’s default |
| Custom tone empty while Custom selected | **Block save**; show validation error; do not persist invalid Custom state |
| Only one RSS feed | Remove still disallowed when sole feed (unchanged rule) |
| headlineSampleSize never edited | Advanced default matches current config default (15) |

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| E2E settings suite green on new selectors | No regression in save/load/refresh/history |
| Reduced duplicate mood controls in UI | Single primary mood surface |
| Qualitative: new user can find API key under **General** without docs | Task IA success |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | IA model | **Alternative 1:** General → News sources → Voice & prompts → Style → Displays |
| 2 | Sidebar order | **Pipeline** (as table above) |
| 3 | Tab after wizard | **General** |
| 4 | Returning default | **Last visited tab + Displays sub-section + scroll** (persisted) |
| 5 | Headline sample size | **Expose in v1** under Voice & prompts → **Advanced** |
| 6 | Feature slug / branch | `settings-ui-reorg` → `feature/settings-ui-reorg` |
| 7 | Mood primary surface | **Style** mood cards only; remove Appearance mood dropdown |
| 8 | Monitors + History | **Merged** under **Displays** with sub-nav |
| 9 | Config / IPC | **Add tone fields** with defaults; **no** IPC contract semantic changes beyond save/load of config |
| 10 | Content width | **Mixed** narrow vs wide by tab |
| 11 | General layout | **Three stacked cards:** Connection → Schedule → Startup |
| 12 | General API help | **Inline help** + link (wizard-aligned) |
| 13 | News sources layout | **Add form first**, feed list second |
| 14 | Voice order | **Prompt & presets card → Tone & language → Markup → Advanced accordion** |
| 15 | Voice markup UI | **2×2 grid** + **section-level regen note** |
| 16 | Voice Advanced | **Accordion, closed by default** |
| 17 | Style customize | **Always open;** four **stacked cards** (Look → Type & layout → Motion → Overlays) |
| 18 | Style mood indicator | **Minimal:** subtitle + active mood on card only (**no** banner/badge) |
| 19 | Displays sub-nav | **Segmented** Monitors \| History |
| 20 | Displays monitor pick | **Shared selector**; **single monitor detail card** |
| 21 | Style mood grid | **2-column** desktop grid |
| 22 | Style mood activate | **Click whole card** (+ a11y) |
| 23 | Style layout help | **Short line + expand/tooltip** for magazine layouts |
| 24 | News feed rows | **Domain label + secondary URL + Remove + open-external icon** |
| 25 | General status | **Last refresh also in Schedule card** |
| 26 | Post-wizard nudge | **Success toast** → Style |
| 27 | Voice preset block | **One card** (preset + Apply + prompt) |
| 28 | Tone & language card | **Tone then language**; card title **Tone & language** |
| 29 | Tone v1 | **No tone, Neutral, Professional, Vulgar, Custom** (+ custom text) |
| 30 | Tone at generation | **Append at Gemini call**; not shown in prompt textarea |
| 31 | Tone vs mood | **Mood activation sets mood’s default tone**; **v1 all existing moods → No tone** |
| 32 | History clear | **Top-right** of History section |
| 33 | Sidebar | **Icons + labels**, flat five items |
| 34 | Persistence v1 | **Tab + Displays sub-section + scroll** (incl. Style) |
| 35 | Custom tone empty | **Block save** with validation |
| 36 | Mood-linked preset UX | **Toast only** when applying from Voice |
| 37 | Tone change regen | **Immediate regeneration + toast** |

## Acceptance Criteria

1. Sidebar shows exactly five tabs in pipeline order with labels: **General**, **News sources**, **Voice & prompts**, **Style**, **Displays**.
2. **General** contains Gemini API key, refresh interval, and launch at login; it does **not** contain RSS URLs or system prompt.
3. **News sources** contains RSS management only; it does **not** contain API key, prompt, or launch at login.
4. **Voice & prompts** contains system prompt, preset control, apply flow, **Tone & language**, phrase formatting toggles.
5. **Tone & language** offers **No tone**, **Neutral**, **Professional**, **Villero**, and **Custom** with text field when Custom; tone affects generation without appearing in the prompt textarea. **Custom** with empty text **cannot be saved**.
6. Changing **tone** (without a full mood activation) **regenerates the current phrase** and shows a **success toast** explaining the update.
7. **Voice & prompts → Advanced** exposes headline sample size within documented min/max behavior already enforced by the product.
8. **Style** contains mood gallery as the first major section and all former Appearance visual controls; there is **no** separate sidebar item **Aesthetic Moods** and **no** duplicate mood dropdown on Style.
9. Activating a mood from **Style** produces the same config state as today’s mood activation from the Moods tab **and** sets **tone** to that mood’s default (**No tone** for all existing moods in v1).
10. Selecting a mood-linked prompt preset under **Voice & prompts** produces the same config state as activating that mood from **Style** (including tone default); user sees **toast only** for cross-tab effects.
11. **Displays** contains **Monitors** and **History** sub-sections with parity to today’s Monitors tab and Phrase History tab features (including preview/raw and clear history).
12. After wizard completion, the selected tab is **General** and a **toast** nudges user toward **Style**.
13. Reopening Settings restores **last sidebar tab**, **last Displays sub-section**, and **scroll position** on long tabs (minimum **Style**).
14. Sidebar footer still provides **Refresh Now** and last-update/idle status; **Schedule** card also shows last refresh/idle.
15. Sidebar tabs show **icon + label**.
16. Platform-specific subtitle under the Murmur logo is replaced with **OS-neutral** copy.
17. All existing unit tests pass; settings-related E2E tests are updated and pass (including screenshot steps if present in CI manifests).
18. Upgraded installs load existing config; **new tone fields** default without breaking load (e.g. **No tone**).
19. **General** uses three separate cards (Connection, Schedule, Startup) in that order; refresh interval shows helper text about when the interval applies.
20. **News sources** shows add-feed UI above the active feeds list; feed rows use domain-primary labeling and external-open affordance.
21. **Voice & prompts** uses one **Prompt & presets** card, then **Tone & language**, then markup 2×2 grid + section regen note; **Advanced** accordion collapsed by default.
22. **Style** mood grid is 2-column; mood activation by card click; no manual-mode banner; customize as four stacked cards; layout help is truncated with expand/tooltip.
23. **Displays** uses segmented sub-nav, shared display selector, **single** monitor detail card, History clear top-right.

## Out-of-Scope Follow-ups (post-v1)

- Settings search and deep links to tabs/sections.
- Onboarding tour highlighting Style after wizard.
- Collapsible “Customize” on Style when a mood is active (user chose always-open for v1).
- Tone instruction **localization** beyond fixed v1 strings.
- Registry-driven settings renderer (declarative metadata for all controls).

## Migration / release approach (product)

Deliver as **one user-visible release** on branch `feature/settings-ui-reorg`: old tab names and routes are removed from the Settings UI in the same change set that introduces the new IA (no long-lived dual navigation). Maintainers update E2E selectors and any screenshot baselines in the same effort. Technical sequencing (file moves, tab types, persistence key for last tab) belongs in [technical-spec.md](./technical-spec.md).

---

**Next step:** Author [technical-spec.md](./technical-spec.md) on branch `feature/settings-ui-reorg`.
