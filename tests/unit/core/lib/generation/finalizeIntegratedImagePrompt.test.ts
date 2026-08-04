import { describe, expect, it } from 'vitest'
import { finalizeIntegratedImagePrompt } from '../../../../../src/core/lib/generation/finalizeIntegratedImagePrompt'

describe('finalizeIntegratedImagePrompt', () => {
  it('appends the full phrase verbatim after the composed scene prompt', () => {
    const longPhrase =
      'Ariana Grande cocina leones en una boda inundada de Japón ¡Los demócratas están furiosos y los médicos odian este truco de inmunidad del I.R.S.!'
    const out = finalizeIntegratedImagePrompt('Neon sunset over rocks.', longPhrase)
    expect(out).toContain('Neon sunset over rocks.')
    expect(out).toContain('MANDATORY READABLE TEXT')
    expect(out).toContain(longPhrase)
  })

  it('preserves mandatory block when scene prompt is very long', () => {
    const phrase = 'Short phrase.'
    const scene = 'x'.repeat(3000)
    const out = finalizeIntegratedImagePrompt(scene, phrase)
    expect(out).toContain(phrase)
    expect(out.length).toBeLessThanOrEqual(2048)
  })
})
