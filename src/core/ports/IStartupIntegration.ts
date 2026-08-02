export interface IStartupIntegration {
  enable(): Promise<void>
  disable(): Promise<void>
  isEnabled(): Promise<boolean>
}
