import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton pattern — reuse connection
let supabaseInstance = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'kd-auth',
    },
    global: {
      fetch: (url, options = {}) => {
        // 6 second timeout to prevent hanging
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 6000)
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout))
      },
    },
    realtime: { params: { eventsPerSecond: 1 } },
  })
  return supabaseInstance
})()

// Cache layer
const cache = new Map()
const CACHE_TTL = 30000 // 30 seconds

export async function cachedQuery(key, queryFn) {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < CACHE_TTL) return hit.data
  const data = await queryFn()
  cache.set(key, { data, ts: now })
  return data
}

export const clearCache = (key) => key ? cache.delete(key) : cache.clear()