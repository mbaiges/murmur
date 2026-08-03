#!/usr/bin/env node
/**
 * Post-process committed README screenshots (max width for hero, etc.).
 */
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { join } from 'path'

const hero = join(process.cwd(), 'assets', 'screenshots', 'hero-wallpaper.png')
if (!existsSync(hero)) {
  process.exit(0)
}

if (process.platform === 'darwin') {
  const r = spawnSync('sips', ['-Z', '1440', hero], { stdio: 'inherit' })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}
