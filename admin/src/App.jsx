import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState }                   from 'react'
import { getStoredKey }                          from './lib/api'
import Sidebar    from './components/Sidebar'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Events     from './pages/Events'
import EventForm  from './pages/EventForm'
import Purchases  from './pages/Purchases'
import ScanTicket from './pages/ScanTicket'
import Portfolio  from './pages/Portfolio'

// ── Auth guard ───────────────────────────────────────────────
function RequireAuth({ children }) {
  const key = getStoredKey()
  if (!key) return <Navigate to="/login" replace />
  return children
}

// ── Admin shell (sidebar + main content) ────────────────────
function AdminShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex:       1,
        marginLeft: 'var(--sidebar-w)',
        minHeight:  '100vh',
        background: 'var(--black)',
        overflow:   'auto',
      }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/login" element={<Login />} />

      {/* ── Protected ── */}
      <Route path="/" element={
        <RequireAuth>
          <AdminShell>
            <Dashboard />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/events" element={
        <RequireAuth>
          <AdminShell>
            <Events />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/events/new" element={
        <RequireAuth>
          <AdminShell>
            <EventForm />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/events/:id/edit" element={
        <RequireAuth>
          <AdminShell>
            <EventForm />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/purchases" element={
        <RequireAuth>
          <AdminShell>
            <Purchases />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/scan" element={
        <RequireAuth>
          <AdminShell>
            <ScanTicket />
          </AdminShell>
        </RequireAuth>
      } />

      <Route path="/portfolio" element={
        <RequireAuth>
          <AdminShell>
            <Portfolio />
          </AdminShell>
        </RequireAuth>
      } />

      {/* ── 404 fallback ── */}
      <Route path="*" element={
        <RequireAuth>
          <AdminShell>
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              minHeight:      '80vh',
              gap:            '16px',
            }}>
              <h1 style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '80px',
                color:         'var(--gold)',
                letterSpacing: '4px',
              }}>
                404
              </h1>
              <p style={{ color: 'var(--gray-light)' }}>Page not found</p>
              <a href="/" className="btn-gold">Go to Dashboard</a>
            </div>
          </AdminShell>
        </RequireAuth>
      } />

    </Routes>
  )
}
