import { Router } from 'express';
import { PhoneValidationController } from '../controllers/phoneValidationController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
const phoneValidationController = new PhoneValidationController();

// All routes require authentication
router.post('/single', authenticateToken, (req, res) => 
  phoneValidationController.validateSingle(req as any, res)
);

router.post('/bulk', authenticateToken, (req, res) => 
  phoneValidationController.validateBulk(req as any, res)
);

router.post('/csv', authenticateToken, upload.single('csvFile'), (req, res) => 
  phoneValidationController.validateCSV(req as any, res)
);

router.get('/history', authenticateToken, (req, res) => 
  phoneValidationController.getHistory(req as any, res)
);

export default router;

