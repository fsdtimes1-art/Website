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

export async function getPhysicalBatchPdfUrl(batchId, batchRef) {
  // The server now streams raw PDF bytes — fetch as blob
  const res = await fetch(`${PT_BASE}/batches/${batchId}/pdf`, {
    credentials: 'include',
    headers: { 'x-admin-key': getStoredKey() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  const blob    = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  return { blobUrl, filename: `${batchRef || batchId}.pdf` }
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
// PURCHASES — EXCEL EXPORT (SpreadsheetML — no external deps)
// ============================================================

/**
 * Generates a formatted Excel (.xls) file and triggers browser download.
 * Uses Office SpreadsheetML XML — opens natively in Excel with styling.
 * Called from Purchases.jsx "Export Excel" button.
 *
 * @param {Array}  purchases  - filtered purchases array from state
 * @param {string} eventName  - event name for the sheet title
 * @param {string} filename   - optional filename (default: ticket-sales-YYYY-MM-DD.xls)
 */
export function exportPurchasesCSV(purchases, eventName, filename) {
  const stamp = new Date().toISOString().split('T')[0]
  const title = eventName || 'All Events'

  // ── Totals (paid orders only) ───────────────────────────────
  const paid    = purchases.filter(p => p.status === 'completed' || p.status === 'whatsapp_verified')
  const totTix  = paid.reduce((s, p) => s + (p.tickets?.length || 0), 0)
  const buyers  = new Set(paid.map(p => p.buyer_email || p.buyer_name)).size
  const gross   = paid.reduce((s, p) => s + Number(p.total_amount  || 0), 0)
  const svcSum  = paid.reduce((s, p) => s + Number(p.service_fee   || 0), 0)
  const base    = gross - svcSum

  // ── SpreadsheetML XML helpers ───────────────────────────────
  const cell = (value, type = 'String', styleId = '') => {
    const attr = styleId ? ` ss:StyleID="${styleId}"` : ''
    if (type === 'Number') {
      return `<Cell${attr}><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`
    }
    const v = String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    return `<Cell${attr}><Data ss:Type="String">${v}</Data></Cell>`
  }
  const row  = (...cells) => `<Row>${cells.join('')}</Row>`
  const emptyRow = (n = 1) => `<Row ss:Height="${n * 8}"></Row>`

  // ── Data rows ───────────────────────────────────────────────
  const dataRows = purchases.map(p => {
    const date   = p.created_at ? new Date(p.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', day:'2-digit', month:'short', year:'numeric' }) : ''
    const qty    = (p.tickets || []).length
    const svc    = Number(p.service_fee || 0)
    const tot    = Number(p.total_amount || 0)
    const seats  = (p.tickets || []).map(t => t.seat_number).filter(Boolean).join(', ')
    return row(
      cell(date,                 'String', 'data'),
      cell(p.buyer_name  || '',  'String', 'data'),
      cell(p.buyer_email || '',  'String', 'data'),
      cell(p.buyer_phone || '',  'String', 'data'),
      cell(p.events?.name || '', 'String', 'data'),
      cell(p.status       || '', 'String', 'data'),
      cell(qty,    'Number', 'num'),
      cell(tot - svc, 'Number', 'num'),
      cell(svc,       'Number', 'num'),
      cell(tot,       'Number', 'numBold'),
      cell(seats, 'String', 'data'),
    )
  }).join('\n')

  // ── Full XML ────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
  <Style ss:ID="title">
    <Alignment ss:Horizontal="Left"/>
    <Font ss:Bold="1" ss:Size="14" ss:Color="#FFD600"/>
    <Interior ss:Color="#0a0a0a" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="subTitle">
    <Font ss:Size="10" ss:Color="#9ca3af"/>
    <Interior ss:Color="#0a0a0a" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="statLabel">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#6b7280"/>
    <Interior ss:Color="#1a1a1a" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="statVal">
    <Font ss:Bold="1" ss:Size="13" ss:Color="#ffffff"/>
    <Interior ss:Color="#1a1a1a" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="statGold">
    <Font ss:Bold="1" ss:Size="13" ss:Color="#FFD600"/>
    <Interior ss:Color="#1a1a1a" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="hdr">
    <Alignment ss:Horizontal="Center"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFD600"/>
    <Interior ss:Color="#0a0a0a" ss:Pattern="Solid"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFD600"/>
    </Borders>
  </Style>
  <Style ss:ID="data">
    <Font ss:Size="10" ss:Color="#1a1a1a"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e5e7eb"/></Borders>
  </Style>
  <Style ss:ID="num">
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Size="10"/>
    <NumberFormat ss:Format="#,##0"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e5e7eb"/></Borders>
  </Style>
  <Style ss:ID="numBold">
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Bold="1" ss:Size="10"/>
    <NumberFormat ss:Format="#,##0"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e5e7eb"/></Borders>
  </Style>
</Styles>
<Worksheet ss:Name="Sales Report">
<Table ss:DefaultColumnWidth="90">
  <Column ss:Width="80"/>  <!-- Date -->
  <Column ss:Width="130"/> <!-- Buyer Name -->
  <Column ss:Width="160"/> <!-- Email -->
  <Column ss:Width="100"/> <!-- Phone -->
  <Column ss:Width="150"/> <!-- Event -->
  <Column ss:Width="90"/>  <!-- Status -->
  <Column ss:Width="50"/>  <!-- Qty -->
  <Column ss:Width="90"/>  <!-- Base -->
  <Column ss:Width="80"/>  <!-- Svc Fee -->
  <Column ss:Width="90"/>  <!-- Total -->
  <Column ss:Width="120"/> <!-- Seats -->

  <!-- ── Header ── -->
  ${row(cell('FAISALABAD TIMES', 'String', 'title'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'))}
  ${row(cell(`Ticket Sales Report — ${title}`, 'String', 'subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'))}
  ${row(cell(`Generated: ${stamp} · ${purchases.length} records`, 'String', 'subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'), cell('','String','subTitle'))}
  ${emptyRow(1)}

  <!-- ── Summary ── -->
  ${row(cell('TOTAL TICKETS','String','statLabel'), cell('UNIQUE BUYERS','String','statLabel'), cell('BASE REVENUE (PKR)','String','statLabel'), cell('SERVICE CHARGES (PKR)','String','statLabel'), cell('GROSS TOTAL (PKR)','String','statLabel'))}
  ${row(cell(totTix,'Number','statVal'), cell(buyers,'Number','statVal'), cell(base,'Number','statVal'), cell(svcSum,'Number','statVal'), cell(gross,'Number','statGold'))}
  ${emptyRow(1)}

  <!-- ── Column Headers ── -->
  ${row(
    cell('Date','String','hdr'), cell('Buyer Name','String','hdr'), cell('Email','String','hdr'),
    cell('Phone','String','hdr'), cell('Event','String','hdr'), cell('Status','String','hdr'),
    cell('Tickets','String','hdr'), cell('Base Amt','String','hdr'), cell('Svc Fee','String','hdr'),
    cell('Total (PKR)','String','hdr'), cell('Seats','String','hdr'),
  )}

  <!-- ── Data rows ── -->
  ${dataRows}

</Table>
</Worksheet>
</Workbook>`

  // ── Trigger download ────────────────────────────────────────
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename || `ticket-sales-${stamp}.xls`
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

