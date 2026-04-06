'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useStore from '@/lib/store'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { setUser } = useStore()

  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: ''
  })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (error) {
      toast.error(error.message)
    } else {
      setUser(data.user)
      toast.success('Welcome back! 🎉')
      router.push(redirect)
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.full_name) { toast.error('Please fill all fields'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } }
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Please check your email to verify.')
      setMode('login')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Simple Header */}
      <div style={{ background: 'white', padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#e53935', lineHeight: 1 }}>KONDA</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#ff6f00', letterSpacing: '2px' }}>DEALS</div>
          </div>
        </Link>
        <Link href="/" style={{ textDecoration: 'none', color: '#666', fontSize: '14px' }}>← Back to Home</Link>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#e53935' }}>KONDA</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#ff6f00', letterSpacing: '3px' }}>DEALS</div>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
              {mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account today'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#e53935' : '#999',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            {mode === 'signup' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input name="full_name" value={form.full_name} onChange={handleChange}
                      placeholder="Your full name" type="text"
                      style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Phone (optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+91 98765 43210" type="tel"
                      style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#e53935'}
                      onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" type="email"
                  style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#e53935'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input name="password" value={form.password} onChange={handleChange}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  type={showPass ? 'text' : 'password'}
                  style={{ width: '100%', padding: '12px 40px 12px 36px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#e53935'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: loading ? '#ccc' : '#e53935',
              color: 'white', border: 'none', padding: '14px',
              borderRadius: '10px', fontSize: '15px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '20px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ color: '#e53935', fontWeight: '700', cursor: 'pointer' }}>
              {mode === 'login' ? 'Sign Up Free' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}