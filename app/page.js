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

  const banners = [
    {
      title: 'Viral Gadgets',
      subtitle: 'Under ₹299',
      desc: 'Trending products at unbeatable prices',
      bg: 'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)',
      emoji: '⚡',
      link: '/collections/viral-gadgets',
      tag: 'HOT DEALS'
    },
    {
      title: 'New Arrivals',
      subtitle: 'Just Landed',
      desc: 'Fresh products everyone is buying',
      bg: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
      emoji: '🆕',
      link: '/collections/new-arrivals',
      tag: 'NEW'
    },
    {
      title: 'Home Decor',
      subtitle: 'Up to 70% OFF',
      desc: 'Beautiful decor for every home',
      bg: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
      emoji: '🏠',
      link: '/collections/home-decor',
      tag: 'SALE'
    },
  ]

  const categoryIcons = {
    'viral-gadgets': '⚡',
    'home-decor': '🏠',
    'kitchen-tools': '🍳',
    'tech-accessories': '📱',
    'toys-games': '🎮',
    'beauty-care': '💄',
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [featured, trending, newArr, cats] = await Promise.all([
      supabase.from('products').select('*, categories(name)').eq('is_featured', true).eq('is_active', true).limit(8),
      supabase.from('products').select('*, categories(name)').eq('is_trending', true).eq('is_active', true).limit(8),
      supabase.from('products').select('*, categories(name)').eq('is_new_arrival', true).eq('is_active', true).limit(4),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (featured.data) setFeaturedProducts(featured.data)
    if (trending.data) setTrendingProducts(trending.data)
    if (newArr.data) setNewArrivals(newArr.data)
    if (cats.data) setCategories(cats.data)
    setLoading(false)
  }

  const banner = banners[currentBanner]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />

      {/* HERO BANNER */}
      <div style={{
        background: banner.bg,
        padding: '48px 20px',
        transition: 'background 0.8s ease',
        position: 'relative',
        overflow: 'hidden'
      }}>
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
              {banner.tag}
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '900', marginTop: '12px', lineHeight: '1.1' }}>
              {banner.title}<br />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{banner.subtitle}</span>
            </h1>
            <p style={{ fontSize: '16px', marginTop: '12px', opacity: 0.9 }}>{banner.desc}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <Link href={banner.link}>
                <button style={{
                  background: 'white',
                  color: '#e53935',
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
                  Shop Now <ChevronRight size={18} />
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
          <div style={{ fontSize: '120px', flexShrink: 0, display: 'window.innerWidth > 600 ? "block" : "none"' }}>
            {banner.emoji}
          </div>
        </div>

        {/* Banner dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {banners.map((_, i) => (
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
          {[
            { icon: <Truck size={20} color="#e53935" />, text: 'Free Delivery', sub: 'Above ₹499' },
            { icon: <Shield size={20} color="#e53935" />, text: '100% Genuine', sub: 'Verified Products' },
            { icon: <RefreshCw size={20} color="#e53935" />, text: 'Easy Returns', sub: '7 Day Policy' },
            { icon: <Tag size={20} color="#e53935" />, text: 'Best Price', sub: 'Guaranteed' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}>
              <div style={{ background: '#fff5f5', padding: '10px', borderRadius: '8px' }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{item.text}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{item.sub}</div>
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
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                  {categoryIcons[cat.slug] || '🛍️'}
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

      {/* NEW ARRIVALS BANNER ROW */}
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