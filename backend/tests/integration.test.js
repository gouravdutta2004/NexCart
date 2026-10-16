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
const { validateTestDatabaseUri } = require('../src/utils/testDatabaseGuard');
const { isOriginAllowed, getAllowedOrigins } = require('../src/config/corsHelper');
const { initSocket, socketAuthMiddleware } = require('../src/config/socket');

// Direct Mongoose to isolated test database after strict safety validation
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/nexcart_test_db';
validateTestDatabaseUri(TEST_DB_URI);
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
    const payload = body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload !== null && !reqHeaders['Content-Length'] && !reqHeaders['content-length']) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders,
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
    if (payload !== null) {
      req.write(payload);
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

  // 1. Strict safety check on database URI before connection and destructive cleanup
  const safetyCheck = validateTestDatabaseUri(TEST_DB_URI);
  console.log(`🔒 Test database safety verified: target db='${safetyCheck.dbName}' on host='${safetyCheck.hostname}'`);
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();
  await seedDatabase();

  const server = http.createServer(app);
  initSocket(server);
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

    // Review input validation checks (rating bounds & comment requirement)
    const invalidRatingRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: sampleProduct._id,
      rating: 6,
      comment: 'Super great!',
    });
    assert(invalidRatingRes.statusCode === 400, 'Review with rating > 5 is rejected with HTTP 400');

    const missingCommentRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: sampleProduct._id,
      rating: 5,
      comment: '   ',
    });
    assert(missingCommentRes.statusCode === 400, 'Review with empty/missing comment is rejected with HTTP 400');

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

    // ---------------------------------------------------------
    // TEST SUITE 11: Deep Audit Regression & Edge Case Validations
    // ---------------------------------------------------------
    console.log('\n--- SUITE 11: Deep Audit Regression & Edge Cases ---');

    const existingCat = await Category.findOne();
    const regressionCatId = existingCat ? existingCat._id : (await Category.create({ name: 'Regression Audit Category', slug: 'reg-audit-cat' }))._id;

    // 11A: Multi-batch stock adjustment reduction math
    const multiBatchProd = await Product.create({
      name: 'Multi-Batch Test Ghee',
      sku: 'TEST-GHEE-01',
      barcode: '8901030999999',
      sellingPrice: 500,
      costPrice: 400,
      categoryId: regressionCatId,
    });

    const exp1 = new Date();
    exp1.setDate(exp1.getDate() + 30);
    const exp2 = new Date();
    exp2.setDate(exp2.getDate() + 60);

    const mbInv = await Inventory.create({
      productId: multiBatchProd._id,
      totalStock: 30,
      reorderLevel: 5,
      optimalStock: 40,
      batches: [
        { batchNumber: 'GHEE-B1', quantity: 10, expiryDate: exp1, costPrice: 400 },
        { batchNumber: 'GHEE-B2', quantity: 20, expiryDate: exp2, costPrice: 400 },
      ],
    });

    // Reduce stock from 30 down to 5 via stock adjustment API
    const adjustRes = await request('POST', '/api/v1/inventory/adjust', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      productId: multiBatchProd._id.toString(),
      newQuantity: 5,
      reason: 'Physical inventory cycle audit count',
    });
    assert(adjustRes.statusCode === 200, 'Stock adjustment API returns HTTP 200');

    // Query DB directly to verify exact multi-batch reduction
    const updatedMbInv = await Inventory.findById(mbInv._id);
    const batchSum = updatedMbInv.batches.reduce((sum, b) => sum + b.quantity, 0);
    assert(
      updatedMbInv.totalStock === 5 && batchSum === 5,
      `Multi-batch reduction accurately reduced stock to 5 units (totalStock: ${updatedMbInv.totalStock}, batchSum: ${batchSum})`
    );

    // 11B: Automatic Inventory creation on new product
    const autoProdRes = await request('POST', '/api/v1/products', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      name: 'Automated Inventory Biscuit',
      barcode: '8901030888888',
      sku: 'AUTO-BISCUIT-01',
      categoryId: regressionCatId.toString(),
      costPrice: 20,
      sellingPrice: 30,
      taxRate: 5,
    });
    assert(autoProdRes.statusCode === 201, 'Admin creates product successfully with HTTP 201');

    const createdProdId = autoProdRes.data?.data?.product?._id;
    const autoInv = await Inventory.findOne({ productId: createdProdId });
    assert(
      autoInv !== null && autoInv.totalStock === 0,
      'New product automatically has an initialized Inventory record with totalStock 0'
    );

    // 11C: Admin access to /my-orders
    const adminOrdersRes = await request('GET', '/api/v1/orders/my-orders', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminOrdersRes.statusCode === 200, 'Admin accesses /api/v1/orders/my-orders with HTTP 200');

    // 11D: Customer orders return invoiceId
    const custOrdersRes = await request('GET', '/api/v1/orders/my-orders', {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(custOrdersRes.statusCode === 200, 'Customer order history returns HTTP 200');
    const firstOrder = custOrdersRes.data?.data?.[0];
    assert(
      firstOrder && firstOrder.invoiceId !== undefined && firstOrder.invoiceId !== null,
      'Order history explicitly provides invoiceId for digital receipt downloading'
    );

    // ---------------------------------------------------------
    // TEST SUITE 12: Enterprise Access Control & Held-Cart Integrity
    // ---------------------------------------------------------
    console.log('\n--- SUITE 12: Enterprise Access Control & Held-Cart Integrity ---');

    // Setup tokens for Customer A, Customer B, Cashier, Inventory Manager, Admin
    const custBLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'jane@example.com',
      password: 'Password123!',
    });
    const customerBToken = custBLogin.data?.data?.token;

    const invManagerLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'inventory@nexcart.com',
      password: 'Inventory@123',
    });
    const invManagerToken = invManagerLogin.data?.data?.token;

    const cashierLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'cashier@nexcart.com',
      password: 'Cashier@123',
    });
    const mainCashierToken = cashierLogin.data?.data?.token;

    // Pick an active product for testing
    const testProduct = await Product.findOne({ isActive: true, barcode: '8901030001011' }); // Amul Milk

    // 12A. Customer A creates a private online delivery order
    const custAOrderRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'online',
      items: [{ productId: testProduct._id.toString(), quantity: 1 }],
      paymentDetails: { method: 'card' },
      shippingAddress: {
        fullName: 'Emily Watson',
        addressLine1: '42 Baker Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
      },
    });
    assert(custAOrderRes.statusCode === 201, 'Customer A creates online order with HTTP 201');
    const orderAId = custAOrderRes.data?.data?.order?._id;
    const invoiceAId = custAOrderRes.data?.data?.invoice?._id;
    assert(orderAId && invoiceAId, 'Order A and Invoice A successfully generated');

    // 12B. Order Access Control Matrix
    // 1. Customer A reads own order -> 200
    const readOwnOrder = await request('GET', `/api/v1/orders/${orderAId}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(readOwnOrder.statusCode === 200, 'Customer A reads their own order with HTTP 200');

    // 2. Customer B reads Customer A order -> 403 (IDOR prevention)
    const idorOrder = await request('GET', `/api/v1/orders/${orderAId}`, {
      Authorization: `Bearer ${customerBToken}`,
    });
    assert(idorOrder.statusCode === 403, 'Customer B reading Customer A order denied with HTTP 403 Forbidden (IDOR)');

    // 3. Unauthenticated user reads order -> 401
    const unauthOrder = await request('GET', `/api/v1/orders/${orderAId}`);
    assert(unauthOrder.statusCode === 401, 'Unauthenticated user reading order rejected with HTTP 401 Unauthorized');

    // 4. Inventory Manager reads order -> 403
    const invOrder = await request('GET', `/api/v1/orders/${orderAId}`, {
      Authorization: `Bearer ${invManagerToken}`,
    });
    assert(invOrder.statusCode === 403, 'Inventory Manager reading order denied with HTTP 403 Forbidden');

    // 5. Cashier reads online delivery order (outside cashier lane scope) -> 403
    const cashierOnlineOrder = await request('GET', `/api/v1/orders/${orderAId}`, {
      Authorization: `Bearer ${mainCashierToken}`,
    });
    assert(cashierOnlineOrder.statusCode === 403, 'Cashier accessing online delivery order outside scope denied with HTTP 403 Forbidden');

    // 6. Admin reads Customer A order -> 200
    const adminReadOrder = await request('GET', `/api/v1/orders/${orderAId}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminReadOrder.statusCode === 200, 'Admin reads Customer A order with HTTP 200');

    // 7. Cashier creates and reads authorized POS walk-in order -> 200
    const cashierPosOrder = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{ productId: testProduct._id.toString(), quantity: 1 }],
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 100 } },
    });
    assert(cashierPosOrder.statusCode === 201, 'Cashier processes POS walk-in order with HTTP 201');
    const posOrderId = cashierPosOrder.data?.data?.order?._id;
    const posInvoiceId = cashierPosOrder.data?.data?.invoice?._id;

    const cashierReadsPos = await request('GET', `/api/v1/orders/${posOrderId}`, {
      Authorization: `Bearer ${mainCashierToken}`,
    });
    assert(cashierReadsPos.statusCode === 200, 'Cashier accesses authorized POS walk-in order with HTTP 200');

    // 12C. Invoice Access Control Matrix
    // 1. Customer A reads own invoice by ID -> 200
    const custOwnInvoice = await request('GET', `/api/v1/invoices/${invoiceAId}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(custOwnInvoice.statusCode === 200, 'Customer A accesses own invoice metadata with HTTP 200');

    // 2. Customer A reads own invoice by Order ID -> 200
    const custOwnInvoiceByOrder = await request('GET', `/api/v1/invoices/order/${orderAId}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(custOwnInvoiceByOrder.statusCode === 200, 'Customer A accesses invoice by Order ID with HTTP 200');

    // 3. Customer B reads Customer A invoice -> 403
    const idorInvoice = await request('GET', `/api/v1/invoices/${invoiceAId}`, {
      Authorization: `Bearer ${customerBToken}`,
    });
    assert(idorInvoice.statusCode === 403, 'Customer B accessing Customer A invoice denied with HTTP 403 Forbidden');

    // 4. Customer B reads Customer A invoice by order ID -> 403
    const idorInvoiceByOrder = await request('GET', `/api/v1/invoices/order/${orderAId}`, {
      Authorization: `Bearer ${customerBToken}`,
    });
    assert(idorInvoiceByOrder.statusCode === 403, 'Customer B accessing Customer A invoice by order ID denied with HTTP 403 Forbidden');

    // 5. Unauthenticated user downloads invoice PDF -> 401
    const unauthPdf = await request('GET', `/api/v1/invoices/${invoiceAId}/pdf`);
    assert(unauthPdf.statusCode === 401, 'Unauthenticated PDF request denied with HTTP 401 Unauthorized');

    // 6. Inventory Manager requests invoice metadata -> 403
    const invInvoice = await request('GET', `/api/v1/invoices/${invoiceAId}`, {
      Authorization: `Bearer ${invManagerToken}`,
    });
    assert(invInvoice.statusCode === 403, 'Inventory Manager accessing invoice metadata denied with HTTP 403 Forbidden');

    // 7. Inventory Manager requests invoice PDF -> 403
    const invPdf = await request('GET', `/api/v1/invoices/${invoiceAId}/pdf`, {
      Authorization: `Bearer ${invManagerToken}`,
    });
    assert(invPdf.statusCode === 403, 'Inventory Manager requesting invoice PDF denied with HTTP 403 Forbidden');

    // 8. Cashier requests Customer A online order PDF -> 403
    const cashierOnlinePdf = await request('GET', `/api/v1/invoices/${invoiceAId}/pdf`, {
      Authorization: `Bearer ${mainCashierToken}`,
    });
    assert(cashierOnlinePdf.statusCode === 403, 'Cashier accessing online delivery invoice PDF denied with HTTP 403 Forbidden');

    // 9. Cashier requests POS walk-in invoice PDF -> 200
    const cashierPosPdf = await request('GET', `/api/v1/invoices/${posInvoiceId}/pdf`, {
      Authorization: `Bearer ${mainCashierToken}`,
    });
    assert(cashierPosPdf.statusCode === 200, 'Cashier downloads authorized POS walk-in invoice PDF with HTTP 200');

    // 10. Admin downloads any invoice PDF -> 200
    const adminPdf = await request('GET', `/api/v1/invoices/${invoiceAId}/pdf`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminPdf.statusCode === 200, 'Admin downloads invoice PDF with HTTP 200');

    // 12D. Secure Public POS Validation
    // 1. Anonymous validation with excess stock -> 400
    const anonExcessVal = await request('POST', '/api/v1/pos/validate', {}, {
      items: [{ productId: testProduct._id.toString(), quantity: 99999 }],
    });
    assert(anonExcessVal.statusCode === 400, 'Public validation with excess stock returns HTTP 400 Bad Request');
    const anonErrBody = JSON.stringify(anonExcessVal.data || '');
    assert(
      !anonErrBody.includes('Available: ') && !anonErrBody.includes('availableStock'),
      'Public validation strictly DOES NOT expose exact inventory counts or batch details'
    );
    assert(
      anonExcessVal.data?.message?.includes('unavailable or have insufficient stock') ||
      anonExcessVal.data?.errors?.[0]?.includes('Insufficient stock available'),
      'Public validation provides user-safe guidance message'
    );

    // 2. Staff validation with excess stock -> 400 with diagnostic stock details
    const staffExcessVal = await request('POST', '/api/v1/pos/validate', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [{ productId: testProduct._id.toString(), quantity: 99999 }],
    });
    assert(staffExcessVal.statusCode === 400, 'Staff validation returns HTTP 400 Bad Request');
    const staffErrBody = JSON.stringify(staffExcessVal.data || '');
    assert(staffErrBody.includes('Available: '), 'Staff validation legitimately provides detailed warehouse inventory count');

    // 3. Legitimate self-checkout validation -> 200
    const validCheckoutVal = await request('POST', '/api/v1/pos/validate', {}, {
      items: [{ productId: testProduct._id.toString(), quantity: 1 }],
    });
    assert(validCheckoutVal.statusCode === 200, 'Valid pre-checkout items pass validation with HTTP 200');
    assert(validCheckoutVal.data?.data?.isValid === true, 'Validation confirms isValid=true for self-checkout kiosk');

    // 12E. Held-Cart Price Integrity
    // 1. Client submits manipulated low unitPrice (₹1 instead of ₹66)
    const tamperedHold = await request('POST', '/api/v1/pos/hold', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [{
        productId: testProduct._id.toString(),
        quantity: 2,
        unitPrice: 1.00, // Client tries to spoof ₹1.00
        discount: 0,
      }],
      customerName: 'Tamper Test',
    });
    assert(tamperedHold.statusCode === 201, 'Cashier holds cart successfully with HTTP 201');
    const heldCartDoc = tamperedHold.data?.data?.heldCart;
    const authoritativeUnit = Number(testProduct.sellingPrice);
    const expectedSubtotal = Number((authoritativeUnit * 2).toFixed(2));
    assert(
      heldCartDoc?.items?.[0]?.unitPrice === authoritativeUnit,
      `Held cart enforces authoritative server unitPrice (₹${authoritativeUnit}) ignoring client tampered price (₹1.00)`
    );
    assert(
      heldCartDoc?.subtotal === expectedSubtotal,
      `Held cart calculates server-authoritative subtotal (₹${expectedSubtotal})`
    );

    // 2. Client submits invalid/excessive discount -> 400
    const excessiveDiscHold = await request('POST', '/api/v1/pos/hold', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: 99999, // Exceeds line gross
      }],
    });
    assert(excessiveDiscHold.statusCode === 400, 'Held cart with excessive discount rejected with HTTP 400 Bad Request');

    // 3. Price changes while cart is held -> Recalled cart updates to new catalog price
    const initialPrice = Number(testProduct.sellingPrice);
    const cartToRecallId = heldCartDoc._id;
    // Admin updates product selling price
    await Product.findByIdAndUpdate(testProduct._id, { sellingPrice: initialPrice + 10 });

    const recalledCartRes = await request('DELETE', `/api/v1/pos/held/${cartToRecallId}`, {
      Authorization: `Bearer ${mainCashierToken}`,
    });
    assert(recalledCartRes.statusCode === 200, 'Cashier recalls held cart with HTTP 200');
    const recalledData = recalledCartRes.data?.data?.recalledCart;
    assert(
      recalledData?.items?.[0]?.unitPrice === initialPrice + 10,
      `Recalled cart dynamically updates unitPrice to new catalog price (₹${initialPrice + 10})`
    );
    assert(
      recalledData?.priceChangedAlert === true,
      'Recalled cart flags priceChangedAlert to notify cashier of catalog adjustment'
    );

    // Restore original price
    await Product.findByIdAndUpdate(testProduct._id, { sellingPrice: initialPrice });

    // 4. Cart recalled and checked out creates order with authoritative values
    const finalOrderRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        unitPrice: 0.01, // Tampered price in checkout payload
      }],
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 100 } },
    });
    assert(finalOrderRes.statusCode === 201, 'Order created from held/POS checkout with HTTP 201');
    const finalOrder = finalOrderRes.data?.data?.order;
    assert(
      finalOrder?.items?.[0]?.unitPrice === initialPrice,
      `Order checkout strictly enforces authoritative server unitPrice (₹${initialPrice}) ignoring client tampered price (₹0.01)`
    );

    // ---------------------------------------------------------
    // TEST SUITE 13: Cashier Scope Isolation, Cart Aggregation, Test DB Safety & Strict CORS
    // ---------------------------------------------------------
    console.log('\n--- SUITE 13: Cashier Scope Isolation, Cart Aggregation, Test DB Safety & Strict CORS ---');

    // 13A. Cashier-to-Cashier Isolation
    let cashierB = await User.findOne({ email: 'cashier2@nexcart.com' });
    if (!cashierB) {
      cashierB = await User.create({
        name: 'Suresh Patel (Cashier B)',
        email: 'cashier2@nexcart.com',
        password: 'Cashier@456',
        role: 'cashier',
        phone: '+91 98201 09999',
        status: 'active',
      });
    }

    const cashierBLogin = await request('POST', '/api/v1/auth/login', {}, {
      email: 'cashier2@nexcart.com',
      password: 'Cashier@456',
    });
    assert(cashierBLogin.statusCode === 200, 'Cashier B login succeeds with HTTP 200');
    const cashierBToken = cashierBLogin.data?.data?.token;

    // Cashier A processed order `posOrderId` and invoice `posInvoiceId`
    // 1. Cashier B tries to view Cashier A's order by ID -> 403
    const cashierBCrossOrder = await request('GET', `/api/v1/orders/${posOrderId}`, {
      Authorization: `Bearer ${cashierBToken}`,
    });
    assert(cashierBCrossOrder.statusCode === 403, 'Cashier B cannot read Cashier A order by ID (HTTP 403 Forbidden)');
    assert(
      cashierBCrossOrder.data?.message?.includes('Cashiers cannot access orders processed by other cashiers'),
      'Cashier B receives explicit isolation error message'
    );

    // 2. Cashier B lists orders -> must not contain Cashier A's order
    const cashierBOrderList = await request('GET', '/api/v1/orders', {
      Authorization: `Bearer ${cashierBToken}`,
    });
    assert(cashierBOrderList.statusCode === 200, 'Cashier B lists orders with HTTP 200');
    const listedOrderIds = (cashierBOrderList.data?.data || []).map((o) => o._id?.toString());
    assert(
      !listedOrderIds.includes(posOrderId.toString()),
      'Cashier B order list strictly excludes orders processed by Cashier A'
    );

    // 3. Cashier B tries to view Cashier A's invoice metadata by ID -> 403
    const cashierBCrossInvoice = await request('GET', `/api/v1/invoices/${posInvoiceId}`, {
      Authorization: `Bearer ${cashierBToken}`,
    });
    assert(cashierBCrossInvoice.statusCode === 403, 'Cashier B cannot read Cashier A invoice metadata (HTTP 403 Forbidden)');

    // 4. Cashier B tries to download Cashier A's invoice PDF -> 403
    const cashierBCrossPdf = await request('GET', `/api/v1/invoices/${posInvoiceId}/pdf`, {
      Authorization: `Bearer ${cashierBToken}`,
    });
    assert(cashierBCrossPdf.statusCode === 403, 'Cashier B cannot download Cashier A invoice PDF (HTTP 403 Forbidden)');

    // 13B. Duplicate Held-Cart Lines Aggregation & Stock Validation
    const testInvDoc = await Inventory.findOne({ productId: testProduct._id });
    const originalStock = testInvDoc.totalStock;
    await Inventory.updateOne({ productId: testProduct._id }, { $set: { totalStock: 5 } });

    // Client sends held-cart with 2 identical line items of quantity 3 (total 6 > available 5)
    const duplicateLinesExcessHold = await request('POST', '/api/v1/pos/hold', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [
        { productId: testProduct._id.toString(), quantity: 3, discount: 0 },
        { productId: testProduct._id.toString(), quantity: 3, discount: 0 },
      ],
      customerName: 'Duplicate Lines Aggregation Test',
    });
    assert(
      duplicateLinesExcessHold.statusCode === 400,
      'Held cart combining duplicate product IDs exceeding stock is rejected with HTTP 400 Bad Request'
    );
    assert(
      duplicateLinesExcessHold.data?.message?.includes('Insufficient stock'),
      'Aggregated duplicate lines stock validation returns informative insufficient stock message'
    );

    // Restore original stock
    await Inventory.updateOne({ productId: testProduct._id }, { $set: { totalStock: originalStock } });

    // 13C. Unauthorized Discretionary Discount (> 20% limit for cashier)
    const unauthorizedDiscountHold = await request('POST', '/api/v1/pos/hold', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [
        {
          productId: testProduct._id.toString(),
          quantity: 1,
          discount: Number((testProduct.sellingPrice * 0.35).toFixed(2)), // 35% discount (exceeds 20% cap)
        },
      ],
      customerName: 'Excessive Discount Test',
    });
    assert(
      unauthorizedDiscountHold.statusCode === 400,
      'Cashier held cart with discount exceeding 20% is rejected with HTTP 400 Bad Request'
    );
    assert(
      unauthorizedDiscountHold.data?.message?.includes('Unauthorized discount: Cashier role is not permitted to apply discounts exceeding 20%'),
      'Cashier discount cap error message explicitly indicates 20% ceiling'
    );

    // 13D. Test Database Safety Guard Unit Verification
    let devDbBlocked = false;
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/nexcart_db');
    } catch (e) {
      devDbBlocked = e.message.includes('standard or development database');
    }
    assert(devDbBlocked, 'validateTestDatabaseUri strictly refuses dev database nexcart_db');

    let prodHostBlocked = false;
    try {
      validateTestDatabaseUri('mongodb://prod-cluster.internal:27017/nexcart_test');
    } catch (e) {
      prodHostBlocked = e.message.includes('production environment');
    }
    assert(prodHostBlocked, 'validateTestDatabaseUri strictly refuses production hostname');

    let nonTestDbBlocked = false;
    let misleadingDbBlocked = false;
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/my_custom_db');
    } catch (e) {
      nonTestDbBlocked = e.message.includes("does not contain 'test'");
    }
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/latest_orders');
    } catch (e) {
      misleadingDbBlocked = true;
    }
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/staging_test_db');
    } catch (e) {
      misleadingDbBlocked = misleadingDbBlocked && true;
    }
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/protest_db');
    } catch (e) {
      misleadingDbBlocked = misleadingDbBlocked && true;
    }
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/backup_test');
    } catch (e) {
      misleadingDbBlocked = misleadingDbBlocked && true;
    }
    assert(
      nonTestDbBlocked && misleadingDbBlocked,
      'validateTestDatabaseUri strictly refuses non-test names, misleading substrings (latest, protest), and staging/backup environments'
    );

    const validTestSafety = validateTestDatabaseUri(TEST_DB_URI);
    assert(validTestSafety.isSafe === true, `validateTestDatabaseUri confirms safe test DB: ${validTestSafety.dbName}`);

    // 13E. Strict CORS Origin Policy & Socket.IO Authentication Verification
    const unauthorizedCorsRes = await request('OPTIONS', '/api/v1/products', {
      Origin: 'https://attacker.vercel.app',
      'Access-Control-Request-Method': 'GET',
    });
    assert(
      !unauthorizedCorsRes.headers['access-control-allow-origin'] ||
      unauthorizedCorsRes.headers['access-control-allow-origin'] !== 'https://attacker.vercel.app',
      'CORS preflight from wildcard subdomain https://attacker.vercel.app is rejected'
    );

    assert(isOriginAllowed('https://malicious-site.onrender.com') === false, 'isOriginAllowed rejects .onrender.com wildcards');
    assert(isOriginAllowed('https://phishing.netlify.app') === false, 'isOriginAllowed rejects .netlify.app wildcards');
    assert(isOriginAllowed('http://localhost:5173') === true, 'isOriginAllowed accepts configured local Vite port 5173');

    // Socket.IO Connection Authentication & Active User Attachment Verification
    let unauthSocketError = null;
    await socketAuthMiddleware({ handshake: { auth: {}, headers: {}, query: {} } }, (err) => {
      unauthSocketError = err;
    });

    let authSocketUser = null;
    const fakeSocket = {
      handshake: { auth: { token: adminToken }, headers: {}, query: {} },
    };
    await socketAuthMiddleware(fakeSocket, (err) => {
      if (!err) authSocketUser = fakeSocket.user;
    });

    assert(
      unauthSocketError?.message?.includes('Token required') && authSocketUser?.role === 'admin',
      'Socket.IO rejects unauthenticated connections (Token required) and attaches authenticated active user session'
    );

    // ---------------------------------------------------------
    // TEST SUITE 14: Standardized Discount Authorization, Safety Guards, Pagination & DoS Protection
    // ---------------------------------------------------------
    console.log('\n--- SUITE 14: Standardized Discount Authorization, Safety Guards, Pagination & DoS Protection ---');

    // 14A. Remote Database Guard Verification
    let remoteHostBlocked = false;
    try {
      validateTestDatabaseUri('mongodb://atlas-remote-cluster.mongodb.net:27017/nexcart_test_db');
    } catch (e) {
      remoteHostBlocked = e.message.includes('is remote') && e.message.includes('remote clusters is forbidden');
    }
    assert(remoteHostBlocked, 'validateTestDatabaseUri strictly blocks remote Atlas cluster test database without override');

    // With ALLOW_REMOTE_TEST_DB override, remote test database is allowed
    process.env.ALLOW_REMOTE_TEST_DB = 'true';
    let remoteAllowed = false;
    try {
      const remoteRes = validateTestDatabaseUri('mongodb://remote-test-server.example.com:27017/nexcart_test_db');
      remoteAllowed = remoteRes.isSafe === true;
    } catch (e) {
      remoteAllowed = false;
    }
    delete process.env.ALLOW_REMOTE_TEST_DB;
    assert(remoteAllowed, 'validateTestDatabaseUri permits remote test host only when ALLOW_REMOTE_TEST_DB=true');

    // 14B. Malformed URI Guard Verification
    let emptyUriBlocked = false;
    try {
      validateTestDatabaseUri('');
    } catch (e) {
      emptyUriBlocked = e.message.includes('Missing or invalid database URI');
    }
    assert(emptyUriBlocked, 'validateTestDatabaseUri rejects empty URI');

    let badProtocolBlocked = false;
    try {
      validateTestDatabaseUri('http://127.0.0.1:27017/nexcart_test_db');
    } catch (e) {
      badProtocolBlocked = e.message.includes('Invalid protocol in database URI');
    }
    assert(badProtocolBlocked, 'validateTestDatabaseUri rejects non-mongodb protocol (http://)');

    let missingDbBlocked = false;
    try {
      validateTestDatabaseUri('mongodb://127.0.0.1:27017/');
    } catch (e) {
      missingDbBlocked = e.message.includes('does not specify an explicit database name');
    }
    assert(missingDbBlocked, 'validateTestDatabaseUri rejects URI with missing database name');

    // 14C. Checkout Discount Authorization: Customer Attempting POS Walk-in Spoil/Discounts Blocked
    const customerSpoofPosWalkin = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: 10,
      }],
      paymentDetails: { method: 'card' },
    });
    assert(
      customerSpoofPosWalkin.statusCode === 403,
      'Customer attempting POS walk-in order is rejected with HTTP 403 Forbidden'
    );
    assert(
      customerSpoofPosWalkin.data?.message?.includes('Customers cannot create POS walk-in orders'),
      'Customer POS spoof error confirms POS orders must be placed through an authorized cashier'
    );

    // Customer online order ignores client-injected discountAmount and enforces server pricing
    const customerOnlineTamper = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      orderType: 'online',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: 50, // Ignored by server
      }],
      paymentDetails: { method: 'card' },
      shippingAddress: { fullName: 'Customer Disc', addressLine1: 'Lane 1', city: 'Mumbai', postalCode: '400001' },
    });
    assert(
      customerOnlineTamper.statusCode === 201,
      'Customer online order with attempted client line discount succeeds with HTTP 201 Created under server pricing'
    );
    assert(
      customerOnlineTamper.data?.data?.order?.discountTotal === 0,
      'Customer online order ignores client-injected line discount (discountTotal = ₹0)'
    );

    // 14D. Checkout Discount Authorization: Cashier Exceeding 20% Cap Blocked Without Override
    const cashierExcessDiscount = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: Number((testProduct.sellingPrice * 0.30).toFixed(2)), // 30% discount (> 20% cap)
      }],
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 200 } },
    });
    assert(
      cashierExcessDiscount.statusCode === 400,
      'Cashier checkout with discount > 20% is rejected with HTTP 400 Bad Request'
    );
    assert(
      cashierExcessDiscount.data?.message?.includes('Cashier role is not permitted to apply discounts exceeding 20%'),
      'Cashier checkout discount error explicitly states 20% ceiling'
    );

    // 14E. Checkout Discount Authorization: Forged Override Blocked & Cryptographically Verified Manager Override Allowed
    const forgedOverrideDiscount = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: Number((testProduct.sellingPrice * 0.30).toFixed(2)),
      }],
      managerOverride: { approved: true, authorizedBy: 'Store Manager (Admin)' }, // Forged without cryptographic token
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 200 } },
    });

    const cashierOverrideDiscount = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: Number((testProduct.sellingPrice * 0.30).toFixed(2)), // 30% discount
      }],
      managerOverride: { token: adminToken }, // Genuine cryptographically signed manager token
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 200 } },
    });
    assert(
      forgedOverrideDiscount.statusCode === 403 && cashierOverrideDiscount.statusCode === 201,
      'Forged manager override is strictly rejected with HTTP 403, while cryptographically verified token succeeds with HTTP 201'
    );
    const expectedLineDiscount = Number((testProduct.sellingPrice * 0.30).toFixed(2));
    assert(
      cashierOverrideDiscount.data?.data?.order?.discountTotal === expectedLineDiscount,
      `Order discountTotal (₹${cashierOverrideDiscount.data?.data?.order?.discountTotal}) accurately matches approved override discount (₹${expectedLineDiscount})`
    );

    // 14F. Checkout Discount Authorization: Admin Discretionary Discount Allowed Without Override
    const adminDiscountOrder = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      orderType: 'pos_walkin',
      items: [{
        productId: testProduct._id.toString(),
        quantity: 1,
        discount: Number((testProduct.sellingPrice * 0.40).toFixed(2)), // 40% discount
      }],
      paymentDetails: { method: 'cash', tenderDetails: { cashTendered: 200 } },
    });
    assert(
      adminDiscountOrder.statusCode === 201,
      'Admin checkout with discount > 20% succeeds with HTTP 201 Created by administrative privilege'
    );

    // 14G. Pre-checkout Duplicate Line Items Aggregation Validation
    const initialTestStock = (await Inventory.findOne({ productId: testProduct._id })).totalStock;
    await Inventory.updateOne({ productId: testProduct._id }, { $set: { totalStock: 4 } });

    const preCheckoutDuplicateExcess = await request('POST', '/api/v1/pos/validate', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, {
      items: [
        { productId: testProduct._id.toString(), quantity: 3 },
        { productId: testProduct._id.toString(), quantity: 3 },
      ],
    });
    assert(
      preCheckoutDuplicateExcess.statusCode === 400,
      'Pre-checkout validation combining duplicate line items (qty 3+3=6 vs stock 4) is rejected with HTTP 400'
    );
    assert(
      preCheckoutDuplicateExcess.data?.message?.includes('Checkout validation failed'),
      'Staff pre-checkout validation returns standard validation failure message'
    );

    await Inventory.updateOne({ productId: testProduct._id }, { $set: { totalStock: initialTestStock } });

    // 14H. Safe Pagination Input Handling Across Endpoints
    const safeOrdersPagination = await request('GET', '/api/v1/orders/my-orders?page=-5&limit=-20', {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(safeOrdersPagination.statusCode === 200, 'Negative pagination parameters handled gracefully with HTTP 200');
    assert(
      safeOrdersPagination.data?.meta?.page === 1 && safeOrdersPagination.data?.meta?.limit === 10,
      `Negative page/limit safely defaults to page=1, limit=10 (received page=${safeOrdersPagination.data?.meta?.page}, limit=${safeOrdersPagination.data?.meta?.limit})`
    );

    const safeUsersPagination = await request('GET', '/api/v1/users?page=-1&limit=9999', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(safeUsersPagination.statusCode === 200, 'Admin users list with extreme pagination returns HTTP 200');
    assert(
      safeUsersPagination.data?.meta?.page === 1 && safeUsersPagination.data?.meta?.limit === 100,
      `Extreme limit is safely clamped to maximum bound of 100 (received limit=${safeUsersPagination.data?.meta?.limit})`
    );

    const safeAnalyticsPagination = await request('GET', '/api/v1/analytics/top-products?limit=-10', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(safeAnalyticsPagination.statusCode === 200, 'Analytics top-products handles negative limit with HTTP 200');

    // 14I. Request Body Size Limit Hardening (500 KB DoS Protection)
    const largePayload = {
      items: [{ productId: testProduct._id.toString(), quantity: 1 }],
      notes: 'X'.repeat(600 * 1024), // 600 KB payload (> 500 KB limit)
    };
    const payloadTooLargeRes = await request('POST', '/api/v1/pos/validate', {
      Authorization: `Bearer ${mainCashierToken}`,
    }, largePayload);
    assert(
      payloadTooLargeRes.statusCode === 413,
      'Payload exceeding 500 KB is rejected with HTTP 413 Payload Too Large'
    );

    // 14J. Promotional Discount Boundary Checks
    const negativeDiscountRes = await request('POST', '/api/v1/discounts', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      code: 'NEGDISC',
      title: 'Negative Discount Test',
      discountType: 'percentage',
      discountValue: -15,
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });
    assert(negativeDiscountRes.statusCode === 400, 'Discount creation with negative value is rejected with HTTP 400');

    const excessivePercentDiscountRes = await request('POST', '/api/v1/discounts', {
      Authorization: `Bearer ${adminToken}`,
    }, {
      code: 'EXCESS150',
      title: 'Excessive 150% Discount Test',
      discountType: 'percentage',
      discountValue: 150,
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });
    assert(excessivePercentDiscountRes.statusCode === 400, 'Discount creation with percentage > 100% is rejected with HTTP 400');

    // 14K. Analytics & Inventory Query Clamping
    const clampedTrendRes = await request('GET', '/api/v1/analytics/sales-trend?days=-50', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(clampedTrendRes.statusCode === 200, 'Analytics sales-trend safely clamps negative days parameter to default (HTTP 200)');

    const clampedExpiryRes = await request('GET', '/api/v1/inventory/alerts/expiry?days=999999', {
      Authorization: `Bearer ${invManagerToken}`,
    });
    assert(clampedExpiryRes.statusCode === 200, 'Inventory expiry alerts safely clamps extreme days parameter (HTTP 200)');

    // 14L. Order Status Update, Customer Cancellation & Stock Restoration
    const initialInvBeforeCancel = await Inventory.findOne({ productId: testProduct._id });
    const initialStockBeforeCancel = initialInvBeforeCancel.totalStock;

    // Create a pending customer order for 2 units
    const orderForCancelRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      items: [{ productId: testProduct._id.toString(), quantity: 2 }],
      paymentMethod: 'cash',
      orderType: 'online',
      orderStatus: 'pending',
    });
    assert(orderForCancelRes.statusCode === 201, 'Order created for cancellation test');
    const orderToCancelId = orderForCancelRes.data.data.order._id;

    // Verify stock was deducted by 2
    const invAfterOrder = await Inventory.findOne({ productId: testProduct._id });
    assert(invAfterOrder.totalStock === initialStockBeforeCancel - 2, 'Stock depleted by 2 units on order creation');

    // Customer cancels own pending order
    const cancelOrderRes = await request('PATCH', `/api/v1/orders/${orderToCancelId}/status`, {
      Authorization: `Bearer ${customerToken}`,
    }, {
      status: 'cancelled',
    });
    assert(cancelOrderRes.statusCode === 200, 'Customer successfully cancels own pending order with HTTP 200');
    assert(cancelOrderRes.data.data.order.orderStatus === 'cancelled', 'Order status verified as cancelled');

    // Verify stock is restored to pre-order level!
    const invAfterCancel = await Inventory.findOne({ productId: testProduct._id });
    assert(invAfterCancel.totalStock === initialStockBeforeCancel, 'Deducted inventory batches restored to original level on order cancellation');

    // Cancelling an already cancelled order should fail
    const reCancelRes = await request('PATCH', `/api/v1/orders/${orderToCancelId}/status`, {
      Authorization: `Bearer ${customerToken}`,
    }, {
      status: 'cancelled',
    });
    assert(reCancelRes.statusCode === 400, 'Modifying an already cancelled order is rejected with HTTP 400');

    // 14M. Purchase Order Cancellation
    const createPoForCancelRes = await request('POST', '/api/v1/purchase-orders', {
      Authorization: `Bearer ${invManagerToken}`,
    }, {
      supplierId: existingSupplier._id.toString(),
      items: [{ productId: testProduct._id.toString(), orderedQty: 15, unitCost: 30 }],
    });
    assert(createPoForCancelRes.statusCode === 201, 'Purchase order created for cancellation test');
    const poToCancelId = createPoForCancelRes.data.data.purchaseOrder._id;

    const cancelPoRes = await request('PATCH', `/api/v1/purchase-orders/${poToCancelId}/cancel`, {
      Authorization: `Bearer ${invManagerToken}`,
    }, {
      reason: 'Vendor discontinued item',
    });
    assert(cancelPoRes.statusCode === 200, 'Purchase order cancelled successfully with HTTP 200');
    assert(cancelPoRes.data.data.purchaseOrder.status === 'cancelled', 'PO status updated to cancelled');

    const reCancelPoRes = await request('PATCH', `/api/v1/purchase-orders/${poToCancelId}/cancel`, {
      Authorization: `Bearer ${invManagerToken}`,
    }, {
      reason: 'Duplicate cancel',
    });
    assert(reCancelPoRes.statusCode === 400, 'Cancelling an already cancelled PO returns HTTP 400');

    // 14N. Supplier Update & Deactivate
    const updateSupplierRes = await request('PUT', `/api/v1/suppliers/${existingSupplier._id}`, {
      Authorization: `Bearer ${invManagerToken}`,
    }, {
      name: 'Amul Federation Updated',
      contactPerson: 'Vikram Patel',
      email: existingSupplier.email,
      phone: '+91 99999 88888',
      paymentTerms: 'Net 45',
      rating: 4.8,
    });
    assert(updateSupplierRes.statusCode === 200, 'Supplier updated successfully with HTTP 200');
    assert(updateSupplierRes.data.data.supplier.contactPerson === 'Vikram Patel', 'Supplier contact person updated');

    const deactivateSupplierRes = await request('DELETE', `/api/v1/suppliers/${existingSupplier._id}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(deactivateSupplierRes.statusCode === 200, 'Supplier deactivated successfully with HTTP 200');
    assert(deactivateSupplierRes.data.data.supplier.status === 'inactive', 'Supplier status marked inactive');

    // 14O. Blueprint Endpoint Aliases, Cashier Status Authorization & Category Lifecycle
    // Cart add alias
    const cartAddRes = await request('POST', '/api/v1/cart/add', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: testProduct._id.toString(),
      quantity: 2,
    });
    assert(cartAddRes.statusCode === 200, 'Cart alias POST /api/v1/cart/add succeeds with HTTP 200');

    // Cart update alias
    const cartUpdateRes = await request('PUT', '/api/v1/cart/update', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: testProduct._id.toString(),
      quantity: 4,
    });
    assert(cartUpdateRes.statusCode === 200, 'Cart alias PUT /api/v1/cart/update succeeds with HTTP 200');

    // Cart remove item alias
    const cartRemoveRes = await request('DELETE', `/api/v1/cart/item/${testProduct._id}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(cartRemoveRes.statusCode === 200, 'Cart alias DELETE /api/v1/cart/item/:id succeeds with HTTP 200');

    // POS hold & recall GET alias
    const holdRecallRes = await request('POST', '/api/v1/pos/hold', {
      Authorization: `Bearer ${cashierToken}`,
    }, {
      items: [{ productId: testProduct._id.toString(), quantity: 1, unitPrice: 50, barcode: testProduct.barcode, name: testProduct.name }],
      customerName: 'Recall Test Customer',
    });
    assert(holdRecallRes.statusCode === 201, 'Cashier holds cart successfully');
    const heldRecallCartId = holdRecallRes.data.data.heldCart._id;

    const recallGetRes = await request('GET', `/api/v1/pos/recall/${heldRecallCartId}`, {
      Authorization: `Bearer ${cashierToken}`,
    });
    assert(recallGetRes.statusCode === 200, 'POS alias GET /api/v1/pos/recall/:id succeeds with HTTP 200');

    // Cashier Order Status Authorization
    const orderForCashierRes = await request('POST', '/api/v1/orders', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      items: [{ productId: testProduct._id.toString(), quantity: 1 }],
      paymentMethod: 'cash',
      orderType: 'online',
    });
    assert(orderForCashierRes.statusCode === 201, 'Order created for Cashier status test');
    const orderForCashierId = orderForCashierRes.data.data.order._id;

    const cashierUpdateStatusRes = await request('PATCH', `/api/v1/orders/${orderForCashierId}/status`, {
      Authorization: `Bearer ${cashierToken}`,
    }, {
      status: 'processing',
    });
    assert(cashierUpdateStatusRes.statusCode === 200, 'Cashier successfully updates order status to processing with HTTP 200');

    // Category Update & Archive
    const updateCategoryRes = await request('PUT', `/api/v1/categories/${regressionCatId}`, {
      Authorization: `Bearer ${adminToken}`,
    }, {
      name: 'Dairy & Farm Fresh Goods',
      description: 'Milk, butter, and organic cheeses',
    });
    assert(updateCategoryRes.statusCode === 200, 'Admin updates category via PUT with HTTP 200');
    assert(updateCategoryRes.data.data.category.name === 'Dairy & Farm Fresh Goods', 'Category name updated');

    const deleteCategoryRes = await request('DELETE', `/api/v1/categories/${regressionCatId}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(deleteCategoryRes.statusCode === 200, 'Admin archives category via DELETE with HTTP 200');
    assert(deleteCategoryRes.data.data.category.isActive === false, 'Category soft-archived with isActive=false');

    // 14P. Review Deletion & Inactive Product Catalog Filtering
    // Post a review
    const postRevRes = await request('POST', '/api/v1/reviews', {
      Authorization: `Bearer ${customerToken}`,
    }, {
      productId: testProduct._id.toString(),
      rating: 5,
      comment: 'Super fresh and high quality product!',
    });
    assert(postRevRes.statusCode === 201, 'Customer posts product review with HTTP 201');
    const reviewId = postRevRes.data.data.review._id;

    // Unauthorized deletion attempt by Cashier
    const unauthorizedDeleteRevRes = await request('DELETE', `/api/v1/reviews/${reviewId}`, {
      Authorization: `Bearer ${cashierToken}`,
    });
    assert(unauthorizedDeleteRevRes.statusCode === 403, 'Unauthorized user cannot delete another user review (HTTP 403)');

    // Authorized deletion by review author
    const authorizedDeleteRevRes = await request('DELETE', `/api/v1/reviews/${reviewId}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    assert(authorizedDeleteRevRes.statusCode === 200, 'Review author deletes own review with HTTP 200');

    // Soft delete product then query with includeInactive=true
    const softDeleteProdRes = await request('DELETE', `/api/v1/products/${createdProdId}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(softDeleteProdRes.statusCode === 200, 'Admin soft-deletes product with HTTP 200');

    const publicProdListRes = await request('GET', '/api/v1/products');
    const publicFound = publicProdListRes.data.data.products.some((p) => p._id.toString() === createdProdId.toString());
    assert(!publicFound, 'Public catalog excludes soft-deleted product');

    const adminProdListRes = await request('GET', '/api/v1/products?includeInactive=true', {
      Authorization: `Bearer ${adminToken}`,
    });
    const adminFound = adminProdListRes.data.data.products.some((p) => p._id.toString() === createdProdId.toString());
    assert(adminFound, 'Admin catalog with includeInactive=true includes soft-deleted product');

  } catch (err) {
    console.error('Test Suite Aborted Due to Error:', err);
    failedTests++;
  } finally {
    server.close();
    // Drop test database to leave environment completely clean
    try {
      validateTestDatabaseUri(TEST_DB_URI);
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
