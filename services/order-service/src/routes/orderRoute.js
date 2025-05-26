import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Doanh thu
Router.route('/revenue').get(orderController.getRevenue);

// Tạo đơn hàng
Router.route('/create').post(orderController.createOrder);

// Lấy đơn hàng theo ID
Router.route('/:id').get(
    authMiddleware.authenticateRequest,
    orderController.getOrderById,
);

// Hủy đơn hàng
Router.route('/cancel').post(
    authMiddleware.authenticateRequest,
    orderController.cancelOrder,
);

export default Router;
