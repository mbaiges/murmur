# RFC: Structured phrase generation per layout

**Status:** Implemented (see `docs/features/structured-phrase-generation/`)  
**Branch context:** `feature/macos-integration`

## Problem

Layouts receive a single markdown string; split heuristics (word midpoint, 45% words) break idioms and punch lines. Gemini already emits structure (`\n`, emphasis) that layouts ignore.

## Proposal

Each `layoutStyle` declares a **content spec**: JSON-shaped output the model must produce, with per-field descriptions and optional/required flags. Generation, validation, storage, and rendering use that payload—not guessed splits.

## Architecture

### Layout content registry

- File: `src/shared/layoutContentSpecs.ts` (or `src/domain/layoutContent/`)
- Each layout maps to:
  - `schemaId` (e.g. `murmur.layout.simple.v1`, `murmur.layout.tabloid.v1`)
  - `fields[]`: `key`, `type` (`string` | `markdown`), `required`, `description`, optional `promptHint`
- Shared schemas where useful (e.g. `{ phrase }` for centered, editorial, scattered, book-cover, asymmetrical).

Example specs:

| Layout | Fields |
|--------|--------|
| Most “classic” layouts | `phrase` (required) |
| `tabloid-stack` | `headline` (required), `deck` (optional), `kicker` (optional) |
| `split-spread` | `left` (required), `right` (required) — clause-complete halves |
| `pull-quote` | `quote` (required), `attribution` (optional) |

### Port: structured generation

```ts
interface PhraseGenerationRequest {
  headlines: string[]
  language: string
  systemPrompt: string
  contentSpec: LayoutContentSpec
  formatFlags: PhraseFormatFlags
}

interface PhraseGenerationResult {
  schemaId: string
  layoutStyle: LayoutStyleName
  rawJson: string
  payload: Record<string, unknown>
}

interface IPhraseGenerator {
  generateStructured(request: PhraseGenerationRequest): Promise<PhraseGenerationResult>
}
```

### Adapters (swap-friendly)

| Adapter | Notes |
|---------|--------|
| `GeminiStructuredPhraseGeneratorAdapter` | Prompt builder + JSON response; Gemini `responseSchema` when available; Zod validate + retries |
| `OllamaStructuredPhraseGeneratorAdapter` (future) | Same interface; prompt-only JSON + Zod |
| E2E stub | Returns fixture payload per layout |

Shared **pure** modules (no vendor SDK):

- `StructuredPhrasePromptBuilder` — spec → prompt text
- `layoutSpecToZod` — spec → runtime validator

### MurmurService

1. Resolve `contentSpec` from `config.layoutStyle`.
2. Call `generateStructured`.
3. Persist `rawJson` in history; state holds `lastContent[monitorId]` (plus derived plain text for tray).
4. Pass `payload` + `layoutStyle` to `WallpaperView` and `NodeCanvasWallpaperPainterAdapter`.

### Rendering

- Layout-specific mappers read payload keys (no `phraseLayoutSplit` for tabloid/spread when structured).
- Markdown rules apply inside `markdown`-typed fields only.

### History UI

- Store validated JSON string per entry.
- v1: monospace `JSON.stringify(payload, null, 2)` + optional schema-aware one-line preview from registry.
- Legacy entries: treat as `{ phrase: "<legacy>" }`.

### Regeneration

- `layoutStyle` change → different spec → new generation (existing behavior).
- `MURMUR_E2E` fixture mode: JSON fixture file instead of plain phrase string.

## Migration

- History file: strings remain valid; parser detects JSON vs legacy string.
- Config unchanged; no user migration.

## Decisions (locked for v1)

1. **One spec per layout** initially; extract shared specs when duplicated.
2. **Markdown inside JSON string fields** where `type: markdown` (keep current `**`/`*`/font tags).
3. **Validation:** Zod from spec; Gemini JSON mode + schema when supported; retries on invalid payload.
4. **History:** store normalized validated JSON (`rawJson`).

## Phases

1. Registry + Zod for `simple.phrase` and `tabloid.headlineDeck`.
2. Port + Gemini adapter; MurmurService + state/history.
3. Renderers for tabloid + split-spread; others use `phrase`.
4. History UI raw JSON + tabloid preview.
5. Remove heuristic splits for layouts with structured specs.
6. Update `docs/architecture.md`.

## Out of scope (v1)

- Ollama adapter implementation (interface only).
- User-editable schemas in UI.
