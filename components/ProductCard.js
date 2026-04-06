'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/lib/store'

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const [adding, setAdding] = useState(false)
  const inWishlist = isInWishlist(product.id)

  const discount = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    addToCart(product)
    toast.success(`${product.name.substring(0, 25)}... added to cart!`)
    setTimeout(() => setAdding(false), 1000)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  return (
    <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        transition: 'all 0.25s',
        cursor: 'pointer',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      >
        {/* Discount Badge */}
        {discount > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: '#e53935',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            zIndex: 2
          }}>
            {discount}% OFF
          </div>
        )}

        {/* Trending Badge */}
        {product.is_trending && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '42px',
            background: '#ff6f00',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Zap size={10} /> HOT
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Heart size={16} color={inWishlist ? '#e53935' : '#999'} fill={inWishlist ? '#e53935' : 'none'} />
        </button>

        {/* Product Image */}
        <div style={{
          background: '#f8f8f8',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #e53935, #ff6f00)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px'
            }}>
              🛍️
            </div>
          )}
        </div>

        {/* Product Info */}
        <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '13px', color: '#999', fontWeight: '500' }}>
            {product.categories?.name || 'Viral Gadgets'}
          </p>

          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.name}
          </h3>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[1,2,3,4,5].map(star => (
              <Star key={star} size={12} color="#ff6f00" fill={star <= 4 ? '#ff6f00' : 'none'} />
            ))}
            <span style={{ fontSize: '12px', color: '#999' }}>(4.0)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53935' }}>
              ₹{product.sale_price}
            </span>
            <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>
              ₹{product.mrp}
            </span>
          </div>

          {/* Free Delivery tag */}
          {product.sale_price >= 499 && (
            <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: '600' }}>
              ✅ Free Delivery
            </span>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%',
              background: adding ? '#2e7d32' : '#e53935',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: 'auto',
              transition: 'background 0.3s'
            }}
          >
            <ShoppingCart size={15} />
            {adding ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}