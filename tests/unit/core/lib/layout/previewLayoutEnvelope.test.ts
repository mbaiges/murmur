import { describe, expect, it } from 'vitest'
import { mockLayoutPayloadForPreview } from '../../../../../src/core/lib/layout/mockLayoutPayloadForPreview'
import { resolvePreviewLayoutEnvelope } from '../../../../../src/core/lib/layout/resolvePreviewLayoutEnvelope'

describe('mockLayoutPayloadForPreview', () => {
  it('splits phrase for split-spread', () => {
    const payload = mockLayoutPayloadForPreview('split-spread', 'alpha beta gamma delta')
    expect(payload.left).toBe('alpha beta')
    expect(payload.right).toBe('gamma delta')
  })

  it('builds tabloid headline in uppercase', () => {
    const payload = mockLayoutPayloadForPreview('tabloid-stack', 'Big news today — details inside')
    expect(payload.headline).toBe(payload.headline?.toUpperCase())
    expect(payload.kicker).toBe('Preview')
  })
})

describe('resolvePreviewLayoutEnvelope', () => {
  it('reuses committed envelope when layout matches', () => {
    const committed = {
      schemaId: 'murmur.layout.tabloid.v1',
      layoutStyle: 'tabloid-stack' as const,
      payload: { headline: 'LIVE', deck: 'sub' }
    }
    const resolved = resolvePreviewLayoutEnvelope('tabloid-stack', 'ignored', committed)
    expect(resolved).toEqual(committed)
  })

  it('mocks when draft layout differs from committed', () => {
    const committed = {
      schemaId: 'murmur.layout.simple.v1',
      layoutStyle: 'centered' as const,
      payload: { phrase: 'old' }
    }
    const resolved = resolvePreviewLayoutEnvelope('split-spread', 'one two three four', committed)
    expect(resolved?.layoutStyle).toBe('split-spread')
    expect(resolved?.payload.left).toBeTruthy()
    expect(resolved?.payload.right).toBeTruthy()
  })
})
