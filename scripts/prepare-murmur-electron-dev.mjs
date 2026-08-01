#!/usr/bin/env node
/**
 * Dev-only: copy Electron.app and patch Info.plist so the macOS Dock shows "Murmur"
 * instead of "Electron" (ELECTRON_OVERRIDE_DIST_PATH).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const stampFile = join(projectRoot, '.electron-dev', '.stamp')
const devAppDir = join(projectRoot, '.electron-dev')
const sourceApp = join(projectRoot, 'node_modules/electron/dist/Electron.app')
const targetApp = join(devAppDir, 'Electron.app')
const plistPath = join(targetApp, 'Contents/Info.plist')

function readElectronVersion() {
  const pkg = JSON.parse(readFileSync(join(projectRoot, 'node_modules/electron/package.json'), 'utf8'))
  return pkg.version
}

function patchPlist() {
  execSync(
    `/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Murmur" -c "Set :CFBundleName Murmur" "${plistPath}"`,
    { stdio: 'inherit' }
  )
}

function main() {
  if (process.platform !== 'darwin') {
    return
  }

  if (!existsSync(sourceApp)) {
    console.warn('prepare-murmur-electron-dev: Electron.app not found; run npm install')
    return
  }

  const electronVersion = readElectronVersion()
  if (existsSync(stampFile) && readFileSync(stampFile, 'utf8').trim() === electronVersion && existsSync(plistPath)) {
    return
  }

  mkdirSync(devAppDir, { recursive: true })
  if (existsSync(targetApp)) {
    rmSync(targetApp, { recursive: true, force: true })
  }

  cpSync(sourceApp, targetApp, { recursive: true })
  patchPlist()
  writeFileSync(stampFile, electronVersion, 'utf8')
  console.log('Prepared .electron-dev/Electron.app with Dock name "Murmur"')
}

main()
