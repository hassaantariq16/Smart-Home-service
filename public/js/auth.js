// Authentication Utilities

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Update current user data
    updateUser(userData) {
        this.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
    }

    // Clear auth data
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    // Redirect to dashboard if already authenticated
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = '/dashboard.html';
            return true;
        }
        return false;
    }
}

// Export singleton
const auth = new AuthManager();

// Auto-protect pages (except login and index)
document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['login.html', 'index.html', ''];
    const currentPage = window.location.pathname.split('/').pop();

    // If not on a public page, require authentication
    if (!publicPages.includes(currentPage) && currentPage.endsWith('.html')) {
        auth.requireAuth();
    }

    // If on login page and already authenticated, redirect
    if (currentPage === 'login.html') {
        auth.redirectIfAuthenticated();
    }
});
