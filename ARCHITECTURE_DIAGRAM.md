# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │  IoT Devices │         │
│  │   (React)    │  │   (Native)   │  │   (MQTT)     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTPS/REST/WebSocket
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    APPLICATION LAYER                              │
├────────────────────────────┼─────────────────────────────────────┤
│                            │                                      │
│  ┌─────────────────────────▼────────────────────────┐           │
│  │         API Gateway / Load Balancer              │           │
│  │         (NGINX / HAProxy)                         │           │
│  └─────────────────┬────────────────────────────────┘           │
│                    │                                              │
│  ┌─────────────────┴───────────────────────────┐                │
│  │                                              │                │
│  │         ┌──────────────┬──────────────┐     │                │
│  │         │              │              │     │                │
│  │    ┌────▼───┐   ┌─────▼────┐   ┌────▼───┐ │                │
│  │    │  Auth   │   │  Device  │   │Service │ │                │
│  │    │ Service │   │ Service  │   │Service │ │                │
│  │    └────┬────┘   └────┬─────┘   └────┬───┘ │                │
│  │         │             │               │     │                │
│  │         │   Node.js / Express.js      │     │                │
│  │         └─────────────┼───────────────┘     │                │
│  └───────────────────────┼─────────────────────┘                │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ Database Drivers
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                   DATA LAYER                                      │
├──────────────────────────┼───────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       MongoDB                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │ Primary  │  │Secondary │  │Secondary │                 │ │
│  │  │  Shard1  ├──┤  Shard1  ├──┤  Shard1  │                 │ │
│  │  └────┬─────┘  └──────────┘  └──────────┘                 │ │
│  │       │         Replica Set 1                              │ │
│  │  ┌────▼─────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │ Primary  │  │Secondary │  │Secondary │                 │ │
│  │  │  Shard2  ├──┤  Shard2  ├──┤  Shard2  │                 │ │
│  │  └──────────┘  └──────────┘  └──────────┘                 │ │
│  │                 Replica Set 2                              │ │
│  │                                                             │ │
│  │  Data: Users, Devices, Services                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Redis Cluster                            │ │
│  │  ┌────────┐     ┌────────┐     ┌────────┐                 │ │
│  │  │ Master │────►│Replica │     │ Master │                 │ │
│  │  │ Node 1 │     │ Node 1 │     │ Node 2 │                 │ │
│  │  │Slots   │     └────────┘     │Slots   │                 │ │
│  │  │0-5460  │                    │5461-   │                 │ │
│  │  └────────┘                    │10922   │                 │ │
│  │                                 └────┬───┘                 │ │
│  │                                      │                     │ │
│  │                           ┌──────────▼─┐                   │ │
│  │                           │  Replica   │                   │ │
│  │                           │  Node 2    │                   │ │
│  │                           └────────────┘                   │ │
│  │                                                             │ │
│  │  Data: Sessions, Cache, Rate Limits                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Apache Cassandra Ring                          │ │
│  │                                                             │ │
│  │         Node 1          Node 6          Node 5             │ │
│  │       (Tokens           (Tokens         (Tokens            │ │
│  │        0-xxx)           xxx-yyy)        yyy-zzz)           │ │
│  │            ╲               │               ╱                │ │
│  │             ╲              │              ╱                 │ │
│  │              ╲             │             ╱                  │ │
│  │               ╲            │            ╱                   │ │
│  │      Node 2────┼───────────┼───────────┼────Node 4         │ │
│  │                │                       │                    │ │
│  │                └───────Node 3──────────┘                    │ │
│  │                                                             │ │
│  │  Data: Device Readings, Logs, Analytics Events             │ │
│  │  Replication Factor: 3                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Neo4j Causal Cluster                     │ │
│  │                                                             │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │   Core 1   │  │   Core 2   │  │   Core 3   │           │ │
│  │  │  (Leader)  │◄─┤ (Follower) │◄─┤ (Follower) │           │ │
│  │  └─────┬──────┘  └────────────┘  └────────────┘           │ │
│  │        │  Writes                                           │ │
│  │        │                                                    │ │
│  │   ┌────▼─────┐              ┌──────────┐                  │ │
│  │   │ Read     │              │  Read    │                  │ │
│  │   │ Replica 1│              │ Replica 2│                  │ │
│  │   └──────────┘              └──────────┘                  │ │
│  │                                                             │ │
│  │  Data: User Relationships, Service Recommendations         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Elasticsearch Cluster                        │ │
│  │                                                             │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │   Master   │  │   Data     │  │   Data     │           │ │
│  │  │   Node     │  │   Node 1   │  │   Node 2   │           │ │
│  │  └─────┬──────┘  └────────────┘  └────────────┘           │ │
│  │        │                                                    │ │
│  │        │         Index: services_search                    │ │
│  │        │         Shards: 3                                 │ │
│  │        │         Replicas: 2                               │ │
│  │        │                                                    │ │
│  │  ┌─────▼──────┐            ┌──────────┐                   │ │
│  │  │  Kibana    │            │ Logstash │                   │ │
│  │  │ Visualize  │            │ Ingest   │                   │ │
│  │  └────────────┘            └──────────┘                   │ │
│  │                                                             │ │
│  │  Data: Service Search Index, Log Analytics                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Login Flow
```
┌──────┐                                                    
│Client│                                                    
└───┬──┘                                                    
    │                                                       
    │ 1. POST /auth/login                                  
    │ {email, password}                                    
    │                                                       
    ▼                                                       
┌────────────┐                                             
│API Gateway │                                             
└─────┬──────┘                                             
      │                                                     
      │ 2. Route to Auth Service                          
      │                                                     
      ▼                                                     
┌──────────────┐        3. Verify         ┌──────────┐   
│ Auth Service │───────credentials───────►│ MongoDB  │   
└──────┬───────┘                           └──────────┘   
       │                                                    
       │ 4. Create Session                                
       │                                                    
       ▼                                                    
   ┌───────┐                                               
   │ Redis │◄──── SET session:abc123                      
   └───┬───┘      TTL: 3600 seconds                       
       │                                                    
       │ 5. Return JWT token                              
       │                                                    
       ▼                                                    
   ┌──────┐                                                
   │Client│◄──── {token: "eyJ...", userId: "USR_12345"}  
   └──────┘                                                
```

