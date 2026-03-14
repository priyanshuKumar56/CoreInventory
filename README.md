# CoreInventory IMS 🚀

CoreInventory is a high-performance, production-ready **Inventory Management System (IMS)**. Engineered for modern businesses, it provides a centralized platform to manage stock lifecycle—from procurement and internal relocation to fulfillment and auditing.

---

## 🚪 Quick Start (Docker - Recommended)

The easiest way to get the entire stack running is using Docker. This ensures all dependencies (PostgreSQL, Node, Nginx) are configured automatically.

1.  **Clone the repository.**
2.  **Run Docker Compose**:
    ```bash
    docker-compose up --build
    ```
3.  **Access the App**:
    - **Frontend**: `http://localhost:5173`
    - **Backend API**: `http://localhost:5000`

*Note: The first run will automatically handle database migrations and seeding. Default admin: `admin@coreinventory.com` | `admin123`.*

---

## 🛠️ Manual Installation Guide

If you prefer to run the components separately on your machine:

### 1. Prerequisites
- **Node.js**: v18.0.0+ | **PostgreSQL**: v14.0+

### 2. Backend Setup
```bash
cd Backend
npm install
cp env.example .env  # Update variables in .env
npm run migrate      # Create tables/triggers
npm run seed         # Initial data
npm run dev          # Start server (Port 5000)
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev          # Start UI (Port 5173/5174)
```

---

## 🔒 Role-Based Access Matrix (Permissions)

| Feature | Admin / Manager | Staff |
| :--- | :--- | :--- |
| **Warehouse Settings** | ✅ Create/Edit | ❌ Hidden |
| **User Management** | ✅ View/Audit | ❌ Hidden |
| **Inventory Validation**| ✅ Finalize Moves | ⚠️ Draft Only |
| **Catalog / Products** | ✅ Manage | ❌ View Only |

---

## 🏗️ Project Architecture
- **Frontend**: React 19 + Vite + Tailwind 4 (Served via Nginx in Docker)
- **Backend**: Node.js + Express (Protected by JWT & Role middleware)
- **Database**: PostgreSQL (Atomic integrity via DB triggers)

---

Built with precision for modern inventory logistics. 🏢📦
