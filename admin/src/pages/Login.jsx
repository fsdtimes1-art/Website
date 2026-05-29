import { useState }             from 'react'
import { useNavigate }          from 'react-router-dom'
import { verifyAdminKey, setStoredKey } from '../lib/api'

export default function Login() {
  const [key,     setKey]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const navigate              = useNavigate()

  async function handleLogin() {
    if (!key.trim()) return setError('Please enter your admin key.')

    setLoading(true)
    setError(null)

    try {
      const ok = await verifyAdminKey(key.trim())
      if (!ok) {
        setError('Invalid admin key. Please try again.')
        setLoading(false)
        return
      }
      setStoredKey(key.trim())
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--black)',
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* ── Background glow ── */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: `
          radial-gradient(ellipse 60% 60% at 50% 40%, rgba(245,158,11,0.07) 0%, transparent 70%),
          var(--black)
        `,
        pointerEvents: 'none',
      }} />

      {/* ── Grid lines ── */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)
        `,
        backgroundSize:  '60px 60px',
        maskImage:       'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        pointerEvents:   'none',
      }} />

      {/* ── Card ── */}
      <div style={{
        position:     'relative',
        zIndex:       1,
        width:        '100%',
        maxWidth:     '400px',
        margin:       '0 24px',
        background:   'var(--black-2)',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow:     'hidden',
        animation:    'fadeUp 0.5s ease forwards',
      }}>

        {/* Top gold bar */}
        <div style={{
          height:     '3px',
          background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        }} />

        {/* Header */}
        <div style={{
          padding:      '36px 36px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textAlign:    'center',
        }}>
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '28px',
            letterSpacing: '6px',
            color:         'var(--gold)',
            marginBottom:  '4px',
          }}>
            EVENT<span style={{ color: 'var(--white)' }}>FLOW</span>
          </p>
          <p style={{
            color:         'var(--gray-mid)',
            fontSize:      '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            Admin Panel
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 36px 36px' }}>

          <h2 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '24px',
            letterSpacing: '2px',
            marginBottom:  '6px',
          }}>
            SIGN IN
          </h2>
          <p style={{
            color:        'var(--gray-mid)',
            fontSize:     '13px',
            marginBottom: '28px',
            lineHeight:   '1.5',
          }}>
            Enter your admin secret key to access the dashboard.
          </p>

          {/* Key input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display:       'block',
              color:         'var(--gray-light)',
              fontSize:      '11px',
              fontWeight:    '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom:  '8px',
            }}>
              Admin Key
            </label>
            <input
              className="input"
              type="password"
              placeholder="Enter your secret key..."
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:   'rgba(239,68,68,0.1)',
              border:       '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              padding:      '11px 14px',
              color:        '#f87171',
              fontSize:     '13px',
              marginBottom: '16px',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-gold"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width:   '100%',
              fontSize:'15px',
              padding: '14px',
              opacity: loading ? 0.7 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width:        '14px',
                  height:       '14px',
                  border:       '2px solid rgba(0,0,0,0.3)',
                  borderTop:    '2px solid #000',
                  borderRadius: '50%',
                  animation:    'spin 0.7s linear infinite',
                }} />
                Verifying...
              </>
            ) : (
              'Access Dashboard →'
            )}
          </button>

          {/* Hint */}
          <p style={{
            color:     'var(--gray-dark)',
            fontSize:  '11px',
            textAlign: 'center',
            marginTop: '20px',
            lineHeight:'1.5',
          }}>
            Key is set via <code style={{
              background:   'rgba(255,255,255,0.06)',
              padding:      '1px 6px',
              borderRadius: '3px',
              fontFamily:   'monospace',
              fontSize:     '11px',
            }}>ADMIN_SECRET_KEY</code> in your server <code style={{
              background:   'rgba(255,255,255,0.06)',
              padding:      '1px 6px',
              borderRadius: '3px',
              fontFamily:   'monospace',
              fontSize:     '11px',
            }}>.env</code>
          </p>

        </div>
      </div>

    </div>
  )
}
