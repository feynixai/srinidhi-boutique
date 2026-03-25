import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { couponRoutes } from './routes/coupons';
import { adminRoutes } from './routes/admin';
import { reviewRoutes } from './routes/reviews';
import { pincodeRoutes } from './routes/pincode';
import { paymentRoutes } from './routes/payments';
import { newsletterRoutes } from './routes/newsletter';
import { contactRoutes } from './routes/contact';
import { returnRoutes } from './routes/returns';
import { authRoutes } from './routes/auth';
import { shippingRoutes } from './routes/shipping';
import { userRoutes } from './routes/users';
import { notificationRoutes } from './routes/notifications';
import { inventoryRoutes } from './routes/inventory';
import { loyaltyRoutes } from './routes/loyalty';
import { referralRoutes } from './routes/referrals';
import { searchRoutes } from './routes/search';
import { flashSaleRoutes } from './routes/flashsales';
import { lookbookRoutes } from './routes/lookbook';
import { chatRoutes } from './routes/chat';
import { variantRoutes } from './routes/variants';
import { collectionRoutes } from './routes/collections';
import { qaRoutes } from './routes/qa';
import { userNotificationRoutes } from './routes/userNotifications';
import { reportRoutes } from './routes/reports';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv } from './lib/validateEnv';
import { prisma } from './lib/prisma';

dotenv.config();

if (process.env.NODE_ENV !== 'test') validateEnv();

const app = express();

app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/lookbook', lookbookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/user-notifications', userNotificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      env: process.env.NODE_ENV || 'development',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  function shutdown(signal: string) {
    console.log(`\n[shutdown] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[shutdown] Done.');
      process.exit(0);
    });
    // Force shutdown after 10s
    setTimeout(() => {
      console.error('[shutdown] Forcing exit after timeout.');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export { app };
