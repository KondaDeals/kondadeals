'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState([])
  const [settings, setSettings] = useState({})

  useEffect(() => {
    fetchFooterData()
  }, [])

  const fetchFooterData = async () => {
    const [socialRes, settingsRes] = await Promise.all([
      supabase.from('social_links').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('site_settings').select('*')
    ])
    if (socialRes.data) setSocialLinks(socialRes.data)
    if (settingsRes.data) {
      const map = {}
      settingsRes.data.forEach(s => map[s.key] = s.value)
      setSettings(map)
    }
  }

  const socialIcons = {
    'YouTube': { emoji: '▶️', color: '#FF0000', bg: '#ffebee' },
    'Instagram': { emoji: '📸', color: '#E1306C', bg: '#fce4ec' },
    'Facebook': { emoji: '📘', color: '#1877F2', bg: '#e3f2fd' },
    'Telegram': { emoji: '✈️', color: '#0088CC', bg: '#e1f5fe' },
    'Twitter': { emoji: '🐦', color: '#1DA1F2', bg: '#e3f2fd' },
  }

  return (
    <footer style={{ background: '#1a1a1a', color: 'white', marginTop: '48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>

          {/* Brand */}
          <div>
            {/* Logo — NO color filter applied */}
            <Link href="/">
              <img src="/logo.png" alt="KondaDeals"
                style={{ height: '50px', width: 'auto', objectFit: 'contain', marginBottom: '12px', display: 'block' }}
              />
            </Link>
            <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.8', marginBottom: '20px' }}>
              {settings.footer_tagline || "India's favourite destination for viral gadgets and trending products at unbeatable prices."}
            </p>

            {/* Social Media Icons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {socialLinks.length > 0 ? socialLinks.map(link => {
                const icon = socialIcons[link.platform] || { emoji: '🔗', color: '#666', bg: '#f5f5f5' }
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    title={link.platform}
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: '#333', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px', textDecoration: 'none',
                      transition: 'all 0.2s', cursor: 'pointer'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = icon.bg; e.currentTarget.style.transform = 'scale(1.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {link.icon || icon.emoji}
                  </a>
                )
              }) : (
                // Default social icons if none loaded
                ['▶️', '📸', '📘', '✈️', '🐦'].map((emoji, i) => (
                  <a key={i} href="#"
                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e53935'}
                    onMouseLeave={e => e.currentTarget.style.background = '#333'}
                  >
                    {emoji}
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>QUICK LINKS</h4>
            {[
              { label: 'Home', href: '/' },
              { label: 'All Products', href: '/collections/all' },
              { label: 'Viral Gadgets', href: '/collections/viral-gadgets' },
              { label: 'New Arrivals', href: '/collections/new-arrivals' },
              { label: 'Best Sellers', href: '/collections/best-sellers' },
            ].map(link => (
              <Link key={link.label} href={link.href}
                style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '10px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#e53935'}
                onMouseLeave={e => e.target.style.color = '#aaa'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Customer Service */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>CUSTOMER SERVICE</h4>
            {[
              { label: 'My Account', href: '/account' },
              { label: 'Track Order', href: '/account' },
              { label: 'Return Policy', href: '/' },
              { label: 'Shipping Info', href: '/' },
              { label: 'Contact Us', href: '/' },
            ].map(link => (
              <Link key={link.label} href={link.href}
                style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '10px', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#e53935'}
                onMouseLeave={e => e.target.style.color = '#aaa'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>CONTACT US</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Gmail */}
              <a href={`mailto:${settings.contact_email || 'support@kondadeals.com'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#aaa', fontSize: '13px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EA4335'}
                onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
              >
                <span style={{ width: '32px', height: '32px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📧</span>
                {settings.contact_email || 'support@kondadeals.com'}
              </a>

              {/* WhatsApp */}
              <a href={`https://wa.me/${(settings.contact_phone || '+917816010619').replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#aaa', fontSize: '13px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#25D366'}
                onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
              >
                <span style={{ width: '32px', height: '32px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>💬</span>
                {settings.contact_phone || '+91 78160 10619'}
              </a>

              <div style={{ color: '#666', fontSize: '12px' }}>⏰ Mon-Sat: 9AM - 6PM</div>
            </div>

            {/* Payment methods */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>WE ACCEPT</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['UPI', 'Visa', 'MC', 'COD', 'EMI'].map(pay => (
                  <span key={pay} style={{ background: '#333', color: '#ccc', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                    {pay}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid #333', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ color: '#555', fontSize: '12px' }}>
            © {new Date().getFullYear()} KondaDeals. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(item => (
              <a key={item} href="#" style={{ color: '#555', fontSize: '11px', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#e53935'}
                onMouseLeave={e => e.target.style.color = '#555'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}