import { IConfigStore } from '../../../core/ports/IConfigStore'
import {
  BackgroundImageGenerateRequest,
  IBackgroundImageRepository
} from '../../../core/ports/IBackgroundImageRepository'

const FLUX_PATH = '@cf/black-forest-labs/flux-1-schnell'

export class CloudflareFluxBackgroundImageRepository implements IBackgroundImageRepository {
  constructor(private readonly configStore: IConfigStore) {}

  async generate(request: BackgroundImageGenerateRequest): Promise<Buffer> {
    const config = await this.configStore.get()
    const accountId = config.cloudflareAccountId?.trim()
    const token = config.cloudflareApiToken?.trim()
    if (!accountId || !token) {
      throw new Error('Cloudflare account ID and API token are required for AI backgrounds')
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${FLUX_PATH}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.prompt,
        steps: 4
      })
    })

    const data = (await res.json()) as {
      success?: boolean
      errors?: unknown
      result?: { image?: string }
    }

    if (!res.ok || !data.success) {
      throw new Error(
        `Cloudflare FLUX failed (${res.status}): ${JSON.stringify(data.errors ?? data)}`
      )
    }

    const b64 = data.result?.image
    if (!b64 || typeof b64 !== 'string') {
      throw new Error('Cloudflare FLUX response missing image')
    }

    return Buffer.from(b64, 'base64')
  }
}
