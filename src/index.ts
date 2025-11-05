import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import phoneValidationRoutes from './routes/phoneValidationRoutes';
import { connectDB } from './database/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost";

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/uploads", express.static("public/uploads"));

app.use('/api/auth', authRoutes);
app.use('/api/phone-validation', phoneValidationRoutes);

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
