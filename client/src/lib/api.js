const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

// ── Generic fetch helper ─────────────────────────────────────
async function request(path, options = {}) {
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
export const TICKET_FEES = {
  booking:    80,
  processing: 70,
  platform:   70,
}

export function getFeesTotal(quantity = 1) {
  return (TICKET_FEES.booking + TICKET_FEES.processing + TICKET_FEES.platform) * quantity
}

export function computeDiscountAmount(subtotal, discounts = []) {
  const amount = (discounts || []).reduce((sum, d) => {
    const val = Number(d.value) || 0
    return sum + (d.type === 'percent' ? (subtotal * val / 100) : val)
  }, 0)
  return Math.min(amount, subtotal)
}

export function getOrderTotals(price, quantity, discounts = []) {
  const subtotal       = Number(price) * quantity
  const discountAmount = computeDiscountAmount(subtotal, discounts)
  const fees           = getFeesTotal(quantity)
  const total          = Math.max(subtotal - discountAmount, 0) + fees
  return { subtotal, discountAmount, fees, total }
}

export function getOrderTotal(price, quantity, discounts = []) {
  return getOrderTotals(price, quantity, discounts).total
}