import { Router } from 'express';
import { PaymentsController } from '../controllers/PaymentsController';
import { requireAuth } from '../middlewares/Auth';

const router = Router();
const paymentsController = new PaymentsController();

/* GET payments listing - Protected route */
router.get('/', requireAuth, paymentsController.index.bind(paymentsController));

/* POST payment processing - Public route for payment submissions */
router.post('/', paymentsController.store.bind(paymentsController));

export default router;