export interface IWallpaperRenderer {
  getScreens(): Promise<{ id: string; width: number; height: number }[]>
  set(monitorId: string, pngBuffer: Buffer): Promise<void>
  backup(): Promise<void>
  restore(): Promise<void>
}
