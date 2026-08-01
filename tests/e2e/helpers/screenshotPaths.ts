import { mkdirSync } from 'fs'
import { join } from 'path'

/** Root for manual E2E captures (gitignored). */
export const E2E_ARTIFACTS_ROOT = join('tests', 'e2e', 'artifacts')

/** Screenshot root: `tests/e2e/artifacts/screenshots/{testCaseSlug}/` */
export const E2E_SCREENSHOTS_ROOT = join(E2E_ARTIFACTS_ROOT, 'screenshots')

/**
 * Resolve a path for an E2E screenshot.
 * @param testCaseSlug Folder name (kebab-case), e.g. `magazine-layouts-split-spread`
 * @param filename File name including extension, e.g. `wallpaper.png`
 */
export function e2eScreenshotPath(testCaseSlug: string, filename: string): string {
  const dir = join(E2E_SCREENSHOTS_ROOT, testCaseSlug)
  mkdirSync(dir, { recursive: true })
  return join(dir, filename)
}
