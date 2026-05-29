import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearStoredKey }                 from '../lib/api'

const NAV = [
  { path: '/',          icon: '📊', label: 'Dashboard'  },
  { path: '/events',    icon: '🎭', label: 'Events'     },
  { path: '/purchases', icon: '🧾', label: 'Purchases'  },
  { path: '/scan',      icon: '📷', label: 'Scan Ticket'},
  { path: '/portfolio', icon: '🏆', label: 'Portfolio'  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    clearStoredKey()
    navigate('/login')
  }

  // active match — /events/new and /events/:id/edit should highlight /events
  function isActive(path) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside style={{
      position:    'fixed',
      top:         0,
      left:        0,
      width:       'var(--sidebar-w)',
      height:      '100vh',
      background:  'var(--black-2)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display:     'flex',
      flexDirection:'column',
      zIndex:      50,
      overflowY:   'auto',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding:      '28px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink:   0,
      }}>
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '22px',
          letterSpacing: '4px',
          color:         'var(--gold)',
        }}>
          EVENT<span style={{ color: 'var(--white)' }}>FLOW</span>
        </span>
        <p style={{
          color:         'var(--gray-mid)',
          fontSize:      '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginTop:     '4px',
        }}>
          Admin Panel
        </p>
      </div>

      {/* ── Nav links ── */}
      <nav style={{
        flex:    1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap:     '4px',
      }}>
        {NAV.map(item => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                padding:      '11px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                background:   active
                                ? 'rgba(245,158,11,0.1)'
                                : 'transparent',
                border:       active
                                ? '1px solid rgba(245,158,11,0.2)'
                                : '1px solid transparent',
                transition:   'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{
                fontFamily:    'var(--font-body)',
                fontSize:      '14px',
                fontWeight:    active ? '600' : '400',
                color:         active ? 'var(--gold)' : 'var(--gray-light)',
                letterSpacing: '0.3px',
              }}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div style={{
                  marginLeft:   'auto',
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   'var(--gold)',
                  flexShrink:   0,
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="divider" style={{ margin: '0 12px', flexShrink: 0 }} />

      {/* ── Footer: client link + logout ── */}
      <div style={{
        padding:   '16px 12px',
        flexShrink: 0,
        display:   'flex',
        flexDirection: 'column',
        gap:       '6px',
      }}>
        {/* View client site */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '10px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            border:       '1px solid transparent',
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <span style={{ fontSize: '14px' }}>🌐</span>
          <span style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
            View Client Site
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--gray-dark)', fontSize: '11px' }}>
            ↗
          </span>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '10px 14px',
            borderRadius: '8px',
            background:   'transparent',
            border:       '1px solid transparent',
            cursor:       'pointer',
            width:        '100%',
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background    = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.borderColor   = 'rgba(239,68,68,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <span style={{ fontSize: '14px' }}>🚪</span>
          <span style={{ color: '#f87171', fontSize: '13px', fontWeight: '500' }}>
            Logout
          </span>
        </button>
      </div>

    </aside>
  )
}