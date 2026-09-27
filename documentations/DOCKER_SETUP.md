# 🐳 Docker Setup Guide - Ocean App Backend

**Last Updated**: 2026-01-11

This guide will help you set up and run the Ocean App backend servers using Docker for local development.

---

## 📋 **Prerequisites**

- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
- **Git** (to clone the repository)
- **Basic terminal/command line knowledge**

---

## 🚀 **Quick Start (Development Mode)**

### **Step 1: Clone & Navigate**
```bash
cd ocean-app
```

### **Step 2: Set Up Environment Variables**

#### **For ocean_server:**
Create or update `ocean_server/.env`:
```bash
# Database (will use Docker MySQL)
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=ocean_user
DB_PASSWORD=ocean_password
DB_NAME=ocean_app_db

# Redis (will use Docker Redis)
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# JWT & Session
JWT_SECRET=dev_jwt_secret_change_in_production
SESSION_SECRET=dev_session_secret_change_in_production

# Frontend
FRONTEND_URL=http://localhost:5173
MESSAGE_SERVER_URL=http://localhost:5001

# Add other required variables from ocean_server/env.example
```

#### **For ocean_message_server:**
Create or update `ocean_message_server/config.env`:
```bash
# Database (will use Docker MySQL)
DB_HOST=mysql
DB_PORT=3306
DB_USER=ocean_user
DB_USERNAME=ocean_user
DB_PASSWORD=ocean_password
DB_NAME=ocean_app_db

# Redis (will use Docker Redis)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d

# Frontend
CLIENT_URL=http://localhost:5173
MAIN_SERVER_URL=http://ocean-server:5000

# Add other required variables
```

### **Step 3: Start All Services**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will:
- ✅ Start MySQL container
- ✅ Start Redis container
- ✅ Build and start `ocean-server` (port 5000)
- ✅ Build and start `ocean-message-server` (port 5001)
- ✅ Enable hot reload (code changes auto-reload)

### **Step 4: Run Database Migrations**

After containers are running, execute migrations:

```bash
# Option 1: Run migrations from host (if you have MySQL client)
mysql -h localhost -P 3306 -u ocean_user -pocean_password ocean_app_db < ocean_server/migrations/your-migration.sql

# Option 2: Run migrations inside container
docker exec -it ocean-mysql-dev mysql -u ocean_user -pocean_password ocean_app_db < ocean_server/migrations/your-migration.sql

# Option 3: Use Sequelize CLI (if configured)
docker exec -it ocean-server-dev npm run migrate
```

### **Step 5: Verify Services**

Check health endpoints:
- **Main Server**: http://localhost:5000/health
- **Message Server**: http://localhost:5001/health

Check logs:
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f ocean-server
docker-compose -f docker-compose.dev.yml logs -f ocean-message-server
```

---

## 🛠️ **Development Workflow**

### **Hot Reload**
Code changes in `ocean_server/` or `ocean_message_server/` will automatically reload thanks to nodemon and volume mounts.

### **View Logs**
```bash
# Follow all logs
docker-compose -f docker-compose.dev.yml logs -f

# Follow specific service
docker-compose -f docker-compose.dev.yml logs -f ocean-server
docker-compose -f docker-compose.dev.yml logs -f ocean-message-server
```

### **Restart Services**
```bash
# Restart all
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart ocean-server
```

### **Stop Services**
```bash
docker-compose -f docker-compose.dev.yml down
```

### **Stop & Remove Volumes** (⚠️ Deletes database data)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🏭 **Production Mode**

### **Build & Run Production Containers**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Note**: Production mode:
- ❌ No hot reload (code is baked into image)
- ✅ Optimized builds (production dependencies only)
- ✅ Better performance

---

## 📁 **File Structure**

```
ocean-app/
├── docker-compose.yml              # Production orchestration
├── docker-compose.dev.yml          # Development orchestration
├── .env.docker.example            # Docker env template
├── ocean_server/
│   ├── Dockerfile                 # Production image
│   ├── Dockerfile.dev             # Development image
│   ├── .dockerignore              # Build exclusions
│   └── .env                       # Server environment variables
└── ocean_message_server/
    ├── Dockerfile                 # Production image
    ├── Dockerfile.dev             # Development image
    ├── .dockerignore              # Build exclusions
    └── config.env                 # Server environment variables
```

---

## 🔧 **Troubleshooting**

### **Issue: Port Already in Use**

**Error**: `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution**:
```bash
# Stop local servers running on these ports
# Or change ports in docker-compose.dev.yml:
ports:
  - "5002:5000"  # Use different host port
```

