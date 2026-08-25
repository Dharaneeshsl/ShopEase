# 🐳 Docker Deployment Guide

## Quick Start with Docker Compose

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### 1. Create the Environment File

The compose file intentionally ships **no default credentials** — both the
MongoDB container and the backend load their secrets from a local, gitignored
`.env` file via `env_file`. Copy the template and set strong values for
`MONGO_INITDB_ROOT_PASSWORD`, `JWT_SECRET`, and the Docker `MONGODB_URI`:

```bash
cp env.example .env
# edit .env and set MONGO_INITDB_ROOT_PASSWORD, JWT_SECRET, and MONGODB_URI
```

Inside the Compose network the backend reaches MongoDB through the `mongodb`
service name, so set:

```dotenv
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=<your-strong-password>
MONGO_INITDB_DATABASE=ecommerce
MONGODB_URI=mongodb://admin:<your-strong-password>@mongodb:27017/ecommerce?authSource=admin
JWT_SECRET=<your-long-random-secret>
```

Docker Compose reads `.env` automatically, so no extra flags are needed.

### 2. Build and Run All Services

```bash
# Build and start all services (MongoDB, Backend, Frontend)
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 4. Seed the Database

```bash
# Enter the backend container
docker-compose exec backend sh

# Run the seed script
node scripts/seed.js

# Exit the container
exit
```

### 5. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## Services Overview

### 🗄️ MongoDB
- **Image**: mongo:7.0
- **Port**: 27017
- **Credentials**: taken from `.env` (`MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`)
- **Database**: `ecommerce` (from `MONGO_DB`)
- **Volumes**: Persistent data storage

### 🔧 Backend (Node.js/Express)
- **Port**: 5000
- **Environment**: Production
- **Health Check**: `/api/health`
- **Dependencies**: MongoDB

### 🎨 Frontend (React + Nginx)
- **Port**: 3000 (mapped to 80 in container)
- **Server**: Nginx
- **Features**: 
  - Gzip compression
  - Static asset caching
  - API proxy to backend
  - React Router support

---

## Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Check Service Status
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Backend
docker-compose exec backend sh

# MongoDB (uses MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD from .env)
docker-compose exec mongodb mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD"
```

---

## Environment Variables

Set values in your local `.env` file (see `env.example`). Docker Compose
injects that file into the `mongodb` and `backend` services via `env_file`, so
no credentials are committed in `docker-compose.yml`. The MongoDB container
reads `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` /
`MONGO_INITDB_DATABASE`; the backend reads `MONGODB_URI`, `JWT_SECRET`, and
payment keys from the same file.

### Backend Environment (loaded from `.env`)
```dotenv
# .env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=<your-strong-password>
MONGO_INITDB_DATABASE=ecommerce
MONGODB_URI=mongodb://admin:<your-strong-password>@mongodb:27017/ecommerce?authSource=admin
JWT_SECRET=<your-long-random-secret>
```

The backend container also sets these non-secret values directly in
`docker-compose.yml`:
```yaml
environment:
  NODE_ENV: production
  PORT: 5000
  CLIENT_URL: http://localhost:3000
```

### Frontend Environment
```yaml
environment:
  REACT_APP_API_URL: http://localhost:5000
```

---

## Production Deployment

### 1. Update Environment Variables
- Change MongoDB credentials
- Set strong JWT_SECRET
- Update CLIENT_URL to production domain
- Configure payment gateway keys

### 2. Use Production MongoDB
```yaml
mongodb:
  # Use MongoDB Atlas or managed service
  environment:
    MONGODB_URI: mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
```

### 3. Enable HTTPS
- Add SSL certificates
- Update nginx configuration
- Use reverse proxy (Traefik, Nginx Proxy Manager)

### 4. Scale Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is healthy
docker-compose ps
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose config
```

### Frontend Build Errors
```bash
# Rebuild frontend
docker-compose build --no-cache frontend
```

### Clear Everything and Start Fresh
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

---

## Health Checks

All services include health checks:

- **MongoDB**: Ping command every 10s
- **Backend**: HTTP check on `/api/health` every 30s
- **Frontend**: HTTP check on root every 30s

View health status:
```bash
docker-compose ps
```

---

## Volume Management

### Backup MongoDB Data
```bash
# Create backup
docker-compose exec mongodb mongodump --out /data/backup

# Copy backup to host
docker cp ecommerce-mongodb:/data/backup ./mongodb-backup
```

### Restore MongoDB Data
```bash
# Copy backup to container
docker cp ./mongodb-backup ecommerce-mongodb:/data/backup

# Restore
docker-compose exec mongodb mongorestore /data/backup
```

---

## Development vs Production

### Development (Current Setup)
- Hot reload disabled in containers
- Use `npm run dev` locally for development
- Docker for testing production builds

### Production
- Optimized builds
- Minified assets
- Nginx serving static files
- Environment-specific configurations

---

## Network Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                  │
│                                          │
│  ┌──────────┐    ┌──────────┐          │
│  │ Frontend │───▶│ Backend  │          │
│  │  :80     │    │  :5000   │          │
│  └──────────┘    └──────────┘          │
│                        │                 │
│                        ▼                 │
│                  ┌──────────┐           │
│                  │ MongoDB  │           │
│                  │  :27017  │           │
│                  └──────────┘           │
│                                          │
└─────────────────────────────────────────┘
         │              │
         ▼              ▼
    localhost:3000  localhost:5000
```

---

## Admin Credentials

After seeding the database:
- **Email**: admin@shopease.com
- **Password**: admin123

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify services: `docker-compose ps`
3. Review configuration: `docker-compose config`

---

**Happy Dockerizing! 🐳**
