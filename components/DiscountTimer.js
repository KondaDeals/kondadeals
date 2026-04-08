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
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      })
    }
    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [endsAt])

  if (!endsAt || expired || !timeLeft) return null

  const pad = n => String(n).padStart(2, '0')

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        background: 'linear-gradient(135deg, #e53935, #ff6f00)',
        padding: '3px 8px', borderRadius: '6px',
        fontSize: '11px', fontWeight: '800', color: 'white',
        boxShadow: '0 2px 8px rgba(229,57,53,0.4)'
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
      boxShadow: '0 4px 20px rgba(229,57,53,0.25)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #b71c1c, #e53935)',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>LIMITED TIME DEAL</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', color: 'white', fontWeight: '700' }}>
          HURRY UP!
        </div>
      </div>

      {/* Timer Body */}
      <div style={{
        background: '#1a1a1a', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '600', whiteSpace: 'nowrap' }}>
          Ends in:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { val: pad(timeLeft.h), label: 'HRS' },
            { val: pad(timeLeft.m), label: 'MIN' },
            { val: pad(timeLeft.s), label: 'SEC' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                background: '#e53935', color: 'white',
                borderRadius: '6px', minWidth: '42px',
                textAlign: 'center', padding: '6px 4px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: '1', fontFamily: 'monospace' }}>
                  {item.val}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '700', opacity: 0.8, marginTop: '2px' }}>
                  {item.label}
                </div>
              </div>
              {i < 2 && (
                <span style={{ color: '#e53935', fontWeight: '900', fontSize: '20px', lineHeight: '1' }}>:</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>LIVE</span>
        </div>
      </div>
    </div>
  )
}