import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/contactRoutes';
import authRoutes from './routes/authRoutes';
import phoneValidationRoutes from './routes/phoneValidationRoutes';
import { startPhaseScheduler } from './jobs/phaseScheduler';
import { seedB2CContacts } from './seeders/b2cSeeder';
import { connectDB } from './database/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 800;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/phone-validation', phoneValidationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Data Scraping API is running' });
});

// Initialize server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    // Seed dummy B2C data (non-blocking - continue even if seeding fails)
    seedB2CContacts().catch((error) => {
      console.error('Warning: Failed to seed B2C contacts:', error.message);
      console.error('Server will continue to start, but no dummy data will be available.');
    });

    // Start background jobs
    startPhaseScheduler();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
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
