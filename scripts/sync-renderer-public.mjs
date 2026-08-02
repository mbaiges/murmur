/**
 * Copy src/renderer/public into out/renderer so E2E (production file:// load) uses current brand assets.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src/renderer/public')
const dest = join(root, 'out/renderer')

if (!existsSync(src)) {
  console.warn('sync-renderer-public: no public dir at', src)
  process.exit(0)
}

if (!existsSync(dest)) {
  console.warn('sync-renderer-public: out/renderer missing — run npm run build first')
  process.exit(1)
}

for (const name of readdirSync(src)) {
  const from = join(src, name)
  cpSync(from, join(dest, name), { recursive: true })
}

console.log('Synced public assets to out/renderer')
