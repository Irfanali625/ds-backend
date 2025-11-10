import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import phoneValidationRoutes from './routes/phoneValidationRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import { connectDB } from './database/db';
import { getFile } from './lib/minio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost";
const minIoBucket = process.env.MINIO_BUCKET ||'bucket'

app.use(cors());

// Webhook raw body parsers must come before json middleware
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/webhooks/square', express.raw({ type: 'application/json' }));

app.use((req, res, next) => {
  const rawPaths = ['/webhooks/stripe', '/webhooks/square'];
  if (rawPaths.some((path) => req.originalUrl.startsWith(path))) {
    return next();
  }
  return express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  const rawPaths = ['/webhooks/stripe', '/webhooks/square'];
  if (rawPaths.some((path) => req.originalUrl.startsWith(path))) {
    return next();
  }
  return express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

app.get(`/${minIoBucket}/*`, async (req, res) => {
  try {
    const objectName = (req.params as any)[0];
    const fileStream = await getFile(objectName);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${objectName}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    fileStream.pipe(res);
  } catch (err) {
    console.error("Error sending file:", err);
    res.status(404).json({ message: "File not found" });
  }
});

app.use("/uploads", express.static("public/uploads"));

app.use('/api/auth', authRoutes);
app.use('/api/phone-validation', phoneValidationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Data Scraping API is running' });
});

async function startServer() {
  try {
    await connectDB();
  
    app.listen(PORT, () => {
      console.log(`Server is running on ${BACKEND_URL}:${PORT}`);
      console.log(`Health check: ${BACKEND_URL}:${PORT}/health`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error);
    if (error.message?.includes('Authentication')) {
      console.error('\nPlease fix your MongoDB credentials in the .env file and try again.');
    }
    process.exit(1);
  }
}

startServer();
