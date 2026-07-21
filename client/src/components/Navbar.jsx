import { useState, useEffect } from 'react'
import { Link, useLocation }   from 'react-router-dom'

const links = [
  { label: 'Events',       path: '/events' },
  { label: 'Portfolio',    path: '/portfolio' },
  { label: 'Book Meeting', path: '/book-meeting' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <>
      <nav style={{
          position:       'fixed',
          top:            0,
          left:           0,
          right:          0,
          zIndex:         100,
          background:     'rgba(10,10,10,0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow:      scrolled ? '0 1px 0 rgba(245,158,11,0.15)' : 'none',
          transition:     'box-shadow 0.3s',
        }}>
        <div className="container" style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          height:         '70px',
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img
              src="/favicon.png"
              alt="FaisalabadTimes.co"
              style={{ height: '40px', width: 'auto' }}
            />
          </Link>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
               className="desktop-nav">
            {links.map(link => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    fontFamily:     'var(--font-body)',
                    fontSize:       '14px',
                    fontWeight:     active ? '700' : '500',
                    color:          active ? '#fcd34d' : 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    padding:        '8px 16px',
                    borderRadius:   '4px',
                    transition:     'color 0.2s, background 0.2s, border-color 0.2s',
                    background:     active ? 'rgba(245,158,11,0.22)' : 'transparent',
                    border:         active ? '1px solid rgba(245,158,11,0.5)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            <Link to="/events" className="btn-gold" style={{
              marginLeft: '8px',
              fontSize:   '13px',
              padding:    '10px 22px',
            }}>
              Get Tickets
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="mobile-menu-btn"
            style={{
              background:    'none',
              border:        'none',
              cursor:        'pointer',
              padding:       '8px',
              display:       'flex',
              flexDirection: 'column',
              gap:           '5px',
            }}
            aria-label="Toggle menu"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{
                display:      'block',
                width:        '24px',
                height:       '2px',
                background:   '#ffffff',
                borderRadius: '2px',
                transition:   'transform 0.3s, opacity 0.3s',
                transform:
                  menuOpen
                    ? i === 0 ? 'translateY(7px) rotate(45deg)'
                    : i === 2 ? 'translateY(-7px) rotate(-45deg)'
                    : 'scaleX(0)'
                    : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div style={{
        position:       'fixed',
        top:            '70px',
        left:           0,
        right:          0,
        zIndex:         99,
        background:     'rgba(10,10,10,0.98)',
        backdropFilter: 'blur(16px)',
        borderBottom:   '1px solid rgba(245,158,11,0.15)',
        transform:      menuOpen ? 'translateY(0)' : 'translateY(-110%)',
        transition:     'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        padding:        menuOpen ? '24px' : '0 24px',
        visibility:     menuOpen ? 'visible' : 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(link => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  fontFamily:     'var(--font-body)',
                  fontSize:       '16px',
                  fontWeight:     active ? '700' : '500',
                  color:          active ? '#fcd34d' : '#ffffff',
                  textDecoration: 'none',
                  padding:        '14px 16px',
                  borderRadius:   '6px',
                  background:     active ? 'rgba(245,158,11,0.22)' : 'transparent',
                  border:         active ? '1px solid rgba(245,158,11,0.5)' : '1px solid transparent',
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            to="/events"
            className="btn-gold"
            style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
          >
            Get Tickets
          </Link>
        </div>
      </div>

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-menu-btn { display: none; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}