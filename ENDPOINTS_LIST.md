# API Endpoints - Quick Reference

## Base URL
```
http://localhost:3000/api
```

---

## All 21 Endpoints

### **Authentication (4)**

1. **POST** `/api/auth/register` - Register new user
2. **POST** `/api/auth/login` - Login user  
3. **POST** `/api/auth/logout` - Logout user
4. **GET** `/api/auth/verify` - Verify JWT token

---

### **Users (2)**

5. **GET** `/api/users/profile` - Get user profile
6. **GET** `/api/users/stats` - Get user statistics

---

### **Devices (7)**

7. **GET** `/api/devices` - Get all user's devices
8. **POST** `/api/devices/register` - Register new device
9. **GET** `/api/devices/:deviceId` - Get device details
10. **PUT** `/api/devices/:deviceId` - Update device
11. **DELETE** `/api/devices/:deviceId` - Delete device
12. **POST** `/api/devices/:deviceId/readings` - Post sensor readings ⭐ (MongoDB + Redis + Cassandra)
13. **GET** `/api/devices/:deviceId/history` - Get historical readings (Cassandra)

---

### **Services (4)**

14. **GET** `/api/services/search` - Search services (Elasticsearch)
15. **GET** `/api/services/:serviceId` - Get service details
16. **GET** `/api/services/recommendations/personalized` - Personalized recommendations (Neo4j)
17. **POST** `/api/services/:serviceId/subscribe` - Subscribe to service (Neo4j)

---

### **Analytics (4)**

18. **GET** `/api/analytics/dashboard/stats` - Dashboard statistics
19. **GET** `/api/analytics/devices/:deviceId` - Device analytics
20. **GET** `/api/analytics/activity` - Activity logs
21. **GET** `/api/health` - API health check

---

## Database Usage

| Database | Endpoints |
|----------|-----------|
| **MongoDB** | 1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 18 |
| **Redis** | 2, 3, 4, 12 |
| **Cassandra** | 12, 13, 19, 20 |
| **Neo4j** | 16, 17 |
| **Elasticsearch** | 14 |

---

**Total: 21 endpoints** ✅
