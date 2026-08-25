const request = require('supertest');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret';

jest.mock('../server/middleware/auth', () => {
  const mockUser = { id: 'test-user-id', email: 'checkout@test.local', role: 'user' };
  const pass = (req, _res, next) => {
    req.user = mockUser;
    next();
  };
  return {
    protect: pass,
    optionalAuth: pass,
    authorizeRoles: () => pass,
    admin: pass,
  };
});

jest.mock('../server/utils/sendEmail', () => ({
  sendEmail: jest.fn(),
  orderConfirmationEmail: jest.fn(() => ({})),
  orderStatusEmail: jest.fn(() => ({})),
}));

const mockProduct = {
  _id: 'p1',
  name: 'Test Product',
  price: 40,
  stock: 10,
  images: [{ url: 'test-image.jpg' }],
  updateStock: jest.fn(),
};

jest.mock('../server/models/Product', () => ({
  findById: jest.fn(async (id) => (id === 'p1' ? mockProduct : null)),
  findByIdAndUpdate: jest.fn(async () => mockProduct),
}));

jest.mock('../server/models/Cart', () => ({
  findOne: jest.fn(async () => null),
  findOneAndUpdate: jest.fn(async () => null),
}));

jest.mock('../server/models/Coupon', () => ({
  findOne: jest.fn(async () => null),
}));

jest.mock('../server/models/Payment', () => ({
  create: jest.fn(async (doc) => doc),
  updateMany: jest.fn(async () => ({ n: 1 })),
}));

jest.mock('../server/models/Order', () => ({
  create: jest.fn(async (doc) => ({ _id: 'order-1', orderNumber: 'SE-TEST-1', ...doc })),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const app = require('../server/index');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');
const Payment = require('../server/models/Payment');

const shippingInfo = {
  firstName: 'Test',
  lastName: 'User',
  email: 'checkout@test.local',
  phoneNo: '1234567890',
  address: '1 Test Street',
  city: 'Testville',
  state: 'TS',
  zipCode: '12345',
  country: 'United States',
};

describe('checkout: POST /api/orders', () => {
  test('creates a COD order with correct totals and a pending payment record', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'p1', quantity: 2 }], shippingInfo, paymentMethod: 'cod' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.itemsPrice).toBe(80);
    expect(res.body.order.taxPrice).toBe(8);
    expect(res.body.order.shippingPrice).toBe(10);
    expect(res.body.order.totalPrice).toBe(98);
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ gateway: 'cod', status: 'pending', amount: 98 })
    );
  });

  test('creates an online order without charging or recording payment yet', async () => {
    Payment.create.mockClear();

    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'p1', quantity: 1 }], shippingInfo, paymentMethod: 'stripe' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.paymentMethod).toBe('stripe');
    expect(Payment.create).not.toHaveBeenCalled();
  });
});

describe('payment reservation release: PUT /api/orders/:id/cancel', () => {
  const unpaidOrder = () => ({
    _id: 'order-1',
    orderNumber: 'SE-TEST-1',
    orderStatus: 'Processing',
    paidAt: undefined,
    user: 'test-user-id',
    orderItems: [{ name: 'Test Product', quantity: 2, price: 40, product: 'p1' }],
    save: jest.fn(async function save() {
      return this;
    }),
  });

  test('cancels an unpaid order, restocks reserved items and cancels pending payments', async () => {
    Order.findById.mockResolvedValueOnce(unpaidOrder());

    const res = await request(app)
      .put('/api/orders/order-1/cancel')
      .send({ reason: 'Payment cancelled at the gateway', ifUnpaid: true });

    expect(res.status).toBe(200);
    expect(res.body.order.orderStatus).toBe('Cancelled');
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('p1', {
      $inc: { stock: 2 },
      inStock: true,
    });
    expect(Payment.updateMany).toHaveBeenCalledWith(
      { order: 'order-1', status: { $in: ['pending', 'processing'] } },
      { status: 'cancelled' }
    );
  });

  test('refuses the unpaid-only cancel guard on a paid order', async () => {
    Order.findById.mockResolvedValueOnce({ ...unpaidOrder(), paidAt: new Date() });

    const res = await request(app)
      .put('/api/orders/order-1/cancel')
      .send({ ifUnpaid: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
