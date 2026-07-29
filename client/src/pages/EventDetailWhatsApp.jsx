import { useEffect, useState }         from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { getEvent, createWhatsappOrder, getOrderTotal, TICKET_FEES } from '../lib/api'
import SeatSelector                    from '../components/SeatSelector'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'

export default function EventDetailWhatsApp() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [event,     setEvent]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [selection, setSelection] = useState({ category: null, quantity: 1 })
  const [form,      setForm]      = useState({ name: '', email: '', phone: '' })
  const [ticketNames, setTicketNames] = useState([''])
  const [formError, setFormError] = useState(null)
  const [sending,   setSending]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
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

  function handleSelectionChange(sel) {
    setSelection(sel)
    setTicketNames(prev => {
      const next = [...prev]
      next.length = sel.quantity
      return next.map(n => n || '')
    })
  }

  function handleTicketNameChange(index, value) {
    setTicketNames(prev => prev.map((n, i) => i === index ? value : n))
  }

  async function handleSendWhatsapp() {
  if (!selection.category) return setFormError('Please select your ticket.')
  if (!form.name.trim())    return setFormError('Please enter your full name.')
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
    return setFormError('Please enter a valid email address.')
  if (ticketNames.some(n => !n.trim()))
    return setFormError('Please enter a name for every ticket.')

  setFormError(null)
  setSending(true)

  // Open the tab SYNCHRONOUSLY, right inside the click handler — before any await.
  // iOS Safari only allows window.open without being blocked if it happens
  // in direct response to the user gesture, with no async gap.
  const waTab = window.open('', '_blank')

  try {
    const { purchaseId } = await createWhatsappOrder({
      eventId:    event.id,
      categoryId: selection.category.id,
      quantity:   selection.quantity,
      buyerName:  form.name.trim(),
      buyerEmail: form.email.trim(),
      buyerPhone: form.phone.trim(),
      ticketNames: ticketNames.map(n => n.trim()),
    })

    const feesForOrder = (TICKET_FEES.booking + TICKET_FEES.processing + TICKET_FEES.platform) * selection.quantity

    const lines = [
      `🎟️ *New Ticket Order — ${event.name}*`,
      ``,
      `*Name:* ${form.name.trim()}`,
      `*Email:* ${form.email.trim()}`,
      form.phone.trim() ? `*Phone:* ${form.phone.trim()}` : null,
      `*Category:* ${selection.category.name}`,
      `*Quantity:* ${selection.quantity}`,
      `*Attendees:* ${ticketNames.map(n => n.trim()).join(', ')}`,
      `*Ticket Price:* PKR ${(Number(selection.category.price) * selection.quantity).toLocaleString()}`,
      `*Fees (Booking + Processing + Platform):* PKR ${feesForOrder.toLocaleString()}`,
      `*Total:* PKR ${orderTotal.toLocaleString()}`,
      ``,
      `*Order Ref:* ${purchaseId}`,
    ].filter(Boolean).join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`

    if (waTab) {
      waTab.location.href = url
    } else {
      // popup was blocked anyway (e.g. user has strict blocker) — fall back to same-tab nav
      window.location.href = url
    }

    setSubmitted(true)

  } catch (err) {
    if (waTab) waTab.close() // clean up the blank tab if the order failed
    setFormError(err.message)
  } finally {
    setSending(false)
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
  const soldPct = Math.max(0, Math.round(50 - (soldSeats / totalSeats) * 50))
  const orderTotal     = selection.category
    ? getOrderTotal(selection.category.price, selection.quantity) : 0
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
            width:'100%', height:'100%', objectFit:'contain', background:'var(--black-2)',
          }} />
        ) : (
          <div style={{
            width:'100%', height:'100%',
            background:'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          }} />
        )}

        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height:'2px',
          background:'linear-gradient(to right, #25D366, transparent 60%)',
          opacity:0.6,
        }} />

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
      </div>

      {/* ── Body ── */}
      <div className="container" style={{ padding:'52px 24px 80px' }}>
        <div className="detail-grid" style={{
          display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,400px)',
          gap:'52px', alignItems:'start',
        }}>

          {/* ── Left column ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'44px', paddingTop:'24px' }}>

            <h1 className="hero-title" style={{
              fontFamily:'var(--font-display)',
              fontSize:'clamp(28px, 3.5vw, 44px)',
              letterSpacing:'2px', lineHeight:'1.1',
              color:'var(--white)',
            }}>
              {event.name}
            </h1>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'12px' }}>
              {[
                { label:'Date',     value: eventDate.toLocaleDateString('en-PK', { month:'short', day:'numeric', year:'numeric' }), icon:'📅' },
                { label:'Time',     value: formattedTime,   icon:'🕐' },
                { label:'Venue',    value: event.venue,     icon:'📍' },
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

            <div style={{
              background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'10px', padding:'20px 22px',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ color:'var(--gray-light)', fontSize:'13px', fontWeight:'600' }}>
                  Ticket Availability
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
                  background: soldPct <= 10 ? '#ef4444' : soldPct <= 25 ? 'var(--gold)' : '#22c55e',
                  transition:'width 0.6s ease',
                }} />
              </div>
            </div>

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

            <div>
              <h2 style={{
                fontFamily:'var(--font-display)', fontSize:'18px',
                letterSpacing:'2.5px', marginBottom:'20px', color:'var(--white)',
                display:'flex', alignItems:'center', gap:'12px',
              }}>
                SELECT YOUR TICKETS
                <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              </h2>
              <SeatSelector
                categories={event.seat_categories}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          </div>

          {/* ── Right: WhatsApp checkout ── */}
          <div className="checkout-sticky" style={{ position:'sticky', top:'88px' }}>

            {selection.category && !submitted && (
              <div style={{
                background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)',
                borderRadius:'10px', padding:'14px 18px', marginBottom:'12px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div>
                  <p style={{ color:'#25D366', fontSize:'12px', fontWeight:'700', letterSpacing:'1px' }}>
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

            {submitted ? (
              <div style={{
                background:'var(--black-2)', border:'1px solid rgba(37,211,102,0.3)',
                borderRadius:'16px', padding:'40px 28px', textAlign:'center',
              }}>
                <div style={{
                  width:'72px', height:'72px', borderRadius:'50%',
                  background:'rgba(37,211,102,0.1)', border:'2px solid rgba(37,211,102,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 20px', fontSize:'32px',
                }}>
                  💬
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'24px', letterSpacing:'2px', marginBottom:'10px' }}>
                  OPENING WHATSAPP
                </h3>
                <p style={{ color:'var(--gray-light)', fontSize:'13px', lineHeight:'1.6', marginBottom:'24px' }}>
                  Your order details are ready to send. Hit Send in WhatsApp and we'll confirm your seats
                  once payment is received. Your ticket PDF will be emailed after that.
                </p>
                <button
                  className="btn-ghost"
                  onClick={() => { setSubmitted(false); setSelection({ category:null, quantity:1 }); setForm({ name:'', email:'', phone:'' }) }}
                  style={{ width:'100%' }}
                >
                  Start a New Order
                </button>
              </div>
            ) : (
              <div style={{
                background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'16px', overflow:'hidden',
                boxShadow:'0 24px 60px rgba(0,0,0,0.4)',
              }}>

                <div style={{
                  background:'linear-gradient(135deg, var(--black-3), rgba(37,211,102,0.06))',
                  padding:'22px 26px',
                  borderBottom:'1px solid rgba(255,255,255,0.06)',
                }}>
                  <h3 style={{
                    fontFamily:'var(--font-display)', fontSize:'17px', letterSpacing:'2px',
                  }}>
                    YOUR DETAILS
                  </h3>
                  <p style={{ color:'var(--gray-mid)', fontSize:'12px', marginTop:'5px' }}>
                    We'll confirm your order and payment over WhatsApp
                  </p>
                </div>

                <div style={{ padding:'26px', display:'flex', flexDirection:'column', gap:'18px' }}>

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
                      📧 Ticket PDF will be sent here once verified
                    </p>
                  </div>

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

                  {selection.category && (
                    <div>
                      <label style={labelStyle}>
                        Attendee Name{ticketNames.length > 1 ? 's' : ''} *
                      </label>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {ticketNames.map((name, i) => (
                          <input
                            key={i}
                            className="input"
                            type="text"
                            placeholder={`Ticket ${i + 1} — full name`}
                            value={name}
                            onChange={e => handleTicketNameChange(i, e.target.value)}
                            onFocus={() => setFocused(`ticket-${i}`)}
                            onBlur={() => setFocused(null)}
                            style={inputStyle(`ticket-${i}`)}
                          />
                        ))}
                      </div>
                      <p style={{ color:'var(--gray-mid)', fontSize:'11px', marginTop:'5px' }}>
                        Each ticket needs the name of the person attending
                      </p>
                    </div>
                  )}

                  <div style={{ height:'1px', background:'rgba(255,255,255,0.05)' }} />

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
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>Booking Fee</span>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
                          PKR {(TICKET_FEES.booking * selection.quantity).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>Processing Fee</span>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
                          PKR {(TICKET_FEES.processing * selection.quantity).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>Platform Fee</span>
                        <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
                          PKR {(TICKET_FEES.platform * selection.quantity).toLocaleString()}
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

                  {formError && (
                    <div style={{
                      background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
                      borderRadius:'8px', padding:'12px 14px', color:'#f87171', fontSize:'13px',
                      display:'flex', gap:'8px', alignItems:'center',
                    }}>
                      <span>⚠️</span> {formError}
                    </div>
                  )}

                  <button
                    className="checkout-btn"
                    onClick={handleSendWhatsapp}
                    disabled={sending}
                    style={{
                      width:'100%', fontSize:'15px', fontWeight:'700',
                      padding:'15px', letterSpacing:'0.5px',
                      background: sending ? 'rgba(37,211,102,0.5)' : '#25D366',
                      color:'#000', border:'none', borderRadius:'4px',
                      opacity: sending ? 0.7 : 1,
                      cursor:  sending ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                    }}
                  >
                    {sending ? (
                      <>
                        <div style={{
                          width:'15px', height:'15px',
                          border:'2px solid rgba(0,0,0,0.3)', borderTop:'2px solid #000',
                          borderRadius:'50%', animation:'spin 0.7s linear infinite',
                        }} />
                        Preparing Order...
                      </>
                    ) : (
                      'Send Order via WhatsApp'
                    )}
                  </button>

                  <p style={{ color:'var(--gray-mid)', fontSize:'11px', textAlign:'center', lineHeight:'1.5' }}>
                    No payment happens here. We'll send you a WhatsApp payment link/instructions,
                    and your ticket PDF is emailed once we confirm receipt.
                  </p>

                </div>
              </div>
            )}
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