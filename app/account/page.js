'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import useStore from '@/lib/store'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Package, MapPin, User, LogOut, ChevronRight, ShoppingBag } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const { user, setUser } = useStore()
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' })

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/account')
      return
    }
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    const [ordersRes, profileRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single()
    ])
    if (ordersRes.data) setOrders(ordersRes.data)
    if (profileRes.data) {
      setProfile(profileRes.data)
      setProfileForm({ full_name: profileRes.data.full_name || '', phone: profileRes.data.phone || '' })
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase.from('profiles')
      .update({ full_name: profileForm.full_name, phone: profileForm.phone })
      .eq('id', user.id)
    if (!error) {
      toast.success('Profile updated!')
      setEditProfile(false)
      fetchData()
    } else {
      toast.error('Failed to update profile')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
      pending: { bg: '#fff3e0', color: '#e65100' },
      shipped: { bg: '#e3f2fd', color: '#1565c0' },
      delivered: { bg: '#e8f5e9', color: '#2e7d32' },
      cancelled: { bg: '#ffebee', color: '#c62828' },
    }
    return colors[status] || colors.pending
  }

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: <Package size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
  ]

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f0f0f0', position: 'sticky', top: '80px' }}>
            {/* User Info */}
            <div style={{ background: 'linear-gradient(135deg, #e53935, #ff6f00)', padding: '24px', color: 'white', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px', fontWeight: '800' }}>
                {(profile?.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ fontWeight: '800', fontSize: '16px' }}>
                {profile?.full_name || 'My Account'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
                {user.email}
              </div>
            </div>

            {/* Nav Items */}
            <div style={{ padding: '8px 0' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', padding: '14px 20px',
                    background: activeTab === tab.id ? '#fff5f5' : 'white',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '14px', fontWeight: activeTab === tab.id ? '700' : '500',
                    color: activeTab === tab.id ? '#e53935' : '#555',
                    borderLeft: activeTab === tab.id ? '3px solid #e53935' : '3px solid transparent',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}>
                  {tab.icon} {tab.label}
                  <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
              <button onClick={handleLogout}
                style={{
                  width: '100%', padding: '14px 20px',
                  background: 'white', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '14px', fontWeight: '500', color: '#e53935',
                  borderLeft: '3px solid transparent', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={22} color="#e53935" /> My Orders
                </h2>
                {loading ? (
                  <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#999' }}>Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                    <ShoppingBag size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>No orders yet</h3>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>Start shopping to see your orders here</p>
                    <button onClick={() => router.push('/collections/all')}
                      style={{ background: '#e53935', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  orders.map(order => {
                    const statusStyle = getStatusColor(order.status)
                    return (
                      <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>#{order.order_number}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>
                              {order.status}
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53935' }}>₹{order.final_amount}</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '16px' }}>
                          {order.order_items?.slice(0, 2).map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                              <div style={{ width: '48px', height: '48px', background: '#f8f8f8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {item.product_image ? <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} /> : <span style={{ fontSize: '20px' }}>🛍️</span>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{item.product_name}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>Qty: {item.quantity} × ₹{item.sale_price}</div>
                              </div>
                            </div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <div style={{ fontSize: '12px', color: '#999' }}>+{order.order_items.length - 2} more items</div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '13px', color: '#666', flex: 1 }}>
                            <strong>Payment:</strong> {order.payment_method?.toUpperCase()} |
                            <strong> Delivery:</strong> {order.address_line1}, {order.city}
                          </div>
                          <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600', background: '#e8f5e9', padding: '4px 10px', borderRadius: '20px' }}>
                            📦 Expected: 3-5 days
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={22} color="#e53935" /> My Profile
                  </h2>
                  <button onClick={() => setEditProfile(!editProfile)}
                    style={{ background: editProfile ? '#f5f5f5' : '#fff5f5', color: editProfile ? '#666' : '#e53935', border: `1px solid ${editProfile ? '#e0e0e0' : '#e53935'}`, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    {editProfile ? 'Cancel' : '✏️ Edit Profile'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                    {editProfile ? (
                      <input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1.5px solid #e53935', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}>
                        {profile?.full_name || 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}>
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
                    {editProfile ? (
                      <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        style={{ width: '100%', padding: '12px', border: '1.5px solid #e53935', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}>
                        {profile?.phone || 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#999', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Since</label>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', padding: '12px', background: '#f8f8f8', borderRadius: '10px' }}>
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  {editProfile && (
                    <button onClick={handleSaveProfile}
                      style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={22} color="#e53935" /> My Addresses
                </h2>
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                  <MapPin size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>No saved addresses</h3>
                  <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
                    Your addresses will be saved after placing an order
                  </p>
                  <button onClick={() => router.push('/checkout')}
                    style={{ background: '#e53935', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    Place an Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}