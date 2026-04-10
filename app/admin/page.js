'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import { Plus, X, Save, Edit, Trash2 } from 'lucide-react'

const ADMIN_EMAILS = ['iamkondakirankumarreddy@gmail.com']

const inp = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: 'white'
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [socialLinks, setSocialLinks] = useState([])
  const [siteSettings, setSiteSettings] = useState([])
  const [heroBanners, setHeroBanners] = useState([])
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, cancelled: 0 })
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingBanner, setEditingBanner] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [reportFilter, setReportFilter] = useState({ from: '', to: '', status: 'all', category: 'all' })
const [trustStrips, setTrustStrips] = useState([])
const [allReviews, setAllReviews] = useState([])

  const emptyProduct = { name:'', slug:'', description:'', mrp:'', sale_price:'', category_id:'', stock:'', images:[], discount_timer_hours:'', return_policy:'7_days', is_featured:false, is_trending:false, is_new_arrival:false, is_active:true }
  const [productForm, setProductForm] = useState(emptyProduct)
 const [categoryForm, setCategoryForm] = useState({ name:'', slug:'', description:'', image_url:'', is_active:true })
  const [bannerForm, setBannerForm] = useState({ title:'', subtitle:'', description:'', badge_text:'', cta_text:'Shop Now', cta_link:'/collections/all', bg_gradient:'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)', text_color:'#ffffff', button_color:'#ffffff', button_text_color:'#e53935', emoji:'⚡', sort_order:0, is_active:true })

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?redirect=/admin'); return }
    if (!ADMIN_EMAILS.includes(user.email)) {
      const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!p?.is_admin) { toast.error('Admin access required'); router.push('/'); return }
    }
    setAuthChecked(true)
    fetchAll()
  }

  const fetchAll = async () => {
 const [p, o, c, s, sl, hb, ts, rv] = await Promise.all([
  supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
  supabase.from('orders').select('*').order('created_at', { ascending: false }),
  supabase.from('categories').select('*').order('sort_order'),
  supabase.from('site_settings').select('*').order('label'),
  supabase.from('social_links').select('*').order('sort_order'),
  supabase.from('hero_banners').select('*').order('sort_order'),
  supabase.from('trust_strips').select('*').order('sort_order'),
  supabase.from('reviews').select('*, profiles(full_name)').order('created_at', { ascending: false }),
])
if (p.data) setProducts(p.data)
if (o.data) {
  setOrders(o.data)
  const active = o.data.filter(x => x.status !== 'cancelled')
  const cancelled = o.data.filter(x => x.status === 'cancelled')
  setStats({ revenue: active.reduce((s, x) => s + (x.final_amount || 0), 0), orders: o.data.length, products: p.data?.length || 0, cancelled: cancelled.length })
}
if (c.data) setCategories(c.data)
if (s.data) setSiteSettings(s.data)
if (sl.data) setSocialLinks(sl.data)
if (hb.data) setHeroBanners(hb.data)
if (ts.data) setTrustStrips(ts.data)
if (rv.data) setAllReviews(rv.data)
}

  const slugify = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // ===== PRODUCT FUNCTIONS =====
  const handleProductChange = e => {
    const { name, value, type, checked } = e.target
    if (name === 'name') setProductForm(p => ({ ...p, name: value, slug: slugify(value) }))
    else setProductForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const saveProduct = async () => {
    if (!productForm.name || !productForm.mrp || !productForm.sale_price || !productForm.category_id) { toast.error('Fill required fields'); return }
    const discountEndsAt = productForm.discount_timer_hours ? new Date(Date.now() + parseFloat(productForm.discount_timer_hours) * 3600000).toISOString() : null
    const data = { name: productForm.name, slug: productForm.slug || slugify(productForm.name), description: productForm.description, mrp: parseFloat(productForm.mrp), sale_price: parseFloat(productForm.sale_price), category_id: productForm.category_id, stock: parseInt(productForm.stock) || 0, images: productForm.images || [], discount_ends_at: discountEndsAt, discount_timer_hours: productForm.discount_timer_hours ? parseFloat(productForm.discount_timer_hours) : null, return_policy: productForm.return_policy || '7_days', is_featured: productForm.is_featured, is_trending: productForm.is_trending, is_new_arrival: productForm.is_new_arrival, is_active: productForm.is_active }
    const { error } = editingProduct ? await supabase.from('products').update(data).eq('id', editingProduct.id) : await supabase.from('products').insert(data)
    if (error) { toast.error(error.message); return }
    toast.success(editingProduct ? 'Updated!' : 'Added!')
    setShowProductModal(false); setEditingProduct(null); setProductForm(emptyProduct); fetchAll()
  }

  const editProduct = p => {
    setEditingProduct(p)
    setProductForm({ name: p.name, slug: p.slug, description: p.description || '', mrp: p.mrp, sale_price: p.sale_price, category_id: p.category_id, stock: p.stock, images: p.images || [], discount_timer_hours: p.discount_timer_hours || '', return_policy: p.return_policy || '7_days', is_featured: p.is_featured, is_trending: p.is_trending, is_new_arrival: p.is_new_arrival, is_active: p.is_active })
    setShowProductModal(true)
  }

  const deleteProduct = async id => {
    if (!confirm('Delete?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) { toast.success('Deleted!'); fetchAll() } else toast.error(error.message)
  }

  // ===== ORDER FUNCTIONS =====
  const openOrder = async (order) => {
    setSelectedOrder({ ...order, new_tracking: order.tracking_number || '', new_courier: order.courier_name || '', new_status: order.status })
    const { data } = await supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: true })
    setOrderHistory(data || [])
    setShowOrderModal(true)
  }

  const updateOrderStatus = async () => {
  if (!selectedOrder) return
  const { new_status, new_tracking, new_courier, id } = selectedOrder
  const updates = {
    status: new_status,
    status_updated_at: new Date().toISOString()
  }
  if (new_tracking) {
    updates.tracking_number = new_tracking
    updates.courier_name = new_courier
  }

  const { error } = await supabase.from('orders').update(updates).eq('id', id)
  if (error) { toast.error(error.message); return }

  // Add to history
  await supabase.from('order_status_history').insert({
    order_id: id,
    status: new_status,
    tracking_number: new_tracking || null,
    remarks: new_tracking
      ? `Shipped via ${new_courier || 'courier'}. Tracking: ${new_tracking}`
      : `Status updated to ${new_status}`
  })

  // Send notification
  try {
    const notifyType = new_status === 'shipped' ? 'order_shipped'
      : new_status === 'delivered' ? 'order_delivered'
      : 'order_placed'

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: notifyType,
        order: {
          ...selectedOrder,
          tracking_number: new_tracking,
          courier_name: new_courier
        },
        phone: selectedOrder.phone,
        email: selectedOrder.user_email || '',
      })
    })

    if (new_status === 'shipped') {
      toast.success(`✅ Updated! Customer notified via SMS & Email`)
    } else if (new_status === 'delivered') {
      toast.success(`✅ Delivered! Customer notified`)
    } else {
      toast.success('Order status updated!')
    }
  } catch (err) {
    toast.success('Status updated! (Notification pending setup)')
  }

  setShowOrderModal(false)
  fetchAll()
}

  // ===== CATEGORY FUNCTIONS =====
  const saveCategory = async () => {
  if (!categoryForm.name) { toast.error('Enter name'); return }
  const data = {
    name: categoryForm.name,
    slug: categoryForm.slug || slugify(categoryForm.name),
    description: categoryForm.description,
    image_url: categoryForm.image_url || null,
  }
  // Only include is_active if column exists
  try {
    data.is_active = categoryForm.is_active
  } catch(e) {}

  const { error } = editingCategory
    ? await supabase.from('categories').update(data).eq('id', editingCategory.id)
    : await supabase.from('categories').insert(data)

  if (error) {
    // If is_active column error, retry without it
    if (error.message.includes('is_active')) {
      delete data.is_active
      const { error: error2 } = editingCategory
        ? await supabase.from('categories').update(data).eq('id', editingCategory.id)
        : await supabase.from('categories').insert(data)
      if (error2) { toast.error(error2.message); return }
    } else {
      toast.error(error.message); return
    }
  }
  toast.success('Saved!')
  setShowCategoryModal(false)
  setEditingCategory(null)
  setCategoryForm({ name:'', slug:'', description:'', image_url:'', is_active:true })
  fetchAll()
}

  // ===== BANNER FUNCTIONS =====
  const saveBanner = async () => {
    if (!bannerForm.title) { toast.error('Enter title'); return }
    const { error } = editingBanner ? await supabase.from('hero_banners').update(bannerForm).eq('id', editingBanner.id) : await supabase.from('hero_banners').insert(bannerForm)
    if (error) { toast.error(error.message); return }
    toast.success('Banner saved!')
    setShowBannerModal(false); setEditingBanner(null); setBannerForm({ title:'', subtitle:'', description:'', badge_text:'', cta_text:'Shop Now', cta_link:'/collections/all', bg_gradient:'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)', text_color:'#ffffff', button_color:'#ffffff', button_text_color:'#e53935', emoji:'⚡', sort_order:0, is_active:true }); fetchAll()
  }

  const saveSetting = async (key, value) => {
    await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    toast.success('Saved!')
  }

  const saveSocialLink = async (id, url) => {
    await supabase.from('social_links').update({ url }).eq('id', id)
    toast.success('Saved!')
  }

  const getStatusColor = s => ({ confirmed:'#2e7d32', pending:'#e65100', processing:'#1565c0', packed:'#6a1b9a', shipped:'#0288d1', out_for_delivery:'#f57c00', delivered:'#2e7d32', cancelled:'#c62828' }[s] || '#666')

  const formatDateTime = dt => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true })
  }

  const tabs = [
  { id:'dashboard', label:'Dashboard', icon:'📊' },
  { id:'products', label:'Products', icon:'📦' },
  { id:'orders', label:'Orders', icon:'🛒' },
  { id:'categories', label:'Categories', icon:'🏷️' },
  { id:'banners', label:'Hero Banners', icon:'🖼️' },
  { id:'trust', label:'Trust Strip', icon:'🛡️' },
  { id:'reviews', label:'Reviews', icon:'⭐' },
  { id:'social', label:'Social Links', icon:'🔗' },
  { id:'settings', label:'Site Settings', icon:'⚙️' },
  { id:'reports', label:'Reports', icon:'📈' },
]

  if (!authChecked) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:'40px' }}>🔐</div><div style={{ color:'#666', marginTop:'12px', fontSize:'16px' }}>Verifying admin access...</div></div>
    </div>
  )

  // ===== REPORTS DATA =====
  const filteredOrders = orders.filter(o => {
    if (reportFilter.status !== 'all' && o.status !== reportFilter.status) return false
    if (reportFilter.from && new Date(o.created_at) < new Date(reportFilter.from)) return false
    if (reportFilter.to && new Date(o.created_at) > new Date(reportFilter.to + 'T23:59:59')) return false
    return true
  })

  const exportCSV = () => {
    const headers = ['Order #', 'Customer', 'Phone', 'City', 'Amount', 'Payment', 'Status', 'Date']
    const rows = filteredOrders.map(o => [o.order_number, o.full_name, o.phone, o.city, o.final_amount, o.payment_method, o.status, formatDateTime(o.created_at)])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `kondadeals-orders-${Date.now()}.csv`; a.click()
    toast.success('CSV downloaded!')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'#1a1a1a', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'56px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <img src="/logo.png" alt="KondaDeals" style={{ height:'28px', objectFit:'contain' }} />
          <span style={{ color:'#ff6f00', fontWeight:'800', fontSize:'13px', letterSpacing:'1px' }}>ADMIN</span>
        </div>
        <button onClick={() => router.push('/')} style={{ background:'rgba(255,255,255,0.1)', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>← View Store</button>
      </div>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <div style={{ width:'200px', background:'white', borderRight:'1px solid #f0f0f0', padding:'12px 0', flexShrink:0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width:'100%', padding:'11px 16px', background: tab===t.id ? '#fff5f5' : 'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight: tab===t.id ? '700' : '500', color: tab===t.id ? '#e53935' : '#555', borderLeft:`3px solid ${tab===t.id ? '#e53935' : 'transparent'}`, textAlign:'left', transition:'all 0.2s' }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'24px', overflow:'auto' }}>

          {/* ===== DASHBOARD ===== */}
          {tab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'20px' }}>Dashboard</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'24px' }}>
                {[
                  { label:'Net Revenue', value:`₹${stats.revenue.toLocaleString()}`, icon:'💰', note:'Excludes cancelled', color:'#e8f5e9' },
                  { label:'Total Orders', value:stats.orders, icon:'📦', note:`${stats.cancelled} cancelled`, color:'#e3f2fd' },
                  { label:'Products', value:stats.products, icon:'🛍️', note:'Active listings', color:'#fff3e0' },
                  { label:'Categories', value:categories.length, icon:'🏷️', note:'Product categories', color:'#fce4ec' },
                ].map((s, i) => (
                  <div key={i} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0', borderTop:`3px solid ${s.color === '#e8f5e9' ? '#2e7d32' : s.color === '#e3f2fd' ? '#1565c0' : s.color === '#fff3e0' ? '#e65100' : '#e53935'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <div style={{ fontSize:'11px', color:'#999', fontWeight:'600', textTransform:'uppercase' }}>{s.label}</div>
                      <span style={{ fontSize:'20px' }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize:'28px', fontWeight:'900', marginBottom:'4px' }}>{s.value}</div>
                    <div style={{ fontSize:'11px', color:'#999' }}>{s.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0' }}>
                <h3 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'16px' }}>Recent Orders</h3>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ borderBottom:'2px solid #f5f5f5' }}>
                    {['Order #','Customer','Amount','Payment','Status','Date & Time'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 12px', fontSize:'11px', fontWeight:'700', color:'#999', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {orders.slice(0,8).map(o => (
                      <tr key={o.id} style={{ borderBottom:'1px solid #f5f5f5', cursor:'pointer' }} onClick={() => openOrder(o)}>
                        <td style={{ padding:'12px', fontWeight:'700', fontSize:'13px', color:'#e53935' }}>#{o.order_number}</td>
                        <td style={{ padding:'12px', fontSize:'13px' }}>{o.full_name}</td>
                        <td style={{ padding:'12px', fontWeight:'700' }}>₹{o.final_amount}</td>
                        <td style={{ padding:'12px', fontSize:'12px', textTransform:'uppercase' }}>{o.payment_method}</td>
                        <td style={{ padding:'12px' }}>
                          <span style={{ background:`${getStatusColor(o.status)}18`, color:getStatusColor(o.status), padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', textTransform:'capitalize' }}>{o.status}</span>
                        </td>
                        <td style={{ padding:'12px', fontSize:'12px', color:'#666' }}>{formatDateTime(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS ===== */}
          {tab === 'products' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{ fontSize:'22px', fontWeight:'800' }}>Products ({products.length})</h2>
                <button onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); setShowProductModal(true) }}
                  style={{ background:'#e53935', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>
              <div style={{ background:'white', borderRadius:'12px', border:'1px solid #f0f0f0', overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8f8f8', borderBottom:'2px solid #f0f0f0' }}>
                      {['Product','Img','Category','MRP','Price','Off','Stock','Status','Actions'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'12px 14px', fontSize:'11px', fontWeight:'700', color:'#666', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map(p => {
                        const disc = Math.round(((p.mrp - p.sale_price) / p.mrp) * 100)
                        return (
                          <tr key={p.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                            <td style={{ padding:'12px 14px', maxWidth:'180px' }}>
                              <div style={{ fontSize:'13px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'180px' }}>{p.name}</div>
                              <div style={{ display:'flex', gap:'3px', marginTop:'3px' }}>
                                {p.is_trending && <span style={{ background:'#fff3e0', color:'#e65100', padding:'1px 5px', borderRadius:'3px', fontSize:'9px', fontWeight:'700' }}>HOT</span>}
                                {p.is_featured && <span style={{ background:'#e8f5e9', color:'#2e7d32', padding:'1px 5px', borderRadius:'3px', fontSize:'9px', fontWeight:'700' }}>FEAT</span>}
                                {p.is_new_arrival && <span style={{ background:'#e3f2fd', color:'#1565c0', padding:'1px 5px', borderRadius:'3px', fontSize:'9px', fontWeight:'700' }}>NEW</span>}
                              </div>
                            </td>
                            <td style={{ padding:'12px 14px' }}>
                              {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width:'44px', height:'44px', objectFit:'contain', borderRadius:'6px', border:'1px solid #f0f0f0' }} />
                                : <div style={{ width:'44px', height:'44px', background:'#f5f5f5', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🛍️</div>}
                            </td>
                            <td style={{ padding:'12px 14px', fontSize:'12px', color:'#666' }}>{p.categories?.name}</td>
                            <td style={{ padding:'12px 14px', fontSize:'12px', color:'#999', textDecoration:'line-through' }}>₹{p.mrp}</td>
                            <td style={{ padding:'12px 14px', fontSize:'14px', fontWeight:'700', color:'#e53935' }}>₹{p.sale_price}</td>
                            <td style={{ padding:'12px 14px' }}><span style={{ background:'#ffebee', color:'#e53935', padding:'2px 6px', borderRadius:'4px', fontSize:'11px', fontWeight:'700' }}>{disc}%</span></td>
                            <td style={{ padding:'12px 14px', fontSize:'13px', fontWeight: p.stock < 10 ? '700' : '400', color: p.stock < 10 ? '#e53935' : '#333' }}>{p.stock}</td>
                            <td style={{ padding:'12px 14px' }}>
                              <button onClick={async () => { await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id); fetchAll() }}
                                style={{ background: p.is_active ? '#e8f5e9' : '#ffebee', color: p.is_active ? '#2e7d32' : '#e53935', border:'none', padding:'3px 8px', borderRadius:'5px', fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
                                {p.is_active ? 'Active' : 'Hidden'}
                              </button>
                            </td>
                            <td style={{ padding:'12px 14px' }}>
                              <div style={{ display:'flex', gap:'6px' }}>
                                <button onClick={() => editProduct(p)} style={{ background:'#e3f2fd', color:'#1565c0', border:'none', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>✏️</button>
                                <button onClick={() => deleteProduct(p.id)} style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', fontSize:'12px' }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {tab === 'orders' && (
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'20px' }}>Orders ({orders.length})</h2>
              <div style={{ background:'white', borderRadius:'12px', border:'1px solid #f0f0f0', overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8f8f8', borderBottom:'2px solid #f0f0f0' }}>
                      {['Order #','Customer','Phone','City','Amount','Payment','Tracking','Status','Date & Time','Actions'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'11px', fontWeight:'700', color:'#666', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                          <td style={{ padding:'12px 14px', fontWeight:'700', fontSize:'12px', color:'#e53935' }}>#{o.order_number}</td>
                          <td style={{ padding:'12px 14px', fontSize:'13px' }}>{o.full_name}</td>
                          <td style={{ padding:'12px 14px', fontSize:'12px', color:'#666' }}>{o.phone}</td>
                          <td style={{ padding:'12px 14px', fontSize:'12px', color:'#666' }}>{o.city}</td>
                          <td style={{ padding:'12px 14px', fontWeight:'700', color:'#e53935' }}>₹{o.final_amount}</td>
                          <td style={{ padding:'12px 14px', fontSize:'11px', textTransform:'uppercase', fontWeight:'600' }}>{o.payment_method}</td>
                          <td style={{ padding:'12px 14px', fontSize:'11px' }}>
                            {o.tracking_number ? <span style={{ background:'#e3f2fd', color:'#1565c0', padding:'2px 8px', borderRadius:'4px', fontWeight:'700', fontSize:'11px' }}>{o.tracking_number}</span> : <span style={{ color:'#ccc' }}>—</span>}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ background:`${getStatusColor(o.status)}18`, color:getStatusColor(o.status), padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', textTransform:'capitalize', whiteSpace:'nowrap' }}>{o.status}</span>
                          </td>
                          <td style={{ padding:'12px 14px', fontSize:'11px', color:'#666', whiteSpace:'nowrap' }}>{formatDateTime(o.created_at)}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <button onClick={() => openOrder(o)} style={{ background:'#e53935', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'700' }}>
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:'48px', color:'#999' }}>No orders yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== CATEGORIES ===== */}
          {tab === 'categories' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{ fontSize:'22px', fontWeight:'800' }}>Categories</h2>
                <button onClick={() => { setEditingCategory(null); setCategoryForm({ name:'', slug:'', description:'', is_active:true }); setShowCategoryModal(true) }}
                  style={{ background:'#e53935', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Plus size={16} /> Add Category
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                      <div style={{ fontWeight:'800', fontSize:'16px' }}>{cat.name}</div>
                      <span style={{ background: cat.is_active !== false ? '#e8f5e9' : '#ffebee', color: cat.is_active !== false ? '#2e7d32' : '#e53935', padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>
                        {cat.is_active !== false ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div style={{ fontSize:'12px', color:'#999', marginBottom:'8px' }}>/{cat.slug}</div>
                    {cat.description && <p style={{ fontSize:'12px', color:'#666', marginBottom:'12px' }}>{cat.description}</p>}
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name:cat.name, slug:cat.slug, description:cat.description||'', image_url:cat.image_url||'', is_active:cat.is_active!==false }); setShowCategoryModal(true) }}
                        style={{ flex:1, background:'#e3f2fd', color:'#1565c0', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>✏️ Edit</button>
                      <button onClick={async () => { await supabase.from('categories').update({ is_active: cat.is_active===false }).eq('id', cat.id); fetchAll() }}
                        style={{ flex:1, background: cat.is_active!==false ? '#fff3e0' : '#e8f5e9', color: cat.is_active!==false ? '#e65100' : '#2e7d32', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                        {cat.is_active!==false ? '🚫 Hide' : '✅ Show'}
                      </button>
                      <button onClick={async () => { if (!confirm('Delete?')) return; const {error} = await supabase.from('categories').delete().eq('id', cat.id); if(!error){toast.success('Deleted');fetchAll()}else toast.error('Has products') }}
                        style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'8px 12px', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== HERO BANNERS ===== */}
          {tab === 'banners' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <div>
                  <h2 style={{ fontSize:'22px', fontWeight:'800' }}>Hero Banners</h2>
                  <p style={{ color:'#999', fontSize:'13px', marginTop:'4px' }}>Manage homepage carousel banners</p>
                </div>
                <button onClick={() => { setEditingBanner(null); setBannerForm({ title:'', subtitle:'', description:'', badge_text:'', cta_text:'Shop Now', cta_link:'/collections/all', bg_gradient:'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)', text_color:'#ffffff', button_color:'#ffffff', button_text_color:'#e53935', emoji:'⚡', sort_order:heroBanners.length+1, is_active:true }); setShowBannerModal(true) }}
                  style={{ background:'#e53935', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Plus size={16} /> Add Banner
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'16px' }}>
                {heroBanners.map(b => (
                  <div key={b.id} style={{ borderRadius:'16px', overflow:'hidden', border:'1px solid #f0f0f0' }}>
                    {/* Banner Preview */}
                    <div style={{ background:b.bg_gradient, padding:'24px', position:'relative', minHeight:'120px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          {b.badge_text && <span style={{ background:'rgba(255,255,255,0.2)', color:b.text_color||'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{b.badge_text}</span>}
                          <div style={{ color:b.text_color||'#fff', fontSize:'22px', fontWeight:'900', marginTop:'8px', lineHeight:'1.2' }}>{b.title}</div>
                          <div style={{ color:b.text_color||'#fff', fontSize:'16px', opacity:0.85, marginTop:'2px' }}>{b.subtitle}</div>
                        </div>
                        <span style={{ fontSize:'48px' }}>{b.emoji}</span>
                      </div>
                      <div style={{ position:'absolute', top:'8px', right:'8px' }}>
                        <span style={{ background: b.is_active ? 'rgba(46,125,50,0.9)' : 'rgba(198,40,40,0.9)', color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:'700' }}>
                          {b.is_active ? '● ACTIVE' : '● HIDDEN'}
                        </span>
                      </div>
                    </div>
                    {/* Controls */}
                    <div style={{ background:'white', padding:'12px', display:'flex', gap:'8px' }}>
                      <button onClick={() => { setEditingBanner(b); setBannerForm({ title:b.title, subtitle:b.subtitle||'', description:b.description||'', badge_text:b.badge_text||'', cta_text:b.cta_text, cta_link:b.cta_link, bg_gradient:b.bg_gradient, text_color:b.text_color||'#ffffff', button_color:b.button_color||'#ffffff', button_text_color:b.button_text_color||'#e53935', emoji:b.emoji||'⚡', sort_order:b.sort_order, is_active:b.is_active }); setShowBannerModal(true) }}
                        style={{ flex:1, background:'#e3f2fd', color:'#1565c0', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>✏️ Edit</button>
                      <button onClick={async () => { await supabase.from('hero_banners').update({ is_active: !b.is_active }).eq('id', b.id); fetchAll() }}
                        style={{ flex:1, background: b.is_active ? '#fff3e0' : '#e8f5e9', color: b.is_active ? '#e65100' : '#2e7d32', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                        {b.is_active ? '🚫 Hide' : '✅ Show'}
                      </button>
                      <button onClick={async () => { if(!confirm('Delete banner?')) return; await supabase.from('hero_banners').delete().eq('id', b.id); fetchAll() }}
                        style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'8px 12px', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SOCIAL LINKS ===== */}
          {tab === 'social' && (
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'8px' }}>Social Media Links</h2>
              <p style={{ color:'#999', fontSize:'13px', marginBottom:'20px' }}>Update links — changes appear in footer immediately.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
                {socialLinks.map(link => (
                  <div key={link.id} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                      <span style={{ fontSize:'24px' }}>{link.icon}</span>
                      <div style={{ fontWeight:'700', fontSize:'15px', flex:1 }}>{link.platform}</div>
                      <button onClick={async () => { await supabase.from('social_links').update({ is_active: !link.is_active }).eq('id', link.id); fetchAll() }}
                        style={{ background: link.is_active ? '#e8f5e9' : '#ffebee', color: link.is_active ? '#2e7d32' : '#e53935', border:'none', padding:'3px 8px', borderRadius:'5px', fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
                        {link.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </div>
                    <input id={`sl-${link.id}`} defaultValue={link.url} style={{ ...inp, fontSize:'13px', padding:'8px 10px', marginBottom:'8px' }} placeholder={`https://${link.platform.toLowerCase()}.com`} />
                    <button onClick={() => saveSocialLink(link.id, document.getElementById(`sl-${link.id}`).value)}
                      style={{ width:'100%', background:'#e53935', color:'white', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>💾 Save</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SITE SETTINGS ===== */}
          {tab === 'settings' && (
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'8px' }}>Site Settings</h2>
              <p style={{ color:'#999', fontSize:'13px', marginBottom:'20px' }}>Edit website content and contact details.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'16px' }}>
                {siteSettings.map(s => (
                  <div key={s.id} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0' }}>
                    <label style={{ fontSize:'11px', fontWeight:'700', color:'#555', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</label>
                    {(s.value?.length || 0) > 60
                      ? <textarea id={`s-${s.key}`} defaultValue={s.value} rows={3} style={{ ...inp, resize:'vertical', fontSize:'13px' }} />
                      : <input id={`s-${s.key}`} defaultValue={s.value} style={{ ...inp, fontSize:'13px' }} />
                    }
                    <button onClick={() => saveSetting(s.key, document.getElementById(`s-${s.key}`).value)}
                      style={{ width:'100%', background:'#e53935', color:'white', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', marginTop:'8px' }}>💾 Save</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TRUST STRIP ===== */}
{tab === 'trust' && (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
      <div>
        <h2 style={{ fontSize:'22px', fontWeight:'800' }}>Trust Strip</h2>
        <p style={{ color:'#999', fontSize:'13px', marginTop:'4px' }}>Manage the feature badges shown below the hero banner</p>
      </div>
      <button onClick={async () => {
        const { error } = await supabase.from('trust_strips').insert({ title:'New Feature', subtitle:'Description', icon_svg:'star', sort_order: trustStrips.length + 1 })
        if (!error) { toast.success('Added!'); fetchAll() } else toast.error(error.message)
      }} style={{ background:'#e53935', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
        <Plus size={16} /> Add Block
      </button>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
      {trustStrips.map(strip => (
        <div key={strip.id} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'40px', height:'40px', background: strip.bg_color || '#fff5f5', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>
                🛡️
              </div>
              <div>
                <div style={{ fontWeight:'700', fontSize:'15px' }}>{strip.title}</div>
                <div style={{ fontSize:'12px', color:'#999' }}>{strip.subtitle}</div>
              </div>
            </div>
            <button onClick={async () => { await supabase.from('trust_strips').update({ is_active: !strip.is_active }).eq('id', strip.id); fetchAll() }}
              style={{ background: strip.is_active ? '#e8f5e9' : '#ffebee', color: strip.is_active ? '#2e7d32' : '#e53935', border:'none', padding:'3px 8px', borderRadius:'5px', fontSize:'11px', fontWeight:'700', cursor:'pointer' }}>
              {strip.is_active ? 'Active' : 'Hidden'}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <div>
              <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', display:'block', marginBottom:'3px' }}>TITLE</label>
              <input id={`ts-title-${strip.id}`} defaultValue={strip.title} style={{ ...inp, fontSize:'13px', padding:'8px 10px' }} />
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', display:'block', marginBottom:'3px' }}>SUBTITLE</label>
              <input id={`ts-sub-${strip.id}`} defaultValue={strip.subtitle || ''} style={{ ...inp, fontSize:'13px', padding:'8px 10px' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div>
                <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', display:'block', marginBottom:'3px' }}>ICON COLOR</label>
                <div style={{ display:'flex', gap:'6px' }}>
                  <input type="color" id={`ts-color-${strip.id}`} defaultValue={strip.icon_color || '#e53935'} style={{ width:'36px', height:'34px', border:'1px solid #e0e0e0', borderRadius:'6px', cursor:'pointer', padding:'2px' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', display:'block', marginBottom:'3px' }}>ORDER</label>
                <input type="number" id={`ts-order-${strip.id}`} defaultValue={strip.sort_order} style={{ ...inp, fontSize:'13px', padding:'8px 10px' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={async () => {
                await supabase.from('trust_strips').update({
                  title: document.getElementById(`ts-title-${strip.id}`).value,
                  subtitle: document.getElementById(`ts-sub-${strip.id}`).value,
                  icon_color: document.getElementById(`ts-color-${strip.id}`).value,
                  sort_order: parseInt(document.getElementById(`ts-order-${strip.id}`).value) || 0
                }).eq('id', strip.id)
                toast.success('Saved!'); fetchAll()
              }} style={{ flex:1, background:'#e53935', color:'white', border:'none', padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>💾 Save</button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('trust_strips').delete().eq('id', strip.id); fetchAll() }}
                style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* ===== REVIEWS MODERATION ===== */}
{tab === 'reviews' && (
  <div>
    <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'20px' }}>Reviews Moderation ({allReviews.length})</h2>
    <div style={{ background:'white', borderRadius:'12px', border:'1px solid #f0f0f0', overflow:'hidden' }}>
      {allReviews.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#999' }}>No reviews yet</div>
      ) : allReviews.map(review => (
        <div key={review.id} style={{ padding:'16px 20px', borderBottom:'1px solid #f5f5f5', display:'flex', gap:'16px', alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap', marginBottom:'6px' }}>
              <span style={{ fontWeight:'700', fontSize:'14px' }}>{review.user_name || review.profiles?.full_name || 'Customer'}</span>
              <div style={{ display:'flex', gap:'2px' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= review.rating ? '#ff6f00' : '#ddd', fontSize:'14px' }}>★</span>)}
              </div>
              <span style={{ background: review.is_approved ? '#e8f5e9' : review.is_hidden ? '#ffebee' : '#fff3e0', color: review.is_approved ? '#2e7d32' : review.is_hidden ? '#e53935' : '#e65100', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700' }}>
                {review.is_approved ? 'Approved' : review.is_hidden ? 'Hidden' : 'Pending'}
              </span>
              <span style={{ fontSize:'11px', color:'#999' }}>{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <p style={{ color:'#555', fontSize:'13px', lineHeight:'1.6' }}>{review.comment}</p>
          </div>
          <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
            {!review.is_approved && !review.is_hidden && (
              <button onClick={async () => { await supabase.from('reviews').update({ is_approved: true }).eq('id', review.id); fetchAll() }}
                style={{ background:'#e8f5e9', color:'#2e7d32', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>✅ Approve</button>
            )}
            {review.is_approved && (
              <button onClick={async () => { await supabase.from('reviews').update({ is_approved: false }).eq('id', review.id); fetchAll() }}
                style={{ background:'#fff3e0', color:'#e65100', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>↩️ Unapprove</button>
            )}
            <button onClick={async () => { await supabase.from('reviews').update({ is_hidden: !review.is_hidden, is_approved: false }).eq('id', review.id); fetchAll() }}
              style={{ background: review.is_hidden ? '#e8f5e9' : '#ffebee', color: review.is_hidden ? '#2e7d32' : '#e53935', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
              {review.is_hidden ? '👁️ Show' : '🚫 Hide'}
            </button>
            <button onClick={async () => { if (!confirm('Delete review?')) return; await supabase.from('reviews').delete().eq('id', review.id); fetchAll() }}
              style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'6px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          {/* ===== REPORTS ===== */}
          {tab === 'reports' && (
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'20px' }}>Reports & Analytics</h2>

              {/* Filters */}
              <div style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #f0f0f0', marginBottom:'20px' }}>
                <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'12px' }}>🔍 Filters</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'12px', alignItems:'end' }}>
                  <div>
                    <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>From Date</label>
                    <input type="date" value={reportFilter.from} onChange={e => setReportFilter(f => ({ ...f, from: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>To Date</label>
                    <input type="date" value={reportFilter.to} onChange={e => setReportFilter(f => ({ ...f, to: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Status</label>
                    <select value={reportFilter.status} onChange={e => setReportFilter(f => ({ ...f, status: e.target.value }))} style={{ ...inp, cursor:'pointer' }}>
                      <option value="all">All Status</option>
                      {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setReportFilter({ from:'', to:'', status:'all', category:'all' })}
                    style={{ background:'#f5f5f5', border:'1px solid #e0e0e0', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                    Clear Filters
                  </button>
                  <button onClick={exportCSV}
                    style={{ background:'#2e7d32', color:'white', border:'none', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'14px', marginBottom:'20px' }}>
                {[
                  { label:'Filtered Orders', value:filteredOrders.length, color:'#1565c0' },
                  { label:'Total Revenue', value:`₹${filteredOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.final_amount||0),0).toLocaleString()}`, color:'#2e7d32' },
                  { label:'Cancelled', value:filteredOrders.filter(o=>o.status==='cancelled').length, color:'#c62828' },
                  { label:'Delivered', value:filteredOrders.filter(o=>o.status==='delivered').length, color:'#2e7d32' },
                  { label:'Shipped', value:filteredOrders.filter(o=>o.status==='shipped').length, color:'#0288d1' },
                  { label:'Pending', value:filteredOrders.filter(o=>o.status==='pending').length, color:'#e65100' },
                ].map((s,i) => (
                  <div key={i} style={{ background:'white', borderRadius:'10px', padding:'16px', border:`2px solid ${s.color}20`, borderTop:`3px solid ${s.color}` }}>
                    <div style={{ fontSize:'11px', color:'#999', fontWeight:'600', textTransform:'uppercase', marginBottom:'6px' }}>{s.label}</div>
                    <div style={{ fontSize:'22px', fontWeight:'900', color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Orders Table */}
              <div style={{ background:'white', borderRadius:'12px', border:'1px solid #f0f0f0', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:'700', fontSize:'15px' }}>Orders ({filteredOrders.length})</div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8f8f8', borderBottom:'2px solid #f0f0f0' }}>
                      {['Order #','Customer','City','Amount','Method','Status','Date & Time'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'11px', fontWeight:'700', color:'#666', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                          <td style={{ padding:'10px 14px', fontWeight:'700', fontSize:'12px', color:'#e53935' }}>#{o.order_number}</td>
                          <td style={{ padding:'10px 14px', fontSize:'13px' }}>{o.full_name}</td>
                          <td style={{ padding:'10px 14px', fontSize:'12px', color:'#666' }}>{o.city}</td>
                          <td style={{ padding:'10px 14px', fontWeight:'700' }}>₹{o.final_amount}</td>
                          <td style={{ padding:'10px 14px', fontSize:'11px', textTransform:'uppercase' }}>{o.payment_method}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:`${getStatusColor(o.status)}18`, color:getStatusColor(o.status), padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', textTransform:'capitalize' }}>{o.status}</span>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:'11px', color:'#666', whiteSpace:'nowrap' }}>{formatDateTime(o.created_at)}</td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:'32px', color:'#999' }}>No orders match your filters</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== ORDER DETAIL MODAL ===== */}
      {showOrderModal && selectedOrder && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'700px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:'800' }}>Order #{selectedOrder.order_number}</h2>
                <div style={{ fontSize:'13px', color:'#999', marginTop:'2px' }}>Placed on {formatDateTime(selectedOrder.created_at)}</div>
              </div>
              <button onClick={() => setShowOrderModal(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24} /></button>
            </div>

            {/* Customer Info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
              <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'8px', color:'#555' }}>👤 CUSTOMER</div>
                <div style={{ fontWeight:'700', fontSize:'15px' }}>{selectedOrder.full_name}</div>
                <div style={{ fontSize:'13px', color:'#666', marginTop:'4px' }}>📞 {selectedOrder.phone}</div>
              </div>
              <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'8px', color:'#555' }}>📍 DELIVERY ADDRESS</div>
                <div style={{ fontSize:'13px', color:'#333', lineHeight:'1.6' }}>
                  {selectedOrder.address_line1}{selectedOrder.address_line2 ? ', ' + selectedOrder.address_line2 : ''}<br/>
                  {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                </div>
              </div>
            </div>

            {/* Order Status Update */}
            <div style={{ background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
              <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'12px', color:'#e53935' }}>🔄 Update Order Status</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Status</label>
                  <select value={selectedOrder.new_status || selectedOrder.status}
                    onChange={e => setSelectedOrder(o => ({ ...o, new_status: e.target.value }))}
                    style={{ ...inp, cursor:'pointer' }}>
                    {['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Courier Name</label>
                  <input value={selectedOrder.new_courier || ''}
                    onChange={e => setSelectedOrder(o => ({ ...o, new_courier: e.target.value }))}
                    placeholder="e.g. DTDC, BlueDart, Delhivery" style={inp} />
                </div>
              </div>

              {/* Tracking Number — shows when status is shipped */}
              {(selectedOrder.new_status === 'shipped' || selectedOrder.new_status === 'out_for_delivery') && (
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>
                    🚚 Tracking Number / AWB Number *
                  </label>
                  <input value={selectedOrder.new_tracking || ''}
                    onChange={e => setSelectedOrder(o => ({ ...o, new_tracking: e.target.value }))}
                    placeholder="e.g. TRK123456789 or AWB987654321"
                    style={{ ...inp, border:'2px solid #e53935', fontWeight:'700', fontSize:'15px' }} />
                  <div style={{ fontSize:'11px', color:'#e65100', marginTop:'4px', fontWeight:'600' }}>
                    ⚡ Customer will receive SMS + Email with this tracking number
                  </div>
                </div>
              )}

              <button onClick={updateOrderStatus}
                style={{ width:'100%', background:'#e53935', color:'white', border:'none', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
                ✅ Save & Notify Customer
              </button>
            </div>

            {/* Order Timeline */}
            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'12px' }}>📋 Order Timeline</div>
              {orderHistory.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px', color:'#999', fontSize:'13px' }}>No history yet</div>
              ) : (
                <div style={{ position:'relative' }}>
                  {orderHistory.map((h, i) => (
                    <div key={h.id} style={{ display:'flex', gap:'12px', marginBottom:'16px', position:'relative' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: i === orderHistory.length - 1 ? '#e53935' : '#e8f5e9', border:`2px solid ${i === orderHistory.length - 1 ? '#e53935' : '#2e7d32'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>
                          {h.status === 'delivered' ? '✅' : h.status === 'shipped' ? '🚚' : h.status === 'cancelled' ? '❌' : h.status === 'packed' ? '📦' : h.status === 'processing' ? '⚙️' : h.status === 'out_for_delivery' ? '🏃' : '📋'}
                        </div>
                        {i < orderHistory.length - 1 && <div style={{ width:'2px', flex:1, background:'#e0e0e0', margin:'4px 0' }} />}
                      </div>
                      <div style={{ flex:1, paddingBottom:'8px' }}>
                        <div style={{ fontWeight:'700', fontSize:'14px', textTransform:'capitalize', color: i === orderHistory.length - 1 ? '#e53935' : '#1a1a1a' }}>
                          {h.status.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </div>
                        {h.remarks && <div style={{ fontSize:'12px', color:'#666', marginTop:'2px' }}>{h.remarks}</div>}
                        {h.tracking_number && (
                          <div style={{ fontSize:'12px', color:'#1565c0', fontWeight:'600', marginTop:'2px' }}>
                            🔍 Tracking: {h.tracking_number}
                          </div>
                        )}
                        <div style={{ fontSize:'11px', color:'#999', marginTop:'4px' }}>{formatDateTime(h.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
              <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'10px', color:'#555' }}>💰 PAYMENT SUMMARY</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'13px' }}>
                <span style={{ color:'#666' }}>Subtotal</span><span>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'13px' }}>
                <span style={{ color:'#666' }}>Shipping</span><span style={{ color: selectedOrder.shipping_amount === 0 ? '#2e7d32' : '#333' }}>{selectedOrder.shipping_amount === 0 ? 'FREE' : `₹${selectedOrder.shipping_amount}`}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'13px' }}>
                  <span style={{ color:'#666' }}>Discount</span><span style={{ color:'#2e7d32' }}>-₹{selectedOrder.discount_amount}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'800', fontSize:'16px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #e0e0e0' }}>
                <span>Total</span><span style={{ color:'#e53935' }}>₹{selectedOrder.final_amount}</span>
              </div>
              <div style={{ fontSize:'12px', color:'#666', marginTop:'8px' }}>
                Payment: <strong>{selectedOrder.payment_method?.toUpperCase()}</strong> | Status: <strong style={{ color: selectedOrder.payment_status === 'paid' ? '#2e7d32' : '#e65100' }}>{selectedOrder.payment_status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT MODAL ===== */}
      {showProductModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'680px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'20px', fontWeight:'800' }}>{editingProduct ? '✏️ Edit Product' : '➕ Add Product'}</h2>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null) }} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Product Name *</label>
                <input name="name" value={productForm.name} onChange={handleProductChange} placeholder="Product name" style={inp}
                  onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>URL Slug</label>
                <input name="slug" value={productForm.slug} onChange={handleProductChange} style={{ ...inp, background:'#f8f8f8' }} />
              </div>
              <ImageUpload images={productForm.images || []} onChange={imgs => setProductForm(p => ({ ...p, images: imgs }))} />
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Description</label>
                <textarea name="description" value={productForm.description} onChange={handleProductChange} rows={3} style={{ ...inp, resize:'vertical' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>MRP (₹) *</label>
                  <input name="mrp" value={productForm.mrp} onChange={handleProductChange} type="number" style={inp}
                    onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Sale Price (₹) *</label>
                  <input name="sale_price" value={productForm.sale_price} onChange={handleProductChange} type="number" style={inp}
                    onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>
              {productForm.mrp && productForm.sale_price && +productForm.mrp > 0 && (
                <div style={{ background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#e53935', fontWeight:'600' }}>
                  💡 {Math.round(((+productForm.mrp - +productForm.sale_price) / +productForm.mrp) * 100)}% OFF — Save ₹{Math.max(0, +productForm.mrp - +productForm.sale_price).toFixed(0)}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Category *</label>
                  <select name="category_id" value={productForm.category_id} onChange={handleProductChange} style={{ ...inp, cursor:'pointer' }}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Stock</label>
                  <input name="stock" value={productForm.stock} onChange={handleProductChange} type="number" style={inp}
                    onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>
              {/* Return Policy */}
<div>
  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>↩️ Return Policy</label>
  <select name="return_policy" value={productForm.return_policy || '7_days'} onChange={handleProductChange} style={{ ...inp, cursor:'pointer' }}>
    <option value="no_return">❌ No Return</option>
    <option value="7_days">7 Days Return</option>
    <option value="10_days">10 Days Return</option>
    <option value="30_days">30 Days Return</option>
  </select>
</div>
              <div style={{ background:'#f8f8f8', borderRadius:'10px', padding:'14px' }}>
                <label style={{ fontSize:'12px', fontWeight:'700', color:'#555', display:'block', marginBottom:'8px' }}>⏰ Discount Timer</label>
                <select name="discount_timer_hours" value={productForm.discount_timer_hours} onChange={handleProductChange} style={{ ...inp, background:'white', cursor:'pointer' }}>
                  <option value="">No timer</option>
                  {[1,4,12,24,48,72].map(h => <option key={h} value={h}>{h} Hour{h>1?'s':''}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                {[{ name:'is_featured', label:'⭐ Featured' },{ name:'is_trending', label:'🔥 Trending' },{ name:'is_new_arrival', label:'🆕 New Arrival' },{ name:'is_active', label:'✅ Active' }].map(opt => (
                  <label key={opt.name} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'10px', background: productForm[opt.name] ? '#fff5f5' : '#f8f8f8', borderRadius:'8px', border:`1px solid ${productForm[opt.name] ? '#ffcdd2' : '#f0f0f0'}` }}>
                    <input type="checkbox" name={opt.name} checked={productForm[opt.name]} onChange={handleProductChange} style={{ accentColor:'#e53935', width:'16px', height:'16px' }} />
                    <span style={{ fontSize:'13px', fontWeight:'600' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              <button onClick={saveProduct} style={{ background:'#e53935', color:'white', border:'none', padding:'14px', borderRadius:'10px', fontSize:'15px', fontWeight:'800', cursor:'pointer' }}>
                <Save size={16} style={{ display:'inline', marginRight:'8px' }} />
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {showCategoryModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'440px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'20px', fontWeight:'800' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowCategoryModal(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Name *</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} style={inp}
                  onFocus={e => e.target.style.borderColor='#e53935'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Slug</label>
                <input value={categoryForm.slug} onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))} style={{ ...inp, background:'#f8f8f8' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'5px' }}>Description</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize:'vertical' }} />
              </div>
              
 {/* Category Image — URL or direct upload */}
<div>
  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'8px' }}>
    Category Image
  </label>

  {/* Tab toggle — URL vs Upload */}
  <div style={{ display:'flex', background:'#f5f5f5', borderRadius:'8px', padding:'3px', marginBottom:'10px', width:'fit-content' }}>
    {['url', 'upload'].map(mode => (
      <button key={mode} type="button"
        onClick={() => setCategoryForm(f => ({ ...f, _imgMode: mode }))}
        style={{
          padding:'6px 16px', border:'none', cursor:'pointer',
          borderRadius:'6px', fontSize:'12px', fontWeight:'700',
          background: (categoryForm._imgMode || 'url') === mode ? 'white' : 'transparent',
          color: (categoryForm._imgMode || 'url') === mode ? '#e53935' : '#999',
          boxShadow: (categoryForm._imgMode || 'url') === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          transition:'all 0.2s'
        }}>
        {mode === 'url' ? '🔗 Paste URL' : '📁 Upload File'}
      </button>
    ))}
  </div>

  {/* URL Input */}
  {(categoryForm._imgMode || 'url') === 'url' && (
    <input
      value={categoryForm.image_url || ''}
      onChange={e => setCategoryForm(f => ({ ...f, image_url: e.target.value }))}
      placeholder="https://example.com/category-image.jpg"
      style={inp}
      onFocus={e => e.target.style.borderColor='#e53935'}
      onBlur={e => e.target.style.borderColor='#e0e0e0'}
    />
  )}

  {/* File Upload */}
  {(categoryForm._imgMode || 'url') === 'upload' && (
    <div>
      <input
        type="file"
        id="catImageFile"
        accept="image/jpeg,image/png,image/webp"
        style={{ display:'none' }}
        onChange={async (e) => {
          const file = e.target.files[0]
          if (!file) return
          if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }

          // Show uploading state
          setCategoryForm(f => ({ ...f, _uploading: true }))

          try {
            // Try Supabase Storage first
            const fileName = `categories/${Date.now()}-${file.name.replace(/\s/g, '-')}`
            const { data, error } = await supabase.storage
              .from('product-images')
              .upload(fileName, file, { cacheControl: '3600', upsert: false })

            if (!error && data) {
              const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(data.path)
              setCategoryForm(f => ({ ...f, image_url: urlData.publicUrl, _uploading: false }))
              toast.success('✅ Image uploaded!')
            } else {
              // Fallback: convert to base64 for preview
              const reader = new FileReader()
              reader.onload = (ev) => {
                setCategoryForm(f => ({ ...f, image_url: ev.target.result, _uploading: false }))
                toast.success('✅ Image loaded!')
              }
              reader.readAsDataURL(file)
            }
          } catch (err) {
            // Fallback to base64
            const reader = new FileReader()
            reader.onload = (ev) => {
              setCategoryForm(f => ({ ...f, image_url: ev.target.result, _uploading: false }))
              toast.success('✅ Image loaded!')
            }
            reader.readAsDataURL(file)
          }
        }}
      />

      {categoryForm._uploading ? (
        <div style={{ border:'2px dashed #e53935', borderRadius:'10px', padding:'32px', textAlign:'center', background:'#fff5f5' }}>
          <div style={{ fontSize:'24px', marginBottom:'8px' }}>⏳</div>
          <div style={{ fontSize:'13px', color:'#e53935', fontWeight:'600' }}>Uploading image...</div>
        </div>
      ) : (
        <div
          onClick={() => document.getElementById('catImageFile').click()}
          style={{
            border:'2px dashed #e0e0e0', borderRadius:'10px',
            padding:'28px', textAlign:'center', cursor:'pointer',
            background:'#f8f8f8', transition:'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#e53935'; e.currentTarget.style.background='#fff5f5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.background='#f8f8f8' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#e53935'; e.currentTarget.style.background='#fff5f5' }}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.style.borderColor='#e0e0e0'
            e.currentTarget.style.background='#f8f8f8'
            const file = e.dataTransfer.files[0]
            if (file) {
              // Trigger same logic via file input
              const input = document.getElementById('catImageFile')
              const dt = new DataTransfer()
              dt.items.add(file)
              input.files = dt.files
              input.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }}
        >
          <div style={{ fontSize:'32px', marginBottom:'8px' }}>📁</div>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#333', marginBottom:'4px' }}>
            Click to upload or drag & drop
          </div>
          <div style={{ fontSize:'11px', color:'#999' }}>
            JPG, PNG, WEBP — max 5MB
          </div>
        </div>
      )}
    </div>
  )}

  {/* Preview — shown for both modes */}
  {categoryForm.image_url && !categoryForm._uploading && (
    <div style={{
      marginTop:'10px', display:'flex', alignItems:'center',
      gap:'12px', background:'#f8f8f8', padding:'10px 14px',
      borderRadius:'10px', border:'1px solid #e0e0e0'
    }}>
      <img
        src={categoryForm.image_url}
        alt="preview"
        style={{ width:'60px', height:'60px', objectFit:'cover', borderRadius:'8px', border:'1px solid #e0e0e0', flexShrink:0 }}
        onError={e => { e.target.style.display='none' }}
      />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'12px', color:'#2e7d32', fontWeight:'700' }}>✅ Image ready</div>
        <div style={{ fontSize:'11px', color:'#999', marginTop:'2px', wordBreak:'break-all', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {categoryForm.image_url.startsWith('data:') ? 'Uploaded file (base64)' : categoryForm.image_url}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCategoryForm(f => ({ ...f, image_url: '', _imgMode: 'url' }))}
        style={{ background:'#ffebee', color:'#e53935', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>
        ✕ Remove
      </button>
    </div>
  )}
</div>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'10px', background:'#f8f8f8', borderRadius:'8px' }}>
                <input type="checkbox" checked={categoryForm.is_active} onChange={e => setCategoryForm(f => ({ ...f, is_active: e.target.checked }))} style={{ accentColor:'#e53935', width:'16px', height:'16px' }} />
                <span style={{ fontSize:'13px', fontWeight:'600' }}>✅ Active (visible)</span>
              </label>
              <button onClick={saveCategory} style={{ background:'#e53935', color:'white', border:'none', padding:'14px', borderRadius:'10px', fontSize:'15px', fontWeight:'800', cursor:'pointer' }}>
                {editingCategory ? 'Update' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BANNER MODAL ===== */}
      {showBannerModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'20px', fontWeight:'800' }}>{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
              <button onClick={() => setShowBannerModal(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={24} /></button>
            </div>

            {/* Live Preview */}
            <div style={{ background: bannerForm.bg_gradient, borderRadius:'12px', padding:'24px', marginBottom:'20px', color: bannerForm.text_color }}>
              {bannerForm.badge_text && <span style={{ background:'rgba(255,255,255,0.2)', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{bannerForm.badge_text}</span>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }}>
                <div>
                  <div style={{ fontSize:'24px', fontWeight:'900' }}>{bannerForm.title || 'Banner Title'}</div>
                  <div style={{ fontSize:'16px', opacity:0.85 }}>{bannerForm.subtitle || 'Subtitle'}</div>
                  <div style={{ fontSize:'13px', opacity:0.75, marginTop:'4px' }}>{bannerForm.description}</div>
                </div>
                <span style={{ fontSize:'48px' }}>{bannerForm.emoji}</span>
              </div>
              <button style={{ background: bannerForm.button_color, color: bannerForm.button_text_color, border:'none', padding:'8px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', marginTop:'12px', cursor:'default' }}>
                {bannerForm.cta_text}
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Title *</label>
                  <input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} placeholder="Main heading" style={inp} onFocus={e=>e.target.style.borderColor='#e53935'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Subtitle</label>
                  <input value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Under ₹299" style={inp} onFocus={e=>e.target.style.borderColor='#e53935'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Description</label>
                <input value={bannerForm.description} onChange={e => setBannerForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Badge Text</label>
                  <input value={bannerForm.badge_text} onChange={e => setBannerForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="HOT DEALS" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Emoji / Icon</label>
                  <input value={bannerForm.emoji} onChange={e => setBannerForm(f => ({ ...f, emoji: e.target.value }))} placeholder="⚡" style={{ ...inp, fontSize:'20px', textAlign:'center' }} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Button Text</label>
                  <input value={bannerForm.cta_text} onChange={e => setBannerForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="Shop Now" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Button Link</label>
                  <input value={bannerForm.cta_link} onChange={e => setBannerForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="/collections/all" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Background Gradient (CSS)</label>
                <input value={bannerForm.bg_gradient} onChange={e => setBannerForm(f => ({ ...f, bg_gradient: e.target.value }))} style={inp} />
                <div style={{ display:'flex', gap:'6px', marginTop:'6px', flexWrap:'wrap' }}>
                  {[
                    { label:'🔴 Red', val:'linear-gradient(135deg, #e53935 0%, #ff6f00 100%)' },
                    { label:'🔵 Blue', val:'linear-gradient(135deg, #1a237e 0%, #283593 100%)' },
                    { label:'🟢 Green', val:'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)' },
                    { label:'⚫ Dark', val:'linear-gradient(135deg, #212121 0%, #424242 100%)' },
                    { label:'💜 Purple', val:'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)' },
                  ].map(g => (
                    <button key={g.label} onClick={() => setBannerForm(f => ({ ...f, bg_gradient: g.val }))}
                      style={{ padding:'4px 10px', border:'1px solid #e0e0e0', borderRadius:'6px', fontSize:'12px', cursor:'pointer', background: bannerForm.bg_gradient === g.val ? '#fff5f5' : 'white', fontWeight: bannerForm.bg_gradient === g.val ? '700' : '400' }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Text Color</label>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <input type="color" value={bannerForm.text_color} onChange={e => setBannerForm(f => ({ ...f, text_color: e.target.value }))} style={{ width:'40px', height:'36px', border:'1px solid #e0e0e0', borderRadius:'6px', cursor:'pointer', padding:'2px' }} />
                    <input value={bannerForm.text_color} onChange={e => setBannerForm(f => ({ ...f, text_color: e.target.value }))} style={{ ...inp, flex:1 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Button Color</label>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <input type="color" value={bannerForm.button_color} onChange={e => setBannerForm(f => ({ ...f, button_color: e.target.value }))} style={{ width:'40px', height:'36px', border:'1px solid #e0e0e0', borderRadius:'6px', cursor:'pointer', padding:'2px' }} />
                    <input value={bannerForm.button_color} onChange={e => setBannerForm(f => ({ ...f, button_color: e.target.value }))} style={{ ...inp, flex:1 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Btn Text Color</label>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <input type="color" value={bannerForm.button_text_color} onChange={e => setBannerForm(f => ({ ...f, button_text_color: e.target.value }))} style={{ width:'40px', height:'36px', border:'1px solid #e0e0e0', borderRadius:'6px', cursor:'pointer', padding:'2px' }} />
                    <input value={bannerForm.button_text_color} onChange={e => setBannerForm(f => ({ ...f, button_text_color: e.target.value }))} style={{ ...inp, flex:1 }} />
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#555', display:'block', marginBottom:'4px' }}>Sort Order</label>
                  <input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} style={inp} />
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'10px', background: bannerForm.is_active ? '#fff5f5' : '#f8f8f8', borderRadius:'8px', border:`1px solid ${bannerForm.is_active ? '#ffcdd2' : '#f0f0f0'}`, marginTop:'20px' }}>
                  <input type="checkbox" checked={bannerForm.is_active} onChange={e => setBannerForm(f => ({ ...f, is_active: e.target.checked }))} style={{ accentColor:'#e53935', width:'16px', height:'16px' }} />
                  <span style={{ fontSize:'13px', fontWeight:'600' }}>✅ Active</span>
                </label>
              </div>
              <button onClick={saveBanner} style={{ background:'#e53935', color:'white', border:'none', padding:'14px', borderRadius:'10px', fontSize:'15px', fontWeight:'800', cursor:'pointer' }}>
                {editingBanner ? '✏️ Update Banner' : '➕ Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
