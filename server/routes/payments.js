const express = require('express');
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const {
  stripeConfigured,
  paypalConfigured,
  requireStripe,
  getPayPalAccessToken,
} = require('../utils/gateways');

const router = express.Router();

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:3000';

const markOrderPaid = async (orderId, paymentInfo) => {
  if (!orderId) return null;
  return Order.findByIdAndUpdate(
    orderId,
    {
      paymentInfo,
      paidAt: new Date(),
      orderStatus: 'Processing',
    },
    { new: true }
  );
};

router.get('/config', (_req, res) => {
  res.json({
    success: true,
    stripeEnabled: stripeConfigured,
    paypalEnabled: paypalConfigured,
    stripePublishableKey: stripeConfigured ? process.env.STRIPE_PUBLISHABLE_KEY || '' : '',
    paypalClientId: paypalConfigured ? process.env.PAYPAL_CLIENT_ID || '' : '',
    methods: [
      { id: 'stripe', name: 'Credit/Debit Card', enabled: stripeConfigured },
      { id: 'paypal', name: 'PayPal', enabled: paypalConfigured },
      { id: 'cod', name: 'Cash on Delivery', enabled: true },
    ],
  });
});

router.get('/methods', protect, (_req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely on Stripe Checkout',
        enabled: stripeConfigured,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        enabled: paypalConfigured,
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when your order arrives',
        enabled: true,
      },
    ],
  });
});

router.post(
  '/stripe/create-checkout-session',
  protect,
  asyncHandler(async (req, res) => {
    const stripe = requireStripe();
    const amount = Number(req.body.amount);
    const orderId = req.body.orderId;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: (req.body.currency || 'usd').toLowerCase(),
            product_data: { name: req.body.description || 'ShopEase order' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl()}/payment/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${clientUrl()}/payment/cancel?orderId=${orderId}`,
      metadata: { orderId: String(orderId), userId: String(req.user.id) },
    });

    await Payment.create({
      user: req.user.id,
      order: orderId,
      gateway: 'stripe',
      amount,
      currency: (req.body.currency || 'USD').toUpperCase(),
      status: 'pending',
      transactionId: session.id,
    });

    res.json({ success: true, id: session.id, url: session.url });
  })
);

router.post(
  '/stripe/confirm-session',
  protect,
  asyncHandler(async (req, res) => {
    const stripe = requireStripe();
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    const orderId = req.body.orderId || session.metadata?.orderId;

    await Payment.findOneAndUpdate(
      { transactionId: sessionId },
      { status: paid ? 'succeeded' : session.payment_status || 'failed' }
    );

    if (paid && orderId) {
      await markOrderPaid(orderId, {
        id: session.payment_intent || session.id,
        status: 'succeeded',
        gateway: 'stripe',
      });
    }

    res.json({
      success: paid,
      paid,
      status: session.payment_status,
      orderId,
      sessionId: session.id,
    });
  })
);

router.post(
  '/paypal/create-order',
  protect,
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    const shopOrderId = req.body.orderId;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (!shopOrderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const currency = (req.body.currency || 'USD').toUpperCase();
    const { accessToken, paypalBase } = await getPayPalAccessToken();

    const paypalRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: String(shopOrderId),
            amount: { currency_code: currency, value: amount.toFixed(2) },
            description: 'ShopEase purchase',
          },
        ],
        application_context: {
          brand_name: 'ShopEase',
          user_action: 'PAY_NOW',
          return_url: `${clientUrl()}/payment/success?gateway=paypal&orderId=${shopOrderId}`,
          cancel_url: `${clientUrl()}/payment/cancel?orderId=${shopOrderId}`,
        },
      }),
    });

    const data = await paypalRes.json();
    if (!paypalRes.ok) {
      const err = new Error(data.message || 'PayPal order creation failed');
      err.statusCode = 502;
      throw err;
    }

    await Payment.create({
      user: req.user.id,
      order: shopOrderId,
      gateway: 'paypal',
      amount,
      currency,
      status: 'pending',
      transactionId: data.id,
      raw: data,
    });

    const approvalUrl = (data.links || []).find((l) => l.rel === 'approve')?.href;
    res.json({ success: true, id: data.id, paymentId: data.id, approvalUrl });
  })
);

router.post(
  '/paypal/capture-payment',
  protect,
  asyncHandler(async (req, res) => {
    const paypalOrderId = req.body.paypalOrderId || req.body.token || req.body.orderId;
    const shopOrderId = req.body.shopOrderId;
    if (!paypalOrderId) {
      return res.status(400).json({ success: false, message: 'PayPal order id is required' });
    }

    const { accessToken, paypalBase } = await getPayPalAccessToken();
    const paypalRes = await fetch(`${paypalBase}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const data = await paypalRes.json();
    const captured = paypalRes.ok && (data.status === 'COMPLETED' || data.status === 'APPROVED');

    await Payment.findOneAndUpdate(
      { transactionId: paypalOrderId },
      { status: captured ? 'succeeded' : 'failed', raw: data }
    );

    if (captured && shopOrderId) {
      await markOrderPaid(shopOrderId, {
        id: paypalOrderId,
        status: 'completed',
        gateway: 'paypal',
      });
    }

    if (!captured) {
      return res.status(400).json({ success: false, message: 'PayPal capture failed', payment: data });
    }

    res.json({ success: true, status: 'completed', id: paypalOrderId, payment: data, orderId: shopOrderId });
  })
);

router.post(
  '/cod',
  protect,
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount) || 0;
    const orderId = req.body.orderId;
    const id = `cod_${Date.now()}`;
    await Payment.create({
      user: req.user.id,
      order: orderId,
      gateway: 'cod',
      amount,
      status: 'pending',
      transactionId: id,
    });
    res.json({
      success: true,
      id,
      status: 'pending',
      method: 'cod',
      payment: { id, status: 'pending', method: 'cod', amount },
    });
  })
);

router.get(
  '/history',
  protect,
  asyncHandler(async (req, res) => {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('order', 'orderNumber totalPrice');
    res.json({ success: true, payments });
  })
);

router.post(
  '/:paymentId/refund',
  protect,
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (payment.gateway === 'stripe' && payment.transactionId) {
      const stripe = requireStripe();
      const session = await stripe.checkout.sessions.retrieve(payment.transactionId).catch(() => null);
      const intent = session?.payment_intent;
      if (intent) await stripe.refunds.create({ payment_intent: intent });
    }

    payment.status = 'refunded';
    await payment.save();
    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        'refund.status': 'refunded',
        'refund.processedAt': new Date(),
        'refund.amount': payment.amount,
      });
    }

    res.json({ success: true, payment, message: 'Refund processed' });
  })
);

router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    if (!stripeConfigured || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ received: false, message: 'Stripe webhook is not configured' });
    }
    const stripe = requireStripe();
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await Payment.findOneAndUpdate({ transactionId: session.id }, { status: 'succeeded' });
      if (session.metadata?.orderId) {
        await markOrderPaid(session.metadata.orderId, {
          id: session.payment_intent || session.id,
          status: 'succeeded',
          gateway: 'stripe',
        });
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;
