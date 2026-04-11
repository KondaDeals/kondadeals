import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 30

export async function GET() {
  try {
    const [banners, cats, featured, trending, newArr, trust] = await Promise.allSettled([
      supabase.from('hero_banners').select('id,title,subtitle,description,badge_text,cta_text,cta_link,bg_gradient,bg_type,bg_image,overlay_opacity,text_color,button_color,button_text_color,emoji,sort_order').eq('is_active', true).order('sort_order').limit(5),
      supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order').limit(12),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,categories(name)').eq('is_featured', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,categories(name)').eq('is_trending', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,categories(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('trust_strips').select('id,title,subtitle,icon_svg,icon_color,sort_order').eq('is_active', true).order('sort_order').limit(6),
    ])

    // Use Promise.allSettled so partial failure still returns data
    const safe = (res) => res.status === 'fulfilled' ? (res.value?.data || []) : []

    return NextResponse.json({
      banners: safe(banners),
      categories: safe(cats),
      featured: safe(featured),
      trending: safe(trending),
      newArrivals: safe(newArr),
      trustStrips: safe(trust),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      }
    })
  } catch (err) {
    return NextResponse.json({
      banners: [], categories: [], featured: [],
      trending: [], newArrivals: [], trustStrips: [],
      error: err.message
    }, {
      status: 200, // Return 200 even on error so client uses fallback
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}