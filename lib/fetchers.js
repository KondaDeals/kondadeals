import { supabase } from './supabase'
import { getCache, setCache } from './dataCache'

// Products for a specific category slug
export async function fetchProductsBySlug(slug) {
  const cacheKey = `products-${slug}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  let products = []

  if (slug === 'all' || !slug) {
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, slug, mrp, sale_price, images,
        is_trending, is_featured, stock,
        discount_ends_at, product_coupon_enabled,
        categories!inner(name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60)
    products = data || []

  } else if (slug === 'new-arrivals') {
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, slug, mrp, sale_price, images,
        is_trending, stock, discount_ends_at,
        categories!inner(name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(40)
    products = data || []

  } else {
    const { data: cat } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()

    if (cat) {
      const { data } = await supabase
        .from('products')
        .select(`
          id, name, slug, mrp, sale_price, images,
          is_trending, stock, discount_ends_at,
          categories!inner(name, slug)
        `)
        .eq('is_active', true)
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })
        .limit(60)
      products = data || []
    }
  }

  setCache(cacheKey, products)
  return products
}

// Homepage data — all in one call
export async function fetchHomepageData() {
  const cacheKey = 'homepage-all'
  const cached = getCache(cacheKey)
  if (cached) return cached

  const [bannersRes, catsRes, newArrivalsRes, allProductsRes, trustRes] = await Promise.all([
    supabase
      .from('hero_banners')
      .select('id,title,subtitle,description,badge_text,cta_text,cta_link,bg_gradient,bg_type,bg_image,overlay_opacity,text_color,button_color,button_text_color,emoji,sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .limit(5),
    supabase
      .from('categories')
      .select('id,name,slug,image_url')
      .eq('is_active', true)
      .order('sort_order')
      .limit(12),
    // New Arrivals — latest products, newest first
    supabase
      .from('products')
      .select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,product_coupon_enabled,categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    // All Products — newest first
    supabase
      .from('products')
      .select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,product_coupon_enabled,categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(16),
    supabase
      .from('trust_strips')
      .select('id,title,subtitle,icon_svg,icon_color,sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .limit(6),
  ])

  const result = {
    banners: bannersRes.data || [],
    categories: catsRes.data || [],
    newArrivals: newArrivalsRes.data || [],
    allProducts: allProductsRes.data || [],
    trustStrips: trustRes.data || [],
    // Keep for backward compat
    featured: [],
    trending: [],
  }

  setCache(cacheKey, result)
  return result
}
// Single product page
export async function fetchProduct(slug) {
  const cacheKey = `product-${slug}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  const { data } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, mrp, sale_price,
      images, is_trending, is_featured, is_new_arrival,
      stock, discount_ends_at, return_policy,
      product_coupon_enabled, product_coupon_code,
      product_coupon_type, product_coupon_value,
      product_coupon_min_qty, product_coupon_end_date,
      product_coupon_active, category_id,
      categories(name, slug)
    `)
    .eq('slug', slug)
    .single()

  if (data) setCache(cacheKey, data)
  return data
}