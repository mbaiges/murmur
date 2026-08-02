import { describe, it, expect } from 'vitest'
import { allLayoutContentSpecs, getLayoutContentSpec } from '../../src/shared/layoutContentSpecs'
import { validateLayoutPayload } from '../../src/shared/layoutSpecToZod'
import { parseHistoryEntry, serializeLayoutContentEnvelope } from '../../src/shared/layoutContentParse'
import { layoutContentPreview } from '../../src/shared/layoutContentPreview'
import { buildE2eStructuredResult } from '../../src/shared/e2eStructuredPhraseStub'

describe('layoutContentSpecs', () => {
  it('registers every layout style', () => {
    const specs = allLayoutContentSpecs()
    expect(specs.length).toBe(12)
    expect(getLayoutContentSpec('centered').schemaId).toBe('murmur.layout.simple.v1')
    expect(getLayoutContentSpec('tabloid-stack').fields.map((f) => f.key)).toContain('headline')
  })
})

describe('layoutSpecToZod', () => {
  it('validates tabloid payload', () => {
    const spec = getLayoutContentSpec('tabloid-stack')
    const ok = validateLayoutPayload(spec, { headline: 'BIG', deck: 'small' })
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.payload.headline).toBe('BIG')
    }
  })

  it('rejects unknown keys (strict)', () => {
    const spec = getLayoutContentSpec('centered')
    const bad = validateLayoutPayload(spec, { phrase: 'ok', extra: 'nope' })
    expect(bad.success).toBe(false)
  })
})

describe('layoutContentParse', () => {
  it('parses legacy string as phrase envelope', () => {
    const env = parseHistoryEntry('hello **world**', 'centered')
    expect(env.payload.phrase).toBe('hello **world**')
    expect(layoutContentPreview(env)).toContain('hello')
  })

  it('round-trips JSON history entries', () => {
    const spec = getLayoutContentSpec('split-spread')
    const raw = serializeLayoutContentEnvelope({
      schemaId: spec.schemaId,
      layoutStyle: 'split-spread',
      payload: { left: 'A', right: 'B' }
    })
    const env = parseHistoryEntry(raw, 'centered')
    expect(env.payload.left).toBe('A')
    expect(layoutContentPreview(env)).toContain('A')
  })
})

describe('e2eStructuredPhraseStub', () => {
  it('returns layout-specific stub payloads', () => {
    const spec = getLayoutContentSpec('tabloid-stack')
    const result = buildE2eStructuredResult(
      {
        headlines: [],
        language: 'en',
        systemPrompt: '',
        contentSpec: spec,
        formatFlags: {
          enableBold: false,
          enableItalic: false,
          enableNewlines: false,
          enableDifferentFonts: false
        }
      },
      null
    )
    expect(result.payload.headline).toBeTruthy()
    expect(result.payload.deck).toBeTruthy()
  })
})
