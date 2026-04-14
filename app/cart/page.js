'use client'
import { useState, useEffect, useCallback } from 'react'
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
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useStore()

  const [mounted, setMounted] = useState(false)
  const [orderCouponCode, setOrderCouponCode] = useState('')
  const [orderDiscount, setOrderDiscount] = useState(0)
  const [orderCouponApplied, setOrderCouponApplied] = useState('')
  const [applyingOrder, setApplyingOrder] = useState(false)
  const [productCoupons, setProductCoupons] = useState({})
  const [productCouponData, setProductCouponData] = useState({})

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || cart.length === 0) return
    fetchCouponData()
  }, [mounted, cart.length])

  const fetchCouponData = async () => {
    try {
      const ids = cart.map(item => item.id)
      const { data } = await supabase
        .from('products')
        .select('id,product_coupon_enabled,product_coupon_code,product_coupon_type,product_coupon_value,product_coupon_min_qty,product_coupon_start_date,product_coupon_end_date,product_coupon_active')
        .in('id', ids)
      if (data) {
        const map = {}
        data.forEach(p => { map[p.id] = p })
        setProductCouponData(map)
      }
    } catch (err) { console.error(err) }
  }

  const totalProductDiscount = Object.values(productCoupons).reduce((s, c) => s + (c.discount || 0), 0)
  const hasProductCoupon = totalProductDiscount > 0
  const subtotal = mounted ? getCartTotal() : 0
  const shipping = subtotal >= 499 ? 0 : 49
  const effectiveOrderDiscount = hasProductCoupon ? 0 : orderDiscount
  const total = subtotal + shipping - totalProductDiscount - effectiveOrderDiscount

  const applyProductCoupon = useCallback(async (item) => {
    const input = (productCoupons[item.id]?.inputCode || '').trim()
    if (!input) { toast.error('Enter a coupon code'); return }
    setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: true, error: '' } }))
    try {
      const product = productCouponData[item.id]
      if (!product?.product_coupon_enabled || !product?.product_coupon_active) {
        setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'No coupon for this product' } }))
        return
      }
      if (product.product_coupon_code?.toUpperCase() !== input.toUpperCase()) {
        setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Invalid coupon code' } }))
        return
      }
      const now = Date.now()
      if (product.product_coupon_start_date) {
        try { const s = Date.parse(product.product_coupon_start_date); if (!isNaN(s) && s > now) { setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Coupon not active yet' } })); return } } catch (e) {}
      }
      if (product.product_coupon_end_date) {
        try { const e = Date.parse(product.product_coupon_end_date); if (!isNaN(e) && e < now) { setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Coupon expired' } })); return } } catch (e) {}
      }
      if (item.quantity < (product.product_coupon_min_qty || 1)) {
        setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: `Min qty: ${product.product_coupon_min_qty}` } })); return
      }
      const itemTotal = item.sale_price * item.quantity
      const discountAmt = product.product_coupon_type === 'percentage'
        ? Math.round(itemTotal * product.product_coupon_value / 100)
        : Math.min(product.product_coupon_value, itemTotal)

      if (orderCouponApplied) { setOrderDiscount(0); setOrderCouponApplied(''); setOrderCouponCode('') }
      setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applied: input.toUpperCase(), discount: discountAmt, applying: false, error: '' } }))
      toast.success(`Saved ${formatINR(discountAmt)}!`)
    } catch { setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], applying: false, error: 'Failed — try again' } })) }
  }, [productCouponData, productCoupons, orderCouponApplied])

  const removeProductCoupon = (id) => setProductCoupons(prev => ({ ...prev, [id]: { inputCode: '', applied: '', discount: 0, error: '' } }))

  const applyOrderCoupon = async () => {
    if (!orderCouponCode.trim()) return
    if (hasProductCoupon) { toast.error('Remove product coupons first'); return }
    setApplyingOrder(true)
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', orderCouponCode.toUpperCase()).eq('is_active', true).single()
      if (!data) { toast.error('Invalid coupon'); setApplyingOrder(false); return }
      if (subtotal < (data.min_order_amount || 0)) { toast.error(`Min order ${formatINR(data.min_order_amount)}`); setApplyingOrder(false); return }
      const discountAmt = data.discount_type === 'percentage' ? Math.round(subtotal * data.discount_value / 100) : data.discount_value
      setOrderDiscount(discountAmt); setOrderCouponApplied(data.code)
      toast.success(`Saved ${formatINR(discountAmt)}!`)
    } catch { toast.error('Invalid coupon') }
    setApplyingOrder(false)
  }

  const handleCheckout = () => {
    const { user } = useStore.getState()
    if (!user) { toast.error('Please login'); router.push('/login?redirect=/checkout'); return }
    router.push('/checkout')
  }

  if (!mounted) return <div style={{ minHeight: '100vh' }}><Navbar /><div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>Loading...</div></div>

  if (cart.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>🛒</div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Cart is empty</h2>
        <p style={{ color: '#999', marginBottom: '28px' }}>Add products to get started</p>
        <Link href="/collections/all">
          <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>
            Browse Products
          </button>
        </Link>
      </div>
      <Footer />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        * { box-sizing: border-box; }
        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cart-grid { grid-template-columns: 1fr !important; }
          .cart-summary-sticky { position: static !important; }
        }
        .coupon-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        @media (max-width: 400px) {
          .coupon-row { flex-direction: column; align-items: stretch; }
          .coupon-row input { width: 100% !important; }
          .coupon-row button { width: 100% !important; }
        }
        .item-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        @media (max-width: 360px) {
          .item-row { gap: 8px; }
          .item-image { width: 72px !important; height: 72px !important; }
        }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 12px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <ShoppingBag size={24} color="#e53935" />
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>
            My Cart <span style={{ fontSize: '16px', color: '#999', fontWeight: '500' }}>({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>

        <div className="cart-grid">

          {/* ===== LEFT: CART ITEMS ===== */}
          <div>
            {cart.map(item => {
              const pc = productCoupons[item.id] || {}
              const pcd = productCouponData[item.id] || {}
              const itemDiscount = pc.discount || 0
              const showCouponInput = pcd.product_coupon_enabled && pcd.product_coupon_active && !pc.applied

              return (
                <div key={item.id} style={{
                  background: 'white', borderRadius: '14px',
                  padding: '14px', marginBottom: '10px',
                  border: `1px solid ${itemDiscount > 0 ? '#bbdefb' : '#f0f0f0'}`,
                  overflow: 'hidden'
                }}>

                  {/* Product Row */}
                  <div className="item-row">
                    {/* Image */}
                    <Link href={`/product/${item.slug}`} style={{ flexShrink: 0 }}>
                      <div className="item-image" style={{ width: '82px', height: '82px', background: '#f8f8f8', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          : <span style={{ fontSize: '28px' }}>🛍️</span>}
                      </div>
                    </Link>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </h3>

                      {/* Price row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#e53935' }}>{formatINR(item.sale_price)}</span>
                        {item.mrp > item.sale_price && (
                          <span style={{ fontSize: '11px', color: '#bbb', textDecoration: 'line-through' }}>{formatINR(item.mrp)}</span>
                        )}
                      </div>

                      {/* Qty + Remove */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ width: '32px', height: '32px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ width: '32px', height: '32px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <button onClick={() => { removeFromCart(item.id); toast.success('Removed') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: '600', padding: '4px 0' }}>
                          <Trash2 size={13} /> Remove
                        </button>

                        {/* Item total - right aligned */}
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          {itemDiscount > 0 ? (
                            <div>
                              <div style={{ fontSize: '11px', color: '#bbb', textDecoration: 'line-through' }}>{formatINR(item.sale_price * item.quantity)}</div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1565c0' }}>{formatINR(item.sale_price * item.quantity - itemDiscount)}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a1a' }}>{formatINR(item.sale_price * item.quantity)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Coupon — Applied State */}
                  {pc.applied && (
                    <div style={{ marginTop: '10px', background: 'linear-gradient(135deg, #e3f2fd, #e8f5e9)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #bbdefb', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>🏷️</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#1565c0', whiteSpace: 'nowrap' }}>{pc.applied} applied!</div>
                          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: '600' }}>Saved {formatINR(itemDiscount)}</div>
                        </div>
                      </div>
                      <button onClick={() => removeProductCoupon(item.id)}
                        style={{ background: '#ffebee', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 }}>
                        ✕ Remove
                      </button>
                    </div>
                  )}

                  {/* Product Coupon — Input State */}
                  {showCouponInput && (
                    <div style={{ marginTop: '10px', background: '#f0f4ff', borderRadius: '10px', padding: '10px 12px', border: '1px dashed #90caf9' }}>
                      <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🏷️ Coupon available for this product
                      </div>

                      {/* Coupon input + button */}
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <input
                          type="text"
                          value={pc.inputCode || ''}
                          onChange={e => setProductCoupons(prev => ({ ...prev, [item.id]: { ...prev[item.id], inputCode: e.target.value.toUpperCase(), error: '' } }))}
                          placeholder="Enter coupon code"
                          onKeyPress={e => e.key === 'Enter' && applyProductCoupon(item)}
                          style={{
                            flex: 1, minWidth: 0,
                            padding: '9px 10px',
                            border: '1.5px solid #90caf9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            outline: 'none',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            background: 'white',
                            width: '100%'
                          }}
                        />
                        <button
                          onClick={() => applyProductCoupon(item)}
                          disabled={pc.applying}
                          style={{
                            background: pc.applying ? '#90caf9' : '#1565c0',
                            color: 'white', border: 'none',
                            padding: '9px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: pc.applying ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                          {pc.applying ? '...' : 'Apply'}
                        </button>
                      </div>

                      {pc.error && (
                        <div style={{ fontSize: '11px', color: '#e53935', marginTop: '6px', fontWeight: '600' }}>
                          ❌ {pc.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Free Delivery Banner */}
            <div style={{
              borderRadius: '10px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: subtotal >= 499 ? '#e8f5e9' : '#fff3e0',
              border: `1px dashed ${subtotal >= 499 ? '#2e7d32' : '#ff6f00'}`,
              marginBottom: '4px'
            }}>
              <Truck size={18} color={subtotal >= 499 ? '#2e7d32' : '#ff6f00'} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {subtotal >= 499 ? (
                  <span style={{ fontSize: '13px', color: '#1b5e20', fontWeight: '700' }}>
                    🎉 You qualify for FREE delivery!
                  </span>
                ) : (
                  <div>
                    <span style={{ fontSize: '13px', color: '#e65100', fontWeight: '600' }}>
                      Add {formatINR(499 - subtotal)} more for FREE delivery
                    </span>
                    <div style={{ background: '#ffe0b2', borderRadius: '4px', height: '4px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ background: '#ff6f00', height: '100%', width: `${Math.min((subtotal / 499) * 100, 100)}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT: ORDER SUMMARY ===== */}
          <div className="cart-summary-sticky" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a' }}>Order Summary</h3>

            {/* Order Coupon */}
            {!hasProductCoupon ? (
              <div style={{ marginBottom: '16px', background: '#f8f8f8', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={13} /> Order Coupon
                </div>
                {orderCouponApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f5e9', padding: '8px 10px', borderRadius: '8px', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#2e7d32', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orderCouponApplied} ✓</div>
                      <div style={{ fontSize: '11px', color: '#2e7d32' }}>Saving {formatINR(effectiveOrderDiscount)}</div>
                    </div>
                    <button onClick={() => { setOrderDiscount(0); setOrderCouponApplied(''); setOrderCouponCode('') }}
                      style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>✕</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                      <input
                        type="text"
                        value={orderCouponCode}
                        onChange={e => setOrderCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={e => e.key === 'Enter' && applyOrderCoupon()}
                        placeholder="Enter coupon code"
                        style={{
                          flex: 1, minWidth: 0,
                          padding: '8px 10px',
                          border: '1.5px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                          background: 'white',
                          fontWeight: '600'
                        }}
                      />
                      <button onClick={applyOrderCoupon} disabled={applyingOrder}
                        style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
                        {applyingOrder ? '...' : 'Apply'}
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>Try: LOVEKONDA, SAVE100</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '16px', background: '#e3f2fd', borderRadius: '10px', padding: '10px 12px', border: '1px solid #90caf9' }}>
                <div style={{ fontSize: '12px', color: '#1565c0', fontWeight: '700' }}>
                  🏷️ Product coupon applied
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Order coupon disabled</div>
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ fontWeight: '600' }}>{formatINR(subtotal)}</span>
              </div>

              {/* Product discounts */}
              {totalProductDiscount > 0 && (
                <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '8px 10px' }}>
                  {cart.map(item => {
                    const d = productCoupons[item.id]?.discount || 0
                    if (!d) return null
                    return (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px', gap: '8px' }}>
                        <span style={{ color: '#1565c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          🏷️ {productCoupons[item.id]?.applied}
                        </span>
                        <span style={{ fontWeight: '700', color: '#1565c0', flexShrink: 0 }}>-{formatINR(d)}</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', color: '#1565c0', paddingTop: '4px', borderTop: '1px solid #90caf9', marginTop: '4px' }}>
                    <span>Product Discount</span>
                    <span>-{formatINR(totalProductDiscount)}</span>
                  </div>
                </div>
              )}

              {effectiveOrderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#2e7d32' }}>🏷️ {orderCouponApplied}</span>
                  <span style={{ fontWeight: '700', color: '#2e7d32' }}>-{formatINR(effectiveOrderDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ fontWeight: '600', color: shipping === 0 ? '#2e7d32' : '#333' }}>
                  {shipping === 0 ? '🎉 FREE' : formatINR(shipping)}
                </span>
              </div>

              {(totalProductDiscount + effectiveOrderDiscount) > 0 && (
                <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '700' }}>💰 Total Savings</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2e7d32' }}>-{formatINR(totalProductDiscount + effectiveOrderDiscount)}</span>
                </div>
              )}

              <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800' }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#e53935' }}>{formatINR(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button onClick={handleCheckout}
              style={{ width: '100%', background: 'linear-gradient(135deg, #e53935, #c62828)', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,57,53,0.3)', marginBottom: '8px' }}>
              Proceed to Checkout →
            </button>
            <Link href="/collections/all" style={{ display: 'block' }}>
              <button style={{ width: '100%', background: 'white', color: '#666', border: '1px solid #e0e0e0', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ← Continue Shopping
              </button>
            </Link>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f5f5f5' }}>
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