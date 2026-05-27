// admin/src/pages/ScanTicket.jsx
import { useEffect, useRef, useState } from 'react'
import { verifyTicket } from '../lib/api'

// Dynamically import jsQR (add to package.json: "jsqr": "^1.4.0")
// npm install jsqr  — run this in /admin

export default function ScanTicket() {
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const rafRef        = useRef(null)
  const streamRef     = useRef(null)

  const [mode,        setMode]        = useState('idle')   // idle | scanning | result
  const [result,      setResult]      = useState(null)     // { valid, message, ticket, alreadyScanned }
  const [error,       setError]       = useState(null)
  const [manualCode,  setManualCode]  = useState('')
  const [manualMode,  setManualMode]  = useState(false)
  const [verifying,   setVerifying]   = useState(false)
  const [jsQR,        setJsQR]        = useState(null)

  // Load jsQR dynamically
  useEffect(() => {
    import('jsqr').then(mod => setJsQR(() => mod.default)).catch(() => {
      setError('QR scanning library failed to load. Use manual entry below.')
    })
    return () => stopCamera()
  }, [])

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
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx  = canvas.getContext('2d')
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

  async function handleVerify(qrCode) {
    if (!qrCode.trim()) return
    setVerifying(true)
    setError(null)
    try {
      const data = await verifyTicket(qrCode.trim())
      setResult(data)
      setMode('result')
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

  return (
    <div style={{ padding: '36px 40px', maxWidth: '700px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{
          color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px',
        }}>
          Entry Gate
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '40px',
          letterSpacing: '3px', color: 'var(--white)', lineHeight: '1',
        }}>
          SCAN TICKET
        </h1>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '14px 18px', color: '#f87171',
          fontSize: '13px', marginBottom: '20px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── RESULT STATE ── */}
      {mode === 'result' && result && (
        <ResultCard result={result} onReset={handleReset} />
      )}

      {/* ── SCANNING / IDLE STATE ── */}
      {mode !== 'result' && (
        <>
          {/* Camera viewport */}
          <div style={{
            background: 'var(--black-2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', overflow: 'hidden',
            marginBottom: '24px',
            position: 'relative',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'var(--black-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '15px',
                letterSpacing: '2px', color: 'var(--gold)',
              }}>
                CAMERA SCANNER
              </p>
              {mode === 'scanning' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  color: '#4ade80', fontSize: '10px', fontWeight: '700',
                  letterSpacing: '1px', padding: '4px 10px', borderRadius: '20px',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#4ade80', animation: 'pulse 1s infinite',
                  }} />
                  LIVE
                </span>
              )}
            </div>

            {/* Camera feed */}
            <div style={{
              position: 'relative', width: '100%',
              aspectRatio: '16/9', background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: mode === 'scanning' ? 'block' : 'none',
                }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {mode === 'idle' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontSize: '52px', marginBottom: '16px' }}>📷</p>
                  <p style={{ color: 'var(--white)', fontSize: '16px', marginBottom: '8px' }}>
                    Camera is off
                  </p>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '13px' }}>
                    Click "Start Scanning" to activate your camera
                  </p>
                </div>
              )}

              {/* Scanning overlay */}
              {mode === 'scanning' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  {/* Corner brackets */}
                  {[
                    { top: '30%', left: '30%', borderTop: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' },
                    { top: '30%', right: '30%', borderTop: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' },
                    { bottom: '30%', left: '30%', borderBottom: '3px solid #f59e0b', borderLeft: '3px solid #f59e0b' },
                    { bottom: '30%', right: '30%', borderBottom: '3px solid #f59e0b', borderRight: '3px solid #f59e0b' },
                  ].map((style, i) => (
                    <div key={i} style={{
                      position: 'absolute', width: '28px', height: '28px',
                      ...style,
                    }} />
                  ))}
                  {/* Scan line */}
                  <div style={{
                    position: 'absolute', left: '30%', right: '30%',
                    height: '2px', background: 'rgba(245,158,11,0.7)',
                    animation: 'scanLine 2s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(245,158,11,0.5)',
                  }} />
                </div>
              )}

              {verifying && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '16px',
                }}>
                  <div className="spinner" />
                  <p style={{ color: 'var(--white)', fontSize: '14px' }}>Verifying...</p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: '12px' }}>
              {mode === 'idle' ? (
                <button
                  onClick={startCamera}
                  className="btn-gold"
                  style={{ flex: 1, fontSize: '14px', padding: '12px' }}
                >
                  📷 Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: '14px', padding: '12px' }}
                >
                  ⏹ Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* ── Manual entry ── */}
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <button
              onClick={() => setManualMode(m => !m)}
              style={{
                width: '100%', background: 'none', border: 'none',
                padding: '16px 20px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '15px',
                letterSpacing: '2px', color: 'var(--gray-light)',
              }}>
                MANUAL ENTRY
              </p>
              <span style={{
                color: 'var(--gray-mid)', fontSize: '14px', transition: 'transform 0.2s',
                transform: manualMode ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}>
                ▾
              </span>
            </button>

            {manualMode && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'var(--gray-mid)', fontSize: '12px', margin: '14px 0 10px' }}>
                  Paste or type the QR code value from the ticket
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="input"
                    placeholder="e.g. 550e8400-e29b-41d4-a716-..."
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify(manualCode)}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => handleVerify(manualCode)}
                    disabled={verifying || !manualCode.trim()}
                    className="btn-gold"
                    style={{
                      fontSize: '13px', padding: '10px 20px',
                      opacity: verifying || !manualCode.trim() ? 0.5 : 1,
                    }}
                  >
                    {verifying ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Scan line animation ── */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 30%; }
          50%  { top: 68%; }
          100% { top: 30%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

function ResultCard({ result, onReset }) {
  const isValid         = result.valid
  const isAlreadyScanned = result.alreadyScanned
  const t               = result.ticket || {}

  const bgColor     = isValid ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)'
  const borderColor = isValid ? 'rgba(34,197,94,0.3)'  : 'rgba(239,68,68,0.3)'
  const textColor   = isValid ? '#4ade80'               : '#f87171'
  const icon        = isValid ? '✅' : isAlreadyScanned ? '⚠️' : '❌'

  return (
    <div style={{
      background: bgColor, border: `1px solid ${borderColor}`,
      borderRadius: '12px', overflow: 'hidden', marginBottom: '24px',
    }}>
      {/* Top result banner */}
      <div style={{
        padding: '24px', textAlign: 'center',
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <p style={{ fontSize: '56px', marginBottom: '12px' }}>{icon}</p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '28px',
          letterSpacing: '2px', color: textColor, marginBottom: '6px',
        }}>
          {isValid ? 'VALID TICKET' : isAlreadyScanned ? 'ALREADY USED' : 'INVALID TICKET'}
        </p>
        <p style={{ color: textColor, fontSize: '13px', opacity: 0.8 }}>
          {result.message}
        </p>
      </div>

      {/* Ticket details */}
      {t && Object.keys(t).length > 0 && (
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          }}>
            {[
              { label: 'Name',     value: t.buyerName },
              { label: 'Event',    value: t.event },
              { label: 'Seat',     value: t.seat },
              { label: 'Category', value: t.category },
              t.venue ? { label: 'Venue', value: t.venue } : null,
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '10px 14px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {row.label}
                </p>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {row.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <div style={{ padding: '0 24px 20px' }}>
        <button
          onClick={onReset}
          className="btn-gold"
          style={{ width: '100%', fontSize: '14px', padding: '13px' }}
        >
          📷 Scan Next Ticket
        </button>
      </div>
    </div>
  )
}