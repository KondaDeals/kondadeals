'use client'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ChevronRight, Zap, TrendingUp, Star, Shield, Truck, RefreshCw, Tag } from 'lucide-react'
import { fetchHomepageData } from '@/lib/fetchers'
import { preload } from '@/lib/dataCache'
import { fetchProductsBySlug } from '@/lib/fetchers'

// Memoized ProductCard to prevent re-renders
const LazyProductCard = memo(({ product }) => {
  const [inView, setInView] = useState(false)
  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)
  const formatINR = n => n?.toLocaleString('en-IN') || '0'

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px' }
    )
    const el = document.getElementById(`pc-${product.id}`)
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [product.id])

  return (
    <div id={`pc-${product.id}`}>
      {inView ? (
        <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid #f0f0f0', transition: 'all 0.2s',
            cursor: 'pointer', height: '100%'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ position: 'relative', aspectRatio: '1', background: '#f8f8f8', overflow: 'hidden' }}>
              {discount > 0 && (
                <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#e53935', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', zIndex: 1 }}>
                  {discount}% OFF
                </span>
              )}
              {product.is_trending && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#ff6f00', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  ⚡ HOT
                </span>
              )}
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🛍️</div>
              )}
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>{product.categories?.name}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {product.name}
              </div>
              {product.discount_ends_at && new Date(product.discount_ends_at) > new Date() && (
                <div style={{ background: 'linear-gradient(135deg, #e53935, #ff6f00)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  ⏰ DEAL ENDS SOON
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53935' }}>₹{formatINR(product.sale_price)}</span>
                <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>₹{formatINR(product.mrp)}</span>
              </div>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation() }}
                style={{ width: '100%', background: '#e53935', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </Link>
      ) : (
        <div style={{ background: '#f0f0f0', borderRadius: '12px', aspectRatio: '0.75', animation: 'shimmer 1.5s infinite' }} />
      )}
    </div>
  )
})
LazyProductCard.displayName = 'LazyProductCard'

