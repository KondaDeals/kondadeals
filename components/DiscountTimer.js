'use client'
import { useState, useEffect } from 'react'

export default function DiscountTimer({ endsAt, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!endsAt) return

    const calculate = () => {
      const diff = new Date(endsAt) - new Date()
      if (diff <= 0) { setExpired(true); setTimeLeft(null); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [endsAt])

  if (!endsAt || expired) return null
  if (!timeLeft) return null

  if (compact) {
    return (
      <div style={{ background: '#e53935', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        ⏰ {String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #e53935, #ff6f00)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', color: 'white' }}>
      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>
        ⚡ DEAL ENDS IN
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[
          { val: String(timeLeft.h).padStart(2,'0'), label: 'HRS' },
          { val: ':', label: '' },
          { val: String(timeLeft.m).padStart(2,'0'), label: 'MIN' },
          { val: ':', label: '' },
          { val: String(timeLeft.s).padStart(2,'0'), label: 'SEC' },
        ].map((item, i) => (
          item.label === '' ?
            <span key={i} style={{ fontSize: '24px', fontWeight: '900' }}>{item.val}</span> :
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '4px 10px', fontSize: '22px', fontWeight: '900', minWidth: '44px' }}>
                {item.val}
              </div>
              <div style={{ fontSize: '9px', marginTop: '3px', opacity: 0.8 }}>{item.label}</div>
            </div>
        ))}
      </div>
    </div>
  )
}