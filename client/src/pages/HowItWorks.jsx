import { Link } from 'react-router-dom'

export default function HowItWorks() {
  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden' }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 60% 60% at 30% 50%, rgba(245,158,11,0.07) 0%, transparent 70%),
            var(--black)
          `,
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag fade-up" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Simple Process
          </span>
          <h1 className="fade-up fade-up-delay-1" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(40px, 6vw, 72px)',
            letterSpacing: '3px',
            marginBottom:  '16px',
          }}>
            HOW IT WORKS
          </h1>
          <p className="fade-up fade-up-delay-2" style={{
            color:    'var(--gray-light)',
            fontSize: '15px',
            maxWidth: '480px',
            lineHeight: '1.6',
          }}>
            From browsing an event to walking through the door — here's exactly what happens.
          </p>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 '32px',
          }}>
            {[
              { step: '01', icon: '🎟️', title: 'Browse Events',   desc: 'Explore upcoming events and find the ones that excite you most.' },
              { step: '02', icon: '💺', title: 'Choose Your Seat', desc: 'Pick your preferred category: VIP, Premium, or General.' },
              { step: '03', icon: '💳', title: 'Secure Payment',   desc: 'Pay safely via card through our Stripe-powered checkout, or reserve via WhatsApp.' },
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

      {/* ── CTA ── */}
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
            READY TO GET STARTED?
          </h2>
          <p style={{
            color:    'var(--gray-light)',
            fontSize: '16px',
            margin:   '0 auto 36px',
            maxWidth: '480px',
          }}>
            Browse upcoming events or book a free consultation for your own event.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/events" className="btn-gold" style={{ fontSize: '15px' }}>
              Browse Events →
            </Link>
            <Link to="/book-meeting" className="btn-ghost" style={{ fontSize: '15px' }}>
              Book a Meeting
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}