import { PaintOptions } from '../domain/types'
export interface IWallpaperPainter {
  paint(options: PaintOptions): Promise<Buffer>
}
