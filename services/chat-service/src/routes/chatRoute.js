import express from 'express';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.route('/')
    .post(chatController.createChat)
    .get(chatController.getChatHistory);

export default Router;
