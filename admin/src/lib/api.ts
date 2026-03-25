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
  category?: { id: string; name: string; slug: string };
  categoryId?: string;
  sizes: string[];
  colors: string[];
  fabric?: string;
  occasion: string[];
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  onOffer: boolean;
  offerPercent?: number;
  active: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: Record<string, string>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  trackingId?: string;
  notes?: string;
  couponCode?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
  totalProducts: number;
  lowStockProducts: number;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  totalSold: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category?: { name: string };
}

export interface DashboardWidgets {
  todayOrders: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  pendingReturnsCount: number;
  unreadChatsCount: number;
  pendingReviewsCount: number;
  topSellingProducts: TopSellingProduct[];
  recentOrders: Order[];
  weekRevenue7: number;
  weekRevenue30: number;
}

export const getDashboard = () =>
  api.get('/api/admin/dashboard').then((r) => r.data as DashboardStats);

export const getDashboardWidgets = () =>
  api.get('/api/admin/dashboard/widgets').then((r) => r.data as DashboardWidgets);

export const getLowStockProducts = (threshold = 5) =>
  api.get(`/api/admin/low-stock?threshold=${threshold}`).then((r) => r.data as { threshold: number; count: number; products: LowStockItem[] });

export const getAdminProducts = (params?: Record<string, string>) =>
  api.get('/api/admin/products', { params }).then((r) => r.data as { products: Product[]; total: number; page: number; totalPages: number });

export const createProduct = (data: Record<string, unknown>) =>
  api.post('/api/admin/products', data).then((r) => r.data as Product);

export const updateProduct = (id: string, data: Record<string, unknown>) =>
  api.put(`/api/admin/products/${id}`, data).then((r) => r.data as Product);

export const deleteProduct = (id: string) =>
  api.delete(`/api/admin/products/${id}`).then((r) => r.data);

export const updateProductStock = (id: string, stock: number) =>
  api.patch(`/api/admin/products/${id}/stock`, { stock }).then((r) => r.data as Product);

export const updateProductActive = (id: string, active: boolean) =>
  api.put(`/api/admin/products/${id}`, { active }).then((r) => r.data as Product);

export const getAdminOrders = (params?: Record<string, string>) =>
  api.get('/api/admin/orders', { params }).then((r) => r.data as { orders: Order[]; total: number; page: number; totalPages: number });

export const updateOrderStatus = (id: string, status: string, trackingId?: string) =>
  api.put(`/api/admin/orders/${id}/status`, { status, trackingId }).then((r) => r.data as Order);

export const bulkUpdateOrderStatus = (ids: string[], status: string) =>
  api.post('/api/admin/orders/bulk-status', { ids, status }).then((r) => r.data as { updated: number });

export const getAdminCoupons = () =>
  api.get('/api/admin/coupons').then((r) => r.data as Coupon[]);

export const createCoupon = (data: Record<string, unknown>) =>
  api.post('/api/admin/coupons', data).then((r) => r.data as Coupon);

export const updateCoupon = (id: string, data: Record<string, unknown>) =>
  api.put(`/api/admin/coupons/${id}`, data).then((r) => r.data as Coupon);

export const deleteCoupon = (id: string) =>
  api.delete(`/api/admin/coupons/${id}`).then((r) => r.data);

export const getCategories = () =>
  api.get('/api/categories').then((r) => r.data as Category[]);

export const getAdminOrder = (id: string) =>
  api.get(`/api/admin/orders/${id}`).then((r) => r.data as Order & { items: (OrderItem & { product: Product })[] });

export interface Customer {
  phone: string;
  name: string;
  email?: string | null;
  totalSpend: number;
  orderCount: number;
  lastOrder: string;
  firstOrder: string;
}

export const getAdminCustomers = (params?: Record<string, string>) =>
  api.get('/api/admin/customers', { params }).then((r) => r.data as { customers: Customer[]; total: number; page: number; totalPages: number });

export const getAdminCustomer = (phone: string) =>
  api.get(`/api/admin/customers/${phone}`).then((r) => r.data);

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  allOrdersInPeriod: number;
  avgOrderValue: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; _sum: { quantity: number | null } }[];
  revenueByPayment: { paymentMethod: string; _sum: { total: number | null }; _count: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  conversionFunnel: { cartItems: number; checkoutStarted: number; paid: number; abandonedCarts: number };
  customerAcquisition: { newCustomers: number; returningCustomers: number };
  abandonedCarts: number;
}

export const getAnalytics = (period = '30') =>
  api.get('/api/admin/analytics', { params: { period } }).then((r) => r.data as Analytics);

export const getAdminProduct = (id: string) =>
  api.get(`/api/admin/products/${id}`).then((r) => r.data as Product);
