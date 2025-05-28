import express from 'express';
import ticketController from '../controllers/ticketController.js';

const Router = express.Router();

Router.route('/bulk').post(ticketController.createBulkTicket);

export default Router;
