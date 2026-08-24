const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripeConfigured = Boolean(
  stripeKey && !stripeKey.includes('your_stripe') && stripeKey.startsWith('sk_')
);

const paypalConfigured = Boolean(
  process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    !String(process.env.PAYPAL_CLIENT_ID).includes('your_paypal')
);

const requireStripe = () => {
  if (!stripeConfigured) {
    const err = new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.');
    err.statusCode = 503;
    throw err;
  }
  return require('stripe')(stripeKey);
};

const paypalBase =
  (process.env.PAYPAL_MODE || 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const requirePayPal = () => {
  if (!paypalConfigured) {
    const err = new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    err.statusCode = 503;
    throw err;
  }
  return { paypalBase };
};

const getPayPalAccessToken = async () => {
  const { paypalBase: base } = requirePayPal();
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = new Error('Failed to authenticate with PayPal');
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  return { accessToken: data.access_token, paypalBase: base };
};

module.exports = {
  stripeConfigured,
  paypalConfigured,
  requireStripe,
  requirePayPal,
  getPayPalAccessToken,
};
