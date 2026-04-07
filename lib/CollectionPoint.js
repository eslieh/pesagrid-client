import { authenticatedFetch } from "./Auth";

/**
 * Fetch all collection points for the current collection.
 * Supports filtering by search query and collection point type.
 */
export async function getCollectionPoints(search = null, cpType = null, limit = 50, skip = 0) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (cpType) params.append("cp_type", cpType);
  params.append("limit", limit);
  params.append("skip", skip);

  const query = `?${params.toString()}`;
  const res = await authenticatedFetch(`/api/v1/collection-points/${query}`);
  if (!res.ok) {
    throw new Error("Failed to fetch collection points");
  }
  return await res.json();
}

/**
 * Fetch the total volume for a specific collection point.
 */
export async function getCollectionPointTotals(cpId) {
  const res = await authenticatedFetch(`/api/v1/collection-points/${cpId}/totals`);
  if (!res.ok) {
    throw new Error("Failed to fetch collection point totals");
  }
  return await res.json();
}

/**
 * Create a new collection point.
 */
export async function createCollectionPoint(data) {
  const res = await authenticatedFetch(`/api/v1/collection-points/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Failed to create collection point");
  }
  return await res.json();
}

/**
 * Update an existing collection point.
 */
export async function updateCollectionPoint(cpId, data) {
  const res = await authenticatedFetch(`/api/v1/collection-points/${cpId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Failed to update collection point");
  }
  return await res.json();
}

/**
 * Link a payment channel to a collection point.
 */
export async function linkCollectionPointChannel(cpId, data) {
  const res = await authenticatedFetch(`/api/v1/collection-points/${cpId}/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Failed to link channel");
  }
  return await res.json();
}
