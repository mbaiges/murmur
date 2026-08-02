# Functional Spec: Per-monitor settings & tab sync

| Field | Value |
|-------|-------|
| Status | **Locked** (2026-08-02) |
| Author | Murmur product |
| Created | 2026-08-02 |
| Updated | 2026-08-02 (locked) |
| Feature folder | `docs/features/per-monitor-settings/` |
| Follow-up | [technical-spec.md](./technical-spec.md) |
| Related | [settings-ui-reorg](../settings-ui-reorg/functional-spec.md), [architecture](../../architecture.md) |

## Summary

Today Murmur generates **different phrases per display**, but **one shared configuration** drives feeds, voice, and style for every monitor; only **enable** and optional **theme override** are display-scoped. This feature splits configuration into **global app settings** (connection, schedule, startup) and **per-display profiles** (news, voice, style, widgets, enable). The Settings sidebar keeps its five **task tabs**, adds a **display selector above the tabs**, and keeps the user on the **same tab** when switching displays. Users can **live-sync** settings per tab using a simple **Sync** toggle on each scoped tab: every display with Sync **on** for that tab stays in a **full mesh**—an edit on any synced display updates all other synced displays for that tab. v1 also provides **Sync all** and **Sync this tab** actions to align displays quickly.

## Goals

1. **Per-display creative control** — Each connected display can have its own RSS feeds, generation voice (prompt, tone, language, markup), and visual style (mood, theme, layout, motion, overlays/widgets).
2. **Minimal global surface** — API key, refresh interval, and launch-at-login (plus first-run wizard minimum) remain **shared for the whole app**.
3. **Clear editing context** — The active display is always obvious; switching display does **not** change the active sidebar tab.
4. **Simple sync UX** — **Icon sync chips** (one per scoped tab + one “all tabs” in sidebar); all displays with Sync on for that tab share one live-linked value set for that tab’s fields.
5. **Practical refresh behavior** — On refresh, fetch the **union** of all feeds used by any enabled display once, then each display samples and generates using **its own** profile.
6. **Backward compatibility** — Existing installs migrate from today’s global fields into **identical per-display profiles** with Sync **on** so behavior matches pre-migration until the user opts out on a display.
7. **New hardware** — When a new display appears, seed its profile by **cloning the primary display’s** per-display settings (Sync toggles documented in Edge Cases).
8. **Preserve Displays history** — Phrase history remains **per display**; scoped History UI follows the sidebar display selector.

## Non-goals (v1)

- Cloud sync, accounts, or multi-machine profile export/import (local JSON only as today).
- Per-display API keys, refresh intervals, or launch-at-login.
- Field-level sync within a tab (e.g. tone only, not whole Voice tab)—deferred.
- Named sync groups beyond the mesh defined by Sync toggles.
- Settings deep links / URL routing per display.
- Changing tray or wallpaper window routes; only Settings IA and config semantics.
- New moods, RSS providers, or generation models.

## Background & Problem

Power users with multiple monitors want **different news**, **tone**, or **visual identity** per screen without running multiple app instances. The current IA (see locked [settings-ui-reorg](../settings-ui-reorg/functional-spec.md)) correctly groups tasks in five tabs but implies **one pipeline for all displays**. **Displays → Monitors** only exposes enable, theme override, and a phrase snippet—everything else is edited globally, which fights the mental model that each wallpaper is independent.

Industry patterns (scope-first settings sidebars, VS Code user vs workspace scope, OBS-style profiles) suggest: keep **stable task navigation**, add an explicit **scope control**, and avoid duplicating six copies of the sidebar per display. **Copy/sync** actions should be **contextual per section** (tab-level in v1), with **visible scope** and **predictable propagation**—not hidden “master display” semantics.

## Terminology

