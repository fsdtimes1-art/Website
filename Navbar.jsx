/**
 * Midnight Circuit header: compact glass navigation where Get tickets is the single event route and responsive mobile drawers stay uncluttered.
 * The Faisalabad Times wordmark is enlarged by two pixels while preserving the mark, alignment, navigation, and ticket CTA behavior.
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Book a Meeting', path: '/book-meeting' },
]

function routeIsActive(pathname, path) {
  return path === '/events' ? pathname.startsWith('/events') : pathname === path
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return <>
    <header className={`ft-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container ft-header-shell">
        <nav className="ft-header-bar" aria-label="Primary navigation">
          <Link to="/" className="ft-brand" aria-label="FaisalabadTimes home">
            <span className="ft-brand-mark"><img src="/favicon.png" alt="" /></span>
            <span className="ft-brand-name"><b>FAISALABAD</b><small>TIMES</small></span>
          </Link>

          <div className="ft-desktop-nav">
            <div className="ft-link-rail">
              {links.map(link => {
                const active = routeIsActive(location.pathname, link.path)
                return <Link key={link.path} to={link.path} className={`ft-nav-link ${active ? 'is-active' : ''}`}>
                  <span>{link.label}</span>
                </Link>
              })}
            </div>
            <Link to="/events" className={`ft-ticket-cta ${routeIsActive(location.pathname, '/events') ? 'is-active' : ''}`}><i />Get tickets</Link>
          </div>

          <button className={`ft-mobile-toggle ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(open => !open)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            <span /><span />
          </button>
        </nav>
      </div>
    </header>

    <div className={`ft-mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
      <div className="ft-mobile-drawer-inner">
        <p>Explore FaisalabadTimes</p>
        {links.map((link, index) => {
          const active = routeIsActive(location.pathname, link.path)
          return <Link key={link.path} to={link.path} className={`ft-mobile-link ${active ? 'is-active' : ''}`}><small>0{index + 1}</small><span>{link.label}</span></Link>
        })}
          <Link to="/events" className={`ft-mobile-ticket ${routeIsActive(location.pathname, '/events') ? 'is-active' : ''}`}><i />Get tickets</Link>
      </div>
    </div>

    <style>{headerCss}</style>
    <style>{headerRefinementCss}</style>
  </>
}

const headerRefinementCss = `
  /* Header refinement: retain the compact dark-glass silhouette while making the Faisalabad Times wordmark easier to read at a glance. */
  .ft-brand-name b{font-size:13px}.ft-brand-name small{font-size:10px}
  @media(max-width:768px){.ft-brand-name b{font-size:12px}.ft-brand-name small{font-size:9px}}
