# API Endpoints Documentation

## Base URL
```
Production: https://api.smartservices.com/v1
Development: http://localhost:3000/v1
```

## Authentication
All endpoints (except auth) require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## 1. User Management API

### 1.1 Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "USR_12345",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "User registered successfully"
}
```

---

### 1.2 Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR_12345",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

**Redis Operation:**
```
SET session:abc123xyz '{userId, email, loginTime}' EX 3600
```

---

### 1.3 Get User Profile
**GET** `/users/me`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR_12345",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "avatar": "https://cdn.example.com/avatars/12345.jpg"
    },
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "coordinates": {
        "lat": 40.730610,
        "lng": -73.935242
      }
    },
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en-US"
    },
    "subscriptionTier": "premium",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**MongoDB Query:**
```javascript
db.users.findOne({ userId: "USR_12345" })
```

---

### 1.4 Update User Profile
**PATCH** `/users/me`

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "phone": "+1987654321"
  },
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR_12345",
    "updatedFields": ["profile.phone", "preferences.theme", "preferences.notifications"],
    "updatedAt": "2024-12-02T14:30:00Z"
  }
}
```

**MongoDB Update:**
```javascript
db.users.updateOne(
  { userId: "USR_12345" },
  { 
    $set: {
      "profile.firstName": "John",
      "profile.phone": "+1987654321",
      "preferences.theme": "light",
      "preferences.notifications": false,
      "updatedAt": new Date()
    }
  }
)
```

---

## 2. Device Management API

### 2.1 Register Device
**POST** `/devices`

**Request Body:**
```json
{
  "deviceType": "smart_thermostat",
  "manufacturer": "IoT Corp",
  "model": "T-3000",
  "metadata": {
    "name": "Living Room Thermostat",
    "room": "living_room"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "userId": "USR_12345",
    "deviceType": "smart_thermostat",
    "status": "pending_activation",
    "createdAt": "2024-12-02T10:00:00Z"
  }
}
```

**MongoDB Insert:**
```javascript
db.devices.insertOne({
  deviceId: "DEV_001",
  userId: "USR_12345",
  deviceType: "smart_thermostat",
  // ... other fields
})
```

---

### 2.2 Get All Devices
**GET** `/devices`

**Query Parameters:**
- `status` (optional): online, offline, pending_activation
- `deviceType` (optional): smart_thermostat, smart_lock, etc.
- `page` (optional): default 1
- `limit` (optional): default 20

**Example:** `/devices?status=online&deviceType=smart_thermostat&page=1&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceId": "DEV_001",
        "deviceType": "smart_thermostat",
        "status": "online",
        "metadata": {
          "name": "Living Room Thermostat",
          "room": "living_room"
        },
        "lastSeen": "2024-12-02T10:45:00Z",
        "lastDataPoint": {
          "temperature": 72.5,
          "humidity": 45
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalDevices": 25,
      "limit": 10
    }
  }
}
```

---

### 2.3 Get Device Details
**GET** `/devices/:deviceId`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "userId": "USR_12345",
    "deviceType": "smart_thermostat",
    "manufacturer": "IoT Corp",
    "model": "T-3000",
    "firmware": "v2.4.1",
    "status": "online",
    "metadata": {
      "name": "Living Room Thermostat",
      "room": "living_room",
      "installDate": "2024-01-20T00:00:00Z"
    },
    "configuration": {
      "sensorInterval": 30,
      "dataRetention": 90,
      "alertThresholds": {
        "temperature": { "min": 60, "max": 85 },
        "humidity": { "min": 30, "max": 70 }
      }
    },
    "lastSeen": "2024-12-02T10:45:00Z",
    "createdAt": "2024-01-20T00:00:00Z"
  }
}
```

---

### 2.4 Post Device Reading
**POST** `/devices/:deviceId/readings`

**Request Body:**
```json
{
  "readings": [
    {
      "type": "temperature",
      "value": 72.5,
      "unit": "fahrenheit"
    },
    {
      "type": "humidity",
      "value": 45,
      "unit": "percent"
    }
  ],
  "timestamp": "2024-12-02T10:45:30Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "readingsStored": 2,
    "timestamp": "2024-12-02T10:45:30Z"
  }
}
```

**Database Operations:**

1. **Cassandra** (Long-term storage):
```cql
INSERT INTO device_readings (device_id, date, timestamp, reading_type, value, unit)
VALUES ('DEV_001', '2024-12-02', now(), 'temperature', 72.5, 'fahrenheit');

