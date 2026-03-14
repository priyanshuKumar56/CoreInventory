CoreInventory is a high-performance, production-ready **Inventory Management System (IMS)**. Engineered for modern businesses, it provides a centralized platform to manage stock lifecycle—from procurement and internal relocation to fulfillment and auditing.

---

## 🚪 Quick Start

### Option 1: Docker (Recommended for Production)
The easiest way to get the entire stack running with all dependencies pre-configured.

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access Points:**
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Documentation**: `http://localhost:5000/api`

**Default Credentials:**
- **Admin**: `admin@coreinventory.com` / `Admin@123`
- **Staff**: `staff@coreinventory.com` / `Admin@123`

### Option 2: Manual Development
For local development with hot reload.

**Windows:**
```bash
start-dev.bat
```

**Linux/macOS:**
```bash
./start-dev.sh
```

**Manual Steps:**
```bash
# 1. Backend Setup
cd Backend
npm install
cp env.example .env  # Update with your database credentials
npm run migrate      # Create tables and triggers
npm run seed         # Populate initial data
npm run dev          # Start development server (Port 5000)

# 2. Frontend Setup (New Terminal)
cd Frontend
npm install
npm run dev          # Start development server (Port 5173)
```

---

## � Project Structure

```
CoreInventory/
├── 📁 Backend/                    # Node.js API Server
│   ├── 📁 src/
│   │   ├── 📁 config/            # Database and app configuration
│   │   │   └── 📄 db.js        # PostgreSQL connection & pool
│   │   ├── 📁 controllers/       # Route handlers
│   │   │   ├── 📄 auth.js      # Authentication (login, register)
│   │   │   ├── 📄 user.js      # User management
│   │   │   ├── 📄 warehouse.js # Warehouse operations
│   │   │   ├── 📄 inventory.js  # Stock management
│   │   │   └── 📄 product.js   # Product catalog
│   │   ├── 📁 middleware/        # Custom middleware
│   │   │   ├── 📄 auth.js      # JWT verification
│   │   │   └── 📄 rbac.js      # Role-based access control
│   │   ├── 📁 migrations/        # Database schema
│   │   │   ├── 📄 run.js       # Migration runner
│   │   │   ├── 📄 seed.js      # Initial data seeding
│   │   │   └── 📄 schema_master.sql # Complete DB schema
│   │   ├── 📁 models/           # Data models (if using ORM)
│   │   ├── 📁 routes/           # API route definitions
│   │   │   ├── 📄 auth.js      # Auth endpoints
│   │   │   ├── 📄 users.js     # User endpoints
│   │   │   ├── 📄 inventory.js # Inventory endpoints
│   │   │   └── 📄 products.js  # Product endpoints
│   │   ├── 📁 utils/            # Utility functions
│   │   │   └── 📄 logger.js    # Winston logging setup
│   │   ├── 📄 app.js           # Express app configuration
│   │   └── 📄 server.js        # Server startup and entry point
│   ├── 📄 Dockerfile           # Container configuration
│   ├── 📄 package.json         # Dependencies and scripts
│   ├── 📄 .env.example         # Environment template
│   └── 📄 start.sh            # Production startup script
│
├── 📁 Frontend/                   # React Web Application
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   │   ├── 📁 ui/          # shadcn/ui components
│   │   │   │   ├── 📄 button.jsx
│   │   │   │   ├── 📄 input.jsx
│   │   │   │   └── 📄 table.jsx
│   │   │   ├── 📄 Layout.jsx   # Main layout wrapper
│   │   │   ├── 📄 Navbar.jsx   # Navigation bar
│   │   │   ├── 📄 Sidebar.jsx  # Side navigation
│   │   │   └── 📄 Demo.jsx     # Component showcase
│   │   ├── 📁 pages/           # Page components
│   │   │   ├── 📄 Login.jsx    # Authentication page
│   │   │   ├── 📄 Dashboard.jsx # Main dashboard
│   │   │   ├── 📄 Inventory.jsx # Stock management
│   │   │   ├── 📄 Products.jsx  # Product catalog
│   │   │   ├── 📄 Users.jsx     # User management
│   │   │   └── 📄 Settings.jsx  # System settings
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   │   ├── 📄 useAuth.js   # Authentication state
│   │   │   └── 📄 useApi.js    # API request helper
│   │   ├── 📁 services/        # API service layer
│   │   │   ├── 📄 api.js       # Base API configuration
│   │   │   ├── 📄 auth.js      # Auth API calls
│   │   │   └── 📄 inventory.js # Inventory API calls
│   │   ├── 📁 store/           # State management (Redux)
│   │   │   ├── 📄 index.js     # Store configuration
│   │   │   ├── 📄 authSlice.js # Auth state
│   │   │   └── 📄 inventorySlice.js # Inventory state
│   │   ├── 📁 lib/             # Utility libraries
│   │   │   └── 📄 utils.js     # Helper functions
│   │   ├── 📄 App.jsx          # Main React app
│   │   ├── 📄 main.jsx         # App entry point
│   │   └── 📄 index.css        # Global styles
│   ├── 📄 Dockerfile          # Container configuration
│   ├── 📄 package.json        # Dependencies and scripts
│   ├── 📄 vite.config.js      # Vite build configuration
│   ├── 📄 tailwind.config.js  # Tailwind CSS configuration
│   └── 📄 nginx.conf          # Production web server config
│
├── 📄 docker-compose.yml         # Multi-container orchestration
├── 📄 README-DOCKER.md          # Detailed Docker documentation
├── 📄 start-dev.bat             # Windows development script
├── 📄 start-dev.sh              # Linux/macOS development script
├── 📄 verify-setup.bat          # Windows setup verification
├── 📄 verify-setup.sh           # Linux/macOS setup verification
└── 📄 .gitignore               # Git ignore rules
```

