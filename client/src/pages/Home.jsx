import { useEffect, useState, useRef, useCallback } from 'react'
import { Link }                                      from 'react-router-dom'
import { getEvents, getPortfolio }                   from '../lib/api'
import EventCard                                     from '../components/EventCard'

// ── Hero Slider ──────────────────────────────────────────────
function HeroSlider({ events }) {
  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef                  = useRef(null)
  const currentRef                = useRef(0)

  // Keep ref in sync so the interval callback always sees latest value
  useEffect(() => { currentRef.current = current }, [current])

  const goTo = useCallback((idx) => {
    if (animating) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 700)
  }, [animating])

  // Stable interval never re-registers, reads currentRef instead of stale closure
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % events.length
      setAnimating(true)
      setCurrent(next)
      setTimeout(() => setAnimating(false), 700)
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [events.length]) // only re-run if number of events changes

  if (!events.length) return null

  const formatDate = (str) => {
    if (!str) return ''
    const d = new Date(str)
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <section style={{
      position:  'relative',
      height:    '100vh',
      minHeight: '600px',
      overflow:  'hidden',
    }}>
      {/* Slides */}
      {events.map((ev, i) => (
        <div
          key={ev.id}
          style={{
            position:   'absolute',
            inset:      0,
            opacity:    i === current ? 1 : 0,
            transition: 'opacity 0.8s ease',
            zIndex:     i === current ? 1 : 0,
          }}
        >
          {/* Background image NO zoom/scale */}
          {ev.image_url ? (
            <div style={{
              position:           'absolute',
              inset:              0,
              backgroundImage:    `url(${ev.image_url})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              // zoom effect removed intentionally
            }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--black-2)' }} />
          )}

          {/* Overlay reduced opacity for a lighter shade */}
          <div style={{
            position:   'absolute',
            inset:      0,
            background: `
              linear-gradient(to right, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.28) 60%, transparent 100%),
              linear-gradient(to top,   rgba(10,10,10,0.45) 0%, transparent 50%)
            `,
          }} />
        </div>
      ))}

      {/* Content */}
      <div className="container" style={{
        position:   'relative',
        zIndex:     2,
        height:     '100%',
        display:    'flex',
        alignItems: 'center',
        paddingTop: '70px',
      }}>
        <div style={{ maxWidth: '620px' }}>

          <div
            key={`tag-${current}`}
            className="slide-in"
            style={{
              marginBottom: '20px', display: 'inline-block',
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
              color: '#fcd34d', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px',
            }}
          >
            Upcoming Event
          </div>

          <h1
            key={`title-${current}`}
            className="slide-in"
            style={{
              fontFamily:        'var(--font-display)',
              fontSize:          'clamp(48px, 7vw, 96px)',
              lineHeight:        '0.95',
              marginBottom:      '20px',
              color:             '#fff',
              animationDelay:    '0.1s',
              opacity:           0,
              animationFillMode: 'forwards',
            }}
          >
            {events[current]?.name}
          </h1>

          <div
            key={`meta-${current}`}
            className="slide-in"
            style={{
              display:           'flex',
              gap:               '24px',
              marginBottom:      '32px',
              flexWrap:          'wrap',
              animationDelay:    '0.2s',
              opacity:           0,
              animationFillMode: 'forwards',
            }}
          >
            {events[current]?.date && (
              <span style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '500' }}>
                📅 {formatDate(events[current].date)}
              </span>
            )}
            {events[current]?.venue && (
              <span style={{ color: 'var(--gray-light)', fontSize: '14px' }}>
                📍 {events[current].venue}
              </span>
            )}
          </div>

          {events[current]?.description && (
            <p
              key={`desc-${current}`}
              className="slide-in"
              style={{
                color:             'var(--gray-light)',
                fontSize:          '15px',
                lineHeight:        '1.6',
                marginBottom:      '36px',
                maxWidth:          '480px',
                animationDelay:    '0.25s',
                opacity:           0,
                animationFillMode: 'forwards',
                display:           '-webkit-box',
                WebkitLineClamp:   3,
                WebkitBoxOrient:   'vertical',
                overflow:          'hidden',
              }}
            >
              {events[current].description}
            </p>
          )}

          <div
            key={`cta-${current}`}
            className="slide-in"
            style={{
              display:           'flex',
              gap:               '16px',
              flexWrap:          'wrap',
              animationDelay:    '0.3s',
              opacity:           0,
              animationFillMode: 'forwards',
            }}
          >
            <Link
              to={`/events/${events[current]?.id}/whatsapp`}
              className="btn-gold"
              style={{ fontSize: '15px', background: '#25D366', color: '#000' }}
            >
              💬 Get Tickets
            </Link>
            <Link to="/events" className="btn-ghost" style={{ fontSize: '15px' }}>
              All Events
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{
        position:  'absolute',
        bottom:    '40px',
        left:      '50%',
        transform: 'translateX(-50%)',
        display:   'flex',
        gap:       '10px',
        zIndex:    3,
      }}>
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              clearInterval(timerRef.current)
              goTo(i)
              // restart interval from this point
              timerRef.current = setInterval(() => {
                const next = (currentRef.current + 1) % events.length
                setAnimating(true)
                setCurrent(next)
                setTimeout(() => setAnimating(false), 700)
              }, 5000)
            }}
            style={{
              width:        i === current ? '28px' : '8px',
              height:       '8px',
              borderRadius: '4px',
              background:   i === current ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
              border:       'none',
              cursor:       'pointer',
              padding:      0,
              transition:   'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{
        position:      'absolute',
        bottom:        '40px',
        right:         '40px',
        zIndex:        3,
        fontFamily:    'var(--font-display)',
        fontSize:      '14px',
        color:         'rgba(255,255,255,0.4)',
        letterSpacing: '2px',
      }}>
        {String(current + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}
      </div>

      {/* Bottom fade */}
      <div style={{
        position:      'absolute',
        bottom:        0,
        left:          0,
        right:         0,
        height:        '120px',
        background:    'linear-gradient(to bottom, transparent, var(--black))',
        zIndex:        1,
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-in {
          animation: slideIn 0.6s ease forwards;
        }
      `}</style>
    </section>
  )
}

// ── Main Home Page ───────────────────────────────────────────
export default function Home() {
  const [events,       setEvents]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [fontsReady,   setFontsReady]   = useState(false)

  // Wait for fonts to load before rendering prevents FOUT flash
  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setFontsReady(true))
    } else {
      setFontsReady(true) // fallback for browsers without Font Loading API
    }
  }, [])

  useEffect(() => {
    getEvents()
      .then(data => setEvents(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sliderEvents = events.slice(0, 5)
  const gridEvents   = events.slice(0, 3)

  // Keep layout stable while fonts load invisible until ready
  const visibilityStyle = fontsReady ? {} : { visibility: 'hidden' }

  return (
    <div style={visibilityStyle}>

      {/* ── Hero Slider ─────────────────────────────────── */}
      {loading ? (
        <section style={{
          height:         '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'var(--black)',
          paddingTop:     '70px',
        }}>
          <div className="spinner" />
        </section>
      ) : sliderEvents.length > 0 ? (
        <HeroSlider events={sliderEvents} />
      ) : (
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
      )}

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

      {/* ── How It Works ─────────────────────────────── */}
      <section className="section" style={{ background: 'var(--black-2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
              Simple Process
            </span>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(36px, 5vw, 56px)',
              letterSpacing: '2px',
            }}>
              HOW IT WORKS
            </h2>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 '32px',
          }}>
            {[
              { step: '01', icon: '🎟️', title: 'Browse Events',   desc: 'Explore upcoming events and find the ones that excite you most.' },
              { step: '02', icon: '💺', title: 'Choose Your Seat', desc: 'Pick your preferred category: VIP, Premium, or General.' },
              { step: '03', icon: '💳', title: 'Secure Payment',   desc: 'Pay safely via card through our Stripe-powered checkout.' },
              { step: '04', icon: '📧', title: 'Get Your Ticket',  desc: 'Receive a PDF ticket with QR code instantly in your inbox.' },
            ].map((item, i) => (
              <div key={i} style={{
                position:     'relative',
                padding:      '32px 24px',
                background:   'var(--black-3)',
                borderRadius: '12px',
                border:       '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  position:   'absolute',
                  top:        '16px',
                  right:      '20px',
                  fontFamily: 'var(--font-display)',
                  fontSize:   '52px',
                  color:      'var(--gold)',
                  lineHeight: '1',
                  userSelect: 'none',
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      '20px',
                  letterSpacing: '1px',
                  color:         'var(--white)',
                  marginBottom:  '10px',
                }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--gray-mid)', fontSize: '14px', lineHeight: '1.6' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
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

    </div>
  )
}