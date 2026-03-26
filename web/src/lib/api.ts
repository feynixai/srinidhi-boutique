import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category?: Category;
  categoryId?: string;
  sizes: string[];
  colors: string[];
  fabric?: string;
  occasion: string[];
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  onOffer: boolean;
  salePrice?: number;
  salePct?: number;
  offerPercent?: number;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: { products: number };
}

export interface CartItem {
  id: string;
  sessionId: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: Address;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  status: string;
  trackingId?: string;
  awbNumber?: string;
  courierName?: string;
  notes?: string;
  couponCode?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

// ── Demo products (shown when backend is offline) ─────────────────────────
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1', name: 'Red Kanjivaram Silk Saree', slug: 'red-kanjivaram-silk-saree',
    description: 'Exquisite handwoven Kanjivaram silk saree in rich red with gold zari border. Traditional temple motifs woven by master artisans from Kanchipuram. Comes with matching blouse piece. Perfect for weddings, festivals, and auspicious occasions.',
    price: 12500, comparePrice: 15000,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=900&fit=crop'],
    sizes: ['Free Size'], colors: ['Red', 'Gold'], fabric: 'Pure Silk', occasion: ['wedding', 'festival', 'pooja'],
    stock: 5, featured: true, bestSeller: true, onOffer: false, active: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2', name: 'Blue Cotton Office Kurti', slug: 'blue-cotton-office-kurti',
    description: 'Elegant blue cotton kurti with delicate white thread embroidery. Comfortable for all-day wear at the office or casual outings. A-line silhouette flatters all body types. Machine washable.',
    price: 1200, comparePrice: 1800,
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop'],
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Blue', 'White'], fabric: 'Cotton', occasion: ['office', 'casual'],
    stock: 20, featured: true, bestSeller: false, onOffer: true, offerPercent: 33, active: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3', name: 'Bridal Lehenga - Scarlet Red', slug: 'bridal-lehenga-scarlet-red',
    description: 'Stunning bridal lehenga in scarlet red with intricate gold zardozi embroidery. Heavy work dupatta with scalloped border. Includes lehenga skirt, blouse, and dupatta. Made to order — allow 2-3 weeks.',
    price: 25000, comparePrice: 35000,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'],
    sizes: ['S', 'M', 'L', 'XL'], colors: ['Scarlet Red', 'Gold'], fabric: 'Silk Georgette', occasion: ['wedding', 'party'],
    stock: 3, featured: true, bestSeller: true, onOffer: false, active: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-4', name: 'Organza Saree - Dusty Rose', slug: 'organza-saree-dusty-rose',
    description: 'Lightweight organza saree in beautiful dusty rose with delicate floral prints. Perfect for parties and evening events. Easy to drape and carry. Comes with unstitched blouse piece.',
    price: 3500, comparePrice: 4500,
    images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=800&fit=crop'],
    sizes: ['Free Size'], colors: ['Dusty Rose', 'Pink'], fabric: 'Organza', occasion: ['party', 'festival'],
    stock: 8, featured: false, bestSeller: true, onOffer: true, offerPercent: 22, active: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-5', name: 'Mirror Work Kurti - Teal', slug: 'mirror-work-kurti-teal',
    description: 'Vibrant teal kurti with traditional mirror work (abhla bharat). Perfect for Navratri garba nights or festive occasions. Cotton base keeps you cool while you dance! Pairs beautifully with white palazzo.',
    price: 1800, comparePrice: 2200,
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Teal', 'Mirror'], fabric: 'Cotton', occasion: ['festival', 'casual'],
    stock: 15, featured: true, bestSeller: false, onOffer: false, active: true, createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-6', name: 'Lucknowi Chikankari Kurti Set', slug: 'lucknowi-chikankari-kurti-set',
    description: 'Elegant white Lucknowi chikankari kurti with matching dupatta. Intricate hand embroidery by skilled artisans. Pure cotton, breathable and comfortable. Includes kurti + dupatta (pants sold separately).',
    price: 2800, comparePrice: 3500,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop'],
    sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Ivory'], fabric: 'Cotton', occasion: ['office', 'casual', 'pooja'],
    stock: 10, featured: true, bestSeller: true, onOffer: true, offerPercent: 20, active: true, createdAt: new Date().toISOString(),
  },
];

