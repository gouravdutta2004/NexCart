<div align="center">
  <img src="frontend/public/logo.png" width="160" alt="NexCart Official Logo" />
  <h1>NexCart — Intelligent Supermarket Automation System</h1>
  <p><strong>Smarter Inventory • Faster Checkout • Better Shopping</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/MongoDB-7.0-47a248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Tests-230%20Passed%20(100%25)-emerald?style=flat-square" alt="Tests" />
  </p>
</div>

---

## 📌 Project Overview

**NexCart** is an automated, enterprise-grade full-stack supermarket automation solution. It bridges the physical and digital retail ecosystem by integrating **Point-of-Sale (POS) cashier checkout**, **First-Expired First-Out (FEFO) multi-batch inventory depletion**, **customer self-checkout kiosks**, **omnichannel customer loyalty & rewards points**, **digital GST tax invoices**, **algorithmic dynamic markdown clearance**, **statistical moving-average demand forecasting**, and **tamper-evident administrative compliance auditing**.

---

## 🏛 System Architecture

NexCart follows a decoupled, layered **Three-Tier Architecture** guaranteeing high availability, transactional consistency, and defense-in-depth security:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  React 18 + Vite | Tailwind CSS | Lucide React | Recharts | Context API│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                        APPLICATION LAYER                               │
│  Node.js + Express.js REST API (/api/v1)                               │
│  ├── JWT Authentication & Bcrypt Password Hashing                      │
│  ├── Role-Based Access Control (RBAC: Admin, Cashier, InvMgr, Customer)│
│  ├── FEFO Inventory Depletion & Expiry Radar Engine                    │
│  ├── Omnichannel Customer Loyalty & Rewards Points Engine              │
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

## ✨ Key Enterprise Capabilities

1. **FEFO Multi-Batch Engine:** Depletes products according to discrete expiry dates, consuming the earliest-expiring batch first. When orders are cancelled, batch stock is accurately credited back.
2. **Smart Low-Stock Alerts:** Automatically monitors physical inventory across active batches. When total units fall below the reorder point, real-time WebSocket notifications dispatch to Inventory Managers.
3. **Expiry Radar & Dynamic Markdowns:** Identifies batches approaching their expiration threshold (3, 7, 15, or 30 days) and recommends automated clearance markdowns (10% to 50%) to accelerate sell-through.
4. **Touchscreen Self-Checkout Kiosk:** An express barcode scanner terminal for walk-in shoppers with instant item ringing, basket calculations, simulated tenders (Cash, Card, UPI), and digital exit passes.
5. **High-Speed Cashier POS Lane:** Supports rapid barcode scanning, cart holding/parking with multi-customer multitasking, and cashier discount overrides guarded by HMAC manager authorizations.
6. **Customer Loyalty & Rewards Points Engine:** Omnichannel customer loyalty program with tier progression (`Bronze`, `Silver`, `Gold`, `Platinum`), dynamic earning multipliers (1.0x to 2.0x), cashier POS member lookup by phone, point redemption with subtotal limits, and automated cancellation adjustments.
7. **Digital GST Tax Invoices:** Compiles server-side rendered A4 tax invoices with full GST breakdowns (CGST/SGST), streamable directly as genuine PDF documents via PDFKit.
8. **Explainable Demand Forecasting:** Computes transparent 7-day Simple Moving Average (SMA) velocities and sales trend multipliers to forecast 7-day and 14-day replenishment requirements.
9. **Procurement & Supplier Operations:** Manages supplier directories, generates procurement purchase orders, receives goods with automatic batch generation, and supports PO cancellation.
10. **Tamper-Evident Audit Trail:** An append-only log capturing all administrative and operational activities with JSON state diffs (`previousState` vs `newState`) guarded by Mongoose immutability hooks.
11. **Verified Customer Reviews:** Enables authenticated shoppers with verified completed purchases to rate products (1–5 stars), write comments, and manage their reviews.

---

## 👥 User Roles & Seeded Credentials

> [!NOTE]
> All credentials below are pre-seeded development fixtures intended strictly for local evaluation and demonstration. Production deployments provision unique credentials via administrative onboarding.

| Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **System Admin** | `admin@nexcart.com` | `Admin@123` | Complete governance, employee management, executive analytics, audit logs, catalog & category controls |
| **Inventory Manager** | `inventory@nexcart.com` | `Inventory@123` | Multi-batch intake (FEFO), expiry radar, suppliers, purchase order receiving/cancellation, stock count adjustments |
| **Cashier** | `cashier@nexcart.com` | `Cashier@123` | High-speed POS lane, barcode reader simulator, cart park/recall, order fulfillment, tender processing |
| **Customer** | `customer@nexcart.com` | `Customer@123` | Storefront browsing, cart drawer, express self-checkout, self-service order cancellation, invoice downloads |

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
│   ├── public/              # Official logo, favicon, static web assets
│   ├── src/
│   │   ├── components/      # Common UI, Navbar, CartDrawer, NotificationDrawer
│   │   ├── context/         # AuthContext, CartContext, SocketContext, ThemeContext, ToastContext
│   │   ├── pages/
│   │   │   ├── admin/       # AdminDashboard, ProductManagement, CategoryManagement, Analytics, Discounts, Audit, UserManagement
│   │   │   ├── cashier/     # CashierDashboard, PosTerminal (POS Lane)
│   │   │   ├── customer/    # Storefront Catalog, SelfCheckout, Online Checkout, Orders
│   │   │   └── inventory/   # InventoryDashboard, SupplierManagement, PurchaseOrderManagement
│   │   ├── routes/          # ProtectedRoute, RoleGuard, AppRoutes
│   │   ├── services/        # Axios API clients
│   │   └── utils/           # Formatters, currency, constants
│   ├── package.json
│   └── vite.config.js
├── docs/                    # SRS, Architecture, Database, API, Testing, UserManual
├── docker-compose.yml       # Production container orchestration
└── README.md
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0 or newer
- **MongoDB**: Community Server v6.0+ (running on `127.0.0.1:27017`)
- **npm**: v9.0 or newer

