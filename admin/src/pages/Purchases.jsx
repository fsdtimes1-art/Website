// admin/src/pages/Purchases.jsx
import { useEffect, useState } from 'react'
import { getPurchases, getAdminEvents, createManualSale, verifyWhatsappPurchase } from '../lib/api'

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [eventId,   setEventId]   = useState('')
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(null)
  const [statusFilter, setStatusFilter] = useState('all') // all | whatsapp | completed
  const [verifyingId,  setVerifyingId]  = useState(null)

  // ── Manual-sale modal state ──
  const [showModal,   setShowModal]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [modalError,  setModalError]  = useState(null)
  const [form, setForm] = useState({
    eventId: '', categoryId: '', quantity: 1,
    buyerName: '', buyerEmail: '', buyerPhone: '',
  })

  const selectedEvent      = events.find(ev => ev.id === form.eventId)
  const availableCategories = selectedEvent?.seat_categories || []

  useEffect(() => {
    getAdminEvents()
      .then(setEvents)
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [eventId])

  async function fetchPurchases() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPurchases(eventId || null)
      setPurchases(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

 const filtered = purchases.filter(p => {
    if (statusFilter === 'whatsapp'  && p.status !== 'whatsapp_pending') return false
    if (statusFilter === 'completed' && p.status !== 'completed')        return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.buyer_name?.toLowerCase().includes(q)  ||
      p.buyer_email?.toLowerCase().includes(q) ||
      p.buyer_phone?.toLowerCase().includes(q)
    )
  })

  const totalRevenue = filtered
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + Number(p.total_amount), 0)

  const totalTickets = filtered.reduce(
    (s, p) => s + (p.tickets?.length || 0), 0
  )

  async function handleManualSale(e) {
    e.preventDefault()
    setModalError(null)
    setSubmitting(true)
    try {
      await createManualSale({ ...form, quantity: Number(form.quantity) })
      setShowModal(false)
      setForm({ eventId: '', categoryId: '', quantity: 1, buyerName: '', buyerEmail: '', buyerPhone: '' })
      fetchPurchases()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify(id) {
    setVerifyingId(id)
    try {
      await verifyWhatsappPurchase(id)
      await fetchPurchases()
    } catch (err) {
      alert(`Failed to verify: ${err.message}`)
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1400px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px',
        }}>
          Buyers
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '40px',
          letterSpacing: '3px', color: 'var(--white)', lineHeight: '1',
        }}>
          PURCHASES
        </h1>
      </div>

      {/* ── Summary strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px', marginBottom: '28px',
      }}>
        {[
          { label: 'Total Orders',   value: filtered.length,                              icon: '🧾' },
          { label: 'Tickets Issued', value: totalTickets,                                 icon: '🎟️' },
          { label: 'Revenue',        value: `PKR ${totalRevenue.toLocaleString()}`,       icon: '💰', gold: true },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--black-2)',
            border: s.gold ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <span style={{ fontSize: '24px' }}>{s.icon}</span>
            <div>
              <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {s.label}
              </p>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '24px',
                letterSpacing: '1px', color: s.gold ? 'var(--gold)' : 'var(--white)',
              }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

{/* ── Status filter tabs ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all',       label: 'All'             },
          { key: 'whatsapp',  label: 'WhatsApp Pending' },
          { key: 'completed', label: 'Completed'        },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              background:   statusFilter === f.key ? 'var(--gold)' : 'transparent',
              color:        statusFilter === f.key ? '#000' : 'var(--gray-light)',
              border:       statusFilter === f.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize:     '13px',
              fontWeight:   statusFilter === f.key ? '700' : '400',
              padding:      '6px 14px',
              cursor:       'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Event filter */}
        <select
          value={eventId}
          onChange={e => setEventId(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: '220px', cursor: 'pointer' }}
        >
          <option value="">All Events</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '340px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--gray-mid)', fontSize: '14px', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            className="input"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Add Sale */}
        <button
          onClick={() => { setModalError(null); setShowModal(true) }}
          style={{
            marginLeft: 'auto',
            background: 'var(--gold)', border: 'none',
            color: '#000', fontSize: '12px', fontWeight: '700',
            padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
            letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Add Sale
        </button>

        {/* Refresh */}
        <button
          onClick={fetchPurchases}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--gray-mid)', fontSize: '12px', padding: '8px 14px',
            borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = 'var(--gold)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--gray-mid)' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '14px 18px', color: '#f87171',
          fontSize: '13px', marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Table card ── */}
      <div style={{
        background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '16px',
            letterSpacing: '2px', color: 'var(--white)',
          }}>
            ALL PURCHASES
          </p>
          <span style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-mid)' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</p>
            <p style={{ fontSize: '15px', color: 'var(--white)', marginBottom: '6px' }}>No purchases found</p>
            <p style={{ fontSize: '12px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Tickets</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <PurchaseRow
                    key={p.id}
                    purchase={p}
                    expanded={expanded === p.id}
                    onToggle={() => setExpanded(prev => prev === p.id ? null : p.id)}
                    displayAmount={getDisplayAmount(p)}
                    onVerify={() => handleVerify(p.id)}
                    verifying={verifyingId === p.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Sale Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', width: '100%', maxWidth: '480px',
            padding: '32px', position: 'relative',
          }}>
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'transparent', border: 'none',
                color: 'var(--gray-mid)', fontSize: '18px', cursor: 'pointer',
              }}
            >✕</button>

            {/* Header */}
            <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Complimentary
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '24px' }}>
              ADD SALE
            </h2>

            <form onSubmit={handleManualSale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Event */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Event *</label>
                <select
                  className="input"
                  value={form.eventId}
                  onChange={e => setForm(f => ({ ...f, eventId: e.target.value, categoryId: '' }))}
                  required
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="">Select event…</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Ticket Category *</label>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  required
                  disabled={!form.eventId}
                  style={{ width: '100%', cursor: form.eventId ? 'pointer' : 'not-allowed', opacity: form.eventId ? 1 : 0.5 }}
                >
                  <option value="">Select category…</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.total_seats - cat.sold_seats} left)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Quantity *</label>
                <input
                  className="input"
                  type="number" min="1" max="20"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

              {/* Buyer name */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Full Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Ahmed Khan"
                  value={form.buyerName}
                  onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Buyer email */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Email *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="e.g. ahmed@email.com"
                  value={form.buyerEmail}
                  onChange={e => setForm(f => ({ ...f, buyerEmail: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Buyer phone */}
              <div>
                <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Phone (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. 0300-1234567"
                  value={form.buyerPhone}
                  onChange={e => setForm(f => ({ ...f, buyerPhone: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Error */}
              {modalError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px',
                }}>
                  ⚠️ {modalError}
                </div>
              )}

              {/* Note */}
              <p style={{ color: 'var(--gray-dark)', fontSize: '11px', lineHeight: '1.5' }}>
                Tickets will be issued immediately and a confirmation email with PDFs will be sent to the buyer. No payment required.
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--gray-mid)', fontSize: '13px', padding: '11px',
                    borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2, background: submitting ? 'rgba(245,158,11,0.5)' : 'var(--gold)',
                    border: 'none', color: '#000', fontSize: '13px', fontWeight: '700',
                    padding: '11px', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                  }}
                >
                  {submitting ? 'Creating…' : 'Create & Send Tickets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

function getDisplayAmount(p) {
  if (p.added_by === 'admin2') {
    const tickets = p.tickets || []
    const price = tickets[0]?.seat_categories?.price || 0
    return price * tickets.length
  }
  return Number(p.total_amount)
}

function PurchaseRow({ purchase: p, expanded, onToggle, displayAmount, onVerify, verifying }) {
    const tickets = p.tickets || []
  const scanned = tickets.filter(t => t.scanned).length

  const formattedDate = new Date(p.created_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const formattedTime = new Date(p.created_at).toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        {/* Buyer */}
        <td style={{ minWidth: '200px' }}>
          <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>
            {p.buyer_name}
          </p>
          <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '2px' }}>
            {p.buyer_email}
          </p>
          {p.buyer_phone && (
            <p style={{ color: 'var(--gray-dark)', fontSize: '11px', marginTop: '1px' }}>
              {p.buyer_phone}
            </p>
          )}
        </td>

        {/* Event */}
        <td style={{ minWidth: '160px' }}>
          <p style={{ color: 'var(--gray-light)', fontSize: '13px' }}>
            {p.events?.name || '—'}
          </p>
        </td>

        {/* Date */}
        <td style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
          <p style={{ color: 'var(--white)', fontSize: '13px' }}>{formattedDate}</p>
          <p style={{ color: 'var(--gray-mid)', fontSize: '11px' }}>{formattedTime}</p>
        </td>

        {/* Tickets */}
        <td style={{ minWidth: '100px' }}>
          <p style={{ color: 'var(--white)', fontSize: '13px' }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
          {tickets.length > 0 && (
            <p style={{ color: scanned > 0 ? '#4ade80' : 'var(--gray-dark)', fontSize: '11px', marginTop: '2px' }}>
              {scanned}/{tickets.length} scanned
            </p>
          )}
        </td>

        {/* Amount */}
        <td style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '16px',
            letterSpacing: '1px', color: 'var(--gold)',
          }}>
            PKR {displayAmount.toLocaleString()}
          </p>
        </td>
{/* Status */}
        <td style={{ minWidth: '160px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: p.status === 'completed' ? 'rgba(34,197,94,0.1)' : p.status === 'whatsapp_pending' ? 'rgba(37,211,102,0.1)' : 'rgba(245,158,11,0.1)',
            border: p.status === 'completed' ? '1px solid rgba(34,197,94,0.3)' : p.status === 'whatsapp_pending' ? '1px solid rgba(37,211,102,0.35)' : '1px solid rgba(245,158,11,0.3)',
            color: p.status === 'completed' ? '#4ade80' : p.status === 'whatsapp_pending' ? '#25D366' : 'var(--gold)',
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
            padding: '4px 10px', borderRadius: '20px',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: p.status === 'completed' ? '#4ade80' : p.status === 'whatsapp_pending' ? '#25D366' : 'var(--gold)',
            }} />
            {p.status === 'whatsapp_pending' ? 'WHATSAPP PENDING' : (p.status?.toUpperCase() || 'UNKNOWN')}
          </span>

          {p.status === 'whatsapp_pending' && (
            <button
              onClick={e => { e.stopPropagation(); onVerify() }}
              disabled={verifying}
              style={{
                display: 'block', marginTop: '6px',
                background: verifying ? 'rgba(37,211,102,0.4)' : '#25D366',
                border: 'none', color: '#000', fontSize: '11px', fontWeight: '700',
                padding: '5px 12px', borderRadius: '14px',
                cursor: verifying ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? 'Verifying…' : '✓ Verify Payment'}
            </button>
          )}
        </td>

        {/* Expand toggle */}
        <td style={{ minWidth: '40px', textAlign: 'center' }}>
          <span style={{
            color: 'var(--gray-mid)', fontSize: '14px',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▾
          </span>
        </td>
      </tr>

      {/* ── Expanded ticket rows ── */}
      {expanded && tickets.length > 0 && (
        <tr>
          <td colSpan={7} style={{ padding: '0', background: 'var(--black-3)' }}>
            <div style={{ padding: '16px 24px' }}>
              <p style={{
                color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600',
                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px',
              }}>
                Tickets in this order
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {tickets.map((t, i) => (
                  <div key={i} style={{
                    background: 'var(--black-2)',
                    border: t.scanned
                      ? '1px solid rgba(34,197,94,0.25)'
                      : '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '8px', padding: '10px 16px',
                    minWidth: '180px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: '16px',
                      letterSpacing: '2px',
                      color: t.scanned ? '#4ade80' : 'var(--gold)',
                    }}>
                      {t.seat_number}
                    </p>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '3px' }}>
                      {t.seat_categories?.name || 'General'}
                    </p>
                    <p style={{
                      color: t.scanned ? '#4ade80' : 'var(--gray-dark)',
                      fontSize: '10px', fontWeight: '700',
                      letterSpacing: '0.5px', marginTop: '4px',
                    }}>
                      {t.scanned ? '✓ SCANNED' : '○ NOT YET SCANNED'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}

      {expanded && tickets.length === 0 && (
        <tr>
          <td colSpan={7} style={{ padding: '14px 24px', background: 'var(--black-3)' }}>
            <p style={{ color: 'var(--gray-dark)', fontSize: '13px' }}>
              No tickets found for this purchase.
            </p>
          </td>
        </tr>
      )}
    </>
  )
}