import { copyFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, extname, join, resolve } from 'path'
import type { IBackgroundAssetStore } from '../../../core/ports/IBackgroundAssetStore'

const PERSONAL_BASenames = ['personal.jpg', 'personal.png'] as const

export class FsBackgroundAssetStoreAdapter implements IBackgroundAssetStore {
  constructor(private readonly rootDir: string) {}

  private monitorDir(monitorId: string): string {
    return join(this.rootDir, monitorId)
  }

  latestAiRelPath(monitorId: string): string {
    return `${monitorId}/ai-latest.jpg`
  }

  resolveAbsolutePath(relPath: string): string | null {
    const normalized = relPath.replace(/^\/+/, '')
    const abs = resolve(this.rootDir, normalized)
    if (!abs.startsWith(resolve(this.rootDir))) {
      return null
    }
    return existsSync(abs) ? abs : null
  }

  importPersonalPhoto(monitorId: string, sourcePath: string): Promise<string> {
    const ext = extname(sourcePath).toLowerCase()
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return Promise.reject(new Error('Background photo must be PNG or JPEG'))
    }
    const destName = ext === '.png' ? 'personal.png' : 'personal.jpg'
    const dir = this.monitorDir(monitorId)
    mkdirSync(dir, { recursive: true })
    for (const name of PERSONAL_BASenames) {
      const p = join(dir, name)
      if (existsSync(p)) {
        try {
          unlinkSync(p)
        } catch {
          /* ignore */
        }
      }
    }
    const dest = join(dir, destName)
    copyFileSync(sourcePath, dest)
    const relPath = `${monitorId}/${destName}`
    return Promise.resolve(relPath)
  }

  saveGeneratedImage(monitorId: string, jpegBuffer: Buffer): Promise<string> {
    const dir = this.monitorDir(monitorId)
    mkdirSync(dir, { recursive: true })
    const relPath = this.latestAiRelPath(monitorId)
    writeFileSync(join(this.rootDir, relPath), jpegBuffer)
    return Promise.resolve(relPath)
  }
}
