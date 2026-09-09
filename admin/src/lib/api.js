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

export async function voidETicket(ticketId) {
  return request(`/tickets/${ticketId}/void`, { method: 'PATCH' })
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
  // Destructure headers out so ...rest doesn't overwrite our merged headers below
  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(`${PT_BASE}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      'x-admin-key': getStoredKey(),  // always included
      ...(extraHeaders || {}),
    },
  })
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

export async function deletePhysicalBatch(batchId) {
  return ptRequest(`/batches/${batchId}`, { method: 'DELETE' })
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
// PURCHASES — STYLED HTML REPORT EXPORT (client-side)
// ============================================================

/**
 * Generates a styled HTML sales report and triggers browser download.
 * Called from Purchases.jsx "Export Report" button.
 *
 * @param {Array}  purchases   - filtered purchases array from state
 * @param {string} eventName   - event name for the report title
 * @param {string} filename    - optional filename (default: report-YYYY-MM-DD.html)
 */
export function exportPurchasesCSV(purchases, eventName, filename) {
  const today = new Date().toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── Compute totals ──────────────────────────────────────────
  const paidOnly = purchases.filter(p => p.status === 'completed' || p.status === 'whatsapp_verified')
  const totalTickets  = paidOnly.reduce((s, p) => s + (p.tickets?.length || 0), 0)
  const uniqueBuyers  = new Set(paidOnly.map(p => p.buyer_email || p.buyer_name)).size
  const grossTotal    = paidOnly.reduce((s, p) => s + Number(p.total_amount || 0), 0)
  // Service fee: try p.service_fee, fall back to 0 if not present
  const totalServiceFee = paidOnly.reduce((s, p) => s + Number(p.service_fee || 0), 0)
  const baseTotal     = grossTotal - totalServiceFee

  const fmt = n => `PKR ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  // ── Build table rows ────────────────────────────────────────
  const rowsHtml = purchases.map((p, i) => {
    const date    = p.created_at ? new Date(p.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const event   = p.events?.name || ''
    const seats   = (p.tickets || []).map(t => t.seat_number).filter(Boolean).join(', ')
    const qty     = (p.tickets || []).length
    const svcFee  = Number(p.service_fee || 0)
    const base    = Number(p.total_amount || 0) - svcFee
    const isPaid  = p.status === 'completed' || p.status === 'whatsapp_verified'
    const badge   = isPaid
      ? `<span class="badge green">✓ ${p.status === 'whatsapp_verified' ? 'WhatsApp' : 'Paid'}</span>`
      : `<span class="badge yellow">${p.status}</span>`
    const bg = i % 2 === 0 ? '' : ' alt'
    return `<tr class="${bg}">
      <td>${date}</td>
      <td><strong>${esc(p.buyer_name || '')}</strong><br><small>${esc(p.buyer_email || '')}</small></td>
      <td>${esc(p.buyer_phone || '—')}</td>
      <td>${esc(event)}</td>
      <td class="center">${badge}</td>
      <td class="center">${qty}</td>
      <td class="mono">${fmt(base)}</td>
      <td class="mono">${svcFee > 0 ? fmt(svcFee) : '—'}</td>
      <td class="mono bold">${fmt(p.total_amount || 0)}</td>
      <td><small class="seats">${esc(seats)}</small></td>
    </tr>`
  }).join('\n')

  // ── HTML template ───────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket Sales Report — ${esc(eventName || 'All Events')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f6; color: #1a1a1a; font-size: 13px; }
  .wrapper { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

  /* Header */
  .header { background: #0a0a0a; color: #fff; padding: 28px 32px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #FFD600; }
  .header .sub { color: #9ca3af; font-size: 12px; margin-top: 4px; }
  .header .meta { text-align: right; color: #6b7280; font-size: 12px; }

  /* Summary */
  .summary { background: #1a1a1a; display: flex; gap: 0; }
  .stat { flex: 1; padding: 20px 24px; border-right: 1px solid #2d2d2d; }
  .stat:last-child { border-right: none; }
  .stat .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .stat .value { color: #fff; font-size: 20px; font-weight: 700; margin-top: 6px; }
  .stat .value.gold { color: #FFD600; }
  .stat .value.green { color: #4ade80; }

  /* Table */
  .table-wrap { background: #fff; border-radius: 0 0 12px 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #0a0a0a; color: #FFD600; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 12px 14px; text-align: left; white-space: nowrap; }
  thead th.center { text-align: center; }
  thead th.mono { text-align: right; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr.alt td { background: #fafafa; }
  tbody tr:hover td { background: #fff8e1; }
  td { padding: 10px 14px; vertical-align: middle; color: #374151; }
  td small { color: #9ca3af; font-size: 11px; }
  td.center { text-align: center; }
  td.mono { text-align: right; font-variant-numeric: tabular-nums; color: #1a1a1a; }
  td.bold { font-weight: 700; }
  td.seats { color: #6b7280; max-width: 120px; word-break: break-word; }

  /* Badges */
  .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .badge.green { background: #dcfce7; color: #16a34a; }
  .badge.yellow { background: #fef9c3; color: #b45309; }

  /* Footer */
  .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 11px; }
  @media print { body { background: white; } .wrapper { padding: 0; } }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div>
      <h1>FAISALABAD TIMES</h1>
      <div class="sub">Ticket Sales Report — ${esc(eventName || 'All Events')}</div>
    </div>
    <div class="meta">
      Generated: ${today}<br>
      ${purchases.length} purchase record${purchases.length !== 1 ? 's' : ''}
    </div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="label">Total Tickets</div>
      <div class="value">${totalTickets.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="label">Unique Buyers</div>
      <div class="value">${uniqueBuyers.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="label">Base Revenue</div>
      <div class="value">${fmt(baseTotal)}</div>
    </div>
    <div class="stat">
      <div class="label">Service Charges</div>
      <div class="value">${fmt(totalServiceFee)}</div>
    </div>
    <div class="stat">
      <div class="label">Gross Total</div>
      <div class="value gold">${fmt(grossTotal)}</div>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Buyer</th>
          <th>Phone</th>
          <th>Event</th>
          <th class="center">Status</th>
          <th class="center">Qty</th>
          <th class="mono">Base (PKR)</th>
          <th class="mono">Svc Fee</th>
          <th class="mono">Total (PKR)</th>
          <th>Seats</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Faisalabad Times · Confidential Sales Data · ${today}
  </div>
</div>
</body>
</html>`

  // ── Trigger download ────────────────────────────────────────
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url   = URL.createObjectURL(blob)
  const link  = document.createElement('a')
  const stamp = new Date().toISOString().split('T')[0]
  link.href     = url
  link.download = filename || `ticket-sales-report-${stamp}.html`
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
