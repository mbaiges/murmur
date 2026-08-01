#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

await import('./prepare-murmur-electron-dev.mjs')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

if (process.platform === 'darwin' && existsSync(join(projectRoot, '.electron-dev', 'Electron.app'))) {
  env.ELECTRON_OVERRIDE_DIST_PATH = join(projectRoot, '.electron-dev')
}

const child = spawn('electron-vite', ['dev', '--watch'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: true
})

child.on('exit', (code) => process.exit(code ?? 0))
