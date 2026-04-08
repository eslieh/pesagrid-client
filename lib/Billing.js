import { authenticatedFetch } from "./Auth";

/**
 * Fetch active platform billing plans
 */
export async function getPlans() {
  const res = await authenticatedFetch("/api/v1/billing/plans");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch pricing plans");
  }
  return await res.json();
}

/**
 * Fetch current subscription status
 */
export async function getSubscription() {
  const res = await authenticatedFetch("/api/v1/billing/subscription");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch subscription status");
  }
  return await res.json();
}

/**
 * Subscribe to a plan
 */
export async function subscribe(planSlug) {
  const res = await authenticatedFetch("/api/v1/billing/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan_slug: planSlug }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to subscribe to plan");
  }
  return await res.json();
}

/**
 * Fetch wallet balance and details
 */
export async function getWallet() {
  const res = await authenticatedFetch("/api/v1/billing/wallet");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch wallet info");
  }
  return await res.json();
}

/**
 * Initiate wallet top-up via Paystack
 */
export async function topupWallet(data) {
  const res = await authenticatedFetch("/api/v1/billing/wallet/topup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // { amount_kes, email, callback_url }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to initiate top-up");
  }
  return await res.json();
}

/**
 * Verify Paystack top-up redirect
 */
export async function verifyTopup(reference) {
  const res = await authenticatedFetch("/api/v1/billing/wallet/topup/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to verify top-up");
  }
  return await res.json();
}

/**
 * Fetch ledger transactions
 */
export async function getWalletTransactions(limit = 50) {
  const res = await authenticatedFetch(`/api/v1/billing/wallet/transactions?limit=${limit}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch transactions");
  }
  return await res.json();
}

/**
 * Fetch monthly invoices
 */
export async function getInvoices() {
  const res = await authenticatedFetch("/api/v1/billing/invoices");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch invoices");
  }
  return await res.json();
}

/**
 * Fetch billing summary (usage estimates & current month stats)
 */
export async function getBillingSummary() {
  const res = await authenticatedFetch("/api/v1/billing/summary");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch billing summary");
  }
  return await res.json();
}
