# Smart Services Platform - Interim Evaluation Documentation
**Advanced Database Systems - December 2025**

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Interface Screenshots](#interface-screenshots)
3. [Schema Design](#schema-design)
4. [API Endpoints](#api-endpoints)
5. [NoSQL Database Selection Justification](#nosql-database-selection-justification)
6. [Polyglot Persistence Implementation](#polyglot-persistence-implementation)
7. [CAP Theorem Analysis](#cap-theorem-analysis)
8. [Technical Architecture](#technical-architecture)

---

## 🎯 Project Overview

**Project Name:** Smart Services Platform - IoT Management & Service Marketplace

**Description:** 
A comprehensive IoT platform that demonstrates polyglot persistence by using 5 different NoSQL databases, each optimized for specific data types and access patterns. The platform manages IoT devices, provides real-time monitoring, and offers a service marketplace with intelligent recommendations.

**Key Features:**
- User authentication with JWT tokens
- Real-time IoT device monitoring
- Time-series sensor data analytics
- Full-text service search
- Graph-based personalized recommendations
- Multi-database writes for device readings

**Technology Stack:**
- **Backend:** Node.js + Express.js
- **Databases:** MongoDB, Redis, Cassandra, Neo4j, Elasticsearch
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Infrastructure:** Docker Compose
- **Real-time:** Socket.IO (WebSockets)

---

## 🖥️ Interface Screenshots

### 1. Login Page
**URL:** `http://localhost:8081/login.html`

**Features:**
- Modern animated design with particle effects
- JWT token-based authentication
- Glassmorphism UI effects
- Auto-fill demo credentials
- Loading states and error handling

**Demo Credentials:**
- Email: `john@example.com`
- Password: `password123`

**API Call:**
```javascript
POST /api/auth/login
Body: { email, password }
Response: { token, user }
```

---

### 2. Dashboard Page
**URL:** `http://localhost:8081/dashboard.html`

**Features:**
- Real-time device statistics
- Energy consumption tracking
- Cost savings analysis
- Device list with status indicators
- Auto-refresh every 30 seconds
- Temperature and humidity readings

**Data Sources:**
- **MongoDB:** Device metadata, user stats
- **Redis:** Cached device readings
- **Cassandra:** Historical sensor data

**API Calls:**
```javascript
GET /api/analytics/dashboard/stats    // MongoDB aggregation
GET /api/devices                       // MongoDB + Redis cache
```

---

### 3. Services Marketplace
**URL:** `http://localhost:8081/services.html`

**Features:**
- Elasticsearch-powered full-text search
- Category filters (Energy, Security, Automation, Monitoring)
- Neo4j personalized recommendations
- Service subscription (creates graph relationships)
- Rating stars and pricing display
- Feature tags

**Data Sources:**
- **Elasticsearch:** Full-text search with fuzzy matching
- **Neo4j:** Collaborative filtering recommendations
- **MongoDB:** Service details fallback

**API Calls:**
```javascript
GET /api/services/search?q=energy                    // Elasticsearch
GET /api/services/recommendations/personalized       // Neo4j
POST /api/services/:id/subscribe                     // Neo4j relationship
```

---

## 📊 Schema Design

### 1. MongoDB (Document Store)

**Database:** `smart_platform`

#### **Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  createdAt: Date,
  profile: {
    phone: String,
    address: String,
    preferences: {
      notifications: Boolean,
      theme: String
    }
  }
}
```

**Indexes:**
- `email` (unique)
- `createdAt`

**Why MongoDB?**
- Flexible schema for user profiles
- Nested objects for user preferences
- Fast document retrieval by email

---

#### **Devices Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  deviceId: String (unique, indexed),
  name: String,
  type: String (enum: thermostat, light, camera, lock, sensor),
  manufacturer: String,
  model: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]  // 2dsphere index
  },
  status: {
    online: Boolean,
    lastSeen: Date,
    batteryLevel: Number
  },
  settings: Object (flexible),
  lastDataPoint: {
    timestamp: Date,
    values: Object
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (for user's device queries)
- `deviceId` (unique)
- `location` (2dsphere for geospatial queries)
- `status.lastSeen`

**Why MongoDB?**
- IoT devices have varying attributes (flexible schema)
- Geospatial indexing for location-based queries
- Fast updates for device status

---

#### **Services Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  category: String (indexed),
  description: String,
  features: [String],
  pricing: {
    model: String (enum: free, freemium, subscription, one-time),
    amount: Number,
    interval: String (monthly, yearly),
    currency: String
  },
  rating: Number (indexed),
  totalSubscribers: Number,
  provider: {
    name: String,
    website: String,
    support: String
  },
  compatibility: [String],
  support24x7: Boolean,
  apiAvailable: Boolean,
  dataRetention: String,
  createdAt: Date
}
```

**Indexes:**
- `category`
- `rating` (for sorting)
- Text index on `name`, `description`, `features` (for search fallback)

**Why MongoDB?**
- Service attributes vary by category
- Complex nested pricing models
- Fast category filtering

---

### 2. Redis (In-Memory Cache)

**Key Patterns:**

#### **Session Storage**
```
Key: session:{userId}
Value: JSON {
  userId: string,
  token: string,
  loginTime: timestamp,
  lastActivity: timestamp
}
TTL: 3600 seconds (1 hour)
```

#### **Device Cache**
```
Key: device:{deviceId}:latest
Value: JSON {
  temperature: number,
  humidity: number,
  timestamp: timestamp
}
TTL: 300 seconds (5 minutes)
```

#### **Rate Limiting**
```
Key: ratelimit:{ip}:{endpoint}
Value: count
TTL: 900 seconds (15 minutes)
```

**Why Redis?**
- Ultra-fast in-memory access (< 1ms)
- TTL for automatic expiration
- Reduces MongoDB query load
- Perfect for session management

---

### 3. Cassandra (Time-Series Store)

**Keyspace:** `smart_platform`

#### **sensor_data Table**
```sql
CREATE TABLE sensor_data (
    device_id TEXT,
    date DATE,
    timestamp TIMESTAMP,
    temperature DECIMAL,
    humidity DECIMAL,
    pressure DECIMAL,
    air_quality INT,
    PRIMARY KEY ((device_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

**Partition Key:** `(device_id, date)` - Distributes data across nodes
**Clustering Key:** `timestamp DESC` - Sorts within partition for time-range queries

**Query Pattern:**
```sql
SELECT * FROM sensor_data 
WHERE device_id = 'thermostat_001' 
  AND date = '2025-12-04'
  AND timestamp >= '2025-12-04 00:00:00'
  AND timestamp <= '2025-12-04 23:59:59';
```

---

#### **energy_consumption Table**
```sql
CREATE TABLE energy_consumption (
    device_id TEXT,
    date DATE,
    timestamp TIMESTAMP,
    energy_consumed DECIMAL,
    power_watts DECIMAL,
    voltage DECIMAL,
    cost DECIMAL,
    PRIMARY KEY ((device_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

---

#### **device_logs Table**
```sql
CREATE TABLE device_logs (
    device_id TEXT,
    date DATE,
    timestamp TIMESTAMP,
    event_type TEXT,
    message TEXT,
    severity TEXT,
    PRIMARY KEY ((device_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

**Why Cassandra?**
- Optimized for time-series writes (millions of sensor readings/day)
- Partition by device + date for efficient queries
- Linear scalability (add more nodes for more devices)
- No joins needed for time-series data

---

### 4. Neo4j (Graph Database)

**Node Types:**

#### **User Node**
```cypher
CREATE (u:User {
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
    createdAt: timestamp
})
```

#### **Service Node**
```cypher
CREATE (s:Service {
    serviceId: string,
    name: string,
    category: string,
    rating: float,
    pricing: float
})
```

**Relationship Type:**

#### **SUBSCRIBED_TO Relationship**
```cypher
CREATE (u:User)-[r:SUBSCRIBED_TO {
    subscribedAt: timestamp,
    plan: string,
    active: boolean
}]->(s:Service)
```

**Example Graph:**
```
(User:John)-[:SUBSCRIBED_TO]->(Service:Energy Monitoring)
(User:Jane)-[:SUBSCRIBED_TO]->(Service:Energy Monitoring)
(User:Jane)-[:SUBSCRIBED_TO]->(Service:Security System)
```

**Collaborative Filtering Query:**
```cypher
MATCH (u:User {userId: $userId})-[:SUBSCRIBED_TO]->(s:Service)
MATCH (other:User)-[:SUBSCRIBED_TO]->(s)
MATCH (other)-[:SUBSCRIBED_TO]->(rec:Service)
WHERE NOT (u)-[:SUBSCRIBED_TO]->(rec)
RETURN rec, COUNT(*) as score
ORDER BY score DESC
LIMIT 10
```

**Why Neo4j?**
- Natural representation of user-service relationships
- Efficient graph traversal for recommendations
- Complex relationship queries (friends of friends)
- Collaborative filtering in one Cypher query

---

### 5. Elasticsearch (Search Engine)

**Index:** `services`

#### **Mapping**
```json
{
  "mappings": {
    "properties": {
      "serviceId": { "type": "keyword" },
      "name": { 
        "type": "text",
        "analyzer": "custom_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "category": { "type": "keyword" },
      "description": { 
        "type": "text",
        "analyzer": "custom_analyzer"
      },
      "features": { 
        "type": "text",
        "analyzer": "custom_analyzer"
      },
      "rating": { "type": "float" },
      "pricing": {
        "properties": {
          "amount": { "type": "float" },
          "model": { "type": "keyword" }
        }
      }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "stop", "snowball"]
        }
      }
    }
  }
}
```

**Search Query:**
```json
{
  "query": {
    "multi_match": {
      "query": "energy monitor",
      "fields": ["name^3", "description^2", "features"],
      "fuzziness": "AUTO",
      "type": "best_fields"
    }
  }
}
```

**Why Elasticsearch?**
- Full-text search with fuzzy matching
- Typo tolerance (fuzziness)
- Custom analyzers (stemming, stop words)
- Fast search across millions of services

---

## 🔌 API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/auth/register
Headers: Content-Type: application/json
Body: {
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
Response: {
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": { ... }
  }
}
Databases: MongoDB (user creation), Neo4j (user node)
```

#### 2. Login
```
POST /api/auth/login
Body: { "email": "john@example.com", "password": "password123" }
Response: { "success": true, "data": { "token": "...", "user": {...} } }
Databases: MongoDB (user lookup), Redis (session storage)
```

#### 3. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer {token}
Response: { "success": true, "message": "Logged out successfully" }
Databases: Redis (session deletion)
```

#### 4. Verify Token
```
GET /api/auth/verify
Headers: Authorization: Bearer {token}
Response: { "success": true, "data": { "user": {...} } }
Databases: Redis (session check)
```

---

### User Endpoints

#### 5. Get User Profile
```
GET /api/users/profile
Headers: Authorization: Bearer {token}
Response: { "success": true, "data": { "user": {...} } }
Databases: MongoDB
```

#### 6. Get User Stats
```
GET /api/users/stats
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "data": {
    "totalDevices": 5,
    "totalServices": 3,
    "energySaved": 145.5,
    "costSavings": 89.75
  }
}
Databases: MongoDB (aggregation)
```

---

### Device Endpoints

#### 7. Get All Devices
```
GET /api/devices
Headers: Authorization: Bearer {token}
Response: { "success": true, "data": [ {device1}, {device2}, ... ] }
Databases: MongoDB (primary), Redis (cache check)
```

#### 8. Register Device
```
POST /api/devices/register
Body: {
  "deviceId": "thermostat_001",
  "name": "Living Room Thermostat",
  "type": "thermostat",
  "manufacturer": "Nest",
  "location": { "type": "Point", "coordinates": [-122.4194, 37.7749] }
}
Response: { "success": true, "data": { "device": {...} } }
Databases: MongoDB (device creation)
```

#### 9. Post Device Readings ⭐ **POLYGLOT PERSISTENCE**
```
POST /api/devices/:deviceId/readings
Body: {
  "temperature": 22.5,
  "humidity": 45,
  "pressure": 1013.25,
  "timestamp": "2025-12-04T10:30:00Z"
}
Response: { "success": true, "message": "Reading saved" }
Databases: 
  1. MongoDB - Update lastDataPoint
  2. Redis - Cache latest reading (5 min TTL)
  3. Cassandra - Insert time-series data
  4. Socket.IO - Emit real-time event
```

#### 10. Get Device History
```
GET /api/devices/:deviceId/history?startDate=2025-12-01&endDate=2025-12-04
Response: { "success": true, "data": [ {reading1}, {reading2}, ... ] }
Databases: Cassandra (time-series query)
```

#### 11. Get Device Details
```
GET /api/devices/:deviceId
Response: { "success": true, "data": { "device": {...} } }
Databases: MongoDB
```

#### 12. Update Device
```
PUT /api/devices/:deviceId
Body: { "name": "New Name", "settings": {...} }
Response: { "success": true, "data": { "device": {...} } }
Databases: MongoDB, Redis (invalidate cache)
```

#### 13. Delete Device
```
DELETE /api/devices/:deviceId
Response: { "success": true, "message": "Device deleted" }
Databases: MongoDB (delete), Redis (invalidate cache)
```

---

### Services Endpoints

#### 14. Search Services ⭐ **ELASTICSEARCH**
```
GET /api/services/search?q=energy&category=energy&minRating=4
Response: {
  "success": true,
  "data": [ {service1}, {service2}, ... ],
  "total": 5
}
Databases: 
  1. Elasticsearch (primary search with fuzzy matching)
  2. MongoDB (fallback if Elasticsearch fails)
```

#### 15. Get Service Details
```
GET /api/services/:serviceId
Response: { "success": true, "data": { "service": {...} } }
Databases: MongoDB
```

#### 16. Get Personalized Recommendations ⭐ **NEO4J GRAPH**
```
GET /api/services/recommendations/personalized
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "data": [
    { "service": {...}, "score": 5 },
    { "service": {...}, "score": 3 }
  ]
}
Databases: 
  1. Neo4j (collaborative filtering query)
  2. MongoDB (service details enrichment)
```

#### 17. Subscribe to Service ⭐ **NEO4J RELATIONSHIP**
```
POST /api/services/:serviceId/subscribe
Headers: Authorization: Bearer {token}
Response: { "success": true, "message": "Subscribed successfully" }
Databases: 
  1. Neo4j (create SUBSCRIBED_TO relationship)
  2. MongoDB (increment totalSubscribers)
```

---

### Analytics Endpoints

#### 18. Dashboard Stats
```
GET /api/analytics/dashboard/stats
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "data": {
    "totalDevices": 5,
    "activeDevices": 4,
    "energySaved": 145.5,
    "costSavings": 89.75
  }
}
Databases: MongoDB (aggregation pipeline)
```

#### 19. Device Analytics
```
GET /api/analytics/devices/:deviceId?period=7d
Response: {
  "success": true,
  "data": {
    "averageTemperature": 22.3,
    "averageHumidity": 44.5,
    "totalReadings": 10080,
    "hourlyData": [ ... ]
  }
}
Databases: Cassandra (time-series aggregation)
```

#### 20. Activity Logs
```
GET /api/analytics/activity?limit=50
Headers: Authorization: Bearer {token}
Response: {
  "success": true,
  "data": [
    { "type": "device_added", "timestamp": "...", "message": "..." },
    { "type": "service_subscribed", "timestamp": "...", "message": "..." }
  ]
}
Databases: Cassandra (device_logs table)
```

#### 21. Health Check
```
GET /api/health
Response: {
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
  "timestamp": "2025-12-04T10:30:00Z"
}
```

---

## 🎯 NoSQL Database Selection Justification

### Why 5 Different NoSQL Databases?

Our platform demonstrates **Polyglot Persistence** - using multiple specialized databases instead of forcing one database to handle all data types.

---

### 1. MongoDB (Document Store) - CP

**Use Case:** User profiles, Device metadata, Service catalog

**Chosen Because:**
- ✅ **Flexible Schema:** IoT devices have varying attributes (thermostat has temperature settings, camera has resolution settings)
- ✅ **Rich Queries:** Complex filtering on nested objects (device.status.online, user.profile.preferences)
- ✅ **Geospatial Indexes:** 2dsphere index for location-based device queries
- ✅ **Aggregation Pipeline:** Dashboard statistics with complex grouping
- ✅ **JSON-like Documents:** Natural fit for JavaScript/Node.js stack

**Why Not SQL?**
- Device schemas vary by type (rigid schema would require many NULL columns)
- Frequent schema changes as new device types are added
- No complex joins needed for user/device data

**CAP:** CP (Consistency + Partition Tolerance)

---

### 2. Redis (In-Memory Cache) - CP

**Use Case:** Session storage, Device reading cache, Rate limiting

**Chosen Because:**
- ✅ **Ultra-Fast:** < 1ms response time for session checks
- ✅ **TTL Support:** Automatic expiration for sessions (1 hour), cache (5 min)
- ✅ **Reduces Load:** Caches latest device readings to reduce MongoDB queries
- ✅ **Simple Data Structures:** Key-value perfect for session tokens
- ✅ **Rate Limiting:** Atomic INCR operations for API throttling

**Why Not Memcached?**
- Need TTL support
- Need data persistence option
- Need pub/sub for real-time features

**CAP:** CP (Consistency + Partition Tolerance)

---

### 3. Cassandra (Time-Series Store) - AP

**Use Case:** Sensor readings, Energy consumption logs, Device event logs

**Chosen Because:**
- ✅ **Write-Optimized:** Handles millions of sensor readings per day
- ✅ **Time-Series Partitioning:** Partition key (device_id, date) distributes data efficiently
- ✅ **No Single Point of Failure:** Distributed across multiple nodes
- ✅ **Time-Range Queries:** Clustering by timestamp DESC for fast historical queries
- ✅ **Linear Scalability:** Add nodes as device count grows

**Why Not MongoDB?**
- MongoDB not optimized for time-series writes (though TimeSeries collections exist)
- Cassandra handles 1M writes/sec per node
- No need for complex queries (just time-range filters)

**Why Not InfluxDB?**
- Cassandra more general-purpose (can store logs, not just metrics)
- Better horizontal scaling

**CAP:** AP (Availability + Partition Tolerance with Eventual Consistency)

---

### 4. Neo4j (Graph Database) - CA/CP

**Use Case:** User-service subscriptions, Recommendations, Social features

**Chosen Because:**
- ✅ **Relationship-First:** Models user-service connections naturally
- ✅ **Graph Traversal:** Finds "users who subscribed to X also subscribed to Y" efficiently
- ✅ **Collaborative Filtering:** One Cypher query for recommendations (would need multiple joins in SQL)
- ✅ **Path Finding:** Can add "friend of friend" features later
- ✅ **Visual Query Language:** Cypher is intuitive for relationship queries

**Why Not SQL with Joins?**
- Recursive joins are slow (friend of friend of friend...)
- Graph traversal in Neo4j is O(1) per node
- SQL would need complex self-joins

**Example: Recommendation Query in Neo4j vs SQL**

**Neo4j (1 query):**
```cypher
MATCH (u:User {userId: '123'})-[:SUBSCRIBED_TO]->(s:Service)
MATCH (other:User)-[:SUBSCRIBED_TO]->(s)
MATCH (other)-[:SUBSCRIBED_TO]->(rec:Service)
WHERE NOT (u)-[:SUBSCRIBED_TO]->(rec)
RETURN rec, COUNT(*) as score
ORDER BY score DESC
```

**SQL (Complex joins):**
```sql
SELECT s2.*, COUNT(*) as score
FROM subscriptions s1
JOIN subscriptions s1_others ON s1.service_id = s1_others.service_id
JOIN subscriptions s2 ON s1_others.user_id = s2.user_id
LEFT JOIN subscriptions s_check ON s1.user_id = s_check.user_id AND s2.service_id = s_check.service_id
WHERE s1.user_id = '123' AND s_check.id IS NULL
GROUP BY s2.service_id
ORDER BY score DESC;
```

**CAP:** CA/CP (depends on cluster configuration)

---

### 5. Elasticsearch (Search Engine) - AP

**Use Case:** Service marketplace search, Full-text search, Autocomplete

**Chosen Because:**
- ✅ **Full-Text Search:** Searches across name, description, features with relevance scoring
- ✅ **Fuzzy Matching:** Handles typos ("enegry" → "energy")
- ✅ **Custom Analyzers:** Stemming (monitors → monitor), stop word removal
- ✅ **Fast:** Searches millions of services in < 50ms
- ✅ **Aggregations:** Faceted search (filter by category, rating)

**Why Not MongoDB Text Search?**
- MongoDB text search is basic (no fuzzy matching, limited analyzers)
- Elasticsearch designed specifically for search
- Better relevance scoring

**Why Not SQL LIKE?**
```sql
SELECT * FROM services WHERE name LIKE '%energy%' OR description LIKE '%energy%';
```
- ❌ Very slow on large datasets (full table scan)
- ❌ No relevance scoring
- ❌ No fuzzy matching
- ❌ No stemming

**CAP:** AP (Availability + Partition Tolerance)

---

### Summary Table

| Database | Type | Use Case | Writes/Sec | Query Type | CAP |
|----------|------|----------|------------|------------|-----|
| **MongoDB** | Document | Users, Devices, Services | 10K | Complex filters, aggregations | CP |
| **Redis** | Cache | Sessions, Cache | 100K | Key-value lookup | CP |
| **Cassandra** | Wide-Column | Time-series sensor data | 1M | Time-range queries | AP |
| **Neo4j** | Graph | Relationships, Recommendations | 10K | Graph traversal | CA/CP |
| **Elasticsearch** | Search | Full-text service search | 50K | Text search, fuzzy match | AP |

---

## 🔄 Polyglot Persistence Implementation

### What is Polyglot Persistence?

Using **multiple databases** in a single application, where each database is chosen based on the **specific data access patterns** rather than using one database for everything.

### Key Implementation: Device Readings Endpoint

**Endpoint:** `POST /api/devices/:deviceId/readings`

**Flow:**
```
Client
  ↓
POST /api/devices/thermostat_001/readings
Body: { temperature: 22.5, humidity: 45, timestamp: "2025-12-04T10:30:00Z" }
  ↓
┌─────────────────────────────────────────────┐
│ Backend Server (Express.js)                 │
│                                             │
│  1. Validate data                           │
│  2. Execute 4 database operations           │
└─────────────────────────────────────────────┘
  ↓         ↓           ↓              ↓
MongoDB   Redis    Cassandra      Socket.IO
(Latest) (Cache)  (Historical)    (Real-time)
```

**Code Implementation:**
```javascript
// routes/devices.js
router.post('/:deviceId/readings', authMiddleware, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { temperature, humidity, pressure, timestamp } = req.body;

        // 1. UPDATE MONGODB - Latest reading
        await Device.findOneAndUpdate(
            { deviceId },
            {
                $set: {
                    'lastDataPoint': {
                        timestamp: new Date(timestamp),
                        values: { temperature, humidity, pressure }
                    },
                    'status.lastSeen': new Date()
                }
            }
        );

        // 2. CACHE IN REDIS - 5 minute TTL
        const cacheKey = `device:${deviceId}:latest`;
        await redis.setex(
            cacheKey,
            300, // 5 minutes
            JSON.stringify({ temperature, humidity, timestamp })
        );

        // 3. INSERT INTO CASSANDRA - Time-series storage
        const query = `
            INSERT INTO sensor_data (
                device_id, date, timestamp, 
                temperature, humidity, pressure
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        await cassandraClient.execute(query, [
            deviceId,
            new Date().toISOString().split('T')[0], // date partition
            new Date(timestamp),
            temperature,
            humidity,
            pressure
        ], { prepare: true });

        // 4. EMIT WEBSOCKET EVENT - Real-time update
        io.to(`device:${deviceId}`).emit('reading', {
            deviceId,
            temperature,
            humidity,
            timestamp
        });

        res.json({
            success: true,
            message: 'Reading saved to 3 databases',
            databases: ['MongoDB', 'Redis', 'Cassandra']
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

**Why Multiple Databases?**

1. **MongoDB (Latest Reading):**
   - Need: Quick access to device's current state
   - Why: Document structure perfect for nested lastDataPoint
   - Query: `db.devices.findOne({ deviceId: 'thermostat_001' })`

2. **Redis (Cache):**
   - Need: Ultra-fast dashboard queries (< 1ms)
   - Why: Avoid MongoDB for frequent "latest reading" requests
   - TTL: 5 minutes (data becomes stale after)

3. **Cassandra (Historical Data):**
   - Need: Store millions of readings for analytics
   - Why: Optimized for time-series writes and range queries
   - Query: `SELECT * WHERE device_id = 'x' AND date = '2025-12-04' AND timestamp > '10:00'`

4. **Socket.IO (Real-time):**
   - Need: Push updates to connected dashboard clients
   - Why: No database needed, in-memory event emission

---

### Other Polyglot Examples

#### Example 2: Service Search
```javascript
GET /api/services/search?q=energy monitoring

Flow:
1. Try Elasticsearch (full-text search with fuzzy matching)
   ↓ Success: Return results
   ↓ Failure: Fallback to MongoDB

2. MongoDB text search (basic search)
   ↓ Return results
```

#### Example 3: User Registration
```javascript
POST /api/auth/register

Flow:
1. MongoDB - Create user document
2. Neo4j - Create User node (for future recommendations)
3. Redis - Store session token
```

---

## 📐 CAP Theorem Analysis

### What is CAP Theorem?

**CAP Theorem** states that a distributed database can only guarantee **2 out of 3** properties:

- **C (Consistency):** All nodes see the same data at the same time
- **A (Availability):** Every request gets a response (success or failure)
- **P (Partition Tolerance):** System continues to work despite network failures

**Reality:** In distributed systems, **Partition Tolerance is mandatory** (networks fail), so we choose between **CP or AP**.

---

### Our Databases' CAP Classification

#### 1. MongoDB - **CP** (Consistency + Partition Tolerance)

**Choice:** Prioritizes consistency over availability

**Behavior During Partition:**
- Primary node down → System unavailable (no writes)
- Reads can happen from secondaries (eventual consistency)
- New primary elected → System available again

**Why CP for User/Device Data?**
- ✅ User profile must be consistent (can't have two different passwords)
- ✅ Device status must be accurate (safety-critical for locks/thermostats)
- ❌ Brief unavailability acceptable (registration can wait 5 seconds)

**Configuration:**
```javascript
await mongoose.connect(MONGODB_URL, {
    readPreference: 'primaryPreferred', // Consistency priority
    w: 'majority' // Wait for majority of nodes to acknowledge write
});
```

---

#### 2. Redis - **CP** (Consistency + Partition Tolerance)

**Choice:** Prioritizes consistency (in standalone/Sentinel mode)

**Behavior During Partition:**
- Master down → System unavailable until failover
- Sentinel promotes new master (~30 seconds)
- Writes always go to master (no split-brain)

**Why CP for Sessions?**
- ✅ Session token must be consistent (security critical)
- ✅ Can't have two users with same session
- ❌ Brief login unavailability acceptable

**Configuration:**
```javascript
const redis = new Redis({
    sentinels: [{ host: 'sentinel1', port: 26379 }],
    name: 'mymaster',
    password: 'password',
    db: 0
});
```

---

#### 3. Cassandra - **AP** (Availability + Partition Tolerance)

**Choice:** Prioritizes availability over consistency

**Behavior During Partition:**
- Nodes continue accepting writes
- **Eventual consistency** (data syncs when partition heals)
- No single point of failure

**Why AP for Sensor Data?**
- ✅ Sensor readings must be recorded (can't lose data)
- ✅ Slight delay in seeing all data is acceptable
- ✅ Time-series data rarely conflicts (append-only)

**Example Scenario:**
```
Time: 10:00 AM
- Node 1 (West Coast): Receives reading { temp: 22.5 }
- Node 2 (East Coast): Receives reading { temp: 22.7 }
- Network partition occurs

Result:
- Both nodes accept writes (Available)
- Data will sync when network heals (Eventual Consistency)
- No data loss
```

**Configuration:**
```javascript
const client = new cassandra.Client({
    contactPoints: ['node1', 'node2', 'node3'],
    localDataCenter: 'datacenter1',
    keyspace: 'smart_platform',
    queryOptions: {
        consistency: cassandra.types.consistencies.localQuorum
        // Trade-off: Lower consistency for higher availability
    }
});
```

---

#### 4. Neo4j - **CA/CP** (Configuration-Dependent)

**Choice:** Can be configured as CA (single instance) or CP (cluster)

**Our Setup:** Single instance = **CA** (for development)

**Production Setup:** Cluster with causal consistency = **CP**

**Why CA/CP for Relationships?**
- ✅ Subscription relationships must be accurate
- ✅ Recommendation queries need consistent data
- ❌ Brief unavailability acceptable (recommendations can wait)

**Configuration (Cluster - CP):**
```javascript
const driver = neo4j.driver(
    'neo4j+s://cluster.neo4j.io',
    neo4j.auth.basic('neo4j', 'password'),
    {
        defaultAccessMode: neo4j.session.WRITE,
        bookmarks: [] // Causal consistency
    }
);
```

---

#### 5. Elasticsearch - **AP** (Availability + Partition Tolerance)

**Choice:** Prioritizes availability and search speed

**Behavior During Partition:**
- Search continues on available nodes
- **Eventual consistency** for indexed data
- No downtime for searches

**Why AP for Search?**
- ✅ Search must always work (users expect instant results)
- ✅ Slight delay in new service appearing is acceptable
- ✅ Better to show slightly stale results than no results

**Example Scenario:**
```
Time: 10:00 AM
- New service added to MongoDB
- Service indexed in Elasticsearch node 1
- Network partition occurs

Result:
- Searches on node 1 see new service
- Searches on node 2 don't see it yet (Eventual Consistency)
- No search downtime (Availability)
- Data syncs when network heals
```

**Configuration:**
```javascript
const client = new Client({
    node: 'http://localhost:9200',
    maxRetries: 3,
    requestTimeout: 30000,
    sniffOnStart: true // Discover all nodes
});
```

---

### CAP Trade-offs Summary

| Database | CAP | Chosen Because | Trade-off |
|----------|-----|----------------|-----------|
| **MongoDB** | CP | User data must be consistent | Brief unavailability during failover |
| **Redis** | CP | Session tokens must be consistent | Brief login delays during failover |
| **Cassandra** | AP | Sensor data must always be recorded | Slight delay in seeing all readings |
| **Neo4j** | CA/CP | Recommendations need consistency | Can configure based on needs |
| **Elasticsearch** | AP | Search must always work | New services appear after slight delay |

---

### Real-World Scenario: Network Partition

**Scenario:** Network split between data centers

```
Data Center 1 (West)          Data Center 2 (East)
     |                              |
  MongoDB    ←→ PARTITION ←→     MongoDB
  (Primary)                      (Secondary)
     |                              |
  Cassandra  ←→ PARTITION ←→     Cassandra
  (Node 1)                       (Node 2)
```

**What Happens:**

1. **MongoDB (CP):**
   - West: Primary continues accepting writes ✅
   - East: Secondary refuses writes ❌ (consistency preserved)
   - Users in East: See "Database unavailable" error

2. **Cassandra (AP):**
   - West: Node 1 accepts sensor readings ✅
   - East: Node 2 accepts sensor readings ✅
   - Both: Data will sync when partition heals
   - Result: No data loss, all readings recorded

3. **Result:**
   - User registration/login fails in East (MongoDB CP)
   - Sensor readings succeed everywhere (Cassandra AP)
   - Search works everywhere (Elasticsearch AP)

**When Partition Heals:**
- MongoDB: Secondaries catch up (replication)
- Cassandra: Nodes sync data (anti-entropy repair)
- Elasticsearch: Shards rebalance

---

## 🏗️ Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (HTML5 + CSS3 + Vanilla JavaScript)                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Login   │  │Dashboard │  │ Services │                 │
│  │  Page    │  │   Page   │  │   Page   │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
│       │             │             │                         │
│       └─────────────┼─────────────┘                         │
│                     │                                        │
│              Fetch API / WebSocket                          │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│              (Node.js + Express.js)                          │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Auth Routes   │  │ Device Routes  │  │Service Routes│ │
│  │  /api/auth/*   │  │ /api/devices/* │  │/api/services│ │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘ │
│           │                    │                  │          │
│  ┌────────┴────────────────────┴──────────────────┴──────┐ │
│  │              Middleware Layer                          │ │
│  │  - JWT Authentication                                  │ │
│  │  - CORS                                                │ │
│  │  - Rate Limiting (Redis)                              │ │
│  │  - Helmet (Security)                                  │ │
│  └────────┬───────────────────────────────────────────────┘ │
│           │                                                  │
│  ┌────────┴───────────────────────────────────────────────┐ │
│  │           Database Connection Layer                    │ │
│  │  - config/mongodb.js                                  │ │
│  │  - config/redis.js                                    │ │
│  │  - config/cassandra.js                                │ │
│  │  - config/neo4j.js                                    │ │
│  │  - config/elasticsearch.js                            │ │
│  └────────┬───────────────────────────────────────────────┘ │
└───────────┼──────────────────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│              (Docker Containers)                             │
│                                                              │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐               │
│  │  MongoDB  │  │  Redis   │  │ Cassandra │               │
│  │  :27017   │  │  :6379   │  │  :9042    │               │
│  │   (CP)    │  │   (CP)   │  │   (AP)    │               │
│  └─────┬─────┘  └────┬─────┘  └─────┬─────┘               │
│        │             │              │                       │
│  ┌─────┴─────┐  ┌────┴──────┐  ┌───┴───────┐             │
│  │  Neo4j    │  │Elasticsearch│  │Volume Data│             │
│  │:7474,7687 │  │:9200,9300  │  │ (Persist) │             │
│  │  (CA/CP)  │  │   (AP)     │  │           │             │
│  └───────────┘  └────────────┘  └───────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

### Data Flow Examples

#### Example 1: User Login Flow
```
1. User submits login form (login.html)
   POST /api/auth/login { email, password }
   ↓
2. Backend validates credentials
   - Query MongoDB: db.users.findOne({ email })
   - Compare bcrypt hash
   ↓
3. Generate JWT token
   - jwt.sign({ userId, email }, SECRET, { expiresIn: '1h' })
   ↓
4. Store session in Redis
   - redis.setex(`session:${userId}`, 3600, token)
   ↓
5. Return token to client
   - Response: { success: true, token, user }
   ↓
6. Client stores token
   - localStorage.setItem('token', token)
   ↓
7. Subsequent requests include token
   - Headers: { Authorization: 'Bearer ' + token }
```

---

#### Example 2: Device Reading Flow
```
1. IoT device sends sensor data
   POST /api/devices/thermostat_001/readings
   Body: { temperature: 22.5, humidity: 45 }
   ↓
2. Backend validates token (Redis session check)
   ↓
3. Parallel database writes:
   
   ┌─────────────┬─────────────┬─────────────┐
   │  MongoDB    │   Redis     │  Cassandra  │
   │  Update     │   Cache     │   Insert    │
   │  latest     │   latest    │   time-     │
   │  reading    │   (5 min)   │   series    │
   └─────────────┴─────────────┴─────────────┘
   
   ↓
4. Emit WebSocket event
   io.to(`device:thermostat_001`).emit('reading', data)
   ↓
5. Dashboard auto-updates (no refresh needed)
```

---

#### Example 3: Service Search Flow
```
1. User searches "energy monitor" (services.html)
   GET /api/services/search?q=energy monitor
   ↓
2. Backend queries Elasticsearch
   {
     "query": {
       "multi_match": {
         "query": "energy monitor",
         "fields": ["name^3", "description^2", "features"],
         "fuzziness": "AUTO"
       }
     }
   }
   ↓
3. Elasticsearch returns ranked results
   - "Smart Energy Monitoring" (score: 15.2)
   - "Energy Consumption Tracker" (score: 12.8)
   - "Home Energy Monitor" (score: 10.5)
   ↓
4. Backend enriches with MongoDB data (if needed)
   ↓
5. Return to client with relevance scores
```

---

#### Example 4: Recommendation Flow (Neo4j)
```
1. User opens services page (services.html)
   GET /api/services/recommendations/personalized
   ↓
2. Backend queries Neo4j
   MATCH (u:User {userId: '123'})-[:SUBSCRIBED_TO]->(s:Service)
   MATCH (other:User)-[:SUBSCRIBED_TO]->(s)
   MATCH (other)-[:SUBSCRIBED_TO]->(rec:Service)
   WHERE NOT (u)-[:SUBSCRIBED_TO]->(rec)
   RETURN rec, COUNT(*) as score
   ↓
3. Neo4j traverses graph
   - John subscribed to "Energy Monitor"
   - Jane also subscribed to "Energy Monitor"
   - Jane also subscribed to "Security System"
   - Recommend "Security System" to John (score: 1)
   ↓
4. Backend enriches with MongoDB service details
   ↓
5. Return personalized recommendations
```

---

### Project Structure

```
Adb 1/
│
├── backend/
│   ├── server.js                 # Main Express app
│   ├── package.json              # Dependencies
│   ├── .env                      # Environment variables
│   │
│   ├── config/                   # Database connections
│   │   ├── mongodb.js
│   │   ├── redis.js
│   │   ├── cassandra.js
│   │   ├── neo4j.js
│   │   └── elasticsearch.js
│   │
│   ├── models/                   # MongoDB schemas
│   │   ├── User.js
│   │   ├── Device.js
│   │   └── Service.js
│   │
│   ├── routes/                   # API endpoints
│   │   ├── auth.js               # 4 endpoints
│   │   ├── users.js              # 2 endpoints
│   │   ├── devices.js            # 7 endpoints
│   │   ├── services.js           # 4 endpoints
│   │   └── analytics.js          # 4 endpoints
│   │
│   └── middleware/
│       └── auth.js               # JWT verification
│
├── interface/                    # Frontend
│   ├── login.html
│   ├── dashboard.html
│   └── services.html
│
├── scripts/                      # Database setup
│   ├── init-cassandra.js         # Create tables
│   ├── init-elasticsearch.js     # Create indices
│   ├── init-databases.js         # Master init
│   ├── seed-data.js              # Sample data
│   └── test-connections.js       # Health check
│
├── docker-compose.yml            # 5 databases
├── start.bat                     # Quick start
├── stop.bat                      # Graceful shutdown
└── .gitignore
```

---

### Technology Stack Details

#### Backend Stack
- **Runtime:** Node.js v22.21.0
- **Framework:** Express.js 4.18.2
- **Authentication:** JWT (jsonwebtoken 9.0.2) + bcrypt 2.4.3
- **Real-time:** Socket.IO 4.6.1
- **Security:** Helmet, CORS, express-rate-limit

#### Database Drivers
- **MongoDB:** mongoose 8.0.3
- **Redis:** ioredis 5.3.2
- **Cassandra:** cassandra-driver 4.7.2
- **Neo4j:** neo4j-driver 5.14.0
- **Elasticsearch:** @elastic/elasticsearch 8.11.0

#### Frontend Stack
- **HTML5** - Semantic markup
- **CSS3** - Animations, gradients, glassmorphism
- **JavaScript (ES6+)** - Fetch API, async/await
- **No frameworks** - Vanilla JS for simplicity

#### Infrastructure
- **Docker Compose 3.8** - Container orchestration
- **Docker Desktop** - Container runtime
- **http-server 14.1.1** - Static file serving

---

### Deployment Architecture

```
Development Environment:
┌──────────────────────────────────────────┐
│  Windows 11 (Your PC)                    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Docker Desktop                    │ │
│  │                                    │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐   │ │
│  │  │Mongo │  │Redis │  │Cass  │   │ │
│  │  └──────┘  └──────┘  └──────┘   │ │
│  │  ┌──────┐  ┌──────┐             │ │
│  │  │Neo4j │  │Elastic│             │ │
│  │  └──────┘  └──────┘             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Backend Server                    │ │
│  │  (Node.js)                         │ │
│  │  Port: 3000                        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Frontend Server                   │ │
│  │  (http-server)                     │ │
│  │  Port: 8081                        │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘

Production (Scalable):
┌─────────────────────────────────────────────┐
│  Cloud Provider (AWS/Azure/GCP)             │
│                                             │
│  Load Balancer                              │
│       ↓                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │Backend │  │Backend │  │Backend │       │
│  │ Node 1 │  │ Node 2 │  │ Node 3 │       │
│  └────────┘  └────────┘  └────────┘       │
│       ↓           ↓           ↓            │
│  ┌─────────────────────────────────────┐  │
│  │  Database Clusters                  │  │
│  │  - MongoDB Atlas (3 replicas)       │  │
│  │  - Redis Enterprise (cluster)       │  │
│  │  - Cassandra Cluster (5 nodes)      │  │
│  │  - Neo4j Aura (managed)            │  │
│  │  - Elasticsearch Service (3 nodes)  │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 📈 Performance Metrics

### Expected Performance (Development)

| Operation | Database | Response Time | Notes |
|-----------|----------|---------------|-------|
| User login | MongoDB + Redis | < 100ms | Password hashing adds 50ms |
| Get devices | MongoDB | < 50ms | Index on userId |
| Latest reading | Redis | < 5ms | In-memory cache |
| Device history | Cassandra | < 200ms | 1 day of data (~1440 readings) |
| Service search | Elasticsearch | < 100ms | Full-text with fuzzy |
| Recommendations | Neo4j | < 150ms | 2-hop graph traversal |
| Post reading | Multi-DB | < 300ms | 3 parallel writes |

### Scalability Estimates

| Metric | Current | Scale to |
|--------|---------|----------|
| Users | 2 (demo) | 1M+ |
| Devices | 5 (demo) | 100K+ |
| Readings/day | 0 | 86.4M (1K devices × 1 reading/min) |
| Services | 6 (demo) | 10K+ |
| Searches/sec | N/A | 1000+ |

---

## 🎓 Learning Outcomes

### What This Project Demonstrates

1. **NoSQL Database Selection**
   - ✅ Understand when to use each NoSQL type
   - ✅ Justify choices based on CAP theorem
   - ✅ Trade-off analysis (consistency vs availability)

2. **Polyglot Persistence**
   - ✅ Multiple databases in single application
   - ✅ Data synchronization across databases
   - ✅ Fallback strategies (Elasticsearch → MongoDB)

3. **Schema Design**
   - ✅ Document modeling (MongoDB)
   - ✅ Wide-column modeling (Cassandra)
   - ✅ Graph modeling (Neo4j)
   - ✅ Search index design (Elasticsearch)

4. **API Development**
   - ✅ RESTful endpoint design
   - ✅ Authentication & authorization (JWT)
   - ✅ Error handling and validation

5. **Real-time Features**
   - ✅ WebSocket implementation (Socket.IO)
   - ✅ Cache invalidation (Redis TTL)
   - ✅ Event-driven architecture

6. **DevOps**
   - ✅ Docker containerization
   - ✅ Multi-container orchestration (docker-compose)
   - ✅ Environment configuration (.env)

---

## 🚀 Running the Project

### Prerequisites
- Docker Desktop installed and running
- Node.js v18+ installed
- Git (optional)

### Quick Start
```powershell
# 1. Clone/navigate to project
cd "C:\Users\HP\Desktop\Adb 1"

# 2. Start all services (databases + backend)
.\start.bat
# Wait 60 seconds for databases to initialize

# 3. Open frontend
# Visit: http://localhost:8081/login.html
# Or run: cd interface ; http-server -p 8081 -o

# 4. Login with demo credentials
Email: john@example.com
Password: password123
```

### Manual Start
```powershell
# Start databases
docker-compose up -d

# Wait for databases (check with docker ps)

# Start backend
cd backend
npm install
node server.js

# Start frontend (new terminal)
cd interface
http-server -p 8081
```

### Stop Services
```powershell
.\stop.bat
# OR
docker-compose down
```

---

## 📝 Conclusion

This project successfully demonstrates:

✅ **5 NoSQL Databases** working together in harmony
✅ **Polyglot Persistence** with justified database selection
✅ **21 API Endpoints** covering authentication, devices, services, analytics
✅ **Modern Web Interface** with real-time updates
✅ **CAP Theorem Application** with CP and AP databases
✅ **Production-Ready Architecture** using Docker

**Key Achievement:** Demonstrates that different databases excel at different tasks, and combining them (polyglot persistence) creates a more efficient system than forcing one database to do everything.

---

## 📞 Contact & Questions

**Prepared for:** Advanced Database Systems - Interim Evaluation (20%)
**Date:** December 2025
**Demo Ready:** ✅ Screenshots, Screen Recording, Live Demo

**Expected Questions Covered:**
- ✅ Why did you choose each database?
- ✅ How does polyglot persistence work?
- ✅ Show me the schema designs
- ✅ Demonstrate the API endpoints
- ✅ Explain CAP theorem trade-offs
- ✅ How do you handle database failures?

---

## 📸 Appendix: Screenshots Guide

**Take these screenshots for evaluation:**

1. **Login Page** (login.html)
   - Modern animated interface
   - Demo credentials visible

2. **Dashboard** (dashboard.html)
   - Stats cards showing data
   - Device list with online/offline status
   - Temperature/humidity readings

3. **Services Marketplace** (services.html)
   - Search bar with results
   - Category filters
   - Personalized recommendations section

4. **MongoDB Compass**
   - Collections: users, devices, services
   - Show document structure

5. **Neo4j Browser**
   - Graph visualization
   - User-Service relationships
   - Cypher query example

6. **Docker Desktop**
   - All 5 containers running (green status)

7. **Terminal/CMD**
   - Backend server logs showing database connections
   - API response examples (curl/Postman)

8. **Cassandra (cqlsh)**
   ```
   docker exec -it smart-platform-cassandra cqlsh
   USE smart_platform;
   SELECT * FROM sensor_data LIMIT 5;
   ```

---

**END OF DOCUMENTATION**
