import { Link } from 'react-router-dom'

const SECTIONS = [
  { id: 'collect',   label: '1. Information We Collect' },
  { id: 'use',       label: '2. How We Use It' },
  { id: 'payments',  label: '3. Payment Information' },
  { id: 'sharing',   label: '4. How We Share Information' },
  { id: 'cookies',   label: '5. Cookies & Tracking' },
  { id: 'security',  label: '6. Data Security' },
  { id: 'rights',    label: '7. Your Rights' },
  { id: 'contact',   label: '8. Contact Us' },
]

export default function Privacy() {
  return (
    <div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden' }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: `
            radial-gradient(ellipse 60% 60% at 70% 50%, rgba(245,158,11,0.07) 0%, transparent 70%),
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
            PRIVACY POLICY
          </h1>
          <p className="fade-up fade-up-delay-2" style={{
            color:    'var(--gray-light)',
            fontSize: '14px',
            maxWidth: '480px',
          }}>
            Last updated: January 2026 &middot; How we collect, use, and protect your information
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
                This Privacy Policy explains how FaisalabadTimes.co ("we", "us", "our") collects, uses, stores,
                and protects your personal information when you use our platform to browse events, buy or sell
                tickets, or manage an organizer account.
              </p>

              <LegalSection id="collect" title="1. Information We Collect">
                <ul>
                  <li><strong style={{ color: 'var(--white)' }}>Account info</strong> — name, email, phone number, password (stored encrypted)</li>
                  <li><strong style={{ color: 'var(--white)' }}>Order info</strong> — events booked, ticket type/quantity, order history</li>
                  <li><strong style={{ color: 'var(--white)' }}>Payment info</strong> — handled by our payment processor; we don't store full card numbers</li>
                  <li><strong style={{ color: 'var(--white)' }}>Technical data</strong> — IP address, device/browser type, pages visited, cookies</li>
                </ul>
              </LegalSection>

              <LegalSection id="use" title="2. How We Use It">
                <ul>
                  <li>To create and manage your account and process ticket purchases;</li>
                  <li>To send order confirmations, e-tickets, and event updates;</li>
                  <li>To detect and prevent fraud or unauthorized ticket resale;</li>
                  <li>To improve the Platform and understand usage;</li>
                  <li>To send marketing communications, where you haven't opted out.</li>
                </ul>
              </LegalSection>

              <LegalSection id="payments" title="3. Payment Information">
                <p>
                  Payments are processed by our third-party payment partner. We do not store your full card number
                  or CVV on our servers — that data is handled under the processor's own security standards.
                </p>
              </LegalSection>

              <LegalSection id="sharing" title="4. How We Share Information">
                <ul>
                  <li><strong style={{ color: 'var(--white)' }}>With event organizers</strong> — your name and ticket details so they can manage entry and event changes;</li>
                  <li><strong style={{ color: 'var(--white)' }}>With service providers</strong> — payment processors, hosting, and email delivery, under contract;</li>
                  <li><strong style={{ color: 'var(--white)' }}>For legal reasons</strong> — if required by law or to protect the Platform and its users.</li>
                </ul>
                <p style={{ marginTop: '10px' }}>We do not sell your personal information to third parties for their own marketing.</p>
              </LegalSection>

              <LegalSection id="cookies" title="5. Cookies & Tracking">
                <p>
                  We use cookies to keep you logged in, remember preferences, and understand how the Platform is
                  used. You can control cookies through your browser settings; disabling some may affect features
                  like staying logged in or completing checkout.
                </p>
              </LegalSection>

              <LegalSection id="security" title="6. Data Security">
                <p>
                  We use reasonable technical and organizational measures — including encryption in transit and
                  access controls — to protect your information. No method of transmission or storage is 100%
                  secure.
                </p>
              </LegalSection>

              <LegalSection id="rights" title="7. Your Rights">
                <ul>
                  <li>Access, review, and update your account information any time through your profile;</li>
                  <li>Request a copy or deletion of your personal data, subject to legal retention requirements;</li>
                  <li>Opt out of marketing emails via the unsubscribe link or by contacting us.</li>
                </ul>
              </LegalSection>

              <LegalSection id="contact" title="8. Contact Us">
                <p>
                  For privacy-related questions, contact{' '}
                  <a href="mailto:hello@FaisalabadTimes.co.com" style={{ color: 'var(--gold)' }}>
                    hello@FaisalabadTimes.co.com
                  </a>.
                </p>
              </LegalSection>

              <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '40px' }}>
                <Link to="/terms" style={{ color: 'var(--gold)', fontSize: '13px', textDecoration: 'none' }}>
                  View our Terms & Conditions →
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