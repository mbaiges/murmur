# Functional Spec: Style & Voice settings polish

| Field | Value |
|-------|-------|
| Status | **Locked** (2026-08-02) |
| Author | Murmur product |
| Created | 2026-08-02 |
| Updated | 2026-08-02 (mood→prompt/tone staging; unified Apply; no instant regen) |
| Feature folder | `docs/features/style-voice-settings-polish/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [settings-ui-reorg](../settings-ui-reorg/functional-spec.md) (partial supersession — see **Conflicts**), [architecture](../../architecture.md) |

## Summary

Improve **Style** and **Voice & prompts** so personalization is **layered and scannable** (Background → Phrase → Widgets), **visual controls** replace unnecessary dropdowns, and **Gemini runs only when needed—and only once—when the user clicks Apply changes**. Settings keeps a **unified pending draft** (Style visuals, mood, system prompt, tone, language, markup, and related generation fields). **No instant persist or regeneration** while editing. Selecting a **mood** stages that mood’s **visual bundle, system prompt, and tone defaults** into the draft; nothing reaches disk or the wallpaper pipeline until Apply. The backend **re-renders** for visual-only deltas and **regenerates at most once** when the applied delta includes content-affecting fields. Style includes a **sticky mini wallpaper preview** driven by the draft.

## Goals

1. **Layer-based Style IA** — **Background**, **Phrase** (with **Motion** subsection), **Widgets**, below the mood gallery.
2. **Richer selection UI** — Theme swatches, alignment segmented control, grain/vignette chips, animation chips, layout thumbnail picker, font preview; Voice tone chips with **tone + output language on one row**.
3. **Unified draft + Apply** — Style and Voice edits share one pending draft; **Apply changes** commits in a **single save**; **Reset draft** reverts all pending fields.
4. **Mood staging** — Mood card selection updates draft **visuals plus linked system prompt and tone** (same outcome as today’s mood activation after Apply, without mid-edit side effects).
5. **Regeneration economics** — **Zero Gemini calls** during drafting; on Apply, **zero** if delta is visual-only, **exactly one** if any content-affecting field changed.
6. **Preview before commit** — Sticky mini preview on Style reflects draft styling (best effort; fidelity in technical spec).
7. **Cohesive patterns** — Shared chip/segmented components across Style and Voice.

## Non-goals (v1)

- New moods, themes, layouts, or RSS features.
- Draft/Apply on **General**, **News sources**, or **Displays** (remain save-on-change).
- Live full-size preview on Voice tab.
- Mobile/narrow-window polish beyond reasonable collapse.
- Changing IPC channel names or history on-disk format.
- Separate per-field Save buttons on Voice (system prompt **Apply** is replaced by unified **Apply changes**).

## Background & Problem

Style and Voice today persist on many controls immediately and trigger **`refresh()`** (RSS + Gemini) for broad “appearance” and tone changes. Users pay latency and token cost per click. Mood activation immediately rewrites prompt, tone, and visuals. This feature supersedes **settings-ui-reorg** where it conflicts (mood immediacy, tone immediacy, Style section names, immediate Style save).

## Terminology

| Term | Meaning |
|------|---------|
| Committed config | Last successfully saved config in the config store (source of truth on disk). |
| Pending draft | In-memory overlay on committed config for Style + Voice fields listed below; optional session persistence is a technical-spec choice. |
| Apply changes | Writes pending draft to config store once; runs re-render and/or at most one regeneration per rules below. |
| Reset draft | Discards pending draft; restores UI from committed config. |
| Mood bundle | Preset package: visual fields + **system prompt** + **tone** defaults (same set as today’s mood activation). |
| Background / Phrase / Widgets | Canvas, text/motion, overlay layers (see IA). |
| Visual-only delta | Applied change set that does not require new AI output for current headlines. |
| Content-affecting delta | Applied change set that requires new Gemini output (technical spec enumerates fields). |
| Mini preview | In-settings React preview (not a second wallpaper window): shared wallpaper presentation + Settings chrome; draft styling on committed phrase/content. See [technical-spec](./technical-spec.md#renderer-preview-architecture-aligned-with-architecturemd). |

### Fields in pending draft (functional)

| Area | Draft fields |
|------|----------------|
| Mood | Selected mood id (or Custom if user overrides away from a pure preset) |
| Style — Background | theme, noiseIntensity, vignetteStyle |
| Style — Phrase | fontFamily, textAlignment, layoutStyle, animation, audioFeedback |
| Style — Widgets | overlays (dateTime, sourceCredit, inspiringHeadlines) |
| Voice / generation | systemPrompt, tonePreset, customToneText, language, enableBold, enableItalic, enableNewlines, enableDifferentFonts, headlineSampleSize (Advanced) |
| Prompt preset picker | Changing preset updates **draft** systemPrompt (and mood-linked tone when preset is mood-linked), not committed config |

## Actors

| Actor | Capabilities |
|-------|--------------|
| Desktop user | Edits pending draft on Style and Voice; **Apply changes** or **Reset draft**; no generation while drafting. |
| Maintainer / CI | E2E asserting zero Gemini during edits, one max on Apply, mood bundle parity. |

## Availability Rules

- Settings on macOS and Windows; E2E stubs can count generation calls.

## Conflicts with settings-ui-reorg

| Topic | settings-ui-reorg | This feature |
|-------|-------------------|--------------|
| Mood activation | Immediate | Stages **visuals + prompt + tone**; commits on **Apply** |
| Style sections | Look → … → Overlays | **Background → Phrase → Widgets** |
| Style / Voice save | Immediate | **Unified draft** until Apply |
| Tone / prompt regen | Immediate on change | **Only on Apply** when delta is content-affecting |
| System prompt Apply | Separate button | Part of unified **Apply changes** |
| Toast on tone | Immediate “phrase updated” | Toast only after **Apply** (look updated vs regenerated) |

## Screens & Information Architecture

### Shared chrome

| Element | Behavior |
|---------|----------|
| **Apply changes** | Primary; visible when pending ≠ committed (shown on **Style** and **Voice** — same action, either entry point). |
| **Reset draft** | Secondary; reverts entire pending draft. |
| Dirty navigation | Confirm before discarding pending draft when switching sidebar tab or closing Settings. |

### Style tab (top → bottom)

| Block | Contents | Interaction |
|-------|----------|-------------|
| **Header** | Title + subtitle (layers; changes apply when you click Apply) | — |
| **Mini preview** | Sticky preview with **draft** styling on **committed** phrase/content | No Gemini |
| **Moods** | 2×2 mood cards | Select mood → stage **mood bundle** (visuals + **system prompt** + **tone**) in pending draft |
| **Background** | Theme swatches, grain chips, vignette chips | Draft |
| **Phrase** | Font preview, alignment segmented, layout thumbnails (+ fallback), **Motion**: animation chips + audio toggle | Draft |
| **Widgets** | Three overlay toggles | Draft |

Manual tweaks after picking a mood remain in draft; mood re-select replaces mood-driven draft defaults (technical spec: merge rules vs user overrides).

### Voice & prompts

| Block | Interaction |
|-------|-------------|
| **System prompt** | Preset dropdown + textarea edit **draft** systemPrompt only; **no** separate Apply button |
| **Tone & language** | Tone chips + output language on **one row**; custom tone textarea when Custom — all **draft** |
| **Markup rules** | 2×2 toggles — **draft** |
| **Advanced** | headlineSampleSize — **draft** |

Cross-tab: edits on Voice and mood on Style share the **same** pending draft (one prompt, one tone state).

## Regeneration & Apply behavior

### While editing (before Apply)

- **No** `config:save` for draft fields.
- **No** Gemini / RSS refresh.
- Mini preview updates from draft styling only.
- Mood selection stages prompt and tone in draft (user-visible on Voice tab when navigated).

### On **Apply changes**

1. Validate draft (e.g. custom tone non-empty when tone is Custom — same rules as today, but at Apply time).
2. Persist **full pending draft** to config store in **one** save.
3. Compare **committed-before** vs **new committed** delta.
4. If delta is **visual-only**: update wallpaper renderer(s) with existing `lastPhrases` / `lastContent` — **no** Gemini.
5. If delta includes **any content-affecting field**: run **exactly one** regeneration (full refresh pipeline once, not per field).
6. Toast: **“Look updated”** vs **“Phrase regenerated…”** when Gemini ran; **never** toast/regen on individual control changes.

### Mood bundle (locked)

Selecting a mood in Style draft must stage at minimum:

- All visual fields the mood sets today (theme, font, layout, animation, effects, formatting flags, etc.).
- **systemPrompt** to the mood’s prompt.
- **tonePreset** (and **customToneText** if applicable) to the mood’s tone default (**No tone** for existing moods in v1 unless mood data says otherwise).

After Apply with only that mood selected (no other edits), committed config must match today’s immediate mood activation.

## User Journeys

### Journey A — Theme tweaking

1. User changes theme swatches several times; preview updates; Apply bar shows dirty.
2. User clicks **Apply changes** once → re-render only, **no** Gemini.

### Journey B — Mood then Apply

1. User selects **Gothic Novelist** on Style → draft prompt/tone/visuals update; Voice tab would show same draft prompt if opened.
2. User clicks **Apply changes** → one save; regeneration runs **only if** content-affecting vs previous committed (mood switch typically **yes** once).

### Journey C — Voice tone without instant regen

1. User opens Voice; clicks through tone chips and language — draft only, **no** Gemini.
2. User **Apply changes** → if tone/language/markup/prompt delta is content-affecting, **one** regeneration; if user changed tone then changed back before Apply, delta empty → **no** regen.

### Journey D — Visual + layout in one session

1. User changes theme (draft) and layout thumbnail (draft).
2. Single **Apply** → **one** regeneration (layout is content-affecting), not two.

## Edge Cases

| Case | Expected behavior |
|------|-------------------|
| Apply with no API key | Save draft; no regeneration |
| Dirty draft; switch tab / close Settings | Confirm discard |
| Reset draft | Pending = committed; preview resets |
| Mood select then Reset | Prompt/tone/visuals revert to committed |
| Only widgets toggled | Apply → re-render only |
| Prompt edited on Voice; mood picked on Style | Last writer wins per field per technical spec merge rules; one Apply commits all |
| Preset dropdown on Voice | Updates draft prompt immediately in UI, not disk |
| E2E captured phrase mode | Documented test behavior preserved where required |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Scope | Style + Voice polish |
| 2 | Style sections | Background → Phrase → Widgets; Motion inside Phrase |
| 3 | Layout | Stacked cards + sticky mini preview |
| 4 | Draft scope | **Unified** Style + Voice generation draft |
| 5 | Mood | Stages **visuals + system prompt + tone**; commits on Apply only |
| 6 | Regeneration | **Never** on edit; **at most once** on Apply when content-affecting |
| 7 | Visual vs content | Backend split: visual-only Apply → re-render only |
| 8 | Voice tone/language | Chips + one row; **draft only** until Apply |
| 9 | System prompt | **No** separate Apply; unified Apply changes |
| 10 | Control patterns | Swatches, segmented alignment, grain/vignette chips, animation chips, layout thumbnails + fallback, font preview |
| 11 | Widgets UI | List toggles (unchanged pattern) |
| 12 | Apply UI | Same Apply/Reset available from Style and Voice when dirty |
| 13 | Delivery | Feature folder `style-voice-settings-polish` |
| 14 | User confirm 2026-08-02 | (1) Mood includes prompt + tone in draft until Apply. (2) No instant regen anywhere in this feature—Apply only when needed. |

## Acceptance Criteria

1. Style IA: **Background**, **Phrase** (with Motion), **Widgets**, below mood gallery.
2. Mood card click updates pending draft **including systemPrompt and tonePreset/customToneText** per mood bundle; committed config unchanged until Apply.
3. **Apply changes** persists entire pending draft in one save; **Reset draft** restores from committed.
4. **No** Gemini invocation while toggling draft controls (E2E/stub countable).
5. Apply with **visual-only** delta → **zero** Gemini invocations.
6. Apply with **content-affecting** delta → **exactly one** Gemini invocation (not N for N draft edits).
7. Mood-only Apply (no extra edits) → committed config **equivalent** to legacy immediate mood activation.
8. Mini preview on Style reflects draft styling; uses committed phrase/content until next successful regeneration.
9. Voice: tone chips + tone/language one row; markup and prompt edits are draft-only; **no** standalone prompt Apply button.
10. Dirty draft: confirm on sidebar tab change and Settings close.
11. Toasts only after Apply; distinguish look updated vs phrase regenerated.
12. Selecting tone/language/prompt presets during draft does not persist or regenerate until Apply.

## Out-of-Scope Follow-ups (post-v1)

- Draft/Apply for General, News sources, Displays.
- Full wallpaper preview on Voice.
- Widget overlay chip group.
- Collapsing customize sections when mood active.
