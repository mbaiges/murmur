/**
 * Regenerate logo.png (UI) and logo-tray.png (macOS menu bar template) from logo-source.png.
 * Usage: node scripts/generate-brand-icons.mjs [path-to-source-png]
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = process.argv[2] ?? join(root, 'src/renderer/public/logo-source.png')
const publicDir = join(root, 'src/renderer/public')
const uiOut = join(publicDir, 'logo.png')
const trayOut = join(publicDir, 'logo-tray.png')

const SIZE = 512

const base = await sharp(source)
  .ensureAlpha()
  .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp(base).png({ compressionLevel: 9 }).toFile(uiOut)

// macOS template icons: black shape + alpha; system tints for light/dark menu bar.
const { data, info } = await sharp(base).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
for (let i = 0; i < data.length; i += info.channels) {
  const a = data[i + 3]
  if (a > 12) {
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = a
  } else {
    data[i + 3] = 0
  }
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(trayOut)

console.log('Wrote', uiOut, 'and', trayOut)
