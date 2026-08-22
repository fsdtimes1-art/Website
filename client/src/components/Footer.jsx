/**
 * Midnight Circuit footer: a structured event-desk close that preserves the existing contact and legal destinations.
 */
import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'Events', path: '/events' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Book a meeting', path: '/book-meeting' },
  { label: 'How booking works', path: '/how-it-works' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return <footer className="mc-footer">
    <style>{footerCss}</style>
    <div className="container">
      <div className="mc-footer-top"><div className="mc-footer-brand"><Link to="/" className="mc-footer-logo"><img src="/favicon.png" alt="FaisalabadTimes.co" /><span><b>FAISALABAD</b><small>TIMES</small></span></Link><h2>MAKE THE<br /><em>CITY MOVE.</em></h2><p>Event promotion, media coverage, and practical ticketing for Faisalabad and beyond.</p><Link to="/events" className="mc-footer-cta"><i /> View live events</Link></div>
        <div className="mc-footer-links"><div><p>Navigate</p>{navLinks.map(link => <Link key={link.path} to={link.path}>{link.label}</Link>)}</div><div><p>Contact</p><a href="mailto:fsdtimes1@gmail.com">fsdtimes1@gmail.com</a><a href="tel:+923052226673">+92 305 2226673</a><a href="https://www.instagram.com/faisalabadtimes/" target="_blank" rel="noreferrer">@FaisalabadTimes</a><a href="https://www.google.com/maps/search/P-35+Chenab+Market+Susan+Road+Madina+Town+Faisalabad/@31.419991,73.1150521,17z" target="_blank" rel="noreferrer">Madina Town, Faisalabad</a></div><div><p>Legal</p><a href="/legal/privacy-policy.pdf" target="_blank" rel="noreferrer">Privacy policy</a><a href="/legal/terms-and-conditions.pdf" target="_blank" rel="noreferrer">Terms &amp; conditions</a><a href="/legal/return-refund-policy.pdf" target="_blank" rel="noreferrer">Return &amp; refund policy</a></div></div></div>
      <div className="mc-footer-bottom"><span>© {year} FaisalabadTimes.co</span><span>FSD / EVENT DESK / 01</span><span>Built for Pakistan&apos;s live moments.</span></div>
    </div>
  </footer>
}

const footerCss = `
  .mc-footer{position:relative;overflow:hidden;border-top:1px solid rgba(67,178,239,.28);padding:78px 0 22px;background:radial-gradient(circle at 12% 10%,rgba(41,220,255,.12),transparent 22%),#040a12;color:#eafaff}.mc-footer::before{position:absolute;top:0;right:8%;left:8%;height:3px;content:'';background:repeating-linear-gradient(90deg,#29dcff 0 8px,transparent 8px 15px)}.mc-footer-top{display:grid;grid-template-columns:1.1fr 1fr;gap:80px}.mc-footer-logo{display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none}.mc-footer-logo img{width:42px;height:42px;object-fit:contain}.mc-footer-logo span{display:flex;flex-direction:column;line-height:.85;letter-spacing:.15em}.mc-footer-logo b{font-size:11px}.mc-footer-logo small{margin-top:5px;color:#84e9f8;font-size:8px;font-weight:900;letter-spacing:.29em}.mc-footer-brand h2{margin:27px 0 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:clamp(3.4rem,5vw,5.8rem);font-weight:400;letter-spacing:.01em;line-height:.84}.mc-footer-brand h2 em{color:#29dcff;font-style:normal}.mc-footer-brand>p{max-width:350px;margin:19px 0;color:#9fbacd;font-size:14px;line-height:1.65}.mc-footer-cta{display:inline-flex;align-items:center;gap:9px;border:1px solid #29dcff;border-radius:10px;padding:12px 15px;background:#29dcff;color:#03141b;font-size:11px;font-weight:900;text-decoration:none}.mc-footer-cta i{width:6px;height:6px;border-radius:50%;background:#03141b}.mc-footer-links{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding-top:14px}.mc-footer-links div{display:flex;flex-direction:column;gap:11px}.mc-footer-links p{margin:0 0 8px;color:#7ce0f0;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.mc-footer-links a{color:#afc5d5;font-size:12px;line-height:1.45;text-decoration:none;transition:color .16s}.mc-footer-links a:hover{color:#29dcff}.mc-footer-bottom{display:flex;justify-content:space-between;gap:20px;margin-top:64px;border-top:1px solid rgba(80,156,199,.24);padding-top:19px;color:#60849c;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}@media(max-width:800px){.mc-footer{padding-top:60px}.mc-footer-top{grid-template-columns:1fr;gap:46px}.mc-footer-links{grid-template-columns:repeat(3,1fr)}.mc-footer-bottom{flex-direction:column;gap:8px;margin-top:45px}}@media(max-width:520px){.mc-footer-links{grid-template-columns:1fr 1fr}.mc-footer-links div:last-child{grid-column:1/-1}.mc-footer-brand h2{font-size:3.8rem}.mc-footer-bottom{font-size:9px}}
`
