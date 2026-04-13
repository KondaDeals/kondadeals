import { useEffect } from 'react'
import { fetchProductsBySlug, fetchHomepageData } from './fetchers'
import { getCache } from './dataCache'

// Call this to prefetch data before user clicks
export function usePrefetch() {
  const prefetchCategory = (slug) => {
    if (!slug || getCache(`products-${slug}`)) return
    // Fetch silently in background
    fetchProductsBySlug(slug).catch(() => {})
  }

  const prefetchHomepage = () => {
    if (getCache('homepage-all')) return
    fetchHomepageData().catch(() => {})
  }

  return { prefetchCategory, prefetchHomepage }
}