---

## 🔐 Authorization & Access Control

### User Roles & Permissions

#### 1. **Admin** 🛡️
Full system access with all privileges.

**Access Level:** `READ | WRITE | DELETE | ADMIN`

**Allowed Operations:**
- ✅ **User Management**: Create, view, edit, delete users
- ✅ **Role Assignment**: Assign/change user roles (Admin, Staff, Manager)
- ✅ **Warehouse Management**: Create, edit, delete warehouses
- ✅ **Inventory Control**: Full CRUD operations on all inventory
- ✅ **Product Catalog**: Add, edit, delete products
- ✅ **Stock Movements**: Create, approve, reject stock transfers
- ✅ **System Settings**: Configure system parameters
- ✅ **Audit Logs**: View all system activity logs
- ✅ **Reports**: Generate all types of reports
- ✅ **Database Management**: Run migrations, seed data

#### 2. **Manager** 👔
Operational oversight with limited admin privileges.

**Access Level:** `READ | WRITE | APPROVE`

**Allowed Operations:**
- ✅ **User Viewing**: View user lists (no editing)
- ✅ **Warehouse Operations**: View and manage assigned warehouses
- ✅ **Inventory Management**: Full CRUD on inventory in assigned warehouses
- ✅ **Product Management**: View and edit product information
- ✅ **Stock Movements**: Create and approve transfers within scope
- ✅ **Reports**: Generate inventory and movement reports
- ✅ **Audit Logs**: View logs for assigned areas
- ❌ **User Management**: Cannot create/edit/delete users
- ❌ **System Settings**: Cannot access system configuration
- ❌ **Cross-Warehouse**: Cannot access other warehouses

#### 3. **Staff** �
Day-to-day operations with basic access.

**Access Level:** `READ | WRITE (Limited)`

**Allowed Operations:**
- ✅ **Inventory Viewing**: View stock levels in assigned warehouse
- ✅ **Stock Updates**: Update stock quantities (with approval)
- ✅ **Product Viewing**: View product information
- ✅ **Basic Reports**: Generate simple inventory reports
- ✅ **Movement Requests**: Create stock movement requests
- ❌ **Product Editing**: Cannot modify product details
- ❌ **Warehouse Settings**: Cannot access warehouse configuration
- ❌ **User Management**: No access to user operations
- ❌ **Approval Authority**: Cannot approve stock movements
- ❌ **System Settings**: No access to system configuration

### Data Access Matrix

