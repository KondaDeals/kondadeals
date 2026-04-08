'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

function TrackContent() {
  const searchParams = useSearchParams()
  const [orderNum, setOrderNum] = useState(searchParams.get('order') || '')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const trackOrder = async () => {
    if (!orderNum.trim()) { setError('Please enter order number'); return }
    setLoading(true); setError(''); setOrder(null)
    const { data: orderData } = await supabase
      .from('orders').select('*')
      .eq('order_number', orderNum.trim().toUpperCase())
      .single()

    if (!orderData) { setError('Order not found. Please check your order number.'); setLoading(false); setSearched(true); return }
    if (phone && orderData.phone !== phone.trim()) { setError('Phone number does not match this order.'); setLoading(false); return }

    const { data: histData } = await supabase
      .from('order_status_history').select('*')
      .eq('order_id', orderData.id).order('created_at', { ascending: true })

    setOrder(orderData)
    setHistory(histData || [])
    setSearched(true)
    setLoading(false)
  }

  const statusSteps = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered']
  const statusIcons = { pending:'🕐', confirmed:'✅', processing:'⚙️', packed:'📦', shipped:'🚚', out_for_delivery:'🏃', delivered:'🎉', cancelled:'❌' }
  const statusLabels = { pending:'Order Placed', confirmed:'Confirmed', processing:'Processing', packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' }

  const getCurrentStep = () => order ? statusSteps.indexOf(order.status) : -1
  const isCompleted = step => statusSteps.indexOf(step) <= getCurrentStep()

  const formatDT = dt => dt ? new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }) : ''

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <h1 style={{ fontSize:'28px', fontWeight:'900', color:'#1a1a1a', marginBottom:'8px' }}>📦 Track Your Order</h1>
          <p style={{ color:'#666', fontSize:'15px' }}>Enter your order number to see real-time tracking updates</p>
        </div>

        {/* Search Form */}
        <div style={{ background:'white', borderRadius:'16px', padding:'28px', border:'1px solid #f0f0f0', marginBottom:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#555', display:'block', marginBottom:'6px' }}>Order Number *</label>
              <input value={orderNum} onChange={e => setOrderNum(e.target.value.toUpperCase())}
                placeholder="e.g. KD62688615"
                style={{ width:'100%', padding:'12px', border:'1.5px solid #e0e0e0', borderRadius:'10px', fontSize:'15px', outline:'none', boxSizing:'border-box', fontWeight:'700', letterSpacing:'1px' }}
                onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'}
                onKeyPress={e => e.key === 'Enter' && trackOrder()}
              />
            </div>
            <div>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#555', display:'block', marginBottom:'6px' }}>Phone Number (optional)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="For verification"
                style={{ width:'100%', padding:'12px', border:'1.5px solid #e0e0e0', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'}
              />
            </div>
          </div>
          {error && <div style={{ background:'#ffebee', color:'#c62828', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', marginBottom:'12px' }}>❌ {error}</div>}
          <button onClick={trackOrder} disabled={loading}
            style={{ width:'100%', background: loading ? '#ccc' : '#e53935', color:'white', border:'none', padding:'14px', borderRadius:'10px', fontSize:'16px', fontWeight:'800', cursor: loading ? 'not-allowed' : 'pointer', transition:'background 0.2s' }}>
            {loading ? '🔍 Searching...' : '🔍 Track Order'}
          </button>
        </div>

        {/* Tracking Results */}
        {order && (
          <div>
            {/* Order Summary */}
            <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #f0f0f0', marginBottom:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', marginBottom:'20px' }}>
                <div>
                  <div style={{ fontSize:'22px', fontWeight:'900', color:'#e53935' }}>#{order.order_number}</div>
                  <div style={{ fontSize:'13px', color:'#666', marginTop:'4px' }}>Placed on {formatDT(order.created_at)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ background:`${statusSteps.indexOf(order.status) >= 0 ? '#e8f5e9' : '#ffebee'}`, color: order.status === 'cancelled' ? '#c62828' : '#2e7d32', padding:'8px 16px', borderRadius:'20px', fontWeight:'700', fontSize:'14px', textTransform:'capitalize' }}>
                    {statusIcons[order.status]} {statusLabels[order.status] || order.status}
                  </div>
                  <div style={{ fontSize:'18px', fontWeight:'900', marginTop:'8px', color:'#1a1a1a' }}>₹{order.final_amount}</div>
                </div>
              </div>

              {/* Progress Bar */}
              {order.status !== 'cancelled' && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', position:'relative', marginBottom:'32px' }}>
                    <div style={{ position:'absolute', top:'16px', left:'5%', right:'5%', height:'3px', background:'#f0f0f0', zIndex:0 }} />
                    <div style={{ position:'absolute', top:'16px', left:'5%', height:'3px', background:'#e53935', zIndex:0, transition:'width 0.5s', width:`${Math.min(100, (getCurrentStep() / (statusSteps.length - 1)) * 90)}%` }} />
                    {statusSteps.filter(s => s !== 'cancelled').map((step, i) => {
                      const done = isCompleted(step)
                      const current = step === order.status
                      return (
                        <div key={step} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', zIndex:1 }}>
                          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: done ? '#e53935' : '#f0f0f0', border:`3px solid ${done ? '#e53935' : '#e0e0e0'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', transition:'all 0.3s', boxShadow: current ? '0 0 0 4px rgba(229,57,53,0.2)' : 'none' }}>
                            {done ? (current ? statusIcons[step] : '✓') : statusIcons[step]}
                          </div>
                          <div style={{ fontSize:'10px', fontWeight: current ? '700' : '500', color: done ? '#e53935' : '#999', textAlign:'center', maxWidth:'60px', lineHeight:'1.3' }}>
                            {statusLabels[step]}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tracking Number */}
              {order.tracking_number && (
                <div style={{ background:'linear-gradient(135deg, #e3f2fd, #e8f5e9)', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid #bbdefb' }}>
                  <div style={{ fontWeight:'700', fontSize:'13px', color:'#1565c0', marginBottom:'4px' }}>🚚 TRACKING NUMBER</div>
                  <div style={{ fontSize:'20px', fontWeight:'900', color:'#1a1a1a', letterSpacing:'1px' }}>{order.tracking_number}</div>
                  {order.courier_name && <div style={{ fontSize:'13px', color:'#666', marginTop:'4px' }}>via {order.courier_name}</div>}
                </div>
              )}

              {/* Delivery Address */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#999', textTransform:'uppercase', marginBottom:'6px' }}>Delivering to</div>
                  <div style={{ fontWeight:'700', fontSize:'14px' }}>{order.full_name}</div>
                  <div style={{ fontSize:'12px', color:'#666', marginTop:'4px', lineHeight:'1.5' }}>
                    {order.address_line1}, {order.city}<br/>{order.state} - {order.pincode}
                  </div>
                </div>
                <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#999', textTransform:'uppercase', marginBottom:'6px' }}>Payment</div>
                  <div style={{ fontWeight:'700', fontSize:'14px', textTransform:'uppercase' }}>{order.payment_method}</div>
                  <div style={{ fontSize:'12px', color: order.payment_status === 'paid' ? '#2e7d32' : '#e65100', marginTop:'4px', fontWeight:'600' }}>
                    {order.payment_status === 'paid' ? '✅ Paid' : '⏰ Pay on Delivery'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #f0f0f0', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize:'18px', fontWeight:'800', marginBottom:'20px' }}>📋 Order Timeline</h3>
              {history.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px', color:'#999' }}>No timeline yet</div>
              ) : (
                history.map((h, i) => (
                  <div key={h.id} style={{ display:'flex', gap:'16px', marginBottom: i < history.length - 1 ? '0' : '0' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'50%', background: i === history.length - 1 ? '#e53935' : '#e8f5e9', border:`2px solid ${i === history.length - 1 ? '#e53935' : '#2e7d32'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                        {statusIcons[h.status] || '📋'}
                      </div>
                      {i < history.length - 1 && <div style={{ width:'2px', height:'40px', background:'#e0e0e0', margin:'4px 0' }} />}
                    </div>
                    <div style={{ flex:1, paddingBottom: i < history.length - 1 ? '0' : '0', paddingTop:'8px' }}>
                      <div style={{ fontWeight:'800', fontSize:'15px', textTransform:'capitalize', color: i === history.length - 1 ? '#e53935' : '#1a1a1a' }}>
                        {statusLabels[h.status] || h.status}
                      </div>
                      {h.remarks && <div style={{ fontSize:'13px', color:'#666', marginTop:'3px' }}>{h.remarks}</div>}
                      {h.tracking_number && (
                        <div style={{ fontSize:'13px', color:'#1565c0', fontWeight:'700', marginTop:'3px' }}>
                          🔍 Tracking: {h.tracking_number}
                        </div>
                      )}
                      <div style={{ fontSize:'12px', color:'#999', marginTop:'5px', marginBottom:'16px' }}>🕐 {formatDT(h.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {searched && !order && !loading && !error && (
          <div style={{ textAlign:'center', padding:'40px', background:'white', borderRadius:'16px' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔍</div>
            <h3 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'8px' }}>Order not found</h3>
            <p style={{ color:'#999', fontSize:'14px' }}>Please check your order number and try again</p>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:'24px', fontSize:'13px', color:'#999' }}>
          Need help? <Link href="/" style={{ color:'#e53935', fontWeight:'600' }}>Contact us</Link> or call <strong>+91 78160 10619</strong>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <TrackContent />
    </Suspense>
  )
}