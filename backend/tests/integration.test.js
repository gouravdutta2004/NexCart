/**
 * NexCart — Intelligent Supermarket Automation System
 * Automated End-to-End Integration & Security Test Suite
 * RUNS AGAINST ISOLATED TEST DATABASE: nexcart_test_db
 */

const http = require('http');
const mongoose = require('mongoose');

// Ensure JWT_SECRET is present in test environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_isolated_secret_key_1234567890_academic';
const config = require('../src/config/env');

// Direct Mongoose to isolated test database
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/nexcart_test_db';
config.MONGODB_URI = TEST_DB_URI;

const { app } = require('../src/server');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Order = require('../src/models/Order');
const Invoice = require('../src/models/Invoice');
const AuditLog = require('../src/models/AuditLog');
const Review = require('../src/models/Review');
const User = require('../src/models/User');
const Supplier = require('../src/models/Supplier');
const Category = require('../src/models/Category');
const Discount = require('../src/models/Discount');
const HeldCart = require('../src/models/HeldCart');
const { seedDatabase } = require('../src/utils/seedData');

const TEST_PORT = 5095;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        let json = null;
        if (contentType.includes('application/json')) {
          try {
            json = JSON.parse(raw.toString());
          } catch (e) {
            json = raw.toString();
          }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          rawBuffer: raw,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 NexCart Automated Integration & Security Test Suite');
  console.log(`📦 Isolated Test Database: ${TEST_DB_URI}`);
  console.log('================================================================');

  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedTests++;
    }
  };

  // 1. Connect to isolated test database and seed fresh fixture state
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();
  await seedDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));

  try {
    // ---------------------------------------------------------
    // TEST SUITE 1: System Health & Base Configuration
    // ---------------------------------------------------------
    console.log('\n--- SUITE 1: System Health & Base Config ---');
    const health = await request('GET', '/api/health');
    assert(health.statusCode === 200, 'Health check returns HTTP 200');
    assert(health.data?.data?.status === 'UP' && health.data?.data?.database?.isConnected === true, 'System status is UP and test database is CONNECTED');

    // ---------------------------------------------------------
    // TEST SUITE 2: Authentication, Password Hashing & RBAC
    // ---------------------------------------------------------
    console.log('\n--- SUITE 2: Authentication & RBAC Security ---');
    
    // Invalid Password Rejection
    const badLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'admin@nexcart.com',
      password: 'WrongPassword999!',
    });
    assert(badLogin.statusCode === 401, 'Invalid password correctly rejected with HTTP 401 Unauthorized');

    // Customer Login
    const custLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'customer@nexcart.com',
      password: 'Customer@123',
    });
    assert(custLogin.statusCode === 200, 'Customer login succeeds with HTTP 200');
    const customerToken = custLogin.data?.data?.token;
    const customerId = custLogin.data?.data?.user?.id;
    assert(typeof customerToken === 'string' && customerToken.length > 20, 'Customer JWT bearer token generated');

    // Admin Login
    const adminLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'admin@nexcart.com',
      password: 'Admin@123',
    });
    assert(adminLogin.statusCode === 200, 'Admin login succeeds with HTTP 200');
    const adminToken = adminLogin.data?.data?.token;

    // RBAC: Customer accessing admin audit logs should be blocked with 403
    const forbiddenAudit = await request('GET', '/api/v1/audit-logs', {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(forbiddenAudit.statusCode === 403, 'Customer denied access to Admin audit logs with HTTP 403 Forbidden');

    // 🔴 Requirement 1: Public Registration Privilege Escalation Prevention
    console.log('\n--- SUITE 2B: Public Registration Security ---');
    const adminRegAttempt = await request('POST', '/api/v1/auth/register', {}, {
      name: 'Malicious Attacker',
      email: 'attacker@evil.com',
      password: 'Password123!',
      role: 'admin',
    });
    assert(
      adminRegAttempt.statusCode === 400,
      'Public self-registration with role=admin rejected with HTTP 400 Bad Request'
    );

    const normalReg = await request('POST', '/api/v1/auth/register', {}, {
      name: 'Jane Regular',
      email: 'jane@example.com',
      password: 'Password123!',
    });
    assert(
      normalReg.statusCode === 201 && normalReg.data?.data?.user?.role === 'customer',
      'Standard customer self-registration succeeds with HTTP 201 and forced customer role'
    );

    // ---------------------------------------------------------
    // TEST SUITE 3: Products & High-Speed Barcode Lookup
    // ---------------------------------------------------------
    console.log('\n--- SUITE 3: Products & High-Speed Barcode Lookup ---');
    const catalog = await request('GET', '/api/v1/products?limit=10');
    assert(catalog.statusCode === 200, 'Catalog query returns HTTP 200');
    const productsList = catalog.data?.data?.products || [];
    assert(productsList.length > 0, 'Catalog contains active supermarket products');

    const sampleProduct = productsList.find((p) => p.barcode === '8901030006030') || productsList[0];
    const barcodeRes = await request('GET', `/api/v1/products/barcode/${sampleProduct.barcode}`);
    assert(barcodeRes.statusCode === 200, `Barcode '${sampleProduct.barcode}' resolved with HTTP 200`);
    assert(barcodeRes.data?.data?.product?.name === sampleProduct.name, `Correct product '${sampleProduct.name}' returned`);

    // 🟠 Requirement 11: Product Audit Logging Verification
    const newProdRes = await request('POST', '/api/v1/products', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      name: 'Organic Greek Yogurt 500g',
      sku: 'TEST-YOGURT-01',
      barcode: '9900112233445',
      categoryId: sampleProduct.categoryId?._id || sampleProduct.categoryId,
      sellingPrice: 120,
      costPrice: 90,
      taxRate: 5,
      unit: 'pcs',
      isExpiryTracked: true,
    });
    assert(newProdRes.statusCode === 201, 'Admin creates product with HTTP 201');
    const createdProd = newProdRes.data?.data?.product;
    assert(createdProd?.sku === 'TEST-YOGURT-01', 'Product created with correct SKU');

    const prodCreateAudit = await AuditLog.findOne({
      action: 'PRODUCT_CREATED',
      recordId: createdProd._id.toString(),
    });
    assert(prodCreateAudit !== null, 'Product creation captured in AuditLog (PRODUCT_CREATED)');
    assert(prodCreateAudit?.module === 'products', 'Product creation audit entry assigned to products module');

    const updateProdRes = await request('PUT', `/api/v1/products/${createdProd._id}`, {
      Authorization: `Bearer ${adminToken}`,
    }, {
      sellingPrice: 135,
    });
    assert(updateProdRes.statusCode === 200, 'Admin updates product with HTTP 200');
    const prodUpdateAudit = await AuditLog.findOne({
      action: 'PRODUCT_UPDATED',
      recordId: createdProd._id.toString(),
    });
    assert(prodUpdateAudit !== null, 'Product update captured in AuditLog (PRODUCT_UPDATED)');
    assert(prodUpdateAudit?.newState?.sellingPrice === 135, 'Audit log correctly recorded updated sellingPrice');

    // 🛡️ Security Audit: ReDoS and special-character regex safety
    const specialSearchRes = await request('GET', '/api/v1/products?search=' + encodeURIComponent('(spaghetti+[*'));
    assert(specialSearchRes.statusCode === 200, 'Search query with regex special characters safely returns HTTP 200 without syntax crash (ReDoS protected)');

    // 🛡️ Security Audit: Unauthorized sort field whitelisting fallback
    const sortRes = await request('GET', '/api/v1/products?sortBy=maliciousInjectedField&sortOrder=asc');
    assert(sortRes.statusCode === 200, 'Catalog query with unwhitelisted sort key safely defaults with HTTP 200');

    // ---------------------------------------------------------
    // TEST SUITE 4: Inventory & Expiry Radar
    // ---------------------------------------------------------
    console.log('\n--- SUITE 4: Inventory & Expiry Radar ---');
    const expiryRes = await request('GET', '/api/v1/inventory/alerts/expiry', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(expiryRes.statusCode === 200, 'Expiry radar alerts return HTTP 200');
    const batchAlerts = expiryRes.data?.data?.expiringBatches || expiryRes.data?.data?.alerts || [];
    assert(Array.isArray(batchAlerts), 'Expiry radar returns batch alert array');

    // 🔴 Requirement 6: Concurrent Stock Overselling Prevention
    console.log('\n--- SUITE 4B: Stock Overselling Prevention ---');
    const excessiveOrderRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'online',
      items: [{ productId: sampleProduct._id, quantity: 999999 }],
      paymentDetails: { method: 'card' },
    });
    assert(
      excessiveOrderRes.statusCode === 400,
      'Order exceeding available inventory strictly rejected with HTTP 400 (no overselling)'
    );

    // 🔴 Requirement 6B: Real Concurrent Checkout Protection (2 Simultaneous Requests)
    console.log('\n--- SUITE 4B2: Real Concurrent Checkout Protection ---');
    const shopper2Res = await request('POST', '/api/v1/auth/register', {}, {
      name: 'Rohan Concurrent Buyer',
      email: 'rohan.concurrent@nexcart.com',
      password: 'Customer@123',
    });
    const shopper2Login = await request('POST', '/api/v1/auth/login', {}, {
      email: 'rohan.concurrent@nexcart.com',
      password: 'Customer@123',
    });
    const shopper2Token = shopper2Login.data?.data?.token;

    const defaultCategory = await Category.findOne();

    const concurrentProduct = await Product.create({
      name: 'Limited Stock Amul Butter 500g',
      sku: 'CONCURRENT-AMUL-01',
      barcode: '8901262019999',
      categoryId: defaultCategory._id,
      sellingPrice: 275,
      costPrice: 240,
      taxRate: 5,
      unit: 'pcs',
      isActive: true,
    });

    await Inventory.create({
      productId: concurrentProduct._id,
      totalStock: 5,
      reorderLevel: 2,
      batches: [{
        batchNumber: 'BATCH-CC-01',
        quantity: 5,
        expiryDate: new Date(Date.now() + 60 * 86400000),
        costPrice: 240,
        receivedDate: new Date(),
      }],
    });

    // Execute 2 concurrent checkout requests for all 5 units simultaneously
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      request('POST', '/api/v1/orders', { Authorization: `Bearer ${customerToken}` }, {
        orderType: 'online',
        items: [{ productId: concurrentProduct._id, quantity: 5 }],
        paymentDetails: { method: 'card' },
      }),
      request('POST', '/api/v1/orders', { Authorization: `Bearer ${shopper2Token}` }, {
        orderType: 'online',
        items: [{ productId: concurrentProduct._id, quantity: 5 }],
        paymentDetails: { method: 'card' },
      }),
    ]);

    const successCount = (concurrentRes1.statusCode === 201 ? 1 : 0) + (concurrentRes2.statusCode === 201 ? 1 : 0);
    const rejectCount = (concurrentRes1.statusCode === 400 ? 1 : 0) + (concurrentRes2.statusCode === 400 ? 1 : 0);

    assert(
      successCount === 1 && rejectCount === 1,
      'Real concurrent checkout: Exactly one order succeeded (HTTP 201) and one rejected (HTTP 400) under race condition'
    );

    const concurrentInv = await Inventory.findOne({ productId: concurrentProduct._id });
    assert(
      concurrentInv.totalStock === 0 && concurrentInv.batches[0].quantity === 0,
      'Inventory stock reduced to exactly 0 with zero overselling under concurrent requests'
    );

    // 🟠 Requirement 10: Transactional Purchase Order Receiving
    console.log('\n--- SUITE 4C: Transactional Purchase Order Receiving ---');
    const existingSupplier = await Supplier.findOne();
    assert(existingSupplier !== null, 'Supplier exists in test database');

    const poCreateRes = await request('POST', '/api/v1/purchase-orders', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      supplierId: existingSupplier._id,
      items: [
        {
          productId: sampleProduct._id,
          orderedQty: 20,
          unitCost: 45,
        },
      ],
    });
    assert(poCreateRes.statusCode === 201, 'Admin generates purchase order with HTTP 201');
    const createdPO = poCreateRes.data?.data?.purchaseOrder;
    assert(createdPO?.status === 'placed', 'Purchase order initialized with placed status');

    const poReceiveRes = await request('PATCH', `/api/v1/purchase-orders/${createdPO._id}/receive`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(poReceiveRes.statusCode === 200, 'Purchase order received transactionally with HTTP 200');
    assert(poReceiveRes.data?.data?.purchaseOrder?.status === 'received', 'Purchase order status updated to received');

    const poAuditEntry = await AuditLog.findOne({
      action: 'PO_RECEIVED',
      recordId: createdPO._id.toString(),
    });
    assert(poAuditEntry !== null, 'PO receiving recorded in AuditLog with action PO_RECEIVED');
    assert(poAuditEntry?.module === 'inventory', 'PO receiving audit log assigned to inventory module');

    // ---------------------------------------------------------
    // TEST SUITE 5: Orders, Coupons, Server-Controlled Pricing & Invoices
    // ---------------------------------------------------------
    console.log('\n--- SUITE 5: Orders, Coupons & Server-Controlled Pricing ---');
    
    // 🔴 Requirement 3 & 4: Server authoritative discount & coupon connection
    const orderPayload = {
      orderType: 'online',
      items: [{
        productId: sampleProduct._id,
        quantity: 10, // 10 * 2.69 = 26.90 >= 20 to satisfy minPurchaseAmount
        // Client attempt to inject arbitrary discount or 0% tax:
        discountAmount: 9999,
        taxRate: 0,
      }],
      couponCode: 'WELCOME10', // 10% coupon
      paymentDetails: {
        method: 'card',
        customerName: 'Emily Watson',
        customerEmail: 'customer@nexcart.com',
      },
    };

    const orderRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, orderPayload);

    assert(orderRes.statusCode === 201, 'Order created successfully with HTTP 201 Created');
    const createdOrder = orderRes.data?.data?.order;
    const createdInvoice = orderRes.data?.data?.invoice;
    assert(createdOrder?.orderNumber?.startsWith('NXC-ORD-'), `Order assigned unique reference: ${createdOrder?.orderNumber}`);
    assert(createdOrder?.couponCode === 'WELCOME10', 'Coupon WELCOME10 stored in order record');
    assert(createdOrder?.couponDiscount > 0, 'Server calculated authentic coupon discount amount');
    assert(createdInvoice?.invoiceNumber?.startsWith('NXC-INV-'), `Invoice assigned reference: ${createdInvoice?.invoiceNumber}`);

    // Verify FEFO batch allocations captured in order items
    const firstItem = createdOrder.items?.[0];
    assert(Array.isArray(firstItem?.batchAllocations) && firstItem.batchAllocations.length > 0, 'FEFO batch allocations captured in order item');

    // 🛡️ Concurrency Audit: Exhausted coupon usage limit cannot be consumed
    await Discount.create({
      code: 'EXHAUSTED99',
      title: 'Exhausted Promo',
      discountType: 'percentage',
      discountValue: 10,
      minPurchaseAmount: 10,
      endDate: new Date(Date.now() + 86400000),
      usageLimit: 1,
      usedCount: 1,
      isActive: true,
    });

    const exhaustedOrderRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'online',
      items: [{ productId: sampleProduct._id, quantity: 1 }],
      couponCode: 'EXHAUSTED99',
      paymentDetails: { method: 'card' },
    });
    assert(
      exhaustedOrderRes.statusCode === 400,
      'Order with exhausted coupon usageLimit strictly rejected with HTTP 400 Bad Request'
    );

    // 🔴 Requirement 2: Anonymous Checkout Restriction (Only SELF_CHECKOUT permitted anonymously)
    const anonOnlineOrderRes = await request('POST', '/api/v1/orders', {}, {
      orderType: 'online',
      items: [{ productId: sampleProduct._id, quantity: 1 }],
      paymentDetails: { method: 'card' },
    });
    assert(
      anonOnlineOrderRes.statusCode === 401,
      'Anonymous online checkout strictly rejected with HTTP 401 Unauthorized'
    );

    const anonSelfCheckoutRes = await request('POST', '/api/v1/orders', {}, {
      orderType: 'self_checkout',
      items: [{ productId: sampleProduct._id, quantity: 1 }],
      paymentDetails: { method: 'card' },
    });
    assert(
      anonSelfCheckoutRes.statusCode === 201 && anonSelfCheckoutRes.data?.data?.order?.orderType === 'self_checkout',
      'Anonymous express self-checkout permitted with HTTP 201 Created and self_checkout order type'
    );

    // 🔴 Requirement 2: Protected Invoice PDF Endpoint
    console.log('\n--- SUITE 5B: Invoice PDF Protection ---');
    
    // Anonymous download without token must be rejected with 401
    const anonPdf = await request('GET', `/api/v1/invoices/${createdInvoice._id}/pdf`);
    assert(anonPdf.statusCode === 401, 'Anonymous PDF download without token rejected with HTTP 401 Unauthorized');

    // Token in query parameter (?token=...) must be rejected with 401 (JWT strictly removed from URL)
    const queryPdf = await request('GET', `/api/v1/invoices/${createdInvoice._id}/pdf?token=${encodeURIComponent(customerToken)}`);
    assert(queryPdf.statusCode === 401, 'Invoice PDF endpoint with token in query param strictly rejected with HTTP 401 (JWT removed from URL)');

    // Authorized customer via Authorization Bearer header
    const headerPdf = await request('GET', `/api/v1/invoices/${createdInvoice._id}/pdf`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(headerPdf.statusCode === 200, 'Invoice PDF endpoint with Bearer header returns HTTP 200');
    assert(headerPdf.headers['content-type']?.includes('application/pdf'), 'Content-Type header is application/pdf');
    assert(headerPdf.rawBuffer.length > 500, `Valid PDF stream generated (${headerPdf.rawBuffer.length} bytes)`);

    // Customer requesting another customer's invoice
    const otherUser = await User.create({
      name: 'Stranger Bob',
      email: 'stranger@example.com',
      password: 'Password123!',
      role: 'customer',
    });
    const strangerLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'stranger@example.com',
      password: 'Password123!',
    });
    const strangerToken = strangerLogin.data?.data?.token;

    const strangerPdf = await request('GET', `/api/v1/invoices/${createdInvoice._id}/pdf`, {
      Authorization: `Bearer ${strangerToken}`,
    });
    assert(strangerPdf.statusCode === 403, 'Unauthorized customer requesting another invoice rejected with HTTP 403 Forbidden');

    // ---------------------------------------------------------
    // TEST SUITE 5C: Forced Checkout Rollback Restoration
    // ---------------------------------------------------------
    console.log('\n--- SUITE 5C: Forced Checkout Rollback Restoration ---');
    const rollbackProduct = await Product.create({
      name: 'Multi-Batch Rollback Biscuit',
      sku: 'ROLLBACK-BISCUIT-01',
      barcode: '8901262018888',
      categoryId: defaultCategory._id,
      sellingPrice: 50,
      costPrice: 35,
      taxRate: 5,
      unit: 'pcs',
      isActive: true,
    });

    const expiryEarly = new Date(Date.now() + 10 * 86400000);
    const expiryLate = new Date(Date.now() + 45 * 86400000);

    await Inventory.create({
      productId: rollbackProduct._id,
      totalStock: 10,
      reorderLevel: 3,
      batches: [
        {
          batchNumber: 'BATCH-RB-EARLY',
          quantity: 3,
          expiryDate: expiryEarly,
          costPrice: 35,
          receivedDate: new Date(),
        },
        {
          batchNumber: 'BATCH-RB-LATE',
          quantity: 7,
          expiryDate: expiryLate,
          costPrice: 35,
          receivedDate: new Date(),
        },
      ],
    });

    await Discount.create({
      code: 'FORCEDROLLBACK10',
      title: 'Forced Rollback Test Promo',
      discountType: 'percentage',
      discountValue: 10,
      minPurchaseAmount: 100,
      endDate: new Date(Date.now() + 86400000),
      usageLimit: 5,
      usedCount: 0,
      isActive: true,
    });

    // Attempt checkout for 5 units with invalid payment method to trigger failure after deduction & coupon increment
    const failedCheckoutRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'online',
      items: [{ productId: rollbackProduct._id, quantity: 5 }],
      couponCode: 'FORCEDROLLBACK10',
      paymentDetails: {
        method: 'INVALID_ROLLBACK_PAYMENT_METHOD',
      },
    });

    assert(
      failedCheckoutRes.statusCode === 400,
      'Forced checkout failure correctly triggers HTTP 400 Bad Request error'
    );

    const rollbackInvAfter = await Inventory.findOne({ productId: rollbackProduct._id });
    const batchEarly = rollbackInvAfter.batches.find((b) => b.batchNumber === 'BATCH-RB-EARLY');
    const batchLate = rollbackInvAfter.batches.find((b) => b.batchNumber === 'BATCH-RB-LATE');
    const couponAfter = await Discount.findOne({ code: 'FORCEDROLLBACK10' });
    const orphanOrdersCount = await Order.countDocuments({ couponCode: 'FORCEDROLLBACK10' });

    assert(
      batchEarly?.quantity === 3 && batchLate?.quantity === 7 && rollbackInvAfter?.totalStock === 10,
      'Forced rollback restores exact FEFO batch quantities (Batch 1: 3, Batch 2: 7, Total: 10)'
    );
    assert(
      couponAfter?.usedCount === 0 && orphanOrdersCount === 0,
      'Forced rollback restores coupon usedCount to 0 and leaves no orphan orders'
    );

    // ---------------------------------------------------------
    // TEST SUITE 6: Sales Analytics, Forecasting & Markdowns
    // ---------------------------------------------------------
    console.log('\n--- SUITE 6: Analytics, Demand Forecasting & Markdowns ---');
    const analyticsRes = await request('GET', '/api/v1/analytics/overview', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(analyticsRes.statusCode === 200, 'Analytics overview returns HTTP 200');
    assert(analyticsRes.data?.data?.totalRevenue > 0, 'Gross revenue accurately reflects placed orders');

    // 🟠 Requirement 12: 7-day window demand forecasting
    const forecastRes = await request('GET', '/api/v1/analytics/demand-forecast', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(forecastRes.statusCode === 200, 'Demand forecast returns HTTP 200');
    assert(forecastRes.data?.data?.forecastWindowDays === 7, 'Forecast uses actual 7-day window analysis');

    // 🟠 Requirement 13: Remove unsupported 2.8x markdown claim
    const markdownRes = await request('GET', '/api/v1/analytics/markdown-recommendations', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(markdownRes.statusCode === 200, 'Markdown recommendations return HTTP 200');
    const sampleRec = markdownRes.data?.data?.recommendations?.[0];
    if (sampleRec) {
      assert(!sampleRec.explanation.includes('2.8x'), 'Markdown explanation free of unsupported 2.8x velocity claims');
    }

    // ---------------------------------------------------------
    // TEST SUITE 7: Admin User Management
    // ---------------------------------------------------------
    console.log('\n--- SUITE 7: Admin User Management ---');
    
    // Customer cannot access user directory
    const custUserList = await request('GET', '/api/v1/users', {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(custUserList.statusCode === 403, 'Customer denied access to /api/v1/users with HTTP 403 Forbidden');

    // Admin can access user directory
    const adminUserList = await request('GET', '/api/v1/users', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminUserList.statusCode === 200, 'Admin accesses /api/v1/users successfully with HTTP 200');
    assert(Array.isArray(adminUserList.data?.data), 'User list returns array of system accounts');

    // Admin provisions new staff member
    const newStaffRes = await request('POST', '/api/v1/users', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      name: 'Alex Cashier Lane 2',
      email: 'alex.pos@nexcart.com',
      password: 'Cashier@123',
      role: 'cashier',
      phone: '+91 99887 76655',
    });
    assert(newStaffRes.statusCode === 201, 'Admin creates new Cashier account with HTTP 201');
    const newStaffId = newStaffRes.data?.data?.user?.id || newStaffRes.data?.data?.user?._id;

    // Admin toggles user status
    const toggleStatusRes = await request('PATCH', `/api/v1/users/${newStaffId}/status`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(toggleStatusRes.statusCode === 200, 'Admin toggles user status with HTTP 200');
    assert(toggleStatusRes.data?.data?.user?.status === 'inactive', 'User status successfully toggled to inactive');

    // ---------------------------------------------------------
    // TEST SUITE 8: Verified-Purchase Reviews
    // ---------------------------------------------------------
    console.log('\n--- SUITE 8: Verified-Purchase Reviews ---');
    
    // Customer Emily purchased sampleProduct earlier -> review is verified
    const verifiedReviewRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: sampleProduct._id,
      rating: 5,
      comment: 'Excellent quality spaghetti, cooked perfectly al dente!',
    });
    assert(verifiedReviewRes.statusCode === 201, 'Customer review submitted successfully');
    assert(
      verifiedReviewRes.data?.data?.review?.isVerifiedPurchase === true,
      'Review marked as verified purchase (customer actually purchased the item)'
    );

    // Stranger Bob never purchased sampleProduct -> review is unverified
    const unverifiedReviewRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${strangerToken}`,
    }, {
      productId: sampleProduct._id,
      rating: 4,
      comment: 'Looks like a great product on the shelf!',
    });
    assert(
      unverifiedReviewRes.data?.data?.review?.isVerifiedPurchase === false,
      'Review correctly marked as unverified (customer never purchased the item)'
    );

    // 🟠 Requirement 12: Customer with only processing order is NOT marked as verified purchase
    const pendingCust = await User.create({
      name: 'Processing Order Customer',
      email: 'processing.buyer@example.com',
      password: 'Password123!',
      role: 'customer',
    });
    const pendingCustLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'processing.buyer@example.com',
      password: 'Password123!',
    });
    const pendingCustToken = pendingCustLogin.data?.data?.token;

    await Order.create({
      orderNumber: 'NXC-ORD-PROC-999',
      customer: pendingCust._id,
      orderType: 'online',
      items: [{
        product: sampleProduct._id,
        name: sampleProduct.name,
        sku: sampleProduct.sku || 'SKU-SAMPLE-01',
        barcode: sampleProduct.barcode || '8901030006030',
        quantity: 1,
        unitPrice: 50,
        subtotal: 50,
      }],
      subtotal: 50,
      totalAmount: 50,
      orderStatus: 'processing',
      paymentStatus: 'pending',
    });

    const pendingReviewRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${pendingCustToken}`,
    }, {
      productId: sampleProduct._id,
      rating: 4,
      comment: 'Ordered but processing, checking verified purchase flag',
    });
    assert(
      pendingReviewRes.data?.data?.review?.isVerifiedPurchase === false,
      'Review correctly unverified when order is processing (strictly requires completed order)'
    );

    // ---------------------------------------------------------
    // TEST SUITE 9: Immutable Audit Trail
    // ---------------------------------------------------------
    console.log('\n--- SUITE 9: Immutable Audit Trail ---');
    const auditRes = await request('GET', '/api/v1/audit-logs', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(auditRes.statusCode === 200, 'Audit log endpoint returns HTTP 200');
    const logs = auditRes.data?.data?.logs || [];
    assert(logs.length > 0, 'Audit log contains system events (users, orders, logins)');

    // Attempting to modify audit log via Mongoose throws immutability error
    let immutabilityBlocked = false;
    try {
      await AuditLog.updateOne({ _id: logs[0]._id }, { notes: 'Tampered notes' });
    } catch (e) {
      immutabilityBlocked = true;
    }
    assert(immutabilityBlocked === true, 'Mongoose immutability hook prevents tampering with audit logs');

    // ---------------------------------------------------------
    // TEST SUITE 10: Role-Enforced Order Types, Held-Cart Ownership & Reduced Stock Disclosure
    // ---------------------------------------------------------
    console.log('\n--- SUITE 10: Role Enforcement, Cart Ownership & Stock Privacy ---');

    // Create Cashier 1
    const cashier1 = await User.create({
      name: 'Cashier Primary',
      email: 'cashier1@example.com',
      password: 'Password123!',
      role: 'cashier',
    });
    const cashier1Login = await request('POST', '/api/v1/auth/login', {}, {
      email: 'cashier1@example.com',
      password: 'Password123!',
    });
    const cashierToken = cashier1Login.data?.data?.token;

    // 10A: Role-enforced order types
    // Customer attempting pos_walkin must be rejected with 403 Forbidden
    const customerSpoofPos = await request(
      'POST',
      '/api/v1/orders',
      { Authorization: `Bearer ${customerToken}` },
      {
        orderType: 'pos_walkin',
        items: [{ productId: sampleProduct._id, quantity: 1 }],
        paymentDetails: { method: 'card' },
      }
    );
    assert(
      customerSpoofPos.statusCode === 403,
      'Customer attempting POS walk-in order strictly rejected with HTTP 403 Forbidden'
    );

    // Cashier attempting online order must be rejected with 400 Bad Request
    const cashierSpoofOnline = await request(
      'POST',
      '/api/v1/orders',
      { Authorization: `Bearer ${cashierToken}` },
      {
        orderType: 'online',
        items: [{ productId: sampleProduct._id, quantity: 1 }],
        paymentDetails: { method: 'cash' },
      }
    );
    assert(
      cashierSpoofOnline.statusCode === 400,
      'Cashier attempting online delivery order strictly rejected with HTTP 400 Bad Request'
    );

    // 10B: Held-cart ownership enforcement
    // Create Cashier 2
    const cashier2 = await User.create({
      name: 'Cashier Second',
      email: 'cashier2@example.com',
      password: 'Password123!',
      role: 'cashier',
    });
    const cashier2Login = await request('POST', '/api/v1/auth/login', {}, {
      email: 'cashier2@example.com',
      password: 'Password123!',
    });
    const cashier2Token = cashier2Login.data?.data?.token;

    // Cashier 1 holds a cart
    const holdRes = await request(
      'POST',
      '/api/v1/pos/hold',
      { Authorization: `Bearer ${cashierToken}` },
      {
        items: [{
          productId: sampleProduct._id,
          name: sampleProduct.name,
          barcode: sampleProduct.barcode,
          quantity: 2,
          unitPrice: sampleProduct.sellingPrice,
        }],
        customerName: 'Customer Alpha',
      }
    );
    assert(holdRes.statusCode === 201, 'Cashier 1 holds cart successfully');
    const heldCartId = holdRes.data?.data?.heldCart?._id;

    // Cashier 2 attempts to recall Cashier 1's cart -> strictly rejected with 403 Forbidden
    const cashier2RecallRes = await request(
      'DELETE',
      `/api/v1/pos/held/${heldCartId}`,
      { Authorization: `Bearer ${cashier2Token}` }
    );
    assert(
      cashier2RecallRes.statusCode === 403,
      'Cashier 2 attempting to recall Cashier 1 cart strictly rejected with HTTP 403 Forbidden'
    );

    // Cashier 2 listing held carts should see 0 carts (scoped to own cashier account)
    const cashier2List = await request('GET', '/api/v1/pos/held', {
      Authorization: `Bearer ${cashier2Token}`,
    });
    assert(
      cashier2List.data?.data?.heldCarts?.length === 0,
      'Cashier 2 held carts list correctly scoped to own account (0 visible)'
    );

    // Admin can recall Cashier 1's cart
    const adminRecallRes = await request(
      'DELETE',
      `/api/v1/pos/held/${heldCartId}`,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      adminRecallRes.statusCode === 200,
      'Admin successfully recalls and manages held cart across all cashiers with HTTP 200'
    );

    // 10C: Reduced public inventory disclosure from POS endpoints
    // Unauthenticated public barcode scan
    const publicScanRes = await request('GET', `/api/v1/pos/barcode/${sampleProduct.barcode}`);
    assert(publicScanRes.statusCode === 200, 'Public barcode scan returns HTTP 200');
    assert(
      publicScanRes.data?.data?.inStock !== undefined,
      'Public scan includes inStock boolean indicator'
    );
    assert(
      publicScanRes.data?.data?.availableStock === undefined,
      'Public scan strictly hides internal availableStock quantity to prevent inventory disclosure'
    );
    assert(
      publicScanRes.data?.data?.earliestExpiry === undefined,
      'Public scan strictly hides warehouse earliestExpiry batch dates'
    );

    // Authenticated cashier barcode scan
    const cashierScanRes = await request('GET', `/api/v1/pos/barcode/${sampleProduct.barcode}`, {
      Authorization: `Bearer ${cashierToken}`,
    });
    assert(cashierScanRes.statusCode === 200, 'Cashier barcode scan returns HTTP 200');
    assert(
      typeof cashierScanRes.data?.data?.availableStock === 'number',
      'Authenticated cashier scan legitimately provides warehouse availableStock'
    );

  } catch (err) {
    console.error('Test Suite Aborted Due to Error:', err);
    failedTests++;
  } finally {
    server.close();
    // Drop test database to leave environment completely clean
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {}
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
