# Indexing & Querying Strategies

## Table of Contents
1. [Index Types](#index-types)
2. [MongoDB Indexing](#mongodb-indexing)
3. [Cassandra Indexing](#cassandra-indexing)
4. [Redis Indexing](#redis-indexing)
5. [Neo4j Indexing](#neo4j-indexing)
6. [Elasticsearch Indexing](#elasticsearch-indexing)
7. [Query Optimization](#query-optimization)
8. [Aggregation Pipelines](#aggregation-pipelines)

---

## Index Types

### 1. Single-Field Index
Index on one field for fast lookups

### 2. Compound Index
Index on multiple fields together

### 3. Text Index
Full-text search on string fields

### 4. Geospatial Index
Location-based queries

### 5. Hash Index
Hash-based for equality checks only

### 6. Secondary Index
Additional index beyond primary key

---

## MongoDB Indexing

### Creating Indexes

**Single Field**:
```javascript
// Create index on email field
db.users.createIndex({ email: 1 })  // 1 = ascending, -1 = descending

// Unique index
db.users.createIndex({ email: 1 }, { unique: true })

// With options
db.users.createIndex(
  { userId: 1 },
  { 
    unique: true,
    name: "userId_unique_idx",
    background: true  // Don't block operations
  }
)
```

**Compound Index**:
```javascript
// Index on multiple fields
db.devices.createIndex({ userId: 1, status: 1, lastSeen: -1 })

// Order matters! Good for:
// ✅ { userId: "USR_12345", status: "online" }
// ✅ { userId: "USR_12345" }
// ❌ { status: "online" } - won't use index efficiently
```

**Text Index** (Full-Text Search):
```javascript
// Create text index
db.services.createIndex(
  { 
    serviceName: "text",
    description: "text",
    tags: "text"
  },
  {
    weights: {
      serviceName: 10,  // Higher weight = more relevance
      tags: 5,
      description: 1
    },
    name: "service_text_search"
  }
)

// Query with text search
db.services.find({
  $text: { $search: "smart home cleaning" }
})

// With relevance score
db.services.find(
  { $text: { $search: "smart home" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

**Geospatial Index**:
```javascript
// Create 2dsphere index for GeoJSON
db.users.createIndex({ "address.coordinates": "2dsphere" })

// Find users within radius
db.users.find({
  "address.coordinates": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-73.935242, 40.730610]  // [longitude, latitude]
      },
      $maxDistance: 5000  // 5km in meters
    }
  }
})

// Find within polygon
db.users.find({
  "address.coordinates": {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.9, 40.7],
          [-73.8, 40.7],
          [-73.8, 40.8],
          [-73.9, 40.8],
          [-73.9, 40.7]
        ]]
      }
    }
  }
})
```

**Partial Index** (Filtered):
```javascript
// Index only active users
db.users.createIndex(
  { lastLogin: -1 },
  {
    partialFilterExpression: {
      status: "active",
      subscriptionTier: { $in: ["premium", "enterprise"] }
    }
  }
)

// Smaller index, faster queries for active users
```

**TTL Index** (Auto-Delete):
```javascript
// Auto-delete documents after expiration
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // Delete after 1 hour
)
```

### Index Performance Analysis

**Explain Query**:
```javascript
// See execution plan
db.users.find({ email: "user@example.com" }).explain("executionStats")

// Key metrics:
// - executionTimeMillis: Query duration
// - totalKeysExamined: Index keys scanned
// - totalDocsExamined: Documents scanned
// - nReturned: Documents returned
//
// Good: totalDocsExamined ≈ nReturned (index selective)
// Bad: totalDocsExamined >> nReturned (full collection scan)
```

**Check Index Usage**:
```javascript
// List all indexes
db.users.getIndexes()

// Get index stats
db.users.aggregate([
  { $indexStats: {} }
])

