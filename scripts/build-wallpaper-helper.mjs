import { execSync } from 'child_process'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'resources', 'bin')
const outExe = join(outDir, 'WallpaperHelper.exe')
const cs = join(root, 'src', 'main', 'infrastructure', 'wallpaper', 'WallpaperHelper.cs')

mkdirSync(outDir, { recursive: true })

const cscCandidates = [
  'csc',
  join(process.env['WINDIR'] ?? 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe'),
  join(process.env['WINDIR'] ?? 'C:\\Windows', 'Microsoft.NET', 'Framework', 'v4.0.30319', 'csc.exe')
]

let csc = null
for (const candidate of cscCandidates) {
  try {
    execSync(`"${candidate}" /nologo /help`, { stdio: 'ignore' })
    csc = candidate
    break
  } catch {
    // try next
  }
}

if (!csc) {
  console.error('build-wallpaper-helper: csc.exe not found. Install .NET Framework SDK or build on Windows CI.')
  process.exit(1)
}

execSync(`"${csc}" /nologo /out:"${outExe}" "${cs}"`, { stdio: 'inherit' })
console.log(`Built ${outExe}`)
