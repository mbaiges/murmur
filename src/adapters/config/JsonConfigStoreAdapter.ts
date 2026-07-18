import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { IConfigStore } from '../../ports/IConfigStore'
import { MurmurConfig } from '../../domain/types'
import { MurmurConfigSchema } from '../../domain/config.schema'

export class JsonConfigStoreAdapter implements IConfigStore {
  private filePath: string
  private cachedConfig: MurmurConfig | null = null

  constructor() {
    this.filePath = join(app.getPath('userData'), 'murmur.config.json')
  }

  private getDefaultConfig(): MurmurConfig {
    return {
      geminiApiKey: '',
      feeds: ['https://feeds.bbci.co.uk/news/rss.xml'],
      refreshIntervalMinutes: 60,
      language: 'auto',
      theme: 'Midnight',
      animation: 'Fade',
      overlays: { dateTime: true, sourceCredit: false, inspiringHeadlines: false },
      headlineSampleSize: 15,
      launchAtLogin: false,
      fontFamily: 'EB Garamond',
      monitors: [],
      textAlignment: 'center',
      layoutStyle: 'centered',
      vignetteStyle: 'none',
      audioFeedback: true
    }
  }

  public async get(): Promise<MurmurConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig
    }

    if (!existsSync(this.filePath)) {
      const def = this.getDefaultConfig()
      writeFileSync(this.filePath, JSON.stringify(def, null, 2), 'utf8')
      this.cachedConfig = def
      return def
    }

    try {
      const content = readFileSync(this.filePath, 'utf8')
      const parsed = JSON.parse(content)

      // Backward compatible migration for vignette boolean
      if (parsed.vignette !== undefined && parsed.vignetteStyle === undefined) {
        parsed.vignetteStyle = parsed.vignette ? 'medium' : 'none'
        delete parsed.vignette
      }

      const validated = MurmurConfigSchema.parse(parsed)
      this.cachedConfig = validated as MurmurConfig
      return this.cachedConfig
    } catch (error) {
      console.warn('JsonConfigStoreAdapter: Invalid config file, resetting to default.', error)
      const def = this.getDefaultConfig()
      writeFileSync(this.filePath, JSON.stringify(def, null, 2), 'utf8')
      this.cachedConfig = def
      return def
    }
  }

  public async set(config: Partial<MurmurConfig>): Promise<void> {
    const current = await this.get()
    const updated = { ...current, ...config }
    writeFileSync(this.filePath, JSON.stringify(updated, null, 2), 'utf8')
    this.cachedConfig = updated
  }
}
