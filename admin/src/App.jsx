import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState }                              from 'react'
import { getStoredKey }                          from './lib/api'
import Sidebar    from './components/Sidebar'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Events     from './pages/Events'
import EventForm  from './pages/EventForm'
import Purchases  from './pages/Purchases'
import ScanTicket from './pages/ScanTicket'
import Portfolio  from './pages/Portfolio'

function RequireAuth({ children }) {
  const key = getStoredKey()
  if (!key) return <Navigate to="/login" replace />
  return children
}

function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(0,0,0,0.6)',
            zIndex:     40,
            display:    'none', // shown via CSS on mobile
          }}
          className="sidebar-overlay"
        />
      )}

      <main style={{
        flex:       1,
        marginLeft: 'var(--sidebar-w)',
        minHeight:  '100vh',
        background: 'var(--black)',
        overflow:   'auto',
      }}>
        {/* ── Mobile top bar ── */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background:   'transparent',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color:        'var(--white)',
              fontSize:     '18px',
              width:        '36px',
              height:       '36px',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
          <span style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '18px',
            letterSpacing: '3px',
            color:         'var(--gold)',
          }}>
            EVENT<span style={{ color: 'var(--white)' }}>FLOW</span>
          </span>
          <div style={{ width: 36 }} /> {/* spacer to centre the logo */}
        </div>

        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <RequireAuth><AdminShell><Dashboard /></AdminShell></RequireAuth>
      } />
      <Route path="/events" element={
        <RequireAuth><AdminShell><Events /></AdminShell></RequireAuth>
      } />
      <Route path="/events/new" element={
        <RequireAuth><AdminShell><EventForm /></AdminShell></RequireAuth>
      } />
      <Route path="/events/:id/edit" element={
        <RequireAuth><AdminShell><EventForm /></AdminShell></RequireAuth>
      } />
      <Route path="/purchases" element={
        <RequireAuth><AdminShell><Purchases /></AdminShell></RequireAuth>
      } />
      <Route path="/scan" element={
        <RequireAuth><AdminShell><ScanTicket /></AdminShell></RequireAuth>
      } />
      <Route path="/portfolio" element={
        <RequireAuth><AdminShell><Portfolio /></AdminShell></RequireAuth>
      } />

      <Route path="*" element={
        <RequireAuth>
          <AdminShell>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '80vh', gap: '16px',
            }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '80px',
                color: 'var(--gold)', letterSpacing: '4px',
              }}>404</h1>
              <p style={{ color: 'var(--gray-light)' }}>Page not found</p>
              <a href="/" className="btn-gold">Go to Dashboard</a>
            </div>
          </AdminShell>
        </RequireAuth>
      } />
    </Routes>
  )
}