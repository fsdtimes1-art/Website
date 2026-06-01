import { useEffect, useState } from 'react'
import { Link }                from 'react-router-dom'
import { getDashboard }        from '../lib/api'
import StatCard                from '../Components/StatCard'

export default function Dashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>

      {/* ── Page header ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '36px',
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
            Overview
          </p>
          <h1 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '40px',
            letterSpacing: '3px',
            color:         'var(--white)',
            lineHeight:    '1',
          }}>
            DASHBOARD
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/events/new" className="btn-gold" style={{ fontSize: '13px', padding: '10px 20px' }}>
            + New Event
          </Link>
          <Link to="/scan" className="btn-ghost" style={{ fontSize: '13px', padding: '10px 20px' }}>
            📷 Scan Ticket
          </Link>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background:   'rgba(239,68,68,0.1)',
          border:       '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding:      '20px 24px',
          color:        '#f87171',
          fontSize:     '14px',
          display:      'flex',
          gap:          '10px',
          alignItems:   'center',
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {data && (
        <>
          {/* ── Stat cards ── */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 '20px',
            marginBottom:        '40px',
          }}>
            <StatCard
              label="Total Revenue"
              value={`PKR ${Number(data.totalRevenue).toLocaleString()}`}
              icon="💰"
              sub="From completed purchases"
              highlight
            />
            <StatCard
              label="Tickets Sold"
              value={data.totalTickets.toLocaleString()}
              icon="🎟️"
              sub={`${data.scannedTickets} scanned at entry`}
            />
            <StatCard
              label="Active Events"
              value={data.activeEvents}
              icon="🎭"
              sub={`${data.totalEvents} total events`}
            />
            <StatCard
              label="Scan Rate"
              value={
                data.totalTickets > 0
                  ? `${Math.round((data.scannedTickets / data.totalTickets) * 100)}%`
                  : '—'
              }
              icon="📷"
              sub={`${data.scannedTickets} of ${data.totalTickets} scanned`}
            />
          </div>

          {/* ── Divider ── */}
          <div className="divider" style={{ marginBottom: '36px' }} />

          {/* ── Per-event breakdown ── */}
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '22px',
              letterSpacing: '2px',
              color:         'var(--white)',
            }}>
              EVENT BREAKDOWN
            </h2>
            <Link
              to="/events"
              style={{
                color:          'var(--gold)',
                fontSize:       '13px',
                textDecoration: 'none',
                fontWeight:     '500',
              }}
            >
              Manage Events →
            </Link>
          </div>

          <div style={{
            background:   'var(--black-2)',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            overflow:     'hidden',
          }}>
            {data.eventStats.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-mid)' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎭</p>
                <p>No events yet. <Link to="/events/new" style={{ color: 'var(--gold)' }}>Create one →</Link></p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Tickets Sold</th>
                      <th>Revenue</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.eventStats.map(event => (
                      <DashboardEventRow key={event.id} event={event} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Quick links ── */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap:                 '16px',
            marginTop:           '36px',
          }}>
            {[
              { to: '/purchases', icon: '🧾', label: 'View All Purchases',  desc: 'Browse every ticket buyer' },
              { to: '/scan',      icon: '📷', label: 'Scan Tickets',        desc: 'QR code entry scanner' },
              { to: '/portfolio', icon: '🏆', label: 'Manage Portfolio',    desc: 'Add past event showcases' },
              { to: '/events/new',icon: '➕', label: 'Create New Event',    desc: 'Set up ticketing in minutes' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '8px',
                  padding:       '20px',
                  background:    'var(--black-2)',
                  border:        '1px solid rgba(255,255,255,0.06)',
                  borderRadius:  '10px',
                  textDecoration:'none',
                  transition:    'border-color 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'
                  e.currentTarget.style.transform   = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.transform   = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <p style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      '16px',
                  letterSpacing: '1px',
                  color:         'var(--white)',
                }}>
                  {item.label}
                </p>
                <p style={{ color: 'var(--gray-mid)', fontSize: '12px' }}>
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>

        </>
      )}
    </div>
  )
}

function DashboardEventRow({ event }) {
  const isPast = new Date(event.date) < new Date()

  const formattedDate = new Date(event.date).toLocaleDateString('en-PK', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>
            {event.name}
          </p>
          {isPast && (
            <span style={{
              fontSize:   '10px',
              color:      'var(--gray-mid)',
              background: 'rgba(255,255,255,0.06)',
              padding:    '1px 6px',
              borderRadius: '10px',
            }}>
              PAST
            </span>
          )}
        </div>
      </td>

      <td>
        <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>
          {formattedDate}
        </span>
      </td>

      <td>
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '18px',
          letterSpacing: '1px',
          color:         event.tickets_sold > 0 ? 'var(--white)' : 'var(--gray-dark)',
        }}>
          {event.tickets_sold.toLocaleString()}
        </span>
      </td>

      <td>
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '18px',
          letterSpacing: '1px',
          color:         event.revenue > 0 ? 'var(--gold)' : 'var(--gray-dark)',
        }}>
          {event.revenue > 0 ? `PKR ${Number(event.revenue).toLocaleString()}` : '—'}
        </span>
      </td>

      <td>
        <span style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '5px',
          background:    event.is_active
                           ? 'rgba(34,197,94,0.1)'
                           : 'rgba(239,68,68,0.1)',
          border:        event.is_active
                           ? '1px solid rgba(34,197,94,0.3)'
                           : '1px solid rgba(239,68,68,0.3)',
          color:         event.is_active ? '#4ade80' : '#f87171',
          fontSize:      '10px',
          fontWeight:    '700',
          letterSpacing: '0.5px',
          padding:       '4px 10px',
          borderRadius:  '20px',
        }}>
          <span style={{
            width:        '5px',
            height:       '5px',
            borderRadius: '50%',
            background:   event.is_active ? '#4ade80' : '#f87171',
          }} />
          {event.is_active ? 'LIVE' : 'HIDDEN'}
        </span>
      </td>

      <td>
        <Link
          to={`/events/${event.id}/edit`}
          style={{
            color:          'var(--gold)',
            fontSize:       '12px',
            textDecoration: 'none',
            fontWeight:     '500',
          }}
        >
          Edit →
        </Link>
      </td>
    </tr>
  )
}