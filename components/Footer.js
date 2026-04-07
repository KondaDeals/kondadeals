import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1a1a1a', color: 'white', marginTop: '48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          
          {/* Brand */}
          <div>
            <img src="/logo.png" alt="KondaDeals" style={{ height: '50px', width: 'auto', objectFit: 'contain', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} />
            <p style={{ color: '#999', fontSize: '13px', lineHeight: '1.8' }}>
              India's favourite destination for viral gadgets and trending products at unbeatable prices.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {['📸', '📘', '▶️', '🐦'].map((emoji, i) => (
                <a key={i} href="#" style={{
                  background: '#333',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e53935'}
                onMouseLeave={e => e.currentTarget.style.background = '#333'}
                >
                  {emoji}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>QUICK LINKS</h4>
            {[
              { label: 'Home', href: '/' },
              { label: 'All Products', href: '/collections/all' },
              { label: 'Viral Gadgets', href: '/collections/viral-gadgets' },
              { label: 'New Arrivals', href: '/collections/new-arrivals' },
              { label: 'Best Sellers', href: '/collections/all' },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ display: 'block', color: '#999', fontSize: '13px', marginBottom: '10px', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#e53935'}
              onMouseLeave={e => e.target.style.color = '#999'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Customer Service */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>CUSTOMER SERVICE</h4>
            {[
              { label: 'My Account', href: '/account' },
              { label: 'Track Order', href: '/account/orders' },
              { label: 'Return Policy', href: '/pages/returns' },
              { label: 'Shipping Info', href: '/pages/shipping' },
              { label: 'Contact Us', href: '/pages/contact' },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ display: 'block', color: '#999', fontSize: '13px', marginBottom: '10px', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#e53935'}
              onMouseLeave={e => e.target.style.color = '#999'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>CONTACT US</h4>
            <div style={{ color: '#999', fontSize: '13px', lineHeight: '2' }}>
              <div>📧 kondadeals@gmail.com</div>
              <div>📞 +91 78160 10619</div>
              <div>⏰ Mon-Sat: 9AM - 9PM</div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>We Accept</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['UPI', 'Visa', 'Mastercard', 'COD'].map(pay => (
                  <span key={pay} style={{
                    background: '#333',
                    color: '#ccc',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
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
          <p style={{ color: '#666', fontSize: '12px' }}>
            © 2026 KondaDeals. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(item => (
              <a key={item} href="#" style={{ color: '#666', fontSize: '12px', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#e53935'}
              onMouseLeave={e => e.target.style.color = '#666'}
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