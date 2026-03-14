# CoreInventory IMS 🚀

CoreInventory is a high-performance, production-ready **Inventory Management System (IMS)**. Engineered for modern businesses, it provides a centralized platform to manage stock lifecycle—from procurement and internal relocation to fulfillment and auditing.

---

## 🌟 Key Features

### 🏢 Operations Control
- **Incoming (Receipts)**: Track vendor shipments, perform quality checks, and automate stock intake.
- **Outgoing (Deliveries)**: Manage order fulfillment with Pick-Pack-Ship workflows.
- **Internal Transfers**: seamless relocation of stock between warehouses or internal bins.
- **Adjustments**: Intelligent inventory reconciliation with automated ledger adjustments.

### 🛡️ Secure Authorization (RBAC)
- **Role-Based Access**: Multi-tier security (Admin, Manager, Staff).
- **Protected Actions**: Supervisory roles required for stock validation and profile management.
- **JWT Auth**: Industry-standard token-based security with automatic silent refreshes.

### 📊 Real-time Intelligence
- **Dynamic Dashboard**: Live KPIs for total stock, low-stock warnings, and inventory valuation ($).
- **Movement Velocity**: Visualize inflow vs. outflow trends with interactive charts.
- **Audit Ledger**: Comprehensive historical stream of every inventory move for full accountability.

### 📦 Catalog & Logistics
- **Smart Catalog**: Manage SKUs, barcodes, categories, and custom reordering rules.
- **Logistics Mapping**: Hierarchical warehouse structure (Warehouses -> Locations -> Bins).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **State & Data**: [Redux Toolkit](https://redux-toolkit.js.org/) & [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Engine**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **Language**: JavaScript (ES6+)
- **Security**: JWT (JSON Web Tokens) & OTP verification
- **Logging**: [Winston](https://github.com/winstonjs/winston) industrial logger

### Database
- **Provider**: [PostgreSQL](https://www.postgresql.org/)
- **Logic**: Stored Procedures & DB-level Triggers (ensuring data integrity even outside the API).
- **Driver**: `pg` (node-postgres)

---

## 🚀 Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm**: v9.0.0 or higher

### 2. Database Preparation
Create a new PostgreSQL database and enable the required extensions:
```sql
CREATE DATABASE core_inventory;
-- Connect to core_inventory and run:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Backend Implementation
```bash
cd Backend
npm install
cp env.example .env
# Open .env and configure your DB_USER, DB_PASSWORD, and DB_NAME
npm run migrate   # Create schema (tables, functions, triggers)
npm run seed      # Populate with initial categories, warehouses, and Admin account
npm run dev       # Start API on http://localhost:5000
```

### 4. Frontend Implementation
```bash
cd Frontend
npm install
npm run dev       # Start App on http://localhost:5173
```

---

## 🔑 Default Access Details

The system comes pre-seeded with a master Admin account for initial configuration:

- **Admin User**: `admin@coreinventory.com`
- **Password**: `admin123`
- **Staff User**: `staff@coreinventory.com` (Restricted access)
- **Password**: `staff123`

---

## 📁 Project Structure

```text
├── Backend
│   ├── src
│   │   ├── controllers    # Request handling logic
│   │   ├── middleware     # Auth, Role Checks, Validation
│   │   ├── routes         # API Endpoint definitions
│   │   ├── migrations     # Schema & Seed scripts
│   │   └── utils          # Database & Helper functions
│   └── logs               # System error & access logs
└── Frontend
    ├── src
    │   ├── components     # Reusable UI (Shadcn + Custom)
    │   ├── pages          # View components
    │   ├── services       # API Integrations (Axios)
    │   └── store          # Global State Management (Redux)
```

---

Built with precision for modern inventory logistics. 🏢📦
