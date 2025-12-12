# 🚀 Smart Services Platform - Complete Setup Guide

## Current Status
✅ **Backend fully implemented with all 5 NoSQL databases**
✅ **REST API with 20+ endpoints**
✅ **Real-time WebSocket support**
✅ **Authentication & authorization**
✅ **Complete project ready to run**

---

## Prerequisites Installation

### 1. Install Node.js
```powershell
# Download from: https://nodejs.org/
# Install LTS version (20.x or higher)
# Verify installation:
node --version
npm --version
```

### 2. Install Docker Desktop
```powershell
# Download from: https://www.docker.com/products/docker-desktop/
# Install and start Docker Desktop
# Verify installation:
docker --version
docker-compose --version
```

---

## Step-by-Step Setup

### Step 1: Start All Databases (Docker)

```powershell
# Navigate to project directory
cd "c:\Users\HP\Desktop\Adb 1"

# Start all 5 databases
docker-compose up -d

# Check if all containers are running
docker ps

# You should see 5 containers:
# - smart-platform-mongo (MongoDB)
# - smart-platform-redis (Redis)
# - smart-platform-cassandra (Cassandra)
# - smart-platform-neo4j (Neo4j)
# - smart-platform-elasticsearch (Elasticsearch)
```

**Wait 1-2 minutes** for all databases to fully start (especially Cassandra).

---

### Step 2: Install Backend Dependencies

```powershell
cd backend

# Install all npm packages
npm install

# This will install:
# - express, mongoose, ioredis, cassandra-driver, neo4j-driver, @elastic/elasticsearch
# - jsonwebtoken, bcryptjs, cors, dotenv, socket.io
# - and more...
```

---

### Step 3: Test Database Connections

```powershell
# Test if all databases are reachable
npm run test

# You should see:
# ✅ MongoDB: Connected successfully
# ✅ Redis: Connected successfully
# ✅ Cassandra: Connected successfully
# ✅ Neo4j: Connected successfully
# ✅ Elasticsearch: Connected successfully
```

If any connection fails, wait 30 seconds and try again (Cassandra takes time to initialize).

---

### Step 4: Initialize Database Schemas

```powershell
# Create all tables and indices
npm run init-db

# This will:
# - Create Cassandra tables (device_readings, system_logs, analytics_events)
# - Create Elasticsearch index (services)
# - Initialize database schemas
```

---

### Step 5: Seed Sample Data

```powershell
# Populate databases with sample data
npm run seed

# This creates:
# - 2 sample users (john@example.com, jane@example.com)
# - 5 sample devices
# - 6 sample services
# - Neo4j relationships
# - Elasticsearch indexed services
```

**Sample Login Credentials:**
- Email: `john@example.com`
- Password: `password123`

---

### Step 6: Start Backend Server

```powershell
# Start in development mode (auto-restart on changes)
npm run dev

# You should see:
# ✅ MongoDB connected successfully
# ✅ Redis connected successfully
# ✅ Cassandra connected successfully
# ✅ Neo4j connected successfully
# ✅ Elasticsearch connected successfully
# 🎉 Server running on http://localhost:3000
```

**Backend is now live!** 🎉

---

## Testing the API

### Option 1: Using PowerShell

```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get

# Register a new user
$body = @{
    email = "test@example.com"
    password = "test123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.data.token

# Get user devices
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/devices" -Method Get -Headers $headers
```

### Option 2: Using Postman

1. **Download Postman**: https://www.postman.com/downloads/
2. **Import these requests**:

#### Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
**Copy the `token` from response**

#### Get Devices
```
GET http://localhost:3000/api/devices
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Search Services
```
GET http://localhost:3000/api/services/search?q=automation
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Get Recommendations
```
GET http://localhost:3000/api/services/recommendations/personalized
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Frontend Setup

### Option A: Use Existing HTML (Quick Demo)

```powershell
# Install http-server globally
npm install -g http-server

# Navigate back to project root
cd ..

# Start web server
http-server -p 8080

# Open browser to:
# http://localhost:8080/index.html
# http://localhost:8080/interface/dashboard.html
```

### Option B: Create React Frontend (Advanced)

```powershell
# Create React app
npx create-react-app frontend

cd frontend

# Install dependencies
npm install axios react-router-dom socket.io-client recharts

# Update src/App.js to connect to API
# Example API call:
```

```javascript
// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL
});

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};

