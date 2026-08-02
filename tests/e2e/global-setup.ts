import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

export default function globalSetup() {
  const root = join(process.cwd())
  const outRenderer = join(root, 'out/renderer/index.html')

  if (!existsSync(outRenderer)) {
    execSync('npm run build', { cwd: root, stdio: 'inherit' })
  }

  execSync('node scripts/sync-renderer-public.mjs', { cwd: root, stdio: 'inherit' })
}
