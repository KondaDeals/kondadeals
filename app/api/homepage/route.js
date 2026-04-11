import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  try {
    const [banners, cats, featured, trending, newArr, trust] = await Promise.all([
      supabase.from('hero_banners').select('id,title,subtitle,description,badge_text,cta_text,cta_link,bg_gradient,bg_type,bg_image,overlay_opacity,text_color,button_color,button_text_color,emoji,sort_order').eq('is_active', true).order('sort_order').limit(5),
      supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order').limit(10),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,is_featured,discount_ends_at,categories(name)').eq('is_featured', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,categories(name)').eq('is_trending', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('products').select('id,name,slug,mrp,sale_price,images,is_trending,discount_ends_at,categories(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('trust_strips').select('id,title,subtitle,icon_svg,icon_color,sort_order').eq('is_active', true).order('sort_order').limit(6),
    ])

    return NextResponse.json({
      banners: banners.data || [],
      categories: cats.data || [],
      featured: featured.data || [],
      trending: trending.data || [],
      newArrivals: newArr.data || [],
      trustStrips: trust.data || [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}