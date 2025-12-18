// WebSocket Manager for Real-time Updates

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.subscribedDevices = new Set();
        this.eventHandlers = {};
    }

    // Connect to WebSocket server
    connect() {
        if (this.socket) {
            return; // Already connected
        }

        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket.id);
            this.connected = true;
            this.emit('connection-status', { connected: true });

            // Resubscribe to devices after reconnection
            this.subscribedDevices.forEach(deviceId => {
                this.socket.emit('subscribe:device', deviceId);
            });
        });

        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.connected = false;
            this.emit('connection-status', { connected: false });
        });

        this.socket.on('reading', (data) => {
            console.log('📊 Device reading received:', data);
            this.emit('device-reading', data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.emit('connection-error', error);
        });
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.subscribedDevices.clear();
        }
    }

    // Subscribe to device updates
    subscribeToDevice(deviceId) {
        if (!this.socket) {
            this.connect();
        }

        this.subscribedDevices.add(deviceId);

        if (this.connected) {
            this.socket.emit('subscribe:device', deviceId);
            console.log(`📡 Subscribed to device: ${deviceId}`);
        }
    }

    // Unsubscribe from device updates
    unsubscribeFromDevice(deviceId) {
        if (this.socket && this.connected) {
            this.socket.emit('unsubscribe:device', deviceId);
            console.log(`📴 Unsubscribed from device: ${deviceId}`);
        }

        this.subscribedDevices.delete(deviceId);
    }

    // Register event handler
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    // Remove event handler
    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }

    // Emit custom event to handlers
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    // Get connection status
    isConnected() {
        return this.connected;
    }
}

// Export singleton
const ws = new WebSocketManager();

// Auto-connect when included
if (typeof io !== 'undefined') {
    ws.connect();
} else {
    console.warn('Socket.io client not loaded. Real-time features disabled.');
}
