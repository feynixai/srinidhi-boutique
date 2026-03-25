# Srinidhi Boutique

Premium women's ethnic wear e-commerce platform built for Srinidhi Boutique — a women's clothing store in Hyderabad, India.

![Srinidhi Boutique Store](https://via.placeholder.com/1200x600/1a1a2e/c5a55a?text=Srinidhi+Boutique+—+Live+at+proofcrest.com)

> **Live store:** [proofcrest.com](https://proofcrest.com) &nbsp;|&nbsp; **Admin:** [admin-cyan-one-44.vercel.app](https://admin-cyan-one-44.vercel.app)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Customer Store (Next.js 14)    Admin Dashboard (Next.js 14)    │
│  https://proofcrest.com         https://admin-cyan-one-44...    │
│  :3000 (local)                  :3001 (local)                   │
└────────────────┬────────────────────────────┬───────────────────┘
                 │ REST API                   │ REST API
                 ▼                            ▼
        ┌────────────────────────────────────────────┐
        │  Express API Server (Node.js + Prisma)      │
        │  :4000 (local) / Railway (production)       │
        └──────────────────────┬─────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         PostgreSQL        Razorpay       WhatsApp API
         (Neon/Railway)    Payments       Notifications
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Store frontend | Next.js 14, Tailwind CSS, Zustand, React Query, next/image |
| Admin frontend | Next.js 14, Tailwind CSS, React Query |
| API server | Node.js, Express, Prisma ORM, TypeScript |
| Database | PostgreSQL (40+ models) |
| Payments | Razorpay (UPI/cards/netbanking/EMI), PhonePe UPI QR, Bank Transfer, COD |
| Notifications | WhatsApp Cloud API + Nodemailer (SMTP) |
| Auth | Google OAuth (NextAuth), Phone OTP, Admin roles |
| Shipping | Indian pincode zones + international rates (US/UAE/UK) |
| Testing | Vitest, Supertest (1324+ tests) |
| Deployment | Vercel (frontend), Railway (API + DB) |

---

## Features

### Payments
- **Razorpay** — UPI, credit/debit cards, net banking, EMI, wallets
- **PhonePe UPI QR** — scannable QR at checkout
- **Bank Transfer** — NEFT/RTGS/IMPS with IFSC + SWIFT for international
- **Cash on Delivery** — with COD surcharge support
- **Gift Cards** — purchase, redeem, check balance
- **Store Credits** — issued on returns, redeemable at checkout
- Auto-apply best coupon — ranks eligible coupons by savings, one-click apply

### Authentication & Authorization
- **Google OAuth** (NextAuth.js) — customer and admin login
- **Phone OTP** — SMS-based one-time password login
- **Admin roles** — separate admin auth with role-based access
- Guest checkout — no registration wall

### Shopping Experience
- Product catalog with filters: category, size, color, price, fabric, occasion
- Quick View modal + Product Comparison (up to 3 products side-by-side)
- Smart search with autocomplete
- Wishlist (persisted per user)
- Recently viewed products bar
- Product bundles (buy-together deals)
- Pre-order support for out-of-stock items
- Product Q&A with admin moderation
- Customer reviews with star ratings
- Flash sales with countdown timers
- Urgency triggers: "Only X left!" badge (stock < 5), "Trending" badge, weekly sold counter
- Back-in-stock notification signup
- Abandoned cart reminder (shown on return visit)

### Loyalty & Retention
- **Loyalty points** — earn on every purchase, redeem at checkout
- **Tiers** — bronze / silver / gold based on total spend
- **Referral system** — unique link, earn points on friend's first order
- **Gift cards** — purchasable in any denomination
- **Store credits** — returns refunded as credits, redeemable instantly
- Newsletter signup + promotional email flows

### Orders & Checkout
- 3-step checkout: address → payment → confirm
- Multi-step order lifecycle: Placed → Confirmed → Packed → Shipped → Delivered
- Order tracking by order number + phone
- Order cancellation with automatic store credit refund
- Returns flow with reason selection and admin review
- WhatsApp order button on every product page
- GST calculation (CGST/SGST intra-state, IGST inter-state)
- Delivery slot selection
- International shipping (US / UAE / UK) with zone-based rates

### Admin Dashboard
- Bento-grid stats: today's orders, revenue, pending, low stock
- Pro analytics:
  - Revenue chart (daily / weekly / monthly)
  - Conversion funnel (cart → checkout → paid)
  - Top-selling products with units sold
  - Revenue by category and payment method
  - New vs returning customer split
  - Abandoned cart count
- Full order management + bulk status updates (confirm, pack, ship)
- Product CRUD with image upload
- Categories + collections management
- Coupon management (%, fixed, first-order, category-specific, countdown)
- Customer list with order history
- Inventory: stock movement log, CSV bulk update, low-stock alert panel
- Invoice generation (HTML, printable)
- Return requests management
- Q&A moderation
- Lookbook management
- Flash sale scheduling
- CSV data export: orders, products, customers, reviews

### Content & Marketing
- Blog (full article pages with author, tags, estimated read time)
- Lookbook / style guide
- FAQ page
- About page
- Contact form + WhatsApp click-to-chat

### Technical
- **PWA** — offline mode, installable on mobile
- **SEO** — sitemap, Open Graph, structured data
- **Accessibility** — ARIA labels, keyboard navigation, contrast-compliant
- **i18n** — Hindi language toggle (EN | हिंदी), key UI strings translated
- **Performance** — in-memory response caching (5 min TTL), DB indexes on all key query patterns
- **Security** — Helmet, CORS, Zod validation, rate limiting, HMAC payment verification
- **Environment validation** — startup check with clear error messages
- **Graceful shutdown** — SIGTERM/SIGINT handling

---

## Project Structure

```
web/
  src/
    app/                   Next.js App Router pages
    components/            Header, Cart, ProductCard, Footer, etc.
    lib/                   API client, Zustand stores, utils, auth

admin/
  src/
    app/admin/             Dashboard, analytics, orders, products, etc.
    components/            StatusBadge, shared admin UI
    lib/                   API client, types

server/
  src/
    routes/                Express route handlers (35+ route files)
    lib/                   Prisma client, cache, email, WhatsApp, env validation
    middleware/             Error handler, rate limiter, admin auth
    __tests__/             Vitest integration tests (1324+)
    scripts/               seed.ts
  prisma/
    schema.prisma          Database schema (40+ models)

scripts/
  setup.sh                 One-command dev environment setup
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Quick Setup (automated)

```bash
git clone https://github.com/feynixai/srinidhi-boutique.git
cd srinidhi-boutique
bash scripts/setup.sh
```

The setup script checks prerequisites, installs dependencies, copies `.env.example` → `.env`, runs `prisma db push`, and seeds the database.

### Manual Setup

```bash
# 1. Install all dependencies
npm install

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and credentials

cp web/.env.example web/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000

cp admin/.env.example admin/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000

# 3. Push database schema
npm run db:push

# 4. Seed with sample data (35 products, 9 categories, 10 coupons)
npm run db:seed

# 5. Start all services
npm run dev
```

| Service | URL |
|---------|-----|
| Store | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000 |

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string — `postgresql://user:pass@host:5432/db` |
| `PORT` | No | API server port (default: `4000`) |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `FRONTEND_URL` | No | Store URL for CORS and email links — `http://localhost:3000` |
| `RAZORPAY_KEY_ID` | No* | Razorpay key ID — payments fall back to COD without this |
| `RAZORPAY_KEY_SECRET` | No* | Razorpay key secret |
| `WHATSAPP_API_TOKEN` | No | WhatsApp Cloud API token (from Meta developers portal) |
| `WHATSAPP_PHONE_NUMBER_ID` | No | WhatsApp sender Phone Number ID |
| `ADMIN_WHATSAPP_PHONE` | No | Admin phone for order alerts — e.g. `919876543210` |
| `SMTP_HOST` | No | SMTP host — e.g. `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port — default `587` |
| `SMTP_USER` | No | SMTP login email |
| `SMTP_PASS` | No | SMTP app password |
| `SMTP_FROM` | No | From display name — `Srinidhi Boutique <orders@srinidhiboutique.in>` |
| `BANK_ACCOUNT_NUMBER` | No | Bank account number shown on Bank Transfer checkout |
| `BANK_IFSC` | No | Bank IFSC code |
| `BANK_SWIFT` | No | Bank SWIFT code (for international transfers) |

*Falls back to COD if absent. No error thrown.

### `web/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | API base URL — `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | No | Public store URL for SEO — `https://proofcrest.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp click-to-chat — `+919876543210` |
| `NEXT_PUBLIC_INSTAGRAM_URL` | No | Instagram profile URL |
| `NEXT_PUBLIC_FACEBOOK_URL` | No | Facebook page URL |
| `NEXT_PUBLIC_YOUTUBE_URL` | No | YouTube channel URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for customer login) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXTAUTH_SECRET` | No | NextAuth.js JWT secret — **required in production** |

### `admin/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | API base URL — `http://localhost:4000` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp number for admin notifications |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for admin login) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXTAUTH_SECRET` | No | NextAuth.js JWT secret — **required in production** |

---

## Database Schema

40+ Prisma models. Key models:

| Model | Purpose |
|-------|---------|
| `Product` | Products with images, variants, sizes, colors, fabric, occasion, stock |
| `Category` | Product categories with GST rate and HSN code |
| `Collection` | Curated collections (wedding, festival, etc.) |
| `Order` / `OrderItem` | Orders with multi-status lifecycle, GST, delivery slot |
| `User` / `AdminUser` | Customers and admin users (separate tables) |
| `CartItem` | Session-based cart (no login required) |
| `Coupon` | Discounts — %, fixed, first-order, category-specific, countdown |
| `Review` | Product reviews with star ratings |
| `StockMovement` | Audit log of every stock change |
| `LoyaltyAccount` / `LoyaltyHistory` | Loyalty points balance and transaction history |
| `Referral` | Referral codes, tracking, reward dispatch |
| `FlashSale` / `FlashSaleProduct` | Time-limited flash sales |
| `Lookbook` | Styled editorial images |
| `GiftCard` / `GiftCardTransaction` | Gift card lifecycle |
| `StoreCredit` | Per-user credit balance |
| `Bundle` | Product bundles (buy-together) |
| `PreOrder` / `PreOrderBooking` | Pre-order with booking management |
| `AbandonedCart` | Recovered via email/WhatsApp re-engagement |
| `Webhook` / `WebhookDelivery` | Outbound webhook system |
| `ReturnRequest` | Customer returns with reason + admin resolution |
| `PincodeZone` | Delivery zone mapping for Indian pincodes |

Full schema: [`server/prisma/schema.prisma`](./server/prisma/schema.prisma)

---

## API Endpoints

Full reference: [`API.md`](./API.md)

### Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + DB connectivity |
| GET | `/api/products` | List products (filters: category, size, color, price, fabric, occasion) |
| GET | `/api/products/featured` | Featured products (cached 5 min) |
| GET | `/api/products/best-sellers` | Best-selling products |
| GET | `/api/products/search` | Full-text search with autocomplete |
| GET | `/api/products/:slug` | Single product detail |
| GET | `/api/products/:slug/recommendations` | Similar products |
| GET | `/api/categories` | All categories |
| GET | `/api/collections` | All collections |
| POST | `/api/cart` | Add to cart |
| GET | `/api/cart/:sessionId` | Get cart |
| PATCH | `/api/cart/:id` | Update cart item quantity |
| DELETE | `/api/cart/:id` | Remove cart item |
| DELETE | `/api/cart/session/:sessionId` | Clear cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/track` | Track order by number + phone |
| GET | `/api/orders/:id` | Order detail |
| POST | `/api/orders/:id/status` | Update order status |
| POST | `/api/payments/razorpay/create` | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Verify payment (HMAC) |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/send-otp` | Send phone OTP |
| POST | `/api/auth/verify-otp` | Verify OTP + issue token |
| GET | `/api/coupons/validate` | Validate coupon code |
| POST | `/api/notifications/send-order-confirmation` | Send order WhatsApp + email |
| POST | `/api/notifications/send-shipping-update` | Send shipping notification |
| GET | `/api/inventory/low-stock` | Low stock products |
| POST | `/api/inventory/movements` | Log stock adjustment |
| POST | `/api/inventory/bulk-update` | Bulk CSV stock update |
| POST | `/api/inventory/back-in-stock` | Subscribe to back-in-stock |
| GET | `/api/loyalty/:userId` | Get loyalty balance |
| POST | `/api/loyalty/:userId/redeem` | Redeem loyalty points |
| GET | `/api/lookbook` | Lookbook entries |
| GET | `/api/flash-sales/active` | Active flash sales |
| POST | `/api/gift-cards/purchase` | Purchase gift card |
| POST | `/api/gift-cards/redeem` | Redeem gift card |
| GET | `/api/shipping/rates` | Shipping rates by pincode |
| GET | `/api/sitemap` | SEO sitemap |
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/analytics` | Pro analytics data |
| GET | `/api/admin/orders` | All orders with filters |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| POST | `/api/admin/orders/bulk-action` | Bulk order status update |
| GET | `/api/admin/products` | All products (admin) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product (soft) |
| GET | `/api/admin/customers` | Customer list |
| POST | `/api/admin/coupons` | Create coupon |
| GET | `/api/admin/returns` | Return requests |
| PATCH | `/api/admin/returns/:id` | Update return status |
| GET | `/api/admin/export/orders` | Export orders CSV |
| GET | `/api/admin/export/products` | Export products CSV |
| GET | `/api/admin/orders/:id/invoice` | Generate HTML invoice |

