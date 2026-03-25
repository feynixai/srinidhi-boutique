# Srinidhi Boutique

Premium Indian ethnic wear e-commerce platform built for Srinidhi Boutique — a women's clothing store in Hyderabad, India.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  web/ (Next.js 14)          admin/ (Next.js 14)                 │
│  Customer Store              Admin Dashboard                      │
│  :3000                       :3001                               │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │ REST API                  │ REST API
                  ▼                           ▼
         ┌────────────────────────────────────────┐
         │  server/ (Express + Prisma)             │
         │  :4000                                  │
         └────────────────────┬───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   PostgreSQL       │
                    └───────────────────┘
```

## Live

| App | URL |
|-----|-----|
| Store | _Vercel — web/_ |
| Admin Dashboard | _Vercel — admin/_ |
| API | _Railway/Render — server/_ |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Store frontend | Next.js 14, Tailwind CSS, Zustand, React Query, next/image |
| Admin frontend | Next.js 14, Tailwind CSS, React Query |
| API server | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Payments | Razorpay (UPI, cards, net banking, EMI) + Cash on Delivery |
| Notifications | WhatsApp Cloud API + Nodemailer (SMTP) |
| Auth | Google OAuth + Phone OTP |
| Shipping | Indian pincode zones + international rates |

## Feature List

### Store (web/)
- Elegant Indian ethnic theme — rose gold, ivory, warm white palette
- Hero carousel with featured collections
- Mega menu with category navigation
- Product catalog with filters: category, size, color, price, fabric, occasion
- Product detail pages: image gallery, size guide, WhatsApp order button
- Customer reviews with ratings
- Cart drawer with coupon code support
- 3-step checkout: address → payment → confirm
- Guest checkout (no forced registration)
- Order confirmation, tracking, and history pages
- Wishlist (persisted per user)
- Recently viewed products bar
- Back-in-stock notification signup
- Product recommendations (same category + price range)
- Abandoned cart reminder (shown on return visit)
- Returns flow
- PWA support (offline mode, installable)
- Newsletter signup
- Contact form

### Admin Dashboard (admin/)
- Sales dashboard: today's orders, revenue, pending orders, low stock alerts
- Pro analytics:
  - Revenue chart (daily/weekly/monthly)
  - Conversion funnel (cart → checkout → paid)
  - Top selling products with units sold
  - Revenue by category (bar chart)
  - Revenue by payment method
  - New vs returning customer split
  - Abandoned carts count
- Orders management: full lifecycle (Placed → Confirmed → Packed → Shipped → Delivered)
- Products CRUD with image upload support
- Categories management
- Coupon management (discount %, expiry, max uses, min order)
- Customer list with order history
- Inventory management:
  - Stock movement log (who added/removed, when, why)
  - Auto-disable products when stock hits 0
  - Bulk stock update via CSV upload
  - Low-stock alert panel (threshold: 3 units)
- Invoice generation (HTML, printable)
- Return requests management
- Bulk order operations (confirm, pack, ship selected)
- WhatsApp + email notifications per order

### API (server/)
- RESTful Express API — 20+ route groups
- Full products, categories, cart, orders, coupons endpoints
- Razorpay payment verification (HMAC signature check)
- International shipping rates by zone
- WhatsApp Cloud API integration (order confirmation, shipping, delivery)
- Email notifications via SMTP (order confirmation, shipping, welcome)
- Stock movement logging on every sale
- Inventory management: CSV bulk update, back-in-stock subscriptions
- Analytics queries: revenue aggregation, conversion funnel, top products
- Google OAuth + Phone OTP authentication
- Admin authentication (Google OAuth, role-based)
- SEO: sitemap generation
- Security: Helmet, CORS, input validation (Zod), rate limiting
- Health check endpoint with database connectivity check
- Environment variable validation on startup
- Graceful shutdown (SIGTERM/SIGINT)
- In-memory response caching for product listings (5 min TTL)
- Database indexes on all key query patterns

## Project Structure

```
web/
  src/
    app/                   Next.js App Router pages
    components/            Reusable UI components
    lib/                   API client, stores, utils
admin/
  src/
    app/admin/             Admin pages (analytics, orders, products, etc.)
    components/            Admin UI components
    lib/                   API client, types
server/
  src/
    routes/                Express route handlers
    lib/                   Prisma client, cache, email, WhatsApp, env validation
    middleware/            Error handler, rate limiter, admin auth
    __tests__/             Vitest tests (901+)
  prisma/
    schema.prisma          Database schema
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Install all dependencies
npm install

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and other credentials

# 3. Push database schema
cd server && npx prisma db push

# 4. Seed with sample data (optional)
npm run db:seed

