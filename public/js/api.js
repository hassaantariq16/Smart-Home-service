// API Service Layer for Smart Home Platform
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token
  removeToken() {
    localStorage.removeItem('token');
  }

  // Generic fetch wrapper with auth
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
      localStorage.removeItem('user');
    }
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  // User endpoints
  async getProfile() {
    return await this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getUserStats() {
    return await this.request('/users/stats');
  }

  // Device endpoints
  async getDevices() {
    return await this.request('/devices');
  }

  async getDevice(deviceId) {
    return await this.request(`/devices/${deviceId}`);
  }

  async registerDevice(deviceData) {
    return await this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    });
  }

  async postDeviceReading(deviceId, readings) {
    return await this.request(`/devices/${deviceId}/readings`, {
      method: 'POST',
      body: JSON.stringify({ values: readings })
    });
  }

  // Service endpoints
  async searchServices(query = '', filters = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });
    return await this.request(`/services/search?${params}`);
  }

  async getService(serviceId) {
    return await this.request(`/services/${serviceId}`);
  }

  async getRecommendations() {
    return await this.request('/services/recommendations/personalized');
  }

  async subscribeToService(serviceId) {
    return await this.request(`/services/${serviceId}/subscribe`, {
      method: 'POST'
    });
  }

  async getServiceCategories() {
    return await this.request('/services/categories/list');
  }

  // Analytics endpoints
  async getDeviceAnalytics(deviceId, period = '24h') {
    return await this.request(`/analytics/devices/${deviceId}?period=${period}`);
  }

  async getDashboardStats() {
    return await this.request('/analytics/dashboard/stats');
  }

  async getRecentActivity(limit = 10) {
    return await this.request(`/analytics/activity/recent?limit=${limit}`);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }
}

// Export singleton instance
const api = new ApiService();
