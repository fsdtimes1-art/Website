import { useState } from 'react'
import { Link } from 'react-router-dom'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'

const SERVICE_TYPES = [
  'Restaurant Digital Marketing',
  'FT Page Business Promotion',
  'Event Ticketing & Management',
  'Social Media Management',
  'Paid Advertising',
  'Event Promotion',
  'Brand Collaboration',
  'Custom Requirement',
]

const BUDGET_RANGES = [
  'Under PKR 1 Lac',
  'PKR 1 – 5 Lacs',
  'PKR 5 – 20 Lacs',
  'PKR 20 – 50 Lacs',
  'PKR 50 Lacs+',
  'Not sure yet',
]

const SERVICES = [
  {
    badge:    'Restaurant Digital Marketing',
    live:     false,
    headline: 'FILL YOUR TABLES,\nGROW YOUR BRAND.',
    desc:     'Full-service social media management, content creation, and paid ads built specifically for Faisalabad restaurants.',
    features: [
      'Instagram & Facebook Management',
      'Monthly Content Calendar',
      'Paid Ad Campaigns (Meta/Google)',
      'Monthly Performance Reports',
      'Photography Coordination',
    ],
    price:    'PKR 15,000 / mo',
    highlight: false,
  },
  {
    badge:    'FT Page Business Promotion',
    live:     true,
    headline: 'GET SEEN BY\n100K+ FOLLOWERS.',
    desc:     'Promote your business, product launch, or special offer directly on the Faisalabad Times social media page.',
    features: [
      'Dedicated Post on FT Page',
      'Instagram Story Feature',
      'Reel Promotion',
      '100K+ local Faisalabad audience',
      'Guaranteed reach reporting',
    ],
    price:    'PKR 3,000 / mo',
    highlight: true,
  },
  {
    badge:    'Event Ticketing & Management',
    live:     true,
    headline: 'WE SELL YOUR TICKETS.\nYOU FOCUS ON THE SHOW.',
    desc:     'End-to-end ticket sales, event promotion across FT channels, and WhatsApp-based booking management.',
    features: [
      'Event listing on FT website',
      'Promotion on FT social channels',
      'WhatsApp booking management',
      'E-ticket creation & dispatch',
      'Post-event recap content',
    ],
    price:    null,
    highlight: false,
  },
]

