'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Package, ShoppingBag, Users, Tag, Plus, Edit, Trash2, X, Save, BarChart3, TrendingUp, IndianRupee } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0 })

 const [productForm, setProductForm] = useState({
  name: '', slug: '', description: '', mrp: '',
  sale_price: '', category_id: '', stock: '',
  image_url: '',
  is_featured: false, is_trending: false, is_new_arrival: false, is_active: true
})

useEffect(() => {
  checkAdmin()
}, [])

const checkAdmin = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      router.push('/login?redirect=/admin')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, full_name')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      console.log('Profile error:', error)
      router.push('/')
      return
    }

    if (!profile.is_admin) {
      alert('Access denied. Admin only.')
      router.push('/')
      return
    }

    setIsAdmin(true)
    setAuthChecked(true)
    fetchAll()
  } catch (err) {
    console.error('Admin check error:', err)
    router.push('/login?redirect=/admin')
  }
}

  const fetchAll = async () => {
    setLoading(true)
    const [prodsRes, ordersRes, catsRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (prodsRes.data) setProducts(prodsRes.data)
    if (ordersRes.data) {
      setOrders(ordersRes.data)
      const revenue = ordersRes.data.reduce((sum, o) => sum + (o.final_amount || 0), 0)
      setStats({
        totalOrders: ordersRes.data.length,
        totalRevenue: revenue,
        totalProducts: prodsRes.data?.length || 0
      })
    }
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
  }

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'name') {
      setProductForm(prev => ({ ...prev, name: value, slug: generateSlug(value) }))
    } else {
      setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.mrp || !productForm.sale_price || !productForm.category_id) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      const data = {
  name: productForm.name,
  slug: productForm.slug || generateSlug(productForm.name),
  description: productForm.description,
  mrp: parseFloat(productForm.mrp),
  sale_price: parseFloat(productForm.sale_price),
  category_id: productForm.category_id,
  stock: parseInt(productForm.stock) || 0,
  images: productForm.image_url ? [productForm.image_url] : [],
  is_featured: productForm.is_featured,
  is_trending: productForm.is_trending,
  is_new_arrival: productForm.is_new_arrival,
  is_active: productForm.is_active,
}
      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id)
        if (error) throw error
        toast.success('Product updated!')
      } else {
        const { error } = await supabase.from('products').insert(data)
        if (error) throw error
        toast.success('Product added!')
      }
      setShowAddProduct(false)
      setEditingProduct(null)
      setProductForm({ name: '', slug: '', description: '', mrp: '', sale_price: '', category_id: '', stock: '', image_url: '', is_featured: false, is_trending: false, is_new_arrival: false, is_active: true })
      fetchAll()
    } catch (err) {
      toast.error(err.message || 'Failed to save product')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
  name: product.name,
  slug: product.slug,
  description: product.description || '',
  mrp: product.mrp,
  sale_price: product.sale_price,
  category_id: product.category_id,
  stock: product.stock,
  image_url: product.images?.[0] || '',
  is_featured: product.is_featured,
  is_trending: product.is_trending,
  is_new_arrival: product.is_new_arrival,
  is_active: product.is_active,
})
    setShowAddProduct(true)
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) { toast.success('Product deleted'); fetchAll() }
    else toast.error('Failed to delete')
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (!error) { toast.success('Order status updated!'); fetchAll() }
    else toast.error('Failed to update')
  }

  const toggleProductActive = async (product) => {
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (!error) { toast.success(product.is_active ? 'Product hidden' : 'Product visible'); fetchAll() }
  }

  const getStatusColor = (status) => {
    const c = { confirmed: '#2e7d32', pending: '#e65100', shipped: '#1565c0', delivered: '#2e7d32', cancelled: '#c62828' }
    return c[status] || '#666'
  }

  const tabStyle = (tab) => ({
    padding: '12px 20px', background: activeTab === tab ? '#e53935' : 'transparent',
    color: activeTab === tab ? 'white' : '#555', border: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center',
    gap: '8px', borderRadius: '8px', transition: 'all 0.2s', width: '100%', textAlign: 'left'
  })

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  }
 
  if (!authChecked) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
        <div style={{ fontSize: '16px', color: '#666' }}>Checking admin access...</div>
      </div>
    </div>
  )
}

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Header */}
      <div style={{ background: '#1a1a1a', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <span style={{ color: '#e53935', fontWeight: '900', fontSize: '18px' }}>KONDA</span>
            <span style={{ color: '#ff6f00', fontWeight: '700', fontSize: '12px', marginLeft: '2px' }}>ADMIN</span>
          </div>
        </div>
        <button onClick={() => router.push('/')}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          ← View Store
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', borderRight: '1px solid #f0f0f0', padding: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
              { id: 'products', label: 'Products', icon: <Package size={16} /> },
              { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
              { id: 'categories', label: 'Categories', icon: <Tag size={16} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px', color: '#1a1a1a' }}>
                Dashboard Overview
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#e8f5e9', iconColor: '#2e7d32' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#e3f2fd', iconColor: '#1565c0' },
                  { label: 'Total Products', value: stats.totalProducts, icon: '🛍️', color: '#fff3e0', iconColor: '#e65100' },
                  { label: 'Categories', value: categories.length, icon: '🏷️', color: '#fce4ec', iconColor: '#c62828' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase' }}>{stat.label}</div>
                      <div style={{ background: stat.color, padding: '8px', borderRadius: '8px', fontSize: '18px' }}>{stat.icon}</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a1a' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Recent Orders */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Recent Orders</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f5f5f5' }}>
                        {['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700' }}>#{order.order_number}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{order.full_name}</td>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: '#e53935' }}>₹{order.final_amount}</td>
                          <td style={{ padding: '12px', fontSize: '13px', textTransform: 'uppercase' }}>{order.payment_method}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status), padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#999' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>No orders yet</div>}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a' }}>
                  Products ({products.length})
                </h2>
                <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', slug: '', description: '', mrp: '', sale_price: '', category_id: '', stock: '', image_url: '', is_featured: false, is_trending: false, is_new_arrival: false, is_active: true }); setShowAddProduct(true) }}
                  style={{ background: '#e53935', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f8f8', borderBottom: '2px solid #f0f0f0' }}>
                        {['Product', 'Category', 'MRP', 'Price', 'Discount', 'Stock', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => {
                        const disc = Math.round(((product.mrp - product.sale_price) / product.mrp) * 100)
                        return (
                          <tr key={product.id} style={{ borderBottom: '1px solid #f5f5f5' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', maxWidth: '200px' }}>
                                {product.name.substring(0, 35)}{product.name.length > 35 ? '...' : ''}
                              </div>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {product.is_trending && <span style={{ background: '#fff3e0', color: '#e65100', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>TRENDING</span>}
                                {product.is_featured && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>FEATURED</span>}
                                {product.is_new_arrival && <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>NEW</span>}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{product.categories?.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>₹{product.mrp}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: '#e53935' }}>₹{product.sale_price}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: '#ffebee', color: '#e53935', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{disc}% OFF</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: product.stock < 10 ? '700' : '500', color: product.stock < 10 ? '#e53935' : '#1a1a1a' }}>
                              {product.stock}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => toggleProductActive(product)}
                                style={{ background: product.is_active ? '#e8f5e9' : '#ffebee', color: product.is_active ? '#2e7d32' : '#e53935', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                {product.is_active ? 'Active' : 'Hidden'}
                              </button>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEditProduct(product)}
                                  style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                                  <Edit size={12} /> Edit
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id)}
                                  style={{ background: '#ffebee', color: '#e53935', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                                  <Trash2 size={12} /> Del
                                </button>
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

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: '#1a1a1a' }}>
                Orders ({orders.length})
              </h2>
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f8f8', borderBottom: '2px solid #f0f0f0' }}>
                        {['Order #', 'Customer', 'Phone', 'City', 'Amount', 'Payment', 'Status', 'Update Status', 'Date'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#666', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700' }}>#{order.order_number}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>{order.full_name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{order.phone}</td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{order.city}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: '#e53935' }}>₹{order.final_amount}</td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600' }}>{order.payment_method}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status), padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <select value={order.status} onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                              style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#999', whiteSpace: 'nowrap' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && <div style={{ textAlign: 'center', padding: '48px', color: '#999', fontSize: '15px' }}>No orders yet</div>}
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {activeTab === 'categories' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: '#1a1a1a' }}>
                Categories ({categories.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a', marginBottom: '4px' }}>{cat.name}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>/{cat.slug}</div>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>{cat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setShowAddProduct(false); setEditingProduct(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Product Name *</label>
                <input name="name" value={productForm.name} onChange={handleProductFormChange}
                  placeholder="Enter product name" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#e53935'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>URL Slug (auto-generated)</label>
                <input name="slug" value={productForm.slug} onChange={handleProductFormChange}
                  placeholder="product-url-slug" style={{ ...inputStyle, background: '#f8f8f8' }}
                />
              </div>
              <div>
  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Product Image URL</label>
  <input name="image_url" value={productForm.image_url || ''} onChange={handleProductFormChange}
    placeholder="https://example.com/image.jpg" style={inputStyle}
    onFocus={e => e.target.style.borderColor = '#e53935'}
    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
  />
  {productForm.image_url && (
    <div style={{ marginTop: '8px', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '8px', background: '#f8f8f8', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img src={productForm.image_url} alt="preview"
        style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '6px' }}
        onError={e => e.target.style.display = 'none'}
      />
      <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>✅ Image preview</span>
    </div>
  )}
  <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
    Paste any image URL. Use Google Images → right click → "Copy image address"
  </p>
</div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea name="description" value={productForm.description} onChange={handleProductFormChange}
                  placeholder="Product description" rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#e53935'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>MRP (₹) *</label>
                  <input name="mrp" value={productForm.mrp} onChange={handleProductFormChange}
                    type="number" placeholder="999" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#e53935'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Sale Price (₹) *</label>
                  <input name="sale_price" value={productForm.sale_price} onChange={handleProductFormChange}
                    type="number" placeholder="499" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#e53935'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Category *</label>
                  <select name="category_id" value={productForm.category_id} onChange={handleProductFormChange}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#e53935'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Stock Quantity</label>
                  <input name="stock" value={productForm.stock} onChange={handleProductFormChange}
                    type="number" placeholder="100" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#e53935'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>

              {productForm.mrp && productForm.sale_price && (
                <div style={{ background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e53935', fontWeight: '600' }}>
                  💡 Discount: {Math.round(((productForm.mrp - productForm.sale_price) / productForm.mrp) * 100)}% OFF — Customer saves ₹{productForm.mrp - productForm.sale_price}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { name: 'is_featured', label: '⭐ Featured Product' },
                  { name: 'is_trending', label: '🔥 Trending' },
                  { name: 'is_new_arrival', label: '🆕 New Arrival' },
                  { name: 'is_active', label: '✅ Active (Visible)' },
                ].map(opt => (
                  <label key={opt.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: productForm[opt.name] ? '#fff5f5' : '#f8f8f8', borderRadius: '8px', border: `1px solid ${productForm[opt.name] ? '#ffcdd2' : '#f0f0f0'}` }}>
                    <input type="checkbox" name={opt.name} checked={productForm[opt.name]} onChange={handleProductFormChange}
                      style={{ accentColor: '#e53935', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{opt.label}</span>
                  </label>
                ))}
              </div>

              <button onClick={handleSaveProduct}
                style={{ background: '#e53935', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <Save size={18} /> {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}