// Skeleton loader
const ProductSkeleton = () => (
  <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
    <div style={{ aspectRatio: '1', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    <div style={{ padding: '12px' }}>
      <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '60%' }} />
      <div style={{ height: '14px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '6px' }} />
      <div style={{ height: '14px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '10px', width: '80%' }} />
      <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '10px', width: '40%' }} />
      <div style={{ height: '36px', background: '#f0f0f0', borderRadius: '8px' }} />
    </div>
  </div>
)

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [heroBanners, setHeroBanners] = useState([])
  const [trustStrips, setTrustStrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [bannerLoaded, setBannerLoaded] = useState(false)

  const categoryIcons = useMemo(() => ({
    'viral-gadgets': '⚡', 'home-decor': '🏠', 'kitchen-tools': '🍳',
    'tech-accessories': '📱', 'toys-games': '🎮', 'beauty-care': '💄',
    'skin-care': '✨',
  }), [])

  const displayBanners = useMemo(() => heroBanners.length > 0 ? heroBanners : [
    { title: 'Viral Gadgets', subtitle: 'Under ₹299', description: 'Trending products at unbeatable prices', badge_text: 'HOT DEALS', cta_text: 'Shop Now', cta_link: '/collections/viral-gadgets', bg_gradient: 'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)', bg_type: 'gradient', emoji: '⚡', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#e53935' },
    { title: 'New Arrivals', subtitle: 'Just Landed', description: 'Fresh products everyone is buying', badge_text: 'NEW', cta_text: 'Explore Now', cta_link: '/collections/new-arrivals', bg_gradient: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', bg_type: 'gradient', emoji: '🆕', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#1a237e' },
    { title: 'Home Decor', subtitle: 'Up to 70% OFF', description: 'Beautiful decor for every home', badge_text: 'SALE', cta_text: 'Shop Now', cta_link: '/collections/home-decor', bg_gradient: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', bg_type: 'gradient', emoji: '🏠', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#2e7d32' },
  ], [heroBanners])

  // Fetch critical data first, then secondary
  useEffect(() => {
    fetchCriticalData()
  }, [])

  // Auto-rotate banners
  useEffect(() => {
    if (displayBanners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % displayBanners.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [displayBanners.length])

// Inside component, replace fetchCriticalData:
const fetchCriticalData = useCallback(async () => {
  try {
    const data = await fetchHomepageData()
    if (data.banners?.length > 0) setHeroBanners(data.banners)
    if (data.categories?.length > 0) {
      setCategories(data.categories)
      // Preload first 3 categories in background
      data.categories.slice(0, 3).forEach(cat => {
        preload(`products-${cat.slug}`, () => fetchProductsBySlug(cat.slug))
      })
    }
    setBannerLoaded(true)
    if (data.featured?.length > 0) setFeaturedProducts(data.featured)
    if (data.trending?.length > 0) setTrendingProducts(data.trending)
    if (data.newArrivals?.length > 0) setNewArrivals(data.newArrivals)
    setLoading(false)
  } catch (err) {
    console.error(err)
    setLoading(false)
  }
}, [])

const fetchFromSupabase = async () => {
  const [bannerRes, catRes] = await Promise.all([
    supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order').limit(5),
    supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order').limit(10),
  ])
  if (bannerRes.data?.length > 0) setHeroBanners(bannerRes.data)
  if (catRes.data) setCategories(catRes.data)
  setBannerLoaded(true)
}


  const getBannerBackground = useCallback((banner) => {
    if (!banner) return '#e53935'
    const type = banner.bg_type || 'gradient'
    if ((type === 'image' || type === 'image_overlay') && banner.bg_image) {
      return `url(${banner.bg_image}) center/cover no-repeat`
    }
    if (type === 'none') return '#f8f8f8'
    return banner.bg_gradient || 'linear-gradient(135deg, #e53935, #ff6f00)'
  }, [])

  const banner = displayBanners[currentBanner % displayBanners.length]

  const trustItems = useMemo(() => trustStrips.length > 0 ? trustStrips : [
    { icon_svg: 'truck', icon_color: '#e53935', title: 'Free Delivery', subtitle: 'Above ₹499' },
    { icon_svg: 'shield', icon_color: '#e53935', title: '100% Genuine', subtitle: 'Verified Products' },
    { icon_svg: 'refresh', icon_color: '#e53935', title: 'Easy Returns', subtitle: '7 Day Policy' },
    { icon_svg: 'tag', icon_color: '#e53935', title: 'Best Price', subtitle: 'Guaranteed' },
  ], [trustStrips])

  const TrustIcon = useCallback(({ type, color }) => {
    const props = { size: 20, color: color || '#e53935' }
    if (type === 'truck') return <Truck {...props} />
    if (type === 'shield') return <Shield {...props} />
    if (type === 'refresh') return <RefreshCw {...props} />
    return <Tag {...props} />
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <Navbar />

      {/* HERO BANNER — Critical, loads first */}
      {bannerLoaded && banner ? (
        <div style={{
          background: getBannerBackground(banner),
          padding: 'clamp(32px, 6vw, 64px) 20px',
          transition: 'background 0.6s ease',
          position: 'relative', overflow: 'hidden', minHeight: '200px'
        }}>
          {(banner.bg_type || 'gradient') === 'image_overlay' && banner.bg_image && (
            <div style={{ position: 'absolute', inset: 0, background: banner.bg_gradient, opacity: (banner.overlay_opacity || 50) / 100, zIndex: 0 }} />
          )}
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', position: 'relative', zIndex: 1 }}>
            <div style={{ color: banner.text_color || 'white', flex: 1 }}>
              {banner.badge_text && (
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>
                  {banner.badge_text}
                </span>
              )}
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: '900', marginTop: '12px', lineHeight: '1.1', margin: '12px 0 0' }}>
                {banner.title}<br />
                <span style={{ opacity: 0.85 }}>{banner.subtitle}</span>
              </h1>
              <p style={{ fontSize: 'clamp(13px, 2vw, 16px)', marginTop: '10px', opacity: 0.9 }}>{banner.description}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                <Link href={banner.cta_link || '/collections/all'}>
                  <button style={{ background: banner.button_color || 'white', color: banner.button_text_color || '#e53935', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {banner.cta_text} <ChevronRight size={18} />
                  </button>
                </Link>
                <Link href="/collections/all">
                  <button style={{ background: 'transparent', color: banner.text_color || 'white', border: `2px solid ${banner.text_color || 'white'}`, padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                    View All
                  </button>
                </Link>
              </div>
            </div>
            <div style={{ fontSize: 'clamp(60px, 10vw, 120px)', flexShrink: 0, userSelect: 'none' }}>
              {banner.emoji}
            </div>
          </div>
          {/* Dots */}
          {displayBanners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', position: 'relative', zIndex: 1 }}>
              {displayBanners.map((_, i) => (
                <button key={i} onClick={() => setCurrentBanner(i)}
                  style={{ width: i === currentBanner ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #e53935, #ff6f00)', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: '700', opacity: 0.8 }}>KondaDeals</div>
        </div>
      )}

      {/* TRUST STRIP */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {trustItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#fff5f5', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                <TrustIcon type={item.icon_svg} color={item.icon_color} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: '#999' }}>{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>

        {/* CATEGORIES */}
        <div style={{ padding: '28px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>Shop by Category</h2>
            <Link href="/collections/all" style={{ textDecoration: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
            {categories.map(cat => (
              <Link key={cat.id} href={`/collections/${cat.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '16px 10px', textAlign: 'center', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e53935'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} loading="lazy" decoding="async"
                        style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                        onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>{categoryIcons[cat.slug] || '🛍️'}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* COUPON BANNER */}
        <div style={{ margin: '28px 0 0' }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', borderRadius: '16px', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ color: '#ff6f00', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>LIMITED TIME OFFER</div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>Get 50% OFF on your first order!</div>
              <div style={{ color: '#ccc', fontSize: '13px', marginTop: '4px' }}>Use code: <span style={{ color: '#ff6f00', fontWeight: '800', fontSize: '17px', letterSpacing: '2px' }}>KONDA50</span></div>
            </div>
            <Link href="/collections/all">
              <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Grab the Deal →
              </button>
            </Link>
          </div>
        </div>

        {/* FEATURED PRODUCTS */}
        <div style={{ padding: '28px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} color="#ff6f00" fill="#ff6f00" /> Featured Products
              </h2>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>Hand-picked for you</p>
            </div>
            <Link href="/collections/all" style={{ textDecoration: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {loading
              ? [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
              : featuredProducts.map(p => <LazyProductCard key={p.id} product={p} />)
            }
          </div>
        </div>

        {/* TRENDING */}
        <div style={{ padding: '28px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#e53935" fill="#e53935" /> Trending Now
              </h2>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>Most popular this week</p>
            </div>
            <Link href="/collections/viral-gadgets" style={{ textDecoration: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
            {loading
              ? [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
              : trendingProducts.map(p => <LazyProductCard key={p.id} product={p} />)
            }
          </div>
        </div>

        {/* NEW ARRIVALS */}
        {(loading || newArrivals.length > 0) && (
          <div style={{ padding: '28px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#2e7d32" /> New Arrivals
              </h2>
              <Link href="/collections/new-arrivals" style={{ textDecoration: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
              {loading
                ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
                : newArrivals.map(p => <LazyProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        )}

        {/* BOTTOM PROMO BANNERS */}
        <div style={{ padding: '28px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {[
              { bg: 'linear-gradient(135deg, #e53935, #ff6f00)', title: 'Viral Gadgets', sub: 'Starting ₹49', link: '/collections/viral-gadgets', emoji: '⚡' },
              { bg: 'linear-gradient(135deg, #1a237e, #283593)', title: 'Tech Accessories', sub: 'Latest gadgets', link: '/collections/tech-accessories', emoji: '📱' },
              { bg: 'linear-gradient(135deg, #2e7d32, #388e3c)', title: 'Kitchen Tools', sub: 'Smart cooking', link: '/collections/kitchen-tools', emoji: '🍳' },
            ].map((item, i) => (
              <Link key={i} href={item.link} style={{ textDecoration: 'none' }}>
                <div style={{ background: item.bg, borderRadius: '14px', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '600' }}>SHOP NOW</div>
                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>{item.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '3px' }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: '52px', userSelect: 'none' }}>{item.emoji}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}