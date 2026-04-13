'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { Trash2, ShoppingBag, Tag, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/currency'

export default function CartPage() {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useStore()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [applying, setApplying] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const subtotal = mounted ? getCartTotal() : 0
  const shipping = subtotal >= 499 ? 0 : 49
  const total = subtotal + shipping - discount

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplying(true)
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()
      if (!data) {
        toast.error('Invalid or expired coupon code')
      } else if (subtotal < data.min_order_amount) {
        toast.error(`Minimum order ₹${data.min_order_amount} required`)
      } else {
        let discountAmt = 0
        if (data.discount_type === 'percentage') {
          discountAmt = Math.round((subtotal * data.discount_value) / 100)
        } else {
          discountAmt = data.discount_value
        }
        setDiscount(discountAmt)
        setCouponApplied(data.code)
        toast.success(`Coupon applied! You save ₹${discountAmt}`)
      }
    } catch (err) {
      toast.error('Invalid coupon code')
    }
    setApplying(false)
  }

  const handleCheckout = () => {
    const { user } = useStore.getState()
    if (!user) {
      toast.error('Please login to checkout')
      router.push('/login?redirect=/checkout')
      return
    }
    router.push('/checkout')
  }

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px', fontSize: '16px', color: '#999' }}>
          Loading cart...
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />
        <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🛒</div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' }}>
            Your cart is empty
          </h2>
          <p style={{ color: '#999', fontSize: '15px', marginBottom: '32px' }}>
            Add some amazing products to your cart!
          </p>
          <Link href="/collections/all">
            <button style={{
              background: '#e53935', color: 'white', border: 'none',
              padding: '14px 40px', borderRadius: '10px',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer'
            }}>
              Continue Shopping
            </button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={28} color="#e53935" />
          My Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Cart Items */}
          <div style={{ gridColumn: 'span 2' }}>
            {cart.map(item => (
              <div key={item.id} style={{
                background: 'white', borderRadius: '12px', padding: '16px',
                marginBottom: '12px', display: 'flex', gap: '16px',
                alignItems: 'center', border: '1px solid #f0f0f0'
              }}>
                <div style={{
                  width: '90px', height: '90px', flexShrink: 0,
                  background: '#f8f8f8', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
                    : <span style={{ fontSize: '36px' }}>🛍️</span>
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', lineHeight: '1.3' }}>
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53935' }}>{formatINR(item.sale_price)}</span>
                    <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>{formatINR(item.mrp)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}>−</button>
                      <span style={{ padding: '6px 16px', fontWeight: '700', fontSize: '15px' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}>+</button>
                    </div>
                    <button onClick={() => { removeFromCart(item.id); toast.success('Removed from cart') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                    {formatINR(item.sale_price * item.quantity)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>
                    Save {formatINR((item.mrp - item.sale_price) * item.quantity)}
                  </div>
                </div>
              </div>
            ))}

            {subtotal < 499 ? (
              <div style={{ background: '#fff3e0', border: '1px dashed #ff6f00', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={18} color="#ff6f00" />
                <span style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>
                  Add {formatINR(499 - subtotal)} more for FREE delivery!
                </span>
              </div>
            ) : (
              <div style={{ background: '#e8f5e9', border: '1px dashed #2e7d32', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={18} color="#2e7d32" />
                <span style={{ fontSize: '13px', color: '#1b5e20', fontWeight: '600' }}>
                  🎉 You get FREE delivery on this order!
                </span>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f0', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Order Summary</h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  disabled={!!couponApplied}
                  style={{
                    flex: 1, padding: '10px 12px',
                    border: '1px solid #e0e0e0', borderRadius: '8px',
                    fontSize: '13px', outline: 'none',
                    background: couponApplied ? '#f5f5f5' : 'white'
                  }}
                />
                <button onClick={applyCoupon} disabled={applying || !!couponApplied}
                  style={{
                    background: couponApplied ? '#2e7d32' : '#e53935',
                    color: 'white', border: 'none', padding: '10px 16px',
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}>
                  {applying ? '...' : couponApplied ? '✓' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} /> Coupon <strong>{couponApplied}</strong> applied!
                  <button onClick={() => { setDiscount(0); setCouponApplied(''); setCouponCode('') }}
                    style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>Remove</button>
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                Try: KONDA50, SAVE100, WELCOME20
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ fontWeight: '600' }}>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ fontWeight: '600', color: shipping === 0 ? '#2e7d32' : '#333' }}>
                  {shipping === 0 ? 'FREE' : formatINR(shipping)}
                </span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#666' }}>Coupon Discount</span>
                  <span style={{ fontWeight: '600', color: '#2e7d32' }}>-{formatINR(discount)}</span>
                </div>
              )}
              {shipping === 0 && (
                <div style={{ background: '#e8f5e9', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>
                  🎉 You saved {formatINR(40)} on shipping!
                </div>
              )}
              <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: '800' }}>Total</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#e53935' }}>{formatINR(total)}</span>
              </div>
              {subtotal > total && (
                <div style={{ background: '#fff5f5', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#e53935', fontWeight: '600', textAlign: 'center' }}>
                  💰 You save {formatINR(subtotal - total)} on this order!
                </div>
              )}
            </div>

            <button onClick={handleCheckout}
              style={{
                width: '100%', background: '#e53935', color: 'white',
                border: 'none', padding: '16px', borderRadius: '10px',
                fontSize: '16px', fontWeight: '800', cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c62828'}
              onMouseLeave={e => e.currentTarget.style.background = '#e53935'}
            >
              Proceed to Checkout →
            </button>

            <Link href="/collections/all">
              <button style={{
                width: '100%', background: 'white', color: '#666',
                border: '1px solid #e0e0e0', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '10px'
              }}>
                ← Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}