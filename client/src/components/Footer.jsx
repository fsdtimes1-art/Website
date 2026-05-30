import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background:   'var(--black-2)',
      borderTop:    '1px solid rgba(245,158,11,0.12)',
      paddingTop:   '64px',
      paddingBottom:'32px',
      marginTop:    'auto',
    }}>
      <div className="container">

        {/* Top row */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '48px',
          marginBottom:        '48px',
        }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '28px',
                letterSpacing: '4px',
                color:         'var(--gold)',
              }}>
                FAISALABAD<span style={{ color: 'var(--white)' }}>TIMES.CO</span>
              </span>
            </Link>
            <p style={{
              color:      'var(--gray-mid)',
              fontSize:   '14px',
              lineHeight: '1.6',
              marginTop:  '12px',
              maxWidth:   '240px',
            }}>
              Premium event experiences, flawlessly managed from first ticket to final curtain.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '16px',
              letterSpacing: '2px',
              color:         'var(--white)',
              marginBottom:  '16px',
            }}>
              NAVIGATE
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Upcoming Events', path: '/events' },
                { label: 'Our Portfolio',   path: '/portfolio' },
                { label: 'Book a Meeting',  path: '/book-meeting' },
              ].map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    color:          'var(--gray-mid)',
                    fontSize:       '14px',
                    textDecoration: 'none',
                    transition:     'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-mid)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '16px',
              letterSpacing: '2px',
              color:         'var(--white)',
              marginBottom:  '16px',
            }}>
              CONTACT
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '📧', label: 'hello@FaisalabadTimes.co.com', href: 'mailto:hello@FaisalabadTimes.co.com' },
                { icon: '📱', label: '+92 300 123 4567', href: 'tel:+923001234567' },
                { icon: '📍', label: 'Faisalabad, Pakistan', href: 'https://maps.google.com/?q=Faisalabad,+Pakistan', target: '_blank', rel: 'noreferrer' },
                { icon: '📸', label: 'Instagram', href: 'https://www.instagram.com/faisalabadtimes/', target: '_blank', rel: 'noreferrer' },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target={item.target}
                  rel={item.rel}
                  style={{
                    color: 'var(--white)',
                    fontSize: '14px',
                    margin: 0,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '16px',
              letterSpacing: '2px',
              color:         'var(--white)',
              marginBottom:  '16px',
            }}>
              READY TO START?
            </p>
            <p style={{
              color:        'var(--gray-mid)',
              fontSize:     '14px',
              lineHeight:   '1.6',
              marginBottom: '20px',
            }}>
              Planning an event? Let's make it unforgettable together.
            </p>
            <Link to="/book-meeting" className="btn-gold" style={{
              fontSize: '13px',
              padding:  '10px 22px',
            }}>
              Book a Meeting
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: '24px' }} />

        {/* Bottom row */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          flexWrap:       'wrap',
          gap:            '12px',
        }}>
          <p style={{ color: 'var(--gray-dark)', fontSize: '12px' }}>
            © {year} FaisalabadTimes.co. All rights reserved.
          </p>
          <p style={{ color: 'var(--gray-dark)', fontSize: '12px' }}>
            Built for Pakistan's finest events.
          </p>
        </div>

      </div>
    </footer>
  )
}