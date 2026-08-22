/**
 * Midnight Circuit meeting page: a neon-blue campaign-services grid for events,
 * local brands, restaurants, and digital marketing partnerships. WhatsApp submission is preserved.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567'

const SERVICE_TYPES = [
  'Restaurant & Local Business Growth',
  'Reels & Short-Form Content',
  'Brand Collaboration',
  'Social Media Management',
  'Paid Advertising & Campaigns',
  'Event Promotion & Ticketing',
  'Event Media Coverage',
  'Custom Digital Marketing Requirement',
]

const BUDGET_RANGES = [
  'Under PKR 50,000',
  'PKR 50,000 to 1 Lac',
  'PKR 1 to 5 Lacs',
  'PKR 5 to 20 Lacs',
  'PKR 20 Lacs+',
  'Not sure yet',
]

const SERVICES = [
  {
    number: '01', eyebrow: 'Restaurants & retail', title: 'Turn local reach into footfall.',
    text: 'Campaigns and content built to move people from their feed to your table, store, launch, or offer.',
    tags: ['Restaurant campaigns', 'Offer launches', 'Footfall growth'],
  },
  {
    number: '02', eyebrow: 'Reels & production', title: 'Make content people stop for.',
    text: 'Concept-led reels, photography, edits, and short-form stories shaped for the local audience you want to reach.',
    tags: ['Reel production', 'Photography', 'Creative direction'],
  },
  {
    number: '03', eyebrow: 'Brand collaborations', title: 'Put the right names together.',
    text: 'Thoughtful collaborations between brands, venues, creators, and the Faisalabad Times community.',
    tags: ['Brand features', 'Creator partnerships', 'Community reach'],
  },
  {
    number: '04', eyebrow: 'Digital marketing', title: 'Keep your brand moving.',
    text: 'A practical content and campaign rhythm for businesses that need consistent visibility, not one-off posts.',
    tags: ['Social management', 'Paid reach', 'Performance review'],
  },
  {
    number: '05', eyebrow: 'Events & media', title: 'Build momentum around the moment.',
    text: 'Promotion, live coverage, and highlight content for events that need more awareness before and after doors open.',
    tags: ['Launch campaigns', 'Live stories', 'Highlight reels'],
  },
  {
    number: '06', eyebrow: 'Tickets & partnerships', title: 'Make entry feel effortless.',
    text: 'Event partnership support and a clear ticket route that helps people find, request, and receive their access.',
    tags: ['Event listings', 'WhatsApp orders', 'Digital tickets'],
  },
]

const DIFFERENTIATORS = [
  { title: 'Local reach that converts', text: 'We build campaigns around the people, places, and conversations moving Faisalabad right now.' },
  { title: 'Content with a job to do', text: 'Every reel, story, post, or campaign is created to support awareness, visits, enquiries, or ticket sales.' },
  { title: 'More than event promotion', text: 'Restaurants, retail, launches, local brands, experiences, and events all get a tailored route forward.' },
  { title: 'One collaborative team', text: 'Creative production, publishing, partnerships, and campaign thinking stay connected from brief to outcome.' },
]

export default function BookMeeting() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', serviceType: '', budget: '', message: '', business: '', marketingBudget: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  function handleSubmit() {
    const required = ['name', 'phone', 'serviceType']
    if (required.some(key => !form[key].trim())) return
    const waTab = window.open('', '_blank')
    const lines = [
      '*New Faisalabad Times Meeting Request*',
      '',
      `*Name:* ${form.name}`,
      `*WhatsApp:* ${form.phone}`,
      form.email ? `*Email:* ${form.email}` : null,
      `*Campaign / Service:* ${form.serviceType}`,
      form.business ? `*Business, Brand or Event:* ${form.business}` : null,
      form.budget ? `*Estimated Budget:* ${form.budget}` : null,
      form.marketingBudget ? `*Monthly Marketing Budget:* ${form.marketingBudget}` : null,
      form.message ? `\n*Goals / Notes:*\n${form.message}` : null,
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`
    if (waTab) waTab.location.href = url
    else window.location.href = url
    setSubmitted(true)
  }

  const isValid = form.name.trim() && form.phone.trim() && form.serviceType

  return (
    <main className="bm-page">
      <style>{bookMeetingCss}</style>

      <section className="bm-hero">
        <div className="container">
          <p className="bm-kicker"><i /> Collaborate locally</p>
          <h1>BOOK A<br /><em>MEETING.</em></h1>
          <p>From events to restaurants, retail, brand launches, and digital marketing - tell us what you want to grow. We will reply on WhatsApp with the next practical step.</p>
        </div>
      </section>

      <section className="bm-services-section">
        <div className="container">
          <div className="bm-section-head">
            <div>
              <p className="bm-kicker"><i /> What we do</p>
              <h2>ONE LOCAL TEAM.<br /><em>MORE MOMENTUM.</em></h2>
            </div>
            <p>Use Faisalabad Times for content, campaigns, collaborations, and ticketing that bring your local audience closer to your brand.</p>
          </div>

          <div className="bm-service-grid">
            {SERVICES.map(service => (
              <article className="bm-service-card" key={service.number}>
                <span className="bm-service-number">{service.number}</span>
                <p className="bm-service-eyebrow">{service.eyebrow}</p>
                <h3>{service.title}</h3>
                <span className="bm-card-rule" />
                <p className="bm-service-text">{service.text}</p>
                <ul>{service.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
                <button type="button" className="bm-card-link" onClick={() => { setForm(current => ({ ...current, serviceType: current.serviceType || service.title })); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Discuss this service <span>&rarr;</span></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bm-form-section" id="booking-form">
        <div className="container">
          <div className="bm-form-heading">
            <p className="bm-kicker"><i /> Start a conversation</p>
            <h2>WHAT DO YOU<br /><em>WANT TO MOVE?</em></h2>
            <p>A bigger weekend crowd, a restaurant launch, a smarter content rhythm, or the next event on the calendar - we can shape the right campaign together.</p>
          </div>

          <div className="bm-book-grid">
            <aside className="bm-differentiator-column">
              <div className="bm-differentiator-intro">
                <p className="bm-kicker"><i /> Why Faisalabad Times</p>
                <h3>LOCAL CONTEXT.<br /><em>REAL CREATIVE.</em></h3>
                <p>We combine local audience understanding with practical digital marketing and a content team that can turn a good brief into work people notice.</p>
              </div>
              <div className="bm-differentiator-grid">
                {DIFFERENTIATORS.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><h4>{item.title}</h4><p>{item.text}</p></article>)}
              </div>
              <div className="bm-contact-card">
                <p className="bm-kicker"><i /> Contact directly</p>
                <a href="https://wa.me/923052226673" target="_blank" rel="noreferrer"><small>WhatsApp</small><strong>+92 305 2226673</strong></a>
                <a href="mailto:fsdtimes1@gmail.com"><small>Email</small><strong>fsdtimes1@gmail.com</strong></a>
              </div>
            </aside>

            <div className="bm-form-sticky">
              {submitted ? <SuccessState onReset={() => setSubmitted(false)} /> : <div className="bm-form-card">
                <div className="bm-form-card-head"><p className="bm-kicker"><i /> Campaign brief</p><h3>LET&apos;S BUILD YOUR NEXT MOVE.</h3><p>Share a few details. We will prepare a helpful WhatsApp conversation, not an automated contract.</p></div>
                <div className="bm-form-fields">
                  <div className="bm-field-row"><Field label="Your Name *" name="name" placeholder="Ahmed Khan" value={form.name} onChange={handleField} /><Field label="WhatsApp Number *" name="phone" type="tel" placeholder="+92 300 000 0000" value={form.phone} onChange={handleField} /></div>
                  <Field label="Email Address" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleField} />
                  <div><label className="bm-label">Campaign or service interested in *</label><select name="serviceType" value={form.serviceType} onChange={handleField} className="bm-input"><option value="">Select a service...</option>{SERVICE_TYPES.map(service => <option key={service} value={service}>{service}</option>)}</select></div>
                  <div className="bm-field-row"><div><label className="bm-label">Estimated budget</label><select name="budget" value={form.budget} onChange={handleField} className="bm-input"><option value="">Select a budget range...</option>{BUDGET_RANGES.map(range => <option key={range} value={range}>{range}</option>)}</select></div><Field label="Monthly marketing budget" name="marketingBudget" placeholder="Optional" value={form.marketingBudget} onChange={handleField} /></div>
                  <Field label="Business, brand or event name" name="business" placeholder="Your business, restaurant, brand or event" value={form.business} onChange={handleField} />
                  <div><label className="bm-label">What would success look like?</label><textarea name="message" placeholder="For example: more restaurant footfall, a reel campaign, a launch collaboration, event promotion, or a stronger monthly content plan..." value={form.message} onChange={handleField} className="bm-input" rows={5} /></div>
                  <button type="button" onClick={handleSubmit} disabled={!isValid} className="bm-submit">Send via WhatsApp <span>&rarr;</span></button>
                  <p className="bm-form-note">This opens WhatsApp with your campaign brief pre-filled. No account or payment is required.</p>
                </div>
              </div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({ label, name, type = 'text', placeholder, value, onChange }) {
  return <label><span className="bm-label">{label}</span><input className="bm-input" type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} /></label>
}

function SuccessState({ onReset }) {
  return <div className="bm-success"><div><i>OK</i></div><p className="bm-kicker"><i /> Message prepared</p><h3>WHATSAPP IS READY.</h3><p>Your brief has been prepared. Send the message in WhatsApp and our team will get back to you soon.</p><button type="button" onClick={onReset}>Edit my details</button><Link to="/events">Browse events <span>&middot;</span></Link></div>
}

const bookMeetingCss = String.raw`
  .bm-page{--bm-blue:#29dcff;--bm-soft:#a9f4ff;--bm-ink:#050b14;--bm-panel:#0b1725;min-height:100vh;overflow:hidden;background:linear-gradient(160deg,#050b14 0%,#091b2d 42%,#050b14 100%);color:#f2fbff}.bm-page *{box-sizing:border-box}.bm-hero{position:relative;overflow:hidden;padding:126px 0 86px;border-bottom:1px solid rgba(63,146,196,.2);background:linear-gradient(100deg,rgba(6,36,57,.92),rgba(5,13,23,.86))}.bm-hero::before{position:absolute;inset:0;content:'';background:radial-gradient(circle at 18% 45%,rgba(41,220,255,.2),transparent 27%),linear-gradient(90deg,rgba(41,220,255,.08) 1px,transparent 1px),linear-gradient(rgba(41,220,255,.08) 1px,transparent 1px);background-size:auto,58px 58px,58px 58px;mask-image:linear-gradient(90deg,black,transparent 82%);pointer-events:none}.bm-hero .container{position:relative;z-index:1}.bm-kicker{display:flex;align-items:center;gap:8px;margin:0;color:var(--bm-soft);font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.bm-kicker i,.bm-submit::before{width:7px;height:7px;border-radius:50%;background:var(--bm-blue);box-shadow:0 0 0 4px rgba(41,220,255,.13)}.bm-hero h1,.bm-section-head h2,.bm-form-heading h2,.bm-differentiator-intro h3,.bm-success h3{margin:14px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;letter-spacing:.015em;line-height:.85}.bm-hero h1{font-size:clamp(4.1rem,8vw,7.4rem)}.bm-hero em,.bm-section-head em,.bm-form-heading em,.bm-differentiator-intro em{color:var(--bm-blue);font-style:normal}.bm-hero .container>p:last-child{max-width:590px;margin:22px 0 0;color:#b5cad8;font-size:16px;line-height:1.7}.bm-services-section{padding:100px 0;background:linear-gradient(180deg,rgba(4,13,23,.35),rgba(8,27,44,.72))}.bm-section-head{display:flex;align-items:end;justify-content:space-between;gap:34px}.bm-section-head h2{font-size:clamp(3rem,5vw,5.65rem)}.bm-section-head>p{max-width:410px;margin:0;color:#a5c1d4;font-size:14px;line-height:1.7}.bm-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:46px}.bm-service-card{position:relative;display:flex;min-height:340px;flex-direction:column;overflow:hidden;border:1px solid rgba(61,125,165,.52);border-radius:15px;padding:25px;background:linear-gradient(155deg,rgba(15,38,59,.95),rgba(5,15,26,.95));transition:border-color .2s,transform .2s,box-shadow .2s}.bm-service-card::after{position:absolute;right:-18px;bottom:-25px;width:130px;height:130px;border:1px solid rgba(41,220,255,.09);border-radius:50%;content:''}.bm-service-card:hover{border-color:var(--bm-blue);box-shadow:0 16px 32px rgba(17,130,196,.18);transform:translateY(-5px)}.bm-service-number{position:absolute;top:20px;right:20px;color:#4c7793;font-size:11px;font-weight:900;letter-spacing:.12em}.bm-service-eyebrow{margin:0;color:var(--bm-soft);font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.bm-service-card h3{max-width:255px;margin:18px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:2.15rem;font-weight:400;letter-spacing:.02em;line-height:.95}.bm-card-rule{width:38px;height:2px;margin:22px 0;background:var(--bm-blue);box-shadow:0 0 11px rgba(41,220,255,.8)}.bm-service-text{margin:0;color:#a5c1d4;font-size:12px;line-height:1.68}.bm-service-card ul{position:relative;z-index:1;display:flex;flex:1;flex-direction:column;justify-content:end;gap:7px;margin:20px 0;padding:0;list-style:none}.bm-service-card li{color:#d5edf8;font-size:11px}.bm-service-card li::before{margin-right:8px;color:var(--bm-blue);content:'\2022'}.bm-card-link{position:relative;z-index:1;display:flex;justify-content:space-between;border:0;border-top:1px solid rgba(121,202,246,.17);padding:14px 0 0;background:transparent;color:var(--bm-blue);font-size:11px;font-weight:900;text-align:left;cursor:pointer}.bm-card-link:hover{color:#e6fbff}.bm-card-link span{font-size:14px}.bm-form-section{padding:106px 0;background:#06111e}.bm-form-heading{max-width:620px}.bm-form-heading h2{font-size:clamp(3.2rem,5.6vw,5.8rem)}.bm-form-heading>p:last-child{max-width:540px;margin:20px 0 0;color:#a9c2d3;font-size:15px;line-height:1.7}.bm-book-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);align-items:start;gap:clamp(35px,6vw,82px);margin-top:52px}.bm-differentiator-column{display:flex;flex-direction:column;gap:27px}.bm-differentiator-intro h3{font-size:clamp(2.3rem,3.4vw,3.5rem)}.bm-differentiator-intro>p:last-child{margin:18px 0 0;color:#a9c2d3;font-size:14px;line-height:1.7}.bm-differentiator-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.bm-differentiator-grid article{min-height:168px;border:1px solid rgba(61,125,165,.38);border-radius:13px;padding:19px;background:linear-gradient(145deg,rgba(15,38,59,.7),rgba(5,15,26,.76))}.bm-differentiator-grid span{color:var(--bm-blue);font-size:10px;font-weight:900;letter-spacing:.1em}.bm-differentiator-grid h4{margin:21px 0 8px;font-family:'Bebas Neue',Impact,sans-serif;font-size:1.55rem;font-weight:400;letter-spacing:.02em;line-height:.95}.bm-differentiator-grid p{margin:0;color:#a5c1d4;font-size:11px;line-height:1.6}.bm-contact-card{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid rgba(41,220,255,.35);border-radius:13px;overflow:hidden;background:rgba(10,38,56,.72)}.bm-contact-card>.bm-kicker{grid-column:1/-1;padding:18px 20px 0}.bm-contact-card a{display:flex;flex-direction:column;gap:5px;padding:19px 20px;color:#e7faff;text-decoration:none}.bm-contact-card a+a{border-left:1px solid rgba(121,202,246,.17)}.bm-contact-card small{color:#8fc9db;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.bm-contact-card strong{font-size:12px}.bm-form-sticky{position:sticky;top:105px}.bm-form-card,.bm-success{overflow:hidden;border:1px solid rgba(85,161,204,.42);border-radius:16px;background:linear-gradient(150deg,rgba(14,33,50,.98),rgba(6,15,26,.98));box-shadow:0 28px 45px rgba(0,0,0,.2)}.bm-form-card-head{border-bottom:1px solid rgba(121,202,246,.18);padding:26px 28px;background:linear-gradient(100deg,rgba(17,69,97,.48),rgba(8,20,34,.5))}.bm-form-card-head h3{margin:17px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:2.15rem;font-weight:400;letter-spacing:.02em;line-height:.92}.bm-form-card-head>p:last-child{margin:10px 0 0;color:#a9c2d3;font-size:12px;line-height:1.6}.bm-form-fields{display:flex;flex-direction:column;gap:17px;padding:27px}.bm-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bm-label{display:block;margin-bottom:8px;color:#c0d5e2;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.bm-input{width:100%;border:1px solid rgba(77,139,178,.44);border-radius:10px;padding:13px 14px;background:rgba(16,37,58,.92);color:#effbff;font-family:inherit;font-size:13px;outline:none;transition:border-color .16s,box-shadow .16s}.bm-input:focus{border-color:var(--bm-blue);box-shadow:0 0 0 3px rgba(41,220,255,.09)}.bm-input::placeholder{color:#6f8da1}.bm-input option{background:#0c1a29;color:#effbff}.bm-input textarea{resize:vertical}.bm-submit{display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid var(--bm-blue);border-radius:10px;padding:15px;background:var(--bm-blue);color:#03141b;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:transform .16s,box-shadow .16s}.bm-submit::before{display:block;content:'';background:#03141b;box-shadow:0 0 0 4px rgba(3,20,27,.12)}.bm-submit:hover:not(:disabled){box-shadow:0 10px 25px rgba(41,220,255,.25);transform:translateY(-2px)}.bm-submit:disabled{cursor:not-allowed;opacity:.45}.bm-submit span{font-size:15px}.bm-form-note{margin:0;color:#7795aa;font-size:10px;line-height:1.55;text-align:center}.bm-success{padding:46px 30px;text-align:center}.bm-success>div{display:grid;width:75px;height:75px;margin:0 auto 21px;place-items:center;border:1px solid rgba(41,220,255,.45);border-radius:50%;background:rgba(41,220,255,.1);color:var(--bm-blue);font-size:28px}.bm-success .bm-kicker{justify-content:center}.bm-success h3{font-size:2.6rem}.bm-success>p:last-of-type{max-width:340px;margin:16px auto 25px;color:#a9c2d3;font-size:13px;line-height:1.65}.bm-success button,.bm-success a{display:flex;align-items:center;justify-content:center;width:100%;border-radius:10px;padding:13px;font-size:12px;font-weight:900;text-decoration:none;cursor:pointer}.bm-success button{border:1px solid rgba(121,202,246,.36);background:transparent;color:#e6fbff}.bm-success a{margin-top:10px;background:var(--bm-blue);color:#03141b}.bm-success a span{margin-left:6px;color:#03141b;font-size:16px}@media(max-width:980px){.bm-service-grid{grid-template-columns:repeat(2,1fr)}.bm-book-grid{grid-template-columns:1fr;gap:42px}.bm-form-sticky{position:static}}@media(max-width:600px){.bm-hero{padding:103px 0 63px}.bm-services-section,.bm-form-section{padding:70px 0}.bm-section-head{align-items:flex-start;flex-direction:column;gap:17px}.bm-section-head h2,.bm-form-heading h2{font-size:3.15rem}.bm-service-grid{grid-template-columns:1fr;gap:12px;margin-top:30px}.bm-service-card{min-height:292px;padding:22px}.bm-book-grid{margin-top:35px}.bm-differentiator-grid{grid-template-columns:1fr}.bm-differentiator-grid article{min-height:0}.bm-contact-card{grid-template-columns:1fr}.bm-contact-card a+a{border-top:1px solid rgba(121,202,246,.17);border-left:0}.bm-field-row{grid-template-columns:1fr}.bm-form-card-head,.bm-form-fields{padding:22px}.bm-form-card-head h3{font-size:1.95rem}}@media(prefers-reduced-motion:reduce){.bm-service-card,.bm-submit{transition:none}}
`
