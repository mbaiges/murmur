export interface ImagePromptComposeRequest {
  headlines: string[]
  instructions: string
}

export interface IImagePromptComposer {
  composeImagePrompt(request: ImagePromptComposeRequest): Promise<string>
}
