# Functional Spec: Background image (gradient, photo, AI)

| Field | Value |
|-------|-------|
| Status | **Locked** (2026-08-04) |
| Author | Murmur product |
| Created | 2026-08-04 |
| Updated | 2026-08-04 (locked; open items resolved in technical spec) |
| Feature folder | `docs/features/background-image/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [style-voice-settings-polish](../style-voice-settings-polish/functional-spec.md), [per-monitor-settings](../per-monitor-settings/functional-spec.md), [architecture](../../architecture.md) |

## Summary

Today Murmur paints wallpapers with **fixed gradient themes** (Style → Background). This feature adds **three background sources per display profile**: keep **gradient themes** (current behavior), use a **personal photo**, or **AI-generated art** via a swappable image provider (v1: **Cloudflare Workers AI / FLUX Schnell**). AI backgrounds use **preset image prompts** (Voice-style preset picker + custom text) and a **Gemini text step** that turns sampled headlines + preset instructions into a short image prompt on each **phrase refresh**. Cloudflare credentials live in **General** (global, like the Gemini API key). Style edits stay in the **unified draft + Apply** model; **new AI images are not generated on Apply alone**—they run on the same refresh cycle as phrase generation.

## Goals

1. **Three background modes** — Per display: **Gradient** (existing themes), **Personal photo**, or **AI generated**.
2. **Consistent Settings UX** — Background controls live in Style → **Background**, using the same **draft / Apply changes / Reset draft** rules as [style-voice-settings-polish](../style-voice-settings-polish/functional-spec.md).
3. **AI prompt presets** — Preset dropdown + editable custom prompt, patterned after **Voice → System prompt** (mood-linked presets where useful + standalone presets + **Custom**).
4. **Headline-aware AI art** — On each phrase refresh in AI mode, **Gemini** produces a concise image prompt from **that display’s sampled headlines** and the committed **background preset / custom instructions**; then the **image provider** returns a wallpaper-sized background.
5. **Layering parity** — Photo and AI modes **replace the theme gradient** as the base layer; **grain, vignette, phrase, and widgets** behave like today (same as personal photo choice: full Style stack on top).
6. **Swappable provider** — Product treats image generation as an optional capability behind a clear contract (v1 implementation: Cloudflare + FLUX; details in technical spec).
7. **Per-display profiles** — Background mode, photo, and AI preset fields follow **display profile** + **Style tab sync mesh** rules from [per-monitor-settings](../per-monitor-settings/functional-spec.md).
8. **Graceful degradation** — Missing keys, quota errors, or provider failures must not blank the desktop; user sees actionable feedback in Settings.

## Non-goals (v1)

- Google **Imagen / Gemini image API** or billing tied to **Google AI Pro** subscription.
- Generating backgrounds **on every Style control tweak** or on **Apply** when only visual fields change (AI images only on **phrase refresh** in AI mode).
- In-app **image editing** (crop, filters, inpainting).
- **Multiple photos** per display or photo albums / slideshow.
- **Cloud sync** of photos or generated images.
- New **mood cards** or new gradient theme names (existing theme enum remains the gradient palette).
- Automatic switch of background **mode** when user picks a mood (mood may still stage **gradient theme** and voice bundle; AI background preset selection stays explicit unless user picks a mood-linked background preset in draft).
- User-facing **provider picker** (Cloudflare only in v1).
- Storing generated images in **phrase history** (history remains phrase-focused).

## Background & Problem

Users want wallpapers that feel personal or tied to the news cycle, not only flat gradients. Murmur already refreshes phrases from headlines on a schedule; reusing that moment for a **matching visual backdrop** fits the product story. Image APIs should stay **optional and free-tier friendly** (Cloudflare daily neurons), with secrets and rate limits handled like Gemini today.

## Terminology

| Term | Meaning |
|------|---------|
| Background mode | One of **gradient**, **photo**, or **ai** for a display profile. |
| Gradient mode | Current behavior: `theme` selects a built-in gradient (Midnight, Drift, …). |
| Personal photo | User-selected image file; app keeps a durable reference under app data (technical spec). |
| AI background preset | Named template instructing how headlines should influence visual mood (parallel to **prompt preset**, not phrase **system prompt**). |
| Custom background prompt | User-edited instructions used when preset is **Custom**. |
| Image prompt | Short text sent to the image provider after Gemini composes it from headlines + preset. |
| Phrase refresh | One Murmur cycle: sample headlines → generate phrase (and in AI mode, image prompt + image fetch) → update wallpaper. |
| Image provider | External text-to-image service (v1: Cloudflare Workers AI). |
| Base layer | Bottom of the painted/overlay stack: gradient, photo, or AI bitmap. |
| Committed config / pending draft | Same as style-voice-settings-polish. |

## Actors

| Actor | Capabilities |
|-------|--------------|
| Desktop user | Chooses background mode, photo, AI presets; sets Cloudflare credentials in General; Apply/Reset Style draft. |
| Murmur app | Orchestrates refresh pipeline, caches last good background per display, composites layers. |
| Gemini (text) | Phrase generation (existing) + **image prompt composition** in AI mode. |
| Cloudflare Workers AI (v1) | Text-to-image for AI mode. |

## Availability Rules

- Background mode and related fields are **per display profile** on the Style tab (respect tab sync mesh when enabled).
- **Cloudflare Account ID** and **API token** are **global** (General tab), optional until AI mode is used.
- **Gradient mode** works offline with no Cloudflare credentials.
- **Photo mode** works offline once the file is imported.
- **AI mode** requires network, valid Cloudflare credentials, and Gemini for image prompt composition (same API key rules as phrase generation).
- E2E/test builds may stub the image provider; production behavior uses real Cloudflare when configured.

## Screens & Information Architecture

### General tab

| Control | Behavior |
|---------|----------|
| **Cloudflare Account ID** | Optional text field; global. |
| **Cloudflare API token** | Optional secret field (masked); global. |
| Helper copy | Explain free tier, no card required on Workers Free, link to Cloudflare docs; tokens stored locally like Gemini key. |

### Style tab → Background (extends existing section)

| Block | Contents | Interaction |
|-------|----------|-------------|
| **Background source** | Segmented or radio group: **Gradient** \| **Personal photo** \| **AI generated** | Updates **draft** only |
| **Gradient** (when selected) | Existing **theme swatches** (unchanged set) | Draft |
| **Personal photo** (when selected) | Choose file button, filename/thumbnail preview, clear/remove | Draft; import on Apply (technical spec) |
| **AI generated** (when selected) | Preset dropdown (mood-linked group + standalone group + Custom), textarea for preset/custom instructions | Draft; mirrors Voice preset UX patterns |
| **Shared** | Grain + vignette chips (unchanged) | Draft |

Mini preview (Style sticky preview) reflects draft **mode** and, where possible, last committed/cached photo or AI image for that display; fidelity limits in technical spec.

### Voice tab

No new blocks in v1. Phrase **system prompt** and **background AI preset** remain separate products (user may align them manually).

## Refresh & Apply behavior

### While editing (draft)

- Changing background mode, theme, photo, or AI preset updates **pending draft** only.
- **No** Cloudflare calls; **no** Gemini image-prompt calls.
- Mini preview best-effort update without hitting providers.

### On **Apply changes**

- Persist background fields with the rest of the Style/Voice draft in **one save**.
- **Gradient / photo** Apply: re-render wallpaper with existing phrase content using new base layer (no new Gemini phrase unless other content-affecting fields changed—existing [config delta](../style-voice-settings-polish/functional-spec.md) rules).
- **AI preset/mode** Apply alone: **does not** require an immediate Cloudflare request; committed settings take effect on the **next phrase refresh**.
- If Apply bundle includes **content-affecting** voice/style fields, **one** phrase regeneration runs as today; if display is in **AI mode**, that same refresh also runs **one** image-prompt Gemini call + **one** image generation.

### On each **phrase refresh** (AI mode)

1. Sample headlines for the display (existing).
2. Gemini: structured phrase (existing).
3. Gemini: **image prompt** from sampled headlines + committed background preset/custom instructions.
4. Image provider: generate image bytes.
5. Composite base layer + grain/vignette + phrase + widgets; update overlay and/or static wallpaper per platform.

**Locked:** AI background updates **with phrase refresh**, not on a separate timer and not on every Apply.

## User Journeys

### Journey A — Gradient (status quo)

1. User leaves background source on **Gradient**, picks **Forest** swatch in draft.
2. Apply → re-render only, no new phrase if no content delta.

### Journey B — Personal photo

1. User selects **Personal photo**, chooses a file in draft, sees preview.
2. Apply → app imports/stores file, re-renders with photo as base + grain/vignette + phrase.

### Journey C — AI preset + refresh

1. User adds Cloudflare credentials in General.
2. On Style, selects **AI generated**, picks preset **“Moody abstract (Zen)”**, Apply.
3. On next scheduled (or manual) refresh, Gemini builds image prompt from headlines + preset; Cloudflare returns art; wallpaper updates with new phrase.

### Journey D — Custom AI instructions

1. User selects **Custom** background preset, edits textarea (“no text in image, soft fog, colors from headlines metaphorically”).
2. Apply; next refresh uses those instructions in the Gemini image-prompt step.

### Journey E — Cloudflare failure

1. Display in AI mode; Cloudflare returns quota or auth error on refresh.
2. Wallpaper keeps **last successful AI image**, or if none, **committed gradient theme** as fallback base.
3. Settings shows error toast/banner; phrase refresh may still succeed independently (technical spec: exact coupling).

### Journey F — Missing credentials

1. User selects AI mode and Apply without Cloudflare token.
2. Refresh attempts fail provider step; fallback as Journey E; General tab surfaces missing credential hint.

### Journey G — Per-display sync

1. Two displays; Style tab sync **off** for display B.
2. Display A uses AI preset X; display B uses Gradient **Parchment**—each refresh uses its own profile.

## Edge Cases

| Case | Expected behavior |
|------|-------------------|
| Switch AI → Gradient on Apply | Next re-render uses theme gradient; no Cloudflare on Apply |
| Switch Gradient → AI on Apply | No Cloudflare until next phrase refresh |
| Replace personal photo on Apply | Old app-managed copy superseded per technical spec retention rules |
| Invalid/corrupt photo file | Apply validation error; draft not committed |
| Gemini image-prompt fails | Fallback background; phrase may still update if phrase step succeeded |
| Phrase generation fails | Existing phrase/background retention rules; no partial broken wallpaper |
| Very long custom background prompt | Validated at Apply (reasonable max length; exact limit in technical spec) |
| Headline sample empty | Image prompt step uses preset alone with explicit “no headlines” semantics |
| Multi-monitor refresh | Each enabled display in AI mode may call Cloudflare once per refresh cycle |
| Daily Cloudflare quota exhausted | Clear error; fallback; no charge (Workers Free) |
| User revokes API token | Auth error on refresh; fallback |
| E2E mode | Stub image provider; no real Cloudflare |

## Sync / privacy

- Personal photos stay **local** on disk; never uploaded except as part of user’s own OS backup.
- Cloudflare receives **image prompt text** only (composed prompt), not the Gemini API key.
- Generated images cached **locally** per display for reuse on failure (technical spec); not sent to Gemini as image input in v1.
- Cloudflare and Gemini secrets stored in local config store; never logged or committed.

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| Users stay on AI mode across multiple refreshes | Provider + prompt flow is usable |
| Support burden low for “double API key” setup | General tab copy is clear |
| Fallback rate visible in logs (maintainers) | Quota/auth issues detectable |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Feature slug | `background-image` |
| 2 | Background sources | **Gradient**, **Personal photo**, **AI generated** (per display) |
| 3 | Scope | **Per display profile**; Style tab sync mesh applies to new fields |
| 4 | AI refresh timing | **On each phrase refresh** when mode is AI (not on Apply alone) |
| 5 | Image prompt construction | **Gemini text** from sampled headlines + preset/custom background instructions |
| 6 | Photo layering | **Full Style stack** on photo (grain, vignette, phrase, widgets); gradient replaced by photo |
| 7 | AI layering | Same as photo: AI bitmap replaces gradient; grain/vignette/widgets on top |
| 8 | Cloudflare credentials | **General tab, global** (Account ID + API token) |
| 9 | Preset UX | **Voice-like** preset dropdown + Custom textarea (separate from phrase system prompt) |
| 10 | Provider v1 | **Cloudflare Workers AI** (FLUX Schnell class model); swappable in implementation |
| 11 | Architecture intent | **Port + adapter** (+ optional repository for cache paths); no product UI for provider choice |
| 12 | Draft / Apply | Background fields part of unified Style/Voice draft; no provider calls until refresh (except photo import on Apply) |
| 13 | Mood cards | Do **not** auto-change background **mode**; mood continues to stage gradient theme + voice bundle |
| 14 | User confirm 2026-08-04 | Per-display; AI with phrase refresh; Gemini image prompt; full style on photo; Cloudflare keys in General |
| 15 | Live overlay | Photo/AI base must match painted wallpaper in **WallpaperView** (animated modes) |
| 16 | Phrase failure | If phrase generation fails on a refresh, **skip AI image** for that monitor on the same cycle |
| 17 | Photo formats | **PNG and JPEG** only for personal photo import |
| 18 | Manual refresh | **Yes** — tray/menu **Refresh** runs full cycle including AI background when mode is AI |
| 19 | Custom prompt max | **2048 characters** (aligned with image provider prompt limit) |
| 20 | Preset catalog | Defined in code (`backgroundPromptPresets.ts`); mood-linked + standalone + Custom (see technical spec) |

## Acceptance Criteria

1. Style → Background offers **Gradient | Personal photo | AI generated** per selected display; changes are **draft-only** until Apply.
2. **Gradient** mode exposes the **existing theme swatches** and behaves as today when selected and applied.
3. **Personal photo** mode: user can pick a file, preview in draft, **Apply** imports and shows photo as wallpaper base with **grain/vignette/phrase/widgets** unchanged in behavior from gradient mode.
4. **AI generated** mode: preset dropdown + **Custom** textarea follow Voice preset interaction patterns (draft-only until Apply).
5. General tab exposes **Cloudflare Account ID** and **API token** (masked), stored globally; app runs without them when not in AI mode.
6. On phrase refresh with AI mode committed: **exactly one** Gemini call for **image prompt composition** (in addition to phrase generation rules already in app) and **exactly one** image provider request per display in AI mode.
7. AI background updates on refresh use **headlines sampled for that display** on that cycle.
8. Cloudflare/provider failure: wallpaper shows **last good AI image** or **committed gradient theme**; user-visible error in Settings.
9. Missing Cloudflare credentials in AI mode: no crash; fallback + guidance to General tab.
10. Per-display profiles: two displays can use different background modes simultaneously.
11. Style tab **sync mesh**: when Style sync is on, background fields propagate like other Style draft fields (same semantics as per-monitor-settings).
12. E2E can run with **stubbed image provider** without network.
13. No **Google image API** requirement for v1.

## Out-of-Scope Follow-ups (post-v1)

- Mood bundle includes default **background mode + AI preset** when activating a mood.
- Manual “Regenerate background now” without phrase regen.
- On-Apply preview fetch for AI (low-res) before next refresh.
- Additional providers (Imagen, local SD).
- Optional **no-Gemini** template-only image prompts for offline/cost saving.
- Background history gallery per display.

## Resolved at lock (2026-08-04)

See product decisions **#15–#20** and [technical-spec.md](./technical-spec.md) for preset list and overlay implementation.
