import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { CloudflareFluxBackgroundImageRepository } from '../../../../../src/main/infrastructure/cloudflare/CloudflareFluxBackgroundImageRepository'
import type { IConfigStore } from '../../../../../src/core/ports/IConfigStore'
import { testMonitorConfigV2 } from '../../../helpers/testMonitorConfigV2'

describe('CloudflareFluxBackgroundImageRepository', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          result: { image: Buffer.from('jpeg-bytes').toString('base64') }
        })
      })
    )
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllGlobals()
  })

  it('posts prompt to Cloudflare Workers AI', async () => {
    const configStore: IConfigStore = {
      get: async () =>
        testMonitorConfigV2({
          cloudflareAccountId: 'acct-123',
          cloudflareApiToken: 'token-xyz'
        }),
      set: async () => {}
    }
    const repository = new CloudflareFluxBackgroundImageRepository(configStore)
    const buffer = await repository.generate({ prompt: 'abstract fog', width: 1920, height: 1080 })

    expect(buffer.equals(Buffer.from('jpeg-bytes'))).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/acct-123/ai/run/@cf/black-forest-labs/flux-1-schnell'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-xyz' })
      })
    )
  })

  it('throws when credentials missing', async () => {
    const configStore: IConfigStore = {
      get: async () => testMonitorConfigV2(),
      set: async () => {}
    }
    const repository = new CloudflareFluxBackgroundImageRepository(configStore)
    await expect(repository.generate({ prompt: 'x', width: 100, height: 100 })).rejects.toThrow(
      /Cloudflare account ID/
    )
  })
})
