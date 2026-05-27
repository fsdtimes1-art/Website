import { useState } from 'react'
import { Link }     from 'react-router-dom'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'

const EVENT_TYPES = [
  'Corporate Conference',
  'Product Launch',
  'Wedding / Nikkah',
  'Private Party',
  'Concert / Live Show',
  'Exhibition / Expo',
  'Sports Event',
  'Other',
]

const BUDGET_RANGES = [
  'Under PKR 1 Lac',
  'PKR 1 – 5 Lacs',
  'PKR 5 – 20 Lacs',
  'PKR 20 – 50 Lacs',
  'PKR 50 Lacs+',
  'Not sure yet',
]

export default function BookMeeting() {
  const [form, setForm] = useState({
    name:      '',
    phone:     '',
    email:     '',
    eventType: '',
    budget:    '',
    date:      '',
    attendees: '',
    message:   '',
  })

  const [submitted, setSubmitted] = useState(false)

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    const required = ['name', 'phone', 'eventType']
    const missing  = required.find(k => !form[k].trim())
    if (missing) return

    const lines = [
      `👋 *New Meeting Request — EventFlow*`,
      ``,
      `*Name:* ${form.name}`,
      `*Phone:* ${form.phone}`,
      form.email     ? `*Email:* ${form.email}`          : null,
      `*Event Type:* ${form.eventType}`,
      form.budget    ? `*Budget:* ${form.budget}`         : null,
      form.date      ? `*Preferred Date:* ${form.date}`   : null,
      form.attendees ? `*Expected Attendees:* ${form.attendees}` : null,
      form.message   ? `\n*Notes:*\n${form.message}`      : null,
    ].filter(Boolean).join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`
    setSubmitted(true)
    setTimeout(() => window.open(url, '_blank'), 400)
  }

  const isValid = form.name.trim() && form.phone.trim() && form.eventType

  return (
    <div>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        padding:  '80px 0 64px',
        overflow: 'hidden',
      }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 60% 60% at 30% 50%, rgba(245,158,11,0.08) 0%, transparent 70%),
            var(--black)
          `,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag fade-up" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Let's Talk
          </span>
          <h1 className="fade-up fade-up-delay-1" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(48px, 7vw, 88px)',
            letterSpacing: '3px',
            marginBottom:  '16px',
          }}>
            BOOK A MEETING
          </h1>
          <p className="fade-up fade-up-delay-2" style={{
            color:      'var(--gray-light)',
            fontSize:   '16px',
            maxWidth:   '480px',
            lineHeight: '1.6',
          }}>
            Tell us about your event and we'll get back to you on WhatsApp within a few hours.
          </p>
        </div>
      </section>

      {/* ── Main ── */}
      <section style={{ padding: '0 0 96px' }}>
        <div className="container">
          <div className="book-grid">

            {/* ── Left: Why us ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

              <div>
                <h2 style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      '32px',
                  letterSpacing: '2px',
                  marginBottom:  '16px',
                }}>
                  WHY EVENTFLOW?
                </h2>
                <p style={{ color: 'var(--gray-light)', fontSize: '15px', lineHeight: '1.7' }}>
                  We've managed over 50 events across Pakistan — from intimate corporate dinners
                  to large-scale concerts. Our team handles everything so you don't have to.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    icon:  '🎯',
                    title: 'End-to-End Management',
                    desc:  'Venue, ticketing, logistics, on-ground staff — all handled by us.',
                  },
                  {
                    icon:  '🎟️',
                    title: 'Built-In Ticketing',
                    desc:  'Our platform handles sales, seat allocation, QR check-in, and revenue reporting.',
                  },
                  {
                    icon:  '📊',
                    title: 'Real-Time Insights',
                    desc:  'Live dashboards showing sales, attendance, and revenue as it happens.',
                  },
                  {
                    icon:  '🤝',
                    title: 'Dedicated Point of Contact',
                    desc:  'One person responsible for your event from kickoff to curtain call.',
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display:      'flex',
                    gap:          '16px',
                    alignItems:   'flex-start',
                    background:   'var(--black-2)',
                    border:       '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding:      '20px',
                  }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{
                        fontFamily:    'var(--font-display)',
                        fontSize:      '17px',
                        letterSpacing: '1px',
                        color:         'var(--white)',
                        marginBottom:  '4px',
                      }}>
                        {item.title}
                      </p>
                      <p style={{ color: 'var(--gray-mid)', fontSize: '13px', lineHeight: '1.5' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact block */}
              <div style={{
                background:   'var(--black-2)',
                border:       '1px solid rgba(245,158,11,0.15)',
                borderRadius: '12px',
                padding:      '24px',
              }}>
                <p style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      '16px',
                  letterSpacing: '2px',
                  color:         'var(--gold)',
                  marginBottom:  '16px',
                }}>
                  CONTACT US DIRECTLY
                </p>
                {[
                  { icon: '📱', label: 'WhatsApp', value: '+92 300 123 4567' },
                  { icon: '📧', label: 'Email',     value: 'hello@eventflow.com' },
                  { icon: '📍', label: 'Location',  value: 'Karachi, Pakistan' },
                ].map((c, i) => (
                  <div key={i} style={{
                    display:       'flex',
                    gap:           '12px',
                    alignItems:    'center',
                    paddingBottom: i < 2 ? '12px' : '0',
                    marginBottom:  i < 2 ? '12px' : '0',
                    borderBottom:  i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{ fontSize: '16px' }}>{c.icon}</span>
                    <div>
                      <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {c.label}
                      </p>
                      <p style={{ color: 'var(--white)', fontSize: '14px' }}>{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Form ── */}
            <div className="form-sticky">
              {submitted ? (
                <SuccessState onReset={() => setSubmitted(false)} />
              ) : (
                <div style={{
                  background:   'var(--black-2)',
                  border:       '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  overflow:     'hidden',
                }}>
                  {/* Form header */}
                  <div style={{
                    background:   'var(--black-3)',
                    padding:      '20px 28px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <h3 style={{
                      fontFamily:    'var(--font-display)',
                      fontSize:      '20px',
                      letterSpacing: '2px',
                    }}>
                      TELL US ABOUT YOUR EVENT
                    </h3>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>
                      We'll reach out on WhatsApp within a few hours
                    </p>
                  </div>

                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Name + Phone — stack on mobile */}
                    <div className="field-row">
                      <Field label="Your Name *" name="name" placeholder="Ahmed Khan" value={form.name} onChange={handleField} />
                      <Field label="WhatsApp Number *" name="phone" type="tel" placeholder="+92 300 000 0000" value={form.phone} onChange={handleField} />
                    </div>

                    {/* Email */}
                    <Field label="Email Address" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleField} />

                    {/* Event type */}
                    <div>
                      <label style={labelStyle}>Event Type *</label>
                      <select
                        name="eventType"
                        value={form.eventType}
                        onChange={handleField}
                        className="input"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Select event type...</option>
                        {EVENT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label style={labelStyle}>Budget Range</label>
                      <select
                        name="budget"
                        value={form.budget}
                        onChange={handleField}
                        className="input"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Select budget range...</option>
                        {BUDGET_RANGES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date + Attendees — stack on mobile */}
                    <div className="field-row">
                      <Field label="Event Date" name="date" type="date" value={form.date} onChange={handleField} />
                      <Field label="Expected Attendees" name="attendees" type="number" placeholder="e.g. 300" value={form.attendees} onChange={handleField} />
                    </div>

                    {/* Message */}
                    <div>
                      <label style={labelStyle}>Additional Notes</label>
                      <textarea
                        name="message"
                        placeholder="Any specific requirements, venue preferences, or questions..."
                        value={form.message}
                        onChange={handleField}
                        className="input"
                        rows={4}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid}
                      className="btn-gold"
                      style={{
                        width:   '100%',
                        fontSize:'15px',
                        padding: '16px',
                        opacity: isValid ? 1 : 0.5,
                        cursor:  isValid ? 'pointer' : 'not-allowed',
                        gap:     '10px',
                      }}
                    >
                      <span>💬</span>
                      Send via WhatsApp
                    </button>

                    <p style={{ color: 'var(--gray-mid)', fontSize: '11px', textAlign: 'center', lineHeight: '1.5' }}>
                      Clicking the button will open WhatsApp with a pre-filled message.
                      No account needed — just hit Send.
                    </p>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <style>{`
        /* ── Page grid ── */
        .book-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
          gap: 64px;
          align-items: start;
        }

        /* Form sticky only on desktop */
        .form-sticky {
          position: sticky;
          top: 90px;
        }

        /* Inline field pairs */
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .book-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          /* Form comes first on mobile */
          .book-grid > div:last-child {
            order: -1;
          }

          .form-sticky {
            position: static;
          }

          /* Stack name/phone and date/attendees fields */
          .field-row {
            grid-template-columns: 1fr;
          }
        }

        select.input option {
          background: #1a1a1a;
          color: #fff;
        }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display:       'block',
  color:         'var(--gray-light)',
  fontSize:      '11px',
  fontWeight:    '600',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom:  '8px',
}

function Field({ label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        className="input"
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function SuccessState({ onReset }) {
  return (
    <div style={{
      background:   'var(--black-2)',
      border:       '1px solid rgba(245,158,11,0.2)',
      borderRadius: '16px',
      padding:      '48px 32px',
      textAlign:    'center',
    }}>
      <div style={{
        width:          '80px',
        height:         '80px',
        borderRadius:   '50%',
        background:     'rgba(245,158,11,0.1)',
        border:         '2px solid rgba(245,158,11,0.3)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        margin:         '0 auto 24px',
        fontSize:       '36px',
      }}>
        💬
      </div>

      <h3 style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '28px',
        letterSpacing: '2px',
        marginBottom:  '12px',
      }}>
        OPENING WHATSAPP
      </h3>

      <p style={{
        color:        'var(--gray-light)',
        fontSize:     '14px',
        lineHeight:   '1.6',
        marginBottom: '28px',
        maxWidth:     '320px',
        margin:       '0 auto 28px',
      }}>
        WhatsApp should open with your message pre-filled. Just hit Send — we'll
        respond within a few hours.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={onReset} className="btn-ghost" style={{ width: '100%' }}>
          Edit My Details
        </button>
        <Link to="/events" className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
          Browse Events →
        </Link>
      </div>
    </div>
  )
}