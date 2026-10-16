const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const AuditLog = require('../models/AuditLog');
const Discount = require('../models/Discount');
const { connectDB } = require('../config/db');
const logger = require('./logger');
const { ROLES, PURCHASE_ORDER_STATUS, AUDIT_MODULES } = require('./constants');

const seedUsers = [
  {
    name: 'Rajesh Sharma (Admin)',
    email: 'admin@nexcart.com',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    phone: '+91 98201 01001',
    status: 'active',
  },
  {
    name: 'Priya Nair (Inventory Manager)',
    email: 'inventory@nexcart.com',
    password: 'Inventory@123',
    role: ROLES.INVENTORY_MANAGER,
    phone: '+91 98201 02002',
    status: 'active',
  },
  {
    name: 'Amit Kumar (Cashier)',
    email: 'cashier@nexcart.com',
    password: 'Cashier@123',
    role: ROLES.CASHIER,
    phone: '+91 98201 03003',
    status: 'active',
  },
  {
    name: 'Emily Watson (Customer)',
    email: 'customer@nexcart.com',
    password: 'Customer@123',
    role: ROLES.CUSTOMER,
    phone: '+91 98201 04004',
    status: 'active',
    loyaltyPoints: 350,
    loyaltyTier: 'Gold',
    lifetimeSpend: 24500,
    loyaltyHistory: [
      {
        points: 200,
        type: 'earned',
        reason: 'Welcome Bonus: NexCart Premier Membership',
        orderNumber: 'NXC-INIT-001',
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        points: 150,
        type: 'earned',
        reason: 'Earned on Order #NXC-ORD-8821 (Gold Tier 1.5x)',
        orderNumber: 'NXC-ORD-8821',
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
    ],
  },
];

const seedCategories = [
  {
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    description: 'Farm-fresh milk, artisan cheese, yogurt, and free-range eggs',
    icon: 'Milk',
  },
  {
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    description: 'Crisp organic fruits, leafy greens, and farm vegetables',
    icon: 'Apple',
  },
  {
    name: 'Bakery & Bread',
    slug: 'bakery-bread',
    description: 'Oven-baked artisan loaves, croissants, bagels, and pastries',
    icon: 'Wheat',
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    description: 'Sparkling juices, cold brew coffees, craft sodas, and teas',
    icon: 'Coffee',
  },
  {
    name: 'Snacks & Confectionery',
    slug: 'snacks',
    description: 'Gourmet potato chips, nuts, dark chocolates, and trail mixes',
    icon: 'Cookie',
  },
  {
    name: 'Pantry & Staples',
    slug: 'pantry-staples',
    description: 'Olive oils, fragrant basmati rice, pasta, and culinary spices',
    icon: 'CookingPot',
  },
];

const seedDatabase = async () => {
  try {
    logger.info('Starting NexCart database seeding for Sprint 4...');
    await connectDB();

    // 1. Seed Users
    const userMap = {};
    for (const userData of seedUsers) {
      await User.deleteOne({ email: userData.email });
      const created = await User.create(userData);
      userMap[created.role] = created._id;
      logger.info(`Seeded user: ${created.name} [${created.role}] <${created.email}>`);
    }

    // 2. Seed Categories
    const categoryMap = {};
    for (const catData of seedCategories) {
      let cat = await Category.findOne({ slug: catData.slug });
      if (!cat) {
        cat = await Category.create(catData);
      } else {
        cat.name = catData.name;
        cat.description = catData.description;
        cat.icon = catData.icon;
        await cat.save();
      }
      categoryMap[catData.slug] = cat._id;
    }

    // 3. Seed Products
    const seedProducts = [
      // Dairy & Eggs
      {
        barcode: '8901030001011',
        sku: 'DAI-MILK-001',
        name: 'Organic Whole Milk 1L',
        description: 'Pasteurized whole milk rich in Vitamin D and calcium',
        categoryId: categoryMap['dairy-eggs'],
        brand: 'Horizon Organic',
        unit: 'litre',
        costPrice: 48.0,
        sellingPrice: 66.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030001028',
        sku: 'DAI-YOG-002',
        name: 'Greek Yogurt Vanilla 500g',
        description: 'Authentic strained high-protein vanilla Greek yogurt',
        categoryId: categoryMap['dairy-eggs'],
        brand: 'Chobani',
        unit: 'g',
        costPrice: 65.0,
        sellingPrice: 85.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030001035',
        sku: 'DAI-EGG-003',
        name: 'Pasture-Raised Brown Eggs (Dozen)',
        description: 'Grade A large brown eggs from pasture-raised hens',
        categoryId: categoryMap['dairy-eggs'],
        brand: 'Vital Farms',
        unit: 'pack',
        costPrice: 75.0,
        sellingPrice: 95.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030001042',
        sku: 'DAI-CHE-004',
        name: 'Aged Sharp Cheddar Block 250g',
        description: 'Aged 12 months for a complex, bold flavor profile',
        categoryId: categoryMap['dairy-eggs'],
        brand: 'Cabot Creamery',
        unit: 'g',
        costPrice: 160.0,
        sellingPrice: 220.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },

      // Fresh Produce
      {
        barcode: '8901030002018',
        sku: 'PRO-APP-001',
        name: 'Honeycrisp Apples (1kg Bag)',
        description: 'Sweet, crisp, juicy fresh harvest orchard apples',
        categoryId: categoryMap['fresh-produce'],
        brand: 'Stemilt',
        unit: 'kg',
        costPrice: 135.0,
        sellingPrice: 180.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030002025',
        sku: 'PRO-BAN-002',
        name: 'Organic Cavendish Bananas (1kg)',
        description: 'Naturally ripened organic sweet bananas rich in potassium',
        categoryId: categoryMap['fresh-produce'],
        brand: 'Dole Organic',
        unit: 'kg',
        costPrice: 35.0,
        sellingPrice: 50.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030002032',
        sku: 'PRO-AVO-003',
        name: 'Hass Avocados (Pack of 4)',
        description: 'Creamy ripe Hass avocados perfect for salads and guacamole',
        categoryId: categoryMap['fresh-produce'],
        brand: 'Mission Produce',
        unit: 'pack',
        costPrice: 140.0,
        sellingPrice: 190.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030002049',
        sku: 'PRO-SPI-004',
        name: 'Organic Baby Spinach 300g',
        description: 'Triple-washed tender organic baby spinach leaves',
        categoryId: categoryMap['fresh-produce'],
        brand: 'Earthbound Farm',
        unit: 'pack',
        costPrice: 28.0,
        sellingPrice: 40.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },

      // Bakery & Bread
      {
        barcode: '8901030003015',
        sku: 'BAK-SOU-001',
        name: 'Artisan San Francisco Sourdough',
        description: 'Naturally fermented rustic sourdough with crisp golden crust',
        categoryId: categoryMap['bakery-bread'],
        brand: 'La Brea Bakery',
        unit: 'pcs',
        costPrice: 55.0,
        sellingPrice: 75.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030003022',
        sku: 'BAK-CRO-002',
        name: 'All-Butter French Croissants (4ct)',
        description: 'Flaky, buttery layered traditional breakfast croissants',
        categoryId: categoryMap['bakery-bread'],
        brand: 'Brioche Gourmet',
        unit: 'pack',
        costPrice: 90.0,
        sellingPrice: 130.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030003039',
        sku: 'BAK-BAG-003',
        name: 'Everything Bagels (6ct Pack)',
        description: 'Kettle-boiled authentic bagels coated with sesame, poppy and garlic',
        categoryId: categoryMap['bakery-bread'],
        brand: 'Thomas Bakery',
        unit: 'pack',
        costPrice: 65.0,
        sellingPrice: 95.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },

      // Beverages
      {
        barcode: '8901030004012',
        sku: 'BEV-OJ-001',
        name: 'Pure Squeezed Orange Juice 1.5L',
        description: '100% pure premium orange juice without added sugars',
        categoryId: categoryMap['beverages'],
        brand: 'Tropicana',
        unit: 'litre',
        costPrice: 85.0,
        sellingPrice: 120.0,
        taxRate: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: true,
      },
      {
        barcode: '8901030004029',
        sku: 'BEV-COL-002',
        name: 'Cold Brew Coffee Concentrate 1L',
        description: 'Smooth steeped dark roast Arabica cold brew concentrate',
        categoryId: categoryMap['beverages'],
        brand: 'Stumptown',
        unit: 'litre',
        costPrice: 130.0,
        sellingPrice: 180.0,
        taxRate: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
      {
        barcode: '8901030004036',
        sku: 'BEV-SPK-003',
        name: 'Italian Sparkling Mineral Water 750ml',
        description: 'Naturally carbonated pristine Italian mineral water',
        categoryId: categoryMap['beverages'],
        brand: 'San Pellegrino',
        unit: 'ml',
        costPrice: 35.0,
        sellingPrice: 50.0,
        taxRate: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },

      // Snacks & Confectionery
      {
        barcode: '8901030005019',
        sku: 'SNK-CHP-001',
        name: 'Sea Salt & Vinegar Kettle Chips 200g',
        description: 'Hand-cooked extra crunchy potato chips with sea salt and vinegar',
        categoryId: categoryMap['snacks'],
        brand: 'Kettle Brand',
        unit: 'g',
        costPrice: 25.0,
        sellingPrice: 35.0,
        taxRate: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
      {
        barcode: '8901030005026',
        sku: 'SNK-CHO-002',
        name: '72% Dark Chocolate Almond Bar 100g',
        description: 'Fair-trade dark chocolate with roasted California almonds',
        categoryId: categoryMap['snacks'],
        brand: 'Lindt Excellence',
        unit: 'pcs',
        costPrice: 85.0,
        sellingPrice: 125.0,
        taxRate: 18.0,
        imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
      {
        barcode: '8901030005033',
        sku: 'SNK-NUT-003',
        name: 'Roasted Cashews & Sea Salt 300g',
        description: 'Oven-roasted jumbo cashews seasoned with fine sea salt',
        categoryId: categoryMap['snacks'],
        brand: 'Planters Select',
        unit: 'g',
        costPrice: 220.0,
        sellingPrice: 290.0,
        taxRate: 12.0,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },

      // Pantry & Staples
      {
        barcode: '8901030006016',
        sku: 'PAN-OIL-001',
        name: 'Extra Virgin Olive Oil 750ml',
        description: 'First cold-pressed Mediterranean extra virgin olive oil',
        categoryId: categoryMap['pantry-staples'],
        brand: 'California Olive Ranch',
        unit: 'ml',
        costPrice: 420.0,
        sellingPrice: 560.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
      {
        barcode: '8901030006023',
        sku: 'PAN-RIC-002',
        name: 'Royal Basmati Rice (5kg Bag)',
        description: 'Aged long-grain aromatic Himalayan basmati rice',
        categoryId: categoryMap['pantry-staples'],
        brand: 'Royal Basmati',
        unit: 'kg',
        costPrice: 360.0,
        sellingPrice: 480.0,
        taxRate: 0.0,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
      {
        barcode: '8901030006030',
        sku: 'PAN-PAS-003',
        name: 'Bronze Cut Spaghetti 500g',
        description: 'Traditional Italian durum wheat semolina spaghetti',
        categoryId: categoryMap['pantry-staples'],
        brand: 'De Cecco',
        unit: 'g',
        costPrice: 70.0,
        sellingPrice: 99.0,
        taxRate: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
        isExpiryTracked: false,
      },
    ];

    const productMap = {};
    for (const prodData of seedProducts) {
      await Product.deleteOne({ barcode: prodData.barcode });
      const created = await Product.create(prodData);
      productMap[created.sku] = created;
    }

    // 4. Seed Suppliers
    const seedSuppliers = [
      {
        name: 'FreshValley Dairy & Produce Co.',
        contactPerson: 'Ramesh Patel',
        email: 'orders@freshvalley.com',
        phone: '+91 98250 11001',
        address: 'Amul Dairy Road, Anand, Gujarat 388001',
        taxId: '24AAACF8821A1Z0',
        paymentTerms: 'Net 30',
        rating: 5,
        status: 'active',
        suppliedCategories: [categoryMap['dairy-eggs'], categoryMap['fresh-produce']],
      },
      {
        name: 'Artisan Bakery Guild',
        contactPerson: 'Claire Bennett',
        email: 'deliveries@artisanbakery.com',
        phone: '+91 98450 22002',
        address: '42 MG Road, Bengaluru, Karnataka 560001',
        taxId: '29AABCA3391B1Z2',
        paymentTerms: 'Net 15',
        rating: 4.8,
        status: 'active',
        suppliedCategories: [categoryMap['bakery-bread']],
      },
      {
        name: 'Apex Beverage Distributors',
        contactPerson: 'Carlos Rossi',
        email: 'sales@apexbeverages.com',
        phone: '+91 98200 33003',
        address: '77 Nariman Point, Mumbai, Maharashtra 400021',
        taxId: '27AABCA9901C1Z5',
        paymentTerms: 'Net 30',
        rating: 4.7,
        status: 'active',
        suppliedCategories: [categoryMap['beverages']],
      },
      {
        name: 'Global Pantry & Snacks Wholesalers',
        contactPerson: 'Ananya Sharma',
        email: 'info@globalpantry.com',
        phone: '+91 98300 44004',
        address: '500 Sector 18, Gurugram, Haryana 122008',
        taxId: '06AAACG7718D1Z9',
        paymentTerms: 'Net 45',
        rating: 4.9,
        status: 'active',
        suppliedCategories: [categoryMap['snacks'], categoryMap['pantry-staples']],
      },
    ];

    const supplierMap = {};
    for (const supData of seedSuppliers) {
      await Supplier.deleteOne({ email: supData.email });
      const sup = await Supplier.create(supData);
      supplierMap[sup.name] = sup;
      logger.info(`Seeded supplier: ${sup.name}`);
    }

    // 5. Seed Inventory with Multi-Batch FEFO Data
    logger.info('Seeding multi-batch inventory for all products...');
    await Inventory.deleteMany({});

    const now = new Date();

    for (const prod of Object.values(productMap)) {
      let batches = [];
      let shelfLocation = 'Aisle 1, Shelf A';
      let reorderLevel = 10;

      // Special cases to demonstrate Radar and Alerts:
      if (prod.sku === 'DAI-MILK-001') {
        // Milk: Near-expiry batch (in 4 days!) to test Expiry Radar critical alert!
        const expCritical = new Date();
        expCritical.setDate(now.getDate() + 4);

        const expHealthy = new Date();
        expHealthy.setDate(now.getDate() + 18);

        batches = [
          {
            batchNumber: 'BAT-MLK-2601',
            quantity: 8,
            expiryDate: expCritical, // Expiring in 4 days!
            costPrice: prod.costPrice,
            receivedDate: new Date(now.getTime() - 10 * 86400000),
          },
          {
            batchNumber: 'BAT-MLK-2602',
            quantity: 25,
            expiryDate: expHealthy,
            costPrice: prod.costPrice,
            receivedDate: new Date(),
          },
        ];
        shelfLocation = 'Cooler 2, Bay 1';
        reorderLevel = 15;
      } else if (prod.sku === 'BAK-SOU-001') {
        // Sourdough: Near-expiry batch (in 2 days!)
        const expSoon = new Date();
        expSoon.setDate(now.getDate() + 2);

        batches = [
          {
            batchNumber: 'BAT-SOU-2601',
            quantity: 5,
            expiryDate: expSoon,
            costPrice: prod.costPrice,
            receivedDate: new Date(now.getTime() - 2 * 86400000),
          },
        ];
        shelfLocation = 'Bakery Stand 1';
        reorderLevel = 8;
      } else if (prod.sku === 'PRO-APP-001') {
        // Apples: Intentionally LOW STOCK (3 units <= reorderLevel 10) to test Low Stock Alert!
        const expDate = new Date();
        expDate.setDate(now.getDate() + 20);

        batches = [
          {
            batchNumber: 'BAT-APP-2601',
            quantity: 3, // LOW STOCK!
            expiryDate: expDate,
            costPrice: prod.costPrice,
            receivedDate: new Date(),
          },
        ];
        shelfLocation = 'Produce Isle 1, Bins';
        reorderLevel = 10;
      } else if (prod.sku === 'BEV-OJ-001') {
        // Orange juice: Expiring in 9 days (warning level)
        const expWarning = new Date();
        expWarning.setDate(now.getDate() + 9);

        batches = [
          {
            batchNumber: 'BAT-OJ-2601',
            quantity: 12,
            expiryDate: expWarning,
            costPrice: prod.costPrice,
            receivedDate: new Date(),
          },
        ];
        shelfLocation = 'Chiller 3';
        reorderLevel = 8;
      } else {
        // Standard healthy items with 2 batches
        const exp1 = new Date();
        exp1.setDate(now.getDate() + 45);
        const exp2 = new Date();
        exp2.setDate(now.getDate() + 90);

        batches = [
          {
            batchNumber: `BAT-${prod.sku}-A`,
            quantity: 20,
            expiryDate: exp1,
            costPrice: prod.costPrice,
            receivedDate: new Date(now.getTime() - 5 * 86400000),
          },
          {
            batchNumber: `BAT-${prod.sku}-B`,
            quantity: 30,
            expiryDate: exp2,
            costPrice: prod.costPrice,
            receivedDate: new Date(),
          },
        ];
        shelfLocation = 'Main Supermarket Aisle';
      }

      await Inventory.create({
        productId: prod._id,
        totalStock: batches.reduce((sum, b) => sum + b.quantity, 0),
        reorderLevel,
        optimalStock: 50,
        shelfLocation,
        batches,
      });
    }

    // 6. Seed Sample Purchase Orders
    await PurchaseOrder.deleteMany({});
    const milkProd = productMap['DAI-MILK-001'];
    const cheeseProd = productMap['DAI-CHE-004'];
    const appleProd = productMap['PRO-APP-001'];

    const po1 = await PurchaseOrder.create({
      poNumber: 'PO-2026-0001',
      supplierId: supplierMap['FreshValley Dairy & Produce Co.']._id,
      items: [
        {
          productId: milkProd._id,
          orderedQty: 50,
          receivedQty: 50,
          unitCost: milkProd.costPrice,
          subtotal: Number((50 * milkProd.costPrice).toFixed(2)),
        },
        {
          productId: cheeseProd._id,
          orderedQty: 20,
          receivedQty: 20,
          unitCost: cheeseProd.costPrice,
          subtotal: Number((20 * cheeseProd.costPrice).toFixed(2)),
        },
      ],
      totalAmount: Number((50 * milkProd.costPrice + 20 * cheeseProd.costPrice).toFixed(2)),
      status: PURCHASE_ORDER_STATUS.RECEIVED,
      receivedDate: new Date(),
      createdBy: userMap[ROLES.INVENTORY_MANAGER],
    });

    const po2 = await PurchaseOrder.create({
      poNumber: 'PO-2026-0002',
      supplierId: supplierMap['FreshValley Dairy & Produce Co.']._id,
      items: [
        {
          productId: appleProd._id,
          orderedQty: 100,
          receivedQty: 0,
          unitCost: appleProd.costPrice,
          subtotal: Number((100 * appleProd.costPrice).toFixed(2)),
        },
      ],
      totalAmount: Number((100 * appleProd.costPrice).toFixed(2)),
      status: PURCHASE_ORDER_STATUS.PLACED,
      expectedDeliveryDate: new Date(now.getTime() + 5 * 86400000),
      createdBy: userMap[ROLES.INVENTORY_MANAGER],
    });

    logger.info(`Seeded 2 Purchase Orders: ${po1.poNumber} (Received) and ${po2.poNumber} (Placed)`);

    // Seed Initial Promotional Discounts & Clearance Rules
    await Discount.deleteMany({});
    const expiryFar = new Date();
    expiryFar.setMonth(expiryFar.getMonth() + 3);

    const discounts = await Discount.create([
      {
        code: 'WELCOME10',
        title: 'New Shopper Welcome',
        description: 'Enjoy 10% off your entire supermarket basket on orders above Rs. 20',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 20,
        endDate: expiryFar,
        usageLimit: 500,
        isActive: true,
      },
      {
        code: 'DAIRY20',
        title: 'Dairy & Fresh Produce Deal',
        description: '20% off dairy products & farm-fresh produce',
        discountType: 'percentage',
        discountValue: 20,
        minPurchaseAmount: 15,
        endDate: expiryFar,
        usageLimit: 300,
        isActive: true,
      },
      {
        code: 'CLEARANCE40',
        title: 'Smart Near-Expiry Clearance',
        description: 'Save 40% on expiring pantry and bakery items',
        discountType: 'percentage',
        discountValue: 40,
        minPurchaseAmount: 10,
        endDate: expiryFar,
        usageLimit: 200,
        isActive: true,
      },
      {
        code: 'FLAT50',
        title: 'Mega Savings Voucher',
        description: 'Flat Rs. 50 off on orders over Rs. 300',
        discountType: 'fixed_amount',
        discountValue: 50,
        minPurchaseAmount: 300,
        endDate: expiryFar,
        usageLimit: 150,
        isActive: true,
      },
    ]);

    logger.info(`Seeded ${discounts.length} promotional and clearance discounts`);

    logger.info('✅ Successfully seeded complete Sprint 4 & Sprint 8 Inventory, Batches, Suppliers, POs & Discounts!');
  } catch (error) {
    logger.error('Database seeding failed:', { error: error.message, stack: error.stack });
    throw error;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      try {
        await mongoose.disconnect();
      } catch (_) {}
      process.exit(1);
    });
}

module.exports = { seedDatabase, seedUsers, seedCategories };
