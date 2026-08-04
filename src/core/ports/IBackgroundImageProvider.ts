export interface BackgroundImageGenerateRequest {
  prompt: string
  width: number
  height: number
}

export interface IBackgroundImageProvider {
  generate(request: BackgroundImageGenerateRequest): Promise<Buffer>
}
