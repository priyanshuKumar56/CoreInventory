# 📖 CoreInventory Enterprise: Project Blueprint & Technical Specification

This document provides a comprehensive overview of the **CoreInventory** ecosystem, detailing the system architecture, technical stack, configuration, and operational workflows.

---

## 1. 🏗️ System Design & Architecture

The system follows a **Cloud-Native Monorepo** architecture, designed for scalability and high availability.

### High-Level Request Flow
1. **Gateway**: All incoming traffic hits an **Nginx Reverse Proxy**. This unifies the Frontend and Backend under a single port (80) and provides security headers (Helmet, CORS).
2. **Frontend**: A **React 19 SPA** (Single Page Application) serves the user interface. It communicates with the Backend via a secure Axios layer.
3. **Backend API**: A **Node.js Express** server handles business logic, authentication, and database orchestration.
4. **Background Worker**: A **Python 3 / Celery** worker handles "heavy" asynchronous tasks like ML predictions and massive CSV exports, preventing the main API from blocking.
5. **Data Layer**: 
   - **PostgreSQL (Neon)**: Primary source of truth for structured data.
   - **Redis**: Acts as the message broker for Celery and the cache for high-frequency queries.

---

## 2. 🛠️ Technology Stack

### Frontend (UI/UX)
*   **React 19**: Modern component-based architecture.
*   **Vite 6**: Fast build-time and development environment.
*   **Tailwind CSS 4**: For premium, highly-responsive design.
*   **Redux Toolkit**: Centralized state management for authentication and inventory data.
*   **Framer Motion**: Smooth micro-animations for an "app-like" feel.

### Backend (Logic & API)
*   **Node.js & Express**: High-performance, non-blocking I/O.
*   **JWT & HttpOnly Cookies**: Dual-layer security for session persistence.
*   **Winston**: Professional structured logging with file rotation.
*   **bcryptjs**: Military-grade password hashing (10 salt rounds).

### Analytics & Workers (AI/ML)
*   **Python 3**: Chosen for its robust data science libraries.
*   **Celery**: Distributed task queue for async processing.
*   **Scikit-Learn**: Used for linear regression and trend forecasting in restock levels.
*   **Pandas**: For high-performance data manipulation during exports.

---

## 3. 🔐 Security & Observability

### Security Layers
*   **CORS Configuration**: Restricted to authorized Vercel domains only.
*   **Rate Limiting**: Protected against Brute Force attacks on Auth endpoints.
*   **RBAC**: Role-Based Access Control ensures Staff cannot delete warehouses and Managers cannot modify users.

### Live Observability
*   **Admin Log Streamer**: A dedicated internal API (`/api/admin/logs`) allows administrators to view live server logs (`combined.log` and `error.log`) directly from the dashboard, eliminating the need for SSH.

---

## 4. 🔄 Operational Workflows

### The Inventory Lifecycle
1. **Inbound**: Goods arrive -> Admin creates a **Receipt** -> Stock level increases in the receiving location.
2. **Storage**: Stock is **Transferred** from "Receiving" to "Internal Shelves". Every move is logged in the `inventory_moves` table.
3. **Audit**: If physical stock doesn't match the system, an **Adjustment** is created and must be "Validated" by a Manager.
4. **Outbound**: A **Delivery** order is created -> Stock is deducted -> The ledger records the fulfillment.

---

## 5. 🚀 Setup & Installation (Master Guide)

### Unified Commands
From the project root:
*   `npm run setup`: Installs all dependencies and builds the DB schema.
*   `npm run dev`: Starts the entire stack (API + UI).
*   `npm run seed:big`: Populates the system with 500+ realistic records.

### Environment Variables (.env)
*   `DATABASE_URL`: Your Neon/Postgres connection string.
*   `JWT_SECRET`: A 256-bit secret for signing tokens.
*   `CLIENT_URL`: The authorized frontend URL (CORS).
*   `REDIS_URL`: Connection string for the task queue.

---

## 📈 Performance & Scaling
*   **DB Indexing**: Critical tables (`products`, `stock`, `moves`) are indexed by UUID and Timestamp for O(1) or O(log N) lookup speeds.
*   **Nginx Caching**: Static assets are cached at the edge for sub-100ms load times.
*   **Docker Optimization**: Multi-stage builds reduce image sizes by 60%, speeding up deployment.

---
*Created by Priyanshu Kumar - CoreInventory Project Architect*
