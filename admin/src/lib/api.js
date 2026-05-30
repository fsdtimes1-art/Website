const BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin'

// ── stored key ───────────────────────────────────────────────
export function getStoredKey()  { return localStorage.getItem('admin_key')  || '' }
export function getStoredRole() { return localStorage.getItem('admin_role') || '' }

export function setStoredKey(key)   { localStorage.setItem('admin_key',  key)  }
export function setStoredRole(role) { localStorage.setItem('admin_role', role) }

export function clearStoredKey() {
  localStorage.removeItem('admin_key')
  localStorage.removeItem('admin_role')
}

// ── generic fetch helper ─────────────────────────────────────
async function request(path, options = {}, useAdminBase = true) {
  const base = useAdminBase ? BASE : (import.meta.env.VITE_API_URL || '') + '/api'
  const res  = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type':  'application/json',
      'x-admin-key':   getStoredKey(),
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data
}

// ============================================================
// AUTH
// ============================================================

export async function verifyAdminKey(key) {
  const res = await fetch(`${BASE}/me`, {
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key':  key,
    },
  })
  return res.ok
}

export async function getMe() {
  return request('/me')
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboard() {
  return request('/dashboard')
}

// ============================================================
// EVENTS
// ============================================================

export async function getAdminEvents() {
  return request('/events')
}

export async function createEvent(payload) {
  return request('/events', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function updateEvent(id, payload) {
  return request(`/events/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
}

export async function toggleEvent(id) {
  return request(`/events/${id}/toggle`, { method: 'PATCH' })
}

export async function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' })
}

export async function deleteCategory(eventId, catId) {
  return request(`/events/${eventId}/categories/${catId}`, { method: 'DELETE' })
}

// ============================================================
// PURCHASES
// ============================================================

export async function getPurchases(eventId) {
  const qs = eventId ? `?eventId=${eventId}` : ''
  return request(`/purchases${qs}`)
}

// ============================================================
// PORTFOLIO
// ============================================================

export async function getAdminPortfolio() {
  return request('/portfolio')
}

export async function createPortfolioItem(payload) {
  return request('/portfolio', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function updatePortfolioItem(id, payload) {
  return request(`/portfolio/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
}

export async function deletePortfolioItem(id) {
  return request(`/portfolio/${id}`, { method: 'DELETE' })
}

// ============================================================
// TICKET VERIFY  (not under /admin prefix)
// ============================================================

export async function verifyTicket(qrCode) {
  return request(`/tickets/verify/${qrCode}`, { method: 'POST' }, false)
}