| Data Type | Admin | Manager | Staff |
|-----------|-------|---------|-------|
| **Users** | Full CRUD | View Only | ❌ No Access |
| **Warehouses** | Full CRUD | Assigned Only | ❌ No Access |
| **Products** | Full CRUD | View & Edit | View Only |
| **Inventory** | Full CRUD | Full CRUD (Assigned) | View & Update (Assigned) |
| **Stock Movements** | Full Control | Approve (Scope) | Request Only |
| **Audit Logs** | Full Access | Limited (Scope) | Own Actions Only |
| **Reports** | All Reports | Operational Reports | Basic Reports |
| **System Settings** | Full Access | ❌ No Access | ❌ No Access |

### API Endpoint Security

#### Authentication Required
All API endpoints (except `/api/auth/login` and `/api/auth/register`) require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Token must not be expired
- User role must match endpoint requirements

#### Role-Based Endpoint Access

```javascript
// Example middleware implementation
const rbac = {
  admin: ['/api/users', '/api/system', '/api/warehouses'],
  manager: ['/api/inventory', '/api/products', '/api/movements'],
  staff: ['/api/inventory/view', '/api/products/view', '/api/movements/request']
};
```

#### Data Scoping
- **Admin**: Access to all data across all warehouses
- **Manager**: Access limited to assigned warehouses and teams
- **Staff**: Access limited to specific warehouse sections

---

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19** - Modern UI framework with hooks
- **Vite 8** - Fast development server and build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Beautiful icon library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend Stack
- **Node.js 20** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL 14** - Primary database
- **JWT** - Authentication tokens
- **Winston** - Structured logging
- **bcryptjs** - Password hashing
- **nodemailer** - Email services
- **express-rate-limit** - API rate limiting
- **helmet** - Security headers

### Infrastructure
- **Docker & Docker Compose** - Container orchestration
- **Nginx** - Reverse proxy and static file serving
- **Multi-stage builds** - Optimized container images
- **Health checks** - Service monitoring
- **Volume persistence** - Data durability

---

## 🔧 Development Workflow

### Making Changes

**Frontend Development:**
- Hot reload enabled automatically
- Changes appear instantly at `http://localhost:5173`
- Tailwind CSS updates in real-time
- React Fast Refresh for component changes

**Backend Development:**
- Nodemon watches for file changes
- Automatic server restart on modifications
- API available at `http://localhost:5000`
- Database changes require manual migration

### Database Changes

1. **Create Migration:**
   ```sql
   -- Edit Backend/src/migrations/schema_master.sql
   ```

2. **Apply Changes:**
   ```bash
   cd Backend
   npm run migrate
   ```

3. **Update Seed Data:**
   ```bash
   npm run seed
   ```

### Adding New Features

1. **Backend:**
   - Create controller in `src/controllers/`
   - Add routes in `src/routes/`
   - Update middleware for authorization
   - Add database schema changes if needed

2. **Frontend:**
   - Create components in `src/components/`
   - Add pages in `src/pages/`
   - Update routing in `App.jsx`
   - Add API calls in `src/services/`

---

## 🚀 Production Deployment

### Environment Variables

**Required for Production:**
```env
# Database
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=coreinventory
DB_USER=postgres
DB_PASSWORD=secure_password

# Security
JWT_SECRET=your_super_secret_jwt_key_256_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_256_chars

# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
```

### Security Considerations

- **HTTPS**: Enable SSL/TLS in production
- **Environment Variables**: Never commit secrets to git
- **Database Security**: Use strong passwords and SSL connections
- **API Security**: Rate limiting and CORS configuration
- **Container Security**: Non-root users and minimal base images

### Monitoring & Logging

- **Application Logs**: Winston structured logging
- **Database Logs**: PostgreSQL query logging
- **Container Health**: Docker health checks
- **Performance Monitoring**: Resource usage tracking

---

## 📞 Support & Troubleshooting

### Common Issues

**Docker Issues:**
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

**Database Connection:**
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists: `createdb coreinventory`

**Permission Issues:**
- Verify user roles in database
- Check JWT token validity
- Review RBAC middleware configuration

### Development Scripts

- **verify-setup.sh/.bat** - Check system requirements
- **start-dev.sh/.bat** - Start development environment
- **README-DOCKER.md** - Detailed Docker documentation

---

Built with precision for modern inventory logistics. 🏢📦

**CoreInventory IMS** - Enterprise-grade inventory management for the modern business.
