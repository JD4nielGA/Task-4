import { Router } from 'express';
import { ProtectedController } from '../controllers/ProtectedController';
import { requireAdmin } from '../middlewares/Auth';

const router = Router();
const protectedController = new ProtectedController();

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard', protectedController.showDashboard);
router.get('/contacts', protectedController.showContacts);
router.get('/payments', protectedController.showPayments);

// API routes for data retrieval
router.get('/api/contacts', protectedController.getContacts);
router.get('/api/payments', protectedController.getPayments);
router.get('/api/contacts/search', protectedController.searchContacts);
router.get('/api/payments/search', protectedController.searchPayments);

export default router;