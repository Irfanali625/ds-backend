import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const contactController = new ContactController();

router.get('/random', authenticateToken, (req, res) => contactController.getRandomContact(req, res));
router.post('/', authenticateToken, (req, res) => contactController.createContact(req, res));
router.get('/', authenticateToken, (req, res) => contactController.getContacts(req, res));
router.put('/:id/phase', authenticateToken, (req, res) => contactController.updatePhase(req, res));
router.post('/records', authenticateToken, (req, res) => contactController.storeRecord(req, res));
router.get('/records/my', authenticateToken, (req, res) => contactController.getUserRecords(req, res));
router.get('/my-leads', authenticateToken, (req, res) => contactController.getUserLeads(req, res));

export default router;