---

## Tests

```bash
npm test          # Run all 1324+ tests (singleFork mode, ~2 min)
```

Coverage: products, categories, cart, orders, coupons, payments (Razorpay + COD), auth (Google OAuth + Phone OTP), admin CRUD + bulk operations, international shipping + pincode zones, returns, WhatsApp + email notifications, analytics, stock movement + back-in-stock, cache, health check, env validation, GST calculation, delivery slots, order cancellation + store credits, CSV export, loyalty, referrals, flash sales, lookbook, chat, bundles, gift cards, pre-orders, abandoned cart recovery, webhooks, seed data.

---

## Deployment

### Vercel (Store + Admin)

```bash
# Store
cd web && npx vercel --yes --prod

# Admin
cd admin && npx vercel --yes --prod
```

Set `NEXT_PUBLIC_API_URL` to your deployed API URL in each Vercel project's environment variables.

### API Server (Railway / Render)

1. Connect GitHub repo → set **root directory** to `server/`
2. **Build:** `npm install && npx prisma generate && npm run build`
3. **Start:** `npm start`
4. Add all `server/.env.example` variables in the platform's env settings

### Database

```bash
# Push schema to production database
DATABASE_URL=your_prod_url npx prisma db push

# Seed sample data
DATABASE_URL=your_prod_url npm run db:seed
```

