export interface BackgroundImageGenerateRequest {
  prompt: string
  width: number
  height: number
}

export interface IBackgroundImageRepository {
  generate(request: BackgroundImageGenerateRequest): Promise<Buffer>
}
