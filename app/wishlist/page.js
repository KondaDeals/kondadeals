'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import useStore from '@/lib/store'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  const { wishlist } = useStore()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '24px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={28} color="#e53935" fill="#e53935" />
          My Wishlist ({wishlist.length})
        </h1>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💝</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              Your wishlist is empty
            </h2>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>
              Save products you love by clicking the heart icon
            </p>
            <Link href="/collections/all">
              <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {wishlist.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}