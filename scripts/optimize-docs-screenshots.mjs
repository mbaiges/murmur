#!/usr/bin/env node
/**
 * Post-process committed README screenshots (consistent max dimensions for GitHub).
 */
import { existsSync, readdirSync } from 'fs'
import { spawnSync } from 'child_process'
import { join } from 'path'

const dir = join(process.cwd(), 'assets', 'screenshots')
if (!existsSync(dir)) {
  process.exit(0)
}

/** Max longest edge per asset (display width in README is ≤720px). */
const MAX_EDGE = {
  'hero-wallpaper.png': 1440,
  'setup-wizard.png': 640,
  'settings-general.png': 900,
  'settings-news.png': 900,
  'settings-voice.png': 900,
  'settings-style-moods.png': 900,
  'settings-history.png': 900
}

if (process.platform !== 'darwin') {
  console.warn('optimize-docs-screenshots: sips is macOS-only; skipping resize')
  process.exit(0)
}

for (const name of readdirSync(dir)) {
  if (!name.endsWith('.png')) continue
  const max = MAX_EDGE[name] ?? 1280
  const path = join(dir, name)
  const r = spawnSync('sips', ['-Z', String(max), path], { stdio: 'inherit' })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}
