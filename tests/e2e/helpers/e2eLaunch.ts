import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/** Isolated profile so E2E stubs are not overridden by the developer's real userData config. */
export function e2eElectronLaunchOptions() {
  const userDataDir = mkdtempSync(join(tmpdir(), 'murmur-e2e-'))
  const env = { ...process.env, MURMUR_E2E: 'true' }
  // Cursor/agent shells set ELECTRON_RUN_AS_NODE=1, which breaks Playwright's Electron launcher.
  delete env.ELECTRON_RUN_AS_NODE
  return {
    args: ['.', '--murmur-e2e', `--user-data-dir=${userDataDir}`],
    env
  }
}

export function e2eSemanticsDemoLaunchOptions() {
  const base = e2eElectronLaunchOptions()
  return {
    ...base,
    env: {
      ...base.env,
      MURMUR_E2E_SEMANTICS_DEMO: 'true'
    }
  }
}
