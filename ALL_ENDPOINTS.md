# Smart Services Platform - API Endpoints

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.smartservices.com/api
```

## Authentication
All endpoints (except auth) require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## 📋 Complete Endpoint List (21 Endpoints)

### **Authentication Endpoints (4)**

#### 1. Register User
```
POST /api/auth/register
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "User registered successfully"
}
```
**Databases Used:** MongoDB (user creation), Neo4j (user node), Redis (session)

---

#### 2. Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```
**Databases Used:** MongoDB (authentication), Redis (session storage with 1 hour TTL)

---

#### 3. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
**Databases Used:** Redis (session deletion)

---

#### 4. Verify Token
```
GET /api/auth/verify
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "john@example.com"
    }
  }
}
```
**Databases Used:** Redis (session verification)

---

### **User Endpoints (2)**

#### 5. Get User Profile
```
GET /api/users/profile
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```
**Databases Used:** MongoDB

---

#### 6. Get User Stats
```
GET /api/users/stats
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalDevices": 5,
    "totalServices": 3,
    "energySaved": 145.5,
    "costSavings": 89.75
  }
}
```
**Databases Used:** MongoDB (aggregation pipeline)

---

### **Device Endpoints (7)**

#### 7. Get All Devices
```
GET /api/devices
Headers: Authorization: Bearer {token}
Query Parameters:
  - status (optional): online, offline
  - type (optional): thermostat, light, camera, lock, sensor
  - page (optional): default 1
  - limit (optional): default 20
```
**Example:** `/api/devices?status=online&type=thermostat`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "deviceId": "thermostat_001",
      "name": "Living Room Thermostat",
      "type": "thermostat",
      "manufacturer": "Nest",
      "status": {
        "online": true,
        "lastSeen": "2024-12-04T10:45:00Z",
        "batteryLevel": 85
      },
      "lastDataPoint": {
        "timestamp": "2024-12-04T10:45:00Z",
        "values": {
          "temperature": 22.5,
          "humidity": 45
        }
      },
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      }
    }
  ]
}
```
**Databases Used:** MongoDB (primary), Redis (cached readings)

---

#### 8. Register Device
```
POST /api/devices/register
Headers: Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "deviceId": "thermostat_002",
  "name": "Bedroom Thermostat",
  "type": "thermostat",
  "manufacturer": "Nest",
  "model": "T-3000",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_002",
    "name": "Bedroom Thermostat",
    "status": "registered",
    "createdAt": "2024-12-04T11:00:00Z"
  },
  "message": "Device registered successfully"
}
```
**Databases Used:** MongoDB

---

#### 9. Get Device Details
```
GET /api/devices/:deviceId
Headers: Authorization: Bearer {token}
```
**Example:** `/api/devices/thermostat_001`

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_001",
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Living Room Thermostat",
    "type": "thermostat",
    "manufacturer": "Nest",
    "model": "T-3000",
    "status": {
      "online": true,
      "lastSeen": "2024-12-04T10:45:00Z",
      "batteryLevel": 85
    },
    "settings": {
      "targetTemperature": 22,
      "mode": "auto"
    },
    "lastDataPoint": {
      "temperature": 22.5,
      "humidity": 45
    },
    "createdAt": "2024-01-20T00:00:00Z"
  }
}
```
**Databases Used:** MongoDB

---

#### 10. Update Device
```
PUT /api/devices/:deviceId
Headers: Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "name": "Master Bedroom Thermostat",
  "settings": {
    "targetTemperature": 23,
    "mode": "cooling"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_001",
    "name": "Master Bedroom Thermostat",
    "updatedAt": "2024-12-04T11:15:00Z"
  },
  "message": "Device updated successfully"
}
```
**Databases Used:** MongoDB, Redis (cache invalidation)

---

#### 11. Delete Device
```
DELETE /api/devices/:deviceId
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```
**Databases Used:** MongoDB (deletion), Redis (cache invalidation)

---

