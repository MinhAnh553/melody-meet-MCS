import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const Router = express.Router();

// Auth routes
Router.route('/register/send-code').post(authController.sendVerificationCode);
Router.route('/register/verify').post(authController.verifyAndRegister);
Router.route('/login').post(authController.login);
Router.route('/refresh_token').put(authController.refreshToken);

// Validate token routes
Router.route('/account').get(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    authController.getAccount,
);

Router.route('/user/update-address').patch(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    authController.updateUserAddress,
);

Router.route('/organizers/update').patch(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    authController.updateOrganizer,
);

Router.route('/users/total').get(
    authMiddleware.isValidPermission(['admin']),
    authController.getTotalUsers,
);

Router.route('/users/admin/all-users').get(
    authMiddleware.isValidPermission(['admin']),
    authController.getAllUsers,
);

Router.route('/users/update/:id').patch(
    authMiddleware.isValidPermission(['admin']),
    authController.updateUser,
);

// Get user by ID (for external services)
Router.route('/users/:id').get(authController.getUserById);

export default Router;
