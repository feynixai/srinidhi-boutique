# Srinidhi Boutique

Premium Indian ethnic wear e-commerce platform built for Srinidhi Boutique, a women's clothing store in Hyderabad.

## Live

| App | URL |
|-----|-----|
| Store | _Vercel — web/_ |
| Admin Dashboard | _Vercel — admin/_ |
| API | _Railway/Render — server/_ |

## Tech Stack

- **Store** (`web/`) — Next.js 14, Tailwind CSS, Zustand, React Query
- **Admin** (`admin/`) — Next.js 14, Tailwind CSS, React Query
- **Server** (`server/`) — Express, Prisma, PostgreSQL (SQLite in dev)
- **Payments** — Razorpay (UPI, cards, net banking) + COD
- **Notifications** — WhatsApp Business API

## Features

### Store
- Elegant Indian ethnic theme — rose gold, ivory, warm white
- Hero banner with featured collections
- Product catalog with category/size/color/price filters + sort
- Product detail pages with image gallery, size guide, WhatsApp order button
- Customer reviews section
- Smooth cart drawer with coupon code support
- 3-step checkout (address → payment → confirm)
- Order confirmation & tracking page
- Wishlist (localStorage persisted)
- Mobile-first responsive design

### Admin Dashboard
- Sales stats: today's orders, revenue, pending, low stock
- Orders management with status workflow: Placed → Confirmed → Packed → Shipped → Delivered
- Products CRUD with image support
- Coupon management (create, edit, delete, set discount/expiry/min order)

### API
- RESTful Express API with Prisma ORM
- Full products, categories, cart, orders, coupons endpoints
- Coupon validation (expiry, max uses, minimum order amount)
- Stock management on order placement

## Project Structure

```
web/          Customer-facing store (Next.js)
admin/        Admin dashboard (Next.js)
server/       Express API + Prisma
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up database
npm run db:push
npm run db:seed

# Start all services
npm run dev

# Or individually:
npm run dev:web      # http://localhost:3000
npm run dev:admin    # http://localhost:3001
npm run dev:server   # http://localhost:4000
```

## Environment Variables

### web/ and admin/
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210
```

### server/
```
DATABASE_URL=postgresql://user:password@localhost:5432/srinidhi
PORT=4000
```

## Tests

```bash
npm test
# 110 tests across 7 test files — all passing
```

Test coverage: products, categories, cart, orders, coupons, admin CRUD, sort/filter, checkout validation, order lifecycle, edge cases.

## Deploy

Both `web/` and `admin/` are configured for [Vercel](https://vercel.com):

1. Connect repo to Vercel
2. Set root directory to `web/` for store, `admin/` for admin panel
3. Add env vars in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` → your deployed server URL
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` → WhatsApp business number

Deploy server to Railway or Render with `DATABASE_URL` set.

## Screenshots

_Coming soon — will be added after production launch_

## Design

- **Fonts**: Playfair Display (headings) + Inter (body)
- **Colors**: Rose Gold `#B76E79` · Ivory `#FFFFF0` · Soft Pink `#FFB6C1` · Warm White `#FFF8F5`
- Mobile-first — 80%+ Indian shoppers browse on phones

---

Built with care for Srinidhi Boutique, Hyderabad.