INSERT INTO device_readings (device_id, date, timestamp, reading_type, value, unit)
VALUES ('DEV_001', '2024-12-02', now(), 'humidity', 45, 'percent');
```

2. **Redis** (Real-time cache):
```
SET device:realtime:DEV_001 '{"temperature":72.5,"humidity":45,"timestamp":"2024-12-02T10:45:30Z"}' EX 300
```

3. **MongoDB** (Latest reading in device doc):
```javascript
db.devices.updateOne(
  { deviceId: "DEV_001" },
  { 
    $set: {
      lastSeen: new Date(),
      lastDataPoint: {
        temperature: 72.5,
        humidity: 45,
        timestamp: new Date()
      }
    }
  }
)
```

---

### 2.5 Get Device Readings (Historical)
**GET** `/devices/:deviceId/readings`

**Query Parameters:**
- `startDate`: ISO 8601 date (required)
- `endDate`: ISO 8601 date (required)
- `readingType` (optional): temperature, humidity, etc.
- `limit` (optional): default 1000

**Example:** `/devices/DEV_001/readings?startDate=2024-12-01&endDate=2024-12-02&readingType=temperature&limit=500`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "readingType": "temperature",
    "readings": [
      {
        "timestamp": "2024-12-02T10:45:30Z",
        "value": 72.5,
        "unit": "fahrenheit",
        "qualityScore": 100
      },
      {
        "timestamp": "2024-12-02T10:45:00Z",
        "value": 72.3,
        "unit": "fahrenheit",
        "qualityScore": 100
      }
    ],
    "count": 2880,
    "aggregations": {
      "avg": 72.4,
      "min": 68.0,
      "max": 76.5
    }
  }
}
```

**Cassandra Query:**
```cql
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' 
  AND date IN ('2024-12-01', '2024-12-02')
  AND timestamp >= minTimeuuid('2024-12-01 00:00:00')
  AND timestamp <= maxTimeuuid('2024-12-02 23:59:59')
  AND reading_type = 'temperature'
ORDER BY timestamp DESC
LIMIT 500;
```

---

## 3. Services API

### 3.1 Search Services
**GET** `/services/search`

**Query Parameters:**
- `q`: Search query (required)
- `category` (optional): Filter by category
- `minRating` (optional): Minimum rating (0-5)
- `maxPrice` (optional): Maximum price
- `lat`, `lng`, `radius` (optional): Location-based search
- `page`: Page number (default 1)
- `limit`: Results per page (default 20)

**Example:** `/services/search?q=smart home cleaning&category=home_services&minRating=4.0&page=1&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "serviceId": "SRV_CLEAN_001",
        "serviceName": "Smart Home Cleaning",
        "category": "home_services",
        "description": "AI-powered cleaning service with automated scheduling",
        "provider": {
          "companyName": "CleanTech Solutions",
          "rating": 4.8,
          "verified": true
        },
        "pricing": {
          "basePrice": 89.99,
          "currency": "USD"
        },
        "rating": 4.8,
        "tags": ["cleaning", "home", "recurring"],
        "relevanceScore": 0.95
      }
    ],
    "aggregations": {
      "categories": [
        { "name": "home_services", "count": 145 },
        { "name": "automation", "count": 89 }
      ],
      "priceRanges": [
        { "range": "0-50", "count": 23 },
        { "range": "50-100", "count": 67 },
        { "range": "100+", "count": 55 }
      ]
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalResults": 145
    }
  }
}
```

**Elasticsearch Query:**
```json
GET /services_search/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "smart home cleaning",
            "fields": ["serviceName^3", "description", "tags^2"]
          }
        }
      ],
      "filter": [
        { "term": { "category": "home_services" } },
        { "range": { "rating": { "gte": 4.0 } } }
      ]
    }
  }
}
```

---

### 3.2 Get Service Details
**GET** `/services/:serviceId`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceId": "SRV_CLEAN_001",
    "serviceName": "Smart Home Cleaning",
    "category": "home_services",
    "description": "AI-powered cleaning service with automated scheduling based on your home's sensor data",
    "provider": {
      "companyId": "COMP_789",
      "companyName": "CleanTech Solutions",
      "rating": 4.8,
      "verified": true,
      "yearsInBusiness": 5
    },
    "pricing": {
      "basePrice": 89.99,
      "currency": "USD",
      "pricingModel": "per_session",
      "discounts": [
        { "type": "subscription", "percentage": 15 },
        { "type": "bulk", "sessions": 10, "percentage": 20 }
      ]
    },
    "availability": {
      "timezone": "America/New_York",
      "workingHours": {
        "monday": { "start": "08:00", "end": "18:00" },
        "tuesday": { "start": "08:00", "end": "18:00" }
      }
    },
    "features": ["AI scheduling", "Eco-friendly", "Same-day service"],
    "rating": 4.8,
    "totalReviews": 1247,
    "tags": ["cleaning", "home", "recurring"]
  }
}
```

---

### 3.3 Get Service Recommendations
**GET** `/services/recommendations`

**Query Parameters:**
- `userId`: User ID (from auth token)
- `limit` (optional): Number of recommendations (default 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "serviceId": "SRV_CLEAN_002",
        "serviceName": "Smart Window Cleaning",
        "category": "home_services",
        "rating": 4.7,
        "pricing": {
          "basePrice": 59.99,
          "currency": "USD"
        },
        "recommendationReason": "3 friends use this service",
        "score": 0.92
      },
      {
        "serviceId": "SRV_GARDEN_001",
        "serviceName": "Automated Garden Care",
        "category": "home_services",
        "rating": 4.9,
        "pricing": {
          "basePrice": 129.99,
          "currency": "USD"
        },
        "recommendationReason": "Popular with users like you",
        "score": 0.88
      }
    ],
    "strategies": ["collaborative_filtering", "friend_based", "content_based"]
  }
}
```

