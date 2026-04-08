'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// SVG Icons
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const socialSVGIcons = { YouTube: YouTubeIcon, Instagram: InstagramIcon, Facebook: FacebookIcon, Telegram: TelegramIcon, Twitter: TwitterIcon }

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState([])
  const [settings, setSettings] = useState({})

  useEffect(() => { fetchFooterData() }, [])

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

  return (
    <footer style={{ background: '#111827', color: '#d1d5db', marginTop: '48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>

          {/* Brand */}
          <div>
            <Link href="/">
              <img src="/logo.png" alt="KondaDeals"
                style={{ height: '44px', width: 'auto', objectFit: 'contain', marginBottom: '16px', display: 'block' }}
              />
            </Link>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8', marginBottom: '24px' }}>
              {settings.footer_tagline || "India's favourite destination for viral gadgets and trending products at unbeatable prices."}
            </p>

            {/* Social Icons — SVG based */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {socialLinks.length > 0 ? socialLinks.map(link => {
                const IconComponent = socialSVGIcons[link.platform]
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    title={link.platform}
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: '#1f2937',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9ca3af', textDecoration: 'none',
                      transition: 'all 0.2s', cursor: 'pointer', border: '1px solid #374151'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e53935'
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.borderColor = '#e53935'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#1f2937'
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.borderColor = '#374151'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {IconComponent ? <IconComponent /> : <span style={{ fontSize: '16px' }}>{link.icon}</span>}
                  </a>
                )
              }) : (
                [YouTubeIcon, InstagramIcon, FacebookIcon, TelegramIcon, TwitterIcon].map((Icon, i) => (
                  <a key={i} href="#"
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none', border: '1px solid #374151', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e53935'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.color = '#9ca3af' }}
                  >
                    <Icon />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>QUICK LINKS</h4>
            {[
              { label: 'Home', href: '/' },
              { label: 'All Products', href: '/collections/all' },
              { label: 'Viral Gadgets', href: '/collections/viral-gadgets' },
              { label: 'New Arrivals', href: '/collections/new-arrivals' },
              { label: 'Track Your Order', href: '/track' },
            ].map(link => (
              <Link key={link.label} href={link.href}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '13px', marginBottom: '12px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e53935'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Customer Service */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>CUSTOMER SERVICE</h4>
            {[
              { label: 'My Account', href: '/account' },
              { label: 'Track Order', href: '/track' },
              { label: 'Return Policy', href: '/' },
              { label: 'Shipping Info', href: '/' },
              { label: 'Contact Us', href: '/' },
            ].map(link => (
              <Link key={link.label} href={link.href}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '13px', marginBottom: '12px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e53935'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>CONTACT US</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Gmail with SVG */}
              <a href={`mailto:${settings.contact_email || 'support@kondadeals.com'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#9ca3af', fontSize: '13px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EA4335'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <div style={{ width: '36px', height: '36px', background: '#1f2937', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #374151' }}>
                  <MailIcon />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>EMAIL US</div>
                  <div>{settings.contact_email || 'support@kondadeals.com'}</div>
                </div>
              </a>

              {/* WhatsApp with SVG */}
              <a href={`https://wa.me/${(settings.contact_phone || '+917816010619').replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#9ca3af', fontSize: '13px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#25D366'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <div style={{ width: '36px', height: '36px', background: '#1f2937', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #374151' }}>
                  <WhatsAppIcon />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>WHATSAPP</div>
                  <div>{settings.contact_phone || '+91 78160 10619'}</div>
                </div>
              </a>

              {/* Hours with SVG */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9ca3af', fontSize: '13px' }}>
                <div style={{ width: '36px', height: '36px', background: '#1f2937', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #374151' }}>
                  <ClockIcon />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>HOURS</div>
                  <div>Mon–Sat: 9AM – 6PM</div>
                </div>
              </div>
            </div>

            {/* Payment badges */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '10px', letterSpacing: '0.5px' }}>WE ACCEPT</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['UPI', 'Visa', 'MC', 'COD', 'EMI'].map(pay => (
                  <span key={pay} style={{ background: '#1f2937', color: '#d1d5db', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', border: '1px solid #374151' }}>
                    {pay}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid #1f2937', padding: '16px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ color: '#6b7280', fontSize: '12px' }}>
            © {new Date().getFullYear()} KondaDeals. All rights reserved. Made with ❤️ in India.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(item => (
              <a key={item} href="#"
                style={{ color: '#6b7280', fontSize: '11px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#e53935'}
                onMouseLeave={e => e.target.style.color = '#6b7280'}
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