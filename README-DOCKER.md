# CoreInventory Docker Setup

This guide covers both Docker and manual development setups for CoreInventory.

## Quick Start

### Option 1: Docker (Recommended for Production)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Manual Development
```bash
# Linux/macOS
./start-dev.sh

# Windows
start-dev.bat
```

## Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api
- **Database**: localhost:5432 (PostgreSQL)

## Docker Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (nginx:80)    │────│   (Node:5000)   │────│ (PostgreSQL:5432)│
│   Port: 5173    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Configuration

### Docker Environment
Docker automatically sets these variables in `docker-compose.yml`:
- `DB_HOST=db` (Docker internal network)
- `NODE_ENV=production`
- Database: `coreinventory`

### Manual Development
1. Copy `Backend/env.example` to `Backend/.env`
2. Update database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_PASSWORD=your_postgres_password
   ```

## Troubleshooting

### Docker Issues

**Database Connection Failed**
```bash
# Check database health
docker-compose logs db

# Restart services
docker-compose down
docker-compose up -d
```

**Frontend Can't Reach API**
- Ensure nginx proxy is configured correctly
- Check that backend service is healthy: `docker-compose ps`

**Port Conflicts**
```bash
# Check what's using ports
netstat -tulpn | grep :5173
netstat -tulpn | grep :5000

# Kill conflicting processes
sudo kill -9 <PID>
```

### Manual Development Issues

**PostgreSQL Not Running**
```bash
# macOS
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14
```

**Database Creation**
```sql
CREATE DATABASE coreinventory;
CREATE USER coreuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE coreinventory TO coreuser;
```

**Permission Issues**
```bash
# Linux/macOS
chmod +x start-dev.sh

# Windows
# Run as Administrator if needed
```

## Development Workflow

### Making Changes

**Frontend (React/Vite)**
- Hot reload enabled automatically
- Changes appear at http://localhost:5173

**Backend (Node/Express)**
- Nodemon watches for changes
- Auto-restarts on file changes
- API available at http://localhost:5000

**Database Changes**
1. Update migration files in `Backend/src/migrations/`
2. Run `npm run migrate` to apply changes
3. Use `npm run seed` to populate test data

### Adding New Dependencies

**Docker Setup**
```bash
# Update package.json, then rebuild
docker-compose build backend
# or
docker-compose build frontend
```

**Manual Setup**
```bash
cd Backend  # or Frontend
npm install <package>
```

## Production Deployment

### Environment Variables
Update these in production:
- `JWT_SECRET` - Use a strong, random secret
- `DB_PASSWORD` - Use a secure database password
- `NODE_ENV=production`

### SSL/TLS
For production, configure:
- HTTPS certificates
- SSL termination at reverse proxy
- Secure database connections

### Monitoring
- Monitor container health: `docker-compose ps`
- Check logs: `docker-compose logs -f <service>`
- Set up monitoring for production workloads
