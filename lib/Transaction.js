import { authenticatedFetch } from "./Auth";

/**
 * List transactions
 * @param {Object} params - { account_no, psp_type, status, skip, limit }
 * @returns {Promise<Object>} List of transactions
 */
export async function getTransactions(params = {}) {
  const query = new URLSearchParams();
  if (params.account_no) query.append("account_no", params.account_no);
  if (params.psp_type) query.append("psp_type", params.psp_type);
  if (params.status) query.append("status", params.status);
  if (params.skip !== undefined) query.append("skip", params.skip);
  if (params.limit !== undefined) query.append("limit", params.limit);

  const endpoint = query.toString() ? `/api/v1/transactions/?${query}` : `/api/v1/transactions/`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch transactions");
}

/**
 * Get transaction by ID
 * @param {string} transactionId 
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransaction(transactionId) {
  const res = await authenticatedFetch(`/api/v1/transactions/${transactionId}`);
  return handleResponse(res, "Failed to fetch transaction");
}

// ─────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────

async function handleResponse(res, defaultErrorMsg) {
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, defaultErrorMsg);
    throw new Error(errorMsg);
  }
  return await res.json();
}

async function extractErrorMessage(res, defaultErrorMsg) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      return data.detail[0].msg || defaultErrorMsg;
    }
    if (data?.message) return data.message;
  } catch {}
  return defaultErrorMsg;
}
