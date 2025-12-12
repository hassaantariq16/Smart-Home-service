# Database Schema Design

## 1. MongoDB - Document Database

### Collection: `users`
**Strategy**: Embedding for frequently accessed data, referencing for large/independent data

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userId": "USR_12345",
  "email": "user@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": ISODate("1990-05-15"),
    "avatar": "https://cdn.example.com/avatars/12345.jpg"
  },
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "coordinates": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610]
    }
  },
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en-US",
    "timezone": "America/New_York"
  },
  "devices": ["DEV_001", "DEV_002"],  // Reference to devices collection
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-11-28T14:22:00Z"),
  "lastLogin": ISODate("2024-12-02T08:15:00Z"),
  "subscriptionTier": "premium",
  "status": "active"
}
```

**Indexes**:
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "userId": 1 }, { unique: true })
db.users.createIndex({ "address.coordinates": "2dsphere" })  // Geospatial
db.users.createIndex({ "lastLogin": -1 })
db.users.createIndex({ "profile.firstName": "text", "profile.lastName": "text" })  // Full-text
```

**Why Embedding?**
- Profile data is always loaded with user
- Reduces need for JOINs
- Better read performance
- Profile data doesn't grow unbounded

**Why Referencing (devices)?**
- Devices have independent lifecycle
- Prevents document bloat
- Allows querying devices independently

---

### Collection: `devices`
**Strategy**: Denormalized with embedded sensor configuration

```json
{
  "_id": ObjectId("507f191e810c19729de860ea"),
  "deviceId": "DEV_001",
  "userId": "USR_12345",  // Reference back to user
  "deviceType": "smart_thermostat",
  "manufacturer": "IoT Corp",
  "model": "T-3000",
  "firmware": "v2.4.1",
  "status": "online",
  "metadata": {
    "name": "Living Room Thermostat",
    "room": "living_room",
    "installDate": ISODate("2024-01-20T00:00:00Z")
  },
  "configuration": {
    "sensorInterval": 30,  // seconds
    "dataRetention": 90,   // days
    "alertThresholds": {
      "temperature": { "min": 60, "max": 85 },
      "humidity": { "min": 30, "max": 70 }
    }
  },
  "lastSeen": ISODate("2024-12-02T10:45:00Z"),
  "lastDataPoint": {
    "temperature": 72.5,
    "humidity": 45,
    "timestamp": ISODate("2024-12-02T10:45:00Z")
  },
  "createdAt": ISODate("2024-01-20T00:00:00Z"),
  "updatedAt": ISODate("2024-12-02T10:45:00Z")
}
```

**Indexes**:
```javascript
db.devices.createIndex({ "deviceId": 1 }, { unique: true })
db.devices.createIndex({ "userId": 1 })
db.devices.createIndex({ "status": 1, "lastSeen": -1 })
db.devices.createIndex({ "deviceType": 1 })
```

**Denormalization Benefits**:
- Last data point embedded for quick dashboard access
- No need to query Cassandra for recent status
- Trade-off: Slight data duplication for major read performance gain

---

### Collection: `services`
**Strategy**: Document per service with embedded configurations

```json
{
  "_id": ObjectId("507f191e810c19729de860eb"),
  "serviceId": "SRV_CLEAN_001",
  "serviceName": "Smart Home Cleaning",
  "category": "home_services",
  "description": "AI-powered cleaning service scheduling",
  "provider": {
    "companyId": "COMP_789",
    "companyName": "CleanTech Solutions",
    "rating": 4.8,
    "verified": true
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
      "tuesday": { "start": "08:00", "end": "18:00" },
      "wednesday": { "start": "08:00", "end": "18:00" },
      "thursday": { "start": "08:00", "end": "18:00" },
      "friday": { "start": "08:00", "end": "18:00" },
      "saturday": { "start": "09:00", "end": "15:00" },
      "sunday": null
    }
  },
  "features": ["AI scheduling", "Eco-friendly", "Same-day service"],
  "tags": ["cleaning", "home", "recurring"],
  "active": true,
  "createdAt": ISODate("2024-01-10T00:00:00Z")
}
```

**Indexes**:
```javascript
db.services.createIndex({ "serviceId": 1 }, { unique: true })
db.services.createIndex({ "category": 1, "active": 1 })
db.services.createIndex({ "tags": 1 })
db.services.createIndex({ "provider.rating": -1 })
db.services.createIndex({ "serviceName": "text", "description": "text" })
```

---

## 2. Redis - Key-Value Store

### Key Design Strategy
Use namespaced keys with TTL (Time To Live) for automatic expiration

### Session Management
```
Key Pattern: session:{sessionId}
TTL: 3600 seconds (1 hour)

Example:
Key: "session:abc123xyz"
Value: {
  "userId": "USR_12345",
  "email": "user@example.com",
  "loginTime": "2024-12-02T10:00:00Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Real-Time Device Data Cache
```
Key Pattern: device:realtime:{deviceId}
TTL: 300 seconds (5 minutes)