#### 12. Post Device Readings ⭐ **POLYGLOT PERSISTENCE**
```
POST /api/devices/:deviceId/readings
Headers: Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "temperature": 22.5,
  "humidity": 45,
  "pressure": 1013.25,
  "timestamp": "2024-12-04T10:45:30Z"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_001",
    "readingsStored": 3,
    "timestamp": "2024-12-04T10:45:30Z"
  },
  "message": "Readings saved to 3 databases"
}
```
**Databases Used (Multi-Database Write):**
1. **MongoDB** - Updates `lastDataPoint` in device document
2. **Redis** - Caches latest reading with 5-minute TTL
3. **Cassandra** - Inserts time-series data for historical queries
4. **Socket.IO** - Emits real-time event to connected clients

**This endpoint demonstrates the core polyglot persistence concept!**

---

#### 13. Get Device History
```
GET /api/devices/:deviceId/history
Headers: Authorization: Bearer {token}
Query Parameters:
  - startDate (required): ISO 8601 date
  - endDate (required): ISO 8601 date
  - metric (optional): temperature, humidity, pressure
  - limit (optional): default 1000
```
**Example:** `/api/devices/thermostat_001/history?startDate=2024-12-01&endDate=2024-12-04&metric=temperature`

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_001",
    "metric": "temperature",
    "readings": [
      {
        "timestamp": "2024-12-04T10:45:00Z",
        "value": 22.5,
        "unit": "celsius"
      },
      {
        "timestamp": "2024-12-04T10:30:00Z",
        "value": 22.3,
        "unit": "celsius"
      }
    ],
    "count": 288,
    "aggregations": {
      "avg": 22.4,
      "min": 21.0,
      "max": 24.5
    }
  }
}
```
**Databases Used:** Cassandra (time-series queries optimized for date ranges)

---

### **Services Endpoints (4)**

#### 14. Search Services ⭐ **ELASTICSEARCH**
```
GET /api/services/search
Headers: Authorization: Bearer {token}
Query Parameters:
  - q (optional): Search query
  - category (optional): energy, security, automation, monitoring
  - minRating (optional): Minimum rating (0-5)
  - maxPrice (optional): Maximum price
  - page (optional): default 1
  - limit (optional): default 20
```
**Example:** `/api/services/search?q=energy monitor&category=energy&minRating=4`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Smart Energy Monitoring",
      "category": "energy",
      "description": "Real-time energy consumption tracking and analytics",
      "features": [
        "Real-time monitoring",
        "Cost analysis",
        "Usage predictions"
      ],
      "rating": 4.5,
      "pricing": {
        "model": "subscription",
        "amount": 9.99,
        "interval": "monthly"
      },
      "provider": {
        "name": "EcoTech Solutions",
        "website": "https://ecotech.example.com"
      },
      "totalSubscribers": 1247
    }
  ],
  "total": 6
}
```
**Databases Used:** 
- **Primary:** Elasticsearch (full-text search with fuzzy matching, custom analyzers)
- **Fallback:** MongoDB (if Elasticsearch fails)

---

