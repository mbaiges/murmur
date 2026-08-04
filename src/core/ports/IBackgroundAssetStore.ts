export interface IBackgroundAssetStore {
  /** Copy user-selected file into store; returns relative path under backgrounds root. */
  importPersonalPhoto(monitorId: string, sourcePath: string): Promise<string>
  /** Persist JPEG bytes as latest AI background for monitor. */
  saveGeneratedImage(monitorId: string, jpegBuffer: Buffer): Promise<string>
  /** Absolute path if file exists, else null. */
  resolveAbsolutePath(relPath: string): string | null
  /** Relative path for latest AI image (fixed name per monitor). */
  latestAiRelPath(monitorId: string): string
}
