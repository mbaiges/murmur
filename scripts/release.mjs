#!/usr/bin/env node
/**
 * Murmur release helper (GitHub Actions builds installers on tag push).
 *
 *   node scripts/release.mjs publish [version]   — set package.json version, commit, tag vX.Y.Z, push
 *   node scripts/release.mjs finalize [vX.Y.Z]   — after CI: drop duplicate drafts, publish full release
 *   node scripts/release.mjs status [vX.Y.Z]     — show release + CI status (default: package.json version)
 *
 * Requires: git, gh (logged in), clean intent to push to origin/main
 */
import { execSync, spawnSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pkgPath = join(root, 'package.json')

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: opts.inherit ? 'inherit' : 'pipe', ...opts })
}

function runJson(cmd) {
  return JSON.parse(run(cmd))
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  return pkg.version
}

function setVersion(version) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.version = version
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

function tagForVersion(version) {
  return version.startsWith('v') ? version : `v${version}`
}

function versionFromTag(tag) {
  return tag.replace(/^v/, '')
}

function semverOk(v) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v)
}

function publish(versionArg) {
  const version = versionArg ?? readVersion()
  if (!semverOk(version)) {
    console.error(`Invalid semver: ${version}`)
    process.exit(1)
  }
  const tag = tagForVersion(version)

  if (readVersion() !== version) {
    setVersion(version)
    console.log(`Updated package.json → ${version}`)
  }

  const status = run('git status --porcelain')
  if (status.trim()) {
    run('git add package.json', { inherit: true })
    run(`git commit -m "Release ${version}."`, { inherit: true })
  }

  const existing = spawnSync('git', ['rev-parse', tag], { cwd: root, encoding: 'utf8' })
  if (existing.status === 0) {
    console.error(`Tag ${tag} already exists locally. Delete it or pick a new version.`)
    process.exit(1)
  }

  run(`git tag -a ${tag} -m "Murmur ${version}"`, { inherit: true })
  run('git push origin main', { inherit: true })
  run(`git push origin ${tag}`, { inherit: true })

  console.log(`\nPushed ${tag}. CI will build macOS + Windows installers.`)
  console.log('Watch: gh run watch --repo mbaiges/murmur $(gh run list --workflow=release.yml --limit 1 --json databaseId --jq ".[0].databaseId")')
  console.log(`When green, run: node scripts/release.mjs finalize ${tag}\n`)
}

const REQUIRED_ASSETS = [
  'latest.yml',
  'latest-mac.yml',
  'Murmur-Setup',
  '.dmg',
  '-mac.zip'
]

function assetScore(release) {
  const names = release.assets.map((a) => a.name)
  let score = release.assets.length
  if (!release.draft) score += 100
  for (const hint of REQUIRED_ASSETS) {
    if (names.some((n) => n.includes(hint))) score += 10
  }
  return score
}

function finalize(tagArg) {
  const tag = tagArg ?? tagForVersion(readVersion())
  const all = runJson(`gh api repos/mbaiges/murmur/releases?per_page=100`)
  const releases = all.filter((r) => r.tag_name === tag)

  if (releases.length === 0) {
    console.error(`No GitHub release found for ${tag}. Wait for CI or check the tag.`)
    process.exit(1)
  }

  const sorted = [...releases].sort((a, b) => assetScore(b) - assetScore(a))
  const keeper = sorted[0]
  const rest = sorted.slice(1)

  console.log(`Keeping release #${keeper.id} (${keeper.assets.length} assets, draft=${keeper.draft})`)

  const keeperNames = new Set(keeper.assets.map((a) => a.name))
  const tmpDir = run('mktemp -d').trim()

  try {
    for (const rel of rest) {
      for (const asset of rel.assets) {
        if (keeperNames.has(asset.name)) continue
        console.log(`Copying missing asset: ${asset.name}`)
        run(`gh api "${asset.url}" -H "Accept: application/octet-stream" > "${tmpDir}/${asset.name}"`)
        run(`gh release upload ${tag} "${tmpDir}/${asset.name}" --clobber`, { inherit: true })
        keeperNames.add(asset.name)
      }
      console.log(`Deleting duplicate release #${rel.id}`)
      run(`gh api --method DELETE repos/mbaiges/murmur/releases/${rel.id}`)
    }

    if (keeper.draft) {
      run(
        `gh api --method PATCH repos/mbaiges/murmur/releases/${keeper.id} -f draft=false -f name="Murmur ${versionFromTag(tag)}" -f body="See https://github.com/mbaiges/murmur/blob/main/docs/features/app-auto-update/unsigned-releases.md"`,
        { inherit: true }
      )
    }
  } finally {
    run(`rm -rf "${tmpDir}"`)
  }

  const view = runJson(`gh release view ${tag} --json isDraft,url,assets`)
  console.log('\nRelease ready:')
  console.log(`  ${view.url}`)
  console.log(`  draft=${view.isDraft}`)
  console.log(`  assets: ${view.assets.map((a) => a.name).join(', ')}`)
}

function status(tagArg) {
  const tag = tagArg ?? tagForVersion(readVersion())
  try {
    run(`gh release view ${tag}`, { inherit: true })
  } catch {
    console.log(`No release for ${tag} yet.`)
  }
  run('gh run list --workflow=release.yml --limit 3', { inherit: true })
}

const [command, arg] = process.argv.slice(2)
switch (command) {
  case 'publish':
    publish(arg)
    break
  case 'finalize':
    finalize(arg)
    break
  case 'status':
    status(arg)
    break
  default:
    console.log(`Usage:
  node scripts/release.mjs publish [version]
  node scripts/release.mjs finalize [vX.Y.Z]
  node scripts/release.mjs status [vX.Y.Z]`)
    process.exit(command ? 1 : 0)
}