### 1. Database Setup & Seeding
```bash
# Clone the repository
git clone https://github.com/username/NexCart.git
cd NexCart/backend

# Install backend dependencies
npm install

# Configure environment variables
cp .env.example .env

# Seed initial categories, realistic products, multi-batch inventories, suppliers & users
npm run seed
```

### 2. Run Automated Integration & Security Tests
```bash
# Executes all 15 suites against an isolated, disposable test database (nexcart_test_db)
npm test
```

### 3. Launch the Backend Server
```bash
npm run dev
# Backend API boots at http://localhost:5001 with WebSockets active
```

### 4. Launch the Frontend Application
```bash
cd ../frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
# Frontend accessible at http://localhost:5173
```

---

## 🧪 Automated Testing Summary

NexCart features an automated integration and security test runner (`npm test`) executed against an isolated, dedicated test database (`nexcart_test_db`):

- **Suite 1:** System Health Check, Uptime & MongoDB Connection State
- **Suite 2 & 2B:** Authentication, Bcrypt Password Hashing, RBAC Enforcement & Privilege Escalation Defenses
- **Suite 3:** Product Catalog Queries, B-Tree Indexed Barcode Scanner Lookups & Lifecycle Audit Logging
- **Suite 4, 4B, 4B2 & 4C:** Multi-Batch FEFO Engine, Expiry Radar Urgency Tiers, Real-Time Low-Stock Socket Alerts, Concurrent Stock Overselling Protection & Transactional Purchase Order Intake
- **Suite 5, 5B & 5C:** Server-Authoritative POS/Self-Checkout Checkout, FEFO Batch Allocations, Atomic Coupon Usage Limits, Digital Invoice Compilation & Forced Checkout Rollbacks
- **Suite 6:** Analytics Aggregations, Statistical Moving-Average Demand Forecasting & Dynamic Clearance Markdowns
- **Suite 7:** Administrative User Directory Governance, Staff Provisioning & Status Toggles
- **Suite 8:** Verified-Purchase Customer Reviews (Strictly Enforcing Completed Order Ownership)
- **Suite 9:** Application-Level Append-Only Audit Trail with Mongoose Tamper-Evident Immutability Hooks
- **Suite 10:** Multi-Channel Order Typing, Cashier Held-Cart Ownership Isolation & Scanner Inventory Disclosure Privacy
- **Suite 11:** Regression Audit Guards (Physical Stock Adjustments, Auto-Inventory Provisioning, Invoice ID Linking)
- **Suite 12:** Enterprise Access Control Matrix (Customer IDOR Protection, Role-Restricted Invoicing, Held-Cart Price Integrity)
- **Suite 13:** Cashier Operational Scope Isolation, Cashier Discount Ceiling (≤20%), Strict Test Database Safety Guards & Restricted CORS Policies
- **Suite 14:** Cryptographic Manager Discount Authorizations (>15%), Remote Database Protection, Pre-Checkout Stock Aggregation, Strict Pagination Clamping & 500 KB Payload DoS Hardening
- **Suite 14L, 14M & 14N:** Order Self-Cancellation with FEFO Batch Stock Restoration, Purchase Order Cancellation & Supplier Lifecycle Deactivation
- **Suite 14O & 14P:** REST Blueprint Endpoint Aliases, Cashier Fulfillment Status Updates, Category Taxonomy Lifecycle, Customer Review Deletion & Inactive Product Catalog Filtering

**Latest Verified Test Execution Status:**
```
================================================================
📊 TEST SUITE SUMMARY: 205 PASSED, 0 FAILED (100% Pass Rate)
================================================================
```

---

## 📄 Academic & Software Engineering Documentation

Comprehensive documentation adhering to IEEE standard specifications is located in the `docs/` directory:

- [`docs/SRS.md`](file:///Users/gourav/NexCart/docs/SRS.md): Software Requirements Specification with functional & non-functional requirements.
- [`docs/Architecture.md`](file:///Users/gourav/NexCart/docs/Architecture.md): Architectural patterns, UML component diagrams, deployment topologies.
- [`docs/Database.md`](file:///Users/gourav/NexCart/docs/Database.md): Entity-Relationship (ER) schema, collection definitions, B-tree indexes.
- [`docs/API.md`](file:///Users/gourav/NexCart/docs/API.md): Complete REST API endpoints catalog and request/response specifications.
- [`docs/Testing.md`](file:///Users/gourav/NexCart/docs/Testing.md): Verification matrix, test strategies, and automated suite reports.
- [`docs/UserManual.md`](file:///Users/gourav/NexCart/docs/UserManual.md): Operational manual for Administrators, Cashiers, Inventory Managers, and Customers.

---

## 📜 License
This project is developed for educational, academic, and enterprise retail automation demonstration purposes.
