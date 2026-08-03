# Configuration

All settings are edited in the **Murmur Settings** window (tray menu). Changes to **Style** and **Voice & prompts** use an **Apply** bar when you have uncommitted edits; **General** and **News sources** save directly.

## Settings tabs

### General

Applies to the **whole app** (all displays):

- **Gemini API key** — required for refresh; password field
- **Refresh interval** — how often Murmur fetches feeds and regenerates
- **Launch at login** — start Murmur when you sign in
- **App version / updates** — manual check and update status (platform-specific install)

![General tab](../../assets/screenshots/settings-general.png)

### News sources

RSS feed URLs Murmur fetches on each refresh. Failed feeds are skipped; generation uses whatever titles were retrieved.

![News sources tab](../../assets/screenshots/settings-news.png)

### Voice & prompts

Controls how Gemini writes from headline text:

- **Prompt preset** and custom **system prompt**
- **Tone** and **output language**
- Markup and advanced options where exposed in the UI

Per-display when multiple monitors are configured (see below).

![Voice & prompts tab](../../assets/screenshots/settings-voice.png)

### Style

**Aesthetic moods** (e.g. Zen Study, Rogue Terminal) bundle theme, font, layout, and animation. You can customize further after choosing a mood.

Apply mood or appearance changes, then use **Refresh Now** to regenerate the on-screen phrase with the new look.

![Style tab](../../assets/screenshots/settings-style-moods.png)

### History

Recent generated phrases for the **selected display**, with preview or raw JSON for structured layouts.

![History tab](../../assets/screenshots/settings-history.png)

## Multiple displays

When more than one monitor is connected, the sidebar **display selector** chooses which profile you edit for **News sources**, **Voice & prompts**, **Style**, and **History**.

**General** always applies globally. Some builds expose a **sync** control to mirror tab settings across displays—see in-app tooltips on the sync icon.

## Tray

From the tray icon you can open Settings, trigger refresh, and quit. Wallpaper may render as a live overlay or painted image depending on platform and animation settings (see [architecture.md](../architecture.md)).

## Related

- [Getting started](getting-started.md)
- [Architecture](../architecture.md) — config file names and adapter behavior
