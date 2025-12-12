# 🚀 How to Run This Project

## Quick Start (For Interim Evaluation - RIGHT NOW)

### View the Interface Mockups (No Installation Needed!)

1. **Open File Explorer**
   - Navigate to: `c:\Users\HP\Desktop\Adb 1\`

2. **Double-click these files to open in your browser:**
   - `index.html` - Navigation hub (start here!)
   - `interface\dashboard.html` - Main dashboard
   - `interface\services.html` - Service marketplace
   - `interface\login.html` - Login page

3. **That's it!** The interfaces work immediately in any browser.

---

## Taking Screenshots for Presentation

### Method 1: Windows Snipping Tool
```
1. Open HTML file in browser
2. Press: Windows + Shift + S
3. Select area to capture
4. Screenshot saved to clipboard
5. Paste in PowerPoint/Word
```

### Method 2: Browser Screenshot (Best Quality)
```
1. Open HTML in Chrome/Edge
2. Press F12 (open DevTools)
3. Press Ctrl + Shift + P
4. Type: "screenshot"
5. Choose: "Capture full size screenshot"
6. Screenshot saved to Downloads folder
```

### Method 3: Screen Recording
```
1. Press: Windows + G (Game Bar)
2. Click Record button (circle)
3. Navigate through interfaces
4. Stop recording
5. Video saved to Videos\Captures folder
```

---

## For MVP Implementation (After Interim Evaluation)

### Prerequisites
Install these on your computer:

1. **Node.js** (JavaScript runtime)
   - Download: https://nodejs.org/
   - Choose: LTS version (20.x)
   - Install with default settings

2. **Docker Desktop** (Database containers)
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker
   - Sign up for free account

3. **VS Code** (Code editor) - Optional but recommended
   - Download: https://code.visualstudio.com/
   - Install with default settings

---

## Step-by-Step MVP Setup

### Phase 1: Setup Databases (Week 1)

#### Option A: Docker Compose (Recommended for Local Development)

1. **Create `docker-compose.yml` in project root:**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: smart-platform-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7.2-alpine
    container_name: smart-platform-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  cassandra:
    image: cassandra:4.1
    container_name: smart-platform-cassandra
    ports:
      - "9042:9042"
    environment:
      CASSANDRA_CLUSTER_NAME: SmartPlatformCluster
    volumes:
      - cassandra_data:/var/lib/cassandra

  neo4j:
    image: neo4j:5.14
    container_name: smart-platform-neo4j
    ports:
      - "7474:7474"  # Browser UI
      - "7687:7687"  # Bolt protocol
    environment:
      NEO4J_AUTH: neo4j/password123
    volumes:
      - neo4j_data:/data

  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: smart-platform-elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  mongodb_data:
  redis_data:
  cassandra_data:
  neo4j_data:
  elasticsearch_data:
```

2. **Start all databases:**
```bash
cd "c:\Users\HP\Desktop\Adb 1"
docker-compose up -d
```

3. **Check if running:**
```bash
docker ps
```

4. **Access database UIs:**
   - MongoDB: Use MongoDB Compass (download from mongodb.com)
   - Redis: Use redis-cli or RedisInsight
   - Cassandra: Use cqlsh: `docker exec -it smart-platform-cassandra cqlsh`
   - Neo4j: Open browser: http://localhost:7474
   - Elasticsearch: Open browser: http://localhost:9200

#### Option B: Cloud Services (Easier, Free Tiers)

1. **MongoDB Atlas** (Free 512MB)
   - Sign up: https://cloud.mongodb.com
   - Create free cluster
   - Get connection string

2. **Redis Cloud** (Free 30MB)
   - Sign up: https://redis.com/try-free/
   - Create free database
   - Get connection string

3. **DataStax Astra** (Free Cassandra)
   - Sign up: https://astra.datastax.com
   - Create free database
   - Get connection bundle

4. **Neo4j Aura** (Free tier)
   - Sign up: https://neo4j.com/cloud/aura/
   - Create free instance
   - Get connection details

5. **Elasticsearch Cloud** (Free trial)
   - Sign up: https://cloud.elastic.co
   - Create deployment
   - Get connection details

---

### Phase 2: Setup Backend (Week 2)

1. **Create backend folder:**
```bash
cd "c:\Users\HP\Desktop\Adb 1"
mkdir backend
cd backend
```

2. **Initialize Node.js project:**
```bash
npm init -y
```

3. **Install dependencies:**
```bash
npm install express mongoose ioredis cassandra-driver neo4j-driver @elastic/elasticsearch
npm install jsonwebtoken bcryptjs cors dotenv
npm install --save-dev nodemon
```

4. **Create `.env` file:**
```env
# MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/smart_platform?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cassandra
CASSANDRA_CONTACT_POINTS=localhost
CASSANDRA_KEYSPACE=smart_platform

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3000
```

5. **Create `server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Services Platform API' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});
```

6. **Add to `package.json` scripts:**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

7. **Run the backend:**
```bash
npm run dev
```

8. **Test it:**
Open browser: http://localhost:3000/api/health

---

### Phase 3: Setup Frontend (Week 2)

#### Option A: Simple (Use existing HTML files)

1. **Install http-server:**
```bash
npm install -g http-server
```

2. **Run from project root:**
```bash
cd "c:\Users\HP\Desktop\Adb 1"
http-server -p 8080
```

