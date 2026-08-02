/**
 * Sanity-check generated brand assets (run after generate:brand).
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = [
  ['source', join(root, 'src/renderer/public/logo-source.jpeg')],
  ['logo.png', join(root, 'src/renderer/public/logo.png')],
  ['logo-tray.png', join(root, 'src/renderer/public/logo-tray.png')],
  ['favicon-32.png', join(root, 'src/renderer/public/favicon-32.png')],
  ['icon.png', join(root, 'resources/icon.png')]
]

for (const [label, path] of files) {
  if (!existsSync(path)) {
    console.log(`${label}: MISSING (${path})`)
    continue
  }
  const img = sharp(path)
  const meta = await img.metadata()
  const stats = await img.stats()
  const alpha = stats.channels[3]
  const opaque = alpha ? alpha.max > 200 : true
  console.log(
    `${label}: ${meta.width}x${meta.height} ${meta.format} — ` +
      `RGB mean ${stats.channels.slice(0, 3).map((c) => c.mean.toFixed(0)).join('/')} ` +
      (alpha ? `alpha max ${alpha.max}` : 'no alpha')
  )
  if (label === 'logo.png' && meta.width !== 512) {
    console.warn('  warn: expected 512px UI logo width')
  }
  if (label === 'icon.png' && meta.width !== 1024) {
    console.warn('  warn: expected 1024px app icon width')
  }
}
