# CoreInventory Backend API 🛠️

This is the Node.js/Express-based service that powers the CoreInventory IMS. It handles authentication, inventory logic, and direct communication with the PostgreSQL database.

## 🚀 Key Modules
- **Authentication**: JWT & OTP-based session management.
- **Inventory Controller**: Atomic stock calculations and movement logging.
- **Role Middleware**: Enforces granular permissions (Admin, Manager, Staff).
- **Logger**: Industrial-grade logging via Winston.

## 📁 Environment Configuration
Copy `env.example` to `.env` and fill in:
- `DB_*`: Your PostgreSQL connection details.
- `JWT_SECRET`: A long, unique string for securing tokens.
- `NODE_ENV`: Set to `development` or `production`.

## 🛠️ Scripts
- `npm run dev`: Start the server with `nodemon` auto-reload.
- `npm start`: Production startup.
- `npm run migrate`: Initialize terminal-driven database setup.
- `npm run seed`: Populate the DB with basic types and master Admin.

---
**Warning**: All stock-modifying actions are recorded in the `stock_moves` table. Ensure the DB user has permission to execute triggers and functions.