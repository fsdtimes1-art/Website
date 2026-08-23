/**
 * Midnight Circuit process page: an image-free service-card system that mirrors the
 * homepage What we do hierarchy while describing the existing WhatsApp ticket flow.
 */
import { Link } from 'react-router-dom'

const PROCESS_STEPS = [
  {
    number: '01',
    eyebrow: 'Find your moment',
    title: 'Browse live events',
    text: 'Explore the current listings, compare ticket categories, and open the event that fits your plans.',
    tags: ['Live listings', 'Clear ticket types', 'Quick event details'],
  },
  {
    number: '02',
    eyebrow: 'Choose your access',
    title: 'Pick your ticket',
    text: 'Select the category and quantity you need, then add the names for every person joining you.',
    tags: ['Seat categories', 'Group tickets', 'Buyer details'],
  },
  {
    number: '03',
    eyebrow: 'Send your request',
    title: 'Order on WhatsApp',
    text: 'Your ticket request is prepared as a clear WhatsApp message for the Faisalabad Times team to review.',
    tags: ['Order reference', 'Payment guidance', 'Human support'],
  },
  {
    number: '04',
    eyebrow: 'You are confirmed',
    title: 'Receive your e-ticket',
    text: 'Once payment is verified, the team sends your digital ticket and QR code to the email address you provided.',
    tags: ['Payment verification', 'PDF ticket', 'QR entry'],
  },
]

