/**
 * WhatsApp ticket-flow review page: visual hierarchy is updated only.
 * The existing API order creation, WhatsApp message, manual-payment confirmation, and email-ticket workflow are retained.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createWhatsappOrder, getEvent, getOrderTotal, getOrderTotals, TICKET_FEES } from '../lib/api'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'

function TicketPicker({ categories = [], selection, onSelectionChange }) {
  const selected = selection.category
  const quantity = selection.quantity
  const available = selected ? Number(selected.total_seats) - Number(selected.sold_seats) : 0
  const maxQty = Math.min(Math.max(available, 1), 10)

  return <div className="flow-ticket-list">
    {categories.map(category => {
      const remaining = Number(category.total_seats) - Number(category.sold_seats)
      const soldOut = remaining <= 0
      const active = selected?.id === category.id
      return <button key={category.id} className={`flow-ticket-row ${active ? 'is-selected' : ''} ${soldOut ? 'is-sold' : ''}`} disabled={soldOut} onClick={() => onSelectionChange({ category, quantity: active ? quantity : 1 })}>
        <span className="flow-ticket-radio" aria-hidden="true"><i /></span><span className="flow-ticket-copy"><strong>{category.name}</strong><small>{soldOut ? 'Sold out' : `${remaining} tickets available`}</small></span><span className="flow-ticket-price">PKR {Number(category.price).toLocaleString()}<small>per ticket</small></span>
      </button>
    })}
    {selected && <div className="flow-quantity"><div><p>Quantity</p><span>{maxQty < 10 ? `Maximum ${maxQty} tickets per order` : 'Select how many tickets you need'}</span></div><div className="flow-stepper"><button disabled={quantity <= 1} onClick={() => onSelectionChange({ category: selected, quantity: quantity - 1 })}>−</button><b>{quantity}</b><button disabled={quantity >= maxQty} onClick={() => onSelectionChange({ category: selected, quantity: quantity + 1 })}>+</button></div></div>}
  </div>
}

function Field({ label, hint, ...props }) {
  return <label className="flow-field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>
}

export default function EventDetailWhatsApp() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const reviewEvent = location.state?.reviewEvent
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selection, setSelection] = useState({ category: null, quantity: 1 })
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [extraNames, setExtraNames] = useState([])
  const [formError, setFormError] = useState(null)
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (reviewEvent) { setEvent(reviewEvent); setLoading(false); return }
    getEvent(id).then(setEvent).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [id, reviewEvent])

  function handleSelectionChange(next) {
    setSelection(next)
    setExtraNames(previous => {
      const names = previous.slice(0, Math.max(next.quantity - 1, 0))
      while (names.length < next.quantity - 1) names.push('')
      return names
    })
  }

  async function handleSendWhatsapp() {
    if (!selection.category) return setFormError('Please select a ticket type.')
    if (!form.name.trim()) return setFormError('Please enter your full name.')
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setFormError('Please enter a valid email address.')
    if (extraNames.some(name => !name.trim())) return setFormError('Please enter a name for every additional ticket.')
    setFormError(null)
    setSending(true)
    const ticketNames = [form.name.trim(), ...extraNames.map(name => name.trim())]
    const waTab = window.open('', '_blank')
    try {
      const { purchaseId } = await createWhatsappOrder({ eventId: event.id, categoryId: selection.category.id, quantity: selection.quantity, buyerName: form.name.trim(), buyerEmail: form.email.trim(), buyerPhone: form.phone.trim(), ticketNames })
      const totals = getOrderTotals(selection.category.price, selection.quantity, event.discounts || [])
      const discountLines = (event.discounts || []).map(discount => {
        const amount = discount.type === 'percent' ? totals.subtotal * Number(discount.value) / 100 : Number(discount.value)
        return `*${discount.label}${discount.type === 'percent' ? ` (-${discount.value}%)` : ''}:* − PKR ${amount.toLocaleString()}`
      })
      const lines = [`🎟️ *New Ticket Order — ${event.name}*`, '', `*Name:* ${form.name.trim()}`, `*Email:* ${form.email.trim()}`, form.phone.trim() ? `*Phone:* ${form.phone.trim()}` : null, `*Category:* ${selection.category.name}`, `*Quantity:* ${selection.quantity}`, `*Attendees:* ${ticketNames.join(', ')}`, `*Ticket Price:* PKR ${totals.subtotal.toLocaleString()}`, ...discountLines, `*Fees (Booking + Processing + Platform):* PKR ${totals.fees.toLocaleString()}`, `*Total:* PKR ${totals.total.toLocaleString()}`, '', `*Order Ref:* ${purchaseId}`].filter(Boolean).join('\n')
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`
      if (waTab) waTab.location.href = url
      else window.location.href = url
      setSubmitted(true)
    } catch (err) {
      if (waTab) waTab.close()
      setFormError(err.message)
    } finally { setSending(false) }
  }

  if (loading) return <div className="flow-loading"><span />Loading event…</div>
  if (error || !event) return <div className="flow-loading"><p>{error || 'Event not found'}</p><button onClick={() => navigate('/events')}>Back to events</button></div>

  const eventDate = new Date(event.date)
  const date = Number.isNaN(eventDate.getTime()) ? 'Date to be announced' : eventDate.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = Number.isNaN(eventDate.getTime()) ? '' : eventDate.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
  const orderTotal = selection.category ? getOrderTotal(selection.category.price, selection.quantity, event.discounts || []) : 0
  const totals = selection.category ? getOrderTotals(selection.category.price, selection.quantity, event.discounts || []) : null

  return <main className="flow-page"><style>{ticketFlowCss}</style>
    <section className="flow-hero">{event.image_url ? <img src={event.image_url} alt={event.name} /> : <div /> }<div className="flow-hero-shade" /><button onClick={() => navigate('/events')}>← Back to events</button><span>LIVE EVENT</span></section>
    <div className="container flow-wrap"><section className="flow-main"><div className="flow-event-title"><h1>{event.name}</h1><div><span>◷ {date}{time && ` · ${time}`}</span><span>⌖ {event.venue || 'Venue TBA'}</span></div></div><nav className="flow-tabs"><a href="#tickets">Tickets</a><a href="#details">Event details</a><a href="#location">Location</a></nav>
      <section className="flow-info"><div><p>Date</p><strong>{date}</strong></div><div><p>Time</p><strong>{time || 'Time TBA'}</strong></div><div id="location"><p>Location</p><strong>{event.venue || 'Venue TBA'}</strong></div></section>
      <section id="tickets" className="flow-section"><header><p>01 / SELECT</p><h2>Choose your tickets</h2></header><TicketPicker categories={event.seat_categories || []} selection={selection} onSelectionChange={handleSelectionChange} /></section>
      {event.description && <section id="details" className="flow-section flow-about"><header><p>02 / ABOUT</p><h2>Event details</h2></header><p>{event.description}</p></section>}
    </section>
    <aside className="flow-cart"><div className="flow-cart-top"><p>Your ticket desk</p><h2>{submitted ? 'Order prepared' : selection.category ? 'Order summary' : 'Your order'}</h2></div>
      {submitted ? <div className="flow-success"><i>✓</i><h3>WhatsApp is ready</h3><p>Send the prepared message. After payment is confirmed, your ticket will be delivered to the email address you entered.</p><button onClick={() => { setSubmitted(false); setSelection({ category: null, quantity: 1 }); setForm({ name: '', email: '', phone: '' }); setExtraNames([]) }}>Start a new order</button></div> : <div className="flow-cart-body">
        <div className="flow-step">1. Ticket choice <b>{selection.category ? `${selection.quantity} × ${selection.category.name}` : 'Not selected'}</b></div>
        <Field label="Full name *" name="name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Ahmed Khan" />
        <Field label="Email address *" name="email" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="tickets@email.com" hint="Your confirmed ticket will be sent here." />
        <Field label="Phone number" name="phone" type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="+92 300 000 0000" />
        {extraNames.length > 0 && <div className="flow-extra"><p>Additional attendee names *</p>{extraNames.map((name, index) => <input key={index} value={name} onChange={event => setExtraNames(current => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Ticket ${index + 2} — full name`} />)}</div>}
        <div className="flow-total">{totals ? <><div><span>{selection.quantity} × {selection.category.name}</span><b>PKR {totals.subtotal.toLocaleString()}</b></div><div><span>Processing and platform fees</span><b>PKR {totals.fees.toLocaleString()}</b></div><div className="flow-grand"><span>Total due</span><strong>PKR {orderTotal.toLocaleString()}</strong></div></> : <p>Select a ticket type to see your total.</p>}</div>
        {formError && <p className="flow-error">{formError}</p>}<button className="flow-whatsapp" onClick={handleSendWhatsapp} disabled={sending}>{sending ? 'Preparing order…' : 'Continue on WhatsApp →'}</button><p className="flow-note">No payment is collected here. We send payment instructions in WhatsApp; the verified ticket is then emailed to you.</p>
      </div>}
    </aside></div>
  </main>
}

const ticketFlowCss = `
  .flow-page { --f-ink:#09070d; --f-panel:#151218; --f-panel2:#211b24; --f-pink:#ff2bb8; --f-line:#4c3d4e; min-height:100vh; background:var(--f-ink); color:#fff8fd; font-family:'DM Sans',sans-serif; }.flow-page *{box-sizing:border-box}.flow-loading{min-height:70vh;display:grid;place-content:center;gap:14px;background:var(--f-ink);color:#fff8fd;text-align:center}.flow-loading span{width:34px;height:34px;margin:auto;border:3px solid rgba(255,43,184,.2);border-top-color:var(--f-pink);border-radius:50%;animation:flowspin .8s linear infinite}.flow-loading button{border:1px solid var(--f-pink);padding:10px 15px;background:transparent;color:#fff;cursor:pointer}@keyframes flowspin{to{transform:rotate(360deg)}}
  .flow-hero{position:relative;height:clamp(240px,38vw,500px);overflow:hidden;background:#1d1120}.flow-hero>img,.flow-hero>div{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.flow-hero-shade{background:linear-gradient(0deg,rgba(9,7,13,.95),rgba(9,7,13,.05) 70%)}.flow-hero button{position:absolute;z-index:2;top:24px;left:24px;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:9px 13px;background:rgba(9,7,13,.72);color:#fff;font:600 12px 'DM Sans',sans-serif;cursor:pointer}.flow-hero>span{position:absolute;z-index:2;left:30px;bottom:24px;border-radius:999px;padding:5px 9px;background:var(--f-pink);color:#250713;font-size:9px;font-weight:800;letter-spacing:.12em}
  .flow-wrap{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:42px;padding-top:38px;padding-bottom:80px}.flow-event-title h1{margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-size:clamp(2.6rem,5vw,4.5rem);font-weight:400;letter-spacing:.02em;line-height:.95}.flow-event-title>div{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:16px;color:#d7c8d8;font-size:13px;font-weight:600}.flow-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:28px 0 20px;border-radius:999px;padding:6px;background:#080609}.flow-tabs a{border-radius:999px;padding:10px;color:#cdbdce;font-size:12px;font-weight:700;text-align:center;text-decoration:none}.flow-tabs a:first-child{background:var(--f-pink);color:#230711}.flow-info{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.flow-info>div{min-height:84px;border:1px solid var(--f-line);border-radius:12px;padding:14px;background:var(--f-panel)}.flow-info p,.flow-section header p{margin:0;color:#ff9ae0;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.flow-info strong{display:block;margin-top:7px;color:#fff;font-size:13px;line-height:1.35}.flow-section{margin-top:42px}.flow-section header{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:14px}.flow-section h2{margin:5px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem;font-weight:400;letter-spacing:.02em}.flow-about>p{max-width:700px;color:#c6b8c8;font-size:14px;line-height:1.75}
  .flow-ticket-list{display:grid;gap:9px}.flow-ticket-row{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:12px;width:100%;border:1px solid var(--f-line);border-radius:12px;padding:15px;background:var(--f-panel);color:#fff;text-align:left;cursor:pointer;transition:border-color .18s,background .18s,transform .18s}.flow-ticket-row:hover,.flow-ticket-row.is-selected{border-color:var(--f-pink);background:linear-gradient(90deg,rgba(255,43,184,.13),var(--f-panel))}.flow-ticket-row.is-sold{opacity:.52;cursor:not-allowed}.flow-ticket-radio{display:grid;width:20px;height:20px;place-items:center;border:2px solid #9a879d;border-radius:50%}.flow-ticket-row.is-selected .flow-ticket-radio{border-color:var(--f-pink)}.flow-ticket-row.is-selected .flow-ticket-radio i{width:9px;height:9px;border-radius:50%;background:var(--f-pink)}.flow-ticket-copy strong,.flow-ticket-price{display:block;font-size:14px}.flow-ticket-copy small,.flow-ticket-price small{display:block;margin-top:4px;color:#b8a8ba;font-size:11px}.flow-ticket-price{color:#ff9ae0;font-weight:800;text-align:right}.flow-quantity{display:flex;align-items:center;justify-content:space-between;border:1px dashed #6b576c;border-radius:12px;padding:14px;background:#110d14}.flow-quantity p{margin:0;color:#fff;font-size:13px;font-weight:700}.flow-quantity span{display:block;margin-top:3px;color:#b8a8ba;font-size:11px}.flow-stepper{display:flex;align-items:center}.flow-stepper button,.flow-stepper b{display:grid;width:34px;height:34px;place-items:center;border:1px solid #6b576c;background:#201822;color:#fff;font-size:18px}.flow-stepper button{cursor:pointer}.flow-stepper button:disabled{opacity:.35;cursor:not-allowed}.flow-stepper b{border-inline:0;color:#ff9ae0;font-size:14px}
  .flow-cart{position:sticky;top:95px;align-self:start;overflow:hidden;border:1px solid #5a475c;border-radius:16px;background:var(--f-panel);box-shadow:0 24px 60px rgba(0,0,0,.35)}.flow-cart-top{padding:20px 22px;border-bottom:1px dashed #665367;background:linear-gradient(135deg,#2b1b2b,#151218)}.flow-cart-top p{margin:0;color:#ff9ae0;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.flow-cart-top h2{margin:5px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:1.9rem;font-weight:400;letter-spacing:.02em}.flow-cart-body{display:grid;gap:16px;padding:20px}.flow-step{display:flex;justify-content:space-between;gap:12px;border-radius:8px;padding:10px;background:#211a24;color:#bfaec1;font-size:11px}.flow-step b{color:#fff;font-weight:700;text-align:right}.flow-field>span,.flow-extra>p{display:block;margin-bottom:7px;color:#d7c9d8;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.flow-field input,.flow-extra input{width:100%;border:1px solid #5b485d;border-radius:8px;padding:12px;background:#0d0a10;color:#fff;font:13px 'DM Sans',sans-serif;outline:0}.flow-field input:focus,.flow-extra input:focus{border-color:var(--f-pink)}.flow-field small{display:block;margin-top:5px;color:#a998ab;font-size:10px}.flow-extra{display:grid;gap:7px}.flow-total{display:grid;gap:9px;border-top:1px dashed #665367;border-bottom:1px dashed #665367;padding:14px 0}.flow-total>div{display:flex;justify-content:space-between;gap:12px;color:#c3b4c4;font-size:12px}.flow-total b{font-weight:600;color:#fff}.flow-total .flow-grand{align-items:end;padding-top:5px}.flow-grand strong{color:#ff9ae0;font-family:'Bebas Neue',Impact,sans-serif;font-size:1.9rem;font-weight:400;letter-spacing:.02em}.flow-error{margin:0;border:1px solid rgba(255,90,90,.5);border-radius:8px;padding:9px;color:#ffaaaa;font-size:12px}.flow-whatsapp{border:0;border-radius:8px;padding:15px;background:var(--f-pink);color:#240611;font:800 13px 'DM Sans',sans-serif;cursor:pointer}.flow-whatsapp:disabled{opacity:.55;cursor:not-allowed}.flow-note{margin:0;color:#ab9bad;font-size:10px;line-height:1.55;text-align:center}.flow-success{padding:28px;text-align:center}.flow-success i{display:grid;width:50px;height:50px;place-items:center;margin:auto;border:1px solid var(--f-pink);border-radius:50%;color:var(--f-pink);font-size:22px;font-style:normal}.flow-success h3{margin:15px 0 8px;font-family:'Bebas Neue',Impact,sans-serif;font-size:1.8rem;font-weight:400}.flow-success p{color:#c7b8c8;font-size:12px;line-height:1.65}.flow-success button{width:100%;margin-top:17px;border:1px solid #6a556b;border-radius:8px;padding:11px;background:transparent;color:#fff;cursor:pointer}
  @media(max-width:900px){.flow-wrap{grid-template-columns:1fr}.flow-cart{position:static}.flow-info{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.flow-hero{height:205px;border-bottom:4px solid #080609}.flow-hero button{top:13px;left:13px;padding:7px 10px;font-size:10px}.flow-hero>span{left:15px;bottom:13px;font-size:8px}.flow-wrap{padding-top:19px;padding-bottom:45px}.flow-event-title h1{font-size:2.5rem}.flow-event-title>div{display:grid;gap:5px;margin-top:10px;font-size:11px}.flow-tabs{margin:18px 0 13px;padding:4px}.flow-tabs a{padding:8px 4px;font-size:10px}.flow-info{grid-template-columns:1fr;gap:6px}.flow-info>div{display:flex;min-height:0;align-items:center;justify-content:space-between;padding:11px 13px}.flow-info strong{margin:0;font-size:11px;text-align:right}.flow-section{margin-top:27px}.flow-section h2{font-size:1.7rem}.flow-ticket-row{grid-template-columns:18px 1fr auto;gap:9px;padding:12px}.flow-ticket-copy strong,.flow-ticket-price{font-size:12px}.flow-ticket-copy small,.flow-ticket-price small{font-size:9px}.flow-quantity{padding:11px}.flow-stepper button,.flow-stepper b{width:31px;height:31px}.flow-cart{border-radius:14px}.flow-cart-top{padding:16px 17px}.flow-cart-body{gap:13px;padding:17px}.flow-whatsapp{padding:14px}.flow-note{font-size:9px}}
`
