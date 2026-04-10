'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { SlidersHorizontal, Grid, List, ChevronDown } from 'lucide-react'

export default function CollectionPage() {
  const { slug } = useParams()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    fetchProducts()
  }, [slug, sortBy, priceRange])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('id,name,slug,mrp,sale_price,images,is_trending,is_featured,is_new_arrival,discount_ends_at,stock,category_id,categories(name)')
        .eq('is_active', true)

      // Filter by category
      if (slug && slug !== 'all' && slug !== 'new-arrivals') {
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('slug', slug)
          .single()

        if (catData) {
          setCategory(catData)
          query = query.eq('category_id', catData.id)
        }
      } else if (slug === 'new-arrivals') {
        setCategory({ name: 'New Arrivals' })
        query = query.eq('is_new_arrival', true)
      } else {
        setCategory({ name: 'All Products' })
      }

      // Price filter
      if (priceRange === 'under99') query = query.lte('sale_price', 99)
      else if (priceRange === 'under299') query = query.lte('sale_price', 299)
      else if (priceRange === 'under499') query = query.lte('sale_price', 499)
      else if (priceRange === 'above499') query = query.gte('sale_price', 499)

      // Sort
      if (sortBy === 'price_low') query = query.order('sale_price', { ascending: true })
      else if (sortBy === 'price_high') query = query.order('sale_price', { ascending: false })
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
      else if (sortBy === 'discount') query = query.order('mrp', { ascending: false })

      const { data, error } = await query
      if (data) setProducts(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'discount', label: 'Best Discount' },
  ]

  const priceOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'under99', label: 'Under ₹99' },
    { value: 'under299', label: 'Under ₹299' },
    { value: 'under499', label: 'Under ₹499' },
    { value: 'above499', label: 'Above ₹499' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '8px' }}>
            <span>Home</span> <span>›</span>
            <span style={{ color: '#e53935' }}>{category?.name || 'Products'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>
                {category?.name || 'All Products'}
              </h1>
              <p style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>
                {loading ? 'Loading...' : `${products.length} products found`}
              </p>
            </div>

            {/* Sort & Filter Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Price Filter */}
              <div style={{ position: 'relative' }}>
                <select
                  value={priceRange}
                  onChange={e => setPriceRange(e.target.value)}
                  style={{
                    padding: '8px 32px 8px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: 'white',
                    fontWeight: '500',
                    outline: 'none',
                    appearance: 'none'
                  }}
                >
                  {priceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 32px 8px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: 'white',
                    fontWeight: '500',
                    outline: 'none',
                    appearance: 'none'
                  }}
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'grid' ? '#e53935' : 'white',
                    color: viewMode === 'grid' ? 'white' : '#666',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'list' ? '#e53935' : 'white',
                    color: viewMode === 'list' ? 'white' : '#666',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '12px',
                height: '320px',
                animation: 'pulse 1.5s infinite'
              }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛍️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              No products found
            </h2>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Try changing your filters or browse other categories
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid'
              ? 'repeat(auto-fill, minmax(200px, 1fr))'
              : '1fr',
            gap: '16px'
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}