import { useEffect, useState } from 'react'
import { Link }                from 'react-router-dom'
import { getPortfolio }        from '../lib/api'

export default function Portfolio() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    getPortfolio()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const featured  = items.filter(i => i.is_featured)
  const displayed = filter === 'featured'
    ? featured
    : items

  return (
    <div>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        padding:  '80px 0 64px',
        overflow: 'hidden',
      }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 50% 70% at 80% 40%, rgba(245,158,11,0.07) 0%, transparent 70%),
            var(--black)
          `,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag fade-up" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Our Work
          </span>
          <h1 className="fade-up fade-up-delay-1" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(48px, 7vw, 88px)',
            letterSpacing: '3px',
            marginBottom:  '16px',
          }}>
            PAST EVENTS
          </h1>
          <p className="fade-up fade-up-delay-2" style={{
            color:    'var(--gray-light)',
            fontSize: '16px',
            maxWidth: '520px',
            lineHeight: '1.6',
          }}>
            A track record of unforgettable experiences. From intimate private gatherings
            to large-scale productions here's what we've delivered.
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{
        borderTop:    '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background:   'var(--black-2)',
      }}>
        <div className="container" style={{
          display:  'flex',
          padding:  '28px 24px',
          gap:      '0',
          flexWrap: 'wrap',
        }}>
          {[
            { number: items.length || '—', label: 'Events Managed' },
            { number: items.reduce((s, i) => s + (i.attendees || 0), 0).toLocaleString() || '—', label: 'Total Attendees' },
            { number: featured.length || '—', label: 'Featured Projects' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex:        '1 1 160px',
              padding:     '0 32px',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <p style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '40px',
                letterSpacing: '2px',
                color:         'var(--gold)',
                lineHeight:    '1',
              }}>
                {stat.number}
              </p>
              <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background:   'var(--black-2)',
        position:     'sticky',
        top:          '70px',
        zIndex:       10,
      }}>
        <div className="container" style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          padding:    '14px 24px',
        }}>
          <span style={{ color: 'var(--gray-mid)', fontSize: '13px', marginRight: '8px' }}>
            Show:
          </span>
          {[
            { key: 'all',      label: 'All Events' },
            { key: 'featured', label: 'Featured Only' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background:   filter === f.key ? 'var(--gold)' : 'transparent',
                color:        filter === f.key ? 'var(--black)' : 'var(--gray-light)',
                border:       filter === f.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                fontSize:     '13px',
                fontWeight:   filter === f.key ? '700' : '400',
                padding:      '6px 16px',
                cursor:       'pointer',
                transition:   'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--gray-mid)', fontSize: '13px' }}>
            {displayed.length} project{displayed.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="section">
        <div className="container">

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <div className="spinner" />
            </div>
          )}

          {error && (
            <div style={{
              background:   'rgba(239,68,68,0.1)',
              border:       '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding:      '24px',
              textAlign:    'center',
              color:        '#f87171',
            }}>
              {error}
            </div>
          )}

          {!loading && !error && displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--gray-mid)' }}>
              <p style={{ fontSize: '56px', marginBottom: '20px' }}>🏆</p>
              <p style={{ fontSize: '18px', color: 'var(--white)', marginBottom: '8px' }}>
                No portfolio items yet
              </p>
              <p style={{ fontSize: '14px' }}>Check back soon</p>
            </div>
          )}

          {!loading && !error && displayed.length > 0 && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap:                 '28px',
            }}>
              {displayed.map((item, i) => (
                <PortfolioCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding:     '80px 0',
        background:  'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
        borderTop:   '1px solid rgba(245,158,11,0.15)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Work With Us
          </span>
          <h2 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(36px, 5vw, 60px)',
            letterSpacing: '2px',
            marginBottom:  '16px',
          }}>
            READY TO CREATE YOURS?
          </h2>
          <p style={{
            color:        'var(--gray-light)',
            fontSize:     '15px',
            marginBottom: '36px',
            maxWidth:     '440px',
            margin:       '0 auto 36px',
            lineHeight:   '1.6',
          }}>
            Let's build an event that earns its place on this page.
          </p>
          <Link to="/book-meeting" className="btn-gold" style={{ fontSize: '15px' }}>
            Book a Free Consultation →
          </Link>
        </div>
      </section>

    </div>
  )
}

function PortfolioCard({ item, index }) {
  const {
    client_name, event_name, description,
    image_url, event_date, attendees, is_featured,
  } = item

  const formattedDate = event_date
    ? new Date(event_date).toLocaleDateString('en-PK', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div
      className="card-dark fade-up"
      style={{
        display:           'flex',
        flexDirection:     'column',
        animationDelay:    `${index * 0.07}s`,
        opacity:           0,
        animationFillMode: 'forwards',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', flexShrink: 0 }}>
        {image_url ? (
          <img
            src={image_url}
            alt={event_name}
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              filter:     'brightness(0.75)',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width:           '100%',
            height:          '100%',
            background:      'linear-gradient(135deg, var(--black-3), var(--black-2))',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '52px',
          }}>
            🏆
          </div>
        )}

        {is_featured && (
          <div style={{
            position:     'absolute',
            top:          '12px',
            right:        '12px',
            background:   'rgba(245,158,11,0.9)',
            color:        '#000',
            fontSize:     '10px',
            fontWeight:   '700',
            letterSpacing:'1px',
            padding:      '4px 10px',
            borderRadius: '20px',
          }}>
            FEATURED
          </div>
        )}

        {formattedDate && (
          <div style={{
            position:       'absolute',
            bottom:         '12px',
            left:           '12px',
            background:     'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(8px)',
            border:         '1px solid rgba(245,158,11,0.2)',
            borderRadius:   '6px',
            padding:        '5px 12px',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '1px', color: 'var(--gold)' }}>
              {formattedDate}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>

        <div>
          <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {client_name}
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '1px', color: 'var(--white)', lineHeight: '1.2' }}>
            {event_name}
          </h3>
        </div>

        {description && (
          <p style={{
            color:               'var(--gray-light)',
            fontSize:            '13px',
            lineHeight:          '1.5',
            display:             '-webkit-box',
            WebkitLineClamp:     2,
            WebkitBoxOrient:     'vertical',
            overflow:            'hidden',
          }}>
            {description}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {attendees && (
          <div style={{
            paddingTop:  '12px',
            borderTop:   '1px solid rgba(255,255,255,0.06)',
            display:     'flex',
            alignItems:  'center',
            gap:         '6px',
          }}>
            <span style={{ fontSize: '14px' }}>👥</span>
            <span style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
              {attendees.toLocaleString()} attendees
            </span>
          </div>
        )}
      </div>
    </div>
  )
}