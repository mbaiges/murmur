export class Scheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(private readonly onTick: () => Promise<void>) {}

  public start(intervalMinutes: number): void {
    this.stop()
    this.isRunning = true
    
    const intervalMs = intervalMinutes * 60 * 1000
    
    // Execute first tick immediately in background
    this.onTick().catch((err) => console.error('Scheduler initial tick error:', err))

    this.intervalId = setInterval(() => {
      this.onTick().catch((err) => console.error('Scheduler tick error:', err))
    }, intervalMs)
  }

  public stop(): void {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  public isActive(): boolean {
    return this.isRunning
  }
}
