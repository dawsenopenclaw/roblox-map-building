import { RobloxForge } from './client'

export interface TerrainGenerateOptions {
  prompt: string
  style?: 'realistic' | 'cartoon' | 'lowpoly'
  size?: 512 | 1024 | 2048 | 4096
  seed?: number
}

export interface TerrainBuild {
  buildId: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  estimatedSeconds: number
  downloadUrl: string | null
  tokensUsed?: number
}

export class TerrainClient {
  constructor(private rf: RobloxForge) {}

  /**
   * Generate a terrain map from a natural language prompt.
   */
  async generate(opts: TerrainGenerateOptions): Promise<TerrainBuild> {
    const res = await this.rf.request<TerrainBuild>('POST', '/api/ai/generate/terrain', opts)
    if (res.error) throw new Error(res.error)
    return res.data!
  }

  /**
   * Poll build status until complete or failed.
   * @param buildId - Build ID from generate()
   * @param pollIntervalMs - How often to check (default 2000ms)
   * @param timeoutMs - Max wait time (default 120000ms)
   */
  async waitForBuild(
    buildId: string,
    pollIntervalMs = 2000,
    timeoutMs = 120_000
  ): Promise<TerrainBuild> {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      const res = await this.rf.request<TerrainBuild>('GET', `/api/ai/generate/terrain/${buildId}`)
      if (res.error) throw new Error(res.error)

      const build = res.data!
      if (build.status === 'complete' || build.status === 'failed') {
        return build
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    throw new Error(`Build ${buildId} timed out after ${timeoutMs}ms`)
  }
}

/**
 * Attach terrain methods to a RobloxForge instance.
 */
export function terrainPlugin(rf: RobloxForge) {
  return new TerrainClient(rf)
}
