import { RssItem } from '../domain/types'

export interface IRssRepository {
  fetchAll(feeds: string[]): Promise<RssItem[]>
}