const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Sarees', slug: 'sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=600&fit=crop', _count: { products: 3 } },
  { id: 'cat-2', name: 'Kurtis', slug: 'kurtis', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=600&fit=crop', _count: { products: 3 } },
  { id: 'cat-3', name: 'Lehengas', slug: 'lehengas', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop', _count: { products: 1 } },
  { id: 'cat-4', name: 'Blouses', slug: 'blouses', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop', _count: { products: 0 } },
  { id: 'cat-5', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=600&fit=crop', _count: { products: 0 } },
];

// ── Products ──────────────────────────────────────────────────────────────
export const getProducts = (params?: Record<string, string>) =>
  api.get('/api/products', { params }).then((r) => r.data as { products: Product[]; total: number; page: number; totalPages: number })
    .catch(() => ({ products: DEMO_PRODUCTS, total: DEMO_PRODUCTS.length, page: 1, totalPages: 1 }));

export const getProduct = (slug: string) =>
  api.get(`/api/products/${slug}`).then((r) => r.data as Product)
    .catch(() => {
      const found = DEMO_PRODUCTS.find(p => p.slug === slug);
      if (found) return found;
      throw new Error('Product not found');
    });

export const getFeaturedProducts = () =>
  api.get('/api/products/featured').then((r) => r.data as Product[])
    .catch(() => DEMO_PRODUCTS.filter(p => p.featured));

export const getBestSellers = () =>
  api.get('/api/products/best-sellers').then((r) => r.data as Product[])
    .catch(() => DEMO_PRODUCTS.filter(p => p.bestSeller));

export const getOffers = () =>
  api.get('/api/products/offers').then((r) => r.data as Product[])
    .catch(() => DEMO_PRODUCTS.filter(p => p.onOffer));

// Categories
export const getCategories = () =>
  api.get('/api/categories').then((r) => r.data as Category[])
    .catch(() => DEMO_CATEGORIES);

// ── Cart (localStorage fallback when backend is offline) ──────────────────
const CART_KEY = 'srinidhi_cart';

function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

function saveLocalCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export const getCart = (sessionId: string) =>
  api.get(`/api/cart/${sessionId}`).then((r) => r.data as { items: CartItem[]; subtotal: number })
    .catch(() => {
      const items = getLocalCart();
      const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
      return { items, subtotal };
    });

export const addToCart = (data: {
  sessionId: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}) => api.post('/api/cart', data).then((r) => r.data as CartItem)
  .catch(() => {
    // Fallback: add to localStorage cart
    const items = getLocalCart();
    const product = DEMO_PRODUCTS.find(p => p.id === data.productId);
    if (!product) throw new Error('Product not found');
    
    const existingIdx = items.findIndex(i => i.productId === data.productId && i.size === data.size && i.color === data.color);
    if (existingIdx >= 0) {
      items[existingIdx].quantity += data.quantity;
    } else {
      const newItem: CartItem = {
        id: `local-${Date.now()}`,
        sessionId: data.sessionId,
        productId: data.productId,
        product,
        quantity: data.quantity,
        size: data.size,
        color: data.color,
      };
      items.push(newItem);
    }
    saveLocalCart(items);
    return items[items.length - 1];
  });

export const updateCartItem = (id: string, quantity: number) =>
  api.put(`/api/cart/${id}`, { quantity }).then((r) => r.data)
    .catch(() => {
      const items = getLocalCart();
      const item = items.find(i => i.id === id);
      if (item) { item.quantity = quantity; saveLocalCart(items); }
      return item;
    });

export const removeCartItem = (id: string) =>
  api.delete(`/api/cart/${id}`).then((r) => r.data)
    .catch(() => {
      const items = getLocalCart().filter(i => i.id !== id);
      saveLocalCart(items);
      return { success: true };
    });

// Orders
export const placeOrder = (data: Record<string, unknown>) =>
  api.post('/api/orders', data).then((r) => r.data as Order)
    .catch(() => {
      // Fallback: save order locally
      const orderId = `local-${Date.now()}`;
      const order: Order = {
        id: orderId,
        orderNumber: `SB-${Date.now().toString(36).toUpperCase()}`,
        items: [],
        customerName: data.customerName as string || '',
        customerPhone: data.customerPhone as string || '',
        customerEmail: data.customerEmail as string,
        address: data.address as Address,
        subtotal: 0,
        shipping: 0,
        total: 0,
        status: 'placed',
        paymentMethod: data.paymentMethod as string || 'cod',
        paymentStatus: data.paymentId ? 'paid' : 'pending',
        paymentId: data.paymentId as string,
        createdAt: new Date().toISOString(),
      };
      // Save to localStorage
      const orders = JSON.parse(localStorage.getItem('srinidhi_orders') || '[]');
      orders.push(order);
      localStorage.setItem('srinidhi_orders', JSON.stringify(orders));
      // Clear cart
      localStorage.removeItem('srinidhi_cart');
      return order;
    });

export const getOrder = (id: string) =>
  api.get(`/api/orders/${id}`).then((r) => r.data as Order)
    .catch(() => {
      const orders = JSON.parse(localStorage.getItem('srinidhi_orders') || '[]');
      const order = orders.find((o: Order) => o.id === id);
      if (order) return order;
      throw new Error('Order not found');
    });

// Coupons
export const validateCoupon = (code: string, orderAmount: number) =>
  api.post('/api/coupons/validate', { code, orderAmount }).then((r) => r.data);

export interface CouponSuggestion {
  code: string;
  discount: number;
  type: 'percent' | 'flat';
  discountAmount: number;
  minOrder?: number;
}

export const getBestCoupons = (total: number) =>
  api.get(`/api/coupons/best?total=${total}`).then((r) => r.data as { coupons: CouponSuggestion[]; best: CouponSuggestion | null });

// Reviews
export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string;
  body?: string;
  imageUrl?: string;
  approved: boolean;
  createdAt: string;
}

export const getReviews = (productId: string) =>
  api.get(`/api/reviews/${productId}`).then((r) => r.data as { reviews: Review[]; total: number; avgRating: number; distribution: { star: number; count: number }[] });

export const submitReview = (productId: string, data: { customerName: string; rating: number; title?: string; body?: string; imageUrl?: string }) =>
  api.post(`/api/reviews/${productId}`, data).then((r) => r.data as Review);

// Orders by phone
export const getOrdersByPhone = (phone: string) =>
  api.get(`/api/orders/by-phone/${phone}`).then((r) => r.data);

// Pincode check
export const checkPincode = (pincode: string) =>
  api.get(`/api/pincode/${pincode}`).then((r) => r.data);