---

## Design System

Apple Liquid Glass aesthetic — glassmorphism, pill shapes, natural warm palette.

| Token | Value | Usage |
|-------|-------|-------|
| Gold | `#c5a55a` | CTAs, accents, prices |
| Navy | `#1a1a2e` | Primary text, dark buttons |
| Ivory | `#f5f5f0` | Page background |
| Glass | `rgba(255,255,255,0.6)` + `backdrop-blur-xl` | All card surfaces |
| Playfair Display | serif | Headings, product names |
| Inter | sans-serif | Body text, UI labels |

Mobile-first — 80%+ of Indian shoppers browse on phones.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](./LICENSE).

---

## Build Log

| Build | Date | Highlights | Tests |
|-------|------|-----------|-------|
| Build 1 | 2026-01-01 | Core catalog, cart, orders, Razorpay, admin | 100+ |
| Build 2 | 2026-01-02 | Auth, pincode zones, WhatsApp/email, SEO | 200+ |
| Build 3 | 2026-01-03 | Inventory, back-in-stock, returns, analytics | 300+ |
| Build 4 | 2026-01-04 | Admin dashboard, shipping, international rates | 400+ |
| Build 5 | 2026-01-05 | Bulk status, security, Razorpay everywhere | 475+ |
| Build 6 | 2026-01-06 | WhatsApp/email notifications, pro analytics | 530+ |
| Build 7 | 2026-01-07 | Loyalty, referrals, smart search, flash sales, chat | 628+ |
| Build 8 | 2026-01-08 | Variants, invoice PDF, shipping prep, collections, Q&A | 726+ |
| Build 9 | 2026-01-09 | Lookbook, customer segments, advanced reports | 826+ |
| Build 10 | 2026-01-10 | Bundles, gift cards, pre-orders, store credits, webhooks | 825+ |
| Build 11 | 2026-01-11 | Abandoned cart, bundles, gift cards, pre-orders, webhooks | 825+ |
| Build 12 | 2026-03-25 | GST, bulk product ops, delivery slots, order cancellation, coupon enhancements, data export | 901+ |
| Build 13 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1000+ |
| Build 14 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1050+ |
| Build 15 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1126 |
| Build 16 | 2026-03-25 | Apple Liquid Glass UI overhaul — glassmorphism, pill shapes | 1126 |
| Build 17 | 2026-03-25 | Admin bento dashboard, product hover, trust badges, glass checkout, skeleton loaders, 404/500, accessibility | 1324 |
| Build 18 | 2026-03-25 | README rewrite, Vercel redeploy, env docs, CONTRIBUTING.md, setup script polish | 1324 |
| Build 19 | 2026-03-25 | Checkout 4-step flow, page transitions, admin counters, cart/shop/product UX polish | 1324 |
| Build 20 | 2026-03-25 | Mobile UX, loading states, empty illustrations, brand assets, favicon, OG meta, cookie consent | 1324 |
| Build 21 | 2026-03-25 | Exit intent popup, cart upsell, trust badges, announcements, sales reports, coupon analytics, social sharing | 1324 |
| Build 22 | 2026-03-25 | Sticky bar, cart suggestions, countdown timers, size recommender, order tracking, admin bulk actions | 1324 |

---

Built with care for Srinidhi Boutique, Hyderabad.
