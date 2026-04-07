'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import { Package, ShoppingBag, Tag, Plus, Edit, Trash2, X, Save, BarChart3, Settings, Share2, Clock } from 'lucide-react'

const ADMIN_EMAILS = ['iamkondakirankumarreddy@gmail.com']

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [socialLinks, setSocialLinks] = useState([])
  const [siteSettings, setSiteSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0 })

  const emptyProduct = {
    name: '', slug: '', description: '', mrp: '', sale_price: '',
    category_id: '', stock: '', images: [], discount_timer_hours: '',
    is_featured: false, is_trending: false, is_new_arrival: false, is_active: true
  }
  const [productForm, setProductForm] = useState(emptyProduct)
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', is_active: true })

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
    setLoading(true)
    const [p, o, c, s, sl] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('site_settings').select('*').order('label'),
      supabase.from('social_links').select('*').order('sort_order'),
    ])
    if (p.data) { setProducts(p.data); }
    if (o.data) {
      setOrders(o.data)
      setStats({ totalOrders: o.data.length, totalRevenue: o.data.reduce((s, x) => s + (x.final_amount || 0), 0), totalProducts: p.data?.length || 0 })
    }
    if (c.data) setCategories(c.data)
    if (s.data) setSiteSettings(s.data)
    if (sl.data) setSocialLinks(sl.data)
    setLoading(false)
  }

  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'name') setProductForm(p => ({ ...p, name: value, slug: slug(value) }))
    else setProductForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const saveProduct = async () => {
    if (!productForm.name || !productForm.mrp || !productForm.sale_price || !productForm.category_id) {
      toast.error('Fill all required fields'); return
    }
    const discountEndsAt = productForm.discount_timer_hours
      ? new Date(Date.now() + parseFloat(productForm.discount_timer_hours) * 3600000).toISOString()
      : null

    const data = {
      name: productForm.name,
      slug: productForm.slug || slug(productForm.name),
      description: productForm.description,
      mrp: parseFloat(productForm.mrp),
      sale_price: parseFloat(productForm.sale_price),
      category_id: productForm.category_id,
      stock: parseInt(productForm.stock) || 0,
      images: productForm.images || [],
      discount_ends_at: discountEndsAt,
      discount_timer_hours: productForm.discount_timer_hours ? parseFloat(productForm.discount_timer_hours) : null,
      is_featured: productForm.is_featured,
      is_trending: productForm.is_trending,
      is_new_arrival: productForm.is_new_arrival,
      is_active: productForm.is_active,
    }

    const { error } = editingProduct
      ? await supabase.from('products').update(data).eq('id', editingProduct.id)
      : await supabase.from('products').insert(data)

    if (error) { toast.error('Error: ' + error.message); return }
    toast.success(editingProduct ? 'Product updated!' : 'Product added!')
    setShowProductModal(false)
    setEditingProduct(null)
    setProductForm(emptyProduct)
    fetchAll()
  }

  const editProduct = (p) => {
    setEditingProduct(p)
    setProductForm({
      name: p.name, slug: p.slug, description: p.description || '',
      mrp: p.mrp, sale_price: p.sale_price, category_id: p.category_id,
      stock: p.stock, images: p.images || [],
      discount_timer_hours: p.discount_timer_hours || '',
      is_featured: p.is_featured, is_trending: p.is_trending,
      is_new_arrival: p.is_new_arrival, is_active: p.is_active,
    })
    setShowProductModal(true)
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) { toast.success('Deleted!'); fetchAll() }
    else toast.error('Delete failed: ' + error.message)
  }

  const saveCategory = async () => {
    if (!categoryForm.name) { toast.error('Enter category name'); return }
    const data = { ...categoryForm, slug: categoryForm.slug || slug(categoryForm.name) }
    const { error } = editingCategory
      ? await supabase.from('categories').update(data).eq('id', editingCategory.id)
      : await supabase.from('categories').insert(data)
    if (error) { toast.error('Error: ' + error.message); return }
    toast.success(editingCategory ? 'Category updated!' : 'Category added!')
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', slug: '', description: '', is_active: true })
    fetchAll()
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete category? Products in this category will be uncategorized.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) { toast.success('Deleted!'); fetchAll() }
    else toast.error('Cannot delete: category has products')
  }

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (!error) { toast.success('Status updated!'); fetchAll() }
  }

  const saveSetting = async (key, value) => {
    await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    toast.success('Setting saved!')
  }

  const saveSocialLink = async (id, field, value) => {
    await supabase.from('social_links').update({ [field]: value }).eq('id', id)
    toast.success('Updated!')
    fetchAll()
  }

  const getStatusColor = (s) => ({ confirmed: '#2e7d32', pending: '#e65100', shipped: '#1565c0', delivered: '#2e7d32', cancelled: '#c62828' }[s] || '#666')

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🛒' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'settings', label: 'Site Settings', icon: '⚙️' },
  ]

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '32px' }}>🔐</div><div style={{ color: '#666', marginTop: '8px' }}>Verifying admin access...</div></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1a1a1a', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="KondaDeals" style={{ height: '30px', objectFit: 'contain' }} />
          <span style={{ color: '#ff6f00', fontWeight: '800', fontSize: '13px' }}>ADMIN</span>
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          ← View Store
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '200px', background: 'white', borderRight: '1px solid #f0f0f0', padding: '16px 0', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', padding: '12px 16px', background: activeTab === tab.id ? '#fff5f5' : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: activeTab === tab.id ? '700' : '500',
              color: activeTab === tab.id ? '#e53935' : '#555',
              borderLeft: `3px solid ${activeTab === tab.id ? '#e53935' : 'transparent'}`,
              textAlign: 'left', transition: 'all 0.2s'
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Dashboard</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰' },
                  { label: 'Orders', value: stats.totalOrders, icon: '📦' },
                  { label: 'Products', value: stats.totalProducts, icon: '🛍️' },
                  { label: 'Categories', value: categories.length, icon: '🏷️' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</div>
                      <span style={{ fontSize: '22px' }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Recent Orders</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #f5f5f5' }}>
                      {['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px', fontWeight: '700', fontSize: '13px' }}>#{o.order_number}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{o.full_name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: '#e53935' }}>₹{o.final_amount}</td>
                          <td style={{ padding: '12px', fontSize: '12px', textTransform: 'uppercase' }}>{o.payment_method}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: `${getStatusColor(o.status)}18`, color: getStatusColor(o.status), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>{o.status}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#999' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#999' }}>No orders yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS ===== */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Products ({products.length})</h2>
                <button onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); setShowProductModal(true) }}
                  style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8f8f8', borderBottom: '2px solid #f0f0f0' }}>
                      {['Product', 'Image', 'Category', 'MRP', 'Price', 'Off%', 'Stock', 'Timer', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map(p => {
                        const disc = Math.round(((p.mrp - p.sale_price) / p.mrp) * 100)
                        const timerActive = p.discount_ends_at && new Date(p.discount_ends_at) > new Date()
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '12px 14px', maxWidth: '180px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{p.name}</div>
                              <div style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}>
                                {p.is_trending && <span style={{ background: '#fff3e0', color: '#e65100', padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: '600' }}>HOT</span>}
                                {p.is_featured && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: '600' }}>FEAT</span>}
                                {p.is_new_arrival && <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: '600' }}>NEW</span>}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #f0f0f0' }} />
                              ) : (
                                <div style={{ width: '44px', height: '44px', background: '#f5f5f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛍️</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: '#666' }}>{p.categories?.name}</td>
                            <td style={{ padding: '12px 14px', fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>₹{p.mrp}</td>
                            <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: '#e53935' }}>₹{p.sale_price}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ background: '#ffebee', color: '#e53935', padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: '700' }}>{disc}%</span>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: p.stock < 10 ? '700' : '400', color: p.stock < 10 ? '#e53935' : '#333' }}>{p.stock}</td>
                            <td style={{ padding: '12px 14px' }}>
                              {timerActive ? (
                                <span style={{ background: '#fff3e0', color: '#e65100', padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>⏰ Active</span>
                              ) : (
                                <span style={{ color: '#ccc', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <button onClick={async () => { await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id); fetchAll() }}
                                style={{ background: p.is_active ? '#e8f5e9' : '#ffebee', color: p.is_active ? '#2e7d32' : '#e53935', border: 'none', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                {p.is_active ? 'Active' : 'Hidden'}
                              </button>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => editProduct(p)} style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✏️ Edit</button>
                                <button onClick={() => deleteProduct(p.id)} style={{ background: '#ffebee', color: '#e53935', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🗑️</button>
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
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Orders ({orders.length})</h2>
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8f8f8', borderBottom: '2px solid #f0f0f0' }}>
                      {['Order #', 'Customer', 'Phone', 'City', 'Amount', 'Payment', 'Status', 'Update', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '12px' }}>#{o.order_number}</td>
                          <td style={{ padding: '12px 14px', fontSize: '13px' }}>{o.full_name}</td>
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: '#666' }}>{o.phone}</td>
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: '#666' }}>{o.city}</td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#e53935' }}>₹{o.final_amount}</td>
                          <td style={{ padding: '12px 14px', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>{o.payment_method}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: `${getStatusColor(o.status)}18`, color: getStatusColor(o.status), padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>{o.status}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                              style={{ padding: '5px 8px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '11px', color: '#999' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#999' }}>No orders yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== CATEGORIES ===== */}
          {activeTab === 'categories' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Categories ({categories.length})</h2>
                <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', description: '', is_active: true }); setShowCategoryModal(true) }}
                  style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Category
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '16px' }}>{cat.name}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>/{cat.slug}</div>
                      </div>
                      <span style={{ background: cat.is_active !== false ? '#e8f5e9' : '#ffebee', color: cat.is_active !== false ? '#2e7d32' : '#e53935', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                        {cat.is_active !== false ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    {cat.description && <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px', lineHeight: '1.5' }}>{cat.description}</p>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => {
                        setEditingCategory(cat)
                        setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', is_active: cat.is_active !== false })
                        setShowCategoryModal(true)
                      }} style={{ flex: 1, background: '#e3f2fd', color: '#1565c0', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                      <button onClick={async () => {
                        await supabase.from('categories').update({ is_active: cat.is_active === false }).eq('id', cat.id)
                        toast.success('Updated!'); fetchAll()
                      }} style={{ flex: 1, background: cat.is_active !== false ? '#fff3e0' : '#e8f5e9', color: cat.is_active !== false ? '#e65100' : '#2e7d32', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        {cat.is_active !== false ? '🚫 Hide' : '✅ Show'}
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} style={{ background: '#ffebee', color: '#e53935', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SOCIAL LINKS ===== */}
          {activeTab === 'social' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Social Media Links</h2>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '20px' }}>Update your social media URLs. Changes appear in the footer instantly after save.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {socialLinks.map(link => (
                  <div key={link.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{link.icon}</span>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{link.platform}</div>
                      <button onClick={async () => { await supabase.from('social_links').update({ is_active: !link.is_active }).eq('id', link.id); fetchAll() }}
                        style={{ marginLeft: 'auto', background: link.is_active ? '#e8f5e9' : '#ffebee', color: link.is_active ? '#2e7d32' : '#e53935', border: 'none', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {link.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#999', fontWeight: '600', display: 'block', marginBottom: '4px' }}>URL</label>
                      <input defaultValue={link.url} id={`social-url-${link.id}`}
                        style={{ ...inp, fontSize: '13px', padding: '8px 10px' }}
                        placeholder={`https://${link.platform.toLowerCase()}.com/yourpage`}
                      />
                    </div>
                    <button onClick={() => saveSocialLink(link.id, 'url', document.getElementById(`social-url-${link.id}`).value)}
                      style={{ width: '100%', background: '#e53935', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      💾 Save URL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SITE SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Site Settings</h2>
              <p style={{ color: '#999', fontSize: '13px', marginBottom: '20px' }}>Edit website content, text, and contact details directly from here.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {siteSettings.map(setting => (
                  <div key={setting.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {setting.label}
                    </label>
                    {setting.value?.length > 60 ? (
                      <textarea id={`setting-${setting.key}`} defaultValue={setting.value} rows={3}
                        style={{ ...inp, resize: 'vertical', fontSize: '13px' }}
                      />
                    ) : (
                      <input id={`setting-${setting.key}`} defaultValue={setting.value}
                        style={{ ...inp, fontSize: '13px' }}
                      />
                    )}
                    <button onClick={() => saveSetting(setting.key, document.getElementById(`setting-${setting.key}`).value)}
                      style={{ width: '100%', background: '#e53935', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
                      💾 Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== PRODUCT MODAL ===== */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#666" /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Product Name *</label>
                <input name="name" value={productForm.name} onChange={handleProductChange} placeholder="Enter product name" style={inp}
                  onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
              </div>

              {/* Slug */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>URL Slug</label>
                <input name="slug" value={productForm.slug} onChange={handleProductChange} placeholder="auto-generated" style={{ ...inp, background: '#f8f8f8' }} />
              </div>

              {/* Images */}
              <ImageUpload
                images={productForm.images || []}
                onChange={imgs => setProductForm(p => ({ ...p, images: imgs }))}
              />

              {/* Description */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea name="description" value={productForm.description} onChange={handleProductChange}
                  placeholder="Product description" rows={3} style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
              </div>

              {/* Prices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>MRP (₹) *</label>
                  <input name="mrp" value={productForm.mrp} onChange={handleProductChange} type="number" placeholder="999" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Sale Price (₹) *</label>
                  <input name="sale_price" value={productForm.sale_price} onChange={handleProductChange} type="number" placeholder="499" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>

              {/* Discount preview */}
              {productForm.mrp && productForm.sale_price && parseFloat(productForm.mrp) > 0 && (
                <div style={{ background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e53935', fontWeight: '600' }}>
                  💡 {Math.round(((productForm.mrp - productForm.sale_price) / productForm.mrp) * 100)}% OFF — Customer saves ₹{Math.max(0, productForm.mrp - productForm.sale_price)}
                </div>
              )}

              {/* Category & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Category *</label>
                  <select name="category_id" value={productForm.category_id} onChange={handleProductChange} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Stock Qty</label>
                  <input name="stock" value={productForm.stock} onChange={handleProductChange} type="number" placeholder="100" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>

              {/* Discount Timer */}
              <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '8px' }}>
                  ⏰ Discount Timer (optional)
                </label>
                <select name="discount_timer_hours" value={productForm.discount_timer_hours} onChange={handleProductChange}
                  style={{ ...inp, background: 'white', cursor: 'pointer' }}>
                  <option value="">No timer — regular price</option>
                  <option value="1">1 Hour</option>
                  <option value="4">4 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                  <option value="72">72 Hours</option>
                </select>
                {productForm.discount_timer_hours && (
                  <div style={{ fontSize: '12px', color: '#e65100', marginTop: '6px', fontWeight: '600' }}>
                    ⚡ Timer starts when you save. Deal expires in {productForm.discount_timer_hours} hour(s).
                  </div>
                )}
              </div>

              {/* Flags */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { name: 'is_featured', label: '⭐ Featured Product' },
                  { name: 'is_trending', label: '🔥 Trending' },
                  { name: 'is_new_arrival', label: '🆕 New Arrival' },
                  { name: 'is_active', label: '✅ Active (Visible)' },
                ].map(opt => (
                  <label key={opt.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: productForm[opt.name] ? '#fff5f5' : '#f8f8f8', borderRadius: '8px', border: `1px solid ${productForm[opt.name] ? '#ffcdd2' : '#f0f0f0'}` }}>
                    <input type="checkbox" name={opt.name} checked={productForm[opt.name]} onChange={handleProductChange}
                      style={{ accentColor: '#e53935', width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{opt.label}</span>
                  </label>
                ))}
              </div>

              <button onClick={saveProduct} style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} /> {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingCategory ? '✏️ Edit Category' : '➕ Add Category'}</h2>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Category Name *</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value, slug: slug(e.target.value) }))}
                  placeholder="e.g. Smart Home" style={inp}
                  onFocus={e => e.target.style.borderColor = '#e53935'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Slug (URL)</label>
                <input value={categoryForm.slug} onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="smart-home" style={{ ...inp, background: '#f8f8f8' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Category description" rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
                <input type="checkbox" checked={categoryForm.is_active} onChange={e => setCategoryForm(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ accentColor: '#e53935', width: '16px', height: '16px' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>✅ Active (visible on website)</span>
              </label>
              <button onClick={saveCategory} style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
                {editingCategory ? '✏️ Update Category' : '➕ Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}