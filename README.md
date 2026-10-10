# NexCart — Intelligent Supermarket Automation System

> *"Smarter Inventory. Faster Checkout. Better Shopping."*

NexCart is an academic and portfolio-quality full-stack web application designed to automate retail supermarket operations. It provides end-to-end automation for product cataloging, First-Expired First-Out (FEFO) batch inventory management, point-of-sale (POS) barcode scanning, self-checkout kiosks, digital invoice generation, dynamic clearance discounts, demand forecasting, and real-time business analytics.

---

## 🏛 System Architecture

NexCart follows a clean, decoupled **Three-Tier Architecture** adhering to separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  React 18 + Vite | Tailwind CSS | Lucide React | Recharts | Context API│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                        APPLICATION LAYER                               │
│  Node.js + Express.js REST API (/api/v1)                               │
│  ├── JWT Authentication & Bcrypt Password Hashing                      │
│  ├── Role-Based Access Control (RBAC: Admin, Cashier, InvMgr, Customer)│
│  ├── FEFO Inventory Depletion & Expiry Radar Engine                    │
│  ├── Real-time Socket.io Event Bus (Stock Alerts, Order Broadcasts)   │
│  ├── PDFKit Dynamic Tax Invoice Streaming Engine                       │
│  └── Moving-Average Demand Forecasting & Markdown Services             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM v8
┌───────────────────────────────────▼────────────────────────────────────┐
│                           DATA LAYER                                   │
│  MongoDB 7.0 Community Edition                                         │
│  15 Collections: users, products, categories, inventory, suppliers,    │
│  purchaseOrders, carts, orders, orderItems, payments, invoices,        │
│  discounts, reviews, auditLogs, heldcarts                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Unique Automation Features

1. **Smart Stock Alert:** Automatically tracks inventory levels across all warehouse batches. When total units fall below the configured reorder level, a real-time `low_stock` event is pushed via WebSockets to inventory managers and administrators.
2. **Expiry Monitoring (Radar):** Continuously scans all batch expiration dates and categorizes stock into urgency tiers: *Critical* (≤7 days), *Warning* (≤15 days), and *Expired* (≤0 days).
3. **Smart Discount Recommendation:** Calculates dynamic, explainable markdown percentages (10% to 50%) for near-expiry products to accelerate inventory turnover and recover capital before perishability losses occur.
4. **Sales Analytics:** Visualizes daily gross revenue trends, orders frequency, department/category contributions, and best-selling product leaderboards using responsive Recharts widgets.
5. **Demand Forecast:** A transparent, explainable statistical prediction engine using 7-day Simple Moving Average (SMA) velocities and sales trend multipliers to forecast 7-day and 14-day demand, alongside recommended safety stock buffers.
6. **Self-Checkout Kiosk Mode:** A dedicated touchscreen-optimized shopper kiosk with instant barcode scanning, basket summary, UPI/card payment simulation, and a digital exit pass verified pass.
7. **Digital Invoice & PDF Generator:** Generates professional A4 tax invoices with full GST breakdowns (CGST/SGST), customer snapshots, line items, and store credentials, streamable on-demand as genuine PDF documents via PDFKit.
8. **Immutable Audit Trail:** Records all administrative and operational activities (product price modifications, manual inventory stock adjustments, purchase orders, discount rules) with tamper-evident JSON state diffs (`previousState` vs `newState`).

---

## 👥 User Roles & Seeded Credentials

NexCart supports 4 distinct user roles with full Role-Based Access Control (RBAC):

| Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **System Admin** | `admin@nexcart.com` | `Admin@123` | Full system governance, employee oversight, executive analytics, audit logs, catalog & category management |
| **Inventory Manager** | `inventory@nexcart.com` | `Inventory@123` | Multi-batch intake (FEFO), expiry radar, suppliers, purchase order receiving, stock adjustments |
| **Cashier** | `cashier@nexcart.com` | `Cashier@123` | High-speed POS lane, barcode reader simulator, cart park/recall, split tender simulation, thermal receipts |
| **Customer** | `customer@nexcart.com` | `Customer@123` | Storefront browsing, aisle filtering, cart drawer, express self-checkout, order history & PDF tax invoice downloads |

*(Demo Login buttons are embedded on the Login page for 1-click credential auto-fill).*

---

## 📂 Project Structure

