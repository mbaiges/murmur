export interface IWallpaperBackup {
  backup(): Promise<void>
  restore(): Promise<void>
}
