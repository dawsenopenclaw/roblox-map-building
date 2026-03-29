import { ForjeGames } from './client'

export interface AssetGenerateOptions {
  prompt: string
  type: 'mesh' | 'texture' | 'sound' | 'script'
  style?: string
}

export interface GeneratedAsset {
  assetId: string
  type: string
  name: string
  downloadUrl: string | null
  thumbnailUrl: string | null
  status: 'queued' | 'processing' | 'complete' | 'failed'
  tokensUsed?: number
}

export class AssetsClient {
  constructor(private rf: ForjeGames) {}

  /**
   * Generate an asset from a text prompt.
   */
  async generate(opts: AssetGenerateOptions): Promise<GeneratedAsset> {
    const res = await this.rf.request<GeneratedAsset>('POST', '/api/ai/generate/asset', opts)
    if (res.error) throw new Error(res.error)
    return res.data!
  }

  /**
   * Get asset by ID.
   */
  async get(assetId: string): Promise<GeneratedAsset> {
    const res = await this.rf.request<GeneratedAsset>('GET', `/api/ai/generate/asset/${assetId}`)
    if (res.error) throw new Error(res.error)
    return res.data!
  }
}

export function assetsPlugin(rf: ForjeGames) {
  return new AssetsClient(rf)
}
