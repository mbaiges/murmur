import { describe, it, expect } from 'vitest'
import {
  convertSentencePeriodsToNewlines,
  normalizePhraseLineBreaks,
  prepareMarkupForCompile
} from '../../../../src/core/lib/phrase/convertSentencePeriodsToNewlines'
import { splitPhraseLines } from '../../../../src/core/lib/phrase/phraseFormatFlags'

describe('normalizePhraseLineBreaks', () => {
  it('normalizes real LF, literal \\n, and over-escaped breaks to storage form', () => {
    expect(normalizePhraseLineBreaks('a\nb')).toBe('a\\nb')
    expect(normalizePhraseLineBreaks('a\\nb')).toBe('a\\nb')
    expect(normalizePhraseLineBreaks('a\\\\nb')).toBe('a\\nb')
    expect(normalizePhraseLineBreaks('a\\n\\nb')).toBe('a\\nb')
  })
})

describe('prepareMarkupForCompile', () => {
  it('turns literal \\n into real LF for any schema field', () => {
    expect(prepareMarkupForCompile('maestro\\n¡No comas', true)).toBe('maestro\n¡No comas')
    expect(prepareMarkupForCompile('maestro\\\\n¡No comas', true)).toBe('maestro\n¡No comas')
  })

  it('collapses breaks to spaces when newlines are disabled', () => {
    expect(prepareMarkupForCompile('a\\nb', false)).toBe('a b')
  })
})

describe('convertSentencePeriodsToNewlines', () => {
  it('turns sentence-ending periods into line breaks and drops the period', () => {
    expect(
      convertSentencePeriodsToNewlines(
        'El mundo se prende fuego y vos mirando la pantalla. La soledad es el lujo. Cerrá el orto.'
      )
    ).toBe(
      'El mundo se prende fuego y vos mirando la pantalla\\nLa soledad es el lujo\\nCerrá el orto'
    )
  })

  it('does not break on capital proper names without a period', () => {
    const phrase =
      'El **Spider-Man** y el pibe del **Chelsea** son drones de la CIA para que no veas que Rusia avanza'
    expect(convertSentencePeriodsToNewlines(phrase)).toBe(phrase)
  })

  it('keeps hard breaks after ! and converts following LF', () => {
    expect(
      convertSentencePeriodsToNewlines(
        '¡Cerrá el orto y escuchá, que te están **castrando** para que no veas los incendios!\nEl **Spider-Man** y el pibe del **Chelsea** son drones'
      )
    ).toBe(
      '¡Cerrá el orto y escuchá, que te están **castrando** para que no veas los incendios!\\nEl **Spider-Man** y el pibe del **Chelsea** son drones'
    )
  })

  it('handles period before existing breaks and strips trailing period', () => {
    expect(convertSentencePeriodsToNewlines('Primera oración.\\nSegunda.')).toBe(
      'Primera oración\\nSegunda'
    )
    expect(convertSentencePeriodsToNewlines('Una sola frase.')).toBe('Una sola frase')
  })

  it('does not chew ellipses', () => {
    expect(convertSentencePeriodsToNewlines('Espera... y después.')).toBe('Espera... y después')
  })
})

describe('splitPhraseLines with newline normalization', () => {
  it('splits on converted sentence periods when newlines are enabled', () => {
    expect(splitPhraseLines('Uno. Dos. Tres.', true)).toEqual(['Uno', 'Dos', 'Tres'])
  })

  it('splits real LF and literal \\n the same way', () => {
    expect(splitPhraseLines('Uno\nDos', true)).toEqual(['Uno', 'Dos'])
    expect(splitPhraseLines('Uno\\nDos', true)).toEqual(['Uno', 'Dos'])
    expect(splitPhraseLines('Uno\\\\nDos', true)).toEqual(['Uno', 'Dos'])
  })

  it('leaves periods intact when newlines are disabled', () => {
    expect(splitPhraseLines('Uno. Dos.', false)).toEqual(['Uno. Dos.'])
  })
})
