/**
 * Midnight Circuit portfolio page: live project records are displayed as neon-blue image tiles.
 * The compact mobile grid remains static, readable, and data-driven without inventing any work.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPortfolio } from '../lib/api'

function displayDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Portfolio() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPortfolio().then(data => setItems(Array.isArray(data) ? data : [])).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const projects = useMemo(() => items.filter(item => item && (item.event_name || item.client_name || item.image_url)), [items])

  return <main className="pf-page">
    <style>{portfolioCss}</style>
    <section className="pf-hero">
      <div className="container">
        <p className="pf-kicker"><i /> Selected work</p>
        <h1>PROJECTS THAT<br /><em>MOVE LOCALLY.</em></h1>
        <p>Events, local brands, restaurant campaigns, production, and collaboration work made for people in Faisalabad to notice and act on.</p>
      </div>
    </section>

    <section className="pf-grid-section">
      <div className="container">
        <div className="pf-section-head"><p className="pf-kicker"><i /> Live portfolio</p><span>{loading ? 'Loading work' : `${projects.length} projects`}</span></div>
        {loading && <div className="pf-state"><span className="spinner" />Loading portfolio work</div>}
        {error && <div className="pf-state pf-error"><h2>PORTFOLIO<br /><em>UNAVAILABLE.</em></h2><p>Please refresh to load the latest project work.</p></div>}
        {!loading && !error && !projects.length && <div className="pf-state"><h2>NEW WORK<br /><em>COMING SOON.</em></h2><p>Check back soon for more client and project work.</p></div>}
        {!loading && !error && projects.length > 0 && <div className="pf-grid">{projects.map((project, index) => <PortfolioTile item={project} index={index} key={project.id ?? `${project.client_name}-${project.event_name}-${index}`} />)}</div>}
      </div>
    </section>

    <section className="pf-cta"><div className="container pf-cta-shell"><div><p className="pf-kicker"><i /> Your next move</p><h2>READY TO MAKE<br /><em>YOUR BRAND MOVE?</em></h2><p>Talk to us about a local campaign, content production, brand collaboration, or event partnership.</p></div><Link to="/book-meeting" className="pf-button"><i /> Book a meeting</Link></div></section>
  </main>
}

function PortfolioTile({ item, index }) {
  const title = item.event_name || item.client_name || 'Portfolio project'
  const client = item.client_name || 'Faisalabad Times project'
  const date = displayDate(item.event_date)

  return <article className="pf-tile" style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}>
    {item.image_url ? <img src={item.image_url} alt={title} /> : <div className="pf-image-empty"><span>FT</span></div>}
    <span className="pf-image-shade" />
    {item.is_featured && <span className="pf-featured"><i /> Featured</span>}
    <div className="pf-tile-copy"><p>{client}</p><h2>{title}</h2>{date && <span>{date}</span>}</div>
  </article>
}

const portfolioCss = String.raw`
  .pf-page{--pf-blue:#29dcff;--pf-soft:#a9f4ff;min-height:100vh;overflow:hidden;background:linear-gradient(160deg,#050b14 0%,#091b2d 46%,#050b14 100%);color:#f2fbff}.pf-page *{box-sizing:border-box}.pf-hero{position:relative;overflow:hidden;padding:128px 0 92px;border-bottom:1px solid rgba(57,141,190,.2);background:linear-gradient(105deg,rgba(5,25,41,.91),rgba(4,11,20,.88))}.pf-hero::before{position:absolute;inset:0;content:'';background:radial-gradient(circle at 80% 46%,rgba(41,220,255,.19),transparent 26%),linear-gradient(90deg,rgba(41,220,255,.07) 1px,transparent 1px),linear-gradient(rgba(41,220,255,.07) 1px,transparent 1px);background-size:auto,58px 58px,58px 58px;mask-image:linear-gradient(90deg,transparent 2%,black 38%,transparent 92%);pointer-events:none}.pf-hero .container{position:relative;z-index:1}.pf-kicker{display:flex;align-items:center;gap:8px;margin:0;color:var(--pf-soft);font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.pf-kicker i,.pf-button i,.pf-featured i{width:7px;height:7px;border-radius:50%;background:var(--pf-blue);box-shadow:0 0 0 4px rgba(41,220,255,.13)}.pf-hero h1,.pf-state h2,.pf-cta h2{margin:14px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;letter-spacing:.01em;line-height:.85}.pf-hero h1{font-size:clamp(4rem,7vw,7.3rem)}.pf-hero h1 em,.pf-state em,.pf-cta em{color:var(--pf-blue);font-style:normal}.pf-hero>div>p:last-child{max-width:560px;margin:23px 0 0;color:#b2c8d7;font-size:16px;line-height:1.7}.pf-grid-section{padding:82px 0 104px}.pf-section-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px}.pf-section-head>span{color:#8facbf;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.pf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.pf-tile{position:relative;min-height:322px;overflow:hidden;border:1px solid rgba(60,135,181,.5);border-radius:16px;background:#0b1725;box-shadow:0 18px 34px rgba(0,0,0,.2);opacity:0;animation:pfTileIn .45s cubic-bezier(.23,1,.32,1) forwards;transition:border-color .2s,box-shadow .2s,transform .2s}.pf-tile:hover{z-index:2;border-color:var(--pf-blue);box-shadow:0 22px 42px rgba(20,169,226,.21);transform:translateY(-5px)}.pf-tile>img,.pf-image-empty{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.pf-image-empty{display:grid;place-items:center;background:radial-gradient(circle at 32% 28%,rgba(41,220,255,.28),transparent 18%),linear-gradient(145deg,#154969,#07121f)}.pf-image-empty span{border:1px solid rgba(169,244,255,.45);border-radius:50%;padding:13px;color:#dffaff;font-family:'Bebas Neue',Impact,sans-serif;font-size:2rem}.pf-image-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,8,15,.03) 30%,rgba(2,8,15,.18) 53%,rgba(2,8,15,.93) 100%)}.pf-featured{position:absolute;z-index:2;top:15px;left:15px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(169,244,255,.36);border-radius:999px;padding:5px 9px;background:rgba(5,22,36,.68);backdrop-filter:blur(10px);color:#dffaff;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.pf-featured i{width:5px;height:5px}.pf-tile-copy{position:absolute;z-index:2;right:20px;bottom:18px;left:20px;text-shadow:0 3px 14px rgba(0,0,0,.9)}.pf-tile-copy p{margin:0;color:var(--pf-soft);font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pf-tile-copy h2{display:-webkit-box;overflow:hidden;margin:7px 0 8px;color:#f7fdff;font-family:'Bebas Neue',Impact,sans-serif;font-size:2.35rem;font-weight:400;letter-spacing:.02em;line-height:.88;-webkit-box-orient:vertical;-webkit-line-clamp:2}.pf-tile-copy>span{color:#d8edf6;font-size:10px;font-weight:700}.pf-state{display:flex;min-height:300px;align-items:center;justify-content:center;flex-direction:column;gap:14px;border:1px solid rgba(61,125,165,.42);border-radius:16px;background:rgba(8,23,37,.5);color:#b2c8d7;text-align:center}.pf-state h2{font-size:3.2rem}.pf-state p{margin:0;font-size:14px}.pf-error{min-height:150px;border-color:rgba(248,113,113,.45);color:#f9a3a3}.pf-cta{border-top:1px solid rgba(67,183,247,.3);border-bottom:1px solid rgba(67,183,247,.3);padding:84px 0;background:linear-gradient(105deg,rgba(6,52,82,.72),rgba(8,18,30,.82)),radial-gradient(circle at 84% 22%,rgba(41,220,255,.18),transparent 30%)}.pf-cta-shell{display:flex;align-items:end;justify-content:space-between;gap:30px}.pf-cta h2{font-size:clamp(3.1rem,5vw,5.4rem)}.pf-cta p:not(.pf-kicker){max-width:500px;margin:18px 0 0;color:#b9d0df;font-size:15px;line-height:1.65}.pf-button{display:inline-flex;align-items:center;gap:9px;flex:0 0 auto;border:1px solid var(--pf-blue);border-radius:10px;padding:14px 17px;background:var(--pf-blue);color:#03141b;font-size:12px;font-weight:900;letter-spacing:.04em;text-decoration:none;transition:transform .16s,box-shadow .16s}.pf-button:hover{box-shadow:0 10px 24px rgba(41,220,255,.26);transform:translateY(-2px)}.pf-button i{background:#03141b;box-shadow:0 0 0 4px rgba(3,20,27,.12)}@keyframes pfTileIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@media(max-width:900px){.pf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pf-cta-shell{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.pf-hero{padding:102px 0 64px}.pf-hero h1{font-size:3.75rem}.pf-grid-section{padding:62px 0 70px}.pf-section-head{margin-bottom:19px}.pf-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pf-tile{min-height:220px;border-radius:12px}.pf-featured{top:10px;left:10px;padding:4px 6px;font-size:7px}.pf-tile-copy{right:11px;bottom:11px;left:11px}.pf-tile-copy p{font-size:7px;letter-spacing:.1em}.pf-tile-copy h2{margin:5px 0 6px;font-size:1.55rem;line-height:.88}.pf-tile-copy>span{font-size:8px}.pf-cta{padding:65px 0}.pf-cta h2{font-size:3.2rem}.pf-button{width:100%;justify-content:center}}@media(prefers-reduced-motion:reduce){.pf-tile{animation:none;opacity:1}.pf-tile:hover{transform:none}}
`
