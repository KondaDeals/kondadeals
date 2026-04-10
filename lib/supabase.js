import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'kondadeals',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Simple in-memory cache for public data
const cache = new Map()
const CACHE_TTL = 60000 // 1 minute

export async function cachedQuery(key, queryFn) {
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  const data = await queryFn()
  cache.set(key, { data, timestamp: now })
  return data
}

export function clearCache(key) {
  if (key) cache.delete(key)
  else cache.clear()
}