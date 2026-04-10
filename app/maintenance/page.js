export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚧</div>
        <img src="/logo.png" alt="KondaDeals" style={{ height: '48px', objectFit: 'contain', marginBottom: '24px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', marginBottom: '12px' }}>
          We're coming soon!
        </h1>
        <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
          KondaDeals is currently under maintenance. We'll be back very soon with exciting deals!
        </p>
        <div style={{
          background: '#fff5f5', border: '1px solid #ffd0d0', borderRadius: '12px',
          padding: '16px', fontSize: '14px', color: '#e53935', fontWeight: '600'
        }}>
          📧 Get notified at kondadeals@gmail.com
        </div>
      </div>
    </div>
  )
}
