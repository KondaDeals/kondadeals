'use client'
import { useState } from 'react'

export default function OptimizedImage({
  src, alt, width, height, style = {}, className = '',
  priority = false, objectFit = 'contain', fallback = '🛍️'
}) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!src || error) {
    return (
      <div style={{
        width: width || '100%', height: height || '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5', fontSize: '32px', ...style
      }}>
        {fallback}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: width || '100%', height: height || '100%', ...style }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: 'inherit'
        }} />
      )}
      <img
        src={src}
        alt={alt || ''}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%', height: '100%',
          objectFit,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'block'
        }}
      />
    </div>
  )
}