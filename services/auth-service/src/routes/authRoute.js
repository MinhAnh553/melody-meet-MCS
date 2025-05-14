import express from 'express';
import authController from '../controllers/authController.js';

const Router = express.Router();

// Registration flow
Router.route('/register/send-code').post(authController.sendVerificationCode);
Router.route('/register/verify').post(authController.verifyAndRegister);

// Login flow
Router.route('/login').post(authController.login);

// Refresh token
Router.route('/refresh-token').post(authController.refreshTokenUser);

// Logout
Router.route('/logout').post(authController.logout);

export default Router;
