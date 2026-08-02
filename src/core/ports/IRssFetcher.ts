import { RssItem } from '../domain/types'
export interface IRssFetcher {
  fetchAll(feeds: string[]): Promise<RssItem[]>
}