export const getDevices = async () => {
  const token = localStorage.getItem('token');
  const response = await api.get('/devices', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

## Project Structure

```
Adb 1/
├── docker-compose.yml          # All 5 databases configuration
├── backend/
│   ├── server.js               # Main Express server
│   ├── package.json            # Dependencies
│   ├── .env                    # Configuration
│   ├── config/                 # Database connections
│   │   ├── mongodb.js
│   │   ├── redis.js
│   │   ├── cassandra.js
│   │   ├── neo4j.js
│   │   └── elasticsearch.js
│   ├── models/                 # MongoDB schemas
│   │   ├── User.js
│   │   ├── Device.js
│   │   └── Service.js
│   ├── routes/                 # API endpoints
│   │   ├── auth.js             # Login/register
│   │   ├── users.js            # User profile
│   │   ├── devices.js          # Device management
│   │   ├── services.js         # Service search
│   │   └── analytics.js        # Analytics data
│   ├── middleware/
│   │   └── auth.js             # JWT authentication
│   └── scripts/
│       ├── init-databases.js   # Initialize schemas
│       ├── seed-data.js        # Sample data
│       └── test-connections.js # Test databases
├── interface/                  # HTML mockups
│   ├── dashboard.html
│   ├── services.html
│   └── login.html
└── [documentation files]
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices/register` - Register new device
- `GET /api/devices/:deviceId` - Get device details
- `POST /api/devices/:deviceId/readings` - Post sensor reading
- `GET /api/devices/:deviceId/history` - Get historical data
- `DELETE /api/devices/:deviceId` - Delete device

### Services
- `GET /api/services/search` - Search services
- `GET /api/services/:serviceId` - Get service details
- `GET /api/services/recommendations/personalized` - Get recommendations
- `POST /api/services/:serviceId/subscribe` - Subscribe to service
- `GET /api/services/categories/list` - Get all categories

### Analytics
- `GET /api/analytics/devices/:deviceId` - Device analytics
- `GET /api/analytics/dashboard/stats` - Dashboard stats
- `GET /api/analytics/activity/recent` - Recent activity

---

## Database Access

### MongoDB (Compass)
```
Connection String: mongodb://admin:password123@localhost:27017/?authSource=admin
Database: smart_platform
Collections: users, devices, services
```

### Redis (CLI)
```powershell
docker exec -it smart-platform-redis redis-cli
> KEYS *
> GET session:*
> HGETALL device:realtime:DEV_001
```

### Cassandra (CQL)
```powershell
docker exec -it smart-platform-cassandra cqlsh
> USE smart_platform;
> SELECT * FROM device_readings LIMIT 10;
> DESCRIBE TABLES;
```

### Neo4j (Browser)
```
Open: http://localhost:7474
Username: neo4j
Password: password123

# Sample Cypher queries:
MATCH (n) RETURN n LIMIT 25;
MATCH (u:User)-[:SUBSCRIBED_TO]->(s:Service) RETURN u, s;
```

### Elasticsearch (Browser/Kibana)
```
Open: http://localhost:9200
GET http://localhost:9200/services/_search
```

---

## Troubleshooting

### Docker containers not starting
```powershell
# Check logs
docker-compose logs

# Restart specific container
docker restart smart-platform-cassandra

# Restart all
docker-compose down
docker-compose up -d
```

### Port already in use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F

# Or change port in .env:
# PORT=3001
```

### Cassandra taking too long
```powershell
# Check if Cassandra is ready
docker exec -it smart-platform-cassandra nodetool status

# Wait until you see "UN" (Up Normal) status
```

### npm install fails
```powershell
# Clear cache
npm cache clean --force

# Delete and reinstall
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## Production Deployment Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Set NODE_ENV=production
- [ ] Use cloud-managed databases (MongoDB Atlas, Redis Cloud, etc.)
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure firewall rules
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Load testing

---

## Quick Commands Reference

```powershell
# Start everything
docker-compose up -d
cd backend
npm run dev

# Stop everything
# (Ctrl+C to stop server)
docker-compose down

# View logs
docker-compose logs -f
npm run dev  # Server logs

# Reset everything
docker-compose down -v  # Delete all data
npm run init-db         # Reinitialize
npm run seed            # Reseed data

# Access database containers
docker exec -it smart-platform-mongo mongosh
docker exec -it smart-platform-redis redis-cli
docker exec -it smart-platform-cassandra cqlsh
```

---

## 🎯 You're All Set!

Your complete Smart Services Platform is now running with:
✅ 5 NoSQL databases (MongoDB, Redis, Cassandra, Neo4j, Elasticsearch)
✅ REST API with 20+ endpoints
✅ Real-time WebSocket updates
✅ Authentication & authorization
✅ Sample data loaded

**Next Steps:**
1. Test API endpoints with Postman
2. Connect frontend to backend
3. Build additional features
4. Prepare demo for final evaluation

**Questions?** Check the documentation files or API responses for more details!
