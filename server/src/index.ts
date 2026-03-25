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
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