### **Issue: Cannot Connect to Database**

**Error**: `Access denied for user 'ocean_user'@'172.x.x.x'`

**Solution**:
1. Check MySQL container is running: `docker ps`
2. Verify credentials in `docker-compose.dev.yml` match your `.env` files
3. Check MySQL logs: `docker-compose -f docker-compose.dev.yml logs mysql`

### **Issue: Redis Connection Failed**

**Error**: `Redis connection error`

**Solution**:
1. Check Redis container: `docker ps | grep redis`
2. Verify `REDIS_URL` or `REDIS_HOST` in environment variables
3. Check Redis logs: `docker-compose -f docker-compose.dev.yml logs redis`

### **Issue: Hot Reload Not Working**

**Symptoms**: Code changes don't trigger restart

**Solution**:
1. Verify volume mounts in `docker-compose.dev.yml`:
   ```yaml
   volumes:
     - ./ocean_server:/app
   ```
2. Check nodemon is running: `docker exec ocean-server-dev ps aux | grep nodemon`
3. Restart container: `docker-compose -f docker-compose.dev.yml restart ocean-server`

### **Issue: Container Keeps Restarting**

**Solution**:
```bash
# Check logs for errors
docker-compose -f docker-compose.dev.yml logs ocean-server

# Check container status
docker ps -a

# Try running container interactively
docker run -it --rm ocean-server-dev /bin/sh
```

### **Issue: Permission Denied on Uploads**

**Error**: `EACCES: permission denied, mkdir '/app/uploads'`

**Solution**:
```bash
# Fix permissions
docker exec ocean-server-dev chmod -R 755 /app/uploads
```

---

## 🔐 **Security Notes**

1. **Never commit `.env` files** to git
2. **Change default passwords** in production
3. **Use strong secrets** for `JWT_SECRET` and `SESSION_SECRET`
4. **Limit exposed ports** in production
5. **Use Docker secrets** for sensitive data in production

---

## 📊 **Service Health Checks**

All services include health checks:

- **MySQL**: `mysqladmin ping`
- **Redis**: `redis-cli ping`
- **ocean-server**: `GET /health`
- **ocean-message-server**: `GET /health`

Check health status:
```bash
docker ps  # Look for "healthy" status
```

---

## 🗄️ **Database Management**

### **Access MySQL Container**
```bash
docker exec -it ocean-mysql-dev mysql -u ocean_user -pocean_password ocean_app_db
```

### **Backup Database**
```bash
docker exec ocean-mysql-dev mysqldump -u ocean_user -pocean_password ocean_app_db > backup.sql
```

### **Restore Database**
```bash
docker exec -i ocean-mysql-dev mysql -u ocean_user -pocean_password ocean_app_db < backup.sql
```

### **View Database Logs**
```bash
docker-compose -f docker-compose.dev.yml logs mysql
```

---

## 🔄 **Common Commands Reference**

| Command | Description |
|---------|-------------|
| `docker-compose -f docker-compose.dev.yml up -d` | Start all services (detached) |
| `docker-compose -f docker-compose.dev.yml down` | Stop all services |
| `docker-compose -f docker-compose.dev.yml logs -f` | Follow logs |
| `docker-compose -f docker-compose.dev.yml restart <service>` | Restart service |
| `docker-compose -f docker-compose.dev.yml ps` | List running services |
| `docker-compose -f docker-compose.dev.yml build` | Rebuild images |
| `docker exec -it <container> /bin/sh` | Access container shell |

---

## 🚢 **Railway Deployment Note**

**Important**: Docker Compose is for **local development only**.

When deploying to Railway:
- Railway uses its own build system (Nixpacks or Dockerfile)
- Railway manages MySQL/Redis services separately
- Railway uses environment variables from its dashboard
- `docker-compose.yml` is **NOT used** on Railway

Your existing Railway setup will continue to work as-is.

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] All containers are running: `docker ps`
- [ ] Health checks pass: Visit `/health` endpoints
- [ ] Database connection works: Check server logs
- [ ] Redis connection works: Check server logs
- [ ] Hot reload works: Make a code change and see restart
- [ ] Uploads directory exists and is writable
- [ ] Services can communicate: Check `ocean-message-server` can reach `ocean-server`

---

## 📞 **Need Help?**

1. Check logs: `docker-compose -f docker-compose.dev.yml logs`
2. Check container status: `docker ps -a`
3. Review this guide's troubleshooting section
4. Check Docker Desktop is running

---

**Happy Dockerizing! 🐳**
