'use client'
import { useState, memo } from 'react'
import Link from 'next/link'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { Heart } from 'lucide-react'
import DiscountTimer from './DiscountTimer'
import { formatINR } from '@/lib/currency'

const ProductCard = memo(function ProductCard({ product }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { addToCart, toggleWishlist, isInWishlist } = useStore()

  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
    toast.success('Added to cart! 🛒', { duration: 1500 })
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist ❤️', { duration: 1500 })
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

      <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f8f8f8', overflow: 'hidden', flexShrink: 0 }}>
          {/* Skeleton */}
          {!imgLoaded && !imgError && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />
          )}

          {/* Badges */}
          {discount > 0 && (
            <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#e53935', color: 'white', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', zIndex: 2 }}>
              {discount}% OFF
            </span>
          )}
          {product.is_trending && (
            <span style={{ position: 'absolute', top: '8px', right: '32px', background: '#ff6f00', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', zIndex: 2 }}>
              ⚡ HOT
            </span>
          )}

          {/* Wishlist */}
          <button onClick={handleWishlist}
            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <Heart size={14} color={inWishlist ? '#e53935' : '#999'} fill={inWishlist ? '#e53935' : 'none'} />
          </button>

          {/* Image */}
          {product.images?.[0] && !imgError ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={300}
              height={300}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true) }}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.2s, transform 0.3s',
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              🛍️
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: '#999' }}>{product.categories?.name}</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
            {product.name}
          </div>

          {product.discount_ends_at && new Date(product.discount_ends_at) > new Date() && (
            <DiscountTimer endsAt={product.discount_ends_at} compact={true} />
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#e53935' }}>{formatINR(product.sale_price)}</span>
            {product.mrp > product.sale_price && (
              <span style={{ fontSize: '11px', color: '#bbb', textDecoration: 'line-through' }}>{formatINR(product.mrp)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <div style={{ padding: '0 12px 12px' }}>
        <button onClick={handleAddToCart}
          disabled={product.stock === 0}
          style={{
            width: '100%', background: product.stock === 0 ? '#f5f5f5' : '#e53935',
            color: product.stock === 0 ? '#999' : 'white', border: 'none',
            padding: '9px', borderRadius: '8px', fontSize: '13px',
            fontWeight: '700', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => { if (product.stock > 0) e.currentTarget.style.background = '#c62828' }}
          onMouseLeave={e => { if (product.stock > 0) e.currentTarget.style.background = '#e53935' }}>
          {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  )
})

export default ProductCard