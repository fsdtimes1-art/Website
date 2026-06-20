import { Link } from 'react-router-dom'

const SECTIONS = [
  { id: 'eligibility', label: '1. Eligibility & Accounts' },
  { id: 'tickets',     label: '2. Tickets & Purchases' },
  { id: 'payments',    label: '3. Payments & Fees' },
  { id: 'refunds',     label: '4. Cancellations & Refunds' },
  { id: 'conduct',     label: '5. Acceptable Use' },
  { id: 'liability',   label: '6. Liability & Disclaimers' },
  { id: 'changes',     label: '7. Changes to These Terms' },
  { id: 'contact',     label: '8. Contact Us' },
]

export default function Terms() {
  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden' }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 60% 60% at 30% 50%, rgba(245,158,11,0.07) 0%, transparent 70%),
            var(--black)
          `,
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag fade-up" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Legal
          </span>
          <h1 className="fade-up fade-up-delay-1" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(40px, 6vw, 72px)',
            letterSpacing: '3px',
            marginBottom:  '16px',
          }}>
            TERMS &amp; CONDITIONS
          </h1>
          <p className="fade-up fade-up-delay-2" style={{
            color:    'var(--gray-light)',
            fontSize: '14px',
            maxWidth: '480px',
          }}>
            Last updated: January 2026 &middot; Please read these terms carefully before using FaisalabadTimes.co
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div className="legal-grid">

            {/* ── Sticky TOC ── */}
            <nav className="legal-toc">
              <p style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '13px',
                letterSpacing: '2px',
                color:         'var(--gray-mid)',
                marginBottom:  '16px',
              }}>
                CONTENTS
              </p>
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    display:        'block',
                    color:          'var(--gray-mid)',
                    fontSize:       '13px',
                    textDecoration: 'none',
                    padding:        '6px 0',
                    transition:     'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-mid)'}
                >
                  {s.label}
                </a>
              ))}
            </nav>

            {/* ── Content ── */}
            <div className="legal-content">

              <p style={{ color: 'var(--gray-light)', fontSize: '14px', lineHeight: '1.7', marginBottom: '40px' }}>
                These Terms &amp; Conditions ("Terms") govern your access to and use of FaisalabadTimes.co
                (the "Platform"), operated by FaisalabadTimes.co, which allows event organizers to list and sell
                tickets and allows users to discover, purchase, and manage tickets to events. By creating an
                account, browsing the Platform, or purchasing a ticket, you agree to be bound by these Terms.
              </p>

              <LegalSection id="eligibility" title="1. Eligibility & Accounts">
                <p>
                  You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create
                  an account or purchase tickets on the Platform. By registering, you confirm that the information
                  you provide is accurate and current.
                </p>
                <ul>
                  <li>You're responsible for keeping your account credentials confidential.</li>
                  <li>You're responsible for all activity under your account.</li>
                  <li>Contact us immediately if you suspect unauthorized use of your account.</li>
                </ul>
              </LegalSection>

              <LegalSection id="tickets" title="2. Tickets & Purchases">
                <p>
                  Tickets sold through the Platform are issued by the event organizer; we act as a ticketing
                  intermediary. A ticket purchase is a contract between you and the relevant event organizer,
                  subject to any event-specific terms shown on the event listing.
                </p>
                <ul>
                  <li>Each ticket is valid only for the specified event, date, time, and seat category.</li>
                  <li>Tickets may not be resold above face value unless permitted by the organizer and applicable law.</li>
                  <li>You must present a valid order confirmation, QR code, or ID for entry as required by the event.</li>
                </ul>
              </LegalSection>

              <LegalSection id="payments" title="3. Payments & Fees">
                <p>
                  Prices are displayed in PKR and may include a booking or service fee, shown before checkout is
                  completed. Payments are processed through our third-party payment provider; we do not store your
                  full card details on our own servers.
                </p>
                <ul>
                  <li>All payments must clear before a ticket is confirmed and issued.</li>
                  <li>Fraudulent or disputed transactions may result in order cancellation and account suspension.</li>
                </ul>
              </LegalSection>

              <LegalSection id="refunds" title="4. Cancellations & Refunds">
                <p>
                  Refund eligibility is generally set by the event organizer and shown on the event page. Unless
                  otherwise stated:
                </p>
                <ul>
                  <li>Tickets are non-refundable except where an event is cancelled, materially rescheduled, or required by law.</li>
                  <li>If an event is cancelled, you'll be offered a refund of the ticket price; service fees may be non-refundable.</li>
                  <li>If an event is rescheduled, your ticket remains valid for the new date unless you request a refund within a reasonable window of the change being announced.</li>
                </ul>
              </LegalSection>

              <LegalSection id="conduct" title="5. Acceptable Use">
                <p>You agree not to:</p>
                <ul>
                  <li>Use bots or automated tools to purchase tickets in bulk or bypass purchase limits;</li>
                  <li>Use the Platform for fraudulent transactions;</li>
                  <li>Upload false, misleading, or infringing event content;</li>
                  <li>Interfere with the security or normal operation of the Platform.</li>
                </ul>
              </LegalSection>

              <LegalSection id="liability" title="6. Liability & Disclaimers">
                <p>
                  The Platform is provided "as is." We don't guarantee that events will proceed as scheduled or
                  that listings are free of error. To the maximum extent permitted under the laws of Pakistan, we
                  are not liable for indirect or consequential damages arising from your use of the Platform or
                  attendance at an event.
                </p>
              </LegalSection>

              <LegalSection id="changes" title="7. Changes to These Terms">
                <p>
                  We may update these Terms from time to time. Material changes will be notified via the Platform
                  or by email before they take effect. Continued use after changes take effect means you accept
                  the revised Terms.
                </p>
              </LegalSection>

              <LegalSection id="contact" title="8. Contact Us">
                <p>
                  Questions about these Terms can be sent to{' '}
                  <a href="mailto:hello@FaisalabadTimes.co.com" style={{ color: 'var(--gold)' }}>
                    hello@FaisalabadTimes.co.com
                  </a>.
                </p>
              </LegalSection>

              <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '40px' }}>
                <Link to="/privacy" style={{ color: 'var(--gold)', fontSize: '13px', textDecoration: 'none' }}>
                  View our Privacy Policy →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      <style>{`
        .legal-grid {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 56px;
          align-items: start;
        }
        .legal-toc {
          position: sticky;
          top: 90px;
        }
        @media (max-width: 800px) {
          .legal-grid { grid-template-columns: 1fr; }
          .legal-toc { position: static; display: none; }
        }
      `}</style>
    </div>
  )
}

function LegalSection({ id, title, children }) {
  return (
    <div id={id} style={{ marginBottom: '36px', scrollMarginTop: '90px' }}>
      <h2 style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '20px',
        letterSpacing: '1px',
        color:         'var(--white)',
        marginBottom:  '14px',
        borderLeft:    '3px solid var(--gold)',
        paddingLeft:   '14px',
      }}>
        {title}
      </h2>
      <div style={{ color: 'var(--gray-light)', fontSize: '14px', lineHeight: '1.7' }}>
        {children}
      </div>
      <style>{`
        #${id} ul { margin: 10px 0 0 20px; }
        #${id} li { margin-bottom: 6px; }
        #${id} p { margin-bottom: 10px; }
      `}</style>
    </div>
  )
}