/** Single-turn text completion against a remote LLM. */
export interface LlmTextRequest {
  userMessage: string
}

export interface ILlmRepository {
  completeText(request: LlmTextRequest): Promise<string>
}
