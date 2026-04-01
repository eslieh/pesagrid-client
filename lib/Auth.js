// Authentication utility functions

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";



/**
 * Helper to extract error message from backend response
 */
function getErrorMessage(data, defaultMsg) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    return data.detail[0].msg || defaultMsg;
  }
  return data?.message || defaultMsg;
}

/**
 * Login API client
 * @param {Object} credentials - { identifier, password, auth_type }
 * @returns {Promise<Object>} Login response with user and tokens
 */
export async function login(credentials) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "api.ryfty.net",
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Prefix": "/pesagrid-api",
    },
    body: JSON.stringify({
      identifier:
        credentials.identifier?.trim().toLowerCase() ||
        credentials.email?.trim().toLowerCase(),
      password: credentials.password,
      auth_type: credentials.auth_type || "email",
    }),
  });

  if (!res.ok) {
    let errorMsg = "Please check your internet connection or try again later.";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  const response = await res.json();
  return response;
}

/**
 * Register API client
 * @param {Object} userData - { email, phone, password, auth_type }
 * @returns {Promise<Object>} Registration response
 */
export async function register(userData) {
  const payload = {
    email: userData.email?.trim().toLowerCase(),
    phone: userData.phone?.trim(),
    password: userData.password,
    auth_type: userData.auth_type || "email",
  };

  // Add name if present
  if (userData.name) {
    payload.name = userData.name.trim();
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "api.ryfty.net",
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Prefix": "/api",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg =
      "Registration failed. Please check your internet connection or try again later";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Verify account API client
 * @param {Object} verificationData
 * @returns {Promise<Object>} Verification response
 */
export async function verifyAccount(verificationData) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "api.ryfty.net",
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Prefix": "/api",
    },
    body: JSON.stringify({
      token: verificationData.token,
    }),
  });

  if (!res.ok) {
    let errorMsg = "Account verification failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  const response = await res.json();
  return response;
}

/**
 * Logout API client
 * @returns {Promise<Object>} Logout response
 */
export async function logout() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "api.ryfty.net",
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Prefix": "/api",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    let errorMsg = "Logout failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Fetch current user's school info
 * @returns {Promise<Object|null>} School data or null
 */
export async function getUserSchool() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/users/school`, {
      headers: {
        "X-Forwarded-Host": "api.ryfty.net",
        "X-Forwarded-Proto": "http",
        "X-Forwarded-Prefix": "/api",
      },
      credentials: "include",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} API response
 */
export async function authenticatedFetch(
  url,
  options = {},
  baseUrl = API_BASE_URL,
) {
  const proxyHeaders = {
    "X-Forwarded-Host": "api.ryfty.net",
    "X-Forwarded-Proto": "http",
    "X-Forwarded-Prefix": "/pesagrid-api",
  };

  // Credentials are set to include by default for cookie-based auth
  const config = {
    ...options,
    credentials: options.credentials || "include",
    headers: {
      ...proxyHeaders,
      ...options.headers,
    },
  };

  // Robust URL joining that prevents double slashes
  // const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // const cleanPath = url.startsWith('/') ? url : `/${url}`;
  // const fullUrl = url.startsWith('http') ? url : `${cleanBaseUrl}${cleanPath}`;

  const fullUrl = url.startsWith("http") ? url : baseUrl + url;

  // console.log(`[AUTH_FETCH_DEBUG]`);
  // console.log(`- Request Method: ${config.method || 'GET'}`);
  // console.log(`- Proxied URL (Internal): ${fullUrl}`);

  // Note: The destination below is what we EXPECT the Next.js server to hit.
  // If your Network Tab shows a redirect to an IP, the backend is sending a 3xx status code.
  // const simulatedDest = fullUrl.replace('/server-api', 'http://api.ryfty.net/api');
  // console.log(`- Target Destination (Backend): ${simulatedDest}`);

  let res = await fetch(fullUrl, config);

  // If unauthorized, try to refresh
  if (res.status === 401) {
    try {
      // For cookie-based auth, we don't need to check for a refresh token here
      // The /refresh endpoint will check the cookie
      await refreshToken();
      // Retry the request
      res = await fetch(fullUrl, config);
    } catch (error) {
      // If refresh fails, just return the original response
      console.warn("Token refresh failed:", error.message);
    }
  }

  return res;
}

/**
 * Request MFA OTP verification code for sensitive actions
 * @returns {Promise<Object>} Response message
 */
export async function requestMfaCode() {
  const res = await authenticatedFetch(`/api/v1/auth/mfa/request`, {
    method: "POST",
  });

  if (!res.ok) {
    let errorMsg = "Failed to request verification code";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Refresh access token using refresh token
 * @returns {Promise<Object>} Refresh token response with new tokens
 */
export async function refreshToken() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "api.ryfty.net",
      "X-Forwarded-Proto": "http",
      "X-Forwarded-Prefix": "/api",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    let errorMsg = "Token refresh failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  const response = await res.json();
  return response;
}

/**
 * Change current user's password
 * @param {Object} passwordData - { current_password, new_password }
 * @returns {Promise<Object>} Change password response
 */
export async function changePassword(passwordData) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    }),
  });

  if (!res.ok) {
    let errorMsg = "Password change failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Request password reset link
 * @param {Object} requestData - { email, phone }
 * @returns {Promise<Object>} Forgot password response
 */
export async function forgotPassword(requestData) {
  const payload = {};
  if (requestData.email) {
    payload.identifier = requestData.email.trim().toLowerCase();
  } else if (requestData.phone) {
    payload.identifier = requestData.phone.trim();
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg = "Forgot password request failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Reset password using token
 * @param {Object} resetData - { token, new_password }
 * @returns {Promise<Object>} Reset password response
 */
export async function resetPassword(resetData) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: resetData.token,
      new_password: resetData.new_password,
    }),
  });

  if (!res.ok) {
    let errorMsg = "Password reset failed";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Get current user info
 * @returns {Promise<Object>} Current user data
 */
export async function getCurrentUser() {
  const res = await authenticatedFetch("/api/v1/auth/me");

  if (!res.ok) {
    let errorMsg = "Failed to fetch user info";
    try {
      const data = await res.json();
      errorMsg = getErrorMessage(data, errorMsg);
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}


export function clearAuthToken() {
  // Backward-compatible alias
  return clearAuthTokens();
}
