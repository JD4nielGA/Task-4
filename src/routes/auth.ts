import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAdmin } from '../middlewares/Auth';
import passport from 'passport';

const router = Router();
const authController = new AuthController();

// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// Registration routes (admin only)
router.get('/register', requireAdmin, authController.showRegister);
router.post('/register', requireAdmin, authController.register);

// API route to check username availability
router.post('/api/check-username', async (req: any, res: any) => {
    try {
        const { username } = req.body;
        
        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        // Validar formato de usuario
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.json({ available: false, reason: 'Invalid format' });
        }
        
        const existingUser = await authController.findUserByUsername(username);
        const available = !existingUser;
        
        return res.json({ available });
        
    } catch (error) {
        console.error('Error checking username availability:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
    (req, res) => {
        // Successful authentication
        if (req.user) {
            req.session.userId = (req.user as any).id;
            req.session.username = (req.user as any).username;
            req.session.isAdmin = (req.user as any).username === 'admin';
        }
        authController.googleCallback(req, res);
    }
);

router.get('/google/failure', authController.googleFailure);

export default router;