# 5. Start all services
npm run dev
```

Access at:
- Store: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000

## Environment Variables

### server/.env

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/srinidhi_boutique

# Optional — payments disabled without these
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Optional — WhatsApp notifications
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
ADMIN_WHATSAPP_PHONE=919876543210

# Optional — Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Srinidhi Boutique <orders@srinidhiboutique.in>

# Optional
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### web/.env.local and admin/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
```

## Tests

```bash
npm test          # Run all 901+ tests
```

Test coverage:
- Products, categories, cart, orders, coupons
- Payments (Razorpay verification, COD)
- Auth (Google OAuth, Phone OTP)
- Admin CRUD, bulk operations, bulk product actions
- International shipping + pincode zones
- Returns flow
- WhatsApp notification generation
- Email template rendering
- Analytics queries
- Stock movement logging + back-in-stock notifications
- Cache behavior
- Health check
- Environment validation
- Inventory management
- GST calculation (intra-state CGST/SGST vs inter-state IGST)
- Delivery slot selection
- Order cancellation + store credit refund
- Enhanced coupons (category-specific, first-order, user-specific, countdown)
- CSV data export (products, orders, customers, reviews)
- Loyalty, referrals, flash sales, lookbook, chat
- Bundles, gift cards, pre-orders, store credits
- Abandoned cart recovery, webhooks

## API Endpoint Reference

See [API.md](./API.md) for a complete reference of all endpoints.

### Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + DB connectivity |
| GET | `/api/products` | List products with filters |
| GET | `/api/products/featured` | Featured products (cached 5m) |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/products/:slug/recommendations` | Similar products |
| GET | `/api/categories` | All categories |
| POST | `/api/cart` | Add to cart |
| GET | `/api/cart/:sessionId` | Get cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/track` | Track order by number + phone |
| POST | `/api/payments/razorpay/create` | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Verify payment signature |
| POST | `/api/notifications/send-order-confirmation` | Send order notification |
| POST | `/api/notifications/send-shipping-update` | Send shipping notification |
| GET | `/api/inventory/low-stock` | Low stock products |
| POST | `/api/inventory/movements` | Log stock adjustment |
| POST | `/api/inventory/bulk-update` | Bulk CSV stock update |
| POST | `/api/inventory/back-in-stock` | Subscribe to back-in-stock |
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/analytics` | Pro analytics |

## Deployment

### API Server (Railway / Render)

1. Connect your GitHub repo
2. Set **root directory** to `server/`
3. **Build command**: `npm install && npx prisma generate && npm run build`
4. **Start command**: `npm start`
5. Add all environment variables from `server/.env.example`

### Store & Admin (Vercel)

For `web/`:
1. Import repo in Vercel
2. Set **root directory** to `web/`
3. Set `NEXT_PUBLIC_API_URL` to your deployed server URL

For `admin/`:
1. Same as above but root directory is `admin/`

### Database (Supabase / Neon / Railway PostgreSQL)

```bash
# After deploying, run migrations
DATABASE_URL=your_production_url npx prisma db push
```

## Screenshots

_Coming soon — to be added after production launch_

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Rose Gold | `#B76E79` | Primary, CTAs, accents |
| Ivory | `#FFFFF0` | Page background |
| Soft Pink | `#FFB6C1` | Hover states |
| Warm White | `#FFF8F5` | Card backgrounds |
| Charcoal | `#3C3C3C` | Body text |
| Playfair Display | serif | Headings |
| Inter | sans-serif | Body text |

Mobile-first — 80%+ of Indian shoppers browse on phones.

---

## Build Log

| Build | Date | Features | Tests |
|-------|------|----------|-------|
| Build 1 | 2026-01-01 | Core product catalog, cart, orders, payments (Razorpay), admin | 100+ |
| Build 2 | 2026-01-02 | Auth, pincode zones, WhatsApp/email notifications, SEO | 200+ |
| Build 3 | 2026-01-03 | Inventory management, back-in-stock, returns, analytics | 300+ |
| Build 4 | 2026-01-04 | Admin dashboard, shipping, international rates | 400+ |
| Build 5 | 2026-01-05 | Bulk status, security, Razorpay everywhere | 475+ |
| Build 6 | 2026-01-06 | WhatsApp/email notifications, pro analytics | 530+ |
| Build 7 | 2026-01-07 | Loyalty, referrals, smart search, flash sales, chat | 628+ |
| Build 8 | 2026-01-08 | Variants, invoice PDF, shipping prep, collections, Q&A | 726+ |
| Build 9 | 2026-01-09 | Lookbook, customer segments, advanced reports | 826+ |
| Build 10 | 2026-01-10 | Bundles, gift cards, pre-orders, store credits, webhooks | 825+ |
| Build 11 | 2026-01-11 | Abandoned cart, bundles, gift cards, pre-orders, webhooks | 825+ |
| Build 12 | 2026-03-25 | GST system, bulk product ops, delivery slots, order cancellation, coupon enhancements, stock alerts, data export | 901+ |

Built with care for Srinidhi Boutique, Hyderabad.
