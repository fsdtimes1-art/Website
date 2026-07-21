// admin/src/pages/Portfolio.jsx
import { useEffect, useState, useRef } from 'react'
import {
  getAdminPortfolio, createPortfolioItem,
  updatePortfolioItem, deletePortfolioItem
} from '../lib/api'

const EMPTY_FORM = {
  client_name:   '',
  event_name:    '',
  description:   '',
  image_url:     '',
  event_date:    '',
  attendees:     '',
  is_featured:   false,
  display_order: '',
}

export default function Portfolio() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [modal,   setModal]   = useState(null)  // null | 'create' | { ...item }

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminPortfolio()
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deletePortfolioItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  function handleSaved(item, isNew) {
    if (isNew) {
      setItems(prev => [...prev, item])
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
    }
    setModal(null)
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <p style={{
            color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px',
          }}>
            Showcase
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '40px',
            letterSpacing: '3px', color: 'var(--white)', lineHeight: '1',
          }}>
            PORTFOLIO
          </h1>
        </div>
        <button
          onClick={() => setModal('create')}
          className="btn-gold"
          style={{ fontSize: '13px', padding: '11px 22px' }}
        >
          + Add Item
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '14px 18px', color: '#f87171',
          fontSize: '13px', marginBottom: '24px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && items.length === 0 && (
        <div style={{
          background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '80px 0', textAlign: 'center',
          color: 'var(--gray-mid)',
        }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
          <p style={{ fontSize: '16px', color: 'var(--white)', marginBottom: '6px' }}>
            No portfolio items yet
          </p>
          <p style={{ fontSize: '13px', marginBottom: '24px' }}>
            Add your first past event to showcase your work
          </p>
          <button onClick={() => setModal('create')} className="btn-gold">
            + Add First Item
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && items.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {items.map(item => (
            <PortfolioCard
              key={item.id}
              item={item}
              onEdit={() => setModal(item)}
              onDelete={() => handleDelete(item.id, item.event_name)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <PortfolioModal
          item={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function PortfolioCard({ item, onEdit, onDelete }) {
  const formattedDate = item.event_date
    ? new Date(item.event_date).toLocaleDateString('en-PK', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null

  return (
    <div style={{
      background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      {/* Image */}
      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.event_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--black-3), var(--black-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
          }}>
            🏆
          </div>
        )}
        {item.is_featured && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(245,158,11,0.9)', color: '#000',
            fontSize: '9px', fontWeight: '700', letterSpacing: '1px',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            FEATURED
          </span>
        )}
        <span style={{
          position: 'absolute', bottom: '10px', left: '10px',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--gray-mid)', fontSize: '11px',
          padding: '3px 8px', borderRadius: '4px',
        }}>
          Order: {item.display_order ?? 0}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
          {item.client_name}
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '18px',
          letterSpacing: '1px', color: 'var(--white)', lineHeight: '1.2', marginBottom: '8px',
        }}>
          {item.event_name}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {formattedDate && (
            <span style={{ color: 'var(--gray-mid)', fontSize: '12px', display: 'flex', gap: '4px' }}>
              📅 {formattedDate}
            </span>
          )}
          {item.attendees && (
            <span style={{ color: 'var(--gray-mid)', fontSize: '12px', display: 'flex', gap: '4px' }}>
              👥 {item.attendees.toLocaleString()}
            </span>
          )}
        </div>

        {item.description && (
          <p style={{
            color: 'var(--gray-light)', fontSize: '12px', lineHeight: '1.5',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            marginBottom: '12px',
          }}>
            {item.description}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--gray-light)', fontSize: '12px',
              padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--gray-light)' }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: '12px', padding: '8px 12px',
              borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

function PortfolioModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form,   setForm]   = useState(item ? {
    client_name:   item.client_name   || '',
    event_name:    item.event_name    || '',
    description:   item.description  || '',
    image_url:     item.image_url    || '',
    event_date:    item.event_date   || '',
    attendees:     item.attendees != null ? String(item.attendees) : '',
    is_featured:   item.is_featured  ?? false,
    display_order: item.display_order != null ? String(item.display_order) : '',
  } : { ...EMPTY_FORM })

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
const [dragOver, setDragOver] = useState(false)
const fileInputRef = useRef(null)

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = e => setForm(f => ({ ...f, image_url: e.target.result }))
  reader.readAsDataURL(file)
}

function handleDrop(e) {
  e.preventDefault(); setDragOver(false)
  handleImageFile(e.dataTransfer.files[0])
}
  function handleField(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit() {
    if (!form.client_name.trim()) return setError('Client name is required.')
    if (!form.event_name.trim())  return setError('Event name is required.')

    setError(null)
    setSaving(true)

    const payload = {
      client_name:   form.client_name.trim(),
      event_name:    form.event_name.trim(),
      description:   form.description.trim()  || null,
      image_url:     form.image_url.trim()    || null,
      event_date:    form.event_date          || null,
      attendees:     form.attendees ? Number(form.attendees) : null,
      is_featured:   form.is_featured,
      display_order: form.display_order ? Number(form.display_order) : 0,
    }

    try {
      let saved
      if (isEdit) {
        saved = await updatePortfolioItem(item.id, payload)
      } else {
        saved = await createPortfolioItem(payload)
      }
      onSaved(saved, !isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '560px', maxHeight: '90vh',
        background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'var(--black-3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '18px',
            letterSpacing: '2px', color: 'var(--gold)',
          }}>
            {isEdit ? 'EDIT ITEM' : 'ADD PORTFOLIO ITEM'}
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--gray-mid)',
              fontSize: '20px', cursor: 'pointer', padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px', padding: '12px', color: '#f87171', fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <MField label="Client Name *">
              <input className="input" name="client_name" placeholder="e.g. Pepsi Pakistan" value={form.client_name} onChange={handleField} />
            </MField>
            <MField label="Event Name *">
              <input className="input" name="event_name" placeholder="e.g. Product Launch 2024" value={form.event_name} onChange={handleField} />
            </MField>
          </div>

         <MField label="Event Image">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !form.image_url && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '10px',
                background: dragOver ? 'rgba(245,158,11,0.05)' : 'var(--black-3)',
                transition: 'all 0.2s',
                cursor: form.image_url ? 'default' : 'pointer',
                overflow: 'hidden', minHeight: '100px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {form.image_url ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={form.image_url}
                    alt="preview"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                      style={{
                        background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--white)', fontSize: '11px', padding: '5px 12px',
                        borderRadius: '6px', cursor: 'pointer', backdropFilter: 'blur(6px)',
                      }}
                    >
                      Change
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image_url: '' })) }}
                      style={{
                        background: 'rgba(239,68,68,0.8)', border: 'none',
                        color: '#fff', fontSize: '11px', padding: '5px 12px',
                        borderRadius: '6px', cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 20px' }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px', opacity: 0.4 }}>🖼️</div>
                  <p style={{ color: 'var(--gray-light)', fontSize: '13px', marginBottom: '4px' }}>
                    Drag & drop an image here, or{' '}
                    <span
                      style={{ color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </span>
                  </p>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '11px' }}>PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleImageFile(e.target.files[0])}
            />
          </MField>

          <MField label="Description">
            <textarea
              className="input" name="description"
              placeholder="Brief summary of the event..."
              value={form.description} onChange={handleField}
              rows={3} style={{ resize: 'vertical' }}
            />
          </MField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <MField label="Event Date">
              <input className="input" type="date" name="event_date" value={form.event_date} onChange={handleField} />
            </MField>
            <MField label="Attendees">
              <input className="input" type="number" name="attendees" placeholder="e.g. 500" value={form.attendees} onChange={handleField} min="0" />
            </MField>
            <MField label="Display Order">
              <input className="input" type="number" name="display_order" placeholder="0" value={form.display_order} onChange={handleField} min="0" />
            </MField>
          </div>

          {/* Featured toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', userSelect: 'none',
            background: 'var(--black-3)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '14px 16px',
          }}>
            <div
              onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                background: form.is_featured ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)',
                border: form.is_featured ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.15)',
                position: 'relative', transition: 'all 0.2s', flexShrink: 0, cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: form.is_featured ? '22px' : '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: form.is_featured ? 'var(--gold)' : 'var(--gray-dark)',
                transition: 'left 0.2s, background 0.2s',
              }} />
            </div>
            <div>
              <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>
                Featured item
              </p>
              <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '2px' }}>
                Shows a "FEATURED" badge on the portfolio card
              </p>
            </div>
          </label>

        </div>

        {/* Modal footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '13px' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-gold"
            style={{ fontSize: '13px', padding: '10px 24px', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes →' : 'Add Item →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', color: 'var(--gray-light)', fontSize: '11px',
        fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