export default function BookMeeting() {
  const [form, setForm] = useState({
    name:      '',
    phone:     '',
    email:     '',
    serviceType: '',
    budget:    '',
    date:      '',
    attendees: '',
    message:   '',
    business: '',
    marketingBudget: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    const required = ['name', 'phone', 'serviceType']
    const missing  = required.find(k => !form[k].trim())
    if (missing) return

    const lines = [
      `👋 *New Meeting Request — EventFlow*`,
      ``,
      `*Name:* ${form.name}`,
      `*Phone:* ${form.phone}`,
      form.email     ? `*Email:* ${form.email}`                   : null,
      `*Service Interested In:* ${form.serviceType}`,
      form.business  ? `*Business Name:* ${form.business}`        : null,
      form.marketingBudget  ? `*Marketing Budget:* ${form.marketingBudget}`     : null,
      form.budget    ? `*Budget:* ${form.budget}`                  : null,
      form.message   ? `\n*Notes:*\n${form.message}`               : null,
    ].filter(Boolean).join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`
    setSubmitted(true)
    setTimeout(() => window.open(url, '_blank'), 400)
  }

  const isValid = form.name.trim() && form.phone.trim() && form.serviceType

  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '80px 0 64px', overflow: 'hidden' }}>
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

      {/* ── Services ── */}
      <section style={{ padding: '0 0 96px' }}>
        <div className="container">

          <div style={{ marginBottom: '48px' }}>
            <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
              What We Offer
            </span>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(32px, 5vw, 56px)',
              letterSpacing: '2px',
              marginBottom:  '12px',
            }}>
              OUR SERVICES
            </h2>
            <p style={{ color: 'var(--gray-light)', fontSize: '15px', maxWidth: '520px', lineHeight: '1.6' }}>
              Everything you need to grow your brand, fill your seats, and run successful events in Faisalabad.
            </p>
          </div>

          <div className="services-grid">
            {SERVICES.map((svc, i) => (
              <div key={i} className={`service-card${svc.highlight ? ' service-card--highlight' : ''}`}>
                <div className="service-card-inner">

                  {/* Top meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="service-badge">Faisalabad Times Verified</span>
                    {svc.live && (
                      <>
                        <span className="service-live-dot" />
                        <span style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Active Channel
                        </span>
                      </>
                    )}
                  </div>

                  <p style={{ color: 'var(--gray-mid)', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {svc.badge}
                  </p>

                  <h3 style={{
                    fontFamily:    'var(--font-display)',
                    fontSize:      '24px',
                    letterSpacing: '1.5px',
                    lineHeight:    '1.25',
                    marginBottom:  '12px',
                    whiteSpace:    'pre-line',
                  }}>
                    {svc.headline}
                  </h3>

                  <p style={{ color: 'var(--gray-light)', fontSize: '13px', lineHeight: '1.65', marginBottom: '24px' }}>
                    {svc.desc}
                  </p>

                  <ul className="service-features">
                    {svc.features.map((f, j) => <li key={j}>{f}</li>)}
                  </ul>

                  <div className="service-footer">
                    {svc.price ? (
                      <div>
                        <p style={{ color: 'var(--gray-mid)', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Starting From
                        </p>
                        <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '1px' }}>
                          {svc.price}
                        </p>
                      </div>
                    ) : <div />}
                    <button
                      onClick={() => {
                        document.getElementById('booking-form')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }}
                      className="btn-gold"
                      style={{
                        fontSize: '13px',
                        padding: '10px 20px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Book Free Meeting
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section id="booking-form" style={{ padding: '0 0 96px' }}>
        <div className="container">

          <div style={{ marginBottom: '48px' }}>
            <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
              Get In Touch
            </span>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(32px, 5vw, 56px)',
              letterSpacing: '2px',
              marginBottom:  '12px',
            }}>
              BOOK A MEETING
            </h2>
            <p style={{ color: 'var(--gray-light)', fontSize: '15px', maxWidth: '480px', lineHeight: '1.6' }}>
              Tell us about your event and we'll get back to you on WhatsApp within a few hours.
            </p>
          </div>

          <div className="book-grid">

            {/* Left: Why us */}
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
                  { icon: '🎯', title: 'End-to-End Management',    desc: 'Venue, ticketing, logistics, on-ground staff — all handled by us.' },
                  { icon: '🎟️', title: 'Built-In Ticketing',       desc: 'Our platform handles sales, seat allocation, QR check-in, and revenue reporting.' },
                  { icon: '📊', title: 'Real-Time Insights',       desc: 'Live dashboards showing sales, attendance, and revenue as it happens.' },
                  { icon: '🤝', title: 'Dedicated Point of Contact', desc: 'One person responsible for your event from kickoff to curtain call.' },
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
                  { icon: '📧', label: 'Email',    value: 'hello@eventflow.com' },
                  { icon: '📍', label: 'Location', value: 'Karachi, Pakistan' },
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

            {/* Right: Form */}
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
                  <div style={{
                    background:   'var(--black-3)',
                    padding:      '20px 28px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '2px' }}>
                      LET'S GROW YOUR BRAND
                    </h3>
                    <p style={{ color: 'var(--gray-mid)', fontSize: '12px', marginTop: '4px' }}>
                      Tell us what you need and our team will contact you shortly.
                    </p>
                  </div>

                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="field-row">
                      <Field label="Your Name *"        name="name"      placeholder="Ahmed Khan"          value={form.name}      onChange={handleField} />
                      <Field label="WhatsApp Number *"  name="phone"     type="tel" placeholder="+92 300 000 0000" value={form.phone} onChange={handleField} />
                    </div>
                    <Field label="Email Address" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleField} />

                    <div>
                      <label style={labelStyle}>Service Interested In *</label>

                      <select
                        name="serviceType"
                        value={form.serviceType}
                        onChange={handleField}
                        className="input"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">Select a service...</option>

                        {SERVICE_TYPES.map(service => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Budget Range</label>
                      <select name="budget" value={form.budget} onChange={handleField} className="input" style={{ cursor: 'pointer' }}>
                        <option value="">Select budget range...</option>
                        {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="field-row">
                      <Field
                        label="Business / Brand Name"
                        name="business"
                        placeholder="Your business name"
                        value={form.business}
                        onChange={handleField}
                      />

                      <Field
                        label="Monthly Marketing Budget"
                        name="marketingBudget"
                        placeholder="Optional"
                        value={form.marketingBudget}
                        onChange={handleField}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Additional Notes</label>
                      <textarea
                        name="message"
                        placeholder="Tell us about your business, goals, campaign idea, or requirements..."
                        value={form.message}
                        onChange={handleField}
                        className="input"
                        rows={4}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                    </div>

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
        /* Services grid */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        .service-card {
          background: var(--black-2);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.25s, transform 0.25s;
          display: flex;
          flex-direction: column;
        }
        .service-card:hover {
          border-color: rgba(245,158,11,0.25);
          transform: translateY(-4px);
        }
        .service-card--highlight {
          border-color: rgba(245,158,11,0.2);
          background: linear-gradient(160deg, rgba(245,158,11,0.06) 0%, var(--black-2) 50%);
        }
        .service-card-inner {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .service-badge {
          display: inline-block;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.2);
          color: var(--gold);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .service-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .service-features {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .service-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gray-light);
          font-size: 13px;
          line-height: 1.4;
        }
        .service-features li::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          opacity: 0.7;
        }
        .service-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          gap: 12px;
        }

        /* Book form grid */
        .book-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
          gap: 64px;
          align-items: start;
        }
        .form-sticky {
          position: sticky;
          top: 90px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Mobile */
        @media (max-width: 900px) {
          .services-grid {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
        }
        @media (max-width: 768px) {
          .book-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .book-grid > div:last-child { order: -1; }
          .form-sticky { position: static; }
          .field-row { grid-template-columns: 1fr; }
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
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', fontSize: '36px',
      }}>
        💬
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '2px', marginBottom: '12px' }}>
        OPENING WHATSAPP
      </h3>
      <p style={{
        color: 'var(--gray-light)', fontSize: '14px', lineHeight: '1.6',
        maxWidth: '320px', margin: '0 auto 28px',
      }}>
        WhatsApp should open with your message pre-filled. Just hit Send — we'll respond within a few hours.
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
