import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect }                  from 'react'
import Navbar                          from './components/Navbar'
import Footer                          from './components/Footer'
import Home                            from './pages/Home'
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

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                  element={<Home />} />
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