import { useEffect, useState } from 'react'
import { getEvents }           from '../lib/api'
import EventCard               from '../components/EventCard'

export default function Events() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = events.filter(event => {
    const totalSeats = event.seat_categories.reduce((s, c) => s + c.total_seats, 0)
    const soldSeats  = event.seat_categories.reduce((s, c) => s + c.sold_seats,  0)
    const soldOut    = totalSeats > 0 && soldSeats >= totalSeats
    if (filter === 'available') return !soldOut
    if (filter === 'soldout')   return soldOut
    return true
  })

  return (
    <div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .event-fade {
          opacity: 0;
          animation: fadeUp 0.5s ease forwards;
        }
        .filter-btn {
          transition: all 0.2s;
        }
        .filter-btn:hover {
          border-color: rgba(245,158,11,0.5) !important;
          color: var(--white) !important;
        }
      `}</style>

      {/* ── Hero Header ── */}
      <section style={{
        position: 'relative',
        padding:  '96px 0 72px',
        overflow: 'hidden',
      }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 70% 60% at 10% 50%, rgba(245,158,11,0.07) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 90% 20%, rgba(245,158,11,0.04) 0%, transparent 60%),
            var(--black)
          `,
        }} />

        {/* Decorative lines */}
        <div style={{
          position:   'absolute',
          top:        0, left: 0, right: 0, bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.015) 0px,
            rgba(255,255,255,0.015) 1px,
            transparent 1px,
            transparent 80px
          )`,
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        '8px',
            background: 'rgba(245,158,11,0.1)',
            border:     '1px solid rgba(245,158,11,0.25)',
            borderRadius:'20px',
            padding:    '5px 14px',
            marginBottom:'20px',
          }}>
            <span style={{
              width:'7px', height:'7px', borderRadius:'50%',
              background:'var(--gold)',
              boxShadow: '0 0 8px var(--gold)',
              display:   'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>

          <h1 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(44px, 6vw, 80px)',
            letterSpacing: '3px',
            lineHeight:    '1.05',
            marginBottom:  '18px',
          }}>
            UPCOMING<br />
            <span style={{ color: 'var(--gold)' }}>EVENTS</span>
          </h1>

          <p style={{
            color:    'var(--gray-light)',
            fontSize: '16px',
            maxWidth: '440px',
            lineHeight:'1.65',
          }}>
            Secure your seat before they're gone. All events include instant
            e-ticket delivery.
          </p>
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <div style={{
        borderTop:    '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   'rgba(10,10,10,0.9)',
        backdropFilter:'blur(12px)',
        position:     'sticky',
        top:          '70px',
        zIndex:       10,
      }}>
        <div className="container" style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          padding:    '12px 24px',
        }}>
          <span style={{ color:'var(--gray-mid)', fontSize:'12px', fontWeight:'600',
            letterSpacing:'1px', textTransform:'uppercase', marginRight:'4px' }}>
            Show:
          </span>

          {[
            { key: 'all',       label: 'All Events' },
            { key: 'available', label: 'Available'  },
            { key: 'soldout',   label: 'Sold Out'   },
          ].map(f => (
            <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)} style={{
              background:   filter === f.key ? 'var(--gold)' : 'transparent',
              color:        filter === f.key ? '#000' : 'var(--gray-light)',
              border:       filter === f.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              fontSize:     '13px',
              fontWeight:   filter === f.key ? '700' : '400',
              padding:      '6px 18px',
              cursor:       'pointer',
            }}>
              {f.label}
            </button>
          ))}

          <span style={{ marginLeft:'auto', color:'var(--gray-mid)', fontSize:'13px' }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="section">
        <div className="container">

          {loading && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'400px' }}>
              <div style={{ textAlign:'center' }}>
                <div className="spinner" style={{ margin:'0 auto 16px' }} />
                <p style={{ color:'var(--gray-mid)', fontSize:'14px' }}>Loading events...</p>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:'10px', padding:'24px', textAlign:'center', color:'#f87171',
            }}>
              <p style={{ fontSize:'16px', marginBottom:'8px' }}>Failed to load events</p>
              <p style={{ fontSize:'13px', opacity:0.7 }}>{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'100px 0', color:'var(--gray-mid)' }}>
              <p style={{ fontSize:'56px', marginBottom:'20px' }}>🎭</p>
              <p style={{ fontSize:'18px', color:'var(--white)', marginBottom:'8px' }}>No events found</p>
              <p style={{ fontSize:'14px' }}>
                {filter !== 'all' ? 'Try changing your filter' : 'Check back soon for upcoming events'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap:                 '28px',
            }}>
              {filtered.map((event, i) => (
                <div key={event.id} className="event-fade"
                  style={{ animationDelay:`${i * 0.07}s` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </div>
  )
}