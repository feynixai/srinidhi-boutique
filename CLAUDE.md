# CLAUDE.md — Srinidhi Boutique

## What is this?
Premium women's boutique e-commerce platform. Built for Srinidhi Boutique — a women's clothing store in Hyderabad, India.

## Architecture
- **Frontend**: Next.js 14 + Tailwind CSS (elegant, mobile-first)
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Payments**: Razorpay (UPI, cards, net banking) + COD
- **WhatsApp**: Business API for orders + notifications
- **Admin**: Simple dashboard for non-tech user (Arun's mom)

## Design Direction
- Premium, elegant — NOT a generic e-commerce template
- Color palette: rose gold (#B76E79), ivory (#FFFFF0), soft pink (#FFB6C1), warm white
- Product photography focus
- Serif font for headings (Playfair Display), sans for body (Inter)
- Mobile-first (80%+ Indian women shop on phones)
- Instagram-worthy product pages

## Key UX Principles
- Guest checkout (no registration wall)
- 3-step max checkout
- WhatsApp ordering on every product
- Sticky "Add to Cart" on mobile
- Under 2 second page load

## Project Structure
```
web/                  — Next.js frontend (customer-facing store)
admin/                — Next.js admin dashboard (simple, big buttons)
server/               — Express API + Prisma
```

## Commands
```bash
npm install
npm run dev           # Start all
npm run dev:web       # Store frontend
npm run dev:admin     # Admin dashboard
npm run dev:server    # API server
npm test              # Run tests
```

## Database Models
- Product (name, description, images, price, sizes, colors, category, stock, featured)
- Category (name, slug, image)
- Collection (name, slug, products — wedding, festival, etc.)
- Order (items, customer, address, payment, status)
- Customer (name, phone, email, addresses)
- Cart (items, customer/session)
- Coupon (code, discount, expiry)
