# DESIGN.md — Srinidhi Boutique Design System

## Inspiration: Apple Liquid Glass (see design-ref-1.jpg, design-ref-2.jpg)

## Core Principles
- **Glassmorphism**: Frosted glass backgrounds with backdrop-blur, semi-transparent cards
- **Bento Grid**: Card-based layout with mixed sizes (like the BuyMore/nitec references)
- **Rounded Everything**: Pill-shaped buttons, rounded-2xl/3xl cards, curvy edges
- **Natural Colors**: Soft sage green, cream, warm whites — NOT harsh maroon
- **Clean Typography**: SF Pro / Inter for body, large bold headings like Apple
- **Whitespace**: Generous spacing, let elements breathe
- **Soft Shadows**: Subtle, layered shadows — no harsh borders
- **Micro-interactions**: Hover lifts, smooth transitions, subtle animations

## Color Palette (Liquid Glass)
- Background: #f5f5f0 (warm off-white)
- Glass cards: rgba(255, 255, 255, 0.6) with backdrop-blur(20px)
- Primary accent: #1a1a2e (dark navy/charcoal)
- Secondary accent: #c5a55a (antique gold — for Indian ethnic touch)
- Soft green: #e8f0e8 (like the BuyMore background)
- Text primary: #1a1a1a
- Text secondary: #6b7280
- Price badge: #2563eb (vibrant blue pill, like the $36/$89 badges)
- Success: #22c55e
- Card borders: rgba(255, 255, 255, 0.3)

## CSS Variables
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-blur: 20px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 9999px;
  --shadow-soft: 0 4px 30px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.08);
  --bg-main: #f5f5f0;
  --bg-green: #e8f0e8;
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
  --accent-gold: #c5a55a;
  --accent-blue: #2563eb;
}
```

## Component Patterns
- **Navbar**: Frosted glass, fixed, pill-shaped search bar, rounded avatar
- **Product Cards**: Glass background, rounded-2xl, soft shadow, price in colored pill badge
- **Category Chips**: Pill-shaped with icons (like All/Men/Women in ref)
- **Sidebar**: Clean with icon + label, active state with colored pill background
- **Hero Banners**: Rounded-2xl cards with gradient overlays
- **Buttons**: Pill-shaped, solid dark or glass background
- **Bottom Nav (mobile)**: Glass effect, pill icons, floating slightly above edge
- **Filters**: Pill chips, toggleable
- **Wishlist Heart**: Rounded circle with subtle glass background

## Typography
- Headings: font-weight: 700, tracking-tight
- Body: font-weight: 400, text-gray-600
- Prices: font-weight: 700 in pill badges
- Labels: uppercase, letter-spacing: 0.05em, text-xs, text-gray-400

## Key UX Patterns from References
1. Dashboard/Website toggle in navbar (pill segmented control)
2. Explore section with category pill filters
3. Bento grid with mixed card sizes
4. Favorites carousel within a card
5. Quick actions sidebar
6. Order count prominently displayed
7. Color swatches as circles
8. Arrow buttons (↗) for navigation
9. Prominent search bar with rounded styling