**Neo4j Query:**
```cypher
// Friend-based recommendations
MATCH (me:User {userId: 'USR_12345'})
      -[:FOLLOWS]->(friend:User)
      -[:SUBSCRIBED_TO]->(service:Service)
WHERE NOT (me)-[:SUBSCRIBED_TO]->(service)
RETURN service, COUNT(friend) as friendCount
ORDER BY friendCount DESC
LIMIT 10
```

---

## 4. Analytics API

### 4.1 Get Device Analytics
**GET** `/analytics/devices/:deviceId`

**Query Parameters:**
- `metric`: temperature, humidity, energy_usage
- `aggregation`: avg, min, max, sum
- `interval`: hour, day, week, month
- `startDate`, `endDate`: ISO 8601 dates

**Example:** `/analytics/devices/DEV_001?metric=temperature&aggregation=avg&interval=hour&startDate=2024-12-01&endDate=2024-12-02`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deviceId": "DEV_001",
    "metric": "temperature",
    "aggregation": "avg",
    "interval": "hour",
    "dataPoints": [
      {
        "timestamp": "2024-12-01T00:00:00Z",
        "value": 68.5
      },
      {
        "timestamp": "2024-12-01T01:00:00Z",
        "value": 68.2
      },
      {
        "timestamp": "2024-12-01T02:00:00Z",
        "value": 67.9
      }
    ],
    "summary": {
      "avg": 71.4,
      "min": 67.9,
      "max": 76.5,
      "trend": "increasing"
    }
  }
}
```

---

### 4.2 Get User Dashboard Stats
**GET** `/analytics/dashboard`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR_12345",
    "devices": {
      "total": 5,
      "online": 4,
      "offline": 1
    },
    "services": {
      "active": 3,
      "totalSpent": 487.50,
      "currency": "USD"
    },
    "energy": {
      "savings": 245.8,
      "rank": 142,
      "percentile": 85
    },
    "recentActivity": [
      {
        "type": "device_alert",
        "message": "Temperature threshold exceeded in Living Room",
        "timestamp": "2024-12-02T10:30:00Z"
      }
    ]
  }
}
```

---

## 5. System Logs API (Admin)

### 5.1 Query Logs
**GET** `/admin/logs`

**Query Parameters:**
- `severity`: DEBUG, INFO, WARN, ERROR
- `service`: user-service, device-service, etc.
- `startTime`, `endTime`: ISO 8601
- `userId` (optional): Filter by user
- `limit`: Default 100

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "LOG_123456",
        "timestamp": "2024-12-02T10:45:30Z",
        "severity": "ERROR",
        "service": "device-service",
        "message": "Failed to connect to device DEV_001",
        "userId": "USR_12345",
        "deviceId": "DEV_001",
        "errorDetails": "Connection timeout after 30s",
        "tags": ["connection", "timeout"]
      }
    ],
    "count": 1
  }
}
```

**Cassandra Query:**
```cql
SELECT * FROM system_logs 
WHERE service_name = 'device-service' 
  AND hour_bucket = '2024-12-02-10'
  AND severity = 'ERROR'
ORDER BY log_id DESC
LIMIT 100;
```

---

## 6. Rate Limiting

All endpoints are rate-limited:
- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Premium**: 5000 requests/hour

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 3600
  }
}
```

---

## 7. Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Device with ID DEV_999 not found",
    "details": {}
  }
}
```

### Common Error Codes
- `400` - BAD_REQUEST
- `401` - UNAUTHORIZED
- `403` - FORBIDDEN
- `404` - RESOURCE_NOT_FOUND
- `409` - CONFLICT
- `429` - RATE_LIMIT_EXCEEDED
- `500` - INTERNAL_SERVER_ERROR
- `503` - SERVICE_UNAVAILABLE

---

## 8. WebSocket API (Real-Time)

### Connection
```javascript
ws://localhost:3000/ws?token=<jwt_token>
```

### Subscribe to Device Updates
```json
{
  "action": "subscribe",
  "channel": "device:DEV_001"
}
```

**Server Push:**
```json
{
  "channel": "device:DEV_001",
  "event": "reading_update",
  "data": {
    "temperature": 72.5,
    "humidity": 45,
    "timestamp": "2024-12-02T10:45:30Z"
  }
}
```

---

## Summary

This API provides:
- ✅ User authentication and profile management
- ✅ Device registration and real-time data ingestion
- ✅ Service search with full-text capabilities
- ✅ Recommendation engine integration
- ✅ Analytics and aggregation endpoints
- ✅ System logging and monitoring
- ✅ Rate limiting and security
- ✅ WebSocket support for real-time updates

All endpoints follow REST principles with proper HTTP status codes, pagination, and error handling.
