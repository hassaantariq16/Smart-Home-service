// UI Utilities and Components

const UI = {
    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },

    // Show loading spinner
    showLoading(text = 'Loading...') {
        let loader = document.getElementById('global-loader');

        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
        <div class="loader-content">
          <div class="spinner"></div>
          <p class="loader-text">${text}</p>
        </div>
      `;
            document.body.appendChild(loader);
        }

        loader.style.display = 'flex';
    },

    // Hide loading spinner
    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    // Animate counter
    animateCounter(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    },

    // Format date
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} minute${mins > 1 ? 's' : ''} ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        // Otherwise show date
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },

    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Create skeleton loader
    createSkeleton(type = 'card') {
        const templates = {
            card: '<div class="skeleton skeleton-card"></div>',
            text: '<div class="skeleton skeleton-text"></div>',
            stat: '<div class="skeleton skeleton-stat"></div>'
        };
        return templates[type] || templates.card;
    },

    // Show modal
    showModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-actions">
          ${actions.map(action => `
            <button class="btn ${action.class || 'btn-secondary'}" 
                    onclick="${action.onClick}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
        document.body.appendChild(modal);
    },

    // Get device icon
    getDeviceIcon(type) {
        const icons = {
            thermostat: '🌡️',
            light: '💡',
            camera: '📹',
            lock: '🔒',
            sensor: '📡',
            speaker: '🔊',
            outlet: '🔌',
            other: '📱'
        };
        return icons[type] || icons.other;
    },

    // Get status badge HTML
    getStatusBadge(online) {
        const status = online ? 'online' : 'offline';
        const label = online ? 'Online' : 'Offline';
        return `<span class="status-badge status-${status}">${label}</span>`;
    },

    // Get database badge
    getDatabaseBadge(dbName) {
        const badges = {
            MongoDB: { color: '#47A248', icon: '🍃' },
            Redis: { color: '#DC382D', icon: '⚡' },
            Cassandra: { color: '#1287B1', icon: '📊' },
            Neo4j: { color: '#008CC1', icon: '🔗' },
            Elasticsearch: { color: '#005571', icon: '🔍' }
        };

        const badge = badges[dbName] || { color: '#666', icon: '💾' };
        return `
      <span class="db-badge" style="background: ${badge.color}20; color: ${badge.color}; border: 1px solid ${badge.color}40;">
        ${badge.icon} ${dbName}
      </span>
    `;
    }
};

// Export for global use
window.UI = UI;