| Term | Meaning |
|------|---------|
| Display / monitor | An OS screen identified by stable Murmur monitor id (same as today). |
| Global settings | API key, refresh interval, launch at login; wizard minimum fields. |
| Display profile | Per-monitor bundle: feeds, voice fields, style fields, enable, and sync toggles. |
| Scoped tab | **News sources**, **Voice & prompts**, or **Style** while a display is selected. |
| Global tab | **General** — display selector disabled or labeled “All displays”. |
| Displays tab | **History** — phrase history for the sidebar-selected display. |
| Tab sync (Sync toggle) | Per display, per scoped tab: when **on**, that display participates in the tab’s **sync mesh**. |
| Sync mesh | All displays with Sync **on** for the same tab; one logical shared config for that tab’s fields. |
| Sync all tabs chip | Sidebar chip: toggles Sync **on** for News + Voice + Style on the **selected display**. |
| Sync this tab chip | Tab-header chip on scoped tabs: toggles Sync for that tab on the **selected display**. |
| Primary display | OS primary monitor; used only for **cloning** new display profiles, not as a permanent “master” for edits. |

## Actors

| Actor | Capabilities |
|-------|----------------|
| Desktop user | Selects display scope; edits global or per-display settings; toggles Sync; runs Refresh Now. |
| Maintainer / CI | Updates E2E for display selector, scoped saves, and sync propagation. |

## Availability Rules

- Applies wherever Settings is shown (macOS / Windows).
- Offline/local-first unchanged.
- Disabled displays: no wallpaper refresh; profile remains editable unless product chooses read-only enable-off state (default: **editable**).
- E2E mode: same stubs; tests may use a single virtual display unless extended.

## Screens & Information Architecture

### Sidebar layout (top → bottom)

1. **Branding** (unchanged role).
2. **Display selector** — Compact control (dropdown or segmented list): **Display 1**, **Display 2**, … using friendly labels; optional secondary hint (resolution or truncated id). **Persist last selected display** in Settings UI state.
3. **Task tabs** (unchanged labels and order): General → News sources → Voice & prompts → Style → **History**.
4. **Footer** (unchanged): Refresh Now, last refresh / idle.

### Scope rules by tab

| Tab | Display selector | Content edits |
|-----|------------------|---------------|
| **General** | Disabled; show “Applies to all displays” | Global only |
| **News sources** | Active | Selected display’s feed list |
| **Voice & prompts** | Active | Selected display’s voice fields (incl. tone, language, markup, advanced sample size) |
| **Style** | Active | Selected display’s mood/style/widgets; draft **Apply** affects sync mesh when Style Sync is on |
| **History** | Active | Phrase **history** for the sidebar-selected display |

### Switching display

- Changing the display selector **does not** change `activeTab`.
- Unsaved **Style/Voice draft** on tab switch: follow today’s draft semantics (warn or carry per display—**technical spec**; product default: **per-display draft state** or prompt if dirty).

### Sync controls — icon chips

Sync is controlled with **selectable chips** (same visual language as existing Settings chips: bordered pill, selected = accent fill). **No long copy in the chrome**—icon only in the chip; full meaning via **`aria-label`** and **hover/focus tooltip** (required for accessibility).

| Chip | Where | Behavior |
|------|--------|----------|
| **Sync all tabs** | Sidebar, adjacent to the **display selector** (same row or directly below) | Toggle **on/off** for the selected display: when **on**, the display participates in the sync mesh for **News, Voice, and Style** together (sets all three tab sync flags on). When **off**, clears all three for this display. |
| **Sync this tab** | Tab header row on **News sources**, **Voice & prompts**, and **Style** only | Toggle **on/off** for the selected display for **that tab only**. Independent of the other tabs unless **Sync all tabs** is used. |

**Selected chip** = this display has Sync **on** for that scope (tab or all tabs). Mesh propagation rules unchanged: any edit on a display with Sync on for that tab updates every other display that also has Sync on for that tab.

