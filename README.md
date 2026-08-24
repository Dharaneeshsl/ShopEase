# ShopEase

Production e-commerce platform: React + Redux, Express, MongoDB, Stripe Checkout, PayPal, and cash on delivery.

## Features

- JWT auth, profiles, addresses, password reset
- Product catalog, search, filters, reviews
- Persistent cart and wishlist
- Real checkout: Stripe Checkout, PayPal, or cash on delivery
- Coupons, tax, free shipping over $100
- Orders, tracking, cancel, invoices
- Admin dashboard
- Newsletter and transactional email hooks

There is no mock API and no fake payment confirmation. Card and PayPal checkout redirect to the live gateways. If those keys are missing, those methods stay disabled.

## Quick start

```bash
npm run install-all
cp env.example .env
# start MongoDB, then:
npm run seed
npm run dev
```

- App: http://localhost:3000
- API health: http://localhost:5000/api/health

### Sample logins after seed

| Role | Email | Password |
| --- | --- | --- |
| Customer | john@example.com | password123 |
| Admin | admin@example.com | admin123 |

Coupons: `WELCOME10`, `FREESHIP`, `SAVE20`

## Environment

Copy `env.example` to `.env`. You own:

- `MONGODB_URI`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
- `CLIENT_URL`
- optional email and Cloudinary

## Scripts

```bash
npm run dev
npm test
npm run ci
npm run seed
npm run build
```

## Docker

```bash
docker compose up --build
```

## License

MIT
