import { LayoutStyleName, LayoutContentEnvelope } from '../../domain/types'
import { getLayoutContentSpec } from './layoutContentSpecs'
import { validateLayoutPayload } from './layoutSpecToZod'

export function serializeLayoutContentEnvelope(envelope: LayoutContentEnvelope): string {
  return JSON.stringify({
    schemaId: envelope.schemaId,
    layoutStyle: envelope.layoutStyle,
    payload: envelope.payload
  })
}

/** Parse stored history entry or hydrate from legacy plain string. */
export function parseHistoryEntry(
  entry: string,
  fallbackLayout: LayoutStyleName = 'centered'
): LayoutContentEnvelope {
  const trimmed = entry.trim()
  if (!trimmed) {
    const spec = getLayoutContentSpec(fallbackLayout)
    return { schemaId: spec.schemaId, layoutStyle: fallbackLayout, payload: { phrase: '' } }
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        schemaId?: string
        layoutStyle?: LayoutStyleName
        payload?: Record<string, unknown>
      }
      if (parsed.payload && typeof parsed.payload === 'object') {
        const layoutStyle = parsed.layoutStyle || fallbackLayout
        const spec = getLayoutContentSpec(layoutStyle)
        const validated = validateLayoutPayload(spec, parsed.payload)
        if (validated.success) {
          return {
            schemaId: parsed.schemaId || spec.schemaId,
            layoutStyle,
            payload: validated.payload
          }
        }
      }
    } catch {
      // fall through to legacy
    }
  }

  return {
    schemaId: 'murmur.layout.simple.v1',
    layoutStyle: fallbackLayout,
    payload: { phrase: trimmed }
  }
}

export function envelopeToRawJson(envelope: LayoutContentEnvelope): string {
  return serializeLayoutContentEnvelope(envelope)
}
