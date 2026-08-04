/** Renderer-safe URL for local background files served by main (`registerBackgroundProtocol`). */
export function murmurBackgroundAssetUrl(
  monitorId: string,
  kind: 'personal' | 'ai',
  cacheKey?: string
): string {
  const base = `murmur-background://bg/${encodeURIComponent(monitorId)}/${kind}`
  if (!cacheKey) return base
  return `${base}?v=${encodeURIComponent(cacheKey)}`
}

export function parseMurmurBackgroundAssetUrl(
  requestUrl: string
): { monitorId: string; kind: string } | null {
  try {
    const url = new URL(requestUrl)
    if (url.hostname === 'bg') {
      const segments = url.pathname.replace(/^\//, '').split('/').filter(Boolean)
      const monitorIdEnc = segments[0]
      const kind = segments[1]
      if (!monitorIdEnc || !kind) return null
      return { monitorId: decodeURIComponent(monitorIdEnc), kind }
    }
    const monitorId = decodeURIComponent(url.hostname)
    const kind = url.pathname.replace(/^\//, '').split('/').filter(Boolean)[0]
    if (!monitorId || !kind) return null
    return { monitorId, kind }
  } catch {
    return null
  }
}
