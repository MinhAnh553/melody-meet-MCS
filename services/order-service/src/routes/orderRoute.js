import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Doanh thu
Router.route('/revenue').get(orderController.getRevenue);

// Doanh thu sự kiện
Router.route('/revenue/:eventId').get(orderController.getRevenueByEventId);

// Tạo đơn hàng
Router.route('/create').post(orderController.createOrder);

// Webhook
Router.route('/webhook').post(orderController.webhookHandler);

// Lấy danh sách đơn hàng của user
Router.route('/my').get(
    authMiddleware.authenticateRequest,
    orderController.getMyOrders,
);

// Get dashboard
Router.route('/dashboard').get(
    authMiddleware.authenticateRequest,
    orderController.getDashboard,
);

// Lấy đơn hàng theo ID
Router.route('/:id').get(
    authMiddleware.authenticateRequest,
    orderController.getOrderById,
);

// Lấy đơn hàng theo orderCode
Router.route('/order-code/:orderCode').get(
    authMiddleware.authenticateRequest,
    orderController.getOrderByOrderCode,
);

// Check status
Router.route('/:id/check-status').get(orderController.checkStatusOrder);

// Hủy đơn hàng
Router.route('/cancel').post(
    authMiddleware.authenticateRequest,
    orderController.cancelOrder,
);

// Phương thức thanh toán
Router.route('/:id/select-payment').get(
    authMiddleware.authenticateRequest,
    orderController.selectPaymentMethod,
);

// Get orders by event ID
Router.route('/event/:eventId').get(orderController.getOrdersByEventId);

export default Router;