`

const headerCss = `
  .ft-header { position:fixed; z-index:100; top:0; right:0; left:0; padding:14px 0 0; pointer-events:none; transition:padding .22s ease; }.ft-header-shell { pointer-events:none; }.ft-header-bar { display:flex; min-height:60px; align-items:center; justify-content:space-between; border:1px solid rgba(117,208,255,.16); border-radius:17px; padding:7px 8px 7px 10px; background:linear-gradient(115deg,rgba(5,12,21,.82),rgba(10,28,45,.72)); box-shadow:0 12px 32px rgba(0,0,0,.18); backdrop-filter:blur(18px) saturate(130%); pointer-events:auto; transition:border-color .22s ease,box-shadow .22s ease,border-radius .22s ease; }.ft-header.is-scrolled { padding-top:8px; }.ft-header.is-scrolled .ft-header-bar { border-color:rgba(41,220,255,.38); box-shadow:0 14px 34px rgba(0,0,0,.32),0 0 24px rgba(41,220,255,.08); }
  .ft-brand { display:inline-flex; align-items:center; gap:10px; color:#f4fcff; text-decoration:none; }.ft-brand-mark { display:grid; width:43px; height:43px; place-items:center; overflow:hidden; }.ft-brand-mark img { width:39px; height:39px; object-fit:contain; }.ft-brand-name { display:flex; flex-direction:column; line-height:.85; letter-spacing:.13em; }.ft-brand-name b { color:#f5fcff; font-size:11px; font-weight:800; }.ft-brand-name small { margin-top:5px; color:#7fdff3; font-size:8px; font-weight:800; letter-spacing:.29em; }
  .ft-desktop-nav { display:flex; align-items:center; gap:10px; }.ft-link-rail { display:flex; align-items:center; gap:3px; border:1px solid rgba(150,241,255,.12); border-radius:12px; padding:3px; background:rgba(4,12,21,.58); }.ft-nav-link { position:relative; border-radius:8px; padding:9px 12px; color:#b9cbda; font-size:12px; font-weight:700; text-decoration:none; transition:color .16s ease,background .16s ease; }.ft-nav-link:hover { color:#eafaff; background:rgba(150,241,255,.08); }.ft-nav-link.is-active { background:rgba(41,220,255,.12); color:#9cf2ff; }.ft-nav-link.is-active::after { position:absolute; right:10px; bottom:5px; left:10px; height:1px; content:''; background:var(--gold); box-shadow:0 0 8px rgba(41,220,255,.8); }
  .ft-ticket-cta,.ft-mobile-ticket { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid var(--gold); border-radius:11px; padding:10px 13px; background:var(--gold); color:#03141a; font-size:11px; font-weight:900; letter-spacing:.04em; text-decoration:none; transition:transform .16s ease,box-shadow .16s ease,background .16s ease; }.ft-ticket-cta:hover,.ft-mobile-ticket:hover,.ft-ticket-cta.is-active,.ft-mobile-ticket.is-active { background:var(--gold-light); box-shadow:0 8px 18px rgba(41,220,255,.25); transform:translateY(-1px); }.ft-ticket-cta i,.ft-mobile-ticket i { width:6px; height:6px; border-radius:50%; background:#03141a; box-shadow:0 0 0 3px rgba(3,20,26,.13); }
  .ft-mobile-toggle { display:none; width:43px; height:43px; place-content:center; gap:6px; border:1px solid rgba(150,241,255,.28); border-radius:12px; background:rgba(5,16,28,.68); cursor:pointer; }.ft-mobile-toggle span { display:block; width:19px; height:2px; border-radius:99px; background:#dffaff; transition:transform .2s ease,width .2s ease; }.ft-mobile-toggle.is-open span:first-child { transform:translateY(4px) rotate(45deg); }.ft-mobile-toggle.is-open span:last-child { transform:translateY(-4px) rotate(-45deg); }
  .ft-mobile-drawer { position:fixed; z-index:99; top:80px; right:18px; left:18px; overflow:hidden; border:1px solid rgba(78,193,245,.24); border-radius:18px; background:rgba(6,16,28,.96); box-shadow:0 20px 48px rgba(0,0,0,.38),0 0 30px rgba(41,220,255,.08); backdrop-filter:blur(20px); opacity:0; pointer-events:none; transform:translateY(-12px) scale(.98); transform-origin:top center; transition:opacity .2s ease,transform .2s cubic-bezier(.23,1,.32,1); }.ft-mobile-drawer.is-open { opacity:1; pointer-events:auto; transform:translateY(0) scale(1); }.ft-mobile-drawer-inner { display:grid; gap:7px; padding:16px; }.ft-mobile-drawer-inner>p { margin:0 0 3px 4px; color:#77ddea; font-size:9px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }.ft-mobile-link { display:grid; grid-template-columns:32px 1fr; align-items:center; border:1px solid transparent; border-radius:10px; padding:12px; color:#e6f8ff; text-decoration:none; transition:background .16s,border-color .16s; }.ft-mobile-link:hover,.ft-mobile-link.is-active { border-color:rgba(41,220,255,.26); background:rgba(41,220,255,.1); }.ft-mobile-link small { color:#70d8eb; font-size:9px; font-weight:800; letter-spacing:.1em; }.ft-mobile-link span { font-size:14px; font-weight:750; }.ft-mobile-ticket { margin-top:5px; width:100%; min-height:45px; justify-content:flex-start; padding-inline:14px; }
  @media(max-width:768px){.ft-header{padding-top:10px}.ft-header.is-scrolled{padding-top:7px}.ft-header-bar{min-height:66px;border-radius:15px;padding:7px 8px 7px 10px}.ft-brand{gap:9px}.ft-brand-mark{width:49px;height:49px}.ft-brand-mark img{width:45px;height:45px}.ft-brand-name{display:flex}.ft-brand-name b{font-size:10px}.ft-brand-name small{margin-top:4px;font-size:7px;letter-spacing:.24em}.ft-desktop-nav{display:none}.ft-mobile-toggle{display:grid}.ft-mobile-drawer{top:84px}}
`
