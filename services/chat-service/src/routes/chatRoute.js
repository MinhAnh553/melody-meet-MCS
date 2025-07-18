import express from 'express';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.route('/').post(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    chatController.createChat,
);

export default Router;
