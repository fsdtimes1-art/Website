import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getEvents, getPortfolio } from '../lib/api'
import EventCard               from '../components/EventCard'

const SERVICES = [
  {
    badge:    'Restaurant Digital Marketing',
    live:     false,
    headline: 'FILL YOUR TABLES,\nGROW YOUR BRAND.',
    desc:     'Partner with Faisalabad Times to elevate your digital presence. We combine creative storytelling, professional production, and proven marketing strategies to help businesses reach more customers, strengthen their brand, and achieve measurable growth.',
    features: [
      'Social Media Management',
      'Premium Content Creation',
      'Static Posts & Carousels',
      'Reels & Short Form Videos',
      'Professional Photography',
      'Influencer & Campaign Management',
      'Monthly Performance Reports',
    ],
    highlight: false,
  },
  {
    badge:    'FT Page Business Promotion',
    live:     true,
    headline: 'GET SEEN BY\n70K+ FOLLOWERS.',
    desc:     'Promote your business with premium content and strategic social media campaigns designed to increase visibility, engagement, and brand awareness across Faisalabad.',
    features: [
      'Premium Reel Production with Concept, Shoot & Editing',
      'Static Post Design with Professional Copywriting',
      'Instagram Story Promotions',
      'Reel & Static Post Publishing on Faisalabad Times',
      'Product, Restaurant & Brand Photography',
      'Fast Content Delivery',
    ],
    highlight: true,
  },
  {
    badge:    'Events & Media Coverage',
    live:     true,
    headline: 'WE CAPTURE THE MOMENT.\nYOU CREATE THE EXPERIENCE.',
    desc:     'Professional event coverage that showcases your brand before, during, and after the event through high quality photography, cinematic videos, and engaging social media content.',
    features: [
      'Pre Event Promotional Reel or Post',
      'Professional Photography & Videography',
      'Live Instagram Story Coverage',
      'Premium Cinematic Highlight Reel',
      'Customer Testimonial Videos',
      'Fast Content Delivery',
    ],
    price:    null,
    highlight: false,
  },
  {
    badge:    'Event Partnerships',
    live:     true,
    headline: 'NEED A MEDIA PARTNER OR\nTICKETING PLATFORM?',
    desc:     'Promote your event with Faisalabad Times and let us help you reach the right audience. From official media partnerships to online ticket sales, we simplify event promotion from start to finish.',
    features: [
      'Official Media Partnership',
      'Ticket Sales via FaisalabadTimes.co',
      'Event Listing on Our Website',
      'Promotion Across Social Media Channels',
      'WhatsApp Registration Support',
      'Digital E Ticket Management',
      'Event Performance Insights',
    ],
    highlight: false,
  },
]


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
  const navigate = useNavigate()
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

{/* ── Our Services ──────────────────────────────── */}
      <section className="section" style={{ background: 'var(--black-2)' }}>
        <div className="container">
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(36px, 5vw, 56px)',
              letterSpacing: '2px',
              marginBottom:  '12px',
            }}>
              OUR SERVICES
            </h2>
            <p style={{ color: 'var(--gray-light)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.6' }}>
              Everything you need to grow your brand, fill your seats, and run successful events in Faisalabad.
            </p>
          </div>

          <div className="services-grid">
            {SERVICES.map((svc, i) => (
              <div key={i} className={`service-card${svc.highlight ? ' service-card--highlight' : ''}`}>
                <div className="service-card-inner">

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {svc.live && <span className="service-live-dot" />}
                  </div>

                  <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {svc.badge}
                  </p>

                  <h3 style={{
                    fontFamily:    'var(--font-display)',
                    fontSize:      '24px',
                    letterSpacing: '1.5px',
                    lineHeight:    '1.25',
                    marginBottom:  '12px',
                    whiteSpace:    'pre-line',
                  }}>
                    {svc.headline}
                  </h3>

                  <p style={{ color: 'var(--gray-light)', fontSize: '13px', lineHeight: '1.65', marginBottom: '24px' }}>
                    {svc.desc}
                  </p>

                  <ul className="service-features">
                    {svc.features.map((f, j) => <li key={j}>{f}</li>)}
                  </ul>

                  <div className="service-footer" style={{ justifyContent: svc.price ? 'space-between' : 'center' }}>
                    {svc.price && (
                      <div>
                        <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Starting From
                        </p>
                        <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px' }}>
                          {svc.price}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/book-meeting')}
                      className="btn-gold"
                      style={{
                        fontSize: '13px',
                        padding: '10px 20px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Book Free Meeting
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .services-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            align-items: stretch;
          }
          .service-card {
            background: var(--black-2);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            overflow: hidden;
            transition: border-color 0.25s, transform 0.25s;
            display: flex;
            flex-direction: column;
          }
          .service-card:hover {
            border-color: rgba(245,158,11,0.25);
            transform: translateY(-4px);
          }
          .service-card--highlight {
            border-color: rgba(245,158,11,0.2);
            background: linear-gradient(160deg, rgba(245,158,11,0.06) 0%, var(--black-2) 50%);
          }
          .service-card-inner {
            padding: 28px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .service-live-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 6px #22c55e;
            animation: pulse-dot 2s ease-in-out infinite;
            flex-shrink: 0;
          }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
          .service-features {
            list-style: none;
            padding: 0;
            margin: 0 0 28px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
          }
          .service-features li {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--gray-light);
            font-size: 13px;
            line-height: 1.4;
          }
          .service-features li::before {
            content: '';
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--gold);
            flex-shrink: 0;
            opacity: 0.7;
          }
          .service-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.06);
            gap: 12px;
          }

          @media (max-width: 900px) {
            .services-grid {
              grid-template-columns: 1fr;
              max-width: 480px;
              margin: 0 auto;
            }
          }
        `}</style>
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