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
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <img
                src="/favicon.png"
                alt="FaisalabadTimes.co"
                style={{ height: '48px', width: 'auto' }}
              />
            </Link>
            <p style={{
              color:      'var(--gray-mid)',
              fontSize:   '14px',
              lineHeight: '1.6',
              marginTop:  '12px',
              maxWidth:   '240px',
            }}>
              The city’s platform for business promotion, event marketing, media coverage, and digital growth.
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
                { icon: '📧', label: 'fsdtimes1@gmail.com', href: 'mailto:fsdtimes1@gmail.com' },
                { icon: '📱', label: '+92 322 222 6677', href: 'tel:+923222226677' },
                { icon: '📍', label: 'P-35 Chenab Market Susan Road Madina Town, Faisalabad, Pakistan', href: 'https://www.google.com/maps/search/P-35+Chenab+Market+Susan+Road+Madina+Town+Faisalabad/@31.419991,73.1150521,17z?entry=ttu&g_ep=EgoyMDI2MDYyOC4wIKXMDSoASAFQAw%3D%3D', target: '_blank', rel: 'noreferrer' },
                { icon: '📸', label: '@FaisalabadTimes', href: 'https://www.instagram.com/faisalabadtimes/', target: '_blank', rel: 'noreferrer' },
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

          {/* Legal */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '16px',
              letterSpacing: '2px',
              color:         'var(--white)',
              marginBottom:  '16px',
            }}>
              LEGAL
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Privacy Policy',            file: 'privacy-policy.pdf' },
                { label: 'Terms & Conditions',         file: 'terms-and-conditions.pdf' },
                { label: 'Return & Refund Policy',     file: 'return-refund-policy.pdf' },
              ].map(doc => (
                <a
                  key={doc.file}
                  href={`/legal/${doc.file}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color:          'var(--gray-mid)',
                    fontSize:       '14px',
                    textDecoration: 'none',
                    transition:     'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-mid)'}
                >
                  {doc.label}
                </a>
              ))}
            </div>
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