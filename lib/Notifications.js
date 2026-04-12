import { authenticatedFetch } from "./Auth";

/**
 * Handle API responses
 * Reusing logic from Dashboard.js for consistency
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
  // For DELETE 204 responses
  if (res.status === 204) return true;
  return await res.json();
}

/**
 * List notification templates
 * @param {string} type - Optional template type filter ('payment_reminder', 'overdue_notice', etc.)
 * @param {string} channel - Optional channel filter ('sms', 'whatsapp', 'email')
 */
export async function getTemplates(type = null, channel = null, skip = 0, limit = 50) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (channel) params.append("channel", channel);
  params.append("skip", skip);
  params.append("limit", limit);
  
  const query = `?${params.toString()}`;
  const res = await authenticatedFetch(`/api/v1/obligations/templates${query}`);
  return handleResponse(res, "Failed to fetch notification templates");
}

/**
 * Fetch high-quality system template library
 * @param {string} type - Optional template type filter
 * @param {string} channel - Optional channel filter
 */
export async function getTemplateLibrary(type = null, channel = null) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (channel) params.append("channel", channel);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await authenticatedFetch(`/api/v1/obligations/templates/library${query}`);
  return handleResponse(res, "Failed to fetch template library");
}

/**
 * Get a single notification template
 * @param {string} templateId - UUID of the template
 */
export async function getTemplate(templateId) {
  const res = await authenticatedFetch(`/api/v1/obligations/templates/${templateId}`);
  return handleResponse(res, "Failed to fetch notification template");
}

/**
 * Create a new notification template
 * @param {object} data - Template data {name, template_type, channel, subject, body, is_default}
 * Supported types: payment_reminder, overdue_notice, payment_receipt, payment_receipt_full, 
 * obligation_created, obligation_cancelled, collection_receipt, statement, custom
 */
export async function createTemplate(data) {
  const res = await authenticatedFetch(`/api/v1/obligations/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create notification template");
}

/**
 * Create multiple notification templates in bulk
 * @param {object[]} templates - Array of template objects
 */
export async function createTemplatesBulk(templates) {
  const res = await authenticatedFetch(`/api/v1/obligations/templates/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ templates }),
  });
  return handleResponse(res, "Failed to bulk create templates");
}

/**
 * Update an existing notification template
 * @param {string} templateId - UUID of the template
 * @param {object} data - Updated fields {name, subject, body, is_active, is_default}
 */
export async function updateTemplate(templateId, data) {
  const res = await authenticatedFetch(`/api/v1/obligations/templates/${templateId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update notification template");
}

/**
 * Delete a notification template
 * @param {string} templateId - UUID of the template
 */
export async function deleteTemplate(templateId) {
  const res = await authenticatedFetch(`/api/v1/obligations/templates/${templateId}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete notification template");
}
/**
 * Get business notification settings
 */
export async function getNotificationSettings() {
  const res = await authenticatedFetch(`/api/v1/notifications/settings`);
  return handleResponse(res, "Failed to fetch notification settings");
}

/**
 * Update business notification settings
 * @param {Object} data - { payment_notifications_enabled: bool, payment_notification_channels: string[] }
 */
export async function updateNotificationSettings(data) {
  const res = await authenticatedFetch(`/api/v1/notifications/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update notification settings");
}
