# Distributed Systems Concepts

## Table of Contents
1. [CAP Theorem](#cap-theorem)
2. [Transactions in NoSQL](#transactions-in-nosql)
3. [Concurrency Control](#concurrency-control)
4. [Replication Strategies](#replication-strategies)
5. [Sharding & Data Distribution](#sharding--data-distribution)
6. [Load Balancing](#load-balancing)
7. [Consistency Models](#consistency-models)

---

## CAP Theorem

### What is CAP?
The CAP theorem states that a distributed system can provide only **TWO** of these three guarantees simultaneously:

1. **Consistency (C)**: Every read receives the most recent write
2. **Availability (A)**: Every request receives a response (success/failure)
3. **Partition Tolerance (P)**: System continues despite network failures

### Visual Representation
```
        Consistency
           /\
          /  \
         /    \
        /  CA  \
       /________\
   CP            AP
 /                  \
Partition -------- Availability
Tolerance
```

### Our Databases & CAP

#### MongoDB (CP - Consistency + Partition Tolerance)
**Choice**: Prioritizes consistency over availability during network partitions

**How it works**:
```javascript
// MongoDB ensures strong consistency
// Write with majority concern
db.users.updateOne(
  { userId: "USR_12345" },
  { $set: { balance: 1000 } },
  { writeConcern: { w: "majority" } }
)

// Read from primary (always consistent)
db.users.findOne({ userId: "USR_12345" }, { readPreference: "primary" })
```

**Trade-off**:
- ✅ Guaranteed data consistency
- ✅ No stale reads
- ❌ May be unavailable during partitions
- ❌ Higher latency for distributed writes

**Use Case**: Financial transactions, user profiles where accuracy > availability

---

#### Redis (CP with Redis Cluster)
**Choice**: Strong consistency with partition tolerance

**How it works**:
```bash
# Single Redis instance: CA (no partition tolerance)
# Redis Cluster: CP (uses quorum for consistency)

# Write to cluster
SET user:USR_12345 '{"balance": 1000}'

# Hash slot: CRC16(key) % 16384
# Key goes to specific node based on hash slot
```

**Trade-off**:
- ✅ Strong consistency (single-threaded)
- ✅ Fast reads/writes
- ❌ Limited partition tolerance (single instance)
- ✅ Better with Redis Cluster

**Use Case**: Session management, caching where consistency matters

---

#### Apache Cassandra (AP - Availability + Partition Tolerance)
**Choice**: Prioritizes availability and partition tolerance

**How it works**:
```cql
-- Tunable consistency levels
-- Write with QUORUM (N/2 + 1 nodes)
INSERT INTO device_readings (device_id, timestamp, value)
VALUES ('DEV_001', now(), 72.5)
USING CONSISTENCY QUORUM;

-- Read with eventual consistency
SELECT * FROM device_readings 
WHERE device_id = 'DEV_001'
CONSISTENCY ONE;
```

**Consistency Levels**:
- `ONE`: Fastest, least consistent (1 node responds)
- `QUORUM`: Balanced (majority of nodes respond)
- `ALL`: Slowest, most consistent (all nodes respond)

**Trade-off**:
- ✅ Always available (no single point of failure)
- ✅ Handles network partitions gracefully
- ❌ Eventual consistency (temporary inconsistencies)
- ✅ Linear scalability

**Use Case**: IoT sensor data, logs where availability > immediate consistency

---

#### Neo4j (CA - Consistency + Availability)
**Choice**: Single node = CA, Causal Cluster = CP

**How it works**:
```cypher
// Single instance: ACID transactions
BEGIN
MATCH (u:User {userId: 'USR_12345'})
SET u.balance = u.balance - 100
CREATE (t:Transaction {amount: 100, timestamp: datetime()})
CREATE (u)-[:MADE_TRANSACTION]->(t)
COMMIT

// Causal Cluster: Leader handles writes
// Followers handle reads
```

**Trade-off**:
- ✅ ACID transactions
- ✅ Strong consistency
- ❌ Single point of failure (single instance)
- ⚠️ Vertical scaling challenges

**Use Case**: Social graphs, recommendations where relationships are critical

---

#### Elasticsearch (AP - Availability + Partition Tolerance)
**Choice**: Prioritizes availability for search

**How it works**:
```json
// Near real-time search (1-second refresh)
PUT /services_search/_doc/1
{
  "serviceName": "Smart Cleaning",
  "rating": 4.8
}

// Document searchable after refresh (default 1s)
GET /services_search/_search
{
  "query": { "match": { "serviceName": "cleaning" } }
}
```

**Trade-off**:
- ✅ Always available for search
- ✅ Handles shard failures
- ❌ Eventually consistent (1s default)
- ✅ Distributed search

**Use Case**: Full-text search where slight delay is acceptable

---

## Transactions in NoSQL

### MongoDB Transactions (ACID)

**Multi-Document Transactions**:
```javascript
const session = client.startSession();

try {
  session.startTransaction();
  
  // Deduct from user balance
  await db.users.updateOne(
    { userId: "USR_12345" },
    { $inc: { balance: -100 } },
    { session }
  );
  
  // Create order
  await db.orders.insertOne(
    {
      orderId: "ORD_001",
      userId: "USR_12345",
      amount: 100,
      status: "pending"
    },
    { session }
  );
  
  await session.commitTransaction();
  console.log("Transaction successful");
} catch (error) {
  await session.abortTransaction();
  console.log("Transaction aborted:", error);
} finally {
  session.endSession();
}
```

**Properties**:
- ✅ ACID guarantees
- ✅ Multi-document atomicity
- ✅ Rollback on failure
- ❌ Performance overhead

---

### Cassandra Lightweight Transactions

**Compare-And-Set (CAS)**:
```cql
-- Only update if condition is met
UPDATE users
SET balance = 900
WHERE user_id = 'USR_12345'
IF balance = 1000;

-- Insert only if not exists
INSERT INTO users (user_id, email, balance)
VALUES ('USR_12345', 'user@example.com', 1000)
IF NOT EXISTS;
```

**Paxos Consensus**:
- Uses Paxos algorithm for consensus
- Slower than regular writes (4x latency)
- Not full ACID transactions

**Batches (Atomic within partition)**:
```cql
BEGIN BATCH
  INSERT INTO device_readings (device_id, date, timestamp, value)
  VALUES ('DEV_001', '2024-12-02', now(), 72.5);
  
  UPDATE devices
  SET last_reading = 72.5
  WHERE device_id = 'DEV_001';
APPLY BATCH;
```

**Limitations**:
- ❌ Not true transactions
- ⚠️ Only atomic if same partition key
- ✅ Good for idempotent operations

---

### Redis Transactions

**MULTI/EXEC**:
```bash
# Queued commands executed atomically
MULTI
SET user:USR_12345:balance 900
SADD user:USR_12345:orders "ORD_001"
ZADD leaderboard:energy 245.8 "USR_12345"
EXEC
```

**Properties**:
- ✅ Atomic execution
- ✅ Isolated (no other commands interleave)
- ❌ No rollback on error
- ⚠️ All or nothing execution

**Optimistic Locking (WATCH)**:
```bash
WATCH user:USR_12345:balance
current_balance=$(GET user:USR_12345:balance)
if [ $current_balance -ge 100 ]; then
  MULTI
  DECRBY user:USR_12345:balance 100
  INCR user:USR_12345:order_count
  EXEC
else
  UNWATCH
fi
```

---

### Neo4j Transactions (Full ACID)

**Explicit Transactions**:
```cypher
// Begin transaction
BEGIN

// Multiple operations
MATCH (u:User {userId: 'USR_12345'})
CREATE (o:Order {orderId: 'ORD_001', amount: 100})
CREATE (u)-[:PLACED]->(o)
SET u.totalSpent = u.totalSpent + 100

// Commit or rollback
COMMIT
// or ROLLBACK on error
```

**Properties**:
- ✅ Full ACID
- ✅ Multi-statement transactions
- ✅ Automatic rollback on failure
- ✅ Isolation levels

---

## Concurrency Control

### Optimistic Concurrency Control

**MongoDB Version Field**:
```javascript
// Document with version
{
  userId: "USR_12345",
  balance: 1000,
  version: 5
}

// Update with version check
const result = await db.users.updateOne(
  { userId: "USR_12345", version: 5 },
  { 
    $set: { balance: 900 },
    $inc: { version: 1 }
  }
);

if (result.matchedCount === 0) {
  // Conflict! Retry with fresh data
  console.log("Concurrent modification detected");
}
```

**Redis WATCH**:
```bash
# Watch key for changes
WATCH user:USR_12345:balance

# Get current value
GET user:USR_12345:balance

# If key modified between WATCH and EXEC, transaction fails
MULTI
SET user:USR_12345:balance 900
EXEC
```

---

### Pessimistic Locking

**MongoDB findAndModify**:
```javascript
// Atomic find and update
const result = await db.users.findOneAndUpdate(
  { userId: "USR_12345", balance: { $gte: 100 } },
  { $inc: { balance: -100 } },
  { returnDocument: 'after' }
);

if (!result.value) {
  console.log("Insufficient funds");
}
```

**Cassandra IF Condition**:
```cql
-- Conditional update (serializable)
UPDATE accounts
SET balance = balance - 100
WHERE user_id = 'USR_12345'
IF balance >= 100;
```

---

### Multi-Version Concurrency Control (MVCC)

**How It Works**:
1. Each write creates new version
2. Readers see snapshot at their timestamp
3. No read locks needed
4. Writers don't block readers

**PostgreSQL Example** (for comparison):
```sql
-- Transaction 1 sees version at T1
BEGIN; -- T1
SELECT balance FROM users WHERE user_id = 'USR_12345'; -- 1000

-- Transaction 2 updates (creates new version)
BEGIN; -- T2
UPDATE users SET balance = 900 WHERE user_id = 'USR_12345';
COMMIT;

-- Transaction 1 still sees old version (1000)
SELECT balance FROM users WHERE user_id = 'USR_12345'; -- 1000
COMMIT;
```

**Cassandra's Approach**:
- Writes create timestamped versions
- Reads get latest timestamp ≤ read timestamp
- Eventual consistency through anti-entropy repair

---

## Replication Strategies

### Master-Slave Replication (MongoDB)

**Architecture**:
```
Primary (Master)
    ├── Secondary 1 (Slave)
    ├── Secondary 2 (Slave)
    └── Secondary 3 (Slave)

Writes → Primary only
Reads → Primary or Secondaries (configurable)
```

**Configuration**:
```javascript
// Replica set configuration
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },  // Primary
    { _id: 1, host: "mongo2:27017", priority: 1 },  // Secondary
    { _id: 2, host: "mongo3:27017", priority: 1 }   // Secondary
  ]
})

// Write concern (wait for replication)
db.users.insertOne(
  { userId: "USR_12345", email: "user@example.com" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
)

// Read preference
db.users.find({}).readPref("secondaryPreferred")
```

**Advantages**:
- ✅ High availability (auto-failover)
- ✅ Read scalability (distribute reads)
- ✅ Data redundancy
- ❌ Single master bottleneck for writes

**Failover Process**:
1. Primary goes down
2. Secondaries detect failure (heartbeat)
3. Election algorithm selects new primary
4. New primary takes over (~10-30 seconds)

---

### Multi-Master Replication (Cassandra)

**Architecture**:
```
Node 1 ←→ Node 2 ←→ Node 3
  ↕         ↕         ↕
Node 4 ←→ Node 5 ←→ Node 6

All nodes are equal (no master)
Writes can go to any node
```

**Replication Factor (RF)**:
```cql
-- Create keyspace with RF=3
CREATE KEYSPACE smart_platform
WITH REPLICATION = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3,
  'datacenter2': 2
};
```

**Data Distribution**:
```
Token Range: 0 - 2^63
Node 1: tokens 0         - 21474836
Node 2: tokens 21474837  - 42949672
Node 3: tokens 42949673  - 64424508
...

Key "DEV_001" → hash → token 35000000 → Node 2 (primary)
                                     → Node 3 (replica)
                                     → Node 4 (replica)
```

**Advantages**:
- ✅ No single point of failure
- ✅ Write scalability (any node)
- ✅ Linear scalability
- ❌ Eventual consistency challenges

**Conflict Resolution**:
- **Last Write Wins (LWW)**: Highest timestamp wins
- **Vector Clocks**: Track causality
- **Application-level resolution**: Custom logic

---

### Synchronous vs Asynchronous Replication

#### Synchronous (Strong Consistency)
```
Client → Primary → Wait for all replicas → ACK → Client
                ↓
         [Secondary 1]
                ↓
         [Secondary 2]
```

**Characteristics**:
- ✅ Strong consistency
- ❌ Higher latency
- ❌ Availability issues if replica down

**Example (MongoDB)**:
```javascript
// Wait for majority of replicas
{ writeConcern: { w: "majority" } }
```

#### Asynchronous (Eventual Consistency)
```
Client → Primary → ACK → Client
                ↓ (background)
         [Secondary 1]
                ↓
         [Secondary 2]
```

**Characteristics**:
- ✅ Low latency
- ✅ High availability
- ❌ Temporary inconsistency

**Example (Cassandra)**:
```cql
-- Write returns immediately
INSERT INTO device_readings (...)
VALUES (...)
USING CONSISTENCY ONE;
```

---

## Sharding & Data Distribution

### Sharding Overview

**What is Sharding?**
Horizontal partitioning of data across multiple machines

```
Unsharded:
Database 1: [All 10M users]

Sharded:
Shard 1: [Users A-E] (2.5M users)
Shard 2: [Users F-J] (2.5M users)
Shard 3: [Users K-O] (2.5M users)
Shard 4: [Users P-Z] (2.5M users)
```

---

### MongoDB Sharding

**Architecture**:
```
Application
     ↓
  mongos (Router)
     ↓
Config Servers (Metadata)
     ↓
  ├── Shard 1 (Replica Set)
  ├── Shard 2 (Replica Set)
  └── Shard 3 (Replica Set)
```

**Shard Key Selection**:
```javascript
// Hash-based sharding (even distribution)
sh.shardCollection("smart_platform.users", { userId: "hashed" })

// Range-based sharding (range queries efficient)
sh.shardCollection("smart_platform.devices", { userId: 1, deviceId: 1 })

// Good shard keys:
// ✅ High cardinality (many unique values)
// ✅ Even distribution
// ✅ Matches query patterns
// ❌ Monotonically increasing (timestamp) - creates hotspot
```

**Chunk Management**:
```
Shard Key Range: userId (hashed)
Chunk 1: hash(userId) [0 - 1000]         → Shard 1
Chunk 2: hash(userId) [1001 - 2000]     → Shard 2
Chunk 3: hash(userId) [2001 - 3000]     → Shard 3

Chunk size: 64MB (default)
Auto-balancer moves chunks between shards
```

---

### Cassandra Partitioning

**Consistent Hashing**:
```
Ring: 0 → 2^63 - 1

Token Assignment:
Node 1: 0
Node 2: 2^62
Node 3: 2^63 - 1

Key "DEV_001" → MD5 hash → token 45000000000
                         → Primary: Node 2
                         → Replicas: Node 3, Node 1 (RF=3)
```

**Partition Key**:
```cql
-- Single partition key
CREATE TABLE device_readings (
    device_id text,      -- Partition key
    timestamp timeuuid,  -- Clustering key
    value double,
    PRIMARY KEY (device_id, timestamp)
);
-- All data for device_id = 'DEV_001' on same node(s)

-- Composite partition key
CREATE TABLE device_readings_v2 (
    device_id text,
    date text,           -- Limits partition size
    timestamp timeuuid,
    value double,
    PRIMARY KEY ((device_id, date), timestamp)
);
-- Data distributed by (device_id, date) combination
```

**Virtual Nodes (vnodes)**:
```
Traditional: Each node = 1 token
Node 1: token 0
Node 2: token 2^62

With vnodes: Each node = 256 tokens
Node 1: tokens [0, 1000, 5000, 8000, ...]
Node 2: tokens [500, 3000, 6000, 9500, ...]

Benefits:
✅ Better load distribution
✅ Faster rebalancing when adding nodes
✅ Handles heterogeneous hardware
```

---

### Avoiding Hotspots

**Problem**:
```cql
-- Bad: Timestamp partition key
CREATE TABLE logs (
    timestamp timeuuid,  -- Sequential! All writes go to one node
    message text,
    PRIMARY KEY (timestamp)
);
```

**Solution**:
```cql
-- Good: Composite key with bucketing
CREATE TABLE logs (
    bucket int,          -- Random 1-100 or time-based bucket
    timestamp timeuuid,
    message text,
    PRIMARY KEY (bucket, timestamp)
);

-- Writes distributed across 100 partitions
```

---

## Load Balancing

### Application-Level (MongoDB)

**mongos Router**:
```javascript
// Client connects to mongos (transparent)
const client = new MongoClient("mongodb://mongos1:27017,mongos2:27017");

// mongos routes queries to correct shard(s)
db.users.find({ userId: "USR_12345" }); // → Single shard
db.users.find({ email: "user@example.com" }); // → All shards (scatter-gather)
```

**Read Distribution**:
```javascript
// Distribute reads to secondaries
db.users.find({}).readPref("primaryPreferred");

// secondaryPreferred: Try secondary, fallback to primary
// nearest: Lowest network latency
```

---

### Client-Side (Cassandra)

**Driver Load Balancing**:
```javascript
const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['node1', 'node2', 'node3'],
  localDataCenter: 'datacenter1',
  policies: {
    loadBalancing: new cassandra.policies.loadBalancing.DCAwareRoundRobinPolicy('datacenter1')
  }
});

// Driver automatically:
// 1. Routes queries to correct coordinator
// 2. Round-robins among replicas
// 3. Retries failed queries
// 4. Adapts to topology changes
```

**Token-Aware Routing**:
```
Query: SELECT * FROM device_readings WHERE device_id = 'DEV_001'

Driver:
1. Calculates hash('DEV_001') = token 45000000000
2. Checks token → node mapping
3. Sends directly to Node 2 (no coordinator hop)
```

---

### Redis Cluster

**Hash Slot Routing**:
```bash
# 16384 hash slots (0-16383)
# CRC16(key) % 16384 = slot

Key "user:USR_12345" → CRC16 → slot 8912 → Node 2

Cluster topology:
Node 1: slots 0-5460
Node 2: slots 5461-10922
Node 3: slots 10923-16383
```

**Client-Side Routing**:
```javascript
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: 'node1', port: 7000 },
  { host: 'node2', port: 7001 },
  { host: 'node3', port: 7002 }
]);

// Client automatically routes to correct node
cluster.set('user:USR_12345', '{"balance": 1000}');
// → Calculated slot → Node 2
```

---

## Consistency Models

### Strong Consistency
**Definition**: All reads see the most recent write

**Example (MongoDB)**:
```javascript
// Write to primary, wait for majority
db.users.updateOne(
  { userId: "USR_12345" },
  { $set: { balance: 900 } },
  { writeConcern: { w: "majority" } }
);

// Read from primary
db.users.findOne(
  { userId: "USR_12345" },
  { readPreference: "primary" }
);
// Always sees balance = 900
```

---

### Eventual Consistency
**Definition**: Replicas converge over time, temporary inconsistencies allowed

**Example (Cassandra)**:
```cql
-- Write to 1 node
INSERT INTO users (user_id, balance) VALUES ('USR_12345', 900)
USING CONSISTENCY ONE;
-- Returns immediately

-- Read from different node immediately after
SELECT balance FROM users WHERE user_id = 'USR_12345'
USING CONSISTENCY ONE;
-- May still see old value (1000) for a few milliseconds
```

**Convergence Time**: Typically milliseconds to seconds

---

### Causal Consistency
**Definition**: Reads see writes that causally precede them

**Example (Cassandra with LWW)**:
```
Time T1: Write A (balance = 900) → timestamp 100
Time T2: Write B (balance = 850) → timestamp 200

Any node reading at T3:
- Sees Write B (timestamp 200) - most recent
- Causality preserved through timestamps
```

---

### Session Consistency
**Definition**: Guarantees within a single session/client

**Example (MongoDB)**:
```javascript
const session = client.startSession({ causalConsistency: true });

// Write
await db.users.updateOne(
  { userId: "USR_12345" },
  { $set: { balance: 900 } },
  { session }
);

// Read in same session
const user = await db.users.findOne(
  { userId: "USR_12345" },
  { session }
);
// Guaranteed to see balance = 900
```

---

## Summary Table

| Concept | MongoDB | Redis | Cassandra | Neo4j |
|---------|---------|-------|-----------|-------|
| **CAP** | CP | CP | AP | CA/CP |
| **Transactions** | ACID | Atomic | LWT (limited) | ACID |
| **Replication** | Master-Slave | Master-Slave | Multi-Master | Leader-Follower |
| **Sharding** | Hash/Range | Hash Slots | Consistent Hashing | Limited |
| **Consistency** | Strong (tunable) | Strong | Tunable | Strong |
| **Concurrency** | MVCC | Single-threaded | Last-Write-Wins | MVCC |
| **Load Balancing** | mongos router | Client-side | Client-side | Causal cluster |

---

## Best Practices

### 1. Choose Right Consistency Level
- **Strong**: Financial transactions
- **Eventual**: Analytics, logs
- **Session**: User-facing applications

### 2. Design for Failures
- Assume nodes will fail
- Use replication factor ≥ 3
- Implement retry logic with exponential backoff

### 3. Monitor Replication Lag
```javascript
// MongoDB replication lag
db.printReplicationInfo()
db.printSlaveReplicationInfo()

// Alert if lag > threshold (e.g., 30 seconds)
```

### 4. Test Partition Scenarios
```bash
# Simulate network partition
iptables -A INPUT -s 192.168.1.100 -j DROP

# Observe system behavior
# Verify failover mechanisms
```

### 5. Optimize Shard Keys
- High cardinality
- Even distribution
- Match query patterns
- Avoid monotonic keys

This guide covers the distributed systems concepts needed for the Smart Services Platform!
