import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Doanh thu
Router.route('/revenue').get(orderController.getRevenue);

// Tạo đơn hàng
Router.route('/create').post(orderController.createOrder);

export default Router;
