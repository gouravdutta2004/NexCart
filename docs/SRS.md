# Software Requirements Specification (SRS)
## NexCart — Intelligent Supermarket Automation System

### 1. Introduction
#### 1.1 Purpose
This Software Requirements Specification (SRS) document details the functional and non-functional requirements for the **NexCart** platform. NexCart is an automated retail management solution that integrates Point-of-Sale (POS) billing, First-Expired First-Out (FEFO) inventory management, customer self-checkout, supplier purchase orders, explainable demand forecasting, and administrative auditing.

#### 1.2 Scope
NexCart manages supermarket workflows across four primary actors: Customers, Cashiers, Inventory Managers, and System Administrators. The system encompasses:
- Product & Category Catalog Management with barcode indexing.
- Multi-batch Inventory Tracking with automated low-stock and expiry warnings.
- Algorithmic Dynamic Markdown recommendations for products nearing expiry.
- High-efficiency Cashier POS billing and customer-facing Self-Checkout terminal.
- Deterministic Digital Invoice generation in PDF format.
- Statistical Moving-Average Demand Forecasting.
- Comprehensive Security, RBAC, and Application-Level Append-Only, Tamper-Evident Audit Logging.

---

### 2. Overall Description
#### 2.1 Product Perspective
NexCart operates on a 3-tier client-server architecture:
1. **Presentation Tier:** Single Page Application (SPA) built with React 18, Vite, and Tailwind CSS.
2. **Application Tier:** Node.js with Express.js REST API and Socket.io WebSocket engine for real-time telemetry.
3. **Data Tier:** MongoDB document database utilizing Mongoose ODM for schema validation and indexing.

#### 2.2 User Classes & Characteristics
1. **Customer:** Shoppers accessing the storefront catalog, online cart, order history, and in-store self-checkout terminal.
2. **Cashier:** Operational staff utilizing the high-speed POS terminal for barcode scanning, applying discounts, accepting simulated tenders, and printing receipts.
3. **Inventory Manager:** Logistics personnel responsible for batch intake, tracking expiration dates, adjusting stock, and managing supplier purchase orders.
4. **Administrator:** System owners with full access to revenue analytics, demand forecasting, user role management, system settings, and audit logs.

---

### 3. Functional Requirements

#### FR-01: Authentication & Authorization (RBAC)
- The system shall authenticate users via email and bcrypt-hashed passwords.
- The system shall issue stateless JSON Web Tokens (JWT) upon successful login.
- Access to endpoints and UI views shall be guarded by strict role-based authorization.

#### FR-02: Product Catalog & Barcode Management
- Products shall feature unique EAN/UPC barcodes and SKUs.
- Barcode lookups shall respond in sub-100ms through compound B-tree indexing.
- Products shall support categorization, brand, pricing, tax rate (GST/VAT), and expiry tracking flags.

#### FR-03: Inventory & FEFO Batch Engine
- Inventory shall track stock across discrete batches containing batch numbers, received dates, costs, and expiration dates.
- Sales transactions shall automatically deplete inventory using First-Expired First-Out (FEFO) logic.
- Low-stock events (`totalStock <= reorderLevel`) shall dispatch real-time WebSocket notifications to Inventory Managers.

#### FR-04: Expiry Radar & Dynamic Markdowns
- The system shall calculate days remaining until expiration for all active batches.
- Items expiring within configurable thresholds (e.g., 7 days, 15 days) shall trigger recommended dynamic discounts (e.g., 20% to 50% off) to expedite inventory clearance.

#### FR-05: Point-of-Sale (POS) & Self-Checkout
- The Cashier POS shall support rapid keyboard-only operations, continuous barcode scanning, and cart hold/recall.
- The Self-Checkout mode shall provide a secure, simplified touchscreen/barcode interface for walk-in shoppers.
- Transactions shall support tender simulations (Cash, Card, UPI) with change calculation.

#### FR-06: Digital Invoices & Audit Trail
- Successful transactions shall immediately generate a standardized digital invoice with tax breakdowns.
- The system shall produce downloadable/printable PDF invoices via server-side rendering.
- Sensitive modifications (price alterations, stock adjustments, role elevations) shall create immutable audit log entries.

#### FR-07: Sales Analytics & Demand Forecasting
- The system shall compute daily, weekly, and monthly Gross Merchandise Value (GMV), net revenue, and average transaction value.
- The system shall project next-cycle demand using transparent moving-average velocity metrics.

#### FR-08: Omnichannel Customer Loyalty & Rewards Points Engine
- The system shall maintain real-time loyalty point balances, tier classifications (`Bronze`, `Silver`, `Gold`, `Platinum`), and lifetime expenditure tracking for registered customers.
- Point accrual rates shall dynamically scale based on customer tier multiplier (e.g., Bronze 1.0x, Silver 1.25x, Gold 1.5x, Platinum 2.0x).
- Standard conversion rate shall be strictly enforced (10 points = ₹1.00 discount) with minimum redemption threshold (50 points) and maximum subtotal safety ceiling (50%).
- Point redemption shall be seamlessly supported across online customer checkout and cashier POS terminal with customer lookup by phone number/email.
- Order cancellations and refunds shall automatically reverse loyalty accrual and restore redeemed points with ledger audit records.

---

### 4. Non-Functional Requirements
- **Performance:** Barcode query response time < 50ms; checkout transaction completion < 500ms; loyalty profile & redemption lookup < 50ms.
- **Security:** Passwords salted with bcrypt (10 rounds); JWT tokens signed with SHA-256; Helmet HTTP security headers; CORS restricted; API rate limiting.
- **Availability:** Robust database reconnection handler and stateless application tier.
- **Maintainability:** Modular separation of concerns (Controllers, Services, Models, Routes, Validators).

