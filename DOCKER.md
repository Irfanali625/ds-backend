# Docker Setup Guide

This project uses Docker Compose to run the entire application stack including MongoDB, Backend API, and Frontend.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd "Data Scraping"
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - MongoDB: localhost:27017

## Docker Commands

### Start services
```bash
docker-compose up
```

### Start in detached mode (background)
```bash
docker-compose up -d
```

### Build without cache
```bash
docker-compose build --no-cache
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ This will delete all data)
```bash
docker-compose down -v
```

### Restart a specific service
```bash
docker-compose restart backend
```

### View running containers
```bash
docker-compose ps
```

## Environment Variables

### MongoDB
Default credentials in `docker-compose.yml`:
- Username: `admin`
- Password: `password123`
- Database: `data-scraping`

⚠️ **Important**: Change these credentials in production!

### Backend Environment Variables
The backend uses these environment variables (configured in `docker-compose.yml`):
- `MONGODB_URI`: Automatically configured to connect to the MongoDB service
- `JWT_SECRET`: JWT signing secret
- `TWILIO_ACCOUNT_SID`: (Optional) Twilio account SID
- `TWILIO_AUTH_TOKEN`: (Optional) Twilio auth token
- `TWILIO_PHONE_NUMBER`: (Optional) Twilio phone number

To add Twilio credentials, create a `.env` file in the root directory:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

## Architecture

```
┌─────────────────────────────────────────────┐
│          Docker Network: ds-network         │
│                                             │
│  ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │───▶│   Backend    │      │
│  │  (Next.js)   │    │  (Express)   │      │
│  │  Port: 3000  │    │  Port: 8000  │      │
│  └──────────────┘    └───────┬──────┘      │
│                              │             │
│                       ┌──────▼──────┐      │
│                       │   MongoDB   │      │
│                       │ Port: 27017 │      │
│                       └─────────────┘      │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### Port already in use
If ports 3000, 8000, or 27017 are already in use, you can change them in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port (left side)
```

### MongoDB connection issues
If the backend can't connect to MongoDB:
1. Check MongoDB container is running: `docker-compose ps`
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify MongoDB URI in backend logs: `docker-compose logs backend`

### Frontend can't reach backend
The frontend connects to `http://localhost:8000` for API calls. Make sure:
1. Both services are running: `docker-compose ps`
2. Check backend is accessible: `curl http://localhost:8000/health`
3. Check frontend logs: `docker-compose logs frontend`

### Rebuild after code changes
```bash
docker-compose down
docker-compose up --build
```

### View container resource usage
```bash
docker stats
```

### Execute commands in running containers
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh -u admin -p password123
```

## Production Deployment

⚠️ **Warning**: The current configuration is for development only!

For production deployment:

1. **Change MongoDB credentials:**
   ```yaml
   environment:
     MONGO_INITDB_ROOT_USERNAME: your_secure_username
     MONGO_INITDB_ROOT_PASSWORD: your_secure_password
   ```

2. **Update MONGODB_URI in backend service:**
   ```yaml
   MONGODB_URI: mongodb://your_secure_username:your_secure_password@mongodb:27017/data-scraping?authSource=admin
   ```

3. **Use proper JWT secret:**
   ```yaml
   JWT_SECRET: generate-a-strong-random-secret-key-here
   ```

4. **Add environment variables file:**
   Create a `.env` file with sensitive variables and use `env_file` in docker-compose.yml

5. **Consider using external MongoDB:**
   For production, consider using MongoDB Atlas or another managed MongoDB service

6. **Add reverse proxy:**
   Use nginx or Traefik in front of your services for SSL/TLS termination

7. **Enable container resource limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
   ```

## Volume Persistence

MongoDB data is persisted in a Docker volume named `mongodb_data`. This means:
- Data survives container restarts
- Data is removed only when you run `docker-compose down -v`
- You can backup the volume using Docker commands

To backup MongoDB data:
```bash
docker run --rm -v ds-mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

To restore from backup:
```bash
docker-compose down
docker volume rm ds-mongodb_data
docker run --rm -v ds-mongodb_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/mongodb-backup.tar.gz --strip-components=1"
docker-compose up -d
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

