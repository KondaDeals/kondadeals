// Global in-memory cache — persists across page navigations
const CACHE = new Map()
const TTL = {
  products: 5 * 60 * 1000,      // 5 minutes
  categories: 10 * 60 * 1000,   // 10 minutes  
  banners: 10 * 60 * 1000,       // 10 minutes
  homepage: 3 * 60 * 1000,       // 3 minutes
}

export function getCache(key) {
  const item = CACHE.get(key)
  if (!item) return null
  if (Date.now() - item.ts > (item.ttl || TTL.products)) {
    CACHE.delete(key)
    return null
  }
  return item.data
}

export function setCache(key, data, ttl) {
  CACHE.set(key, { data, ts: Date.now(), ttl })
}

export function clearCache(key) {
  if (key) CACHE.delete(key)
  else CACHE.clear()
}

// Preload helper — fetch and cache silently
export async function preload(key, fetcher, ttl) {
  if (getCache(key)) return // Already cached
  try {
    const data = await fetcher()
    if (data) setCache(key, data, ttl)
  } catch (e) {}
}