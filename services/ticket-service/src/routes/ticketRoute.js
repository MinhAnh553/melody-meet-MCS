import express from 'express';
import ticketController from '../controllers/ticketController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const Router = express.Router();

Router.route('/bulk').post(
    authMiddleware.isValidPermission(['client', 'admin']),
    ticketController.createBulkTicket,
);

export default Router;
