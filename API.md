# Srinidhi Boutique — API Reference

Base URL: `http://localhost:4000` (development)

All endpoints return JSON. Errors return `{ "error": "message" }` with appropriate HTTP status codes.

---

## Health

### GET /health
Returns server + database status.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2026-03-25T10:00:00.000Z",
  "database": "connected",
  "env": "production"
}
```

---

## Products

### GET /api/products
List products with filters and pagination.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Category slug |
| occasion | string | Occasion tag |
| minPrice | number | Min price filter |
| maxPrice | number | Max price filter |
| search | string | Full-text search |
| size | string | Size filter |
| color | string | Color filter |
| fabric | string | Fabric filter |
| sort | string | `price_asc`, `price_desc`, `popular`, `newest` (default) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response**
```json
{
  "products": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

### GET /api/products/featured
Featured products (cached 5 minutes).

### GET /api/products/best-sellers
Best-selling products.

### GET /api/products/offers
Products currently on offer.

### GET /api/products/id/:id
Get product by ID (used for recently viewed).

### GET /api/products/:slug
Get single product by slug.

**Response**: Full product object with category.

### GET /api/products/:slug/recommendations
Products from the same category or similar price range. Max 8 results.

---

## Categories

### GET /api/categories
All categories.

### GET /api/categories/:slug
Category by slug with products.

---

## Cart

### POST /api/cart
Add item to cart.

**Body**
```json
{
  "sessionId": "abc123",
  "productId": "clxxx",
  "quantity": 1,
  "size": "M",
  "color": "Red"
}
```

### GET /api/cart/:sessionId
Get cart contents for a session.

### PATCH /api/cart/:id
Update cart item quantity. Body: `{ "quantity": 2 }`

### DELETE /api/cart/:id
Remove single cart item.

### DELETE /api/cart/session/:sessionId
Clear entire cart for a session.

### GET /api/cart/abandoned
Admin: carts older than 24h. Query: `?hours=24`

### GET /api/cart/reminder/:sessionId
Check if session has an abandoned cart (for reminder banner).

---

## Orders

### POST /api/orders
Place a new order.

**Body**
```json
{
  "customerName": "Priya Sharma",
  "customerPhone": "9876543210",
  "customerEmail": "priya@email.com",
  "address": {
    "line1": "123 MG Road",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500001",
    "country": "IN"
  },
  "items": [
    { "productId": "clxxx", "quantity": 1, "size": "M", "color": "Red" }
  ],
  "paymentMethod": "razorpay",
  "paymentId": "pay_xxx",
  "couponCode": "SRINIDHI20",
  "country": "IN",
  "userId": "usr_xxx"
}
```

Auto-triggers: order confirmation WhatsApp + email, admin WhatsApp alert, stock decrement + movement log.

### GET /api/orders/track?orderNumber=SB-0001&phone=9876543210
Track order status.

### GET /api/orders/by-phone/:phone
Get all orders for a phone number.

### GET /api/orders/:id
Get order by ID.

### GET /api/orders/number/:orderNumber
Get order by order number.

### POST /api/orders/:id/status
Update order status. Auto-triggers shipping/delivery WhatsApp + email.

**Body**: `{ "status": "shipped", "trackingId": "DHL123" }`

Status values: `placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`

---

## Payments

### POST /api/payments/razorpay/create
Create a Razorpay order for payment.

**Body**: `{ "amount": 150000, "currency": "INR", "receipt": "SB-0001" }`

### POST /api/payments/razorpay/verify
Verify Razorpay payment signature (HMAC-SHA256).

**Body**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "xxx"
}
```

---

## Coupons

### GET /api/coupons
List all coupons (admin).

### POST /api/coupons/validate
Validate a coupon code.

**Body**: `{ "code": "SRINIDHI20", "subtotal": 1500 }`

### POST /api/coupons
Create coupon (admin).

### PUT /api/coupons/:id
Update coupon (admin).

### DELETE /api/coupons/:id
Delete coupon (admin).

---

## Auth

### POST /api/auth/google
Google OAuth — exchange token for JWT.

**Body**: `{ "token": "google_id_token" }`

### POST /api/auth/send-otp
Send OTP to phone number.

**Body**: `{ "phone": "9876543210" }`

### POST /api/auth/verify-otp
Verify OTP and return JWT.

**Body**: `{ "phone": "9876543210", "code": "123456" }`

---

## Users

### GET /api/users/:userId/wishlist
Get user wishlist.

### POST /api/users/:userId/wishlist
Add to wishlist. Body: `{ "productId": "clxxx" }`

### DELETE /api/users/:userId/wishlist/:productId
Remove from wishlist.

### GET /api/users/:userId/recently-viewed
Get recently viewed products.

### POST /api/users/:userId/recently-viewed
Log a product view. Body: `{ "productId": "clxxx" }`

---

## Notifications

### POST /api/notifications/send-order-confirmation
Send order confirmation via WhatsApp + email.

**Body**: `{ "orderId": "clxxx" }`

### POST /api/notifications/send-shipping-update
Send shipping notification via WhatsApp + email.

**Body**: `{ "orderId": "clxxx" }`

### POST /api/notifications/send-delivery-update
Send delivery + review request via WhatsApp.

**Body**: `{ "orderId": "clxxx" }`

### GET /api/notifications/whatsapp-link?phone=919876543210&message=Hello
Generate a WhatsApp click-to-chat link.

---

## Inventory

### GET /api/inventory/movements?productId=&page=1&limit=50
Stock movement log.

### POST /api/inventory/movements
Log a manual stock adjustment.

**Body**
```json
{
  "productId": "clxxx",
  "delta": 10,
  "reason": "restock",
  "note": "Supplier delivery",
  "adminId": "admin_xxx"
}
```

Reason values: `restock`, `adjustment`, `return`, `csv_import`

### POST /api/inventory/bulk-update
Bulk stock update via CSV upload. `multipart/form-data` with `file` field.

CSV format:
```
productId,delta,reason
clxxx,10,restock
clyyy,-5,adjustment
```

### GET /api/inventory/low-stock?threshold=3
Products with stock at or below threshold.

### POST /api/inventory/back-in-stock
Subscribe to back-in-stock notification.

**Body**: `{ "productId": "clxxx", "email": "user@email.com" }` (email or phone required)

### GET /api/inventory/back-in-stock/:productId
Admin: list subscribers for a product.

---

## Admin

### GET /api/admin/dashboard
Dashboard summary stats.

**Response**: `{ todayOrders, todayRevenue, totalOrders, totalRevenue, pendingOrders, recentOrders, totalProducts, lowStockProducts }`

### GET /api/admin/analytics?period=30
Pro analytics (period in days: 7, 30, 90).

**Response**
```json
{
  "totalRevenue": 125000,
  "totalOrders": 43,
  "avgOrderValue": 2907,
  "dailyRevenue": [{ "date": "2026-03-01", "revenue": 4500, "orders": 2 }],
  "topProducts": [...],
  "revenueByPayment": [...],
  "revenueByCategory": [{ "category": "Sarees", "revenue": 45000 }],
  "conversionFunnel": { "cartItems": 120, "checkoutStarted": 65, "paid": 43, "abandonedCarts": 22 },
  "customerAcquisition": { "newCustomers": 38, "returningCustomers": 5 },
  "abandonedCarts": 22
}
```

### GET /api/admin/products
List products (admin view with inactive).

### POST /api/admin/products
Create product.

### PUT /api/admin/products/:id
Update product.

### DELETE /api/admin/products/:id
Soft-delete product (sets active: false).

### GET /api/admin/orders
List orders. Query: `?status=placed&page=1&limit=20`

### POST /api/admin/orders/bulk-action
Bulk status update. Body: `{ "orderIds": [...], "action": "confirm" }`

### GET /api/admin/orders/:id/invoice
Generate HTML invoice for an order.

### GET /api/admin/customers
List customers with order count.

---

## Shipping

### GET /api/shipping/rates?pincode=500001&subtotal=1500&country=IN
Get shipping rate for a pincode + order total.

### GET /api/pincode/:pincode
Pincode zone lookup.

---

## Reviews

### GET /api/reviews/:productId
Get reviews for a product.

### POST /api/reviews
Submit a review. Body: `{ productId, customerName, rating, title, body }`

---

## Newsletter

### POST /api/newsletter/subscribe
Subscribe to newsletter. Body: `{ "email": "user@email.com", "name": "Priya" }`

---

## Returns

### POST /api/returns
Submit a return request.

**Body**: `{ orderNumber, customerName, customerPhone, reason, description }`

### GET /api/returns
Admin: list return requests.

### PATCH /api/returns/:id
Admin: update return status.