export default function HowItWorks() {
  return (
    <main className="hiw-page">
      <style>{howItWorksCss}</style>

      <section className="hiw-hero">
        <div className="container">
          <p className="hiw-kicker"><i /> Simple process</p>
          <h1>HOW IT<br /><em>WORKS.</em></h1>
          <p className="hiw-intro">A clear route from the event you want to the ticket in your inbox, without losing the human support when you need it.</p>
        </div>
      </section>

      <section className="hiw-steps-section">
        <div className="container">
          <div className="hiw-section-head">
            <div>
              <p className="hiw-kicker"><i /> Ticket journey</p>
              <h2>FOUR STEPS.<br /><em>ONE EASY PLAN.</em></h2>
            </div>
            <p>Every stage is designed to keep your ticket choice, payment guidance, and confirmation easy to follow.</p>
          </div>

          <div className="hiw-step-grid">
            {PROCESS_STEPS.map(step => (
              <article className="hiw-step-card" key={step.number}>
                <span className="hiw-step-number">{step.number}</span>
                <p className="hiw-step-eyebrow">{step.eyebrow}</p>
                <h3>{step.title}</h3>
                <span className="hiw-card-rule" />
                <p className="hiw-step-text">{step.text}</p>
                <ul>{step.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hiw-cta">
        <div className="container hiw-cta-shell">
          <div>
            <p className="hiw-kicker"><i /> Ready when you are</p>
            <h2>FIND YOUR NEXT<br /><em>LIVE MOMENT.</em></h2>
            <p>See what is on in Faisalabad, or speak to our team about promoting an event, brand, or local campaign.</p>
          </div>
          <div className="hiw-cta-actions">
            <Link to="/events" className="hiw-blue-button"><i /> Browse events</Link>
            <Link to="/book-meeting" className="hiw-text-link">Talk to the team <span>&middot;</span></Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const howItWorksCss = String.raw`
  .hiw-page{--hiw-blue:#29dcff;--hiw-soft:#a9f4ff;--hiw-ink:#050b14;--hiw-panel:#0b1725;min-height:100vh;overflow:hidden;background:linear-gradient(160deg,#050b14 0%,#091b2d 42%,#050b14 100%);color:#f2fbff}.hiw-page *{box-sizing:border-box}.hiw-hero{position:relative;overflow:hidden;padding:126px 0 86px;border-bottom:1px solid rgba(63,146,196,.2);background:linear-gradient(100deg,rgba(6,36,57,.92),rgba(5,13,23,.86))}.hiw-hero::before{position:absolute;inset:0;content:'';background:radial-gradient(circle at 18% 48%,rgba(41,220,255,.2),transparent 27%),linear-gradient(90deg,rgba(41,220,255,.08) 1px,transparent 1px),linear-gradient(rgba(41,220,255,.08) 1px,transparent 1px);background-size:auto,58px 58px,58px 58px;mask-image:linear-gradient(90deg,black,transparent 82%);pointer-events:none}.hiw-hero .container{position:relative;z-index:1}.hiw-kicker{display:flex;align-items:center;gap:8px;margin:0;color:var(--hiw-soft);font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.hiw-kicker i,.hiw-blue-button i{width:7px;height:7px;border-radius:50%;background:var(--hiw-blue);box-shadow:0 0 0 4px rgba(41,220,255,.13)}.hiw-hero h1,.hiw-section-head h2,.hiw-cta h2{margin:14px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;letter-spacing:.015em;line-height:.85}.hiw-hero h1{font-size:clamp(4.1rem,8vw,7.4rem)}.hiw-hero em,.hiw-section-head em,.hiw-cta em{color:var(--hiw-blue);font-style:normal}.hiw-intro{max-width:510px;margin:22px 0 0;color:#b5cad8;font-size:16px;line-height:1.7}.hiw-steps-section{padding:100px 0;background:linear-gradient(180deg,rgba(4,13,23,.35),rgba(8,27,44,.72))}.hiw-section-head{display:flex;align-items:end;justify-content:space-between;gap:34px}.hiw-section-head h2{font-size:clamp(3rem,5vw,5.65rem)}.hiw-section-head>p{max-width:400px;margin:0;color:#a5c1d4;font-size:14px;line-height:1.7}.hiw-step-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:46px}.hiw-step-card{position:relative;display:flex;min-height:375px;flex-direction:column;overflow:hidden;border:1px solid rgba(61,125,165,.52);border-radius:15px;padding:25px;background:linear-gradient(155deg,rgba(15,38,59,.95),rgba(5,15,26,.95));transition:border-color .2s,transform .2s,box-shadow .2s}.hiw-step-card::after{position:absolute;right:-18px;bottom:-25px;width:125px;height:125px;border:1px solid rgba(41,220,255,.09);border-radius:50%;content:''}.hiw-step-card:hover{border-color:var(--hiw-blue);box-shadow:0 16px 32px rgba(17,130,196,.18);transform:translateY(-5px)}.hiw-step-number{position:absolute;top:20px;right:20px;color:#4c7793;font-size:11px;font-weight:900;letter-spacing:.12em}.hiw-step-eyebrow{margin:0;color:var(--hiw-soft);font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.hiw-step-card h3{max-width:205px;margin:18px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:2.15rem;font-weight:400;letter-spacing:.02em;line-height:.95}.hiw-card-rule{width:38px;height:2px;margin:23px 0;background:var(--hiw-blue);box-shadow:0 0 11px rgba(41,220,255,.8)}.hiw-step-text{margin:0;color:#a5c1d4;font-size:12px;line-height:1.68}.hiw-step-card ul{position:relative;z-index:1;display:flex;flex:1;flex-direction:column;justify-content:end;gap:7px;margin:20px 0 0;padding:0;list-style:none}.hiw-step-card li{color:#d5edf8;font-size:11px}.hiw-step-card li::before{margin-right:8px;color:var(--hiw-blue);content:'\2022'}.hiw-cta{border-top:1px solid rgba(67,183,247,.32);border-bottom:1px solid rgba(67,183,247,.32);padding:82px 0;background:linear-gradient(100deg,rgba(7,56,88,.65),rgba(9,18,31,.78)),radial-gradient(circle at 88% 18%,rgba(41,220,255,.2),transparent 32%)}.hiw-cta-shell{display:flex;align-items:end;justify-content:space-between;gap:30px}.hiw-cta h2{font-size:clamp(3.1rem,5vw,5.4rem)}.hiw-cta p:not(.hiw-kicker){max-width:510px;margin:18px 0 0;color:#b8cfe0;font-size:15px;line-height:1.65}.hiw-cta-actions{display:flex;align-items:center;gap:18px;flex:0 0 auto}.hiw-blue-button{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--hiw-blue);border-radius:10px;padding:14px 17px;background:var(--hiw-blue);color:#03141b;font-size:12px;font-weight:900;letter-spacing:.04em;text-decoration:none;transition:transform .16s,box-shadow .16s}.hiw-blue-button:hover{box-shadow:0 10px 24px rgba(41,220,255,.26);transform:translateY(-2px)}.hiw-blue-button i{background:#03141b;box-shadow:0 0 0 4px rgba(3,20,27,.12)}.hiw-text-link{display:inline-flex;align-items:center;gap:9px;border-bottom:1px solid rgba(169,244,255,.32);padding-bottom:5px;color:#eafaff;font-size:12px;font-weight:800;letter-spacing:.04em;text-decoration:none}.hiw-text-link:hover{border-color:var(--hiw-blue);color:var(--hiw-blue)}.hiw-text-link span{color:var(--hiw-blue);font-size:18px;line-height:0}@media(max-width:980px){.hiw-step-grid{grid-template-columns:repeat(2,1fr)}.hiw-step-card{min-height:330px}.hiw-cta-shell{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.hiw-hero{padding:103px 0 63px}.hiw-steps-section{padding:70px 0}.hiw-section-head{align-items:flex-start;flex-direction:column;gap:17px}.hiw-section-head h2{font-size:3.15rem}.hiw-step-grid{grid-template-columns:1fr;gap:12px;margin-top:30px}.hiw-step-card{min-height:300px;padding:22px}.hiw-cta{padding:65px 0}.hiw-cta h2{font-size:3.15rem}.hiw-cta-actions{width:100%;align-items:stretch;flex-direction:column;gap:14px}.hiw-blue-button{justify-content:center}.hiw-text-link{align-self:center}}@media(prefers-reduced-motion:reduce){.hiw-step-card{transition:none}}
`
