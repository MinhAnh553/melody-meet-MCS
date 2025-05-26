import orderModel from '../models/orderModel.js';
import logger from '../utils/logger.js';
import { addOrderExpireJob } from '../providers/queueProvider.js';
import { publishEvent } from '../providers/rabbitmqProvider.js';

const getRevenue = async (req, res) => {
    try {
        let revenue;
        revenue = await orderModel.aggregate([
            {
                $match: { status: 'PAID' },
            },
            // Nhóm theo eventId và đếm số order của từng sự kiện
            {
                $group: {
                    _id: '$eventId',
                    totalRevenue: { $sum: '$totalPrice' }, // Tổng doanh thu
                },
            },

            // Kết nối với bảng events
            {
                $lookup: {
                    from: 'events',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'eventDetails',
                },
            },
            { $unwind: '$eventDetails' }, // Chuyển eventDetails từ mảng thành object

            // Chỉ lấy các sự kiện đã được duyệt
            { $match: { 'eventDetails.status': 'approved' } },
            {
                $lookup: {
                    from: 'tickettypes',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'ticketTypes',
                },
            },
            {
                $addFields: {
                    'eventDetails.ticketTypes': '$ticketTypes',
                    startTimeDiff: {
                        $abs: {
                            $subtract: ['$eventDetails.startTime', new Date()],
                        },
                    },
                },
            },
            // 🔽 Sắp xếp theo tổng doanh thu (giảm dần)
            //    Nếu doanh thu bằng nhau, ưu tiên startTime gần nhất với ngày hiện tại
            {
                $addFields: {
                    startTimeDiff: {
                        $abs: {
                            $subtract: ['$eventDetails.startTime', new Date()],
                        },
                    },
                },
            },
            { $sort: { totalRevenue: -1, startTimeDiff: 1 } },

            // Lấy tối đa 4 sự kiện hot nhất
            { $limit: 4 },
        ]);

        revenue = revenue.map((e) => e.eventDetails);

        logger.info(`Revenue of events`);
        res.status(200).json({
            success: true,
            revenue,
            message: 'Doanh thu của sự kiện đã được lấy thành công',
        });
    } catch (error) {
        logger.error('Get revenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

const createOrder = async (req, res) => {
    logger.info('Create order');
    try {
        const { userId, eventId, tickets, totalPrice, buyerInfo } = req.body;
        const orderId = `${
            Number(await orderModel.countDocuments()) + 1
        }${Number(String(Date.now()).slice(-6))}`;
        const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

        const newOrder = new orderModel({
            userId,
            buyerInfo,
            eventId,
            orderId,
            totalPrice,
            tickets,
            status: 'PENDING',
            expiredAt,
        });
        await newOrder.save();
        logger.info(`Order created: ${newOrder._id}`);

        // Thêm job hết hạn đơn hàng
        await addOrderExpireJob(newOrder._id, tickets);

        return res.status(200).json({
            success: true,
            orderId: newOrder._id,
            message:
                'Tạo đơn hàng thành công! Vui lòng thanh toán trong 15 phút!',
        });
    } catch (error) {
        logger.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

const getOrderById = async (req, res) => {
    logger.info('Get order by ID');
    try {
        const { id } = req.params;
        const order = await orderModel.findById(id).populate('eventId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        return res.status(200).json({
            success: true,
            order,
            message: 'Lấy đơn hàng thành công',
        });
    } catch (error) {
        logger.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Hủy đơn hàng
const cancelOrder = async (req, res) => {
    logger.info('Cancel order');
    try {
        const { orderId } = req.body;
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hủy đơn hàng đang chờ thanh toán',
            });
        }

        order.status = 'CANCELED';
        await order.save();

        // Xóa job hết hạn đơn hàng nếu có
        await addOrderExpireJob(order._id, [], true); // true để xóa job
        logger.info(`Order canceled: ${order._id}`);

        // Publish event to release tickets back to inventory
        await publishEvent('order.expired', {
            orderId: order._id,
            tickets: order.tickets,
        });

        return res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được hủy thành công',
        });
    } catch (error) {
        logger.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

export default {
    getRevenue,
    createOrder,
    getOrderById,
    cancelOrder,
};