Example:
Key: "device:realtime:DEV_001"
Value: {
  "temperature": 72.5,
  "humidity": 45,
  "timestamp": "2024-12-02T10:45:30Z",
  "status": "online"
}
```

### User Activity Counter
```
Key Pattern: user:activity:{userId}:{date}
TTL: 86400 seconds (24 hours)

Example:
Key: "user:activity:USR_12345:2024-12-02"
Value: 247  (API calls count)

Commands:
INCR user:activity:USR_12345:2024-12-02
```

### Rate Limiting
```
Key Pattern: ratelimit:{userId}:{endpoint}
TTL: 60 seconds

Example:
Key: "ratelimit:USR_12345:/api/devices"
Value: 45  (request count in last minute)

Strategy: Token Bucket Algorithm
```

### Leaderboard (Sorted Set)
```
Key: "leaderboard:energy_savings"
Type: Sorted Set (ZSET)

Commands:
ZADD leaderboard:energy_savings 245.8 "USR_12345"
ZREVRANGE leaderboard:energy_savings 0 9 WITHSCORES  // Top 10
```

### Caching Strategy
```
Pattern: cache:{resource}:{id}
TTL: 600 seconds (10 minutes)

Example:
Key: "cache:user:USR_12345"
Value: {JSON stringified user object}

