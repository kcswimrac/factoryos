// API client for Factory-OS backend

// Use Vite proxy by default (empty string = relative URLs)
// Only use absolute URL if VITE_API_URL is explicitly set
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing error
    console.error('API Error:', error);
    throw new ApiError(
      'Network error: Unable to connect to server',
      0,
      null
    );
  }
}

// Experiment API
export const experimentApi = {
  // Get all experiments
  getAll: async (userId = 1) => {
    const result = await fetchApi(`/api/experiments?userId=${userId}`);
    return result.data;
  },

  // Get experiment by ID
  getById: async (id) => {
    const result = await fetchApi(`/api/experiments/${id}`);
    return result.data;
  },

  // Create new experiment
  create: async (experimentData) => {
    const result = await fetchApi('/api/experiments', {
      method: 'POST',
      body: JSON.stringify(experimentData),
    });
    return result.data;
  },

  // Get analysis results
  getAnalysis: async (experimentId, responseId = null) => {
    const query = responseId ? `?responseId=${responseId}` : '';
    const result = await fetchApi(`/api/experiments/${experimentId}/analysis${query}`);
    return result.data;
  },

  // Run analysis on experiment
  analyze: async (experimentId, responseId = null) => {
    const query = responseId ? `?responseId=${responseId}` : '';
    const result = await fetchApi(`/api/experiments/${experimentId}/analyze${query}`, {
      method: 'POST',
    });
    return result.data;
  },

  // Update run measurement
  updateMeasurement: async (runId, responseId, measuredValue, notes = null) => {
    const result = await fetchApi('/api/experiments/runs/measurements', {
      method: 'PUT',
      body: JSON.stringify({ runId, responseId, measuredValue, notes }),
    });
    return result.data;
  },

  // Get available factors
  getFactors: async () => {
    const result = await fetchApi('/api/experiments/meta/factors');
    return result.data;
  },

  // Get available responses
  getResponses: async () => {
    const result = await fetchApi('/api/experiments/meta/responses');
    return result.data;
  },
};

// Experiment Share API - Guest Access Sharing
export const experimentShareApi = {
  // Create a new share for an experiment
  createShare: async (experimentId, shareData) => {
    const result = await fetchApi(`/api/experiment-shares/experiment/${experimentId}`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
    return result.data;
  },

  // Get all shares for an experiment (owner only)
  getExperimentShares: async (experimentId, userId = 1) => {
    const result = await fetchApi(`/api/experiment-shares/experiment/${experimentId}?userId=${userId}`);
    return result.data;
  },

  // Get share details by token (for guests)
  getShareByToken: async (token) => {
    const result = await fetchApi(`/api/experiment-shares/token/${token}`);
    return result.data;
  },

  // Accept a share invitation
  acceptShare: async (token, guestData = {}) => {
    const result = await fetchApi(`/api/experiment-shares/token/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(guestData),
    });
    return result.data;
  },

  // Revoke a share
  revokeShare: async (shareId, userId = 1) => {
    const result = await fetchApi(`/api/experiment-shares/${shareId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    return result;
  },

  // Update share access level
  updateShareAccess: async (shareId, accessLevel, userId = 1) => {
    const result = await fetchApi(`/api/experiment-shares/${shareId}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ accessLevel, userId }),
    });
    return result;
  },

  // Get experiments shared with me
  getSharedWithMe: async (email) => {
    const result = await fetchApi(`/api/experiment-shares/shared-with-me?email=${encodeURIComponent(email)}`);
    return result.data;
  },

  // Check access to an experiment
  checkAccess: async (experimentId, userId = null, email = null) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    const result = await fetchApi(`/api/experiment-shares/access/${experimentId}?${params.toString()}`);
    return result.data;
  },

  // Log activity on a shared experiment
  logActivity: async (shareId, activityData) => {
    const result = await fetchApi(`/api/experiment-shares/${shareId}/activity`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    return result;
  },

  // Get activity log for a share
  getShareActivity: async (shareId, userId = 1) => {
    const result = await fetchApi(`/api/experiment-shares/${shareId}/activity?userId=${userId}`);
    return result.data;
  },
};

// Health check
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export default experimentApi;
