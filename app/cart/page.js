'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { Trash2, ShoppingBag, Tag, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/currency'

export default function CartPage() {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useStore()

  const [mounted, setMounted] = useState(false)
  const [orderCouponCode, setOrderCouponCode] = useState('')
  const [orderDiscount, setOrderDiscount] = useState(0)
  const [orderCouponApplied, setOrderCouponApplied] = useState('')
  const [applyingOrder, setApplyingOrder] = useState(false)

  // Product-level coupons: { [productId]: { code, inputCode, discount, applied, applying, error } }
  const [productCoupons, setProductCoupons] = useState({})

  useEffect(() => { setMounted(true) }, [])

  // Fetch fresh product coupon data for all cart items
useEffect(() => {
  if (!mounted || cart.length === 0) return
  fetchCouponData()
}, [mounted, cart.length])

const [productCouponData, setProductCouponData] = useState({})

const fetchCouponData = async () => {
  try {
    const ids = cart.map(item => item.id)
    const { data } = await supabase
      .from('products')
      .select(`
        id, product_coupon_enabled, product_coupon_code,
        product_coupon_type, product_coupon_value,
        product_coupon_min_qty, product_coupon_start_date,
        product_coupon_end_date, product_coupon_active
      `)
      .in('id', ids)

    if (data) {
      const map = {}
      data.forEach(p => { map[p.id] = p })
      setProductCouponData(map)
    }
  } catch (err) {
    console.error('Failed to fetch coupon data:', err)
  }
}
  // Total product coupon discount
  const totalProductDiscount = Object.values(productCoupons)
    .reduce((sum, c) => sum + (c.discount || 0), 0)

  const hasProductCoupon = totalProductDiscount > 0
const anyItemHasCoupon = Object.values(productCouponData).some(
  p => p.product_coupon_enabled && p.product_coupon_active
)

  const subtotal = mounted ? getCartTotal() : 0
  const shipping = subtotal >= 499 ? 0 : 49
  const effectiveOrderDiscount = hasProductCoupon ? 0 : orderDiscount
  const total = subtotal + shipping - totalProductDiscount - effectiveOrderDiscount

  // Apply product-level coupon
  const applyProductCoupon = useCallback(async (item) => {
  const input = productCoupons[item.id]?.inputCode || ''
  if (!input.trim()) { toast.error('Enter a coupon code'); return }

  setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: true, error: '' } }))

  try {
    // Use already-fetched coupon data
    const product = productCouponData[item.id]

    if (!product?.product_coupon_enabled || !product?.product_coupon_active) {
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'No coupon available for this product' } }))
      return
    }

    if (product.product_coupon_code?.toUpperCase() !== input.trim().toUpperCase()) {
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: '❌ Invalid coupon code' } }))
      return
    }

    // Check dates
    const now = new Date()
    if (product.product_coupon_start_date && new Date(product.product_coupon_start_date) > now) {
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Coupon not active yet' } }))
      return
    }
    if (product.product_coupon_end_date && new Date(product.product_coupon_end_date) < now) {
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Coupon has expired' } }))
      return
    }

    // Check min qty
    if (item.quantity < (product.product_coupon_min_qty || 1)) {
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: `Min ${product.product_coupon_min_qty} qty required` } }))
      return
    }

    // Calculate discount
    const itemTotal = item.sale_price * item.quantity
    let discountAmt = 0
    if (product.product_coupon_type === 'percentage') {
      discountAmt = Math.round(itemTotal * product.product_coupon_value / 100)
    } else {
      discountAmt = Math.min(product.product_coupon_value, itemTotal)
    }

    // Remove order coupon if active
    if (orderCouponApplied) {
      setOrderDiscount(0); setOrderCouponApplied(''); setOrderCouponCode('')
      toast('Order coupon removed — product coupon takes priority', { icon: 'ℹ️' })
    }

    setProductCoupons(prev => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        applied: input.trim().toUpperCase(),
        discount: discountAmt,
        applying: false,
        error: '',
      }
    }))
    toast.success(`✅ Saved ${formatINR(discountAmt)} on ${item.name.substring(0, 20)}!`)

  } catch (err) {
    setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Failed — try again' } }))
  }
}, [productCouponData, productCoupons, orderCouponApplied, formatINR])

  const removeProductCoupon = useCallback((itemId) => {
    setProductCoupons(prev => ({ ...prev, [itemId]: { inputCode: '', applied: '', discount: 0, error: '' } }))
  }, [])

  // Apply order-level coupon
  const applyOrderCoupon = async () => {
    if (!orderCouponCode.trim()) return
    if (hasProductCoupon) {
      toast.error('Remove product coupons first to use an order coupon')
      return
    }
    setApplyingOrder(true)
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', orderCouponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (!data) { toast.error('Invalid or expired coupon'); setApplyingOrder(false); return }
      if (subtotal < (data.min_order_amount || 0)) {
        toast.error(`Minimum order ${formatINR(data.min_order_amount)} required`)
        setApplyingOrder(false); return
      }

      let discountAmt = 0
      if (data.discount_type === 'percentage') {
        discountAmt = Math.round(subtotal * data.discount_value / 100)
      } else {
        discountAmt = data.discount_value
      }
      setOrderDiscount(discountAmt)
      setOrderCouponApplied(data.code)
      toast.success(`Coupon applied! You save ${formatINR(discountAmt)}`)
    } catch {
      toast.error('Invalid coupon code')
    }
    setApplyingOrder(false)
  }

  const handleCheckout = () => {
    const { user } = useStore.getState()
    if (!user) { toast.error('Please login to checkout'); router.push('/login?redirect=/checkout'); return }
    router.push('/checkout')
  }

  if (!mounted) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}><Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading cart...</div>
    </div>
  )

  if (cart.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}><Navbar />
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>🛒</div>
        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Your cart is empty</h2>
        <p style={{ color: '#999', marginBottom: '32px' }}>Add some amazing products!</p>
        <Link href="/collections/all">
          <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px 40px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
            Continue Shopping
          </button>
        </Link>
      </div>
      <Footer />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={26} color="#e53935" />
          My Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '20px', alignItems: 'start' }}>

          {/* ===== CART ITEMS ===== */}
          <div>
            {cart.map(item => {
              const pc = productCoupons[item.id] || {}
              const itemDiscount = pc.discount || 0
              const itemFinalPrice = (item.sale_price * item.quantity) - itemDiscount

              return (
                <div key={item.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: `1px solid ${itemDiscount > 0 ? '#bbdefb' : '#f0f0f0'}`, transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {/* Image */}
                    <Link href={`/product/${item.slug}`}>
                      <div style={{ width: '88px', height: '88px', flexShrink: 0, background: '#f8f8f8', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          : <span style={{ fontSize: '32px' }}>🛍️</span>}
                      </div>
                    </Link>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/product/${item.slug}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </h3>
                      </Link>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '17px', fontWeight: '800', color: '#e53935' }}>{formatINR(item.sale_price)}</span>
                        {item.mrp > item.sale_price && (
                          <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>{formatINR(item.mrp)}</span>
                        )}
                        <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: '600' }}>
                          ({Math.round(((item.mrp - item.sale_price) / item.mrp) * 100)}% off)
                        </span>
                      </div>

                      {/* Quantity + Remove */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ padding: '5px 12px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#333' }}>−</button>
                          <span style={{ padding: '5px 14px', fontWeight: '700', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ padding: '5px 12px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#333' }}>+</button>
                        </div>
                        <button onClick={() => { removeFromCart(item.id); toast.success('Removed') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {itemDiscount > 0 ? (
                        <div>
                          <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>{formatINR(item.sale_price * item.quantity)}</div>
                          <div style={{ fontSize: '17px', fontWeight: '800', color: '#1565c0' }}>{formatINR(itemFinalPrice)}</div>
                          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: '700', marginTop: '2px' }}>-{formatINR(itemDiscount)}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#1a1a1a' }}>{formatINR(item.sale_price * item.quantity)}</div>
                      )}
                    </div>
                  </div>

                  {/* Product Coupon Section */}
                  {pc.applied ? (
                    /* Coupon Applied State */
                    <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, #e3f2fd, #e8f5e9)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #bbdefb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🏷️</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#1565c0' }}>{pc.applied} applied!</div>
                          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: '600' }}>
                            You save {formatINR(itemDiscount)} on this item
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeProductCoupon(item.id)}
                        style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                        ✕ Remove
                      </button>
                    </div>
                  ) : productCouponData[item.id]?.product_coupon_enabled &&
     productCouponData[item.id]?.product_coupon_active ? (
                    /* Coupon Input — only shown if product has coupon */
                    <div style={{ marginTop: '12px', background: '#f8f9ff', borderRadius: '10px', padding: '10px 14px', border: '1px dashed #90caf9' }}>
                      <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🏷️ Coupon available for this product
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={pc.inputCode || ''}
                          onChange={e => setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], inputCode: e.target.value.toUpperCase(), error: '' } }))}
                          placeholder="Enter product coupon"
                          onKeyPress={e => e.key === 'Enter' && applyProductCoupon(item)}
                          style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #90caf9', borderRadius: '7px', fontSize: '13px', outline: 'none', fontWeight: '600', letterSpacing: '0.5px', background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#1565c0'}
                          onBlur={e => e.target.style.borderColor = '#90caf9'}
                        />
                        <button onClick={() => applyProductCoupon(item)}
                          disabled={pc.applying}
                          style={{ background: '#1565c0', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {pc.applying ? '...' : 'Apply'}
                        </button>
                      </div>
                      {pc.error && (
                        <div style={{ fontSize: '11px', color: '#e53935', marginTop: '4px', fontWeight: '600' }}>❌ {pc.error}</div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {/* Free delivery progress */}
            {subtotal < 499 ? (
              <div style={{ background: '#fff3e0', border: '1px dashed #ff6f00', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={18} color="#ff6f00" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>
                    Add {formatINR(499 - subtotal)} more for FREE delivery!
                  </span>
                  <div style={{ background: '#ffe0b2', borderRadius: '4px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#ff6f00', height: '100%', width: `${(subtotal / 499) * 100}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#e8f5e9', border: '1px dashed #2e7d32', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={18} color="#2e7d32" />
                <span style={{ fontSize: '13px', color: '#1b5e20', fontWeight: '600' }}>🎉 You qualify for FREE delivery!</span>
              </div>
            )}
          </div>

          {/* ===== ORDER SUMMARY ===== */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '22px', border: '1px solid #f0f0f0', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '18px', color: '#1a1a1a' }}>Order Summary</h3>

            {/* Order-level coupon — hidden when product coupon active */}
            {!hasProductCoupon ? (
              <div style={{ marginBottom: '18px', background: '#f8f8f8', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={13} /> Order Coupon
                </div>
                {orderCouponApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f5e9', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#2e7d32' }}>{orderCouponApplied} ✓</div>
                      <div style={{ fontSize: '11px', color: '#2e7d32' }}>Saving {formatINR(effectiveOrderDiscount)}</div>
                    </div>
                    <button onClick={() => { setOrderDiscount(0); setOrderCouponApplied(''); setOrderCouponCode('') }}
                      style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="text" value={orderCouponCode}
                        onChange={e => setOrderCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={e => e.key === 'Enter' && applyOrderCoupon()}
                        placeholder="Enter coupon code"
                        style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', fontWeight: '600', letterSpacing: '0.5px' }}
                        onFocus={e => e.target.style.borderColor = '#e53935'}
                        onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                      />
                      <button onClick={applyOrderCoupon} disabled={applyingOrder}
                        style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        {applyingOrder ? '...' : 'Apply'}
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>Try: KONDA50, SAVE100, WELCOME20</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '18px', background: '#e3f2fd', borderRadius: '10px', padding: '10px 12px', border: '1px solid #90caf9' }}>
                <div style={{ fontSize: '12px', color: '#1565c0', fontWeight: '700' }}>
                  🏷️ Product coupons active — order coupon disabled
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Remove product coupons to use an order coupon</div>
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ fontWeight: '600' }}>{formatINR(subtotal)}</span>
              </div>

              {/* Product discount breakdown */}
              {totalProductDiscount > 0 && (
                <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '8px 12px' }}>
                  {cart.map(item => {
                    const d = productCoupons[item.id]?.discount || 0
                    if (!d) return null
                    return (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#1565c0' }}>🏷️ {productCoupons[item.id]?.applied} ({item.name.substring(0, 18)}...)</span>
                        <span style={{ fontWeight: '700', color: '#1565c0' }}>-{formatINR(d)}</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#1565c0', paddingTop: '4px', borderTop: '1px solid #90caf9', marginTop: '4px' }}>
                    <span>Product Discount</span>
                    <span>-{formatINR(totalProductDiscount)}</span>
                  </div>
                </div>
              )}

              {/* Order coupon discount */}
              {effectiveOrderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#2e7d32' }}>🏷️ Coupon ({orderCouponApplied})</span>
                  <span style={{ fontWeight: '700', color: '#2e7d32' }}>-{formatINR(effectiveOrderDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ fontWeight: '600', color: shipping === 0 ? '#2e7d32' : '#333' }}>
                  {shipping === 0 ? '🎉 FREE' : formatINR(shipping)}
                </span>
              </div>

              {/* Total savings pill */}
              {(totalProductDiscount + effectiveOrderDiscount + (shipping === 0 && subtotal > 0 ? 40 : 0)) > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '700' }}>💰 Total Savings</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2e7d32' }}>
                    -{formatINR(totalProductDiscount + effectiveOrderDiscount + (shipping === 0 && subtotal > 0 ? 40 : 0))}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>Grand Total</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#e53935' }}>{formatINR(total)}</span>
              </div>
            </div>

            <button onClick={handleCheckout}
              style={{ width: '100%', background: 'linear-gradient(135deg, #e53935, #c62828)', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,57,53,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(229,57,53,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(229,57,53,0.3)' }}>
              Proceed to Checkout →
            </button>
            <Link href="/collections/all">
              <button style={{ width: '100%', background: 'white', color: '#666', border: '1px solid #e0e0e0', padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
                ← Continue Shopping
              </button>
            </Link>

            {/* Security badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f5f5f5' }}>
              {['🔒 Secure', '✅ Genuine', '↩️ Returns'].map(b => (
                <span key={b} style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}