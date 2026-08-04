import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function maxMtimeMs(dir: string, max = 0): number {
  if (!existsSync(dir)) return max
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      max = maxMtimeMs(full, max)
    } else if (/\.(ts|tsx|css|html)$/.test(entry.name)) {
      max = Math.max(max, statSync(full).mtimeMs)
    }
  }
  return max
}

function needsProductionBuild(root: string): boolean {
  const outMain = join(root, 'out/main/index.js')
  const outRenderer = join(root, 'out/renderer/index.html')
  if (!existsSync(outMain) || !existsSync(outRenderer)) {
    return true
  }
  const builtAt = Math.min(statSync(outMain).mtimeMs, statSync(outRenderer).mtimeMs)
  const srcAt = Math.max(
    maxMtimeMs(join(root, 'src/main')),
    maxMtimeMs(join(root, 'src/core')),
    maxMtimeMs(join(root, 'src/preload')),
    maxMtimeMs(join(root, 'src/renderer')),
    maxMtimeMs(join(root, 'src/shared'))
  )
  return srcAt > builtAt
}

export default function globalSetup() {
  const root = join(process.cwd())

  if (needsProductionBuild(root)) {
    execSync('npm run build', { cwd: root, stdio: 'inherit' })
  }

  execSync('node scripts/sync-renderer-public.mjs', { cwd: root, stdio: 'inherit' })
}