### 2. Device Reading Flow
```
┌────────────┐                                             
│IoT Device  │                                             
│(Thermostat)│                                             
└─────┬──────┘                                             
      │                                                     
      │ 1. POST /devices/DEV_001/readings                 
      │ {temperature: 72.5, humidity: 45}                 
      │                                                     
      ▼                                                     
┌──────────────┐                                           
│Device Service│                                           
└───────┬──────┘                                           
        │                                                   
        │ 2. Parallel Writes                              
        │                                                   
    ┌───┴────────┬───────────┐                           
    │            │           │                            
    ▼            ▼           ▼                            
┌──────────┐ ┌──────┐  ┌─────────┐                      
│Cassandra │ │Redis │  │ MongoDB │                      
│          │ │      │  │         │                      
│INSERT    │ │SET   │  │UPDATE   │                      
│device_   │ │device│  │devices  │                      
│readings  │ │:DEV_ │  │SET last │                      
│          │ │001   │  │Reading  │                      
│(Long-term│ │(Cache│  │(Latest) │                      
│ storage) │ │ 5min)│  │         │                      
└──────────┘ └──────┘  └─────────┘                      
                                                          
      │                                                    
      │ 3. WebSocket Push                                
      │                                                    
      ▼                                                    
┌──────────┐                                              
│Connected │                                              
│ Clients  │◄──── {deviceId: "DEV_001", temp: 72.5}     
└──────────┘                                              
```

### 3. Service Search Flow
```
┌──────┐                                                  
│Client│                                                  
└───┬──┘                                                  
    │                                                     
    │ 1. GET /services/search?q=cleaning                
    │                                                     
    ▼                                                     
┌────────────────┐                                       
│Service Service │                                       
└────────┬───────┘                                       
         │                                                
         │ 2. Full-text search                          
         │                                                
         ▼                                                
    ┌──────────────┐                                     
    │Elasticsearch │                                     
    │              │                                     
    │• Tokenize    │                                     
    │• Match docs  │                                     
    │• Score       │                                     
    │• Aggregate   │                                     
    └──────┬───────┘                                     
           │                                              
           │ 3. Return service IDs                       
           │ [SRV_001, SRV_002, ...]                    
           │                                              
           ▼                                              
    ┌──────────────┐                                     
    │   MongoDB    │                                     
    │              │                                     
    │Find full     │                                     
    │service docs  │                                     
    │by IDs        │                                     
    └──────┬───────┘                                     
           │                                              
           │ 4. Combined results                         
           │                                              
           ▼                                              
       ┌──────┐                                          
       │Client│◄──── {services: [...], aggs: {...}}    
       └──────┘                                          
```

