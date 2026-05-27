// admin/src/pages/Purchases.jsx
import { useEffect, useState } from 'react'
import { getPurchases, getAdminEvents } from '../lib/api'

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [eventId,   setEventId]   = useState('')
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(null)

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

        {/* Refresh */}
        <button
          onClick={fetchPurchases}
          style={{
            marginLeft: 'auto',
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
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

function PurchaseRow({ purchase: p, expanded, onToggle }) {
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
            PKR {Number(p.total_amount).toLocaleString()}
          </p>
        </td>

        {/* Status */}
        <td style={{ minWidth: '100px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: p.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            border: p.status === 'completed' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
            color: p.status === 'completed' ? '#4ade80' : 'var(--gold)',
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
            padding: '4px 10px', borderRadius: '20px',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: p.status === 'completed' ? '#4ade80' : 'var(--gold)',
            }} />
            {p.status?.toUpperCase() || 'UNKNOWN'}
          </span>
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