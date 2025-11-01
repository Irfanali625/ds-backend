import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (for CSV files)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept CSV files
  if (file.mimetype === 'text/csv' || 
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

