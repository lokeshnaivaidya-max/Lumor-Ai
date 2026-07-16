export type CacheTtl = {
  marketData: number
  news: number
  fundamentals: number
  historical: number
  indicators: number
}

const DEFAULT_TTLS: CacheTtl = {
  marketData: 30_000,
  news: 300_000,
  fundamentals: 86_400_000,
  historical: Infinity,
  indicators: 30_000,
}

class TtlCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>()
  private maxEntries = 2000

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set(key: string, value: unknown, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) this.evict()
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  private evict(): void {
    const sorted = [...this.store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    const toDelete = sorted.slice(0, Math.floor(this.maxEntries * 0.1))
    for (const [k] of toDelete) this.store.delete(k)
  }

  wrap = <T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> => {
    const cached = this.get<T>(key)
    if (cached !== undefined) return Promise.resolve(cached)
    return fn().then((value) => {
      this.set(key, value, ttlMs)
      return value
    })
  }
}

export const cache = new TtlCache()
export const ttls = DEFAULT_TTLS