// Shows:
// - name: Index name
// - accesses: Usage count
// - ops: Operations since startup
```

---

## Cassandra Indexing

### Primary Key Components

**Partition Key + Clustering Key**:
```cql
CREATE TABLE device_readings (
    device_id text,      -- Partition key (determines node)
    date text,           -- Composite partition key
    timestamp timeuuid,  -- Clustering key (sorting within partition)
    reading_type text,
    value double,
    PRIMARY KEY ((device_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

**Query Efficiency**:
```cql
-- ✅ Efficient: Uses partition key
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' AND date = '2024-12-02';

-- ✅ Efficient: Partition key + clustering key range
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' 
  AND date = '2024-12-02'
  AND timestamp > minTimeuuid('2024-12-02 10:00:00');

-- ❌ Inefficient: Missing partition key (requires ALLOW FILTERING)
SELECT * FROM device_readings 
WHERE reading_type = 'temperature';  -- Scans all nodes!
```

### Secondary Indexes

**When to Use**:
- Low cardinality columns (few unique values)
- Queries on non-partition-key columns
- Not for high-throughput queries

```cql
-- Create secondary index
CREATE INDEX ON device_readings (reading_type);

-- Now this query works (but still not optimal)
SELECT * FROM device_readings 
WHERE reading_type = 'temperature';
```

**Limitations**:
- ❌ Slow (queries all nodes)
- ❌ Increases write latency
- ✅ Better than ALLOW FILTERING
- ⚠️ Use sparingly

### Materialized Views

**Better Alternative to Secondary Indexes**:
```cql
-- Base table
CREATE TABLE users (
    user_id text PRIMARY KEY,
    email text,
    status text,
    last_login timestamp
);

-- Materialized view: Query by email
CREATE MATERIALIZED VIEW users_by_email AS
    SELECT * FROM users
    WHERE email IS NOT NULL AND user_id IS NOT NULL
    PRIMARY KEY (email, user_id);

-- Query view
SELECT * FROM users_by_email WHERE email = 'user@example.com';
```

**Trade-offs**:
- ✅ Fast reads (pre-computed)
- ❌ Write amplification (updates both table and view)
- ⚠️ Eventual consistency between table and view

### SASI Indexes (SSTable Attached Secondary Index)

**For Range Queries**:
```cql
-- Enable SASI
CREATE CUSTOM INDEX ON services (rating)
USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {
  'mode': 'SPARSE',
  'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer'
};

-- Range queries work
SELECT * FROM services WHERE rating >= 4.5;

-- LIKE queries work
CREATE CUSTOM INDEX ON services (service_name)
USING 'org.apache.cassandra.index.sasi.SASIIndex'
WITH OPTIONS = {'mode': 'CONTAINS'};

SELECT * FROM services WHERE service_name LIKE '%cleaning%';
```

---

## Redis Indexing

### Native Data Structures

**Sets for Membership**:
```bash
# Add user to sets
SADD users:premium USR_12345
SADD users:active USR_12345
SADD users:newyork USR_12345

# Check membership
SISMEMBER users:premium USR_12345  # 1 (true)

# Set operations
SINTER users:premium users:newyork  # Premium users in NYC
SUNION users:premium users:enterprise  # All paying users
SDIFF users:active users:premium  # Active non-premium users
```

**Sorted Sets for Rankings**:
```bash
# Add scores
ZADD leaderboard:energy 245.8 USR_12345
ZADD leaderboard:energy 312.5 USR_67890
ZADD leaderboard:energy 189.2 USR_11111

# Get rank
ZRANK leaderboard:energy USR_12345  # Position (0-indexed)
ZREVRANK leaderboard:energy USR_12345  # Position (highest first)

# Get top 10
ZREVRANGE leaderboard:energy 0 9 WITHSCORES

# Get by score range
ZRANGEBYSCORE leaderboard:energy 200 300 WITHSCORES

# Count in range
ZCOUNT leaderboard:energy 200 300
```

**Hashes for Objects**:
```bash
# Store user object
HSET user:USR_12345 email "user@example.com"
HSET user:USR_12345 balance 1000
HSET user:USR_12345 tier "premium"

# Get single field
HGET user:USR_12345 email

# Get all fields
HGETALL user:USR_12345

# Check field exists
HEXISTS user:USR_12345 email
```

### RediSearch Module

**Full-Text Search in Redis**:
```bash
# Create index
FT.CREATE idx:services 
  ON JSON 
  PREFIX 1 service:
  SCHEMA
    $.serviceName AS name TEXT WEIGHT 2.0
    $.category AS category TAG
    $.rating AS rating NUMERIC SORTABLE
    $.pricing.basePrice AS price NUMERIC SORTABLE

# Add document
JSON.SET service:SRV_001 $ '{
  "serviceName": "Smart Home Cleaning",
  "category": "home_services",
  "rating": 4.8,
  "pricing": {"basePrice": 89.99}
}'

# Search
FT.SEARCH idx:services "@name:cleaning @category:{home_services} @rating:[4.5 5.0]"

# Aggregation
FT.AGGREGATE idx:services "*"
  GROUPBY 1 @category
  REDUCE COUNT 0 AS count
```

---

## Neo4j Indexing

### Node Indexes

**Single Property**:
```cypher
-- Create index
CREATE INDEX user_id FOR (u:User) ON (u.userId);

-- Composite index
CREATE INDEX user_email_status FOR (u:User) ON (u.email, u.status);

-- Full-text index
CREATE FULLTEXT INDEX service_search 
FOR (s:Service) 
ON EACH [s.serviceName, s.description];
```

**Query with Index**:
```cypher
// Uses index
MATCH (u:User {userId: 'USR_12345'})
RETURN u;

// Full-text search
CALL db.index.fulltext.queryNodes('service_search', 'smart home cleaning')
YIELD node, score
RETURN node.serviceName, score
ORDER BY score DESC
LIMIT 10;
```

### Relationship Indexes

```cypher
-- Index relationship property
CREATE INDEX subscription_date FOR ()-[r:SUBSCRIBED_TO]-() ON (r.startDate);

// Query
MATCH (u:User)-[r:SUBSCRIBED_TO]->(s:Service)
WHERE r.startDate >= date('2024-01-01')
RETURN u, s;
```

### Constraints (Unique Indexes)

```cypher
-- Unique constraint (creates index automatically)
CREATE CONSTRAINT user_id_unique FOR (u:User) REQUIRE u.userId IS UNIQUE;

-- Node key constraint (multiple properties)
CREATE CONSTRAINT service_key FOR (s:Service) 
REQUIRE (s.serviceId, s.version) IS NODE KEY;
```

---

## Elasticsearch Indexing

### Mapping (Schema)

**Define Field Types**:
```json
PUT /services
{
  "mappings": {
    "properties": {
      "serviceName": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }  // For exact match/sorting
        }
      },
      "category": {
        "type": "keyword"  // For filtering/aggregation
      },
      "rating": {
        "type": "float",
        "index": true
      },
      "description": {
        "type": "text",
        "analyzer": "english"
      },
      "tags": {
        "type": "keyword"
      },
      "location": {
        "type": "geo_point"
      },
      "createdAt": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      }
    }
  }
}
```

### Analyzers

**Custom Analyzer**:
```json
PUT /services
{
  "settings": {
    "analysis": {
      "analyzer": {
        "custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop",
            "snowball",
            "asciifolding"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "serviceName": {
        "type": "text",
        "analyzer": "custom_analyzer"
      }
    }
  }
}
```

**Process**:
```
Input: "Smart Home Cleaning Services"
     ↓ tokenizer
     ["Smart", "Home", "Cleaning", "Services"]
     ↓ lowercase
     ["smart", "home", "cleaning", "services"]
     ↓ stop words (remove "the", "a", etc.)
     ["smart", "home", "cleaning", "services"]
     ↓ snowball (stemming)
     ["smart", "home", "clean", "servic"]
```

---

## Query Optimization

### MongoDB Query Optimization

**Use Projections**:
```javascript
// ❌ Bad: Returns all fields
db.users.find({ userId: "USR_12345" })

// ✅ Good: Returns only needed fields
db.users.find(
  { userId: "USR_12345" },
  { email: 1, profile: 1, _id: 0 }
)
```

**Covered Queries**:
```javascript
// Create index
db.users.createIndex({ userId: 1, email: 1, status: 1 })

// Query only indexed fields
db.users.find(
  { userId: "USR_12345", status: "active" },
  { email: 1, _id: 0 }
)
// ✅ Covered query: Returns data from index only (no document fetch)
```

**Avoid $where and $regex**:
```javascript
// ❌ Bad: Full collection scan
db.users.find({ $where: "this.balance > 100" })

// ✅ Good: Uses index
db.users.find({ balance: { $gt: 100 } })

// ❌ Bad: Can't use index
db.users.find({ email: /.*@example.com$/ })

// ✅ Good: Uses index prefix
db.users.find({ email: /^user@/ })
```

### Cassandra Query Optimization

**Batch Reads**:
```cql
-- ❌ Bad: Multiple queries
SELECT * FROM device_readings WHERE device_id = 'DEV_001' AND date = '2024-12-01';
SELECT * FROM device_readings WHERE device_id = 'DEV_001' AND date = '2024-12-02';
SELECT * FROM device_readings WHERE device_id = 'DEV_001' AND date = '2024-12-03';

-- ✅ Good: Single query with IN
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' 
  AND date IN ('2024-12-01', '2024-12-02', '2024-12-03');
```

**Limit Results**:
```cql
-- Add LIMIT to prevent large result sets
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001' AND date = '2024-12-02'
LIMIT 1000;

-- Use pagination with paging state
-- (automatically handled by drivers)
```

### Redis Query Optimization

**Use Pipelines**:
```javascript
// ❌ Bad: Multiple round trips
const balance = await redis.get('user:USR_12345:balance');
const tier = await redis.get('user:USR_12345:tier');
const orders = await redis.lrange('user:USR_12345:orders', 0, -1);

// ✅ Good: Single round trip
const pipeline = redis.pipeline();
pipeline.get('user:USR_12345:balance');
pipeline.get('user:USR_12345:tier');
pipeline.lrange('user:USR_12345:orders', 0, -1);
const results = await pipeline.exec();
```

**Use Lua Scripts**:
```lua
-- Atomic operations with Lua
local balance = redis.call('GET', KEYS[1])
if tonumber(balance) >= tonumber(ARGV[1]) then
  redis.call('DECRBY', KEYS[1], ARGV[1])
  redis.call('INCR', KEYS[2])
  return 1
else
  return 0
end
```

```javascript
// Execute
const result = await redis.eval(
  luaScript,
  2,  // Number of keys
  'user:USR_12345:balance',
  'user:USR_12345:order_count',
  100  // Amount to deduct
);
```

---

## Aggregation Pipelines

### MongoDB Aggregation

**Basic Pipeline**:
```javascript
db.device_readings.aggregate([
  // Stage 1: Filter
  {
    $match: {
      device_id: "DEV_001",
      timestamp: {
        $gte: ISODate("2024-12-01"),
        $lt: ISODate("2024-12-02")
      }
    }
  },
  
  // Stage 2: Group and calculate
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d %H:00",
          date: "$timestamp"
        }
      },
      avgTemp: { $avg: "$temperature" },
      minTemp: { $min: "$temperature" },
      maxTemp: { $max: "$temperature" },
      count: { $sum: 1 }
    }
  },
  
  // Stage 3: Sort
  {
    $sort: { _id: 1 }
  },
  
  // Stage 4: Project
  {
    $project: {
      hour: "$_id",
      avgTemp: { $round: ["$avgTemp", 2] },
      minTemp: 1,
      maxTemp: 1,
      count: 1,
      _id: 0
    }
  }
])
```

**Advanced: Lookup (Join)**:
```javascript
db.orders.aggregate([
  // Join with users collection
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "userId",
      as: "user"
    }
  },
  
  // Unwind array
  {
    $unwind: "$user"
  },
  
  // Filter
  {
    $match: {
      "user.subscriptionTier": "premium"
    }
  },
  
  // Group by category
  {
    $group: {
      _id: "$category",
      totalRevenue: { $sum: "$amount" },
      orderCount: { $sum: 1 }
    }
  }
])
```

### Elasticsearch Aggregations

**Metrics Aggregation**:
```json
GET /device_readings/_search
{
  "size": 0,
  "query": {
    "range": {
      "timestamp": {
        "gte": "2024-12-01",
        "lt": "2024-12-02"
      }
    }
  },
  "aggs": {
    "temp_stats": {
      "stats": {
        "field": "temperature"
      }
    },
    "avg_humidity": {
      "avg": {
        "field": "humidity"
      }
    }
  }
}
```

**Bucket Aggregation**:
```json
GET /services/_search
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category",
        "size": 10
      },
      "aggs": {
        "avg_rating": {
          "avg": {
            "field": "rating"
          }
        },
        "price_ranges": {
          "range": {
            "field": "pricing.basePrice",
            "ranges": [
              { "to": 50 },
              { "from": 50, "to": 100 },
              { "from": 100 }
            ]
          }
        }
      }
    }
  }
}
```

---

## Performance Monitoring

### MongoDB

```javascript
// Enable profiling
db.setProfilingLevel(2, { slowms: 100 })  // Log queries > 100ms

// Check slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 })

// Index recommendations
db.collection.aggregate([{ $indexStats: {} }])
```

### Cassandra

```bash
# nodetool for monitoring
nodetool tablestats keyspace.table
nodetool cfstats

# Check for wide partitions
nodetool tablehistograms keyspace.table
```

### Redis

```bash
# Monitor commands in real-time
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# Slow log
SLOWLOG GET 10
```

This comprehensive guide covers indexing and querying strategies for all databases in the Smart Services Platform!
