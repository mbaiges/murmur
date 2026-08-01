import { existsSync, statSync } from 'fs'
import sharp from 'sharp'
import { expect } from '@playwright/test'

/** PNG must exist, be non-trivial size, and have luminance spread (text on background). */
export async function validateScreenshotImage(path: string, label: string): Promise<void> {
  expect(existsSync(path), `${label}: screenshot file missing`).toBe(true)
  const size = statSync(path).size
  expect(size, `${label}: screenshot too small`).toBeGreaterThan(8_000)

  const stats = await sharp(path).stats()
  const lumSpread = stats.channels.slice(0, 3).map((c) => c.max - c.min)
  const maxSpread = Math.max(...lumSpread)
  expect(maxSpread, `${label}: image looks flat/empty (no contrast)`).toBeGreaterThan(25)

  const { width, height } = await sharp(path).metadata()
  expect(width, `${label}: width`).toBeGreaterThan(100)
  expect(height, `${label}: height`).toBeGreaterThan(100)
}
