'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Menu, X, Heart, User } from 'lucide-react'
import useStore from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { memo, useCallback } from 'react'
import { usePrefetch } from '@/lib/usePrefetch'

const Navbar = memo(function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState([])
  const [mounted, setMounted] = useState(false)
  const { cart, user, setUser } = useStore()
  const router = useRouter()
const { prefetchCategory } = usePrefetch()

useEffect(() => {
  setMounted(true)
  const handleScroll = () => setScrolled(window.scrollY > 10)
  window.addEventListener('scroll', handleScroll)

  // Get initial session
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user || null)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null)
  })

  fetchCategories()
  return () => {
    window.removeEventListener('scroll', handleScroll)
    subscription.unsubscribe()
  }
}, [])

  const cartCount = mounted ? cart.reduce((t, i) => t + i.quantity, 0) : 0

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data) setCategories(data)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMenuOpen(false)
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-search { display: none !important; }
          .nav-desktop-actions { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-cats { display: none !important; }
          .mobile-menu { display: ${menuOpen ? 'flex' : 'none'} !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>

      {/* Top announcement bar */}
      <div style={{ background: '#e53935', color: 'white', textAlign: 'center', padding: '6px 12px', fontSize: '12px', fontWeight: '500' }}>
        🚚 Free Delivery above ₹499 | Use code <strong>KONDA50</strong> for 50% OFF
      </div>

      {/* Main Navbar */}
      <nav style={{
        background: 'white',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 1000, transition: 'box-shadow 0.3s'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          {/* Top Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '60px' }}>

            {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
  <img
    src="/logo.png"
    alt="KondaDeals"
    style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
  />
</Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="nav-search" style={{ flex: 1, display: 'flex', maxWidth: '560px' }}>
              <div style={{ display: 'flex', width: '100%', border: '2px solid #e53935', borderRadius: '8px', overflow: 'hidden' }}>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for viral gadgets, home decor..."
                  style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: '14px' }}
                />
                <button type="submit" style={{ background: '#e53935', border: 'none', padding: '0 18px', cursor: 'pointer' }}>
                  <Search size={18} color="white" />
                </button>
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <Link href="/track" style={{ textDecoration: 'none' }}>
  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
    <span style={{ fontSize: '11px', color: '#555' }}>Track</span>
  </button>
</Link>
              <Link href="/wishlist" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <Heart size={22} color="#555" />
                  <span style={{ fontSize: '11px', color: '#555' }}>Wishlist</span>
                </button>
              </Link>
             <Link href={user ? '/account' : '/login'} style={{ textDecoration: 'none' }}>
  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
    <User size={22} color="#555" />
    <span style={{ fontSize: '11px', color: '#555' }}>{user ? 'Account' : 'Login'}</span>
  </button>
</Link>
{user && (
  <button
    onClick={() => router.push('/admin')}
    style={{ background: '#e53935', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
    <span style={{ fontSize: '12px', color: 'white', fontWeight: '700' }}>⚙️ Admin</span>
  </button>
)}
              <Link href="/cart" style={{ textDecoration: 'none' }}>
                <button style={{ background: '#e53935', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                  <ShoppingCart size={20} color="white" />
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Cart</span>
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff6f00', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>

            {/* Mobile Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {/* Mobile Cart */}
              <Link href="/cart" style={{ textDecoration: 'none' }} className="nav-mobile-btn">
                <button style={{ background: '#e53935', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                  <ShoppingCart size={18} color="white" />
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ff6f00', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
              {/* Hamburger */}
              <button className="nav-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                {menuOpen ? <X size={24} color="#333" /> : <Menu size={24} color="#333" />}
              </button>
            </div>
          </div>

          {/* Desktop Category Bar */}
          <div className="nav-cats" style={{ display: 'flex', gap: '4px', paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <Link href="/collections/all" style={{ textDecoration: 'none' }}>
              <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#e53935', color: 'white', whiteSpace: 'nowrap', cursor: 'pointer', display: 'block' }}>
                🔥 All Products
              </span>
            </Link>
            {categories.map(cat => (
              <Link
    key={cat.id}
    href={`/collections/${cat.slug}`}
    style={{ textDecoration: 'none' }}
   onMouseEnter={() => prefetchCategory(cat.slug)}
  >
                <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', background: '#f5f5f5', color: '#333', whiteSpace: 'nowrap', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.background = '#e53935'; e.target.style.color = 'white' }}
                  onMouseLeave={e => { e.target.style.background = '#f5f5f5'; e.target.style.color = '#333' }}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className="mobile-menu" style={{ flexDirection: 'column', background: 'white', borderTop: '1px solid #f0f0f0', padding: '16px' }}>
          {/* Mobile Search */}
          <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', border: '2px solid #e53935', borderRadius: '8px', overflow: 'hidden' }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: '14px' }}
              />
              <button type="submit" style={{ background: '#e53935', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
                <Search size={16} color="white" />
              </button>
            </div>
          </form>

          {/* Mobile Nav Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {[
              { href: '/', label: '🏠 Home' },
              { href: '/track', label: '📦 Track Order' },
              { href: '/collections/all', label: '🛍️ All Products' },
              { href: '/collections/viral-gadgets', label: '⚡ Viral Gadgets' },
              { href: '/collections/home-decor', label: '🏠 Home Decor' },
              { href: '/collections/kitchen-tools', label: '🍳 Kitchen Tools' },
              { href: '/collections/tech-accessories', label: '📱 Tech Accessories' },
              { href: '/collections/beauty-care', label: '💄 Beauty & Care' },
              { href: '/wishlist', label: '❤️ Wishlist' },
              { href: user ? '/account' : '/login', label: user ? '👤 My Account' : '🔑 Login / Sign Up' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '15px', fontWeight: '500', color: '#333', background: '#f8f8f8', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8f8f8'}>
                  {link.label}
                </div>
              </Link>
            ))}
          </div>

          <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e65100', fontWeight: '600', textAlign: 'center' }}>
            🎉 Use code <strong>KONDA50</strong> for 50% OFF!
          </div>
        </div>
      </nav>
    </>
  )
})
export default Navbar