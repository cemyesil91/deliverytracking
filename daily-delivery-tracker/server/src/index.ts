import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import productsRouter from './routes/products';
import sellersRouter from './routes/sellers';
import deliveriesRouter from './routes/deliveries';
import financialRouter from './routes/financial';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/products', productsRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/sellers', financialRouter);
app.use('/api/deliveries', deliveriesRouter);

// Global error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

export default app;
