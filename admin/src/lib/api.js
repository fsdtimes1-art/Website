const BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin'

// ── stored key ───────────────────────────────────────────────
export function getStoredKey()  { return localStorage.getItem('admin_key')  || '' }
export function getStoredRole() { return localStorage.getItem('admin_role') || '' }
export function getStoredLoginAt() {
  const v = localStorage.getItem('admin_login_at')
  return v ? Number(v) : null
}

export function setStoredKey(key)   { localStorage.setItem('admin_key',  key)  }
export function setStoredRole(role) { localStorage.setItem('admin_role', role) }
export function setStoredLoginAt(ts = Date.now()) {
  localStorage.setItem('admin_login_at', String(ts))
}

export function clearStoredKey() {
  localStorage.removeItem('admin_key')
  localStorage.removeItem('admin_role')
  localStorage.removeItem('admin_login_at')
}

// ── generic fetch helper ─────────────────────────────────────
async function request(path, options = {}, useAdminBase = true) {
  const base = useAdminBase ? BASE : (import.meta.env.VITE_API_URL || '') + '/api'
  const res  = await fetch(`${base}${path}`, {
    // Required for Vercel-authenticated cross-origin Preview API requests.
    credentials: 'include',
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
    // Carry the logged-in browser's Vercel Preview credential to the backend Preview.
    credentials: 'include',
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

export async function deleteEvent(id, confirmationName) {
  return request(`/events/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirmationName }),
  })
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

export async function createManualSale(payload) {
  return request('/purchases/manual', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function verifyWhatsappPurchase(id) {
  return request(`/purchases/${id}/verify-whatsapp`, { method: 'PATCH' })
}

export async function deletePendingPurchase(id) {
  return request(`/purchases/${id}`, { method: 'DELETE' })
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

export async function reorderPortfolioItems(orderedIds) {
  return request('/portfolio/order', {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  })
}

// ============================================================
// TICKET VERIFY  (not under /admin prefix)
// ============================================================

export async function verifyTicket(qrCode) {
  return request(`/tickets/verify/${qrCode}`, { method: 'POST' }, false)
}

// ============================================================
// PHYSICAL TICKETS
// ============================================================

const PT_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/physical-tickets'

async function ptRequest(path, options = {}) {
  const res = await fetch(`${PT_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'x-admin-key': getStoredKey(),
      ...options.headers,
    },
    ...options,
  })
  // Handle non-JSON responses (e.g. PDF stream errors)
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw new Error((typeof data === 'object' ? data.error : data) || `Request failed: ${res.status}`)
  return data
}

export async function getPhysicalTicketStats() {
  return ptRequest('/stats')
}

export async function getPhysicalBatches() {
  return ptRequest('/batches')
}

/**
 * Creates a new batch. Sends multipart/form-data so the server
 * receives the optional template image file.
 *
 * @param {FormData} formData  - Must include eventId, categoryId, quantity,
 *                               startSerial, and optionally a "template" file.
 */
export async function createPhysicalBatch(formData) {
  // Note: do NOT set Content-Type — browser sets it with boundary automatically
  return ptRequest('/batches', {
    method: 'POST',
    body:   formData,
  })
}

export async function getPhysicalBatchPdfUrl(batchId) {
  return ptRequest(`/batches/${batchId}/pdf`)
}

export async function getPhysicalTickets(params = {}) {
  const qs = new URLSearchParams()
  if (params.batchId) qs.set('batchId', params.batchId)
  if (params.status)  qs.set('status',  params.status)
  if (params.scanned !== undefined) qs.set('scanned', String(params.scanned))
  if (params.page)    qs.set('page',    String(params.page))
  if (params.limit)   qs.set('limit',   String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return ptRequest(`/tickets${suffix}`)
}

export async function activateSerialRange(payload) {
  return ptRequest('/tickets/activate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

export async function voidSerialRange(payload) {
  return ptRequest('/tickets/void', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

// ============================================================
// PURCHASES — CSV EXPORT (client-side, no API call)
// ============================================================

/**
 * Converts a filtered purchases array to a CSV Blob and triggers browser download.
 * Called from Purchases.jsx "Export CSV" button.
 *
 * @param {Array}  purchases   - filtered purchases array from state
 * @param {string} filename    - optional filename (default: purchases-YYYY-MM-DD.csv)
 */
export function exportPurchasesCSV(purchases, filename) {
  const headers = [
    'Date', 'Buyer Name', 'Email', 'Phone',
    'Event', 'Status', 'Total (PKR)',
    'Tickets', 'Seats',
  ]

  const rows = purchases.map(p => {
    const date    = p.created_at ? new Date(p.created_at).toLocaleDateString('en-PK') : ''
    const event   = p.events?.name   || ''
    const seats   = (p.tickets || []).map(t => t.seat_number).join(' | ')
    const tickets = (p.tickets || []).length

    return [
      date,
      p.buyer_name    || '',
      p.buyer_email   || '',
      p.buyer_phone   || '',
      event,
      p.status        || '',
      Number(p.total_amount || 0).toFixed(2),
      tickets,
      seats,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  const csv     = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const link    = document.createElement('a')
  const today   = new Date().toISOString().split('T')[0]
  link.href     = url
  link.download = filename || `purchases-${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
