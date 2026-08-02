import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Scheduler } from '../../../../src/core/domain/Scheduler'

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs onTick immediately on start and then at intervals', async () => {
    const tick = vi.fn().mockResolvedValue(undefined)
    const scheduler = new Scheduler(tick)

    scheduler.start(5)
    expect(tick).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(tick).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(tick).toHaveBeenCalledTimes(3)

    scheduler.stop()
  })

  it('stops running ticks after stop() is called', async () => {
    const tick = vi.fn().mockResolvedValue(undefined)
    const scheduler = new Scheduler(tick)

    scheduler.start(5)
    expect(tick).toHaveBeenCalledTimes(1)

    scheduler.stop()

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(tick).toHaveBeenCalledTimes(1)
  })
})