### 4. Recommendation Flow
```
┌──────┐                                                     
│Client│                                                     
└───┬──┘                                                     
    │                                                        
    │ 1. GET /services/recommendations                      
    │                                                        
    ▼                                                        
┌────────────────┐                                          
│Service Service │                                          
└────────┬───────┘                                          
         │                                                   
         │ 2. Graph Traversal Query                        
         │                                                   
         ▼                                                   
    ┌────────┐                                              
    │ Neo4j  │                                              
    │        │                                              
    │ MATCH (me:User {userId: 'USR_12345'})                
    │   -[:FOLLOWS]->(friend:User)                         
    │   -[:SUBSCRIBED_TO]->(service:Service)               
    │ WHERE NOT (me)-[:SUBSCRIBED_TO]->(service)           
    │ RETURN service, COUNT(friend) as score               
    │        │                                              
    └────┬───┘                                              
         │                                                   
         │ 3. Service IDs + Scores                         
         │                                                   
         ▼                                                   
    ┌──────────┐                                            
    │ MongoDB  │                                            
    │          │                                            
    │ Fetch    │                                            
    │ service  │                                            
    │ details  │                                            
    └────┬─────┘                                            
         │                                                   
         │ 4. Ranked recommendations                       
         │                                                   
         ▼                                                   
     ┌──────┐                                               
     │Client│◄──── {recommendations: [...], reasons: [...]}
     └──────┘                                               
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Cloud Infrastructure                   │
│                    (AWS / Azure / GCP)                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Load Balancer (ALB/ELB)              │  │
│  │         SSL Termination, Health Checks            │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │          Auto Scaling Group (EC2/VMs)             │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │  │  Node.js   │  │  Node.js   │  │  Node.js   │  │  │
│  │  │   App 1    │  │   App 2    │  │   App 3    │  │  │
│  │  │(Container) │  │(Container) │  │(Container) │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │  │
│  │        │                │                │         │  │
│  └────────┼────────────────┼────────────────┼─────────┘  │
│           │                │                │             │
│  ┌────────┴────────────────┴────────────────┴─────────┐  │
│  │              VPC (Virtual Private Cloud)          │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                    │  │
│  │  ┌────────────────┐  ┌─────────────────┐         │  │
│  │  │  MongoDB Atlas │  │  Redis Cloud    │         │  │
│  │  │  (Managed)     │  │  (Managed)      │         │  │
│  │  └────────────────┘  └─────────────────┘         │  │
│  │                                                    │  │
│  │  ┌────────────────┐  ┌─────────────────┐         │  │
│  │  │  DataStax      │  │  Neo4j Aura     │         │  │
│  │  │  Astra         │  │  (Managed)      │         │  │
│  │  │  (Cassandra)   │  │                 │         │  │
│  │  └────────────────┘  └─────────────────┘         │  │
│  │                                                    │  │
│  │  ┌────────────────────────────────────┐           │  │
│  │  │   Elasticsearch Service            │           │  │
│  │  │   (Managed)                        │           │  │
│  │  └────────────────────────────────────┘           │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │             Monitoring & Logging                   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  • CloudWatch / Azure Monitor                      │  │
│  │  • Prometheus + Grafana                            │  │
│  │  • ELK Stack (Logs)                                │  │
│  │  • Application Insights                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Scalability Strategy

```
Current (MVP)                  Future (Scale)
─────────────                  ──────────────

MongoDB:                       MongoDB:
• 1 Replica Set        →       • 4 Shards × 3 Replicas
• 3 Nodes                      • 12 Nodes total
• 100GB storage                • 10TB distributed

Redis:                         Redis:
• 1 Master, 1 Replica  →       • 6-node Cluster
• 2GB memory                   • 64GB distributed
                               • Read replicas per region

Cassandra:                     Cassandra:
• 3-node cluster       →       • 24-node ring
• Single DC                    • Multi-DC (3 regions)
• RF=3                         • RF=3 per DC

Neo4j:                         Neo4j:
• Single instance      →       • Causal Cluster
                               • 3 Core + 5 Read Replicas

Elasticsearch:                 Elasticsearch:
• 1 node               →       • 6 nodes (2 master, 4 data)
• 1 index                      • Multiple indices with ILM
• 10GB data                    • 1TB+ distributed

Application:                   Application:
• 2 instances          →       • 20+ instances (auto-scale)
• Single region                • Multi-region deployment
• Manual scaling               • Kubernetes orchestration
```

---

## Notes for Presentation

When showing architecture:
1. **Start high-level**: "5 databases, each with specific role"
2. **Show data flows**: "Here's what happens when device sends data"
3. **Explain redundancy**: "Every database has 2-3 copies for failover"
4. **Highlight scalability**: "Can add nodes without downtime"
5. **Mention monitoring**: "CloudWatch tracks all metrics"

You can draw simplified versions on whiteboard during presentation!