#### 15. Get Service Details
```
GET /api/services/:serviceId
Headers: Authorization: Bearer {token}
```
**Example:** `/api/services/64a1b2c3d4e5f6g7h8i9j0k1`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Smart Energy Monitoring",
    "category": "energy",
    "description": "Real-time energy consumption tracking and analytics",
    "features": [
      "Real-time monitoring",
      "Cost analysis",
      "Usage predictions",
      "Mobile app",
      "API access"
    ],
    "rating": 4.5,
    "pricing": {
      "model": "subscription",
      "amount": 9.99,
      "interval": "monthly",
      "currency": "USD"
    },
    "provider": {
      "name": "EcoTech Solutions",
      "website": "https://ecotech.example.com",
      "support": "support@ecotech.example.com"
    },
    "compatibility": ["thermostat", "outlet", "sensor"],
    "support24x7": true,
    "apiAvailable": true,
    "dataRetention": "1 year",
    "totalSubscribers": 1247
  }
}
```
**Databases Used:** MongoDB

---

#### 16. Get Personalized Recommendations ⭐ **NEO4J GRAPH**
```
GET /api/services/recommendations/personalized
Headers: Authorization: Bearer {token}
Query Parameters:
  - limit (optional): default 10
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Smart Security System",
      "category": "security",
      "rating": 4.8,
      "pricing": {
        "model": "subscription",
        "amount": 14.99,
        "interval": "monthly"
      },
      "recommendationReason": "5 users with similar subscriptions also use this",
      "score": 5
    },
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Home Automation Hub",
      "category": "automation",
      "rating": 4.6,
      "pricing": {
        "model": "one-time",
        "amount": 199.99
      },
      "recommendationReason": "Recommended based on your energy service",
      "score": 3
    }
  ]
}
```
**Databases Used:**
- **Primary:** Neo4j (collaborative filtering via graph traversal)
- **Enrichment:** MongoDB (service details)

**Neo4j Query Logic:**
```cypher
MATCH (u:User {userId: $userId})-[:SUBSCRIBED_TO]->(s:Service)
MATCH (other:User)-[:SUBSCRIBED_TO]->(s)
MATCH (other)-[:SUBSCRIBED_TO]->(rec:Service)
WHERE NOT (u)-[:SUBSCRIBED_TO]->(rec)
RETURN rec, COUNT(*) as score
ORDER BY score DESC
LIMIT 10
```

---

#### 17. Subscribe to Service ⭐ **NEO4J RELATIONSHIP**
```
POST /api/services/:serviceId/subscribe
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to Smart Energy Monitoring",
  "data": {
    "serviceId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "serviceName": "Smart Energy Monitoring",
    "subscribedAt": "2024-12-04T11:30:00Z"
  }
}
```
**Databases Used:**
1. **Neo4j** - Creates `SUBSCRIBED_TO` relationship between User and Service nodes
2. **MongoDB** - Increments `totalSubscribers` count

**Neo4j Operation:**
```cypher
MATCH (u:User {userId: $userId})
MATCH (s:Service {serviceId: $serviceId})
CREATE (u)-[r:SUBSCRIBED_TO {subscribedAt: timestamp(), active: true}]->(s)
RETURN r
```

---

### **Analytics Endpoints (4)**

#### 18. Dashboard Stats
```
GET /api/analytics/dashboard/stats
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalDevices": 5,
    "activeDevices": 4,
    "energySaved": 145.5,
    "costSavings": 89.75,
    "totalServices": 3,
    "devicesBreakdown": {
      "thermostat": 2,
      "light": 1,
      "camera": 1,
      "lock": 1
    }
  }
}
```
**Databases Used:** MongoDB (aggregation pipeline with $group, $sum, $avg)

---

#### 19. Device Analytics
```
GET /api/analytics/devices/:deviceId
Headers: Authorization: Bearer {token}
Query Parameters:
  - metric: temperature, humidity, energy_usage
  - period: 1d, 7d, 30d, 90d
  - aggregation: avg, min, max, sum
```
**Example:** `/api/analytics/devices/thermostat_001?metric=temperature&period=7d&aggregation=avg`

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "thermostat_001",
    "metric": "temperature",
    "period": "7d",
    "aggregation": "avg",
    "summary": {
      "avg": 22.3,
      "min": 19.5,
      "max": 25.0,
      "trend": "stable"
    },
    "hourlyData": [
      { "hour": "2024-12-04T00:00:00Z", "value": 21.5 },
      { "hour": "2024-12-04T01:00:00Z", "value": 21.2 }
    ]
  }
}
```
**Databases Used:** Cassandra (time-series aggregations)

---

#### 20. Activity Logs
```
GET /api/analytics/activity
Headers: Authorization: Bearer {token}
Query Parameters:
  - limit (optional): default 50
  - type (optional): device_added, service_subscribed, reading_posted
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-12-04T11:30:00Z",
      "type": "service_subscribed",
      "message": "Subscribed to Smart Energy Monitoring",
      "metadata": {
        "serviceId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "serviceName": "Smart Energy Monitoring"
      }
    },
    {
      "timestamp": "2024-12-04T10:45:00Z",
      "type": "device_reading",
      "message": "Temperature reading from Living Room Thermostat",
      "metadata": {
        "deviceId": "thermostat_001",
        "temperature": 22.5
      }
    }
  ],
  "count": 50
}
```
**Databases Used:** Cassandra (device_logs table)

