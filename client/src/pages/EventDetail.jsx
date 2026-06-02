import { useEffect, useState }                        from 'react'
import { useParams, useNavigate, useSearchParams }    from 'react-router-dom'
import { getEvent, createCheckout }                   from '../lib/api'
import SeatSelector                                   from '../components/SeatSelector'

export default function EventDetail() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const cancelled      = searchParams.get('cancelled') === 'true'

  const [event,     setEvent]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [selection, setSelection] = useState({ category: null, quantity: 1 })
  const [form,      setForm]      = useState({ name: '', email: '', phone: '' })
  const [formError, setFormError] = useState(null)
  const [paying,    setPaying]    = useState(false)
  const [focused,   setFocused]   = useState(null)

  useEffect(() => {
    getEvent(id)
      .then(setEvent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

 async function handleCheckout() {
  if (!selection.category) return setFormError('Please select a seat category.')
  if (!form.name.trim())    return setFormError('Please enter your full name.')
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
    return setFormError('Please enter a valid email address.')

  setFormError(null)
  setPaying(true)

  try {
    const { checkoutUrl, purchaseId } = await createCheckout({
      eventId:    event.id,
      categoryId: selection.category.id,
      quantity:   selection.quantity,
      buyerName:  form.name.trim(),
      buyerEmail: form.email.trim(),
      buyerPhone: form.phone.trim(),
    })

    // Initialize Lemon.js and open as overlay
    window.createLemonSqueezy()

    window.LemonSqueezy.Setup({
      eventHandler: (e) => {
        if (e.event === 'Checkout.Success') {
          window.LemonSqueezy.closeOverlay()
          window.location.href = `/payment-success?purchaseId=${purchaseId}`
        }
      },
    })

    window.LemonSqueezy.Url.Open(checkoutUrl)
    setPaying(false)

  } catch (err) {
    setFormError(err.message)
    setPaying(false)
  }
}

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ margin:'0 auto 16px' }} />
        <p style={{ color:'var(--gray-mid)', fontSize:'14px' }}>Loading event...</p>
      </div>
    </div>
  )

  if (error || !event) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'70vh', gap:'16px' }}>
      <p style={{ fontSize:'48px' }}>😕</p>
      <p style={{ color:'var(--gray-light)', fontSize:'16px' }}>{error || 'Event not found'}</p>
      <button className="btn-ghost" onClick={() => navigate('/events')}>← Back to Events</button>
    </div>
  )

  const eventDate      = new Date(event.date)
  const formattedDate  = eventDate.toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const formattedTime  = eventDate.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
  const totalSeats     = event.seat_categories.reduce((s, c) => s + c.total_seats, 0)
  const soldSeats      = event.seat_categories.reduce((s, c) => s + c.sold_seats,  0)
  const totalRemaining = totalSeats - soldSeats
  const soldPct        = Math.round((soldSeats / totalSeats) * 100)
  const orderTotal     = selection.category
    ? Number(selection.category.price) * selection.quantity : 0

  const inputStyle = (name) => ({
    width:        '100%',
    background:   focused === name ? 'rgba(255,255,255,0.04)' : 'var(--black-3)',
    border:       `1px solid ${focused === name ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: '8px',
    padding:      '12px 14px',
    color:        'var(--white)',
    fontSize:     '14px',
    outline:      'none',
    transition:   'border-color 0.2s, background 0.2s',
    boxSizing:    'box-sizing',
  })

  return (
    <div>
      <style>{`
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr !important; }
          .checkout-sticky { position: static !important; }
        }
        @media (max-width: 600px) {
          .hero-title { font-size: 32px !important; }
        }
        .back-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .checkout-btn:hover:not(:disabled) { opacity: 0.88 !important; transform: translateY(-1px); }
        .checkout-btn { transition: opacity 0.2s, transform 0.2s !important; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position:'relative', height:'clamp(300px, 42vw, 520px)', overflow:'hidden' }}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} style={{
            width:'100%', height:'100%', objectFit:'cover',
            filter:'brightness(0.35) saturate(0.8)',
          }} />
        ) : (
          <div style={{
            width:'100%', height:'100%',
            background:'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          }} />
        )}

        {/* Multi-layer gradient for depth */}
        <div style={{
          position:'absolute', inset:0,
          background:`
            linear-gradient(to top, var(--black) 0%, rgba(0,0,0,0.3) 50%, transparent 100%),
            linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 60%)
          `,
        }} />

        {/* Gold accent line at bottom */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height:'2px',
          background:'linear-gradient(to right, var(--gold), transparent 60%)',
          opacity:0.6,
        }} />

        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/events')} style={{
          position:'absolute', top:'24px', left:'24px',
          background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px',
          color:'var(--white)', fontSize:'13px', padding:'9px 18px',
          cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
          transition:'background 0.2s',
        }}>
          ← Events
        </button>

        {/* Hero content */}
        <div style={{ position:'absolute', bottom:'40px', left:0, right:0, padding:'0 24px' }}>
          <div className="container">
            {/* Availability pill */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              background: totalRemaining === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
              border: `1px solid ${totalRemaining === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)'}`,
              borderRadius:'20px', padding:'4px 12px', marginBottom:'12px',
            }}>
              <span style={{
                width:'6px', height:'6px', borderRadius:'50%',
                background: totalRemaining === 0 ? '#ef4444' : '#22c55e',
                display:'inline-block',
              }} />
              <span style={{
                color: totalRemaining === 0 ? '#f87171' : '#4ade80',
                fontSize:'11px', fontWeight:'700', letterSpacing:'1px',
              }}>
                {totalRemaining === 0 ? 'SOLD OUT' : `${totalRemaining} SEATS LEFT`}
              </span>
            </div>

            <h1 className="hero-title" style={{
              fontFamily:'var(--font-display)',
              fontSize:'clamp(32px, 4.5vw, 60px)',
              letterSpacing:'2px', lineHeight:'1.1',
              textShadow:'0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {event.name}
            </h1>

            <div style={{ display:'flex', gap:'20px', marginTop:'14px', flexWrap:'wrap' }}>
              {[
                { icon:'📅', text: formattedDate },
                { icon:'🕐', text: formattedTime },
                { icon:'📍', text: event.venue   },
              ].map((item, i) => (
                <span key={i} style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  color:'rgba(255,255,255,0.7)', fontSize:'13px',
                }}>
                  <span>{item.icon}</span> {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancelled Banner ── */}
      {cancelled && (
        <div style={{
          background:'rgba(239,68,68,0.08)', borderBottom:'1px solid rgba(239,68,68,0.2)',
          padding:'13px 24px', textAlign:'center', color:'#f87171', fontSize:'14px',
        }}>
          ⚠️ Payment was cancelled. You have not been charged. Try again below.
        </div>
      )}

      {/* ── Body ── */}
      <div className="container" style={{ padding:'52px 24px 80px' }}>
        <div className="detail-grid" style={{
          display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,400px)',
          gap:'52px', alignItems:'start',
        }}>

          {/* ── Left column ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'44px' }}>

            {/* Info cards row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'12px' }}>
              {[
                { label:'Date',     value: eventDate.toLocaleDateString('en-PK', { month:'short', day:'numeric', year:'numeric' }), icon:'📅' },
                { label:'Time',     value: formattedTime,   icon:'🕐' },
                { label:'Venue',    value: event.venue,     icon:'📍' },
                { label:'Capacity', value: `${totalRemaining}/${totalSeats} left`, icon:'🎟️' },
              ].map((item, i) => (
                <div key={i} style={{
                  background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.06)',
                  borderRadius:'10px', padding:'16px 18px',
                }}>
                  <p style={{ color:'var(--gray-mid)', fontSize:'10px', fontWeight:'700',
                    letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:'6px' }}>
                    {item.icon} {item.label}
                  </p>
                  <p style={{ color:'var(--white)', fontSize:'14px', fontWeight:'500', lineHeight:'1.3' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Capacity bar */}
            <div style={{
              background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'10px', padding:'20px 22px',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ color:'var(--gray-light)', fontSize:'13px', fontWeight:'600' }}>
                  Seat Availability
                </span>
                <span style={{ color:'var(--gold)', fontSize:'13px', fontWeight:'700' }}>
                  {soldPct}% filled
                </span>
              </div>
              <div style={{
                height:'6px', background:'rgba(255,255,255,0.07)',
                borderRadius:'4px', overflow:'hidden',
              }}>
                <div style={{
                  height:'100%', borderRadius:'4px',
                  width:`${soldPct}%`,
                  background: soldPct >= 90 ? '#ef4444' : soldPct >= 65 ? 'var(--gold)' : '#22c55e',
                  transition:'width 0.6s ease',
                }} />
              </div>
              <p style={{ color:'var(--gray-mid)', fontSize:'12px', marginTop:'8px' }}>
                {soldSeats} sold · {totalRemaining} remaining of {totalSeats} total
              </p>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h2 style={{
                  fontFamily:'var(--font-display)', fontSize:'18px',
                  letterSpacing:'2.5px', marginBottom:'14px', color:'var(--white)',
                  display:'flex', alignItems:'center', gap:'12px',
                }}>
                  ABOUT THIS EVENT
                  <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                </h2>
                <p style={{ color:'var(--gray-light)', fontSize:'15px', lineHeight:'1.75' }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Seat selector */}
            <div>
              <h2 style={{
                fontFamily:'var(--font-display)', fontSize:'18px',
                letterSpacing:'2.5px', marginBottom:'20px', color:'var(--white)',
                display:'flex', alignItems:'center', gap:'12px',
              }}>
                SELECT YOUR SEATS
                <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              </h2>
              <SeatSelector
                categories={event.seat_categories}
                onSelectionChange={setSelection}
              />
            </div>
          </div>

          {/* ── Right: Checkout ── */}
          <div className="checkout-sticky" style={{ position:'sticky', top:'88px' }}>

            {/* Selection summary bar (only when something selected) */}
            {selection.category && (
              <div style={{
                background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
                borderRadius:'10px', padding:'14px 18px', marginBottom:'12px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div>
                  <p style={{ color:'var(--gold)', fontSize:'12px', fontWeight:'700', letterSpacing:'1px' }}>
                    SELECTED
                  </p>
                  <p style={{ color:'var(--white)', fontSize:'14px', marginTop:'2px' }}>
                    {selection.quantity} × {selection.category.name}
                  </p>
                </div>
                <p style={{
                  fontFamily:'var(--font-display)', fontSize:'22px',
                  color:'var(--gold)', letterSpacing:'1px',
                }}>
                  PKR {orderTotal.toLocaleString()}
                </p>
              </div>
            )}

            <div style={{
              background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'16px', overflow:'hidden',
              boxShadow:'0 24px 60px rgba(0,0,0,0.4)',
            }}>

              {/* Header */}
              <div style={{
                background:'linear-gradient(135deg, var(--black-3), rgba(245,158,11,0.04))',
                padding:'22px 26px',
                borderBottom:'1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{
                  fontFamily:'var(--font-display)', fontSize:'17px', letterSpacing:'2px',
                }}>
                  YOUR DETAILS
                </h3>
                <p style={{ color:'var(--gray-mid)', fontSize:'12px', marginTop:'5px' }}>
                  Your name will appear on the ticket
                </p>
              </div>

              <div style={{ padding:'26px', display:'flex', flexDirection:'column', gap:'18px' }}>

                {/* Name */}
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    className="input" type="text" name="name"
                    placeholder="e.g. Ahmed Khan"
                    value={form.name} onChange={handleField}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('name')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    className="input" type="email" name="email"
                    placeholder="tickets@email.com"
                    value={form.email} onChange={handleField}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('email')}
                  />
                  <p style={{ color:'var(--gray-mid)', fontSize:'11px', marginTop:'5px' }}>
                    📧 Ticket PDF will be sent here
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    className="input" type="tel" name="phone"
                    placeholder="+92 300 000 0000"
                    value={form.phone} onChange={handleField}
                    onFocus={() => setFocused('phone')}
                    onBlur={() => setFocused(null)}
                    style={inputStyle('phone')}
                  />
                </div>

                {/* Divider */}
                <div style={{ height:'1px', background:'rgba(255,255,255,0.05)' }} />

                {/* Order summary */}
                {selection.category ? (
                  <div style={{
                    background:'var(--black-3)', borderRadius:'10px', padding:'16px',
                    display:'flex', flexDirection:'column', gap:'10px',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ color:'var(--gray-light)', fontSize:'13px' }}>
                        {selection.category.name}
                      </span>
                      <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
                        PKR {Number(selection.category.price).toLocaleString()} × {selection.quantity}
                      </span>
                    </div>
                    <div style={{ height:'1px', background:'rgba(255,255,255,0.05)' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{
                        fontFamily:'var(--font-display)', fontSize:'14px',
                        letterSpacing:'1.5px', color:'var(--gray-light)',
                      }}>TOTAL</span>
                      <span style={{
                        fontFamily:'var(--font-display)', fontSize:'24px',
                        color:'var(--gold)', letterSpacing:'1px',
                      }}>
                        PKR {orderTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background:'var(--black-3)', borderRadius:'10px', padding:'16px',
                    textAlign:'center',
                  }}>
                    <p style={{ color:'var(--gray-mid)', fontSize:'13px' }}>
                      ← Select a category to see pricing
                    </p>
                  </div>
                )}

                {/* Error */}
                {formError && (
                  <div style={{
                    background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
                    borderRadius:'8px', padding:'12px 14px', color:'#f87171', fontSize:'13px',
                    display:'flex', gap:'8px', alignItems:'center',
                  }}>
                    <span>⚠️</span> {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  className="checkout-btn btn-gold"
                  onClick={handleCheckout}
                  disabled={paying}
                  style={{
                    width:'100%', fontSize:'15px', fontWeight:'700',
                    padding:'15px', letterSpacing:'0.5px',
                    opacity: paying ? 0.7 : 1,
                    cursor:  paying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  }}
                >
                  {paying ? (
                    <>
                      <div style={{
                        width:'15px', height:'15px',
                        border:'2px solid rgba(0,0,0,0.3)', borderTop:'2px solid #000',
                        borderRadius:'50%', animation:'spin 0.7s linear infinite',
                      }} />
                      Redirecting to Payment...
                    </>
                  ) : (
                    '🔒  Proceed to Payment →'
                  )}
                </button>

                {/* Trust row */}
                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                  gap:'8px', paddingTop:'4px',
                }}>
                  {[
                    { icon:'🔒', text:'Secure\nPayment'  },
                    { icon:'⚡', text:'Instant\nTicket'  },
                    { icon:'📧', text:'Email\nDelivery'  },
                  ].map((b, i) => (
                    <div key={i} style={{
                      textAlign:'center', background:'var(--black-3)',
                      borderRadius:'8px', padding:'10px 4px',
                      border:'1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize:'18px', marginBottom:'4px' }}>{b.icon}</div>
                      <p style={{ color:'var(--gray-mid)', fontSize:'10px', lineHeight:'1.3',
                        whiteSpace:'pre-line' }}>{b.text}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display:'block', color:'var(--gray-light)', fontSize:'11px',
  fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px',
}