3. **Open browser:**
http://localhost:8080/interface/dashboard.html

#### Option B: React (Professional)

1. **Create React app:**
```bash
cd "c:\Users\HP\Desktop\Adb 1"
npx create-react-app frontend
cd frontend
```

2. **Install dependencies:**
```bash
npm install axios react-router-dom recharts socket.io-client
```

3. **Run development server:**
```bash
npm start
```

4. **Convert HTML to React components** (gradual migration)

---

### Phase 4: Connect Frontend to Backend (Week 3)

1. **Update frontend to make API calls:**

```javascript
// Example: Fetch devices
const response = await fetch('http://localhost:3000/api/devices', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const devices = await response.json();
```

2. **Add WebSocket for real-time updates:**

Backend:
```bash
npm install socket.io
```

```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('subscribe', (deviceId) => {
    socket.join(`device:${deviceId}`);
  });
});
```

Frontend:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.emit('subscribe', 'DEV_001');
socket.on('device:DEV_001', (data) => {
  // Update UI with new reading
});
```

---

## Full Development Workflow

### Daily Development:

```bash
# Terminal 1: Start databases
docker-compose up

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm start
```

### Access Points:
- **Frontend**: http://localhost:3000 (React) or http://localhost:8080 (HTML)
- **Backend API**: http://localhost:3000/api
- **MongoDB Compass**: mongodb://localhost:27017
- **Neo4j Browser**: http://localhost:7474
- **Elasticsearch**: http://localhost:9200

---

## Testing the System

### 1. Test Database Connections

Create `backend/test-db.js`:
```javascript
const mongoose = require('mongoose');
const redis = require('ioredis');
const cassandra = require('cassandra-driver');
const neo4j = require('neo4j-driver');

async function testConnections() {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Redis
    const redisClient = new redis();
    await redisClient.ping();
    console.log('✅ Redis connected');

    // Cassandra
    const cassandraClient = new cassandra.Client({
      contactPoints: ['localhost'],
      localDataCenter: 'datacenter1'
    });
    await cassandraClient.connect();
    console.log('✅ Cassandra connected');

    // Neo4j
    const neo4jDriver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );
    await neo4jDriver.verifyConnectivity();
    console.log('✅ Neo4j connected');

    console.log('\n🎉 All databases connected successfully!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnections();
```

Run: `node test-db.js`

### 2. Test API Endpoints

Use Postman or curl:
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get devices (with token)
curl http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Docker not starting:
```bash
# Check Docker Desktop is running
docker --version

# Restart Docker Desktop
# Check logs
docker-compose logs
```

### Port already in use:
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Database connection failed:
```bash
# Check if containers are running
docker ps

# Check container logs
docker logs smart-platform-mongo
docker logs smart-platform-redis
```

### Node modules error:
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Project Structure (After Full Setup)

```
Adb 1/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── models/
│   │   ├── User.js
│   │   ├── Device.js
│   │   └── Service.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── devices.js
│   │   └── services.js
│   ├── controllers/
│   ├── middleware/
│   └── utils/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── interface/ (original mockups)
├── docker-compose.yml
├── README.md
└── [all documentation files]
```

---

## MVP Feature Timeline

### Week 1 (Dec 3-9):
- ✅ Setup databases
- ✅ Backend skeleton
- ✅ Test connections
- ✅ Basic auth endpoints

### Week 2 (Dec 10-16):
- ✅ Device management
- ✅ Real-time updates
- ✅ Dashboard integration
- ✅ Service search basic

### Week 3 (Dec 17-23):
- ✅ Recommendations
- ✅ Analytics
- ✅ All integrations
- ✅ Testing

### Week 4 (Dec 24-28):
- ✅ Bug fixes
- ✅ Performance
- ✅ Deployment
- ✅ Final demo

---

## Deployment (Optional)

### Deploy to Cloud:

1. **Backend → Heroku/Railway/Render**
2. **Frontend → Vercel/Netlify**
3. **Databases → Use managed services** (MongoDB Atlas, etc.)

### Quick Deploy with Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## 🎯 Summary

### For Interim Evaluation (THIS WEEK):
**Just open HTML files in browser - NO SETUP NEEDED!**
- `index.html` - Start here
- `interface/dashboard.html` - Demo
- `interface/services.html` - Demo
- Take screenshots

### For MVP Implementation (AFTER EVALUATION):
1. Install Node.js + Docker
2. Run `docker-compose up` (databases)
3. Run `npm run dev` (backend)
4. Run `npm start` (frontend)
5. Build features week by week

---

## 📞 Quick Help

**Issue**: HTML files not displaying properly
**Fix**: Use Chrome/Edge, not Internet Explorer

**Issue**: Docker Desktop not working
**Fix**: Use cloud services instead (MongoDB Atlas, etc.)

**Issue**: Port 3000 in use
**Fix**: Change PORT in .env to 3001

**Issue**: npm install fails
**Fix**: Update Node.js to latest LTS version

---

## ✅ What You Need RIGHT NOW

For interim evaluation next week:
1. ✅ Open HTML files (no installation)
2. ✅ Take screenshots
3. ✅ Read documentation
4. ✅ Practice presentation

That's it! The implementation comes AFTER the evaluation.

---

**Questions?** Everything works immediately - just open the HTML files! 🚀
