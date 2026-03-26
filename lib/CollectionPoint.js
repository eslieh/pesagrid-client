import { authenticatedFetch } from "./Auth";

/**
 * Fetch all collection points for the current collection.
 * Returns a direct list of collection points.
 */
export async function getCollectionPoints() {
  const res = await authenticatedFetch(`/api/v1/collection-points/`);
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
