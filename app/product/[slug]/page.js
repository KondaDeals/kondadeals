'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import DiscountTimer from '@/components/DiscountTimer'
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, Zap, Plus, Minus } from 'lucide-react'

export default function ProductPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const { addToCart, toggleWishlist, isInWishlist } = useStore()

  useEffect(() => {
    fetchProduct()
  }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single()

    if (data) {
      setProduct(data)
      // Fetch related
      const { data: related } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('category_id', data.category_id)
        .neq('id', data.id)
        .limit(4)
      if (related) setRelatedProducts(related)
    }
    setLoading(false)
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    toast.success('Added to cart!')
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    router.push('/cart')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div style={{ background: 'white', borderRadius: '16px', height: '400px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', height: '40px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '64px' }}>😕</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '16px' }}>Product not found</h2>
      </div>
      <Footer />
    </div>
  )

  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)
  const inWishlist = isInWishlist(product.id)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '20px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span>
          <span>›</span>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push(`/collections/${product.categories?.slug}`)}>
            {product.categories?.name}
          </span>
          <span>›</span>
          <span style={{ color: '#333' }}>{product.name.substring(0, 40)}...</span>
        </div>

        {/* Main Product Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', background: 'white', borderRadius: '16px', padding: '32px' }}>

          {/* Image */}
          <div>
            <div style={{
              background: '#f8f8f8',
              borderRadius: '12px',
              padding: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '350px',
              position: 'relative'
            }}>
              {discount > 0 && (
                <div style={{
                  position: 'absolute', top: '16px', left: '16px',
                  background: '#e53935', color: 'white',
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '700'
                }}>
                  {discount}% OFF
                </div>
              )}
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name}
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{
                  width: '160px', height: '160px',
                  background: 'linear-gradient(135deg, #e53935, #ff6f00)',
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '72px'
                }}>🛍️</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ background: '#fff5f5', color: '#e53935', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {product.categories?.name}
              </span>
              {product.is_trending && (
                <span style={{ background: '#fff3e0', color: '#ff6f00', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginLeft: '8px' }}>
                  🔥 Trending
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', lineHeight: '1.3' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} color="#ff6f00" fill={s <= 4 ? '#ff6f00' : 'none'} />
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#666' }}>4.0 (128 reviews)</span>
            </div>

            {/* Price */}
            <DiscountTimer endsAt={product.discount_ends_at} />
            <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#e53935' }}>
                  ₹{product.sale_price}
                </span>
                <span style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through' }}>
                  ₹{product.mrp}
                </span>
                <span style={{ background: '#e53935', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                  {discount}% OFF
                </span>
              </div>
              <p style={{ color: '#2e7d32', fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
                ✅ You save ₹{product.mrp - product.sale_price}!
              </p>
            </div>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.stock > 0 ? '#2e7d32' : '#e53935' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: product.stock > 0 ? '#2e7d32' : '#e53935' }}>
                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '8px 14px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}
                >
                  −
                </button>
                <span style={{ padding: '8px 20px', fontWeight: '700', fontSize: '16px' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ padding: '8px 14px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{
                  flex: 1, minWidth: '140px',
                  background: 'white', color: '#e53935',
                  border: '2px solid #e53935',
                  padding: '14px 20px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                style={{
                  flex: 1, minWidth: '140px',
                  background: '#e53935', color: 'white',
                  border: 'none',
                  padding: '14px 20px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#c62828' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e53935' }}
              >
                <Zap size={18} /> Buy Now
              </button>
              <button
                onClick={() => { toggleWishlist(product); toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist!') }}
                style={{
                  background: inWishlist ? '#fff5f5' : 'white',
                  border: `2px solid ${inWishlist ? '#e53935' : '#e0e0e0'}`,
                  padding: '14px 16px', borderRadius: '10px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Heart size={20} color={inWishlist ? '#e53935' : '#999'} fill={inWishlist ? '#e53935' : 'none'} />
              </button>
            </div>

            {/* Delivery Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { icon: <Truck size={16} color="#2e7d32" />, text: 'Free delivery above ₹499' },
                { icon: <Shield size={16} color="#1565c0" />, text: '100% genuine product' },
                { icon: <RefreshCw size={16} color="#ff6f00" />, text: '7-day easy returns' },
                { icon: <Zap size={16} color="#e53935" />, text: 'Fast shipping' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f8f8', padding: '10px', borderRadius: '8px' }}>
                  {item.icon}
                  <span style={{ fontSize: '12px', color: '#555' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #f0f0f0', marginBottom: '24px' }}>
            {['description', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '12px 24px', border: 'none', cursor: 'pointer',
                background: 'none', fontSize: '14px', fontWeight: '700',
                color: activeTab === tab ? '#e53935' : '#999',
                borderBottom: activeTab === tab ? '2px solid #e53935' : '2px solid transparent',
                marginBottom: '-2px', textTransform: 'capitalize'
              }}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div>
              <p style={{ color: '#555', lineHeight: '1.8', fontSize: '15px' }}>
                {product.description || 'No description available.'}
              </p>
              {product.tags && product.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                  {product.tags.map(tag => (
                    <span key={tag} style={{ background: '#f5f5f5', color: '#666', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: '#f8f8f8', padding: '20px', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#1a1a1a' }}>4.0</div>
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} color="#ff6f00" fill={s <= 4 ? '#ff6f00' : 'none'} />)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>128 reviews</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5,4,3,2,1].map(star => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#666', width: '20px' }}>{star}★</span>
                      <div style={{ flex: 1, height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${star === 4 ? 60 : star === 5 ? 25 : star === 3 ? 10 : 3}%`, height: '100%', background: '#ff6f00', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Sample reviews */}
              {[
                { name: 'Rahul K.', rating: 5, comment: 'Excellent product! Exactly as described. Fast delivery too.', date: '2 days ago' },
                { name: 'Priya S.', rating: 4, comment: 'Good quality for the price. Very happy with the purchase!', date: '1 week ago' },
                { name: 'Amit T.', rating: 4, comment: 'Works perfectly. Would recommend to everyone.', date: '2 weeks ago' },
              ].map((review, i) => (
                <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
                        {review.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{review.name}</div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={11} color="#ff6f00" fill={s <= review.rating ? '#ff6f00' : 'none'} />)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#999' }}>{review.date}</span>
                  </div>
                  <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '16px' }}>
              Related Products
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}