import express from 'express';
import {
    login,
    logout,
    register,
    refreshToken,
} from '../controllers/authController.js';
import {
    validateRequest,
    loginSchema,
    registerSchema,
    refreshTokenSchema,
} from '../utils/validation.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post(
    '/refresh-token',
    validateRequest(refreshTokenSchema),
    refreshToken,
);

// Protected routes
router.post('/logout', authenticateToken, logout);

export default router;
