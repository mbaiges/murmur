export function feedDisplayLabel(feedUrl: string): string {
  try {
    const host = new URL(feedUrl).hostname.replace(/^www\./, '')
    return host || feedUrl
  } catch {
    return feedUrl
  }
}