**One-shot align** (push this display’s committed settings to the mesh without toggling): **not** a separate button in v1. If the user turns a sync chip **on** after editing while off, product default is **hint tooltip only** (“Other displays may differ until you edit or re-toggle”) unless review locks auto-align—see checklist. Optional post-v1: long-press chip to “Push to synced displays.”

**General** tab: no sync chip (global scope). **History** tab: no tab-level sync chip (use sidebar **Sync all tabs** + per-tab chips when editing those tabs).

No “Sync with Display 1” wording—avoid implying a permanent master.

## User Journeys

### Journey A — Different news on two displays

1. User opens Settings; sidebar shows **Display 1** selected; **News sources** tab.
2. User switches selector to **Display 2**, stays on **News sources**.
3. User turns **Sync off** for News on Display 2 (if it was on).
4. User removes/adds feeds for Display 2 only; saves (instant save as today).
5. User runs **Refresh Now**; app fetches union of feeds; each display generates from its own feed list and voice/style profile.

**Accept:** Display 1 unchanged; Display 2 shows different headline sampling / phrase character.

### Journey B — Live sync mesh (Voice)

1. Display 1, 2, and 3 all have **Voice** Sync **on** (default after migration).
2. User selects Display 2, changes **tone** to Professional.
3. Display 1 and 3 voice settings update to match without manual copy.

**Accept:** All three remain matched for Voice until one display turns Sync off.

### Journey C — Partial independence

1. User turns **Style** Sync **off** on Display 2; picks a different mood.
2. Display 1 and 3 keep Style Sync **on**; editing Display 1 mood updates Display 3 only, not Display 2.

**Accept:** Display 2 style diverges; Display 1 ↔ 3 stay linked for Style.

### Journey D — Rejoin mesh after solo edits

1. User customized Display 2 Voice while the **Voice** sync chip was off.
2. User selects the **Voice** sync chip on (icon chip in tab header).
3. On the next Voice edit on Display 2 (or any synced display), mesh members converge; until then, displays may differ (hint on first enable).

**Accept:** No crash; mesh updates on next propagated edit unless auto-align is locked in review.

### Journey E — Sync all tabs chip

1. User selects Display 1; turns **Sync all tabs** chip on in the sidebar (all three tab scopes participate).
2. User edits Style on Display 1; Display 2 and 3 update Style if their Style sync is also on (including if they were turned on via **Sync all tabs** on those displays).

**Accept:** **Sync all tabs** only affects the **selected display’s** three flags; propagation still requires peers to have Sync on for that tab.

### Journey F — New display plugged in

1. OS reports new monitor id.
2. App clones **primary display’s** profile to the new entry; user sees new row in display selector.

**Accept:** New display wallpaper uses cloned settings on next refresh.

### Journey G — Error / blocked

| Case | Expected behavior |
|------|---------------------|
| Single display machine | Selector shows one entry; Sync toggles still valid (mesh of 1). |
| Sync on, solo display | Edits apply normally; no peer updates. |
| Refresh with empty feeds on a display | That display skips or shows last phrase; no crash; global union fetch still succeeds for other feeds. |
| User confirms Sync all with divergent peers | Overwrite non-source displays’ tab fields per action definition; toast success. |

## Refresh & generation (product)

- **RSS:** One fetch pass for the **set union** of feed URLs referenced by **enabled** displays (dedupe URLs).
- **Per display:** Sample headlines from **that display’s** feed list only; run generation with **that display’s** voice + style profile.
- **History:** Save per display id (unchanged concept).

## Migration (product)

- On load of legacy config: for each known monitor (and a template for future monitors), copy current global News/Voice/Style fields into that display’s profile.
- Set Sync **on** for News, Voice, and Style on **every** existing display so runtime behavior matches pre-upgrade until user disables Sync on a display/tab.
- Remove or stop persisting duplicated top-level News/Voice/Style fields after migration (technical spec); wizard seeds **primary** (or first) display and clones to others if multiple detected.

## Edge Cases

