'use client'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { Grid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react'

const formatINR = n => n?.toLocaleString('en-IN') || '0'

// Memoized product card for collections
const CollectionCard = memo(({ product, viewMode, onAddToCart }) => {
  const [imgError, setImgError] = useState(false)
  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)

  if (viewMode === 'list') {
    return (
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', display: 'flex', gap: '16px', padding: '16px', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '100px', height: '100px', background: '#f8f8f8', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.images?.[0] && !imgError ? (
              <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setImgError(true)} />
            ) : <span style={{ fontSize: '36px' }}>🛍️</span>}
          </div>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>{product.categories?.name}</div>
          <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', lineHeight: '1.3' }}>{product.name}</div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53935' }}>₹{formatINR(product.sale_price)}</span>
            <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>₹{formatINR(product.mrp)}</span>
            {discount > 0 && <span style={{ background: '#ffebee', color: '#e53935', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{discount}% OFF</span>}
          </div>
          <button onClick={() => onAddToCart(product)}
            style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            🛒 Add to Cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', transition: 'all 0.2s', height: '100%' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f8f8f8', overflow: 'hidden' }}>
          {discount > 0 && <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#e53935', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', zIndex: 1 }}>{discount}% OFF</span>}
          {product.is_trending && <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#ff6f00', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', zIndex: 1 }}>⚡ HOT</span>}
          {product.images?.[0] && !imgError ? (
            <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              onError={() => setImgError(true)} />
          ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🛍️</div>}
        </div>
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>{product.categories?.name}</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#e53935' }}>₹{formatINR(product.sale_price)}</span>
            <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>₹{formatINR(product.mrp)}</span>
          </div>
        </div>
      </Link>
      <div style={{ padding: '10px 12px 12px' }}>
        <button onClick={() => onAddToCart(product)}
          style={{ width: '100%', background: '#e53935', color: 'white', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          🛒 Add to Cart
        </button>
      </div>
    </div>
  )
})
CollectionCard.displayName = 'CollectionCard'

// Skeleton
const Skeleton = () => (
  <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
    <div style={{ aspectRatio: '1', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    <div style={{ padding: '12px' }}>
      {[60, 100, 80, 40, '100%'].map((w, i) => (
        <div key={i} style={{ height: i === 4 ? '36px' : '12px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: w }} />
      ))}
    </div>
  </div>
)

export default function CollectionsPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { addToCart } = useStore()

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ price: 'all', sort: 'newest', minRating: 0, inStock: false, onSale: false })

  const isAll = slug === 'all'
  const isNewArrivals = slug === 'new-arrivals'
  const isBestSellers = slug === 'best-sellers'

  useEffect(() => {
    setLoading(true)
    setError(false)
    setAllProducts([])
    fetchProducts()
  }, [slug])

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('id,name,slug,mrp,sale_price,images,is_trending,is_featured,is_new_arrival,stock,discount_ends_at,category_id,categories(name,slug)')
        .eq('is_active', true)

      if (isNewArrivals) {
        query = query.order('created_at', { ascending: false }).limit(40)
        setCategoryName('New Arrivals')
      } else if (isBestSellers) {
        query = query.eq('is_featured', true).order('created_at', { ascending: false }).limit(40)
        setCategoryName('Best Sellers')
      } else if (!isAll) {
        // Get category first
        const { data: cat } = await supabase
          .from('categories')
          .select('id,name')
          .eq('slug', slug)
          .single()

        if (cat) {
          setCategoryName(cat.name)
          query = query.eq('category_id', cat.id).order('created_at', { ascending: false }).limit(60)
        } else {
          setCategoryName(slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
          query = query.order('created_at', { ascending: false }).limit(60)
        }
      } else {
        setCategoryName('All Products')
        query = query.order('created_at', { ascending: false }).limit(80)
      }

      const { data, error: err } = await query

      if (err) throw err
      setAllProducts(data || [])
      setError(false)
    } catch (err) {
      console.error('Products fetch error:', err)
      setError(true)
      // Retry once after 2 seconds
      setTimeout(() => retryFetch(), 2000)
    } finally {
      setLoading(false)
    }
  }

  const retryFetch = async () => {
    setLoading(true)
    setError(false)
    try {
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,mrp,sale_price,images,is_trending,stock,categories(name,slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40)
      if (data) setAllProducts(data)
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = useCallback((product) => {
    addToCart(product, 1)
    toast.success('Added to cart! 🛒')
  }, [addToCart])

  // Client-side filtering — no extra DB calls
  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    if (filters.inStock) result = result.filter(p => p.stock > 0)
    if (filters.onSale) result = result.filter(p => p.mrp > p.sale_price)

    if (filters.price !== 'all') {
      const ranges = {
        'under100': [0, 100], 'under299': [0, 299], 'under499': [0, 499],
        'under999': [0, 999], 'above999': [999, Infinity]
      }
      const [min, max] = ranges[filters.price] || [0, Infinity]
      result = result.filter(p => p.sale_price >= min && p.sale_price <= max)
    }

    switch (filters.sort) {
      case 'price_low': result.sort((a, b) => a.sale_price - b.sale_price); break
      case 'price_high': result.sort((a, b) => b.sale_price - a.sale_price); break
      case 'discount': result.sort((a, b) => ((b.mrp - b.sale_price) / b.mrp) - ((a.mrp - a.sale_price) / a.mrp)); break
      case 'oldest': result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break
      default: break // newest — already sorted from DB
    }

    return result
  }, [allProducts, filters])

  const displayName = categoryName || slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Products'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: '13px', color: '#999', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', color: '#e53935' }} onClick={() => router.push('/')}>Home</span>
          <span>›</span>
          <span style={{ color: '#333', fontWeight: '600' }}>{displayName}</span>
        </div>

        {/* Header + Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>{displayName}</h1>
            <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
              {loading ? '...' : `${filteredProducts.length} products found`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sort */}
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              style={{ padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer', outline: 'none' }}>
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="discount">Most Discount</option>
            </select>

            {/* Price Filter */}
            <select value={filters.price} onChange={e => setFilters(f => ({ ...f, price: e.target.value }))}
              style={{ padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer', outline: 'none' }}>
              <option value="all">All Prices</option>
              <option value="under100">Under ₹100</option>
              <option value="under299">Under ₹299</option>
              <option value="under499">Under ₹499</option>
              <option value="under999">Under ₹999</option>
              <option value="above999">Above ₹999</option>
            </select>

            {/* Quick filters */}
            <button onClick={() => setFilters(f => ({ ...f, inStock: !f.inStock }))}
              style={{ padding: '8px 12px', border: `1.5px solid ${filters.inStock ? '#e53935' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: filters.inStock ? '#fff5f5' : 'white', color: filters.inStock ? '#e53935' : '#666', cursor: 'pointer' }}>
              In Stock
            </button>
            <button onClick={() => setFilters(f => ({ ...f, onSale: !f.onSale }))}
              style={{ padding: '8px 12px', border: `1.5px solid ${filters.onSale ? '#e53935' : '#e0e0e0'}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: filters.onSale ? '#fff5f5' : 'white', color: filters.onSale ? '#e53935' : '#666', cursor: 'pointer' }}>
              On Sale
            </button>

            {/* View toggle */}
            <div style={{ display: 'flex', border: '1.5px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')}
                style={{ padding: '7px 10px', background: viewMode === 'grid' ? '#e53935' : 'white', color: viewMode === 'grid' ? 'white' : '#666', border: 'none', cursor: 'pointer' }}>
                <Grid size={16} />
              </button>
              <button onClick={() => setViewMode('list')}
                style={{ padding: '7px 10px', background: viewMode === 'list' ? '#e53935' : 'white', color: viewMode === 'list' ? 'white' : '#666', border: 'none', cursor: 'pointer' }}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Error State with Retry */}
        {error && !loading && (
          <div style={{ background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontWeight: '700', color: '#c62828', marginBottom: '8px' }}>Failed to load products</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Check your connection and try again</p>
            <button onClick={fetchProducts}
              style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Retry
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛍️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>No products found</h3>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>Try changing your filters or browse other categories</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setFilters({ price: 'all', sort: 'newest', minRating: 0, inStock: false, onSale: false })}
                style={{ background: '#f5f5f5', color: '#666', border: '1px solid #e0e0e0', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Clear Filters
              </button>
              <button onClick={() => router.push('/collections/all')}
                style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                View All Products
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {filteredProducts.map(p => (
              <CollectionCard key={p.id} product={p} viewMode={viewMode} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}