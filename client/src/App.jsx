/** Midnight Circuit app shell: a desktop-only neon pointer halo sits behind public page content; touch layouts stay static. */
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect }                  from 'react'
import Navbar                          from './components/Navbar'
import Footer                          from './components/Footer'
import Home                            from './pages/Home'
import HowItWorks                      from './pages/HowItWorks'
import Events                          from './pages/Events'
import EventDetail                     from './pages/EventDetail'
import EventDetailWhatsApp             from './pages/EventDetailWhatsApp'
import PaymentSuccess                  from './pages/PaymentSuccess'
import Portfolio                       from './pages/Portfolio'
import BookMeeting                     from './pages/BookMeeting'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function DesktopPointerGlow() {
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const root = document.documentElement
    let frame = null

    const sync = () => {
      root.classList.toggle('ft-desktop-glow-enabled', media.matches)
      if (!media.matches) return
      root.style.setProperty('--ft-glow-x', `${Math.round(window.innerWidth * 0.58)}px`)
      root.style.setProperty('--ft-glow-y', `${Math.round(window.innerHeight * 0.34)}px`)
    }

    const onPointerMove = event => {
      if (!media.matches) return
      const { clientX, clientY } = event
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty('--ft-glow-x', `${clientX}px`)
        root.style.setProperty('--ft-glow-y', `${clientY}px`)
      })
    }

    sync()
    media.addEventListener('change', sync)
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      media.removeEventListener('change', sync)
      window.removeEventListener('pointermove', onPointerMove)
      root.classList.remove('ft-desktop-glow-enabled')
      root.style.removeProperty('--ft-glow-x')
      root.style.removeProperty('--ft-glow-y')
    }
  }, [])

  return <span className="ft-cursor-glow" aria-hidden="true" />
}

export default function App() {
  return (
    <div className="ft-app-shell">
      <DesktopPointerGlow />
      <ScrollToTop />
      <Navbar />

      <main className="ft-app-main">
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/how-it-works"      element={<HowItWorks />} />
          <Route path="/events"            element={<Events />} />
          <Route path="/events/:id"          element={<EventDetail />} />
          <Route path="/events/:id/whatsapp" element={<EventDetailWhatsApp />} />
          <Route path="/payment-success"   element={<PaymentSuccess />} />
          <Route path="/portfolio"         element={<Portfolio />} />
          <Route path="/book-meeting"      element={<BookMeeting />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              minHeight:      '60vh',
              gap:            '16px'
            }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '80px', color: 'var(--gold)' }}>
                404
              </h1>
              <p style={{ color: 'var(--gray-light)' }}>Page not found</p>
              <a href="/" className="btn-gold">Go Home</a>
            </div>
          } />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
