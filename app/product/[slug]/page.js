'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import DiscountTimer from '@/components/DiscountTimer'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, Zap, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

const formatINR = n => n?.toLocaleString('en-IN') || '0'

export default function ProductPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [freeDeliveryAmount, setFreeDeliveryAmount] = useState(499)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', hoverRating: 0 })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const { addToCart, toggleWishlist, isInWishlist, user } = useStore()
  const touchStartX = useRef(null)

  useEffect(() => { fetchProduct(); fetchSettings() }, [slug])

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'free_delivery_amount').single()
    if (data?.value) setFreeDeliveryAmount(parseInt(data.value) || 499)
  }

  const fetchProduct = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products').select('*, categories(name, slug)')
      .eq('slug', slug).single()
    if (data) {
      setProduct(data)
      fetchRelated(data.category_id, data.id)
      fetchReviews(data.id)
    }
    setLoading(false)
  }

  const fetchRelated = async (catId, productId) => {
    const { data } = await supabase.from('products').select('*, categories(name)')
      .eq('category_id', catId).neq('id', productId).limit(4)
    if (data) setRelatedProducts(data)
  }

  const fetchReviews = async (productId) => {
    const { data } = await supabase.from('reviews').select('*, profiles(full_name)')
      .eq('product_id', productId).eq('is_approved', true).eq('is_hidden', false)
      .order('created_at', { ascending: false })
    if (data) {
      setReviews(data)
      if (user) {
        const mine = data.find(r => r.user_id === user.id)
        if (mine) setUserReview(mine)
      }
    }
  }

  const submitReview = async () => {
    if (!user) { toast.error('Please login to review'); router.push('/login'); return }
    if (reviewForm.rating === 0) { toast.error('Please select a rating'); return }
    if (!reviewForm.comment.trim()) { toast.error('Please write a review'); return }
    setSubmittingReview(true)
    const reviewData = {
      product_id: product.id, user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      rating: reviewForm.rating, comment: reviewForm.comment,
      is_approved: false
    }
    if (userReview) {
      await supabase.from('reviews').update(reviewData).eq('id', userReview.id)
    } else {
      await supabase.from('reviews').insert(reviewData)
    }
    toast.success('Review submitted! Awaiting approval.')
    setReviewForm({ rating: 0, comment: '', hoverRating: 0 })
    setSubmittingReview(false)
    fetchReviews(product.id)
  }

  const deleteReview = async () => {
    if (!userReview) return
    await supabase.from('reviews').delete().eq('id', userReview.id)
    setUserReview(null)
    toast.success('Review deleted')
    fetchReviews(product.id)
  }

  const images = product?.images?.length > 0 ? product.images : null

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = e => {
    if (!touchStartX.current || !images) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveImage(i => Math.min(i + 1, images.length - 1))
      else setActiveImage(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  if (loading) return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {[...Array(2)].map((_, i) => <div key={i} style={{ background: '#f0f0f0', borderRadius: '16px', height: '400px' }} />)}
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100vh' }}><Navbar />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '48px' }}>😕</div>
        <h2 style={{ fontSize: '24px', marginTop: '16px' }}>Product not found</h2>
      </div>
      <Footer />
    </div>
  )

  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)
  const inWishlist = isInWishlist(product.id)
  const totalPrice = product.sale_price * quantity
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  const returnPolicyText = {
    'no_return': { text: 'No Return', color: '#e53935', icon: '❌' },
    '7_days': { text: '7-Day Easy Returns', color: '#2e7d32', icon: '↩️' },
    '10_days': { text: '10-Day Returns', color: '#2e7d32', icon: '↩️' },
    '30_days': { text: '30-Day Returns', color: '#2e7d32', icon: '↩️' },
  }
  const returnInfo = returnPolicyText[product.return_policy] || returnPolicyText['7_days']

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', color: '#e53935' }} onClick={() => router.push('/')}>Home</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: '#e53935' }} onClick={() => router.push(`/collections/${product.categories?.slug}`)}>
            {product.categories?.name}
          </span>
          <span>›</span>
          <span style={{ color: '#333' }}>{product.name.substring(0, 50)}</span>
        </div>

        {/* Main Product */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* ===== IMAGE GALLERY ===== */}
          <div>
            {images ? (
              <div>
                {/* Main Image */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => { setLightboxIndex(activeImage); setLightboxOpen(true) }}
                  style={{
                    background: '#f8f8f8', borderRadius: '12px',
                    aspectRatio: '1', overflow: 'hidden', position: 'relative',
                    cursor: 'zoom-in', marginBottom: '12px'
                  }}
                >
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                  {/* Zoom hint */}
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ZoomIn size={12} /> Click to zoom
                  </div>
                  {/* Discount badge */}
                  {discount > 0 && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#e53935', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                      {discount}% OFF
                    </div>
                  )}
                  {/* Nav arrows for multiple images */}
                  {images.length > 1 && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setActiveImage(i => Math.max(i - 1, 0)) }}
                        style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', opacity: activeImage === 0 ? 0.3 : 1 }}>
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setActiveImage(i => Math.min(i + 1, images.length - 1)) }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', opacity: activeImage === images.length - 1 ? 0.3 : 1 }}>
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  {/* Image counter */}
                  {images.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {activeImage + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {images.map((img, i) => (
                      <div key={i} onClick={() => setActiveImage(i)}
                        style={{
                          width: '72px', height: '72px', flexShrink: 0,
                          borderRadius: '8px', overflow: 'hidden',
                          border: `2.5px solid ${i === activeImage ? '#e53935' : '#e0e0e0'}`,
                          cursor: 'pointer', background: '#f8f8f8',
                          transition: 'all 0.2s',
                          opacity: i === activeImage ? 1 : 0.7
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#e53935'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = i === activeImage ? '#e53935' : '#e0e0e0'}
                      >
                        <img src={img} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #e53935, #ff6f00)', borderRadius: '16px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
                🛍️
              </div>
            )}
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#fff5f5', color: '#e53935', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {product.categories?.name}
              </span>
              {product.is_trending && (
                <span style={{ background: '#fff3e0', color: '#ff6f00', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  🔥 Trending
                </span>
              )}
              {product.is_new_arrival && (
                <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  🆕 New
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', lineHeight: '1.3' }}>
              {product.name}
            </h1>

            {/* Rating — only show if real reviews exist */}
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} color="#ff6f00" fill={s <= Math.round(avgRating) ? '#ff6f00' : 'none'} />
                  ))}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{avgRating}</span>
                <span style={{ fontSize: '13px', color: '#666' }}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
            {!avgRating && reviews.length === 0 && (
              <div style={{ fontSize: '13px', color: '#999' }}>No reviews yet — be the first to review!</div>
            )}

            {/* Discount Timer */}
            <DiscountTimer endsAt={product.discount_ends_at} />

            {/* Price */}
            <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#e53935' }}>₹{formatINR(product.sale_price)}</span>
                <span style={{ fontSize: '16px', color: '#999', textDecoration: 'line-through' }}>₹{formatINR(product.mrp)}</span>
                <span style={{ background: '#e53935', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>{discount}% OFF</span>
              </div>
              <p style={{ color: '#2e7d32', fontSize: '13px', fontWeight: '600', marginTop: '6px' }}>
                ✅ You save ₹{formatINR(product.mrp - product.sale_price)}!
              </p>
              {/* Dynamic Free Delivery Message */}
              <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: totalPrice >= freeDeliveryAmount ? '#e8f5e9' : '#fff3e0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} color={totalPrice >= freeDeliveryAmount ? '#2e7d32' : '#e65100'} />
                {totalPrice >= freeDeliveryAmount ? (
                  <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '700' }}>
                    ✅ Eligible for FREE Delivery!
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#e65100', fontWeight: '600' }}>
                    Add ₹{formatINR(freeDeliveryAmount - totalPrice)} more for FREE delivery
                  </span>
                )}
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '8px 14px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>−</button>
                <span style={{ padding: '8px 20px', fontWeight: '700', fontSize: '16px' }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '8px 14px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}>+</button>
              </div>
              <span style={{ fontSize: '13px', color: '#999' }}>Total: <strong style={{ color: '#e53935' }}>₹{formatINR(totalPrice)}</strong></span>
            </div>

           {/* Buttons */}
<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
  <button
    onClick={() => { addToCart(product, quantity); toast.success('Added to cart!') }}
    disabled={product.stock === 0}
    style={{
      flex: '1 1 120px', minWidth: '0',
      background: 'white', color: '#e53935',
      border: '2px solid #e53935', padding: '14px 10px',
      borderRadius: '10px', fontSize: '14px', fontWeight: '700',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
    <ShoppingCart size={16} /> Add to Cart
  </button>
  <button
    onClick={() => { addToCart(product, quantity); router.push('/cart') }}
    disabled={product.stock === 0}
    style={{
      flex: '1 1 120px', minWidth: '0',
      background: '#e53935', color: 'white',
      border: 'none', padding: '14px 10px',
      borderRadius: '10px', fontSize: '14px', fontWeight: '700',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#c62828'}
    onMouseLeave={e => e.currentTarget.style.background = '#e53935'}>
    <Zap size={16} /> Buy Now
  </button>
  <button
    onClick={() => { toggleWishlist(product); toast.success(inWishlist ? 'Removed' : 'Added to wishlist!') }}
    style={{
      flexShrink: 0, width: '52px',
      background: inWishlist ? '#fff5f5' : 'white',
      border: `2px solid ${inWishlist ? '#e53935' : '#e0e0e0'}`,
      padding: '14px', borderRadius: '10px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
    <Heart size={18} color={inWishlist ? '#e53935' : '#999'} fill={inWishlist ? '#e53935' : 'none'} />
  </button>
</div>

            {/* Trust Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: <Truck size={14} color="#2e7d32" />, text: `Free delivery above ₹${formatINR(freeDeliveryAmount)}` },
                { icon: <Shield size={14} color="#1565c0" />, text: '100% genuine product' },
                { icon: <span style={{ fontSize: '12px' }}>{returnInfo.icon}</span>, text: returnInfo.text, color: returnInfo.color },
                { icon: <Zap size={14} color="#e53935" />, text: 'Fast shipping' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f8f8', padding: '10px', borderRadius: '8px' }}>
                  {item.icon}
                  <span style={{ fontSize: '12px', color: item.color || '#555' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginTop: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #f0f0f0', marginBottom: '24px', overflowX: 'auto' }}>
            {['description', 'reviews'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '12px 28px', border: 'none', cursor: 'pointer', background: 'none',
                fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap',
                color: activeTab === t ? '#e53935' : '#999',
                borderBottom: activeTab === t ? '2px solid #e53935' : '2px solid transparent',
                marginBottom: '-2px', textTransform: 'capitalize'
              }}>
                {t} {t === 'reviews' && reviews.length > 0 && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div>
              <p style={{ color: '#555', lineHeight: '1.8', fontSize: '15px', marginBottom: '16px' }}>
                {product.description || 'No description available.'}
              </p>
              {product.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.tags.map(tag => (
                    <span key={tag} style={{ background: '#f5f5f5', color: '#666', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Review Summary — only if real reviews */}
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: '#f8f8f8', padding: '20px', borderRadius: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '52px', fontWeight: '900', color: '#1a1a1a', lineHeight: '1' }}>{avgRating}</div>
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} color="#ff6f00" fill={s <= Math.round(avgRating) ? '#ff6f00' : 'none'} />)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{reviews.length} reviews</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length
                      const pct = reviews.length > 0 ? (count / reviews.length * 100) : 0
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#666', width: '20px', textAlign: 'right' }}>{star}★</span>
                          <div style={{ flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#ff6f00', borderRadius: '4px', transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#999', width: '20px' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8f8f8', borderRadius: '12px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>No reviews yet</h3>
                  <p style={{ fontSize: '14px', color: '#999' }}>Be the first to review this product!</p>
                </div>
              )}

              {/* Write Review */}
              {user ? (
                <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                    {userReview ? '✏️ Edit Your Review' : '✍️ Write a Review'}
                  </h3>
                  {/* Star Rating Input */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s}
                        onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                        onMouseEnter={() => setReviewForm(f => ({ ...f, hoverRating: s }))}
                        onMouseLeave={() => setReviewForm(f => ({ ...f, hoverRating: 0 }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                        <Star size={28} color="#ff6f00"
                          fill={(reviewForm.hoverRating || reviewForm.rating) >= s ? '#ff6f00' : 'none'} />
                      </button>
                    ))}
                    {reviewForm.rating > 0 && (
                      <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px', alignSelf: 'center' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#e53935'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button onClick={submitReview} disabled={submittingReview}
                      style={{ background: '#e53935', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                      {submittingReview ? '⏳ Submitting...' : userReview ? '✏️ Update Review' : '✅ Submit Review'}
                    </button>
                    {userReview && (
                      <button onClick={deleteReview}
                        style={{ background: 'white', color: '#e53935', border: '1.5px solid #e53935', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                    ⚠️ Reviews are moderated before appearing publicly.
                  </p>
                </div>
              ) : (
                <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '12px' }}>Please login to write a review</p>
                  <button onClick={() => router.push(`/login?redirect=/product/${slug}`)}
                    style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    Login to Review
                  </button>
                </div>
              )}

              {/* Review List */}
              {reviews.map(review => (
                <div key={review.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                        {(review.user_name || review.profiles?.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{review.user_name || review.profiles?.full_name || 'Customer'}</div>
                        <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} color="#ff6f00" fill={s <= review.rating ? '#ff6f00' : 'none'} />)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#999', flexShrink: 0 }}>
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6', marginLeft: '50px' }}>{review.comment}</p>
                  {review.user_id === user?.id && (
                    <div style={{ marginLeft: '50px', marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setReviewForm({ rating: review.rating, comment: review.comment, hoverRating: 0 }); setUserReview(review) }}
                        style={{ background: 'none', border: 'none', color: '#1565c0', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>✏️ Edit</button>
                      <button onClick={deleteReview}
                        style={{ background: 'none', border: 'none', color: '#e53935', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>🗑️ Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '16px' }}>Related Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ===== LIGHTBOX ===== */}
      {lightboxOpen && images && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxOpen(false)}
        >
          <button onClick={() => setLightboxOpen(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px' }}>
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => Math.max(i - 1, 0)) }}
                style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: lightboxIndex === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => Math.min(i + 1, images.length - 1)) }}
                style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: lightboxIndex === images.length - 1 ? 0.3 : 1 }}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <img
            src={images[lightboxIndex]} alt={product.name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '8px' }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                  style={{ width: i === lightboxIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === lightboxIndex ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  )
}