import { authenticatedFetch } from "./Auth";

// ─────────────────────────────────────────────────────────────
// Payer Groups
// ─────────────────────────────────────────────────────────────

export async function createPayerGroup(data) {
  const res = await authenticatedFetch(`/api/v1/obligations/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create payer group");
}

export async function getPayerGroups(params = {}) {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.append("skip", params.skip);
  if (params.limit !== undefined) query.append("limit", params.limit);
  
  const endpoint = query.toString() ? `/api/v1/obligations/groups?${query}` : `/api/v1/obligations/groups`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch payer groups");
}

export async function getPayerGroup(groupId) {
  const res = await authenticatedFetch(`/api/v1/obligations/groups/${groupId}`);
  return handleResponse(res, "Failed to fetch payer group");
}

export async function updatePayerGroup(groupId, data) {
  const res = await authenticatedFetch(`/api/v1/obligations/groups/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update payer group");
}

export async function deletePayerGroup(groupId) {
  const res = await authenticatedFetch(`/api/v1/obligations/groups/${groupId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to delete payer group");
    throw new Error(errorMsg);
  }
}


// ─────────────────────────────────────────────────────────────
// Payers
// ─────────────────────────────────────────────────────────────

export async function createPayer(data) {
  const res = await authenticatedFetch(`/api/v1/obligations/payers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create payer");
}

export async function getPayers(params = {}) {
  const query = new URLSearchParams();
  if (params.group_id) query.append("group_id", params.group_id);
  if (params.is_active !== undefined) query.append("is_active", params.is_active);
  if (params.skip !== undefined) query.append("skip", params.skip);
  if (params.limit !== undefined) query.append("limit", params.limit);
  
  const endpoint = query.toString() ? `/api/v1/obligations/payers?${query}` : `/api/v1/obligations/payers`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch payers");
}

export async function getPayer(payerId) {
  const res = await authenticatedFetch(`/api/v1/obligations/payers/${payerId}`);
  return handleResponse(res, "Failed to fetch payer");
}

export async function updatePayer(payerId, data) {
  const res = await authenticatedFetch(`/api/v1/obligations/payers/${payerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update payer");
}

export async function deletePayer(payerId) {
  const res = await authenticatedFetch(`/api/v1/obligations/payers/${payerId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to delete payer");
    throw new Error(errorMsg);
  }
}

// ─────────────────────────────────────────────────────────────
// Obligations (Invoices)
// ─────────────────────────────────────────────────────────────

export async function createObligation(data) {
  const res = await authenticatedFetch(`/api/v1/obligations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create obligation");
}

export async function unifiedCreate(data) {
  const res = await authenticatedFetch(`/api/v1/obligations/unified-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create unified obligation");
}

export async function getObligations(params = {}) {
  const query = new URLSearchParams();
  if (params.payer_id) query.append("payer_id", params.payer_id);
  if (params.account_no) query.append("account_no", params.account_no);
  if (params.status) query.append("status", params.status);
  if (params.is_recurring !== undefined) query.append("is_recurring", params.is_recurring);
  if (params.skip !== undefined) query.append("skip", params.skip);
  if (params.limit !== undefined) query.append("limit", params.limit);
  
  const endpoint = query.toString() ? `/api/v1/obligations/?${query}` : `/api/v1/obligations/`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch obligations");
}

export async function getObligation(obligationId) {
  const res = await authenticatedFetch(`/api/v1/obligations/${obligationId}`);
  return handleResponse(res, "Failed to fetch obligation");
}

export async function updateObligation(obligationId, data) {
  const res = await authenticatedFetch(`/api/v1/obligations/${obligationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update obligation");
}

export async function deleteObligation(obligationId) {
  const res = await authenticatedFetch(`/api/v1/obligations/${obligationId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorMsg = await extractErrorMessage(res, "Failed to delete obligation");
    throw new Error(errorMsg);
  }
}

export async function updateRecurringSchedule(obligationId, data) {
  const res = await authenticatedFetch(`/api/v1/obligations/${obligationId}/recurring`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update recurring schedule");
}

export async function getPayerLedger(payerId) {
  const res = await authenticatedFetch(`/api/v1/obligations/payers/${payerId}/ledger`);
  return handleResponse(res, "Failed to fetch payer ledger");
}

export async function getGlobalLedger(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  if (params.group_id) query.append("group_id", params.group_id);
  if (params.status_filter) query.append("status_filter", params.status_filter);
  if (params.search) query.append("search", params.search);
  
  const endpoint = query.toString() ? `/api/v1/obligations/ledger?${query}` : `/api/v1/obligations/ledger`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch global ledger");
}

export async function getUpcomingLedger(params = {}) {
  const query = new URLSearchParams();
  if (params.days) query.append("days", params.days);
  if (params.group_id) query.append("group_id", params.group_id);
  
  const endpoint = query.toString() ? `/api/v1/obligations/ledger/upcoming?${query}` : `/api/v1/obligations/ledger/upcoming`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch upcoming ledger");
}

export async function getRecurringPreview(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.append("type", params.type);
  if (params.amount) query.append("amount", params.amount);
  if (params.start) query.append("start", params.start);
  if (params.interval) query.append("interval", params.interval);
  if (params.dom) query.append("dom", params.dom);
  if (params.dow) query.append("dow", params.dow);
  
  const endpoint = `/api/v1/obligations/recurring-preview?${query.toString()}`;
  const res = await authenticatedFetch(endpoint);
  return handleResponse(res, "Failed to fetch recurring preview");
}

export async function voidObligation(obligationId, reason) {
  const res = await authenticatedFetch(`/api/v1/obligations/${obligationId}/cancel?reason=${encodeURIComponent(reason)}`, {
    method: "POST",
  });
  return handleResponse(res, "Failed to void obligation");
}

export async function cancelObligation(obligationId) {
  return voidObligation(obligationId, "Cancelled by user");
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
