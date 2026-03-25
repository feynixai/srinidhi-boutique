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

// Products
export const getProducts = (params?: Record<string, string>) =>
  api.get('/api/products', { params }).then((r) => r.data as { products: Product[]; total: number; page: number; totalPages: number });

export const getProduct = (slug: string) =>
  api.get(`/api/products/${slug}`).then((r) => r.data as Product);

export const getFeaturedProducts = () =>
  api.get('/api/products/featured').then((r) => r.data as Product[]);

export const getBestSellers = () =>
  api.get('/api/products/best-sellers').then((r) => r.data as Product[]);

export const getOffers = () =>
  api.get('/api/products/offers').then((r) => r.data as Product[]);

// Categories
export const getCategories = () =>
  api.get('/api/categories').then((r) => r.data as Category[]);

// Cart
export const getCart = (sessionId: string) =>
  api.get(`/api/cart/${sessionId}`).then((r) => r.data as { items: CartItem[]; subtotal: number });

export const addToCart = (data: {
  sessionId: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}) => api.post('/api/cart', data).then((r) => r.data as CartItem);

export const updateCartItem = (id: string, quantity: number) =>
  api.put(`/api/cart/${id}`, { quantity }).then((r) => r.data);

export const removeCartItem = (id: string) =>
  api.delete(`/api/cart/${id}`).then((r) => r.data);

// Orders
export const placeOrder = (data: Record<string, unknown>) =>
  api.post('/api/orders', data).then((r) => r.data as Order);

export const getOrder = (id: string) =>
  api.get(`/api/orders/${id}`).then((r) => r.data as Order);

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
  approved: boolean;
  createdAt: string;
}

export const getReviews = (productId: string) =>
  api.get(`/api/reviews/${productId}`).then((r) => r.data as { reviews: Review[]; total: number; avgRating: number; distribution: { star: number; count: number }[] });

export const submitReview = (productId: string, data: { customerName: string; rating: number; title?: string; body?: string }) =>
  api.post(`/api/reviews/${productId}`, data).then((r) => r.data as Review);

// Orders by phone
export const getOrdersByPhone = (phone: string) =>
  api.get(`/api/orders/by-phone/${phone}`).then((r) => r.data);

// Pincode check
export const checkPincode = (pincode: string) =>
  api.get(`/api/pincode/${pincode}`).then((r) => r.data);
