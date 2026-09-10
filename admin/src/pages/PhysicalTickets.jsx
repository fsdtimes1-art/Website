// admin/src/pages/PhysicalTickets.jsx
//
// Physical Ticketing hub — 4-tab interface:
//   Tab 1: Overview    — batch dashboard + metrics strip
//   Tab 2: Generator   — create a new batch and download PDF
//   Tab 3: Activation  — sell / activate serial ranges
//   Tab 4: Audit       — searchable serial ledger

import { useEffect, useRef, useState } from 'react'
import {
  getPhysicalTicketStats,
  getPhysicalBatches,
  getPhysicalBatchPdfUrl,
  deletePhysicalBatch,
  createPhysicalBatch,
  getPhysicalTickets,
  activateSerialRange,
  voidSerialRange,
  getAdminEvents,
} from '../lib/api'

// ── Design tokens (match existing admin variables) ────────────
const S = {
  card: {
    background: 'var(--black-2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
  },
  pill: (active) => ({
    padding: '8px 18px',
    borderRadius: '6px',
    border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
    color: active ? 'var(--gold)' : 'var(--gray-light)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  label: {
    color: 'var(--gray-mid)',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  sectionHead: {
    fontFamily: 'var(--font-display)',
    fontSize: '13px',
    letterSpacing: '2px',
    color: 'var(--gold)',
  },
}

// ── Status badge component ─────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80', label: 'Active'   },
    inactive: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', color: '#9ca3af', label: 'Inactive' },
    void:     { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#f87171', label: 'Void'     },
  }
  const s = map[status] || map.inactive
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: '11px', fontWeight: '600',
    }}>
      {s.label}
    </span>
  )
}

// ── Metric card ────────────────────────────────────────────────
function MetricCard({ icon, label, value, accent }) {
  return (
    <div style={{
      ...S.card, padding: '20px 22px', flex: '1 1 140px', minWidth: '130px',
    }}>
      <p style={S.label}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '36px',
        letterSpacing: '2px', color: accent || 'var(--white)', lineHeight: 1,
        marginTop: '4px',
      }}>
        {value ?? '—'}
      </p>
      {icon && <p style={{ fontSize: '18px', marginTop: '8px' }}>{icon}</p>}
    </div>
  )
}

// ── Toast notification ─────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 4000)
    return () => clearTimeout(id)
  }, [onClose])
  const isErr = type === 'error'
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: isErr ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
      color: isErr ? '#f87171' : '#4ade80',
      padding: '14px 20px', borderRadius: '10px',
      fontSize: '13px', maxWidth: '380px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'fadeInUp 0.25s ease',
    }}>
      {isErr ? '❌' : '✅'} {msg}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════
