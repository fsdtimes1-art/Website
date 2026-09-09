// admin/src/pages/ScanTicket.jsx
//
// Universal gate scanner — handles online e-tickets AND physical tickets.
// Session/lap feature: start a named session per event, track every scan in
// real time (e-tickets and physical tickets shown separately), and download
// the session report as CSV at the end.

import { useEffect, useRef, useState } from 'react'
import { verifyTicket, getAdminEvents } from '../lib/api'

// ── Helpers ────────────────────────────────────────────────────
const SESSION_KEY = 'ft_scan_session'

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') }
  catch { return null }
}

function saveSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else    localStorage.removeItem(SESSION_KEY)
}

function exportSessionCSV(session) {
  const headers = ['Type', 'Seat / Serial', 'Buyer Name', 'Category', 'Valid', 'Scanned At']
  const rows = session.scans.map(s => [
    s.ticketType === 'physical' ? 'Physical' : 'E-Ticket',
    s.seat        || '—',
    s.buyerName   || '—',
    s.category    || '—',
    s.valid ? 'Yes' : `No — ${s.reason || ''}`,
    s.scannedAt,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`))

  const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const slug = (session.eventName || 'session').replace(/\s+/g, '-').toLowerCase()
  a.href     = url
  a.download = `scan-session-${slug}-${new Date(session.startedAt).toISOString().split('T')[0]}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Sub-components ─────────────────────────────────────────────

function ResultCard({ result, onNext }) {
  const t = result.ticket || {}
  const isValid    = result.valid
  const isPhysical = result.ticketType === 'physical'

  return (
    <div style={{
      background:   isValid ? 'rgba(34,197,94,0.08)'  : 'rgba(239,68,68,0.08)',
      border:       `1px solid ${isValid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: '16px',
      padding:      '28px',
      marginTop:    '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>{isValid ? '✅' : '❌'}</span>
        <div>
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '22px',
            letterSpacing: '2px',
            color:         isValid ? '#4ade80' : '#f87171',
          }}>
            {isValid ? 'ADMITTED' : 'REJECTED'}
          </p>
          <p style={{ color: 'var(--gray-light)', fontSize: '13px', marginTop: '3px' }}>
            {result.message}
          </p>
          {isPhysical && (
            <span style={{
              display: 'inline-block', marginTop: '6px',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: 'var(--gold)', fontSize: '10px', fontWeight: '700',
              padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px',
            }}>
              🎟️ PHYSICAL TICKET
            </span>
          )}
        </div>
      </div>

      {t.buyerName && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '14px', marginBottom: '20px',
        }}>
          {[
            { label: 'Name',     value: t.buyerName  },
            { label: 'Seat',     value: t.seat       },
            { label: 'Category', value: t.category   },
            { label: 'Event',    value: t.event       },
          ].map(item => item.value ? (
            <div key={item.label}>
              <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {item.label}
              </p>
              <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500', marginTop: '3px' }}>
                {item.value}
              </p>
            </div>
          ) : null)}
        </div>
      )}

      <button className="btn-gold" onClick={onNext} style={{ width: '100%', padding: '13px' }}>
        📷 Scan Next Ticket
      </button>
    </div>
  )
}

// Session live log panel
function SessionLog({ session }) {
  const eTickets  = session.scans.filter(s => s.ticketType !== 'physical')
  const physical  = session.scans.filter(s => s.ticketType === 'physical')
  const validOnly = session.scans.filter(s => s.valid)

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[
          { label: 'Total Scanned', value: session.scans.length, color: 'var(--white)' },
          { label: 'Admitted',      value: validOnly.length,      color: '#4ade80'       },
          { label: 'E-Tickets',     value: eTickets.length,       color: 'var(--gold)'   },
          { label: 'Physical',      value: physical.length,       color: '#29dcff'        },
          { label: 'Rejected',      value: session.scans.length - validOnly.length, color: '#f87171' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 80px', minWidth: '80px',
            background: 'var(--black-3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '10px 14px', textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '24px',
              color: s.color, letterSpacing: '1px',
            }}>
              {s.value}
            </p>
            <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column log */}
      {session.scans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* E-Tickets */}
          <div>
            <p style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🎟️ E-Tickets ({eTickets.length})
            </p>
            <div style={{
              background: 'var(--black-3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              maxHeight: '280px', overflowY: 'auto',
            }}>
              {eTickets.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--gray-dark)', fontSize: '12px', textAlign: 'center' }}>None yet</p>
              ) : eTickets.slice().reverse().map((s, i) => (
                <div key={i} style={{
                  padding: '9px 14px',
                  borderBottom: i < eTickets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ color: s.valid ? 'var(--white)' : '#f87171', fontSize: '13px', fontWeight: '500' }}>
                      {s.seat || 'Unknown Seat'}
                    </p>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '1px' }}>
                      {s.buyerName || '—'} · {s.category || '—'}
                    </p>
                  </div>
                  <span style={{ fontSize: '14px' }}>{s.valid ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical */}
          <div>
            <p style={{ color: '#29dcff', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🎫 Physical ({physical.length})
            </p>
            <div style={{
              background: 'var(--black-3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              maxHeight: '280px', overflowY: 'auto',
            }}>
              {physical.length === 0 ? (
                <p style={{ padding: '16px', color: 'var(--gray-dark)', fontSize: '12px', textAlign: 'center' }}>None yet</p>
              ) : physical.slice().reverse().map((s, i) => (
                <div key={i} style={{
                  padding: '9px 14px',
                  borderBottom: i < physical.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ color: s.valid ? 'var(--white)' : '#f87171', fontSize: '12px', fontFamily: 'monospace' }}>
                      {s.seat || 'Unknown Serial'}
                    </p>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '1px' }}>
                      {s.category || '—'}
                    </p>
                  </div>
                  <span style={{ fontSize: '14px' }}>{s.valid ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function ScanTicket() {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const streamRef = useRef(null)

  const [mode,       setMode]       = useState('idle')   // idle | scanning | result
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [verifying,  setVerifying]  = useState(false)
  const [jsQR,       setJsQR]       = useState(null)

  // Session state
  const [session,         setSession]         = useState(() => loadSession())
  const [showStartModal,  setShowStartModal]  = useState(false)
  const [showEndModal,    setShowEndModal]    = useState(false)
  const [events,          setEvents]          = useState([])
  const [sessionForm,     setSessionForm]     = useState({ eventId: '', label: '' })

  // Load jsQR dynamically
  useEffect(() => {
    import('jsqr').then(mod => setJsQR(() => mod.default)).catch(() => {
      setError('QR scanning library failed to load. Use manual entry below.')
    })
    getAdminEvents().then(setEvents).catch(console.error)
    return () => stopCamera()
  }, [])

  // Persist session to localStorage whenever it changes
  useEffect(() => { saveSession(session) }, [session])

  // ── Camera ──────────────────────────────────────────────────
  async function startCamera() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setMode('scanning')
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      setError(`Camera error: ${err.message}. Try manual entry below.`)
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setMode('idle')
  }

  function scanFrame() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !jsQR) {
      rafRef.current = requestAnimationFrame(scanFrame); return
    }
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame); return
    }
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code && code.data) {
      stopCamera()
      handleVerify(code.data)
      return
    }
    rafRef.current = requestAnimationFrame(scanFrame)
  }

  // ── Verify ──────────────────────────────────────────────────
  async function handleVerify(qrCode) {
    if (!qrCode.trim()) return
    setVerifying(true)
    setError(null)
    try {
      const data = await verifyTicket(qrCode.trim())
      setResult(data)
      setMode('result')

      // Add to session log if session is active
      if (session) {
        const t = data.ticket || {}
        const entry = {
          ticketType: data.ticketType || (qrCode.startsWith('PT-') ? 'physical' : 'eticket'),
          seat:       t.seat       || t.seat_number || '—',
          buyerName:  t.buyerName  || '—',
          category:   t.category   || '—',
          event:      t.event      || session.eventName,
          valid:      data.valid,
          reason:     data.valid ? '' : data.message,
          scannedAt:  new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour12: true }),
        }
        setSession(prev => ({ ...prev, scans: [...prev.scans, entry] }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  function handleReset() {
    setResult(null)
    setMode('idle')
    setManualCode('')
    setError(null)
  }

  // ── Session management ────────────────────────────────────────
  function startSession() {
    if (!sessionForm.eventId) return
    const event = events.find(e => e.id === sessionForm.eventId)
    const s = {
      eventId:   sessionForm.eventId,
      eventName: event?.name || 'Unknown Event',
      label:     sessionForm.label.trim() || 'Main Gate',
      startedAt: new Date().toISOString(),
      scans:     [],
    }
    setSession(s)
    setShowStartModal(false)
    setSessionForm({ eventId: '', label: '' })
  }

  function endSession() {
    exportSessionCSV(session)
    setSession(null)
    setShowEndModal(false)
  }

  function discardSession() {
    setSession(null)
    setShowEndModal(false)
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ padding: '36px 40px', maxWidth: '900px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
        <div>
          <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
            Gate Operations
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', letterSpacing: '3px', color: 'var(--white)', lineHeight: '1' }}>
            SCAN TICKET
          </h1>
        </div>

        {/* Session controls */}
        {session ? (
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '12px', padding: '12px 18px',
          }}>
            <p style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              📋 Active Session
            </p>
            <p style={{ color: 'var(--white)', fontSize: '13px', fontWeight: '500', marginTop: '3px' }}>
              {session.label} · {session.eventName}
            </p>
            <p style={{ color: 'var(--gray-mid)', fontSize: '11px', marginTop: '2px' }}>
              {session.scans.length} scan{session.scans.length !== 1 ? 's' : ''} · started {new Date(session.startedAt).toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour12: true })}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => exportSessionCSV(session)}
                style={{
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                  color: 'var(--gold)', fontSize: '11px', fontWeight: '700', padding: '6px 12px',
                  borderRadius: '8px', cursor: 'pointer',
                }}
              >
                ⬇ Export CSV
              </button>
              <button
                onClick={() => setShowEndModal(true)}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '11px', fontWeight: '700', padding: '6px 12px',
                  borderRadius: '8px', cursor: 'pointer',
                }}
              >
                ✕ End Session
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowStartModal(true)}
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '10px 18px' }}
          >
            📋 Start Scan Session
          </button>
        )}
      </div>

      {/* ── Scanner card ── */}
      <div style={{
        background: 'var(--black-2)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden',
      }}>

        {/* Camera viewport */}
        <div style={{
          position: 'relative', background: '#000',
          aspectRatio: '16/9', maxHeight: '340px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: mode === 'scanning' ? 'block' : 'none',
            }}
            playsInline muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {mode === 'idle' && (
            <button onClick={startCamera} className="btn-gold" style={{ padding: '14px 32px', fontSize: '15px' }}>
              📷 Start Camera
            </button>
          )}

          {mode === 'scanning' && (
            <>
              {/* Aiming reticle */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: '200px', height: '200px',
                  border: '2px solid rgba(245,158,11,0.7)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                }} />
              </div>
              <button
                onClick={stopCamera}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                ✕ Stop
              </button>
            </>
          )}
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '12px 16px', color: '#f87171',
              fontSize: '13px', marginBottom: '16px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Result card */}
          {mode === 'result' && result && (
            <ResultCard result={result} onNext={handleReset} />
          )}

          {/* Manual entry */}
          {mode !== 'scanning' && (
            <div style={{ marginTop: mode === 'result' ? '16px' : '0' }}>
              <button
                onClick={() => setManualMode(m => !m)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--gray-mid)', fontSize: '12px', cursor: 'pointer',
                  padding: '0', textDecoration: 'underline',
                }}
              >
                {manualMode ? '▲ Hide manual entry' : '▼ Enter QR code manually'}
              </button>

              {manualMode && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input
                    className="input"
                    placeholder="Paste QR / serial code here…"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify(manualCode)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn-gold"
                    onClick={() => handleVerify(manualCode)}
                    disabled={verifying || !manualCode.trim()}
                    style={{ whiteSpace: 'nowrap', opacity: !manualCode.trim() ? 0.5 : 1 }}
                  >
                    {verifying ? '…' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Verifying spinner */}
          {verifying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--gray-light)', fontSize: '13px' }}>Verifying ticket…</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Session log (shown while session is active) ── */}
      {session && <SessionLog session={session} />}

      {/* ── Start Session Modal ── */}
      {showStartModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '30px',
          }}>
            <p style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              New Scan Session
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '22px' }}>
              START SESSION
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Event *
              </label>
              <select
                className="input"
                value={sessionForm.eventId}
                onChange={e => setSessionForm(f => ({ ...f, eventId: e.target.value }))}
                required
              >
                <option value="">— Select event —</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Gate / Label (optional)
              </label>
              <input
                className="input"
                placeholder="e.g. Main Gate, VIP Entry, Lap 1…"
                value={sessionForm.label}
                onChange={e => setSessionForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowStartModal(false)}
                className="btn-ghost"
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={startSession}
                className="btn-gold"
                disabled={!sessionForm.eventId}
                style={{ flex: 1.5, padding: '12px', opacity: !sessionForm.eventId ? 0.5 : 1 }}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End Session Modal ── */}
      {showEndModal && session && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '30px',
          }}>
            <p style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              Session Summary
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '16px' }}>
              END SESSION
            </h2>

            {/* Summary stats */}
            <div style={{
              background: 'var(--black-3)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '16px 18px', marginBottom: '20px',
            }}>
              <p style={{ color: 'var(--white)', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                {session.label} · {session.eventName}
              </p>
              {[
                ['Total Scanned',   session.scans.length],
                ['Admitted',        session.scans.filter(s => s.valid).length],
                ['E-Tickets',       session.scans.filter(s => s.ticketType !== 'physical').length],
                ['Physical',        session.scans.filter(s => s.ticketType === 'physical').length],
                ['Rejected',        session.scans.filter(s => !s.valid).length],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--gray-light)', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: 'var(--white)', fontSize: '13px', fontWeight: '600' }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={endSession}
                className="btn-gold"
                style={{ width: '100%', padding: '13px' }}
              >
                ⬇ Download CSV & End Session
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="btn-ghost"
                style={{ width: '100%', padding: '12px' }}
              >
                Keep Session Open
              </button>
              <button
                onClick={discardSession}
                style={{
                  width: '100%', padding: '10px',
                  background: 'none', border: 'none',
                  color: '#f87171', fontSize: '12px', cursor: 'pointer',
                }}
              >
                Discard session without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
