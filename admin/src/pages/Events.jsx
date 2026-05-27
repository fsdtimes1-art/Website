import { useEffect, useState }                    from 'react'
import { Link }                                   from 'react-router-dom'
import { getAdminEvents, toggleEvent, deleteEvent } from '../lib/api'
import EventTable                                 from '../Components/EventTable'

export default function Events() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('all') // all | active | hidden | past

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminEvents()
      setEvents(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id) {
    try {
      const updated = await toggleEvent(id)
      setEvents(prev =>
        prev.map(e => e.id === id ? { ...e, is_active: updated.is_active } : e)
      )
    } catch (err) {
      alert(`Failed to toggle event: ${err.message}`)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const filtered = events.filter(event => {
    const isPast = new Date(event.date) < new Date()
    if (filter === 'active') return event.is_active && !isPast
    if (filter === 'hidden') return !event.is_active
    if (filter === 'past')   return isPast
    return true
  })

  const counts = {
    all:    events.length,
    active: events.filter(e => e.is_active && new Date(e.date) >= new Date()).length,
    hidden: events.filter(e => !e.is_active).length,
    past:   events.filter(e => new Date(e.date) < new Date()).length,
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1400px' }}>

      {/* ── Page header ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '32px',
        flexWrap:       'wrap',
        gap:            '16px',
      }}>
        <div>
          <p style={{
            color:         'var(--gray-mid)',
            fontSize:      '11px',
            fontWeight:    '600',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom:  '6px',
          }}>
            Management
          </p>
          <h1 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '40px',
            letterSpacing: '3px',
            color:         'var(--white)',
            lineHeight:    '1',
          }}>
            EVENTS
          </h1>
        </div>

        <Link to="/events/new" className="btn-gold" style={{ fontSize: '13px', padding: '11px 22px' }}>
          + Create New Event
        </Link>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background:   'rgba(239,68,68,0.1)',
          border:       '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding:      '14px 18px',
          color:        '#f87171',
          fontSize:     '13px',
          marginBottom: '24px',
          display:      'flex',
          gap:          '10px',
          alignItems:   'center',
          justifyContent: 'space-between',
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={fetchEvents}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border:     '1px solid rgba(239,68,68,0.3)',
              color:      '#f87171',
              fontSize:   '12px',
              padding:    '5px 12px',
              borderRadius:'4px',
              cursor:     'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        marginBottom: '24px',
        flexWrap:     'wrap',
      }}>
        {[
          { key: 'all',    label: 'All'    },
          { key: 'active', label: 'Live'   },
          { key: 'hidden', label: 'Hidden' },
          { key: 'past',   label: 'Past'   },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '6px',
              background:   filter === f.key ? 'var(--gold)' : 'transparent',
              color:        filter === f.key ? 'var(--black)' : 'var(--gray-light)',
              border:       filter === f.key
                              ? '1px solid var(--gold)'
                              : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize:     '13px',
              fontWeight:   filter === f.key ? '700' : '400',
              padding:      '6px 14px',
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
          >
            {f.label}
            <span style={{
              background:   filter === f.key
                              ? 'rgba(0,0,0,0.15)'
                              : 'rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize:     '10px',
              fontWeight:   '700',
              padding:      '1px 6px',
              minWidth:     '20px',
              textAlign:    'center',
            }}>
              {counts[f.key]}
            </span>
          </button>
        ))}

        {/* Refresh */}
        <button
          onClick={fetchEvents}
          style={{
            marginLeft:   'auto',
            background:   'transparent',
            border:       '1px solid rgba(255,255,255,0.08)',
            color:        'var(--gray-mid)',
            fontSize:     '12px',
            padding:      '6px 14px',
            borderRadius: '20px',
            cursor:       'pointer',
            transition:   'all 0.15s',
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'
            e.currentTarget.style.color       = 'var(--gold)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color       = 'var(--gray-mid)'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Table card ── */}
      <div style={{
        background:   'var(--black-2)',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow:     'hidden',
      }}>

        {/* Table header row */}
        <div style={{
          padding:        '16px 24px',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
        }}>
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '16px',
            letterSpacing: '2px',
            color:         'var(--white)',
          }}>
            {filter === 'all'    && 'ALL EVENTS'}
            {filter === 'active' && 'LIVE EVENTS'}
            {filter === 'hidden' && 'HIDDEN EVENTS'}
            {filter === 'past'   && 'PAST EVENTS'}
          </p>
          <span style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <EventTable
          events={filtered}
          loading={loading}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Help note ── */}
      {!loading && events.length > 0 && (
        <div style={{
          marginTop:    '20px',
          padding:      '14px 18px',
          background:   'rgba(245,158,11,0.04)',
          border:       '1px solid rgba(245,158,11,0.1)',
          borderRadius: '8px',
          display:      'flex',
          gap:          '10px',
          alignItems:   'flex-start',
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
          <p style={{ color: 'var(--gray-mid)', fontSize: '12px', lineHeight: '1.6' }}>
            Use the <strong style={{ color: 'var(--gold)' }}>LIVE / HIDDEN</strong> toggle to show
            or hide events from the public site without deleting them. Events with existing
            purchases cannot be deleted — hide them instead.
          </p>
        </div>
      )}

    </div>
  )
}