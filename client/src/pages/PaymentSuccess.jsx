import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getPaymentSession, getTicketsByPurchase } from '../lib/api'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const tracker = searchParams.get('tracker')

  const [session,  setSession]  = useState(null)
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!tracker) {
      setError('No payment reference found.')
      setLoading(false)
      return
    }

    getPaymentSession(tracker)
      .then(async (data) => {
        setSession(data)
        if (data.metadata?.purchaseId) {
          try {
            const t = await getTicketsByPurchase(data.metadata.purchaseId)
            setTickets(t)
          } catch (_) {}
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [tracker])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--gray-mid)', fontSize: '14px' }}>Confirming your payment...</p>
      </div>
    </div>
  )

  if (error || !session) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
      <p style={{ fontSize: '48px' }}>😕</p>
      <p style={{ color: 'var(--gray-light)', fontSize: '16px' }}>
        {error || 'Could not retrieve your booking.'}
      </p>
      <Link to="/events" className="btn-gold">Browse Events</Link>
    </div>
  )

  const { customerEmail, amount, metadata } = session
  const eventName = metadata?.eventName || 'Your Event'
  const buyerName = metadata?.buyerName || customerEmail
  const quantity  = metadata?.quantity  || tickets.length || '—'

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Success Icon */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '44px',
            }}>
              ✓
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 64px)',
              letterSpacing: '3px', color: 'var(--white)', marginBottom: '12px',
            }}>
              BOOKING CONFIRMED
            </h1>
            <p style={{ color: 'var(--gray-light)', fontSize: '15px', lineHeight: '1.6' }}>
              Your tickets are on their way to <strong style={{ color: 'var(--white)' }}>{customerEmail}</strong>.
              Check your inbox (and spam folder) for the PDF with QR codes.
            </p>
          </div>

          {/* Order Summary */}
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '24px',
          }}>
            <div style={{
              background: 'rgba(245,158,11,0.08)', padding: '18px 28px',
              borderBottom: '1px solid rgba(245,158,11,0.12)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '2px', color: 'var(--gold)' }}>
                ORDER SUMMARY
              </span>
              <span style={{
                background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
                padding: '3px 10px', borderRadius: '20px',
              }}>
                PAID
              </span>
            </div>

            <div style={{ padding: '8px 0' }}>
              {[
                { label: 'Event',      value: eventName },
                { label: 'Name',       value: buyerName },
                { label: 'Email',      value: customerEmail },
                { label: 'Tickets',    value: `${quantity} ticket${quantity > 1 ? 's' : ''}` },
                { label: 'Total Paid', value: `PKR ${Number(amount).toLocaleString()}`, highlight: true },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 28px',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ color: 'var(--gray-mid)', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>
                    {row.label}
                  </span>
                  <span style={{
                    color:      row.highlight ? 'var(--gold)' : 'var(--white)',
                    fontSize:   row.highlight ? '20px' : '14px',
                    fontFamily: row.highlight ? 'var(--font-display)' : 'var(--font-body)',
                    letterSpacing: row.highlight ? '1px' : 'normal',
                    fontWeight: '500', maxWidth: '300px', textAlign: 'right',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Seat numbers */}
          {tickets.length > 0 && (
            <div style={{
              background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '20px 28px', marginBottom: '24px',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '14px' }}>
                YOUR SEAT NUMBERS
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tickets.map((t, i) => (
                  <span key={i} style={{
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                    color: 'var(--gold)', fontFamily: 'var(--font-display)',
                    fontSize: '16px', letterSpacing: '2px', padding: '8px 18px', borderRadius: '6px',
                  }}>
                    {t.seat_number}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What's next */}
          <div style={{
            background: 'var(--black-2)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '24px 28px', marginBottom: '32px',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '16px' }}>
              WHAT HAPPENS NEXT
            </p>
            {[
              { icon: '📧', text: 'A payment confirmation email has been sent to your inbox.' },
              { icon: '🎟️', text: 'A second email with your ticket PDF and QR codes will arrive shortly.' },
              { icon: '📱', text: 'Save the PDF to your phone or print it — both work at the gate.' },
              { icon: '🚪', text: 'Show your QR code to staff at the entrance for a single-use scan.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                paddingBottom: i < 3 ? '14px' : '0', marginBottom: i < 3 ? '14px' : '0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <p style={{ color: 'var(--gray-light)', fontSize: '13px', lineHeight: '1.5' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/events" className="btn-gold" style={{ fontSize: '14px' }}>
              Browse More Events →
            </Link>
            <Link to="/" className="btn-ghost" style={{ fontSize: '14px' }}>
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}