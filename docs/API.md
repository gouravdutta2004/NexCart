# REST API Specification (OpenAPI / Blueprint)
## NexCart — Intelligent Supermarket Automation System

### 1. Base Conventions
- **Base URL:** `http://localhost:5001/api/v1` (or `/api/v1` via Vite dev proxy)
- **Authentication:** Bearer JWT in `Authorization` header: `Bearer <token>`
- **Response Format:** Uniform JSON envelopes:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": { "pagination": { ... } }
}
```

---

### 2. Complete Endpoints Catalog

#### System Health Check
- **`GET /api/health`** (Public)
  - Returns server uptime, environment, and MongoDB connection status.

#### Authentication & Profile (`/api/v1/auth`)
- **`POST /register`**: Customer self-registration (`name`, `email`, `password`, `phone`).
- **`POST /login`**: Account authentication (`email`, `password`) -> Returns JWT and User profile.
- **`GET /me`**: Retrieve current session user and active role.
- **`GET /rbac-test/:role`**: Test RBAC enforcement against specific role privileges.

#### Product Catalog (`/api/v1/products`)
- **`GET /`**: Paginated catalog with search, category filtering, and sorting.
- **`GET /:id`**: Product details by MongoDB ObjectId.
- **`GET /barcode/:code`**: Indexed B-Tree barcode scanner lookup for POS & Self-Checkout lanes.
- **`POST /`**: Create product with SKU & barcode (Admin, Inventory Manager).
- **`PUT /:id`**: Update product metadata & pricing (Admin, Inventory Manager).
- **`DELETE /:id`**: Soft-delete/deactivate product (Admin).

#### Category Taxonomy (`/api/v1/categories`)
- **`GET /`**: List all supermarket departments & aisles.
- **`POST /`**: Create new department category (Admin).
- **`PUT /:id`**: Update category details (Admin).
- **`DELETE /:id`**: Remove category (Admin).

#### Inventory & FEFO Batches (`/api/v1/inventory`)
- **`GET /`**: Complete stock catalog with batch quantities, cost prices, and expiry dates.
- **`GET /alerts/low-stock`**: Real-time list of products where `totalStock <= reorderLevel`.
- **`GET /alerts/expiring`** or **`GET /alerts/expiry`**: Batches approaching expiration threshold.
- **`GET /product/:productId`**: Inventory record for specific product.
- **`POST /adjust`**: Record manual stock count adjustment with mandatory reason and immutable audit log entry.

#### Suppliers & Purchase Orders (`/api/v1/suppliers`, `/api/v1/purchase-orders`)
- **`GET /suppliers`**: Active vendor directories.
- **`POST /suppliers`**: Register new supplier partner.
- **`GET /purchase-orders`**: View all purchase order procurement requests.
- **`POST /purchase-orders`**: Generate new purchase order.
- **`PATCH /purchase-orders/:id/receive`**: Receive goods from vendor, automatically creating new inventory batches.

#### Shopping Cart & Product Reviews (`/api/v1/cart`, `/api/v1/reviews`)
- **`GET /cart`**: Customer shopping basket with stock-aware validation.
- **`POST /cart/add`**: Add item with requested quantity.
- **`PUT /cart/update`**: Update item quantity.
- **`DELETE /cart/item/:productId`**: Remove item from basket.
- **`POST /reviews`**: Submit customer product review with 1-5 star rating.
- **`GET /reviews/product/:productId`**: Public customer reviews and ratings summary.

#### Point of Sale & Lane Operations (`/api/v1/pos`)
- **`GET /barcode/:code`**: High-speed item lookup for POS barcode scanner.
- **`POST /hold`**: Park/hold multi-customer cart session for cashier multitasking.
- **`GET /held`**: Retrieve active held cart sessions.
- **`GET /recall/:id`**: Recall held basket back to active billing lane.
- **`POST /validate`**: Pre-checkout stock verification across all line items.

#### Orders & Fulfillment (`/api/v1/orders`)
- **`POST /`**: Create order across Online Web, POS Lane, or Express Self-Checkout. Atomically executes First-Expired First-Out (FEFO) stock deduction, creates Payment record, and compiles digital Invoice snapshot.
- **`GET /my-orders`**: Paginated customer order history (Customer).
- **`GET /:id`**: Order detail breakdown with line items and batch allocations (Customer, Cashier, Admin).
- **`GET /`**: Supermarket-wide order registry with status and channel filters (Admin, Cashier).
- **`PATCH /:id/status`**: Update order fulfillment status (Admin).

#### Digital Invoices & Streaming (`/api/v1/invoices`)
- **`GET /:id`**: Immutable invoice snapshot metadata in JSON.
- **`GET /order/:orderId`**: Retrieve invoice record for a specific order.
- **`GET /:id/pdf`**: Server-side rendered A4 PDF tax invoice stream generated via PDFKit.

#### Business Intelligence & Analytics (`/api/v1/analytics`)
- **`GET /overview`**: Gross revenue, total orders, average order value (AOV), total items sold, and inventory valuation.
- **`GET /sales-trend?days=N`**: Daily sales and order volume time-series (for Recharts Area/Bar charts).
- **`GET /category-breakdown`**: Department revenue and unit sales distribution (for Donut charts).
- **`GET /top-products?limit=5`**: Leaderboard of top 5 best-selling supermarket items.
- **`GET /channel-breakdown`**: Revenue contribution split by Online Web, POS Lane, and Self-Checkout.
- **`GET /demand-forecast`**: Statistical moving-average demand predictions with explainable factors.
- **`GET /markdown-recommendations`**: Dynamic expiry markdown discount recommendations (10% to 50% clearance discounts).

#### Discounts & Promotional Coupons (`/api/v1/discounts`)
- **`GET /`**: Active promotional coupon codes and clearance rules.
- **`POST /`**: Create new discount rule with purchase thresholds and expiry dates (Admin).
- **`POST /validate`**: Real-time coupon code validation during checkout.
- **`PATCH /:id/toggle`**: Toggle discount status between Active and Disabled.

#### Compliance & Audit Logging (`/api/v1/audit-logs`)
- **`GET /`**: Application-level append-only system audit trail capturing user, action, module, previousState, and newState JSON diffs (Admin).
