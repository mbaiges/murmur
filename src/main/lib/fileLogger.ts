import { appendFileSync, existsSync, statSync, renameSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const MAX_LOG_BYTES = 2 * 1024 * 1024

let logPath: string | null = null

function formatArg(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function rotateIfNeeded(path: string): void {
  try {
    if (!existsSync(path)) return
    if (statSync(path).size < MAX_LOG_BYTES) return
    const rotated = `${path}.1`
    if (existsSync(rotated)) {
      renameSync(rotated, `${path}.2`)
    }
    renameSync(path, rotated)
  } catch {
    // best-effort rotation
  }
}

function writeLine(level: string, args: unknown[]): void {
  if (!logPath) return
  rotateIfNeeded(logPath)
  const line = `[${new Date().toISOString()}] ${level} ${args.map(formatArg).join(' ')}\n`
  try {
    appendFileSync(logPath, line, 'utf8')
  } catch {
    // ignore disk errors
  }
}

export function getMurmurLogPath(): string {
  return logPath ?? join(app.getPath('userData'), 'murmur.log')
}

/** Mirror console output to userData/murmur.log for installed builds. */
export function installFileLogger(): void {
  logPath = join(app.getPath('userData'), 'murmur.log')

  const origLog = console.log.bind(console)
  const origWarn = console.warn.bind(console)
  const origError = console.error.bind(console)

  console.log = (...args: unknown[]) => {
    writeLine('INFO', args)
    origLog(...args)
  }
  console.warn = (...args: unknown[]) => {
    writeLine('WARN', args)
    origWarn(...args)
  }
  console.error = (...args: unknown[]) => {
    writeLine('ERROR', args)
    origError(...args)
  }

  console.log(
    `Murmur log started (v${app.getVersion()}, packaged=${app.isPackaged}, platform=${process.platform})`
  )
  console.log(`Log file: ${logPath}`)
}