```
NexCart/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, environment variables, socket server
│   │   ├── controllers/     # Express route handlers
│   │   ├── middleware/      # JWT auth, RBAC authorization, rate limiter, error handler
│   │   ├── models/          # 15 Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Core business logic (FEFO, orders, PDFKit, forecasting)
│   │   └── utils/           # Logger, API envelopes, seed data, constants
│   ├── tests/               # Automated integration & security test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI, Navbar, CartDrawer
│   │   ├── context/         # AuthContext, CartContext
│   │   ├── hooks/           # useBarcodeScanner, useSocket
│   │   ├── pages/
│   │   │   ├── admin/       # AdminDashboard, ProductManagement, CategoryManagement, Analytics, Discounts, Audit
│   │   │   ├── cashier/     # CashierDashboard, PosTerminal (POS Lane)
│   │   │   ├── customer/    # Storefront Catalog, SelfCheckout, Online Checkout, Order History
│   │   │   └── inventory/   # InventoryDashboard, SupplierManagement, PurchaseOrderManagement
│   │   ├── routes/          # ProtectedRoute, RoleGuard, AppRoutes
│   │   ├── services/        # Axios API clients
│   │   └── utils/           # Formatters, currency, constants
│   ├── package.json
│   └── vite.config.js
├── docs/                    # SRS, Architecture, Database, API, Testing, UserManual
└── README.md
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18.0 or newer)
- MongoDB Community Server (v6.0 or newer running on `127.0.0.1:27017`)
- npm (v9.0 or newer)

### 1. Database Setup & Seeding
```bash
# Clone the repository
git clone https://github.com/username/NexCart.git
cd NexCart/backend

# Install backend dependencies
npm install

# Configure environment
cp .env.example .env

# Seed initial categories, realistic products, multi-batch inventories, suppliers & users
npm run seed
```

### 2. Run Automated Integration Test Suite
```bash
# Run the 70-test automated integration and security suite
npm test
```

### 3. Launch the Backend Server
```bash
npm run dev
# Server boots at http://localhost:5001 with WebSockets active
```

### 4. Launch the Frontend Application
```bash
cd ../frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# Application accessible at http://localhost:5173
```

---

## 🧪 Testing Summary

NexCart includes an automated test runner (`npm test`) executed against an isolated test database (`nexcart_test_db`):
- **Suite 1:** System Health & MongoDB connection state
- **Suite 2 & 2B:** Authentication, password hashing, RBAC enforcement & public registration privilege escalation prevention
- **Suite 3:** Product catalog query, indexed B-Tree barcode lookups & product lifecycle audit logging
- **Suite 4, 4B, 4B2 & 4C:** Multi-batch inventory tracking, expiry radar alerts, concurrent stock overselling prevention, real concurrent checkout race condition protection (2 simultaneous requests) & transactional purchase order receiving
- **Suite 5, 5B & 5C:** Server-authoritative checkout, FEFO batch allocations, atomic coupon limits, anonymous checkout restriction (SELF_CHECKOUT only), protected PDF invoice streaming & forced checkout rollback restoring exact multi-batch allocations and coupons
- **Suite 6:** Analytics aggregations, explainable 7-day sales velocity demand forecasting & dynamic markdowns
- **Suite 7:** Administrative user management (staff provisioning & status toggles)
- **Suite 8:** Verified-purchase customer reviews (strictly requiring completed orders)
- **Suite 9:** Compliance and immutable audit trail logging with Mongoose anti-tamper hooks
- **Suite 10:** Role-enforced order types, held-cart cashier ownership isolation, and reduced public inventory disclosure from POS scanner endpoints

**Latest Execution Status:** `83 PASSED, 0 FAILED (100% Pass Rate)`.

---

## 📄 Academic Software Engineering Documentation

Comprehensive documentation adhering to IEEE standard specifications is located in the `docs/` directory:
- [`SRS.md`](file:///Users/gourav/NexCart/docs/SRS.md): Software Requirements Specification with functional & non-functional requirements.
- [`Architecture.md`](file:///Users/gourav/NexCart/docs/Architecture.md): Architectural patterns, UML component diagrams, deployment topologies.
- [`Database.md`](file:///Users/gourav/NexCart/docs/Database.md): Entity-Relationship (ER) schema, collection definitions, B-tree indexes.
- [`API.md`](file:///Users/gourav/NexCart/docs/API.md): Complete REST API endpoints catalog and request/response specifications.
- [`Testing.md`](file:///Users/gourav/NexCart/docs/Testing.md): Verification matrix, test strategies, and automated suite reports.
- [`UserManual.md`](file:///Users/gourav/NexCart/docs/UserManual.md): Operational manual for Administrators, Cashiers, Inventory Managers, and Customers.

---

## 📜 License
This project is developed for educational and academic software engineering demonstration purposes.
