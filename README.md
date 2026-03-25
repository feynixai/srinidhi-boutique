# Srinidhi Boutique

Premium Indian ethnic wear e-commerce platform built for Srinidhi Boutique — a women's clothing store in Hyderabad, India. 27 commits, store live at proofcrest.com.

## Live URLs

| App | URL |
|-----|-----|
| Store | https://proofcrest.com |
| Admin Dashboard | https://admin-cyan-one-44.vercel.app |
| API | Railway — server/ |

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
| Database | PostgreSQL |
| Payments | Razorpay (UPI, cards, net banking, EMI) + Cash on Delivery |
| Notifications | WhatsApp Cloud API + Nodemailer (SMTP) |
| Auth | Google OAuth + Phone OTP |
| Shipping | Indian pincode zones + international rates |
| Testing | Vitest, Supertest |
| Deployment | Vercel (frontend), Railway (API + DB) |

## Feature List

### Store (web/)
- Apple Liquid Glass UI — glassmorphism, pill shapes, natural rose gold palette
- Hero carousel with featured collections
- Mega menu with category navigation
- Product catalog with filters: category, size, color, price, fabric, occasion
- Product detail pages: image gallery, size guide, WhatsApp order button
- Customer reviews with star ratings
- Cart drawer with coupon code support
- 3-step checkout: address → payment → confirm
- Guest checkout (no forced registration)
- Order confirmation, tracking, and history pages
- Wishlist (persisted per user)
- Recently viewed products bar
- Back-in-stock notification signup
- Product recommendations (same category + price range)
- Abandoned cart reminder (shown on return visit)
- Returns flow with reason selection
- PWA support (offline mode, installable)
- Newsletter signup
- Contact form
- Flash sales with countdown timers
- Loyalty points programme (earn on purchase, redeem on checkout)
- Referral system (share link, earn on friend's first order)
- Lookbook / style guide
- Product bundles (buy-together deals)
- Gift cards (purchase + redeem)
- Pre-order support for out-of-stock items
- Store credits (returns → credits → redeem)
- Smart search with autocomplete
- Hindi language toggle (EN | हिंदी) — key UI strings translated, preference saved to localStorage
- Product comparison (up to 3 products side-by-side, floating compare bar)
- Urgency triggers: "Only X left!" badge (stock < 5), "Trending" badge, weekly sold counter
- Auto-apply best coupon at checkout — shows eligible coupons ranked by savings, one-click apply

### Admin Dashboard (admin/)
- Glass-design stats dashboard: today's orders, revenue, pending orders, low stock
- Pro analytics:
  - Revenue chart (daily/weekly/monthly)
  - Conversion funnel (cart → checkout → paid)
  - Top selling products with units sold
  - Revenue by category (bar chart)
  - Revenue by payment method
  - New vs returning customer split
  - Abandoned carts count
- Orders management: full lifecycle (Placed → Confirmed → Packed → Shipped → Delivered)
- Bulk order operations (confirm, pack, ship selected)
- Products CRUD with image upload support
- Categories management
- Collections management (wedding, festival, etc.)
- Coupon management (discount %, expiry, max uses, min order, category-specific)
- Customer list with order history
- Inventory management:
  - Stock movement log (who added/removed, when, why)
  - Auto-disable products when stock hits 0
  - Bulk stock update via CSV upload
  - Low-stock alert panel (threshold: 5 units)
- Invoice generation (HTML, printable)
- Return requests management
- Q&A moderation
- Lookbook management
- Flash sale scheduling
- WhatsApp + email notifications per order
- Quick actions: add product, view pending orders, manage coupons

### API (server/)
- RESTful Express API — 25+ route groups, fully typed with TypeScript
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
- Loyalty programme API (earn/redeem points)
- Referral tracking API
- Flash sales with automatic expiry
- Lookbook API
- Product bundles
- Gift cards (purchase, redeem, balance check)
- Pre-orders with booking management
- Store credits
- Webhook delivery system
- CSV data export (products, orders, customers, reviews)
- GST calculation (intra-state CGST/SGST vs inter-state IGST)
- Delivery slot selection
- Order cancellation + store credit refund
- SEO: sitemap generation
- Security: Helmet, CORS, Zod validation, rate limiting
- Health check endpoint with database connectivity
- Environment variable validation on startup
- Graceful shutdown (SIGTERM/SIGINT)
- In-memory response caching for product listings (5 min TTL)
- Database indexes on all key query patterns

## Project Structure

```
web/
  src/
    app/                   Next.js App Router pages
    components/            Reusable UI components (Header, Cart, ProductCard, etc.)
    lib/                   API client, Zustand stores, utils
admin/
  src/
    app/admin/             Admin pages (dashboard, analytics, orders, products, etc.)
    components/            Admin UI components (StatusBadge, etc.)
    lib/                   API client, types
server/
  src/
    routes/                Express route handlers (25+ route files)
    lib/                   Prisma client, cache, email, WhatsApp, env validation
    middleware/            Error handler, rate limiter, admin auth
    __tests__/             Vitest tests (1324+)
    scripts/               seed.ts
  prisma/
    schema.prisma          Database schema (30+ models)
scripts/
  setup.sh                 One-command dev environment setup
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Quick Setup (automated)

```bash
git clone https://github.com/yourusername/srinidhi-boutique.git
cd srinidhi-boutique
bash scripts/setup.sh
```

The setup script checks prerequisites, installs dependencies, copies `.env.example`, runs `prisma db push`, and seeds the database.

### Manual Setup

```bash
# 1. Install all dependencies
npm install

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and credentials

# 3. Push database schema
npm run db:push

# 4. Seed with sample data (35 products, 9 categories, 10 coupons)
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

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/srinidhi` |
| `PORT` | No | API server port (default: 4000) | `4000` |
| `FRONTEND_URL` | No | Store URL for CORS | `http://localhost:3000` |
| `RAZORPAY_KEY_ID` | No* | Razorpay key — payments disabled without this | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | No* | Razorpay secret | `xxxxxxxxxxxxxxxx` |
| `WHATSAPP_API_TOKEN` | No | WhatsApp Cloud API token | `EAAxxxxx` |
| `WHATSAPP_PHONE_NUMBER_ID` | No | WhatsApp sender phone number ID | `123456789` |
| `ADMIN_WHATSAPP_PHONE` | No | Admin phone for order alerts | `919876543210` |
| `SMTP_HOST` | No | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port | `587` |
| `SMTP_USER` | No | SMTP login email | `orders@yourdomain.com` |
| `SMTP_PASS` | No | SMTP app password | `your_app_password` |
| `SMTP_FROM` | No | From name + address | `Srinidhi Boutique <orders@...>` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `JWT_SECRET` | No | JWT signing secret | `your_jwt_secret` |

*Payments silently fall back to COD if Razorpay keys are absent.

### web/.env.local and admin/.env.local

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | API server base URL | `http://localhost:4000` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp click-to-chat number | `+919876543210` |

## Tests

```bash
npm test          # Run all 1324 tests (singleFork mode, ~2 min)
```

Test coverage includes products, categories, cart, orders, coupons, payments (Razorpay + COD), auth (Google OAuth + Phone OTP), admin CRUD + bulk operations, international shipping + pincode zones, returns, WhatsApp + email notifications, analytics, stock movement + back-in-stock, cache, health check, env validation, GST calculation, delivery slots, order cancellation + store credits, coupons (category-specific, first-order, countdown), CSV export, loyalty, referrals, flash sales, lookbook, chat, bundles, gift cards, pre-orders, abandoned cart recovery, webhooks, and seed data validation.

## API Endpoint Reference

See [API.md](./API.md) for the full reference with request/response examples.

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
| POST | `/api/payments/razorpay/verify` | Verify payment signature |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/send-otp` | Send phone OTP |
| POST | `/api/auth/verify-otp` | Verify OTP + issue token |
| GET | `/api/coupons/validate` | Validate coupon code |
| POST | `/api/notifications/send-order-confirmation` | Send order notification |
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
| GET | `/api/admin/products` | All products (admin view) |
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

## Deployment

### Quick Deploy — Vercel

```bash
# Store
cd web && npx vercel --prod

# Admin
cd admin && npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to your deployed API URL in each Vercel project's environment variables.

### API Server (Railway / Render)

1. Connect your GitHub repo
2. Set **root directory** to `server/`
3. **Build command**: `npm install && npx prisma generate && npm run build`
4. **Start command**: `npm start`
5. Add all environment variables from `server/.env.example`

### Store & Admin (Vercel — manual)

For `web/` and `admin/`:
1. Import repo in Vercel
2. Set **root directory** to `web/` (or `admin/`)
3. Set `NEXT_PUBLIC_API_URL` to your deployed server URL
4. Deploy

### Database (Supabase / Neon / Railway PostgreSQL)

```bash
# After deploying API, run migrations against production DB
DATABASE_URL=your_production_url npx prisma db push

# Seed sample data
DATABASE_URL=your_production_url npm run db:seed
```

## Design System — Apple Liquid Glass

| Token | Value | Usage |
|-------|-------|-------|
| Gold | `#c5a55a` | CTAs, accents, prices |
| Navy | `#1a1a2e` | Primary text, buttons |
| Ivory | `#f5f5f0` | Page background |
| Glass BG | `rgba(255,255,255,0.6)` | Card backgrounds (blur-xl) |
| Playfair Display | serif | Headings, product names |
| Inter | sans-serif | Body text, UI |

All cards use `backdrop-blur-xl` with `bg-white/60` and `border border-white/30` — the Liquid Glass style. Mobile-first — 80%+ of Indian shoppers browse on phones.

## Screenshots

| Page | Description |
|------|-------------|
| Store home | Hero carousel, trust badge pills, category grid, featured products |
| Product detail | Image gallery with hover swap, size selector, WhatsApp order |
| Cart | Glass cards, free shipping progress, save-for-later |
| Checkout | Glass progress bar, glass payment cards, UPI QR glass modal |
| Admin dashboard | Bento grid, glass stat cards, weekly chart, low stock alerts |

> Screenshots coming soon — run locally at http://localhost:3000

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Run `npm test` and ensure all tests pass
5. Submit a pull request

For bug reports or feature requests, open an issue.

## License

MIT — see [LICENSE](./LICENSE) for details.

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
| Build 13 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1000+ |
| Build 14 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1050+ |
| Build 15 | 2026-03-25 | Admin power tools, order workflow, product analytics | 1126 |
| Build 16 | 2026-03-25 | Apple Liquid Glass UI overhaul — glassmorphism, pill shapes | 1126 |
| Build 17 | 2026-03-25 | Admin bento dashboard, product image hover, trust badge pills, glass checkout, skeleton loaders, 404/500 pages, accessibility | 1324 |
| Build 18 | 2026-03-25 | README rewrite, Vercel redeploy, setup script, seed polish, package.json cleanup | 1324 |

Built with care for Srinidhi Boutique, Hyderabad.