| Case | Expected behavior |
|------|---------------------|
| Turn Sync **off** | Freeze current tab fields on that display; further edits local only. |
| Turn Sync **on** | Join mesh; **no auto-align** on enable—tooltip/hint that peers may differ until the next edit on a synced display. |
| Two displays Sync on, third off | Edits on synced pair propagate; off display independent. |
| All three Sync on | Any edit on any propagates to all three (full mesh, not “via Display 1”). |
| Style draft not applied | Sync propagation uses **committed** config only, same as today’s Apply bar contract. |
| Monitor id churn | Treat as new display; clone primary; old id orphaned profile may remain until cleanup (post-v1). |

## Success Metrics (lightweight)

| Signal | Why |
|--------|-----|
| Support burden / confusion | Fewer “both monitors look the same” reports from users who wanted split configs. |
| Qualitative | Users with 2+ displays customize at least one non-synced tab within first week. |

## Product Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Global vs per-display | **Global:** API key, refresh interval, launch at login, wizard minimum. **Per-display:** feeds, voice (incl. tone/language/markup/advanced sample size), style/mood/widgets, enable. |
| 2 | Display selector placement | **Sidebar, above the five task tabs** (not replacing tabs). |
| 3 | Tab persistence | Switching display **keeps** active sidebar tab. |
| 4 | Sync model | **Live link per tab** via **Sync toggle** per display per tab; all toggles **on** for a tab form a **full mesh** (any member edit updates all members). |
| 5 | No master display | No fixed “Display 1” as source of truth; mesh edits propagate from whichever synced display the user changed. |
| 6 | Sync UI | **Icon-only toggle chips**: one **Sync all tabs** chip in sidebar by display selector; one **Sync this tab** chip per scoped tab header (News / Voice / Style). No separate align buttons in v1. |
| 7 | New display default | Clone **primary display** profile. |
| 8 | RSS refresh | **Union fetch** once; per-display sampling from own feed list. |
| 9 | Migration default | Duplicate legacy global settings to each display; Sync **on** all tabs all displays. |
| 10 | Displays → Monitors | **Selected display only** (no multi-card grid); sidebar selector is the switch point. |
| 11 | Rejoin mesh | **Hint only** when enabling sync chip after solo edits; convergence on next propagated edit. |

## Acceptance Criteria

1. Sidebar shows a **display selector** above task tabs; **General** indicates global scope; other tabs edit the **selected display’s** profile.
2. Switching display while on **Voice & prompts** (or any tab) **does not** change the active tab.
3. Two displays with **News** Sync off can maintain **different feed lists**; Refresh uses union fetch and generates distinct content per display.
4. With **Voice** Sync on on displays A and B, changing tone on A updates B’s stored voice settings without manual copy.
5. With **Style** Sync on on A and C only, changing mood on A updates C and **not** B when B’s Style Sync is off.
6. **Sync this tab** chip on display X: toggling on/off persists per display per tab; with Sync on, edits on X propagate to all displays with Sync on for that tab.
7. **Sync all tabs** chip on display X: toggling on sets Sync on for News, Voice, and Style on X; toggling off clears all three on X.
8. Sync chips are **icon-only** with accessible name + tooltip; visual selected state matches Settings chip pattern.
9. New monitor id receives profile cloned from **primary display**; appears in selector.
10. Legacy config migrates without user action; until Sync is turned off, editing any display still updates all displays (mesh default).
11. **History** tab shows history for the **selected display** only.
12. E2E/unit tests updated for selector, sync chips, scoped save, and at least one sync propagation scenario.

## Out-of-Scope Follow-ups (post-v1)

- Field-group sync (tone only, widgets only, mood only).
- Export/import display profile; duplicate display profile explicitly.
- “Compare displays” split view.
- Per-display refresh interval or scheduled stagger.
- Automatic sync conflict UI when two displays edit offline (N/A local single Settings window today).
