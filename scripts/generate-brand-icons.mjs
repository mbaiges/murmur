/**
 * Import a logo master (JPEG/PNG), remove solid/chroma background, tight-trim, emit brand assets.
 *
 * Usage:
 *   node scripts/generate-brand-icons.mjs
 *   node scripts/generate-brand-icons.mjs logo-murmur-better.jpeg
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readdirSync, cpSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'src/renderer/public')
const resourcesDir = join(root, 'resources')

const UI_SIZE = 512
const APP_ICON_SIZE = 1024
/** Menu bar: 22pt logical × 2 for Retina bitmap (44px). */
const TRAY_LOGICAL_PT = 22
const TRAY_CANVAS = TRAY_LOGICAL_PT * 2

/**
 * Artwork fill vs square canvas (after tight crop).
 * Menu bar: ~16pt glyph in 22pt slot (Bjango) — padding is in the PNG, shown at full 22pt.
 * Dock / app icon: ~82% matches macOS icon safe area (~10% inset).
 */
const FILL_UI = 0.88
const FILL_DOCK = 0.82
const FILL_TRAY = 16 / 22

const PAD_FRACTION = 0

function pickSource(cliPath) {
  if (cliPath && existsSync(cliPath)) return cliPath
  const candidates = [
    join(publicDir, 'logo-source.jpeg'),
    join(publicDir, 'logo-source.jpg')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error(
    'No logo source found. Add src/renderer/public/logo-source.jpeg or pass a path argument.'
  )
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function sampleBackground(data, info) {
  const { width: w, height: h, channels: ch } = info
  const points = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
    [Math.floor(w / 2), h - 1]
  ]
  const samples = points.map(([x, y]) => {
    const i = (y * w + x) * ch
    return [data[i], data[i + 1], data[i + 2]]
  })
  const bg = samples
    .reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0])
    .map((v) => v / samples.length)
  const lums = samples.map(([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b)
  const cornerSpread = Math.max(...lums) - Math.min(...lums)
  return { bg, cornerSpread }
}

function removeLogoBackground(raw, info) {
  const { width: w, height: h, channels: ch } = info
  const data = Buffer.from(raw)

  const lumAt = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  const chromaAt = (i) => {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    return Math.max(r, g, b) - Math.min(r, g, b)
  }

  const { bg, cornerSpread } = sampleBackground(data, info)
  const checkerboardBg = cornerSpread > 35
  const greenScreenBg = bg[1] > bg[0] + 12 && bg[1] > bg[2] + 12 && bg[1] > 80
  const bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]
  let flatThreshold = bgLum < 48 ? 42 : greenScreenBg ? 58 : 38

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = lumAt(i)
      const chroma = chromaAt(i)

      if (checkerboardBg) {
        if (lum >= 248) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
          data[i + 3] = 255
        } else if (lum >= 232 && chroma < 28) {
          const t = (lum - 232) / (248 - 232)
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
          data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, t)))
        } else {
          data[i + 3] = 0
        }
        continue
      }

      const d = colorDistance(r, g, b, bg[0], bg[1], bg[2])
      const isGreenFringe =
        greenScreenBg && g > r + 8 && g > b + 8 && lum < 248 && chroma > 12
      if (d <= flatThreshold || isGreenFringe) {
        data[i + 3] = 0
        continue
      }

      if (lum >= 240) {
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = 255
      } else if (lum >= 210 && chroma < 35) {
        const t = (lum - 210) / 30
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, t)))
      }
    }
  }
  return data
}

function toTrayTemplate(raw, info) {
  const data = Buffer.from(raw)
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + 3]
    if (a > 16) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      const alpha = Math.min(255, Math.round((a * lum) / 255))
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = alpha
    } else {
      data[i + 3] = 0
    }
  }
  return data
}

async function loadRasterSource(sourcePath) {
  const isSvg = sourcePath.endsWith('.svg')
  let { data, info } = await sharp(sourcePath, isSvg ? { density: 512 } : undefined)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  data = removeLogoBackground(data, info)

  let pipeline = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })

  try {
    pipeline = sharp(await pipeline.trim({ threshold: 1 }).png().toBuffer())
  } catch {
    // keep untrimmed
  }

  const trimmedMeta = await pipeline.metadata()
  const pad = Math.max(
    2,
    Math.round(Math.max(trimmedMeta.width ?? 0, trimmedMeta.height ?? 0) * PAD_FRACTION)
  )

  return sharp(await pipeline.png().toBuffer()).extend({
    top: pad,
    bottom: pad,
    left: pad,
    right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
}

async function exportSquarePng(input, size, fillRatio) {
  const inner = Math.max(1, Math.round(size * fillRatio))
  const scaled = await input
    .clone()
    .resize(inner, inner, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: scaled, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function main() {
  const sourcePath = pickSource(process.argv[2])
  console.log('Source:', sourcePath)

  mkdirSync(resourcesDir, { recursive: true })

  const raster = await loadRasterSource(sourcePath)

  const uiPng = await exportSquarePng(raster, UI_SIZE, FILL_UI)

  const uiOut = join(publicDir, 'logo.png')
  await sharp(uiPng).toFile(uiOut)

  const trayPng = await exportSquarePng(raster, TRAY_CANVAS, FILL_TRAY)

  const { data: trayRaw, info: trayInfo } = await sharp(trayPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const trayData = toTrayTemplate(trayRaw, trayInfo)
  const trayOut = join(publicDir, 'logo-tray.png')
  await sharp(trayData, { raw: { width: trayInfo.width, height: trayInfo.height, channels: 4 } })
    .resize(TRAY_CANVAS, TRAY_CANVAS, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .blur(0.35)
    .png({ compressionLevel: 9 })
    .toFile(trayOut)

  const iconOut = join(resourcesDir, 'icon.png')
  const iconPng = await exportSquarePng(raster, APP_ICON_SIZE, FILL_DOCK)
  await sharp(iconPng).toFile(iconOut)

  const faviconOut = join(publicDir, 'favicon-32.png')
  await sharp(await exportSquarePng(raster, 32, FILL_UI)).toFile(faviconOut)

  const contentMeta = await sharp(uiPng).metadata()
  console.log('UI logo canvas:', contentMeta.width, 'x', contentMeta.height)
  console.log('Fill ratios — UI:', FILL_UI, 'dock:', FILL_DOCK, 'tray:', FILL_TRAY.toFixed(3))
  console.log('Wrote', uiOut)
  console.log('Wrote', trayOut)
  console.log('Wrote', iconOut)
  console.log('Wrote', faviconOut)

  const outRenderer = join(root, 'out/renderer')
  if (existsSync(outRenderer)) {
    for (const name of readdirSync(publicDir)) {
      cpSync(join(publicDir, name), join(outRenderer, name), { recursive: true })
    }
    console.log('Synced public assets to out/renderer (for E2E / file:// loads)')
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
