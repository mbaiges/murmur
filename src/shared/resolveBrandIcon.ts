import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

/** Same asset as `<img src="/logo.png">` in the renderer (src/renderer/public/logo.png). */
export function resolveBrandIconPath(): string {
  const candidates = [
    join(app.getAppPath(), 'src/renderer/public/logo.png'),
    join(__dirname, '../../../src/renderer/public/logo.png'),
    join(__dirname, '../../resources/logo.png'),
    join(app.getAppPath(), 'resources/logo.png')
  ]

  for (const iconPath of candidates) {
    if (existsSync(iconPath)) {
      return iconPath
    }
  }

  throw new Error(
    'Brand logo not found. Add src/renderer/public/logo.png (same file used in the Murmur UI).'
  )
}
