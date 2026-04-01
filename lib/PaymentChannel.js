import { authenticatedFetch } from "./Auth";

/**
 * Fetch payment channels
 * @param {Object} params - { skip, limit }
 * @returns {Promise<Object>} Response with total and items
 */
export async function getPaymentChannels({ skip = 0, limit = 50 } = {}) {
  const query = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  const res = await authenticatedFetch(`/api/v1/accounts/psp?${query}`);

  if (!res.ok) {
    let errorMsg = "Failed to fetch payment channels";
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") errorMsg = data.detail;
      else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        errorMsg = data.detail[0].msg || errorMsg;
      } else if (data?.message) {
        errorMsg = data.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Register a new payment channel
 * @param {Object} data - { psp_type, display_name, paybill, credentials, meta }
 * @returns {Promise<Object>} Created payment channel
 */
export async function registerPaymentChannel(data, mfaToken = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (mfaToken) headers["X-MFA-Token"] = mfaToken;

  const res = await authenticatedFetch(`/api/v1/accounts/psp`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorMsg = "Failed to register payment channel";
    try {
      const respData = await res.json();
      if (typeof respData?.detail === "string") errorMsg = respData.detail;
      else if (Array.isArray(respData?.detail) && respData.detail.length > 0) {
        errorMsg = respData.detail[0].msg || errorMsg;
      } else if (respData?.message) {
        errorMsg = respData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Update an existing payment channel
 * @param {string} pspId - Payment channel ID
 * @param {Object} data - { display_name, paybill, credentials, meta, is_active }
 * @returns {Promise<Object>} Updated payment channel
 */
export async function updatePaymentChannel(pspId, data, mfaToken = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (mfaToken) headers["X-MFA-Token"] = mfaToken;

  const res = await authenticatedFetch(`/api/v1/accounts/psp/${pspId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorMsg = "Failed to update payment channel";
    try {
      const respData = await res.json();
      if (typeof respData?.detail === "string") errorMsg = respData.detail;
      else if (Array.isArray(respData?.detail) && respData.detail.length > 0) {
        errorMsg = respData.detail[0].msg || errorMsg;
      } else if (respData?.message) {
        errorMsg = respData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Delete a payment channel
 * @param {string} pspId - Payment channel ID
 * @returns {Promise<void>}
 */
export async function deletePaymentChannel(pspId, mfaToken = null) {
  const headers = {};
  if (mfaToken) headers["X-MFA-Token"] = mfaToken;

  const res = await authenticatedFetch(`/api/v1/accounts/psp/${pspId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    let errorMsg = "Failed to delete payment channel";
    try {
      const respData = await res.json();
      if (typeof respData?.detail === "string") errorMsg = respData.detail;
      else if (Array.isArray(respData?.detail) && respData.detail.length > 0) {
        errorMsg = respData.detail[0].msg || errorMsg;
      } else if (respData?.message) {
        errorMsg = respData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }
}
