import { XMLParser } from 'fast-xml-parser'
import { IRssRepository } from '../../../core/ports/IRssRepository'
import { RssItem } from '../../../core/domain/types'

export class FastXmlRssRepository implements IRssRepository {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  })

  public async fetchAll(feeds: string[]): Promise<RssItem[]> {
    const results: RssItem[] = []

    for (const url of feeds) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`FastXmlRssRepository: Failed to fetch feed ${url} (status: ${response.status})`)
          continue
        }
        const xml = await response.text()
        const parsed = this.parser.parse(xml)

        const channel = parsed.rss?.channel
        if (!channel) {
          console.warn(`FastXmlRssRepository: Invalid RSS format for ${url}`)
          continue
        }

        const source = channel.title || new URL(url).hostname
        const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []

        for (const item of items) {
          const title = item.title ? String(item.title).trim() : ''
          if (title) {
            results.push({
              title,
              source,
              feedUrl: url
            })
          }
        }
      } catch (error) {
        console.error(`FastXmlRssRepository: Error fetching/parsing ${url}`, error)
      }
    }

    return results
  }
}
