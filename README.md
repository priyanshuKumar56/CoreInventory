# CoreInventory IMS 🚀

CoreInventory is a high-performance, production-ready **Inventory Management System (IMS)**. Engineered for modern businesses, it provides a centralized platform to manage stock lifecycle—from procurement and internal relocation to fulfillment and auditing.

---

## 🚪 Onboarding Flow (Getting Started)

1.  **Login**: Use the `admin@coreinventory.com` account to access full features.
2.  **Organization Setup**: Go to **Global Settings** to configure your **Warehouses** and **Locations**. This is the first step before adding stock.
3.  **Cataloging**: Navigate to **Products** to build your item repository.
4.  **Operations**: Start your first **Incoming Receipt** to bring stock into your warehouse.

---

## 🔒 Role-Based Access Matrix (Permissions)

The system is built on a strict **Authority Hierarchy**. Here is exactly who can access and edit what:

### 👑 Admin & Supervisor (Admin/Manager Roles)
*   **User Base**: FULL access to view and manage system users and their roles.
*   **Warehouse Settings**: ONLY Admins/Managers can create, edit, or configure **Warehouses**, **Locations**, and **Aisles**.
*   **Inventory Validation**: Exclusive authority to "Validate" or "Cancel" Movements. Staff can record data, but only supervisors can finalize the stock update.
*   **Catalog Management**: Can create, edit, or archive Products and Categories.
*   **Audit**: Access to global movement history and valuation reports.

### 👤 Operations Staff (Staff Role)
*   **Operational Workflow**: Can create "Drafts" for Receipts and Deliveries, and mark items as "Ready".
*   **Stock Moves**: CANNOT validate or finalize stock movements. Requires a supervisor for the final step.
*   **System Controls**: The "User Base" and "Global Settings" (Warehouse config) menus are **hidden** from the staff UI.
*   **Visibility**: Can view stock levels and transaction history but cannot edit or delete records.

---

## 🏗️ Project Architecture
- **Frontend**: React 19 + Vite + Tailwind 4 (High-speed, Responsive UI)
- **Backend**: Node.js + Express (Robust API Layer)
- **Database**: PostgreSQL (Relational Integrity with Atomic Triggers)

---

## 🚀 Setup Instructions
1.  **Backend**: `cd Backend && npm install && npm run migrate && npm run seed && npm run dev`
2.  **Frontend**: `cd Frontend && npm install && npm run dev`

---

Built with precision for modern inventory logistics. 🏢📦
