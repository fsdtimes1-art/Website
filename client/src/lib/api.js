// VITE_USE_SAME_ORIGIN_API is enabled only for the Vercel review preview.
// Production continues to use its existing VITE_API_URL configuration.
const useSameOriginApi = import.meta.env.VITE_USE_SAME_ORIGIN_API === 'true'
const apiOrigin = useSameOriginApi ? '' : (import.meta.env.VITE_API_URL || '')
const BASE = `${apiOrigin}/api`
const previewReadOnly = import.meta.env.VITE_PREVIEW_READ_ONLY === 'true'

// ── Generic fetch helper ─────────────────────────────────────
async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  if (previewReadOnly && method !== 'GET') {
    throw new Error('This review preview is read-only. Purchase requests are disabled.')
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data
}

// ============================================================
// EVENTS
// ============================================================

// Get all active events (with seat categories)
export async function getEvents() {
  return request('/events')
}

// Get single event by ID
export async function getEvent(id) {
  return request(`/events/${id}`)
}

// ============================================================
// PORTFOLIO
// ============================================================

export async function getPortfolio() {
  return request('/portfolio')
}

// ============================================================
// PAYMENTS
// ============================================================

// Create Stripe checkout session
// Returns { sessionId, url }
export async function createCheckout({
  eventId,
  categoryId,
  quantity,
  buyerName,
  buyerEmail,
  buyerPhone,
  ticketNames
}) {
  return request('/payments/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      categoryId,
      quantity,
      buyerName,
      buyerEmail,
      buyerPhone,
      ticketNames
    })
  })
}

// Create a WhatsApp-based manual order (no online payment)
// Returns { purchaseId, totalAmount }
export async function createWhatsappOrder({
  eventId,
  categoryId,
  quantity,
  buyerName,
  buyerEmail,
  buyerPhone,
  ticketNames
}) {
  return request('/payments/create-whatsapp-order', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      categoryId,
      quantity,
      buyerName,
      buyerEmail,
      buyerPhone,
      ticketNames
    })
  })
}

// Verify payment session on success page
export async function getPaymentSession(sessionId) {
  return request(`/payments/session/${sessionId}`)
}

// ============================================================
// TICKETS
// ============================================================

// Get tickets for a purchase (used on success page)
export async function getTicketsByPurchase(purchaseId) {
  return request(`/tickets/purchase/${purchaseId}`)
}

// ============================================================
// FEES
// ============================================================
export const DEFAULT_SERVICE_FEE = 220

export function getFeesTotal(serviceFee = DEFAULT_SERVICE_FEE, quantity = 1) {
  const configuredFee = serviceFee == null ? NaN : Number(serviceFee)
  const feePerCategoryUnit = Number.isFinite(configuredFee) && configuredFee >= 0
    ? configuredFee
    : DEFAULT_SERVICE_FEE
  return feePerCategoryUnit * Number(quantity)
}

export function computeDiscountAmount(subtotal, discounts = []) {
  const amount = (discounts || []).reduce((sum, d) => {
    const val = Number(d.value) || 0
    return sum + (d.type === 'percent' ? (subtotal * val / 100) : val)
  }, 0)
  return Math.min(amount, subtotal)
}

export function getOrderTotals(price, quantity, discounts = [], serviceFee = DEFAULT_SERVICE_FEE) {
  const subtotal = Number(price) * quantity
  const discountAmount = computeDiscountAmount(subtotal, discounts)
  const fees = getFeesTotal(serviceFee, quantity)
  const total = Math.max(subtotal - discountAmount, 0) + fees
  return { subtotal, discountAmount, fees, total }
}

export function getOrderTotal(price, quantity, discounts = [], serviceFee = DEFAULT_SERVICE_FEE) {
  return getOrderTotals(price, quantity, discounts, serviceFee).total
}