function OverviewTab({ stats, batches, loadingStats, loadingBatches, onDownloadPdf, onDeleteBatch, events }) {
  const [deletingId,    setDeletingId]    = useState(null)
  const [filterEventId, setFilterEventId] = useState('')

  const filteredBatches = filterEventId
    ? batches.filter(b => b.event_id === filterEventId)
    : batches

  async function handleDelete(batch) {
    const hasScanned = (batch.ticketCounts?.scanned ?? 0) > 0
    const msg = hasScanned
      ? `Batch ${batch.batch_ref} has ${batch.ticketCounts.scanned} already-scanned ticket(s) — it CANNOT be deleted.`
      : `Delete batch ${batch.batch_ref} and ALL ${batch.quantity} tickets permanently? This cannot be undone.`

    if (hasScanned) { alert(msg); return }
    if (!window.confirm(msg)) return

    setDeletingId(batch.id)
    try {
      await onDeleteBatch(batch.id)
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Metrics strip */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <MetricCard label="Total Batches"  value={loadingStats ? '…' : stats?.totalBatches} icon="📦" />
        <MetricCard label="Printed"        value={loadingStats ? '…' : stats?.totalPrinted} icon="🖨️" />
        <MetricCard label="Active (Sold)"  value={loadingStats ? '…' : stats?.active}       icon="✅" accent="var(--green)" />
        <MetricCard label="Inactive"       value={loadingStats ? '…' : stats?.inactive}     icon="📋" accent="var(--gray-light)" />
        <MetricCard label="Scanned"        value={loadingStats ? '…' : stats?.scanned}      icon="📷" accent="var(--gold)" />
        <MetricCard label="Void"           value={loadingStats ? '…' : stats?.voided}       icon="❌" accent="#f87171" />
      </div>

      {/* Event filter + section label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ ...S.label, margin: 0 }}>Print Batches ({filteredBatches.length})</p>
        <select
          className="input"
          value={filterEventId}
          onChange={e => setFilterEventId(e.target.value)}
          style={{ fontSize: '12px', padding: '7px 12px', maxWidth: '240px' }}
        >
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {/* Batch cards */}
      {loadingBatches ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div style={{ ...S.card, padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎟️</p>
          <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>
            {filterEventId ? 'No batches for this event.' : 'No batches yet. Create your first batch in the Generator tab.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBatches.map(b => (
            <div key={b.id} style={{ ...S.card, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '2px', color: 'var(--gold)' }}>
                    {b.batch_ref}
                  </p>
                  <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>
                    {b.events?.name}
                  </p>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '2px' }}>
                    {b.seat_categories?.name} · Serials {b.start_serial} – {b.end_serial} · {b.quantity} tickets
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ ...S.label, margin: 0, whiteSpace: 'nowrap' }}>
                    ✅ {b.ticketCounts?.active ?? 0} active &nbsp;
                    📋 {b.ticketCounts?.inactive ?? 0} unused &nbsp;
                    📷 {b.ticketCounts?.scanned ?? 0} scanned
                  </span>
                  {/* PDF Download — direct browser navigation (no fetch/blob issues) */}
                  {(() => {
                    const { directUrl, filename } = onDownloadPdf(b.id, b.batch_ref)
                    return (
                      <a
                        href={directUrl}
                        download={filename}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gold"
                        style={{ fontSize: '12px', padding: '8px 16px', textDecoration: 'none', display: 'inline-block' }}
                      >
                        ⬇ PDF
                      </a>
                    )
                  })()}
                  {/* Delete batch */}
                  <button
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    style={{
                      fontSize: '12px', padding: '8px 12px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171', borderRadius: '8px',
                      cursor: deletingId === b.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === b.id ? 0.6 : 1,
                    }}
                    title="Delete entire batch from database"
                  >
                    {deletingId === b.id ? '…' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// TAB 2 — GENERATOR
// ═══════════════════════════════════════════════════════════════
function GeneratorTab({ events, onCreated, onToast }) {
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    eventId: '', categoryId: '', quantity: 50, startSerial: 1,
    qrX: 76, qrY: 15, qrSize: 24, ticketW: 180, ticketH: 70,
  })
  const [template,   setTemplate]   = useState(null)  // File object
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState(null)   // { batch, pdfSignedUrl }

  const selectedEvent      = events.find(e => e.id === form.eventId)
  const availableCategories = selectedEvent?.seat_categories || []

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleEventChange(eventId) {
    setField('eventId', eventId)
    setField('categoryId', '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.eventId || !form.categoryId) return
    setSubmitting(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('eventId',     form.eventId)
      fd.append('categoryId',  form.categoryId)
      fd.append('quantity',    String(form.quantity))
      fd.append('startSerial', String(form.startSerial))
      fd.append('qrX',         String(form.qrX))
      fd.append('qrY',         String(form.qrY))
      fd.append('qrSize',      String(form.qrSize))
      fd.append('ticketW',     String(form.ticketW))
      fd.append('ticketH',     String(form.ticketH))
      if (template) fd.append('template', template)

      const data = await createPhysicalBatch(fd)
      setResult(data)
      onCreated()
      onToast(`Batch ${data.batch.batch_ref} created — ${data.ticketCount} tickets generated!`, 'success')
    } catch (err) {
      onToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Event */}
          <div>
            <label style={S.label}>Event</label>
            <select
              className="input"
              value={form.eventId}
              onChange={e => handleEventChange(e.target.value)}
              required
            >
              <option value="">— Select event —</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label style={S.label}>Seat Category</label>
            <select
              className="input"
              value={form.categoryId}
              onChange={e => setField('categoryId', e.target.value)}
              required
              disabled={!form.eventId}
            >
              <option value="">— Select category —</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quantity + Start Serial */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Quantity (1–50 per batch)</label>
              <input
                type="number" min={1} max={50} required
                className="input"
                value={form.quantity}
                onChange={e => setField('quantity', Math.min(50, parseInt(e.target.value, 10) || 1))}
              />
              <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '4px' }}>
                For larger runs create multiple batches.
              </p>
            </div>
            <div>
              <label style={S.label}>Starting Serial #</label>
              <input
                type="number" min={1} required
                className="input"
                value={form.startSerial}
                onChange={e => setField('startSerial', parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          {/* Template upload */}
          <div>
            <label style={S.label}>Ticket Artwork Template (JPG / PNG)</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                ...S.card, padding: '20px', textAlign: 'center',
                cursor: 'pointer', borderStyle: 'dashed',
              }}
            >
              <p style={{ fontSize: '24px' }}>🖼️</p>
              <p style={{ color: template ? 'var(--gold)' : 'var(--gray-mid)', fontSize: '13px', marginTop: '6px' }}>
                {template ? template.name : 'Click to upload (max 2 MB — JPEG/PNG/WebP)'}
              </p>
              {template && (
                <button
                  type="button"
                  onClick={ev => { ev.stopPropagation(); setTemplate(null) }}
                  style={{ marginTop: '8px', color: '#f87171', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕ Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => setTemplate(e.target.files[0] || null)}
            />
            <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '6px' }}>
              💡 Keep artwork under 2 MB — larger files may cause PDF download to fail.
              Compress with <a href="https://squoosh.app" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>squoosh.app</a> if needed.
            </p>
          </div>
        </div>

        {/* Right column — QR placement + live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...S.card, padding: '20px' }}>
            <p style={{ ...S.sectionHead, marginBottom: '16px' }}>QR CODE PLACEMENT</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>QR Left Edge (% of width)</label>
                <input type="number" min={0} max={95} step={1} className="input"
                  value={form.qrX} onChange={e => setField('qrX', parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={S.label}>QR Top Edge (% of height)</label>
                <input type="number" min={0} max={90} step={1} className="input"
                  value={form.qrY} onChange={e => setField('qrY', parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={S.label}>QR Size (mm)</label>
                <input type="number" min={10} max={60} step={1} className="input"
                  value={form.qrSize} onChange={e => setField('qrSize', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* ── LIVE PREVIEW ── */}
            <p style={{ ...S.label, marginBottom: '8px' }}>Live Preview</p>
            <div style={{
              position: 'relative',
              width: '100%',
              // keep the aspect ratio of the real ticket
              paddingBottom: `${(form.ticketH / form.ticketW) * 100}%`,
              background: template
                ? `url(${URL.createObjectURL(template)}) center/cover no-repeat`
                : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              {/* dark overlay if using template */}
              {template && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                }} />
              )}

              {/* Ticket label placeholder */}
              <div style={{
                position: 'absolute', left: '5%', top: '18%',
                color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'var(--font-display)',
                letterSpacing: '2px', pointerEvents: 'none',
              }}>
                FAISALABAD TIMES
              </div>

              {/* QR box */}
              <div style={{
                position: 'absolute',
                left:   `${form.qrX}%`,
                top:    `${form.qrY}%`,
                width:  `${(form.qrSize / form.ticketW) * 100}%`,
                aspectRatio: '1 / 1',
                border: '2px solid #29dcff',
                background: 'rgba(41, 220, 255, 0.1)',
                borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(41,220,255,0.4)',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '10px', color: '#29dcff', fontWeight: '700', letterSpacing: '0.5px' }}>QR</span>
              </div>
            </div>
            <p style={{ color: 'var(--gray-dark)', fontSize: '10px', marginTop: '6px' }}>
              Cyan box = QR code position on the printed ticket
            </p>
          </div>

          <div style={{ ...S.card, padding: '20px' }}>
            <p style={{ ...S.sectionHead, marginBottom: '16px' }}>TICKET DIMENSIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={S.label}>Width (mm)</label>
                <input type="number" min={80} max={350} step={1} className="input"
                  value={form.ticketW} onChange={e => setField('ticketW', parseFloat(e.target.value))} />
              </div>

              <div>
                <label style={S.label}>Height (mm)</label>
                <input type="number" min={40} max={200} step={1} className="input"
                  value={form.ticketH} onChange={e => setField('ticketH', parseFloat(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Preview of serial range */}
          {form.eventId && form.categoryId && (
            <div style={{ ...S.card, padding: '16px 20px', borderColor: 'rgba(245,158,11,0.15)' }}>
              <p style={S.label}>Preview</p>
              <p style={{ color: 'var(--white)', fontSize: '13px', fontFamily: 'monospace' }}>
                PT-{new Date().getFullYear()}-{String(form.startSerial).padStart(6, '0')}
                {' '}<span style={{ color: 'var(--gray-mid)' }}>→</span>{' '}
                PT-{new Date().getFullYear()}-{String(form.startSerial + form.quantity - 1).padStart(6, '0')}
              </p>
              <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>
                {form.quantity} tickets · QR error correction: Level H
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div style={{ marginTop: '28px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting || !form.eventId || !form.categoryId}
          className="btn-gold"
          style={{ padding: '13px 32px', opacity: submitting || !form.eventId || !form.categoryId ? 0.5 : 1 }}
        >
          {submitting ? '⏳ Generating…' : '🎟️ Generate Batch & PDF'}
        </button>
        {submitting && (
          <p style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
            Rendering {form.quantity} QR codes…
          </p>
        )}
      </div>

      {/* Success result card */}
      {result && (
        <div style={{
          ...S.card, marginTop: '24px', padding: '20px 24px',
          borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)',
        }}>
          <p style={{ color: '#4ade80', fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '2px' }}>
            ✅ {result.batch.batch_ref} CREATED
          </p>
          <p style={{ color: 'var(--gray-light)', fontSize: '13px', marginTop: '6px' }}>
            {result.ticketCount} tickets inserted successfully.
          </p>
          <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '8px' }}>
            💡 Go to <strong style={{ color: 'var(--gray-light)' }}>Overview</strong> and click the <strong style={{ color: '#FFD600' }}>⬇ PDF</strong> button to generate and download the print-ready PDF.
          </p>
        </div>
      )}

    </form>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — ACTIVATION
// ═══════════════════════════════════════════════════════════════
function ActivationTab({ batches, onToast, onRefresh }) {
  const [batchId,    setBatchId]    = useState('')
  const [fromSerial, setFromSerial] = useState('')
  const [toSerial,   setToSerial]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voidMode,   setVoidMode]   = useState(false) // toggle between activate / void

  async function handleSubmit(e) {
    e.preventDefault()
    const from = parseInt(fromSerial, 10)
    const to   = parseInt(toSerial,   10)
    if (!batchId || isNaN(from) || isNaN(to) || from > to) {
      onToast('Please fill all fields correctly (From ≤ To)', 'error')
      return
    }

    const count = to - from + 1
    const action = voidMode ? 'void' : 'activate'
    const confirmed = window.confirm(
      `${voidMode ? '⚠️ VOID' : '✅ ACTIVATE'} serials ${from} → ${to} (${count} ticket${count !== 1 ? 's' : ''})?\n\n` +
      (voidMode
        ? 'Voided tickets CANNOT be scanned at the gate.'
        : 'Activated tickets will count against the seat inventory.')
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const payload = { batchId, fromSerial: from, toSerial: to }
      const result = voidMode
        ? await voidSerialRange(payload)
        : await activateSerialRange(payload)

      const n = result.activated ?? result.voided
      onToast(
        voidMode
          ? `Voided ${n} ticket(s) successfully.`
          : `Activated ${n} ticket(s). Seat inventory updated.`,
        'success'
      )
      setFromSerial('')
      setToSerial('')
      onRefresh()
    } catch (err) {
      onToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBatch = batches.find(b => b.id === batchId)

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={S.pill(!voidMode)} onClick={() => setVoidMode(false)}>
            ✅ Activate (Sell)
          </button>
          <button type="button" style={S.pill(voidMode)} onClick={() => setVoidMode(true)}>
            ❌ Void
          </button>
        </div>

        <div style={{
          ...S.card, padding: '14px 18px',
          background: voidMode ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
          borderColor: voidMode ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
        }}>
          <p style={{ fontSize: '12px', color: voidMode ? '#f87171' : 'var(--gold)' }}>
            {voidMode
              ? '⚠️ Void cancels tickets permanently. Only tickets not yet scanned can be voided.'
              : '✅ Activating marks tickets as sold and increments the event\'s sold seat count.'}
          </p>
        </div>

        {/* Batch selector */}
        <div>
          <label style={S.label}>Batch</label>
          <select
            className="input"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            required
          >
            <option value="">— Select batch —</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_ref} — {b.events?.name} / {b.seat_categories?.name}
              </option>
            ))}
          </select>
        </div>

        {/* Batch info */}
        {selectedBatch && (
          <div style={{ ...S.card, padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                { label: 'Serials',  val: `${selectedBatch.start_serial} – ${selectedBatch.end_serial}` },
                { label: 'Active',   val: selectedBatch.ticketCounts?.active   ?? 0 },
                { label: 'Inactive', val: selectedBatch.ticketCounts?.inactive ?? 0 },
                { label: 'Void',     val: selectedBatch.ticketCounts?.void     ?? 0 },
              ].map(item => (
                <div key={item.label}>
                  <p style={S.label}>{item.label}</p>
                  <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '600' }}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Serial range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={S.label}>From Serial #</label>
            <input
              type="number" min={1} required
              className="input"
              placeholder={selectedBatch ? String(selectedBatch.start_serial) : '1'}
              value={fromSerial}
              onChange={e => setFromSerial(e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>To Serial #</label>
            <input
              type="number" min={1} required
              className="input"
              placeholder={selectedBatch ? String(selectedBatch.end_serial) : '50'}
              value={toSerial}
              onChange={e => setToSerial(e.target.value)}
            />
          </div>
        </div>

        {fromSerial && toSerial && !isNaN(parseInt(fromSerial)) && !isNaN(parseInt(toSerial)) && (
          <p style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
            {Math.max(0, parseInt(toSerial) - parseInt(fromSerial) + 1)} ticket(s) selected
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !batchId || !fromSerial || !toSerial}
          className={voidMode ? 'btn-danger' : 'btn-gold'}
          style={{ padding: '13px 32px', opacity: submitting || !batchId ? 0.5 : 1 }}
        >
          {submitting ? '⏳ Processing…' : voidMode ? '❌ Void Range' : '✅ Activate Range'}
        </button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════
// TAB 4 — AUDIT (Serial Ledger)
// ═══════════════════════════════════════════════════════════════
function AuditTab({ batches }) {
  const [params,   setParams]   = useState({ batchId: '', status: 'all', scanned: 'all', page: 1 })
  const [tickets,  setTickets]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [search,   setSearch]   = useState('')

  const LIMIT = 50

  async function fetchTickets(p = params) {
    setLoading(true)
    try {
      const q = {
        page:  p.page,
        limit: LIMIT,
      }
      if (p.batchId) q.batchId = p.batchId
      if (p.status && p.status !== 'all') q.status = p.status
      if (p.scanned === 'true')  q.scanned = true
      if (p.scanned === 'false') q.scanned = false

      const data = await getPhysicalTickets(q)
      setTickets(data.tickets || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Audit fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  function applyFilter(patch) {
    const next = { ...params, ...patch, page: 1 }
    setParams(next)
    fetchTickets(next)
  }

  function changePage(newPage) {
    const next = { ...params, page: newPage }
    setParams(next)
    fetchTickets(next)
  }

  const filtered = search.trim()
    ? tickets.filter(t => t.serial_code?.toLowerCase().includes(search.toLowerCase()))
    : tickets

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
          <label style={S.label}>Batch</label>
          <select className="input" value={params.batchId} onChange={e => applyFilter({ batchId: e.target.value })}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_ref}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
          <label style={S.label}>Status</label>
          <select className="input" value={params.status} onChange={e => applyFilter({ status: e.target.value })}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="void">Void</option>
          </select>
        </div>
        <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
          <label style={S.label}>Scanned</label>
          <select className="input" value={params.scanned} onChange={e => applyFilter({ scanned: e.target.value })}>
            <option value="all">All</option>
            <option value="true">Scanned</option>
            <option value="false">Not Scanned</option>
          </select>
        </div>
        <div style={{ flex: '2 1 200px' }}>
          <label style={S.label}>Search Serial</label>
          <input
            className="input" placeholder="PT-2026-000042"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '680px' }}>
            <thead>
              <tr>
                <th>Serial Code</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Scanned</th>
                <th>Scan Timestamp</th>
                <th>Activated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-mid)', padding: '40px' }}>
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--white)', fontSize: '13px' }}>
                        {t.serial_code}
                      </span>
                    </td>
                    <td>{t.physical_ticket_batches?.batch_ref || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.scanned
                        ? <span style={{ color: '#4ade80', fontWeight: '600' }}>Yes</span>
                        : <span style={{ color: 'var(--gray-mid)' }}>No</span>}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                      {t.scanned_at
                        ? new Date(t.scanned_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                        : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                      {t.activated_at
                        ? new Date(t.activated_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
              Page {params.page} of {totalPages} · {total} records
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }}
                disabled={params.page <= 1} onClick={() => changePage(params.page - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }}
                disabled={params.page >= totalPages} onClick={() => changePage(params.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ROOT — PhysicalTickets page
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'overview',   label: '📦 Overview'   },
  { id: 'generator',  label: '⚡ Generator'  },
  { id: 'activation', label: '✅ Activation' },
  { id: 'audit',      label: '🔍 Audit'      },
]

export default function PhysicalTickets() {
  const [tab,           setTab]           = useState('overview')
  const [events,        setEvents]        = useState([])
  const [batches,       setBatches]       = useState([])
  const [stats,         setStats]         = useState(null)
  const [loadingStats,  setLoadingStats]  = useState(true)
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [toast,         setToast]         = useState(null)  // { msg, type }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
  }

  async function fetchData() {
    setLoadingStats(true)
    setLoadingBatches(true)
    try {
      const [s, b] = await Promise.all([getPhysicalTicketStats(), getPhysicalBatches()])
      setStats(s)
      setBatches(b)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoadingStats(false)
      setLoadingBatches(false)
    }
  }

  useEffect(() => {
    fetchData()
    getAdminEvents().then(setEvents).catch(console.error)
  }, [])

  async function handleDeleteBatch(batchId) {
    await deletePhysicalBatch(batchId)
    showToast('Batch deleted successfully', 'success')
    await fetchData()
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Gate Operations
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', letterSpacing: '3px', color: 'var(--white)', lineHeight: '1' }}>
          PHYSICAL TICKETS
        </h1>
        <p style={{ color: 'var(--gray-mid)', fontSize: '13px', marginTop: '8px' }}>
          Print, distribute, and reconcile paper tickets. Compatible with the universal scanner.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={S.pill(tab === t.id)}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'overview' && (
        <OverviewTab
          stats={stats}
          batches={batches}
          events={events}
          loadingStats={loadingStats}
          loadingBatches={loadingBatches}
          onDownloadPdf={getPhysicalBatchPdfUrl}
          onDeleteBatch={handleDeleteBatch}
        />
      )}


      {tab === 'generator' && (
        <GeneratorTab
          events={events}
          onCreated={fetchData}
          onToast={showToast}
        />
      )}

      {tab === 'activation' && (
        <ActivationTab
          batches={batches}
          onToast={showToast}
          onRefresh={fetchData}
        />
      )}

      {tab === 'audit' && (
        <AuditTab batches={batches} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