Cache Invalidation: On UPDATE/DELETE operations
```

---

## 3. Apache Cassandra - Column-Family Store

### Table: `device_readings`
**Strategy**: Time-series data with partition by device and time bucket

```cql
CREATE TABLE device_readings (
    device_id text,
    date text,              -- Partition key bucket (e.g., '2024-12-02')
    timestamp timeuuid,     -- Clustering key for ordering
    reading_type text,
    value double,
    unit text,
    quality_score int,
    metadata map<text, text>,
    PRIMARY KEY ((device_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND compaction = {'class': 'TimeWindowCompactionStrategy'}
  AND default_time_to_live = 7776000;  -- 90 days
```

**Partition Strategy**:
- `(device_id, date)` = Composite partition key
- Ensures even data distribution
- Limits partition size (one day of data per partition)
- Enables efficient time-range queries

**Indexes**:
```cql
CREATE INDEX ON device_readings (reading_type);
```

**Query Examples**:
```cql
-- Get last 24 hours of data for a device
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' 
  AND date IN ('2024-12-01', '2024-12-02')
  AND timestamp > minTimeuuid('2024-12-01 10:00:00')
ORDER BY timestamp DESC
LIMIT 1000;
```

---

### Table: `system_logs`
**Strategy**: Wide column with partition by service and hour

```cql
CREATE TABLE system_logs (
    service_name text,
    hour_bucket text,        -- '2024-12-02-10' (hourly partitions)
    log_id timeuuid,
    severity text,           -- DEBUG, INFO, WARN, ERROR
    message text,
    user_id text,
    device_id text,
    endpoint text,
    response_time_ms int,
    error_details text,
    tags set<text>,
    PRIMARY KEY ((service_name, hour_bucket), log_id)
) WITH CLUSTERING ORDER BY (log_id DESC)
  AND default_time_to_live = 2592000;  -- 30 days
```

**Materialized View for Errors**:
```cql
CREATE MATERIALIZED VIEW logs_by_severity AS
    SELECT * FROM system_logs
    WHERE service_name IS NOT NULL 
      AND hour_bucket IS NOT NULL
      AND log_id IS NOT NULL
      AND severity IS NOT NULL
    PRIMARY KEY ((severity, hour_bucket), log_id)
    WITH CLUSTERING ORDER BY (log_id DESC);
```

---

### Table: `analytics_events`
**Strategy**: Event sourcing pattern with composite partition

```cql
CREATE TABLE analytics_events (
    user_id text,
    event_date text,         -- Daily partition
    event_id timeuuid,
    event_type text,         -- page_view, button_click, purchase, etc.
    event_data map<text, text>,
    session_id text,
    device_type text,
    location text,
    referrer text,
    PRIMARY KEY ((user_id, event_date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);
```

**Why Cassandra for Time-Series?**
- Optimized for high write throughput
- Automatic data distribution via consistent hashing
- Built-in TTL for automatic data expiration
- Tunable consistency levels
- Linear scalability

---

## 4. Neo4j - Graph Database

### Node: `User`
```cypher
CREATE (u:User {
    userId: 'USR_12345',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    joinDate: datetime('2024-01-15T10:30:00Z'),
    preferences: ['smart_home', 'energy_saving', 'automation']
})
```

### Node: `Service`
```cypher
CREATE (s:Service {
    serviceId: 'SRV_CLEAN_001',
    name: 'Smart Home Cleaning',
    category: 'home_services',
    rating: 4.8
})
```

### Node: `Device`
```cypher
CREATE (d:Device {
    deviceId: 'DEV_001',
    type: 'smart_thermostat',
    model: 'T-3000'
})
```

### Relationships
```cypher
// User owns device
CREATE (u:User {userId: 'USR_12345'})
      -[:OWNS {since: datetime()}]->
       (d:Device {deviceId: 'DEV_001'})

// User uses service
CREATE (u:User {userId: 'USR_12345'})
      -[:SUBSCRIBED_TO {
          startDate: datetime(),
          tier: 'premium',
          frequency: 'weekly'
      }]->
       (s:Service {serviceId: 'SRV_CLEAN_001'})

// User friends/follows user
CREATE (u1:User {userId: 'USR_12345'})
      -[:FOLLOWS {since: datetime()}]->
       (u2:User {userId: 'USR_67890'})

// Service recommendation based on similarity
CREATE (s1:Service {serviceId: 'SRV_CLEAN_001'})
      -[:SIMILAR_TO {score: 0.85}]->
       (s2:Service {serviceId: 'SRV_CLEAN_002'})

// User interacted with service
CREATE (u:User {userId: 'USR_12345'})
      -[:VIEWED {
          timestamp: datetime(),
          duration: 45
      }]->
       (s:Service {serviceId: 'SRV_CLEAN_001'})
```

### Indexes
```cypher
CREATE INDEX user_id FOR (u:User) ON (u.userId);
CREATE INDEX service_id FOR (s:Service) ON (s.serviceId);
CREATE INDEX device_id FOR (d:Device) ON (d.deviceId);
CREATE INDEX service_category FOR (s:Service) ON (s.category);
```

### Recommendation Queries

**Friend-based recommendations**:
```cypher
// Find services my friends use that I don't
MATCH (me:User {userId: 'USR_12345'})
      -[:FOLLOWS]->(friend:User)
      -[:SUBSCRIBED_TO]->(service:Service)
WHERE NOT (me)-[:SUBSCRIBED_TO]->(service)
RETURN service, COUNT(friend) as friendCount
ORDER BY friendCount DESC
LIMIT 10
```

**Collaborative filtering**:
```cypher
// Users with similar preferences
MATCH (me:User {userId: 'USR_12345'})
      -[:SUBSCRIBED_TO]->(s:Service)
      <-[:SUBSCRIBED_TO]-(other:User)
WHERE me <> other
WITH other, COUNT(s) as commonServices
ORDER BY commonServices DESC
LIMIT 20
MATCH (other)-[:SUBSCRIBED_TO]->(recommended:Service)
WHERE NOT (me)-[:SUBSCRIBED_TO]->(recommended)
RETURN recommended, COUNT(*) as score
ORDER BY score DESC
LIMIT 10
```

**Graph-based similar services**:
```cypher
MATCH (s:Service {serviceId: 'SRV_CLEAN_001'})
      -[:SIMILAR_TO*1..2]-(related:Service)
RETURN DISTINCT related
ORDER BY related.rating DESC
LIMIT 5
```

---

## 5. Elasticsearch - Full-Text Search & Analytics

### Index: `services_search`
```json
PUT /services_search
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 2,
    "analysis": {
      "analyzer": {
        "custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "serviceId": { "type": "keyword" },
      "serviceName": { 
        "type": "text",
        "analyzer": "custom_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { 
        "type": "text",
        "analyzer": "custom_analyzer"
      },
      "category": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "rating": { "type": "float" },
      "pricing": {
        "properties": {
          "basePrice": { "type": "float" },
          "currency": { "type": "keyword" }
        }
      },
      "location": { "type": "geo_point" },
      "createdAt": { "type": "date" }
    }
  }
}
```

### Search Query Example
```json
GET /services_search/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "smart home cleaning",
            "fields": ["serviceName^3", "description", "tags^2"],
            "type": "best_fields"
          }
        }
      ],
      "filter": [
        { "term": { "category": "home_services" } },
        { "range": { "rating": { "gte": 4.0 } } }
      ]
    }
  },
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "pricing.basePrice",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 100 },
          { "from": 100 }
        ]
      }
    },
    "top_categories": {
      "terms": {
        "field": "category",
        "size": 10
      }
    }
  }
}
```

---

## Data Modeling Principles Applied

### 1. Embedding vs Referencing
- **Embed**: When data is accessed together (user profile + address)
- **Reference**: When data has independent lifecycle (user → devices)

### 2. Denormalization
- Cache latest device reading in MongoDB device document
- Trade-off: Data duplication for read performance

### 3. Partition Key Selection (Cassandra)
- Use composite keys (device_id, date) to limit partition size
- Ensures even data distribution across nodes

### 4. Index Strategy
- Primary indexes on frequently queried fields
- Geospatial indexes for location queries
- Full-text indexes for search
- Compound indexes for multi-field queries

### 5. TTL (Time To Live)
- Redis: Short TTL for real-time data (5 min)
- Cassandra: Automatic expiration (30-90 days)
- Prevents unbounded data growth

### 6. Consistency Levels
- **MongoDB**: Eventual consistency for reads, strong for writes
- **Cassandra**: QUORUM for balance, LOCAL_QUORUM for multi-DC
- **Redis**: Strong consistency (single-threaded)

---

## Scalability Considerations

### Horizontal Scaling
- **MongoDB**: Sharding by userId hash
- **Cassandra**: Automatic via consistent hashing
- **Redis**: Redis Cluster with hash slots
- **Neo4j**: Causal clustering

### Data Distribution
- Partition keys chosen to avoid hot spots
- Time-based bucketing for time-series data
- Geographic distribution for global users
