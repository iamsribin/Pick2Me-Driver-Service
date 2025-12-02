import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from '@/routes/authRoutes';
import { driverRouter } from '@/routes/driverRoutes';
import { adminRouter } from '@/routes/adminRoutes';
import { errorHandler } from '@Pick2Me/shared/errors';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', authRouter);
app.use('/', driverRouter);
app.use('/admin', adminRouter);

app.use(errorHandler);

export default app;
