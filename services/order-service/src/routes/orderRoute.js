import express from 'express';
import orderController from '../controllers/orderController.js';

const Router = express.Router();

// Doanh thu
Router.route('/revenue').get(orderController.getRevenue);

export default Router;
