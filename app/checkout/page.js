'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import useStore from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { MapPin, CreditCard, CheckCircle, ChevronRight, Truck, Shield } from 'lucide-react'
import { formatINR } from '@/lib/currency'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart, user } = useStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [address, setAddress] = useState({
    full_name: '', phone: '', address_line1: '',
    address_line2: '', city: '', state: '', pincode: ''
  })

  const subtotal = getCartTotal()
  const shipping = subtotal >= 499 ? 0 : 49
  const total = subtotal + shipping

  useEffect(() => {
    if (user) loadSavedAddress()
  }, [user])

  const loadSavedAddress = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (data) {
      setAddress({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || ''
      })
      toast.success('📍 Saved address loaded!')
    }
  }

  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout')
      router.push('/login?redirect=/checkout')
    }
    if (cart.length === 0) {
      router.push('/cart')
    }
  }, [user, cart])

  const handleAddressChange = e => {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  const validateAddress = () => {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode']
    for (let field of required) {
      if (!address[field].trim()) {
        toast.error(`Please enter ${field.replace('_', ' ')}`)
        return false
      }
    }
    if (address.phone.length < 10) { toast.error('Enter valid phone number'); return false }
    if (address.pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return false }
    return true
  }

  const generateOrderNumber = () => {
    return 'KD' + Date.now().toString().slice(-8).toUpperCase()
  }

  const placeOrder = async () => {
    if (!validateAddress()) return
    setLoading(true)
    try {
      const orderNumber = generateOrderNumber()

      if (user) {
        const existingAddr = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', user.id)
          .eq('pincode', address.pincode)
          .eq('address_line1', address.address_line1)
          .single()

        if (!existingAddr.data) {
          await supabase.from('addresses').insert({
            user_id: user.id,
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            is_default: true
          })
        }
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          full_name: address.full_name,
          phone: address.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          subtotal: subtotal,
          shipping_amount: shipping,
          final_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
          status: 'confirmed'
        })
        .select()
        .single()

      if (error) throw error

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.images?.[0] || null,
        quantity: item.quantity,
        mrp: item.mrp,
        sale_price: item.sale_price
      }))
      await supabase.from('order_items').insert(orderItems)

      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'confirmed',
        remarks: 'Order placed successfully'
      })

      clearCart()
      toast.success('Order placed successfully! 🎉')
      router.push(`/order-success?order=${orderNumber}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to place order. Please try again.')
    }
    setLoading(false)
  }

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ]

  const inputStyle = {
    width: '100%', padding: '12px', border: '1.5px solid #e0e0e0',
    borderRadius: '10px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s'
  }

  const labelStyle = {
    fontSize: '13px', fontWeight: '600', color: '#555',
    display: 'block', marginBottom: '6px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '24px', color: '#1a1a1a' }}>
          Checkout
        </h1>

        {/* Steps Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', background: 'white', borderRadius: '12px', padding: '16px 24px', border: '1px solid #f0f0f0' }}>
          {[
            { num: 1, label: 'Delivery Address', icon: <MapPin size={16} /> },
            { num: 2, label: 'Payment Method', icon: <CreditCard size={16} /> },
            { num: 3, label: 'Review & Place Order', icon: <CheckCircle size={16} /> },
          ].map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step >= s.num ? '#e53935' : '#f0f0f0',
                  color: step >= s.num ? 'white' : '#999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700', flexShrink: 0
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '13px', fontWeight: step === s.num ? '700' : '500', color: step >= s.num ? '#1a1a1a' : '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {s.icon} {s.label}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: '2px', background: step > s.num ? '#e53935' : '#f0f0f0', margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Left Panel */}
          <div style={{ gridColumn: 'span 2' }}>

            {/* STEP 1: Address */}
            {step === 1 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1a1a' }}>
                  <MapPin size={20} color="#e53935" /> Delivery Address
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input name="full_name" value={address.full_name} onChange={handleAddressChange}
                      placeholder="Your full name" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input name="phone" value={address.phone} onChange={handleAddressChange}
                      placeholder="10-digit mobile number" style={inputStyle} maxLength={10}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Address Line 1 *</label>
                    <input name="address_line1" value={address.address_line1} onChange={handleAddressChange}
                      placeholder="House/Flat No., Building Name, Street" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Address Line 2 (optional)</label>
                    <input name="address_line2" value={address.address_line2} onChange={handleAddressChange}
                      placeholder="Area, Colony, Locality" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input name="city" value={address.city} onChange={handleAddressChange}
                      placeholder="Your city" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PIN Code *</label>
                    <input name="pincode" value={address.pincode} onChange={handleAddressChange}
                      placeholder="6-digit pincode" style={inputStyle} maxLength={6}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>State *</label>
                    <select name="state" value={address.state} onChange={handleAddressChange}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Select State</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => validateAddress() && setStep(2)}
                  style={{
                    marginTop: '24px', background: '#e53935', color: 'white',
                    border: 'none', padding: '14px 32px', borderRadius: '10px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                  Continue to Payment <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1a1a' }}>
                  <CreditCard size={20} color="#e53935" /> Payment Method
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', emoji: '💵' },
                    { id: 'upi', label: 'UPI Payment', sub: 'GPay, PhonePe, Paytm, BHIM', emoji: '📱' },
                    { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', emoji: '💳' },
                    { id: 'netbanking', label: 'Net Banking', sub: 'All major banks supported', emoji: '🏦' },
                  ].map(method => (
                    <div key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: '16px', borderRadius: '12px', cursor: 'pointer',
                        border: `2px solid ${paymentMethod === method.id ? '#e53935' : '#e0e0e0'}`,
                        background: paymentMethod === method.id ? '#fff5f5' : 'white',
                        display: 'flex', alignItems: 'center', gap: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{method.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>{method.label}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{method.sub}</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${paymentMethod === method.id ? '#e53935' : '#ccc'}`,
                        background: paymentMethod === method.id ? '#e53935' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {paymentMethod === method.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                      </div>
                    </div>
                  ))}
                </div>

                {paymentMethod === 'upi' && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f8f8f8', borderRadius: '10px' }}>
                    <label style={labelStyle}>Enter UPI ID</label>
                    <input placeholder="yourname@upi" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={() => setStep(1)}
                    style={{ padding: '14px 24px', border: '1.5px solid #e0e0e0', borderRadius: '10px', background: 'white', color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep(3)}
                    style={{ flex: 1, background: '#e53935', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1a1a' }}>
                  <CheckCircle size={20} color="#e53935" /> Review Your Order
                </h2>

                {/* Address Summary */}
                <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#e53935" /> Delivering to
                    </div>
                    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Change</button>
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                    <strong>{address.full_name}</strong> | {address.phone}<br />
                    {address.address_line1}{address.address_line2 ? ', ' + address.address_line2 : ''}<br />
                    {address.city}, {address.state} - {address.pincode}
                  </div>
                </div>

                {/* Payment Summary */}
                <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={14} color="#e53935" /> Payment
                    </div>
                    <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#e53935', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Change</button>
                  </div>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {paymentMethod === 'cod' ? '💵 Cash on Delivery' :
                      paymentMethod === 'upi' ? '📱 UPI Payment' :
                        paymentMethod === 'card' ? '💳 Credit/Debit Card' : '🏦 Net Banking'}
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                    Order Items ({cart.length})
                  </div>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', background: '#f8f8f8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.images?.[0] ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} /> : <span style={{ fontSize: '24px' }}>🛍️</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', lineHeight: '1.3' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{formatINR(item.sale_price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep(2)}
                    style={{ padding: '14px 24px', border: '1.5px solid #e0e0e0', borderRadius: '10px', background: 'white', color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={placeOrder} disabled={loading}
                    style={{
                      flex: 1, background: loading ? '#ccc' : '#e53935',
                      color: 'white', border: 'none', padding: '14px',
                      borderRadius: '10px', fontSize: '16px', fontWeight: '800',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                    {loading ? '⏳ Placing Order...' : '🎉 Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f5f5f5' }}>
              Order Summary
            </h3>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px', gap: '8px' }}>
                <span style={{ color: '#555', flex: 1 }}>{item.name.substring(0, 28)}... × {item.quantity}</span>
                <span style={{ fontWeight: '700', flexShrink: 0 }}>{formatINR(item.sale_price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: '#f0f0f0', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>Subtotal</span>
              <span style={{ fontWeight: '600' }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>Shipping</span>
              <span style={{ fontWeight: '600', color: shipping === 0 ? '#2e7d32' : '#333' }}>
                {shipping === 0 ? 'FREE' : formatINR(shipping)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px', paddingTop: '12px', borderTop: '2px solid #f0f0f0', marginTop: '8px' }}>
              <span>Total</span>
              <span style={{ color: '#e53935' }}>{formatINR(total)}</span>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' }}>
                <Shield size={14} color="#2e7d32" /> 100% Secure Checkout
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' }}>
                <Truck size={14} color="#2e7d32" /> {shipping === 0 ? 'Free Delivery' : `${formatINR(shipping)} Delivery Charge`}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}