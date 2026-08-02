# Functional Spec: Structured phrase content per layout

| Field | Value |
|-------|-------|
| Status | **Locked** (approved 2026-08-01) |
| Author | Murmur product |
| Created | 2026-08-01 |
| Updated | 2026-08-01 |
| Feature folder | `docs/features/structured-phrase-generation/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [RFC: Structured phrase generation per layout](../../rfc-structured-phrase-generation.md), [architecture](../../architecture.md) |

## Summary

Murmur generates short surreal “proverbs” from headlines and paints them on the desktop wallpaper. Today every layout receives one text blob; magazine-style layouts guess where to split that text, which breaks idioms and punch lines. This feature makes **layout-aware structured content** the product contract: the AI returns validated fields (e.g. headline + deck, left + right halves, or a single `phrase`), Murmur stores and shows that structure, and each layout renders the fields it needs—without heuristic word splits for structured layouts.

## Goals

1. **Semantic fidelity** — Tabloid, split-spread, and pull-quote (and any layout that needs multiple text regions) display text the model intended for each region, not a midpoint word cut.
2. **One generation model per refresh** — Each wallpaper refresh produces one structured payload that matches the **currently selected layout style**.
3. **Full layout coverage in v1** — Every layout style has a defined content shape in v1; layouts that only need a single block of text use a shared **`phrase`** field rather than bespoke multi-field schemas.
4. **Transparent history** — Users can inspect what was generated: a readable preview and raw structured content.
5. **Graceful failure** — When structured generation fails validation, the desktop keeps showing the **last successful** content; Settings surfaces a clear error.
6. **Backward compatibility** — Existing phrase history entries that are plain strings remain viewable and behave as `{ phrase: "<text>" }` for display purposes.

## Non-goals (v1)

- Letting users edit layout content schemas or field definitions in the UI.
- Shipping a local/offline AI provider (e.g. Ollama) as part of this feature—only the product requirement that generation stays **swappable** behind the same behavior.
- Changing theme, animation, or monitor/wallpaper mechanics unrelated to text structure.
- Re-architecting prompt presets beyond what is needed to produce structured output per layout.

## Background & Problem

Users choose layout styles (centered proverb, tabloid front page, split spread, pull quote, etc.) for aesthetic and readability. The product promise is “headline-driven surreal poetry on your wallpaper.” Heuristic splitting of one string cannot know clause boundaries or which line is the “headline” vs “deck,” so magazine layouts often look broken compared to the model’s implicit structure. Headlines already influence generation; the missing piece is **carrying structure from generation through storage to rendering**.

## Terminology

| Term | Meaning |
|------|---------|
| Layout style | User-selected visual template (e.g. `tabloid-stack`, `centered`). |
| Content shape | The set of named fields a layout expects (e.g. `phrase` only vs `headline` + `deck`). |
| Structured content / payload | Validated field values for one generation event, tied to one layout style. |
| Refresh | A new generation cycle (interval, manual refresh, or layout change that triggers regen). |
| Legacy phrase entry | History record stored as a plain string before structured storage. |
| Preview (history) | Human-readable summary derived from the payload (e.g. headline text for tabloid). |
| Raw JSON (history) | Pretty-printed structured payload for inspection. |

## Actors

| Actor | Capabilities |
|-------|----------------|
| Desktop user | Selects layout, themes, and prompts; views wallpaper; opens Settings (including Phrase History). |
| Murmur app | Schedules generation, validates content, updates wallpaper and history, shows errors in Settings. |
| AI provider (Gemini in v1) | Returns structured text fields per request; not a user-facing actor. |

## Availability Rules

- Structured generation applies whenever Murmur would today generate a new phrase for the active configuration.
- **Layout style change** uses the new layout’s content shape and triggers a **new generation** (same as today’s expectation that layout affects output).
- Feature is available on all platforms Murmur supports; wallpaper may be overlay or injected per platform, but **content behavior is identical**.
- If API keys or network are missing, existing Murmur rules apply (no new product behavior beyond structured vs string).
- E2E/test modes may use fixtures instead of live AI; product behavior in production remains “real generation + validation.”

## User Journeys

### Journey A — Happy path: magazine layout

1. User selects **Tabloid stack** (or split-spread / pull-quote) and a theme.
2. Murmur refreshes on the usual interval (or user triggers refresh).
3. AI returns structured fields appropriate to the layout (e.g. headline, optional deck).
4. Wallpaper shows regions filled from those fields; animation runs as configured.
5. User opens Settings → Phrase History, sees **Preview** (e.g. headline line) and can switch to **Raw JSON** to inspect all fields.

### Journey B — Happy path: classic layout using `phrase`

1. User selects **Centered** (or another classic layout).
2. On refresh, AI returns a payload whose primary content is the shared **`phrase`** field (markdown allowed per current product rules).
3. Wallpaper renders as today’s single-block layouts do, without relying on string splitting heuristics for structure.

### Journey C — Layout switch

1. User has a successful **Centered** phrase on screen.
2. User switches to **Split spread**.
3. Murmur generates new structured content with **left** and **right** (or equivalent) fields; wallpaper updates to the spread layout with semantically chosen halves.

### Journey D — Invalid structured response (error path)

1. User has valid content on the wallpaper from a prior successful refresh.
2. A refresh fails because the AI response cannot be validated after retries.
3. **Wallpaper unchanged** — still shows last successful structured content (or legacy phrase mapped to `phrase`).
4. Settings shows an **error toast/message** explaining that the latest generation failed; history does **not** add a broken entry (or only adds success entries—see edge cases).

### Journey E — Legacy history

1. User upgrades to a build with structured history.
2. Old history lines appear in Preview as the proverb text; Raw JSON view shows equivalent `{ "phrase": "…" }` semantics for display.

## Screens & Information Architecture

| Surface | Change |
|---------|--------|
| Desktop / wallpaper | Renders from structured fields per layout style (no user-visible “JSON on desktop”). |
| Settings — layout & mood tabs | Unchanged selectors; changing layout still triggers regen per availability rules. |
| Settings — Phrase History | Each entry: timestamp/context as today; **toggle Preview \| Raw JSON**; Preview uses layout-aware labeling (headline vs quote vs phrase summary). |
| Tray / menu bar (if plain-text summary exists) | Continues to show a short plain-text summary derived from payload (e.g. primary field), consistent with today’s “last phrase” affordance. |

No new top-level navigation; no schema editor screen in v1.

## Content shapes (product contract)

v1 defines a content shape for **every** `LayoutStyleName`. Layouts that need one text block use the shared shape:

- **`phrase`** (required, markdown-capable) — centered, scattered, editorial-left, editorial-right, asymmetrical, book-cover.

Layouts that need multiple regions use dedicated fields (names are product-stable; exact optional fields follow layout design):

| Layout style | Primary structured intent |
|--------------|---------------------------|
| `tabloid-stack` | Headline + optional supporting lines (deck/kicker) |
| `split-spread` | Left and right columns, each a complete clause/half |
| `pull-quote` | Quote body + optional attribution |

Markdown emphasis and inline formatting remain allowed **inside** markdown-designated fields, matching today’s proverb styling rules.

## Sync / notifications / privacy

- Phrase content stays **local** to the machine (history file / app data) as today; no new cloud sync.
- History **Raw JSON** may contain full generated text; same privacy posture as current phrase history (user’s disk, user’s API calls to Gemini).
- Error toasts in Settings must not include API keys or raw provider error payloads with secrets.

## Edge Cases

| Case | Expected behavior |
|------|---------------------|
| Validation fails after retries | Keep previous wallpaper content; show Settings error; do not replace wallpaper with empty or garbage text. |
| First-ever generation fails | No prior content: wallpaper shows theme/background without new text (or existing empty state behavior); Settings shows error. |
| User toggles Preview / Raw JSON | Instant switch without network; Raw shows pretty-printed structured payload. |
| Legacy string in history | Preview shows string; Raw shows `{ phrase: "<legacy>" }` equivalence for reading. |
| User changes layout mid-interval | New spec → new generation; history records new entry on success. |
| Very long field text | Layout typography may clip or shrink per existing layout rules; no silent truncation of stored history. |
| Language / prompt changes | Same structured pipeline; content shape still driven by layout style. |

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| E2E screenshots for magazine layouts show coherent headlines/halves without “split mid-idiom” artifacts | Core problem solved |
| Reduced reliance on heuristic split in user-visible layouts | Structural path is default |
| History toggle usable without support docs | Transparency goal met |
| No increase in “blank wallpaper after refresh” reports when API is healthy | Failure path preserves last good state |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Invalid structured output | Keep **last successful** wallpaper content; surface error in **Settings only** (toast/message). |
| 2 | Phrase History v1 | **Toggle: Preview \| Raw JSON**; Preview is schema-aware per layout. |
| 3 | v1 layout scope | **All layout styles** ship with a defined content shape in one release; single-block layouts share **`phrase`**. |
| 4 | Layout change | Changing layout style triggers **new generation** with that layout’s shape. |
| 5 | Markdown in fields | Allowed in markdown-designated string fields; same proverb emphasis conventions as today. |
| 6 | Legacy history | Plain strings display as **`phrase`** semantics in Preview/Raw. |
| 7 | Storage truth | Persist **validated structured content** per successful generation (not only a flattened string). |
| 8 | Heuristic splits | Layouts with dedicated multi-field shapes must **not** depend on word-count splits for primary content in v1. |
| 9 | Schema editing | **Not in v1** (no user-facing schema editor). |
| 10 | AI provider v1 | **Gemini** for production generation; alternate providers are future engineering, not v1 product scope. |

*Decisions 4–10 align with [RFC](../../rfc-structured-phrase-generation.md) v1; rows 1–3 confirmed in product Q&A 2026-08-01.*

## Acceptance Criteria

1. **Registry coverage** — For each layout style in the app selector, documentation in this spec’s content-shape table is implemented: classic layouts use `phrase`; tabloid, split-spread, and pull-quote use their multi-field shapes.
2. **Generation** — On successful refresh, Murmur obtains a validated payload matching the active layout’s shape before updating wallpaper state.
3. **Rendering** — Tabloid, split-spread, and pull-quote wallpapers display content from structured fields; automated visual checks (E2E screenshots) show legible, non-random splits for fixture/live samples.
4. **Classic layouts** — Centered (and other `phrase`-only layouts) render the `phrase` field without requiring heuristic split for structure.
5. **Failure** — Simulated invalid AI output leaves wallpaper on previous successful content and shows an error in Settings.
6. **History Preview** — Successful entries show a one-line (or short) preview appropriate to layout (e.g. headline, or phrase text).
7. **History Raw** — Same entries show pretty-printed structured JSON in Raw mode.
8. **History toggle** — User can switch Preview ↔ Raw without leaving the history list.
9. **Legacy entries** — Pre-migration string entries appear in Preview and Raw as `{ phrase: … }` semantics.
10. **Layout switch** — Changing from a `phrase` layout to split-spread triggers new generation; wallpaper reflects new left/right content after success.
11. **Tray/summary** — Menu bar or tray “last phrase” summary remains meaningful (derived from primary field).
12. **No regression** — Existing themes, animations, and interval refresh behavior work with structured content enabled.

## Out-of-Scope Follow-ups (post-v1)

- User-editable content shapes or per-field prompt hints in Settings.
- Ollama or other local model as a user-selectable provider.
- Cross-device sync of structured history.
- In-history editing of fields before “pinning” to wallpaper.
- Multiple schema versions per layout with user-visible migration UI.

---

**Follow-up:** [technical-spec.md](./technical-spec.md). Implementation follows loop-build after technical spec review.
