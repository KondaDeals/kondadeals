'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { X, Upload, Image } from 'lucide-react'

export default function ImageUpload({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    setUploading(true)
    const newImages = [...images]

    for (let file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      try {
        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (error) {
          // Fallback: use object URL for preview if storage not set up
          const reader = new FileReader()
          reader.onload = (e) => {
            newImages.push(e.target.result)
            onChange([...newImages])
          }
          reader.readAsDataURL(file)
        } else {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(data.path)
          newImages.push(urlData.publicUrl)
          onChange([...newImages])
        }
      } catch (err) {
        console.error('Upload error:', err)
        // Fallback to base64
        const reader = new FileReader()
        reader.onload = (e) => {
          newImages.push(e.target.result)
          onChange([...newImages])
        }
        reader.readAsDataURL(file)
      }
    }

    setUploading(false)
    toast.success('Images added!')
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = (from, to) => {
    const newImages = [...images]
    const [moved] = newImages.splice(from, 1)
    newImages.splice(to, 0, moved)
    onChange(newImages)
  }

  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '8px' }}>
        Product Images (max 5, 5MB each)
      </label>

      {/* Upload Area */}
      {images.length < 5 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}
          style={{
            border: `2px dashed ${dragOver ? '#e53935' : '#e0e0e0'}`,
            borderRadius: '10px', padding: '24px', textAlign: 'center',
            background: dragOver ? '#fff5f5' : '#f8f8f8',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '12px'
          }}
          onClick={() => document.getElementById('imageFileInput').click()}
        >
          <input
            id="imageFileInput"
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFileUpload(e.target.files)}
          />
          <Upload size={28} color="#e53935" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
            {uploading ? '⏳ Uploading...' : 'Click to upload or drag & drop'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            PNG, JPG, WEBP up to 5MB each • Max 5 images
          </div>
        </div>
      )}

      {/* Also accept URL */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Or paste image URL: https://example.com/image.jpg"
          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          onKeyPress={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              if (images.length >= 5) { toast.error('Max 5 images'); return }
              onChange([...images, e.target.value.trim()])
              e.target.value = ''
            }
          }}
        />
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Press Enter to add URL</div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', border: i === 0 ? '2px solid #e53935' : '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#f8f8f8' }}>
              {i === 0 && (
                <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#e53935', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px', fontWeight: '700', zIndex: 2 }}>
                  MAIN
                </div>
              )}
              <img src={img} alt={`Product ${i+1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text y="50" x="50" text-anchor="middle" fill="%23999">IMG</text></svg>'}
              />
              <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button onClick={() => removeImage(i)} title="Remove"
                  style={{ background: '#e53935', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={10} color="white" />
                </button>
                {i > 0 && (
                  <button onClick={() => moveImage(i, i-1)} title="Move left"
                    style={{ background: '#333', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', color: 'white', fontSize: '10px' }}>
                    ←
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}