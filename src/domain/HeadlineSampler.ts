import { RssItem } from './types'

export function sampleHeadlines(items: RssItem[], n: number): RssItem[] {
  if (items.length <= n) {
    return [...items]
  }

  // Fisher-Yates shuffle
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  return shuffled.slice(0, n)
}
