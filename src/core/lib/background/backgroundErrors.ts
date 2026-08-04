export function formatAiBackgroundError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Cloudflare account ID and API token')) {
    return 'AI background needs Cloudflare Account ID and API token in General settings.'
  }
  if (message.toLowerCase().includes('cloudflare')) {
    return `AI background failed: ${message}`
  }
  return `AI background could not be generated: ${message}`
}
