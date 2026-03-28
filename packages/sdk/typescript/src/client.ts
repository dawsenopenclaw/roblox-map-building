export interface RobloxForgeConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  status: number
}

export class RobloxForge {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: RobloxForgeConfig) {
    if (!config.apiKey) throw new Error('apiKey is required')
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.robloxforge.com'
    this.timeout = config.timeout ?? 30_000
  }

  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@robloxforge/sdk/1.0.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      const data = await res.json().catch(() => null)

      return {
        data: res.ok ? (data as T) : null,
        error: res.ok ? null : (data?.error ?? `HTTP ${res.status}`),
        status: res.status,
      }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        status: 0,
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
