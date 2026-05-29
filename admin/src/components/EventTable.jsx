import { Link } from 'react-router-dom'

export default function EventTable({ events, onToggle, onDelete, loading }) {

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div className="spinner" />
    </div>
  )

  if (!events || events.length === 0) return (
    <div style={{
      textAlign:  'center',
      padding:    '80px 0',
      color:      'var(--gray-mid)',
    }}>
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎭</p>
      <p style={{ fontSize: '16px', color: 'var(--white)', marginBottom: '6px' }}>
        No events yet
      </p>
      <p style={{ fontSize: '13px' }}>
        Create your first event to get started
      </p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Venue</th>
            <th>Categories</th>
            <th>Sold / Total</th>
            <th>Revenue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <EventRow
              key={event.id}
              event={event}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventRow({ event, onToggle, onDelete }) {
  const cats        = event.seat_categories || []
  const totalSeats  = cats.reduce((s, c) => s + c.total_seats, 0)
  const soldSeats   = cats.reduce((s, c) => s + c.sold_seats,  0)
  const soldPct     = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0
  const revenue     = cats.reduce((s, c) => s + (c.sold_seats * Number(c.price)), 0)
  const isPast      = new Date(event.date) < new Date()

  const formattedDate = new Date(event.date).toLocaleDateString('en-PK', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })

  const formattedTime = new Date(event.date).toLocaleTimeString('en-PK', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  function handleDelete() {
    if (window.confirm(`Delete "${event.name}"? This cannot be undone.`)) {
      onDelete(event.id)
    }
  }

  return (
    <tr>

      {/* Event name + image */}
      <td style={{ minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width:        '44px',
            height:       '44px',
            borderRadius: '6px',
            overflow:     'hidden',
            flexShrink:   0,
            background:   'var(--black-3)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontSize:     '20px',
          }}>
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : '🎭'}
          </div>
          <div>
            <p style={{
              color:        'var(--white)',
              fontSize:     '14px',
              fontWeight:   '500',
              marginBottom: '2px',
            }}>
              {event.name}
            </p>
            {isPast && (
              <span style={{
                fontSize:      '10px',
                color:         'var(--gray-mid)',
                background:    'rgba(255,255,255,0.06)',
                padding:       '1px 6px',
                borderRadius:  '10px',
                letterSpacing: '0.5px',
              }}>
                PAST
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Date */}
      <td style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>
        <p style={{ color: 'var(--white)', fontSize: '13px' }}>{formattedDate}</p>
        <p style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>{formattedTime}</p>
      </td>

      {/* Venue */}
      <td style={{ minWidth: '140px' }}>
        <p style={{
          color:     'var(--gray-light)',
          fontSize:  '13px',
          maxWidth:  '160px',
          overflow:  'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {event.venue}
        </p>
      </td>

      {/* Categories */}
      <td style={{ minWidth: '140px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {cats.length === 0 ? (
            <span style={{ color: 'var(--gray-dark)', fontSize: '12px' }}>—</span>
          ) : cats.map(cat => (
            <span key={cat.id} style={{
              background:    'rgba(245,158,11,0.08)',
              border:        '1px solid rgba(245,158,11,0.15)',
              color:         'var(--gold)',
              fontSize:      '10px',
              fontWeight:    '600',
              padding:       '2px 8px',
              borderRadius:  '20px',
              whiteSpace:    'nowrap',
            }}>
              {cat.name}
            </span>
          ))}
        </div>
      </td>

      {/* Sold / Total + progress bar */}
      <td style={{ minWidth: '130px' }}>
        <p style={{ color: 'var(--white)', fontSize: '13px', marginBottom: '6px' }}>
          {soldSeats} / {totalSeats}
          <span style={{ color: 'var(--gray-mid)', fontSize: '11px', marginLeft: '4px' }}>
            ({soldPct}%)
          </span>
        </p>
        <div style={{
          height:       '4px',
          background:   'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          overflow:     'hidden',
          width:        '100px',
        }}>
          <div style={{
            height:       '100%',
            width:        `${soldPct}%`,
            background:   soldPct >= 100
                            ? '#ef4444'
                            : soldPct > 70
                            ? 'var(--gold)'
                            : '#22c55e',
            borderRadius: '2px',
            transition:   'width 0.4s ease',
          }} />
        </div>
      </td>

      {/* Revenue */}
      <td style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
        <p style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '16px',
          letterSpacing: '1px',
          color:         revenue > 0 ? 'var(--gold)' : 'var(--gray-dark)',
        }}>
          {revenue > 0 ? `PKR ${revenue.toLocaleString()}` : '—'}
        </p>
      </td>

      {/* Status toggle */}
      <td style={{ minWidth: '100px' }}>
        <button
          onClick={() => onToggle(event.id)}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '6px',
            background:   event.is_active
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(239,68,68,0.1)',
            border:       event.is_active
                            ? '1px solid rgba(34,197,94,0.3)'
                            : '1px solid rgba(239,68,68,0.3)',
            color:        event.is_active ? '#4ade80' : '#f87171',
            fontSize:     '11px',
            fontWeight:   '700',
            letterSpacing:'0.5px',
            padding:      '5px 12px',
            borderRadius: '20px',
            cursor:       'pointer',
            transition:   'all 0.2s',
            whiteSpace:   'nowrap',
          }}
        >
          <span style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   event.is_active ? '#4ade80' : '#f87171',
            flexShrink:   0,
          }} />
          {event.is_active ? 'LIVE' : 'HIDDEN'}
        </button>
      </td>

      {/* Actions */}
      <td style={{ minWidth: '120px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link
            to={`/events/${event.id}/edit`}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '4px',
              background:   'rgba(255,255,255,0.05)',
              border:       '1px solid rgba(255,255,255,0.1)',
              color:        'var(--gray-light)',
              fontSize:     '12px',
              padding:      '6px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              transition:   'all 0.15s',
              whiteSpace:   'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'rgba(245,158,11,0.1)'
              e.currentTarget.style.borderColor  = 'rgba(245,158,11,0.3)'
              e.currentTarget.style.color        = 'var(--gold)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background   = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color        = 'var(--gray-light)'
            }}
          >
            ✏️ Edit
          </Link>

          <button
            onClick={handleDelete}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              background:   'transparent',
              border:       '1px solid rgba(239,68,68,0.2)',
              color:        '#f87171',
              fontSize:     '12px',
              padding:      '6px 10px',
              borderRadius: '4px',
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
            title="Delete event"
          >
            🗑️
          </button>
        </div>
      </td>

    </tr>
  )
}
