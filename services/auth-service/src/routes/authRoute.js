import express from 'express';
import authController from '../controllers/authController.js';

const Router = express.Router();

// Registration flow
Router.route('/register/send-code').post(authController.sendVerificationCode);
Router.route('/register/verify').post(authController.verifyAndRegister);

export default Router;
