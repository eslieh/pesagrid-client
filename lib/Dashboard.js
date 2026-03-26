import { authenticatedFetch } from "./Auth";

/**
 * Handle API responses
 */
async function handleResponse(res, defaultErrorMsg) {
  if (!res.ok) {
    let errorMsg = defaultErrorMsg;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") errorMsg = data.detail;
      else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        errorMsg = data.detail[0].msg || defaultErrorMsg;
      } else if (data?.message) {
        errorMsg = data.message;
      }
    } catch (e) {
      // Ignore parse error
    }
    throw new Error(errorMsg);
  }
  return await res.json();
}

/**
 * Get top-level dashboard metrics
 * @param {string} collectionPointId - Optional filtering by collection_point_id
 */
export async function getDashboardMetrics(collectionPointId = null, startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (collectionPointId) params.append("collection_point_id", collectionPointId);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  const query = params.toString() ? `?${params}` : "";
  const res = await authenticatedFetch(`/api/v1/dashboard/metrics${query}`);
  return handleResponse(res, "Failed to fetch dashboard metrics");
}

/**
 * Get aggregated metrics per collection point
 */
export async function getCollectionPointsMetrics(startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  const query = params.toString() ? `?${params}` : "";
  const res = await authenticatedFetch(`/api/v1/dashboard/collections/points${query}`);
  return handleResponse(res, "Failed to fetch collection points metrics");
}

/**
 * Get historical collection trends
 */
export async function getCollectionTrends(interval = "day", collectionPointId = null, startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (interval) params.append("interval", interval);
  if (collectionPointId) params.append("collection_point_id", collectionPointId);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  const query = params.toString() ? `?${params}` : "";
  const res = await authenticatedFetch(`/api/v1/dashboard/collections/trends${query}`);
  return handleResponse(res, "Failed to fetch collection trends");
}

/**
 * Get peak collection times by hour
 */
export async function getPeakTimes(collectionPointId = null, startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (collectionPointId) params.append("collection_point_id", collectionPointId);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  const query = params.toString() ? `?${params}` : "";
  const res = await authenticatedFetch(`/api/v1/dashboard/collections/peak-times${query}`);
  return handleResponse(res, "Failed to fetch peak times");
}

/**
 * Get payments grouped by account
 */
export async function getPaymentsByAccount(startDate = null, endDate = null, skip = 0, limit = 50) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  params.append("skip", skip);
  params.append("limit", limit);
  
  const query = `?${params}`;
  const res = await authenticatedFetch(`/api/v1/dashboard/payments/accounts${query}`);
  return handleResponse(res, "Failed to fetch payments by account");
}

/**
 * Get recent payment history
 */
export async function getRecentPayments(collectionPointId = null, skip = 0, limit = 50, startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (collectionPointId) params.append("collection_point_id", collectionPointId);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  params.append("skip", skip);
  params.append("limit", limit);
  
  const query = `?${params}`;
  const res = await authenticatedFetch(`/api/v1/dashboard/payments${query}`);
  return handleResponse(res, "Failed to fetch recent payments");
}
