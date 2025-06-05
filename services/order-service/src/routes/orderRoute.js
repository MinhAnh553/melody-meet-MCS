import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Doanh thu
Router.route('/revenue').get(orderController.getRevenue);

// Doanh thu sự kiện
Router.route('/revenue/:eventId').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    orderController.getRevenueByEventId,
);

// Tạo đơn hàng
Router.route('/create').post(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    orderController.createOrder,
);

// Webhook
Router.route('/webhook').post(orderController.webhookHandler);

// Lấy danh sách đơn hàng của user
Router.route('/my').get(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    orderController.getMyOrders,
);

// Get dashboard
Router.route('/dashboard').get(
    authMiddleware.isValidPermission(['admin']),
    orderController.getDashboard,
);

// Lấy danh sách đơn hàng của admin
Router.route('/admin/all-orders').get(
    authMiddleware.isValidPermission(['admin']),
    orderController.getAllOrders,
);

Router.route('/admin/update/:id/status').patch(
    authMiddleware.isValidPermission(['admin']),
    orderController.updateStatusOrder,
);

// Lấy đơn hàng theo ID
Router.route('/:id').get(
    authMiddleware.isValidPermission(['client', 'admin']),
    orderController.getOrderById,
);

// Lấy đơn hàng theo orderCode
Router.route('/order-code/:orderCode').get(
    authMiddleware.isValidPermission(['client', 'admin']),
    orderController.getOrderByOrderCode,
);

// Check status
Router.route('/:id/check-status').get(
    authMiddleware.isValidPermission(['client', 'admin']),
    orderController.checkStatusOrder,
);

// Hủy đơn hàng
Router.route('/cancel').post(
    authMiddleware.isValidPermission(['client', 'admin']),
    orderController.cancelOrder,
);

// Phương thức thanh toán
Router.route('/:id/select-payment').get(
    authMiddleware.isValidPermission(['client', 'admin']),
    orderController.selectPaymentMethod,
);

// Get orders by event ID
Router.route('/event/:eventId').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    orderController.getOrdersByEventId,
);

export default Router;
