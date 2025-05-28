import express from 'express';
import ticketController from '../controllers/ticketController.js';

const Router = express.Router();

Router.route('/create').post(ticketController.sendVerificationCode);

export default Router;
