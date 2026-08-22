/**
 * Events-only review page: preserves getEvents and existing checkout routes.
 * PulsePass styling is intentionally scoped to this page so no other route changes.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvents } from '../lib/api'

const REVIEW_EVENTS = [
  { id: 'review-afterglow', is_review_fixture: true, name: 'Afterglow: Live Under the Sky', image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=88', date: '2026-09-20T20:00:00+05:00', venue: 'Faisalabad Arts Council', seat_categories: [{ id: 'review-vip', name: 'VIP', price: 3500, total_seats: 100, sold_seats: 42 }] },
  { id: 'review-comedy', is_review_fixture: true, name: 'The City Laughs Back', image_url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1400&q=88', date: '2026-09-26T19:30:00+05:00', venue: 'Kohinoor City, Faisalabad', seat_categories: [{ id: 'review-general', name: 'General', price: 1800, total_seats: 200, sold_seats: 185 }] },
  { id: 'review-workshop', is_review_fixture: true, name: 'Ink, Colour & Your Own Rules', image_url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=88', date: '2026-09-27T14:00:00+05:00', venue: 'Canal Road Studio, Faisalabad', seat_categories: [{ id: 'review-studio', name: 'Studio pass', price: 2200, total_seats: 40, sold_seats: 9 }] },
  { id: 'review-market', is_review_fixture: true, name: 'Night Market: Editions 04', image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=88', date: '2026-09-28T16:00:00+05:00', venue: 'D Ground, Faisalabad', seat_categories: [{ id: 'review-entry', name: 'Entry', price: 750, total_seats: 500, sold_seats: 500 }] },
  { id: 'review-vinyl', is_review_fixture: true, name: 'An Evening With Vinyl', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=88', date: '2026-10-03T20:30:00+05:00', venue: 'Jinnah Colony, Faisalabad', seat_categories: [{ id: 'review-listening', name: 'Listening room', price: 1600, total_seats: 70, sold_seats: 24 }] },
  { id: 'review-club', is_review_fixture: true, name: 'Slow Mornings Club', image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=88', date: '2026-10-05T11:00:00+05:00', venue: 'The Lyallpur Galleria', seat_categories: [{ id: 'review-pass', name: 'Day pass', price: 1200, total_seats: 80, sold_seats: 15 }] },
]

function availability(event) {
  const categories = event.seat_categories || []
  const total = categories.reduce((sum, category) => sum + Number(category.total_seats || 0), 0)
  const sold = categories.reduce((sum, category) => sum + Number(category.sold_seats || 0), 0)
  return { total, sold, soldOut: total > 0 && sold >= total, almostGone: total > 0 && sold < total && total - sold <= 20 }
}

function dateDetails(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: 'Date TBA', time: '' }
  return {
    day: date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }),
    time: date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
  }
}

function EventTicketCard({ event, index }) {
  const { soldOut, almostGone } = availability(event)
  const isReview = event.is_review_fixture === true
  const price = event.seat_categories?.length ? Math.min(...event.seat_categories.map(category => Number(category.price))) : null
  const { day, time } = dateDetails(event.date)
  const badge = soldOut ? 'Sold out' : almostGone ? 'Almost gone' : 'Live'
  const Wrapper = soldOut ? 'article' : Link
  const props = soldOut ? {} : { to: `/events/${event.id}/whatsapp`, state: isReview ? { reviewEvent: event } : undefined }

  return <Wrapper {...props} className={`pp-event-card ${soldOut ? 'is-sold' : ''}`}>
    {event.image_url ? <img src={event.image_url} alt={event.name} /> : <div className="pp-image-fallback" />}
    <div className="pp-card-overlay" />
    <span className="pp-card-live"><i /> {badge}</span>
    <span className="pp-card-code">FSD // {String(index + 1).padStart(2, '0')}</span>
    <div className="pp-card-caption"><p>{event.seat_categories?.[0]?.name || 'Event ticket'}</p><h3>{event.name}</h3><div><span>◷ {day}{time && ` · ${time}`}</span></div><strong>{soldOut ? 'Tickets unavailable' : price !== null ? `From PKR ${price.toLocaleString()}` : 'View tickets'} {!soldOut && ' →'}</strong></div>
  </Wrapper>
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(() => { setEvents(REVIEW_EVENTS); setReviewMode(true) })
      .finally(() => setLoading(false))
  }, [])

  const featured = events.find(event => !availability(event).soldOut) || events[0]
  const featuredDate = featured ? dateDetails(featured.date) : null

  return <div className="pp-scope">
    <style>{pulsePassEventsCss}</style><style>{'@media(max-width:600px){.pp-scope .pp-events-hero{padding:92px 0 20px}}'}</style>
    <section className="pp-events-hero"><div className="container pp-hero-layout"><div className="pp-heading"><p><i /> Faisalabad live desk</p><h1>Find your next <em>live moment.</em></h1><span>Concerts, comedy, maker rooms, and city gatherings—now in one clearer ticket desk.</span></div>
      {featured && <article className="pp-feature-card">{featured.image_url ? <img src={featured.image_url} alt={featured.name} /> : <div className="pp-image-fallback" />}<div className="pp-feature-wash" /><span className="pp-feature-rule" /><span className="pp-feature-badge"><i /> Featured</span><div className="pp-feature-caption"><p>Featured this week</p><h2>{featured.name}</h2><span>◷ {featuredDate.day}{featuredDate.time && ` · ${featuredDate.time}`}</span></div></article>}
    </div></section>

    <section className="container pp-events-shell"><div className="pp-events-rail"><span className="pp-rail-serial">FSD // EVENTS</span><div className="pp-rail-header"><div><p><i /> What&apos;s on</p><h2>Events</h2></div><span>Choose an event to view ticket options.</span></div>
      {reviewMode && <p className="pp-review-mode">Review preview uses sample listings only.</p>}
      {loading && <div className="pp-state"><span className="pp-spinner" /> Loading events…</div>}
      {error && <div className="pp-state pp-error">Could not load events: {error}</div>}
      {!loading && !error && events.length === 0 && <div className="pp-state">No events are currently available.</div>}
      {!loading && !error && events.length > 0 && <div className="pp-card-grid">{events.map((event, index) => <EventTicketCard key={event.id} event={event} index={index} />)}</div>}
    </div></section>
  </div>
}

const pulsePassEventsCss = `
  .pp-scope { --pp-ink:#050b14; --pp-panel:#0c1725; --pp-panel-2:#102136; --pp-line:#244b69; --pp-blue:#29dcff; --pp-blue-soft:#a9f4ff; --pp-white:#f2fbff; --pp-muted:#9eb5c9; position:relative; min-height:calc(100vh - 84px); overflow:hidden; background:radial-gradient(circle at 12% 6%,rgba(35,146,255,.24),transparent 30%),radial-gradient(circle at 88% 34%,rgba(41,220,255,.16),transparent 28%),linear-gradient(155deg,#050b14 0%,#08192a 48%,#050b14 100%); color:var(--pp-white); font-family:'DM Sans',sans-serif; }
  .pp-scope::before { position:absolute; inset:0; z-index:0; content:''; pointer-events:none; opacity:.36; background-image:linear-gradient(rgba(65,180,255,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(65,180,255,.11) 1px,transparent 1px); background-size:72px 72px; mask-image:linear-gradient(180deg,black,transparent 75%); }.pp-scope::after { position:absolute; inset:auto -15% 3% auto; width:42vw; height:42vw; content:''; border-radius:50%; background:radial-gradient(circle,rgba(36,185,255,.12),transparent 68%); filter:blur(12px); pointer-events:none; }
  .pp-scope *, .pp-scope *::before, .pp-scope *::after { box-sizing:border-box; }.pp-events-hero,.pp-events-shell { position:relative; z-index:1; }
  .pp-events-hero { position:relative; overflow:hidden; padding:68px 0 32px; }.pp-events-hero::after { position:absolute; inset:0; content:''; opacity:.28; background-image:radial-gradient(rgba(41,220,255,.8) .65px,transparent .9px); background-size:8px 8px; mask-image:linear-gradient(90deg,black,transparent 58%); pointer-events:none; }
  .pp-hero-layout { position:relative; z-index:1; display:grid; grid-template-columns:minmax(0,.8fr) minmax(410px,1.2fr); align-items:end; gap:46px; }.pp-heading>p,.pp-rail-header p { display:flex; align-items:center; gap:8px; margin:0; color:var(--pp-blue-soft); font-size:10px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }.pp-heading>p i,.pp-rail-header p i { width:7px; height:7px; border-radius:50%; background:var(--pp-blue); box-shadow:0 0 0 4px rgba(41,220,255,.14); }.pp-heading h1 { max-width:545px; margin:12px 0 0; font-family:'Bebas Neue',Impact,sans-serif; font-size:clamp(3.8rem,7vw,6.8rem); font-weight:400; letter-spacing:.01em; line-height:.88; }.pp-heading h1 em { color:var(--pp-blue); font-style:normal; }.pp-heading>span { display:block; max-width:420px; margin-top:17px; color:var(--pp-muted); font-size:14px; line-height:1.65; }
  .pp-feature-card { position:relative; min-height:345px; overflow:hidden; border:1px solid #2d5f86; border-radius:14px; background:#102238; box-shadow:0 22px 54px rgba(0,0,0,.32); }.pp-feature-card::before,.pp-feature-card::after { position:absolute; z-index:4; top:46%; width:16px; height:34px; content:''; background:var(--pp-ink); }.pp-feature-card::before { left:-8px; border-radius:0 18px 18px 0; }.pp-feature-card::after { right:-8px; border-radius:18px 0 0 18px; }.pp-feature-card img,.pp-feature-card>.pp-image-fallback { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }.pp-image-fallback { background:linear-gradient(135deg,#063a65,#0a1524); }.pp-feature-wash { position:absolute; inset:0; background:linear-gradient(90deg,rgba(4,12,22,.9),rgba(4,12,22,.18) 74%),linear-gradient(0deg,rgba(4,12,22,.76),transparent 60%); }.pp-feature-rule { position:absolute; z-index:2; top:13px; right:20px; left:20px; height:4px; background:repeating-linear-gradient(90deg,var(--pp-blue) 0 7px,transparent 7px 13px); }.pp-feature-badge { position:absolute; z-index:3; top:27px; left:25px; display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:5px 9px; background:var(--pp-blue); color:#04151d; font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }.pp-feature-badge i { width:5px; height:5px; border-radius:50%; background:#04151d; }.pp-feature-caption { position:absolute; z-index:3; right:24px; bottom:24px; left:24px; }.pp-feature-caption p { margin:0; color:var(--pp-blue-soft); font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }.pp-feature-caption h2 { margin:7px 0 0; max-width:560px; font-family:'Bebas Neue',Impact,sans-serif; font-size:clamp(2rem,4vw,3.8rem); font-weight:400; letter-spacing:.01em; line-height:.95; }.pp-feature-caption>span { display:block; margin-top:13px; color:#e9f7ff; font-size:11px; font-weight:600; }
  .pp-events-shell { padding-top:0; padding-bottom:78px; }.pp-events-rail { position:relative; overflow:hidden; border:1px solid var(--pp-line); border-radius:18px; padding:clamp(19px,3vw,32px); background:linear-gradient(145deg,rgba(13,29,47,.97),rgba(8,20,34,.94)); box-shadow:0 18px 45px rgba(0,0,0,.2); }.pp-events-rail::before { position:absolute; top:0; right:35px; left:35px; height:2px; content:''; background:linear-gradient(90deg,transparent,var(--pp-blue) 28%,var(--pp-blue) 72%,transparent); box-shadow:0 0 16px rgba(41,220,255,.6); }.pp-rail-serial { position:absolute; top:16px; right:19px; color:#6086a5; font-size:8px; font-weight:700; letter-spacing:.16em; }.pp-rail-header { display:flex; align-items:end; justify-content:space-between; gap:20px; }.pp-rail-header h2 { margin:7px 0 0; font-family:'Bebas Neue',Impact,sans-serif; font-size:clamp(2rem,3.7vw,3.1rem); font-weight:400; letter-spacing:.02em; }.pp-rail-header>span { max-width:245px; color:var(--pp-muted); font-size:12px; line-height:1.55; }.pp-review-mode { margin-top:17px; border-left:2px solid var(--pp-blue); padding:8px 11px; background:rgba(41,220,255,.07); color:#d6f6ff; font-size:11px; line-height:1.5; }
  .pp-card-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:13px; margin-top:20px; }.pp-event-card { position:relative; display:block; min-height:280px; overflow:hidden; border:1px solid #2b597d; border-radius:12px; background:var(--pp-panel-2); color:var(--pp-white); text-decoration:none; transition:transform .22s cubic-bezier(.23,1,.32,1),border-color .22s ease,box-shadow .22s ease; }.pp-event-card:not(.is-sold):hover { border-color:var(--pp-blue); box-shadow:0 15px 28px rgba(14,123,188,.22); transform:translateY(-4px); }.pp-event-card>img,.pp-event-card>.pp-image-fallback { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .38s cubic-bezier(.23,1,.32,1); }.pp-event-card:not(.is-sold):hover>img { transform:scale(1.06); }.pp-card-overlay { position:absolute; inset:0; background:linear-gradient(0deg,rgba(3,10,18,.95),rgba(3,10,18,.07) 67%); }.pp-event-card::before,.pp-event-card::after { position:absolute; z-index:3; top:43%; width:10px; height:22px; content:''; background:var(--pp-panel); }.pp-event-card::before { left:-5px; border-radius:0 12px 12px 0; }.pp-event-card::after { right:-5px; border-radius:12px 0 0 12px; }.pp-card-live { position:absolute; z-index:4; top:10px; left:10px; display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:4px 7px; background:var(--pp-blue); color:#04151d; font-size:8px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }.pp-card-live i { width:5px; height:5px; border-radius:50%; background:currentColor; }.pp-card-code { position:absolute; z-index:4; top:12px; right:11px; color:rgba(232,250,255,.76); font-size:8px; font-weight:700; letter-spacing:.15em; }.pp-card-caption { position:absolute; z-index:4; right:14px; bottom:13px; left:14px; }.pp-card-caption>p { margin:0; color:var(--pp-blue-soft); font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }.pp-card-caption h3 { margin:5px 0 0; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; letter-spacing:-.04em; line-height:1.13; }.pp-card-caption>div { display:flex; flex-wrap:wrap; gap:4px 9px; margin-top:9px; color:#d9eef8; font-size:10px; font-weight:500; }.pp-card-caption strong { display:block; margin-top:10px; border-top:1px solid rgba(215,245,255,.17); padding-top:8px; color:var(--pp-blue-soft); font-size:10px; font-weight:700; }.pp-state { display:grid; min-height:240px; place-content:center; justify-items:center; gap:12px; color:var(--pp-muted); font-size:13px; text-align:center; }.pp-spinner { width:34px; height:34px; border:3px solid rgba(41,220,255,.2); border-top-color:var(--pp-blue); border-radius:50%; animation:ppspin .8s linear infinite; }.pp-error { color:var(--pp-blue-soft); } @keyframes ppspin { to{transform:rotate(360deg)} }
  @media (max-width:900px) { .pp-hero-layout { grid-template-columns:1fr; gap:28px; }.pp-feature-card { min-height:360px; }.pp-card-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:600px) { .pp-scope::before { background-size:42px 42px; }.pp-events-hero { padding:18px 0 20px; }.pp-hero-layout { gap:0; }.pp-heading { display:none; }.pp-feature-card { order:-1; min-height:186px; aspect-ratio:1.82/1; border:5px solid #040a12; border-radius:19px; }.pp-feature-rule { top:10px; right:15px; left:15px; }.pp-feature-caption { right:15px; bottom:13px; left:15px; }.pp-feature-caption p { font-size:8px; }.pp-feature-caption h2 { max-width:280px; font-size:1.8rem; }.pp-feature-caption>span { margin-top:7px; font-size:8px; }.pp-feature-badge { top:15px; left:15px; font-size:8px; }.pp-events-shell { padding-bottom:46px; }.pp-events-rail { border:5px solid #040a12; border-radius:19px; padding:15px; background:rgba(8,21,35,.94); }.pp-events-rail::before { display:none; }.pp-rail-header { display:block; border-radius:999px; padding:6px 12px; background:#040a12; text-align:center; }.pp-rail-header p { display:none; }.pp-rail-header h2 { margin:0; color:var(--pp-blue); font-size:1rem; }.pp-rail-header>span { display:none; }.pp-rail-serial { display:none; }.pp-card-grid { grid-template-columns:1fr; gap:10px; margin-top:9px; }.pp-event-card { min-height:0; aspect-ratio:1.82/1; border:5px solid #040a12; border-radius:19px; }.pp-card-caption { right:14px; bottom:12px; left:14px; }.pp-card-caption h3 { max-width:265px; font-size:13px; }.pp-card-caption>div { display:flex; margin-top:5px; font-size:9px; }.pp-card-caption>div span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.pp-card-caption strong { display:none; }.pp-card-code { top:13px; right:14px; font-size:7px; }.pp-card-live { top:13px; left:14px; border-radius:4px; padding:4px 7px; background:var(--pp-blue); color:#04151d; font-size:8px; }.pp-review-mode { margin-top:10px; border-left:0; border-radius:8px; padding:8px; font-size:9px; } }
`
