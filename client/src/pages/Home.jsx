import { useEffect, useState } from 'react'
import { Link }                from 'react-router-dom'
import { getEvents, getPortfolio } from '../lib/api'
import EventCard               from '../components/EventCard'

// ── Small portfolio card used only on Home ──────────────────
function PortfolioPreviewCard({ item }) {
  const { client_name, event_name, image_url, is_featured } = item
  return (
    <Link to="/portfolio" className="card-dark" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        {image_url ? (
          <img src={image_url} alt={event_name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--black-3), var(--black-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px' }}>
            🏆
          </div>
        )}
        {is_featured && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(245,158,11,0.9)', color: '#000',
            fontSize: '9px', fontWeight: '700', letterSpacing: '1px', padding: '3px 8px', borderRadius: '20px',
          }}>
            FEATURED
          </span>
        )}
      </div>
      <div style={{ padding: '18px' }}>
        <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
          {client_name}
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '19px', letterSpacing: '1px', color: 'var(--white)' }}>
          {event_name}
        </p>
      </div>
    </Link>
  )
}

// ── Main Home Page ───────────────────────────────────────────
export default function Home() {
  const [events,           setEvents]           = useState([])
  const [portfolio,        setPortfolio]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [fontsReady,       setFontsReady]       = useState(false)

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setFontsReady(true))
    } else {
      setFontsReady(true)
    }
  }, [])

  useEffect(() => {
    getEvents()
      .then(data => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getPortfolio()
      .then(data => setPortfolio(data))
      .catch(console.error)
      .finally(() => setPortfolioLoading(false))
  }, [])

  const gridEvents    = events.slice(0, 3)
  const gridPortfolio = portfolio.slice(0, 3)

  const visibilityStyle = fontsReady ? {} : { visibility: 'hidden' }

  return (
    <div style={visibilityStyle}>

      {/* ── Hero (static, no slideshow) ─────────────────── */}
      <section style={{
        position:   'relative',
        minHeight:  '100vh',
        display:    'flex',
        alignItems: 'center',
        overflow:   'hidden',
      }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 80% 60% at 60% 40%, rgba(245,158,11,0.12) 0%, transparent 70%),
            var(--black)
          `,
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '70px' }}>
          <div style={{ maxWidth: '680px' }}>
            <div className="tag fade-up" style={{ marginBottom: '24px' }}>
              Pakistan's Premier Event Platform
            </div>
            <h1 className="fade-up fade-up-delay-1" style={{
              fontFamily:   'var(--font-display)',
              fontSize:     'clamp(52px, 8vw, 110px)',
              lineHeight:   '0.95',
              marginBottom: '24px',
            }}>
              MAKE EVERY{' '}
              <span className="text-gold-gradient">EVENT</span>
              {' '}UNFORGETTABLE
            </h1>
            <p className="fade-up fade-up-delay-2" style={{
              color:        'var(--gray-light)',
              fontSize:     'clamp(15px, 2vw, 18px)',
              lineHeight:   '1.6',
              marginBottom: '40px',
              maxWidth:     '520px',
            }}>
              From intimate gatherings to grand spectacles, We manage every detail
              so you can simply experience the moment.
            </p>
            <div className="fade-up fade-up-delay-3" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/events" className="btn-gold" style={{ fontSize: '15px' }}>Browse Events →</Link>
              <Link to="/book-meeting" className="btn-ghost" style={{ fontSize: '15px' }}>Work With Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Portfolio (preview) ──────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-end',
            marginBottom:   '48px',
            flexWrap:       'wrap',
            gap:            '16px',
          }}>
            <div>
              <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
                Our Work
              </span>
              <h2 style={{
                fontFamily:    'var(--font-display)',
                fontSize:      'clamp(36px, 5vw, 56px)',
                letterSpacing: '2px',
              }}>
                OUR PORTFOLIO
              </h2>
            </div>
            <Link to="/portfolio" className="btn-ghost">View Full Portfolio →</Link>
          </div>

          {portfolioLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner" />
            </div>
          ) : gridPortfolio.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
              <p style={{ fontSize: '16px' }}>No portfolio items yet. Check back soon!</p>
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap:                 '24px',
            }}>
              {gridPortfolio.map(item => (
                <PortfolioPreviewCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Book a Meeting (CTA) ─────────────────────── */}
      <section style={{
        padding:      '80px 0',
        background:   'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
        borderTop:    '1px solid rgba(245,158,11,0.15)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(36px, 5vw, 64px)',
            letterSpacing: '2px',
            marginBottom:  '16px',
          }}>
            PLANNING AN EVENT?
          </h2>
          <p style={{
            color:       'var(--gray-light)',
            fontSize:    '16px',
            margin:      '0 auto 36px',
            maxWidth:    '480px',
          }}>
            Let us handle everything: From ticketing to on-ground management.
          </p>
          <Link to="/book-meeting" className="btn-gold" style={{ fontSize: '15px' }}>
            Book a Free Consultation →
          </Link>
        </div>
      </section>

      {/* ── Upcoming Events Grid ─────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-end',
            marginBottom:   '48px',
            flexWrap:       'wrap',
            gap:            '16px',
          }}>
            <div>
              <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
                On Sale Now
              </span>
              <h2 style={{
                fontFamily:    'var(--font-display)',
                fontSize:      'clamp(36px, 5vw, 56px)',
                letterSpacing: '2px',
              }}>
                UPCOMING EVENTS
              </h2>
            </div>
            <Link to="/events" className="btn-ghost">View All Events →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner" />
            </div>
          ) : gridEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-mid)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎭</p>
              <p style={{ fontSize: '16px' }}>No upcoming events right now. Check back soon!</p>
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap:                 '24px',
            }}>
              {gridEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Link to How It Works ─────────────────────── */}
      <section className="section" style={{ background: 'var(--black-2)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(28px, 4vw, 44px)',
            letterSpacing: '2px',
            marginBottom:  '16px',
          }}>
            CURIOUS HOW BOOKING WORKS?
          </h2>
          <p style={{ color: 'var(--gray-mid)', fontSize: '15px', marginBottom: '28px' }}>
            See our simple 4-step process from browsing to entry.
          </p>
          <Link to="/how-it-works" className="btn-ghost">See How It Works →</Link>
        </div>
      </section>

    </div>
  )
}