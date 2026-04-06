'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CheckCircle, Package, Truck, Home } from 'lucide-react'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'KD00000000'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px 32px', border: '1px solid #f0f0f0', boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
          {/* Success Icon */}
          <div style={{ width: '80px', height: '80px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={44} color="#2e7d32" />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a1a', marginBottom: '8px' }}>
            Order Placed! 🎉
          </h1>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '24px' }}>
            Thank you for shopping with KondaDeals!
          </p>

          {/* Order Number */}
          <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px', marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '4px' }}>ORDER NUMBER</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#e53935', letterSpacing: '1px' }}>
              #{orderNumber}
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '36px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: '#f0f0f0', zIndex: 0 }} />
            {[
              { icon: <CheckCircle size={18} />, label: 'Confirmed', active: true },
              { icon: <Package size={18} />, label: 'Packed', active: false },
              { icon: <Truck size={18} />, label: 'Shipped', active: false },
              { icon: <Home size={18} />, label: 'Delivered', active: false },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: s.active ? '#e53935' : '#f0f0f0',
                  color: s.active ? 'white' : '#999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: s.active ? '#1a1a1a' : '#999' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: '#e65100' }}>
            📦 Expected delivery in <strong>3-5 business days</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/account/orders">
              <button style={{ background: 'white', color: '#e53935', border: '2px solid #e53935', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Track Order
              </button>
            </Link>
            <Link href="/collections/all">
              <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Continue Shopping →
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}