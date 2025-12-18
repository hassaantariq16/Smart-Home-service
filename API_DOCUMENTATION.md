# 📚 API Documentation

## Base URL
```
http://localhost:3000/api
```

All endpoints require `Content-Type: application/json` header.

---

## 🔐 Authentication

### Register
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "stats": {
        "totalDevices": 5,
        "totalServices": 3,
        "energySaved": 1250.5,
        "costSavings": 350.25
      }
    }
  }
}
```

---

### Logout
**POST** `/auth/logout`

Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Verify Token
**GET** `/auth/verify`

Verify if token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

---

## 👤 Users

### Get Profile
**GET** `/users/profile`

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "profile": {
      "avatar": "https://...",
      "bio": "Smart home enthusiast",
      "preferences": {
        "notifications": true,
        "theme": "dark",
        "language": "en"
      }
    },
    "subscription": {
      "plan": "premium",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2026-01-01T00:00:00.000Z",
      "autoRenew": true
    },
    "stats": {
      "totalDevices": 5,
      "totalServices": 3,
      "energySaved": 1250.5,
      "costSavings": 350.25
    }
  }
}
```

---

### Update Profile
**PUT** `/users/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "phone": "+1987654321",
  "profile": {
    "bio": "Updated bio",
    "preferences": {
      "theme": "light"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* Updated user object */ }
}
```

---

### Get User Stats
**GET** `/users/stats`

Get user statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDevices": 5,
    "totalServices": 3,
    "energySaved": 1250.5,
    "costSavings": 350.25
  }
}
```

---

## 💡 Devices

### Get All Devices
**GET** `/devices`

Get all devices for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "deviceId": "DEV_001",
      "userId": "507f1f77bcf86cd799439011",
      "name": "Living Room Thermostat",
      "type": "thermostat",
      "manufacturer": "Nest",
      "model": "Learning Thermostat 3rd Gen",
      "location": {
        "room": "Living Room",
        "floor": "1st Floor"
      },
      "status": {
        "online": true,
        "battery": 95,
        "signalStrength": 85,
        "lastSeen": "2025-12-17T10:30:00.000Z"
      }
    }
  ]
}
```

---

### Register Device
**POST** `/devices/register`

Register a new device.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "deviceId": "DEV_002",
  "name": "Bedroom Light",
  "type": "light",
  "manufacturer": "Philips",
  "model": "Hue White",
  "location": {
    "room": "Bedroom",
    "floor": "2nd Floor"
  }
}
```

**Validation:**
- `deviceId`: Required, alphanumeric, 3-50 chars
- `name`: Required, 2-100 chars
- `type`: Required, one of: thermostat, light, camera, lock, sensor, speaker, outlet, other

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": { /* Device object */ }
}
```

---

### Get Device Details
**GET** `/devices/:deviceId`

Get detailed information about a specific device.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Device object with real-time data from Redis */
    "realtime": {
      "status": "online",
      "values": "{\"temperature\":22.5}",
      "timestamp": "2025-12-17T10:30:00.000Z"
    }
  }
}
```

---

### Post Device Reading
**POST** `/devices/:deviceId/readings`

Submit sensor data from a device.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "values": {
    "temperature": 22.5,
    "humidity": 45.2,
    "power": 350.5
  }
}
```

**Validation:**
- `temperature`: -50 to 100
- `humidity`: 0 to 100
- `power`: >= 0

**Response:**
```json
{
  "success": true,
  "message": "Reading recorded successfully",
  "data": {
    "deviceId": "DEV_001",
    "timestamp": "2025-12-17T10:30:00.000Z",
    "values": { /* reading values */ }
  }
}
```

**Note:** This endpoint:
1. Updates MongoDB (latest reading)
2. Updates Redis (real-time cache)
3. Stores in Cassandra (historical time-series)
4. Emits WebSocket event for real-time UI updates

---

## 🛍️ Services

### Search Services
**GET** `/services/search`

Search for services with full-text search and filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string): Search query
- `category` (string): automation, security, energy, entertainment, health, other
- `minRating` (number): Minimum rating (0-5)
- `maxPrice` (number): Maximum price
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)

**Example:**
```
GET /api/services/search?q=energy&category=energy&minRating=4&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "page": 1,
  "data": [
    {
      "serviceId": "SRV_001",
      "name": "Smart Energy Monitor",
      "description": "Real-time energy monitoring and optimization",
      "category": "energy",
      "pricing": {
        "model": "subscription",
        "amount": 9.99,
        "currency": "USD",
        "billingCycle": "monthly"
      },
      "rating": {
        "average": 4.5,
        "count": 235
      },
      "features": ["Real-time tracking", "AI predictions", "Cost alerts"]
    }
  ]
}
```

