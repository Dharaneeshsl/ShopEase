const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../server/models/User');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');
const Coupon = require('../server/models/Coupon');
const Cart = require('../server/models/Cart');
const Wishlist = require('../server/models/Wishlist');

const img = (url) => ({ public_id: url.split('/').pop().split('?')[0], url });

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce');
  console.log('✅ Connected to MongoDB');
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Coupon.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      phone: '+15550000000',
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1234567890',
      addresses: [
        {
          type: 'home',
          street: '123 Main St',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States',
          isDefault: true,
        },
      ],
    });

    const jane = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1987654321',
    });

    console.log('✅ Created 3 users');

    const catalog = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
        price: 89.99,
        originalPrice: 129.99,
        discount: 31,
        category: 'Electronics',
        brand: 'TechAudio',
        stock: 50,
        featured: true,
        tags: ['audio', 'wireless', 'headphones'],
        features: ['Noise Cancellation', '30-hour Battery', 'Bluetooth 5.0', 'Quick Charge'],
        images: [
          img('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'),
          img('https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'),
        ],
      },
      {
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking watch with heart rate monitor, GPS, and 7-day battery.',
        price: 199.99,
        originalPrice: 249.99,
        discount: 20,
        category: 'Electronics',
        brand: 'FitTech',
        stock: 30,
        featured: true,
        tags: ['wearable', 'fitness'],
        features: ['Heart Rate Monitor', 'GPS Tracking', 'Water Resistant', 'Sleep Tracking'],
        images: [img('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800')],
      },
      {
        name: 'Wireless Charging Pad',
        description: 'Fast 15W wireless charging pad compatible with all Qi devices.',
        price: 39.99,
        category: 'Electronics',
        brand: 'ChargeLab',
        stock: 40,
        tags: ['charging', 'wireless'],
        images: [img('https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800')],
      },
      {
        name: 'Portable Bluetooth Speaker',
        description: 'Waterproof speaker with deep bass and 16-hour playtime.',
        price: 59.99,
        category: 'Electronics',
        brand: 'SoundWave',
        stock: 60,
        featured: false,
        tags: ['audio', 'speaker'],
        images: [img('https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800')],
      },
      {
        name: 'Noise Cancelling Earbuds',
        description: 'Compact true-wireless earbuds with active noise cancellation.',
        price: 79.99,
        originalPrice: 99.99,
        discount: 20,
        category: 'Electronics',
        brand: 'SoundTech',
        stock: 70,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800')],
      },
      {
        name: 'Professional Camera Lens',
        description: '50mm f/1.8 prime lens for professional photography.',
        price: 399.99,
        category: 'Electronics',
        brand: 'PhotoPro',
        stock: 20,
        images: [img('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800')],
      },
      {
        name: 'Robot Vacuum Cleaner',
        description: 'Smart robot vacuum with mapping technology and app control.',
        price: 299.99,
        category: 'Electronics',
        brand: 'SmartHome',
        stock: 25,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800')],
      },
      {
        name: 'Gaming Console Bundle',
        description: 'Latest-gen console with two controllers and three popular games.',
        price: 499.99,
        category: 'Electronics',
        brand: 'GameTech',
        stock: 30,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800')],
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt in multiple colors.',
        price: 24.99,
        category: 'Clothing',
        brand: 'EcoWear',
        stock: 100,
        tags: ['organic', 'casual'],
        images: [img('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800')],
      },
      {
        name: 'Classic Blue Jeans',
        description: 'Stylish and durable blue jeans for everyday wear.',
        price: 49.99,
        category: 'Clothing',
        brand: 'DenimCo',
        stock: 80,
        images: [img('https://images.unsplash.com/photo-1542272604-787c3835535d?w=800')],
      },
      {
        name: 'Hooded Sweatshirt',
        description: 'Warm and cozy fleece hoodie for all seasons.',
        price: 39.99,
        category: 'Clothing',
        brand: 'UrbanLayer',
        stock: 70,
        images: [img('https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800')],
      },
      {
        name: 'Summer Dress',
        description: 'Lightweight floral dress perfect for warm weather.',
        price: 34.99,
        category: 'Clothing',
        brand: 'Bloom',
        stock: 60,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800')],
      },
      {
        name: 'Designer Leather Handbag',
        description: 'Luxury leather handbag with multiple compartments and adjustable strap.',
        price: 199.99,
        originalPrice: 299.99,
        discount: 33,
        category: 'Clothing',
        brand: 'LuxuryStyle',
        stock: 40,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800')],
      },
      {
        name: 'The Art of Coding',
        description: 'A must-read book for aspiring developers covering algorithms and clean code.',
        price: 19.99,
        category: 'Books',
        brand: 'BookWorld',
        stock: 200,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800')],
      },
      {
        name: 'Mindful Living',
        description: 'A practical guide to living a mindful and peaceful life.',
        price: 14.99,
        category: 'Books',
        brand: 'BookWorld',
        stock: 150,
        images: [img('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800')],
      },
      {
        name: 'Business Mastery',
        description: 'Strategies for success in business and entrepreneurship.',
        price: 24.99,
        category: 'Books',
        brand: 'BookWorld',
        stock: 90,
        images: [img('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800')],
      },
      {
        name: 'Bestselling Novel Collection',
        description: 'Set of 3 bestselling novels from award-winning authors.',
        price: 34.99,
        originalPrice: 44.99,
        discount: 22,
        category: 'Books',
        brand: 'BookWorld',
        stock: 200,
        images: [img('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800')],
      },
      {
        name: 'Stainless Steel Water Bottle',
        description: 'Keep drinks cold for 24 hours with this premium insulated bottle.',
        price: 24.99,
        category: 'Home & Garden',
        brand: 'HydroPeak',
        stock: 75,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800')],
      },
      {
        name: 'Aromatic Scented Candle',
        description: 'Long-lasting soy candle with calming lavender notes.',
        price: 12.99,
        category: 'Home & Garden',
        brand: 'GlowHome',
        stock: 90,
        images: [img('https://images.unsplash.com/photo-1602607387256-0c940d568a66?w=800')],
      },
      {
        name: 'Indoor Plant Set',
        description: 'Bring nature indoors with this trio of low-maintenance plants.',
        price: 44.99,
        category: 'Home & Garden',
        brand: 'Leaf & Co',
        stock: 40,
        images: [img('https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800')],
      },
      {
        name: 'Modern Coffee Table',
        description: 'Elegant oak coffee table with a lower storage shelf.',
        price: 299.99,
        originalPrice: 399.99,
        discount: 25,
        category: 'Home & Garden',
        brand: 'HomeStyle',
        stock: 15,
        images: [img('https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800')],
      },
      {
        name: 'Kitchen Mixer Professional',
        description: 'Professional stand mixer with multiple attachments for serious bakers.',
        price: 349.99,
        originalPrice: 449.99,
        discount: 22,
        category: 'Home & Garden',
        brand: 'KitchenPro',
        stock: 35,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=800')],
      },
      {
        name: 'Premium Yoga Mat',
        description: 'Non-slip eco-friendly yoga mat for all levels.',
        price: 49.99,
        category: 'Sports',
        brand: 'YogaLife',
        stock: 75,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800')],
      },
      {
        name: 'Adjustable Dumbbells',
        description: 'Space-saving adjustable dumbbells for home strength training.',
        price: 89.99,
        category: 'Sports',
        brand: 'IronHome',
        stock: 50,
        images: [img('https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800')],
      },
      {
        name: 'Official Size Basketball',
        description: 'Indoor/outdoor basketball, official size and weight.',
        price: 29.99,
        category: 'Sports',
        brand: 'CourtKing',
        stock: 70,
        images: [img('https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800')],
      },
      {
        name: 'Moisturizing Face Cream',
        description: 'Hydrate and nourish your skin with this daily face cream.',
        price: 22.99,
        category: 'Beauty',
        brand: 'GlowLab',
        stock: 70,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800')],
      },
      {
        name: 'Natural Lip Balm Trio',
        description: 'Keep lips soft with this set of three natural balms.',
        price: 7.99,
        category: 'Beauty',
        brand: 'GlowLab',
        stock: 120,
        images: [img('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800')],
      },
      {
        name: 'Herbal Shampoo',
        description: 'Gentle sulfate-free shampoo for healthy, shiny hair.',
        price: 15.99,
        category: 'Beauty',
        brand: 'PureStrand',
        stock: 60,
        images: [img('https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800')],
      },
      {
        name: 'Wooden Building Blocks',
        description: 'Classic wooden block set that sparks creativity for ages 3+.',
        price: 27.99,
        category: 'Toys',
        brand: 'PlayNest',
        stock: 85,
        images: [img('https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800')],
      },
      {
        name: 'Remote Control Race Car',
        description: 'High-speed RC car with rechargeable battery and 2.4GHz control.',
        price: 45.99,
        category: 'Toys',
        brand: 'PlayNest',
        stock: 55,
        featured: true,
        images: [img('https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800')],
      },
    ];

    const products = await Product.insertMany(
      catalog.map((p, idx) => ({
        ...p,
        sku: `SE-${String(idx + 1).padStart(4, '0')}`,
        seller: admin._id,
        inStock: p.stock > 0,
        ratings: Number((4 + Math.random()).toFixed(1)) > 5 ? 4.8 : Number((4 + Math.random() * 0.9).toFixed(1)),
        numOfReviews: 20 + Math.floor(Math.random() * 180),
      }))
    );
    console.log(`✅ Created ${products.length} products`);

    const reviewUsers = [john, jane];
    for (const product of products.slice(0, 8)) {
      product.reviews = [
        {
          user: john._id,
          name: john.name,
          rating: 5,
          comment: 'Excellent quality and fast shipping. Highly recommend!',
        },
        {
          user: jane._id,
          name: jane.name,
          rating: 4,
          comment: 'Really happy with this purchase. Would buy again.',
        },
      ];
      product.recalculateRating();
      await product.save();
    }

    const order1 = await Order.create({
      orderItems: [
        {
          name: products[0].name,
          quantity: 1,
          image: products[0].images[0].url,
          price: products[0].price,
          product: products[0]._id,
        },
        {
          name: products[8].name,
          quantity: 2,
          image: products[8].images[0].url,
          price: products[8].price,
          product: products[8]._id,
        },
      ],
      user: john._id,
      paymentMethod: 'stripe',
      paymentInfo: { id: 'pi_sample_123', status: 'succeeded', gateway: 'stripe' },
      paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      itemsPrice: products[0].price + products[8].price * 2,
      taxPrice: Number(((products[0].price + products[8].price * 2) * 0.1).toFixed(2)),
      shippingPrice: 0,
      totalPrice: Number(((products[0].price + products[8].price * 2) * 1.1).toFixed(2)),
      orderStatus: 'Delivered',
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      trackingNumber: 'TRK100001',
      shippingInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: john.email,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        phoneNo: '+1234567890',
        phone: '+1234567890',
      },
    });

    const order2 = await Order.create({
      orderItems: [
        {
          name: products[1].name,
          quantity: 1,
          image: products[1].images[0].url,
          price: products[1].price,
          product: products[1]._id,
        },
      ],
      user: jane._id,
      paymentMethod: 'paypal',
      paymentInfo: { id: 'paypal_sample_456', status: 'completed', gateway: 'paypal' },
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      itemsPrice: products[1].price,
      taxPrice: Number((products[1].price * 0.1).toFixed(2)),
      shippingPrice: 0,
      totalPrice: Number((products[1].price * 1.1).toFixed(2)),
      orderStatus: 'Shipped',
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      trackingNumber: 'TRK100002',
      shippingInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: jane.email,
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'United States',
        phoneNo: '+1987654321',
        phone: '+1987654321',
      },
    });

    console.log(`✅ Created 2 sample orders (${order1.orderNumber}, ${order2.orderNumber})`);

    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        description: '10% off your first order',
        type: 'percent',
        value: 10,
        minPurchase: 25,
        maxDiscount: 40,
        usageLimit: 1000,
        active: true,
      },
      {
        code: 'FREESHIP',
        description: '$10 off shipping-equivalent discount',
        type: 'fixed',
        value: 10,
        minPurchase: 40,
        usageLimit: 500,
        active: true,
      },
      {
        code: 'SAVE20',
        description: '20% off orders over $100',
        type: 'percent',
        value: 20,
        minPurchase: 100,
        maxDiscount: 80,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        active: true,
      },
    ]);
    console.log('✅ Created 3 coupons');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Sample login credentials:');
    console.log('   User:  john@example.com / password123');
    console.log('   User:  jane@example.com / password123');
    console.log('   Admin: admin@example.com / admin123');
    console.log('\n🎟️  Coupons: WELCOME10, FREESHIP, SAVE20');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
