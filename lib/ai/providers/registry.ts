export interface Provider<T> {
  name: string
  fetch(symbol: string): Promise<T | null>
  isAvailable(): boolean
}

export async function withFallback<T>(
  providers: Provider<T>[],
  symbol: string,
  signal?: AbortSignal,
): Promise<{ data: T; from: string } | null> {
  let lastError: unknown
  for (const provider of providers) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
    if (!provider.isAvailable()) continue
    try {
      const result = await provider.fetch(symbol)
      if (result !== null) return { data: result, from: provider.name }
    } catch (err) {
      lastError = err
      console.warn(`[ProviderRegistry] ${provider.name} failed for ${symbol}:`, (err as Error).message)
    }
  }
  if (lastError) throw lastError
  return null
}
