import { authenticatedFetch } from "./Auth";

/**
 * List transactions
 * @param {Object} params - { account_no, psp_type, status, skip, limit, collection_point_id, start_date, end_date, amount_min, amount_max, phone, psp_ref, search, sort }
 * @returns {Promise<Object>} List of transactions
 */
export async function getTransactions(params = {}) {
  const query = new URLSearchParams();
  
  // Standard filters
  if (params.account_no) query.append("account_no", params.account_no);
  if (params.psp_type) query.append("psp_type", params.psp_type);
  if (params.status) query.append("status", params.status);
  if (params.collection_point_id) query.append("collection_point_id", params.collection_point_id);
  
  // Date range
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  
  // Amount range
  if (params.amount_min !== undefined) query.append("amount_min", params.amount_min);
  if (params.amount_max !== undefined) query.append("amount_max", params.amount_max);
  
  // Identity/Search
  if (params.phone) query.append("phone", params.phone);
  if (params.psp_ref) query.append("psp_ref", params.psp_ref);
  if (params.search) query.append("search", params.search);
  
  // Sorting & Pagination
  if (params.sort) query.append("sort", params.sort);
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