---

### Get Service Details
**GET** `/services/:serviceId`

Get detailed information about a specific service.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* Full service object */ }
}
```

---

### Get Personalized Recommendations
**GET** `/services/recommendations/personalized`

Get service recommendations based on user behavior and graph relationships.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "algorithm": "collaborative-filtering",
  "data": [ /* Recommended services */ ]
}
```

**Note:** Uses Neo4j collaborative filtering algorithm to find services that similar users have subscribed to.

---

### Subscribe to Service
**POST** `/services/:serviceId/subscribe`

Subscribe to a service.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed to service successfully",
  "data": { /* Service object */ }
}
```

**Note:** Creates a relationship in Neo4j graph database for recommendation engine.

---

### Get Service Categories
**GET** `/services/categories/list`

Get all available service categories with counts.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "automation", "count": 45 },
    { "name": "security", "count": 32 },
    { "name": "energy", "count": 28 }
  ]
}
```

---

## 📊 Analytics

### Get Device Analytics
**GET** `/analytics/devices/:deviceId`

Get analytics and historical data for a device.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (string): 24h, 7d, 30d (default: 24h)

**Example:**
```
GET /api/analytics/devices/DEV_001?period=7d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "period": "7d",
    "totalReadings": 1440,
    "temperature": {
      "avg": 22.3,
      "min": 18.5,
      "max": 25.7,
      "current": 22.5
    },
    "humidity": {
      "avg": 45.2,
      "min": 35.0,
      "max": 60.0,
      "current": 45.2
    },
    "powerConsumption": {
      "total": 2450.5,
      "avg": 350.2,
      "peak": 520.0
    },
    "timeline": [
      {
        "timestamp": "2025-12-17T10:30:00.000Z",
        "temperature": 22.5,
        "humidity": 45.2,
        "power": 350.5
      }
    ]
  }
}
```

**Note:** Queries Cassandra time-series database for historical data.

---

### Get Dashboard Stats
**GET** `/analytics/dashboard/stats`

Get overall dashboard statistics for the user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDevices": 5,
    "activeDevices": 4,
    "totalServices": 3,
    "energySaved": 1250.5,
    "costSavings": 350.25
  }
}
```

---

### Get Recent Activity
**GET** `/analytics/activity/recent`

Get recent system activity logs.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number): Number of activities (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [ /* Recent activity logs from Cassandra */ ]
}
```

---

## ❌ Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (development mode only)"
}
```

---

## 🔌 WebSocket Events

Connect to WebSocket at `ws://localhost:3000`

### Subscribe to Device Updates
```javascript
socket.emit('subscribe:device', 'DEV_001');
```

### Receive Real-time Reading Updates
```javascript
socket.on('reading', (data) => {
  console.log(data);
  // { deviceId, timestamp, values }
});
```

### Unsubscribe from Device
```javascript
socket.emit('unsubscribe:device', 'DEV_001');
```

---

## 🗄️ Database Usage

This API uses **5 NoSQL databases**:

| Database | Purpose | Endpoints |
|----------|---------|-----------|
| **MongoDB** | User profiles, devices, services | All CRUD operations |
| **Redis** | Sessions, real-time device cache | Authentication, device status |
| **Cassandra** | Time-series IoT data, logs | Device readings, analytics |
| **Neo4j** | User-service relationships | Service recommendations |
| **Elasticsearch** | Full-text search | Service search with filters |

---

## 🔒 Security

- All endpoints (except health check) require authentication
- JWT tokens expire after 24 hours
- Rate limiting: 100 requests per 15 minutes per IP
- Input validation on all POST/PUT requests
- CORS enabled for web clients
- Helmet.js security headers

---

## 📝 Notes

1. **Authentication**: Include `Authorization: Bearer <token>` header in all authenticated requests
2. **Validation**: All input is validated using Joi schemas
3. **Real-time**: Device readings trigger WebSocket events for connected clients
4. **Caching**: Redis caches real-time device data (5-minute TTL)
5. **Time-series**: Cassandra stores all historical device readings
6. **Recommendations**: Neo4j graph algorithms power collaborative filtering

---

## 🧪 Demo Credentials

```
Email: john@example.com
Password: password123
```

Run `npm run seed` to populate sample data.
