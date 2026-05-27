const BASE = '/api'

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
  buyerPhone
}) {
  return request('/payments/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      categoryId,
      quantity,
      buyerName,
      buyerEmail,
      buyerPhone
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