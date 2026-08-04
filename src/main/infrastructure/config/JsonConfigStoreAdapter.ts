import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { IConfigStore } from '../../../core/ports/IConfigStore'
import { MurmurConfig } from '../../../core/domain/types'
import { MurmurConfigSchema } from '../../../core/domain/config.schema'
import { migrateRawConfigToLatest } from '../../../core/lib/config/configMigrate'
import { isClickbaitPressProfile, preferredClickbaitAnimation } from '../../../core/lib/presets/clickbaitPreset'

export class JsonConfigStoreAdapter implements IConfigStore {
  private filePath: string
  private cachedConfig: MurmurConfig | null = null

  constructor() {
    this.filePath = join(app.getPath('userData'), 'murmur.config.json')
  }

  private getDefaultConfig(): MurmurConfig {
    return {
      configVersion: 3,
      geminiApiKey: '',
      cloudflareAccountId: '',
      cloudflareApiToken: '',
      refreshIntervalMinutes: 60,
      launchAtLogin: false,
      monitors: []
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
      const parsed = JSON.parse(content) as Record<string, unknown>

      if (parsed.vignette !== undefined && parsed.vignetteStyle === undefined) {
        parsed.vignetteStyle = parsed.vignette ? 'medium' : 'none'
        delete parsed.vignette
      }

      const migrated = migrateRawConfigToLatest(parsed)
      let dirty = parsed.configVersion !== 3

      for (const m of migrated.monitors) {
        if (isClickbaitPressProfile(m.profile) && m.profile.animation === 'Instant') {
          m.profile.animation = preferredClickbaitAnimation()
          dirty = true
        }
      }

      const validated = MurmurConfigSchema.parse(migrated) as MurmurConfig
      this.cachedConfig = validated

      if (dirty || parsed.configVersion !== 3) {
        writeFileSync(this.filePath, JSON.stringify(this.cachedConfig, null, 2), 'utf8')
      }
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
    if (config.monitors) {
      updated.monitors = config.monitors
    }
    writeFileSync(this.filePath, JSON.stringify(updated, null, 2), 'utf8')
    this.cachedConfig = updated
  }
}
