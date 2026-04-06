'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Menu, X, Heart, User, ChevronDown } from 'lucide-react'
import useStore from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState([])
  const { cart, user, setUser } = useStore()
  const router = useRouter()
  const cartCount = cart.reduce((t, i) => t + i.quantity, 0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) setCategories(data)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <>
      {/* Top bar */}
      <div style={{ background: '#e53935', color: 'white', textAlign: 'center', padding: '6px', fontSize: '13px', fontWeight: '500' }}>
        🚚 Free Delivery on orders above ₹499 | Use code <strong>KONDA50</strong> for 50% OFF
      </div>

      {/* Main Navbar */}
      <nav style={{
        background: 'white',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'box-shadow 0.3s'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
            
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#e53935', letterSpacing: '-0.5px' }}>
                  KONDA
                </span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#ff6f00', letterSpacing: '2px' }}>
                  DEALS
                </span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: '560px' }}>
              <div style={{ display: 'flex', width: '100%', border: '2px solid #e53935', borderRadius: '8px', overflow: 'hidden' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for viral gadgets, home decor..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    background: 'white'
                  }}
                />
                <button type="submit" style={{
                  background: '#e53935',
                  border: 'none',
                  padding: '0 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={18} color="white" />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              
              {/* Wishlist */}
              <Link href="/wishlist" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <Heart size={22} color="#555" />
                  <span style={{ fontSize: '11px', color: '#555' }}>Wishlist</span>
                </button>
              </Link>

              {/* Account */}
              <Link href={user ? '/account' : '/login'} style={{ textDecoration: 'none' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <User size={22} color="#555" />
                  <span style={{ fontSize: '11px', color: '#555' }}>{user ? 'Account' : 'Login'}</span>
                </button>
              </Link>

              {/* Cart */}
              <Link href="/cart" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: '#e53935',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative'
                }}>
                  <ShoppingCart size={20} color="white" />
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Cart</span>
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ff6f00',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none' }}
                className="mobile-menu-btn"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Category Bar */}
          <div style={{
            display: 'flex',
            gap: '4px',
            paddingBottom: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            <Link href="/collections/all" style={{ textDecoration: 'none' }}>
              <span style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: '#e53935',
                color: 'white',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}>
                🔥 All Products
              </span>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/collections/${cat.slug}`} style={{ textDecoration: 'none' }}>
                <span style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: '#f5f5f5',
                  color: '#333',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.background = '#e53935'; e.target.style.color = 'white' }}
                onMouseLeave={e => { e.target.style.background = '#f5f5f5'; e.target.style.color = '#333' }}
                >
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}