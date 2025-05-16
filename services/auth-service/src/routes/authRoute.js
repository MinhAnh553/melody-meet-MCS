import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const Router = express.Router();

// Auth routes
Router.route('/register/send-code').post(authController.sendVerificationCode);
Router.route('/register/verify').post(authController.verifyAndRegister);
Router.route('/login').post(authController.login);
Router.route('/refresh-token').post(authController.refreshToken);
Router.route('/logout').post(authenticateToken, authController.logout);
Router.route('/account').get(authenticateToken, authController.getAccount);

export default Router;