---

#### 21. Health Check
```
GET /api/health
(No authentication required)
```
**Response:**
```json
{
  "status": "OK",
  "message": "Smart Services Platform API",
  "version": "1.0.0",
  "databases": {
    "mongodb": "connected",
    "redis": "connected",
    "cassandra": "connected",
    "neo4j": "connected",
    "elasticsearch": "connected"
  },
  "timestamp": "2024-12-04T11:45:00Z"
}
```
**Databases Used:** All 5 databases (connection check)

---

## 🗄️ Database Usage Summary

### MongoDB (13 endpoints)
- User management (register, login, profile, stats)
- Device CRUD operations
- Service catalog
- Latest device readings

### Redis (4 endpoints)
- Session management (login, logout, verify)
- Device reading cache (5-minute TTL)
- Rate limiting (not shown in endpoints)

### Cassandra (4 endpoints)
- Time-series sensor data (readings history)
- Device analytics (aggregations)
- Activity logs

### Neo4j (2 endpoints)
- Personalized recommendations (graph traversal)
- Service subscriptions (relationship creation)

### Elasticsearch (1 endpoint)
- Full-text service search with fuzzy matching

---

## 🔐 Authentication

All endpoints except `/api/health` and `/api/auth/*` require authentication.

**Include JWT token in headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Getting a token:**
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use returned token in subsequent requests

---

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

- **Authenticated Users:** 1000 requests/15 minutes
- Applied per IP address
- Returns `429 Too Many Requests` when exceeded

---

## 📊 Polyglot Persistence Highlights

### Key Endpoints Demonstrating Multi-Database Architecture:

1. **POST /api/devices/:deviceId/readings**
   - Writes to MongoDB (latest), Redis (cache), Cassandra (historical)
   - Perfect example of using multiple databases for same data

2. **GET /api/services/search**
   - Primary: Elasticsearch (full-text search)
   - Fallback: MongoDB (basic search)
   - Demonstrates database failover strategy

3. **GET /api/services/recommendations/personalized**
   - Neo4j: Graph traversal for collaborative filtering
   - MongoDB: Service details enrichment
   - Shows combining graph + document databases

---

## 🔌 WebSocket Support

Connect to WebSocket for real-time updates:
```
ws://localhost:3000
```

Subscribe to device updates after connection:
```json
{
  "action": "subscribe",
  "deviceId": "thermostat_001"
}
```

Receive real-time readings:
```json
{
  "event": "reading",
  "deviceId": "thermostat_001",
  "data": {
    "temperature": 22.5,
    "humidity": 45,
    "timestamp": "2024-12-04T10:45:30Z"
  }
}
```

---

## 📝 Testing Endpoints

### Using curl:

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Devices:**
```bash
curl http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Post Reading:**
```bash
curl -X POST http://localhost:3000/api/devices/thermostat_001/readings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"temperature":22.5,"humidity":45}'
```

### Using Postman:
1. Import collection from `/docs/postman_collection.json`
2. Set `{{baseUrl}}` variable to `http://localhost:3000/api`
3. Set `{{token}}` variable after login

---

## 📄 Summary

**Total Endpoints: 21**
- Authentication: 4
- Users: 2
- Devices: 7
- Services: 4
- Analytics: 4

**Databases Used:**
- MongoDB (Document Store) - 13 endpoints
- Redis (Cache) - 4 endpoints
- Cassandra (Time-Series) - 4 endpoints
- Neo4j (Graph) - 2 endpoints
- Elasticsearch (Search) - 1 endpoint

**Key Features:**
✅ JWT Authentication
✅ Polyglot Persistence
✅ Real-time WebSocket
✅ Full-text Search
✅ Graph-based Recommendations
✅ Time-series Analytics
✅ Rate Limiting
✅ Error Handling

All endpoints follow REST principles with proper HTTP methods, status codes, and JSON responses.
