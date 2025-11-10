import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const subscriptionController = new SubscriptionController();

// All routes require authentication
router.get('/status', authenticateToken, (req, res) => 
  subscriptionController.getStatus(req as any, res)
);

router.post('/checkout', authenticateToken, (req, res) =>
  subscriptionController.createCheckout(req as any, res)
);

router.post('/create', authenticateToken, (req, res) => 
  subscriptionController.createSubscription(req as any, res)
);

router.get('/history', authenticateToken, (req, res) => 
  subscriptionController.getHistory(req as any, res)
);

export default router;

