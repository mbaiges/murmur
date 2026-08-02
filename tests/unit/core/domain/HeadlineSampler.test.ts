import { describe, it, expect } from 'vitest'
import { sampleHeadlines } from '../../../../src/core/domain/HeadlineSampler'
import { RssItem } from '../../../../src/core/domain/types'

describe('HeadlineSampler', () => {
  const items: RssItem[] = [
    { title: 'A', source: 'S1', feedUrl: 'U1' },
    { title: 'B', source: 'S2', feedUrl: 'U2' },
    { title: 'C', source: 'S3', feedUrl: 'U3' },
    { title: 'D', source: 'S4', feedUrl: 'U4' },
    { title: 'E', source: 'S5', feedUrl: 'U5' }
  ]

  it('samples correct number of items', () => {
    const result = sampleHeadlines(items, 3)
    expect(result.length).toBe(3)
    result.forEach((item) => {
      expect(items).toContainEqual(item)
    })
  })

  it('handles sample sizes larger than list size gracefully', () => {
    const result = sampleHeadlines(items, 10)
    expect(result.length).toBe(5)
    expect(result).toEqual(expect.arrayContaining(items))
  })

  it('returns a copy of items if sample size matches', () => {
    const result = sampleHeadlines(items, 5)
    expect(result).not.toBe(items)
    expect(result).toEqual(expect.arrayContaining(items))
  })
})
