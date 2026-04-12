import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 60

export async function GET(request, { params }) {
  const { slug } = params

  try {
    let products = []
    let categoryName = ''

    if (slug === 'all') {
      categoryName = 'All Products'
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,mrp,sale_price,images,is_trending,stock,categories(name,slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(80)
      products = data || []

    } else if (slug === 'new-arrivals') {
      categoryName = 'New Arrivals'
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,mrp,sale_price,images,is_trending,stock,categories(name,slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40)
      products = data || []

    } else {
      const { data: cat } = await supabase
        .from('categories')
        .select('id,name')
        .eq('slug', slug)
        .single()

      if (cat) {
        categoryName = cat.name
        const { data } = await supabase
          .from('products')
          .select('id,name,slug,mrp,sale_price,images,is_trending,stock,categories(name,slug)')
          .eq('is_active', true)
          .eq('category_id', cat.id)
          .order('created_at', { ascending: false })
          .limit(60)
        products = data || []
      }
    }

    return NextResponse.json({ products, categoryName }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    })
  } catch (err) {
    return NextResponse.json({ products: [], categoryName: '', error: err.message }, { status: 200 })
  }
}