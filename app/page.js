'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { ChevronRight, Zap, TrendingUp, Star, Shield, Truck, RefreshCw, Tag } from 'lucide-react'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [heroBanners, setHeroBanners] = useState([])
  const [trustStripData, setTrustStripData] = useState([])

  const categoryIcons = {
    'viral-gadgets': '⚡',
    'home-decor': '🏠',
    'kitchen-tools': '🍳',
    'tech-accessories': '📱',
    'toys-games': '🎮',
    'beauty-care': '💄',
  }

  // ✅ FIX 1: displayBanners moved to component scope (was inside fetchData before)
  const displayBanners = heroBanners.length > 0 ? heroBanners : [
    { title: 'Viral Gadgets', subtitle: 'Under ₹299', description: 'Trending products at unbeatable prices', badge_text: 'HOT DEALS', cta_text: 'Shop Now', cta_link: '/collections/viral-gadgets', bg_gradient: 'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)', emoji: '⚡', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#e53935' },
    { title: 'New Arrivals', subtitle: 'Just Landed', description: 'Fresh products everyone is buying', badge_text: 'NEW', cta_text: 'Explore Now', cta_link: '/collections/new-arrivals', bg_gradient: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', emoji: '🆕', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#1a237e' },
    { title: 'Home Decor', subtitle: 'Up to 70% OFF', description: 'Beautiful decor for every home', badge_text: 'SALE', cta_text: 'Shop Now', cta_link: '/collections/home-decor', bg_gradient: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', emoji: '🏠', text_color: '#ffffff', button_color: '#ffffff', button_text_color: '#2e7d32' },
  ]

  // ✅ FIX 1 (continued): displayBanners is now accessible here in useEffect
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % displayBanners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // ✅ FIX 2: fetchData is now properly closed with its own closing brace
  const fetchData = async () => {
    setLoading(true)
    const [featured, trending, newArr, cats, bannerRes, trustRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').eq('is_featured', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
supabase.from('products').select('*, categories(name)').eq('is_trending', true).eq('is_active', true).order('created_at', { ascending: false }).limit(8),
supabase.from('products').select('*, categories(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order'),
supabase.from('trust_strips').select('*').eq('is_active', true).order('sort_order'),
    ])
    if (featured.data) setFeaturedProducts(featured.data)
    if (trending.data) setTrendingProducts(trending.data)
    if (newArr.data) setNewArrivals(newArr.data)
    if (cats.data) setCategories(cats.data)
    if (bannerRes.data && bannerRes.data.length > 0) setHeroBanners(bannerRes.data)
    if (trustRes.data && trustRes.data.length > 0) setTrustStripData(trustRes.data)
    setLoading(false)
  } // ✅ FIX 2: fetchData properly closed here

  // banner derived at component level (was also inside fetchData before)
  const banner = displayBanners[currentBanner % displayBanners.length]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />

      {/* HERO BANNER */}
      <div style={{
  background: (banner.bg_type || 'gradient') === 'image' && banner.bg_image
    ? `url(${banner.bg_image}) center/cover no-repeat`
    : (banner.bg_type || 'gradient') === 'image_overlay' && banner.bg_image
    ? `url(${banner.bg_image}) center/cover no-repeat`
    : (banner.bg_type || 'gradient') === 'none'
    ? '#f8f8f8'
    : banner.bg_gradient,
  padding: '48px 20px',
  position: 'relative',
  overflow: 'hidden',
      }}>
        {/* Overlay for image_overlay mode */}
{(banner.bg_type || 'gradient') === 'image_overlay' && banner.bg_image && (
  <div style={{
    position:'absolute', inset:0,
    background: banner.bg_gradient,
    opacity: (banner.overlay_opacity || 50) / 100,
    zIndex: 0
  }} />
)}
<div style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
          <div style={{ color: 'white', flex: 1 }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px'
            }}>
              {/* ✅ FIX 3: banner.tag → banner.badge_text */}
              {banner.badge_text}
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '900', marginTop: '12px', lineHeight: '1.1' }}>
              {banner.title}<br />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{banner.subtitle}</span>
            </h1>
            <p style={{ fontSize: '16px', marginTop: '12px', opacity: 0.9 }}>{banner.description}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <Link href={banner.cta_link}>
                <button style={{
                  background: banner.button_color || 'white',
                  color: banner.button_text_color || '#e53935',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {banner.cta_text} <ChevronRight size={18} />
                </button>
              </Link>
              <Link href="/collections/all">
                <button style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>
                  View All
                </button>
              </Link>
            </div>
          </div>
          <div style={{ fontSize: '120px', flexShrink: 0 }}>
            {banner.emoji}
          </div>
        </div>
        </div>

        {/* Banner dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {displayBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBanner(i)}
              style={{
                width: i === currentBanner ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: 0
              }}
            />
          ))}
        </div>
      </div>

      {/* TRUST BADGES */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px'
        }}>
          {(trustStripData.length > 0 ? trustStripData : [
            { icon_svg:'truck', icon_color:'#e53935', title:'Free Delivery', subtitle:'Above ₹499' },
            { icon_svg:'shield', icon_color:'#e53935', title:'100% Genuine', subtitle:'Verified Products' },
            { icon_svg:'refresh', icon_color:'#e53935', title:'Easy Returns', subtitle:'7 Day Policy' },
            { icon_svg:'tag', icon_color:'#e53935', title:'Best Price', subtitle:'Guaranteed' },
          ]).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}>
              <div style={{ background: '#fff5f5', padding: '10px', borderRadius: '8px' }}>
                {item.icon_svg === 'truck' ? <Truck size={20} color={item.icon_color || '#e53935'} /> :
                 item.icon_svg === 'shield' ? <Shield size={20} color={item.icon_color || '#e53935'} /> :
                 item.icon_svg === 'refresh' ? <RefreshCw size={20} color={item.icon_color || '#e53935'} /> :
                 <Tag size={20} color={item.icon_color || '#e53935'} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{item.title || item.text}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{item.subtitle || item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a' }}>
            Shop by Category
          </h2>
          <Link href="/collections/all" style={{ textDecoration: 'none', color: '#e53935', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          {categories.map(cat => (
            <Link key={cat.id} href={`/collections/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px 12px',
                textAlign: 'center',
                border: '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#e53935'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
<div style={{ 
  width: '64px', height: '64px', 
  display: 'flex', alignItems: 'center', 
  justifyContent: 'center', marginBottom: '8px',
  margin: '0 auto 8px auto'
}}>
  {cat.image_url ? (
    <img
      src={cat.image_url}
      alt={cat.name}
      style={{ 
        width: '52px', height: '52px', 
        objectFit: 'contain',
        display: 'block'
      }}
      onError={e => { 
        e.target.style.display = 'none'
        e.target.parentNode.innerHTML = categoryIcons[cat.slug] || '🛍️'
      }}
    />
  ) : (
    <span style={{ fontSize: '36px', lineHeight: '1' }}>
      {categoryIcons[cat.slug] || '🛍️'}
    </span>
  )}
</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{cat.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* COUPON BANNER */}
      <div style={{ maxWidth: '1280px', margin: '32px auto 0', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ color: '#ff6f00', fontSize: '13px', fontWeight: '700', letterSpacing: '1px' }}>LIMITED TIME OFFER</div>
            <div style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>
              Get 50% OFF on your first order!
            </div>
            <div style={{ color: '#ccc', fontSize: '14px', marginTop: '4px' }}>
              Use code: <span style={{ color: '#ff6f00', fontWeight: '800', fontSize: '18px', letterSpacing: '2px' }}>KONDA50</span>
            </div>
          </div>
          <Link href="/collections/all">
            <button style={{
              background: '#e53935',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              Grab the Deal →
            </button>
          </Link>
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={22} color="#ff6f00" fill="#ff6f00" /> Featured Products
            </h2>
            <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>Hand-picked for you</p>
          </div>
          <Link href="/collections/all" style={{ textDecoration: 'none', color: '#e53935', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', height: '320px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* TRENDING NOW */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} color="#e53935" fill="#e53935" /> Trending Now
            </h2>
            <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>Most popular this week</p>
          </div>
          <Link href="/collections/viral-gadgets" style={{ textDecoration: 'none', color: '#e53935', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {trendingProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={22} color="#2e7d32" /> New Arrivals
            </h2>
            <Link href="/collections/new-arrivals" style={{ textDecoration: 'none', color: '#e53935', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM BANNER */}
      <div style={{ maxWidth: '1280px', margin: '32px auto 0', padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {[
            { bg: 'linear-gradient(135deg, #e53935, #ff6f00)', title: 'Viral Gadgets', sub: 'Starting ₹49', link: '/collections/viral-gadgets', emoji: '⚡' },
            { bg: 'linear-gradient(135deg, #1a237e, #283593)', title: 'Tech Accessories', sub: 'Latest gadgets', link: '/collections/tech-accessories', emoji: '📱' },
            { bg: 'linear-gradient(135deg, #2e7d32, #388e3c)', title: 'Kitchen Tools', sub: 'Smart cooking', link: '/collections/kitchen-tools', emoji: '🍳' },
          ].map((item, i) => (
            <Link key={i} href={item.link} style={{ textDecoration: 'none' }}>
              <div style={{
                background: item.bg,
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: '600' }}>SHOP NOW</div>
                  <div style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{item.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginTop: '4px' }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: '56px' }}>{item.emoji}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: '48px' }} />
      <Footer />
    </div>
  )
}