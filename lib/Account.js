import { authenticatedFetch } from "./Auth";

/**
 * Fetch business profile
 * @returns {Promise<Object|null>} Profile data or null if 404
 */
export async function getBusinessProfile() {
  try {
    const res = await authenticatedFetch("/api/v1/accounts/profile");
    if (res.status === 404) return null;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to fetch business profile");
    }
    return await res.json();
  } catch (error) {
    if (error.message.includes("404")) return null;
    throw error;
  }
}

/**
 * Create business profile
 * @param {Object} profileData
 */
export async function createBusinessProfile(profileData) {
  const res = await authenticatedFetch("/api/v1/accounts/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create business profile");
  }
  return await res.json();
}

/**
 * Update business profile
 * @param {Object} profileData
 */
export async function updateBusinessProfile(profileData) {
  const res = await authenticatedFetch("/api/v1/accounts/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update business profile");
  }
  return await res.json();
}
