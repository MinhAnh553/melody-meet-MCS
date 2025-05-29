import orderModel from '../models/orderModel.js';
import logger from '../utils/logger.js';
import {
    addOrderExpireJob,
    deleteOrderExpireJob,
} from '../providers/queueProvider.js';
import { publishEvent } from '../providers/rabbitmqProvider.js';
import payosProvider from '../providers/payosProvider.js';
import axios from 'axios';

async function invalidateEventCacheById(req, eventId) {
    await req.redisClient.del(`event:${eventId}`);
    logger.info('Invalidate event cache');
}

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
        const orderCode = `${
            Number(await orderModel.countDocuments()) + 1
        }${Number(String(Date.now()).slice(-6))}`;
        const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

        const newOrder = new orderModel({
            userId,
            buyerInfo,
            eventId,
            orderCode,
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
            orderCode: newOrder.orderCode,
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

const getOrderByOrderCode = async (req, res) => {
    logger.info('Get order by order code');
    try {
        const { orderCode } = req.params;
        const order = await orderModel.findOne({ orderCode });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }
        return res.status(200).json({
            success: true,
            order,
            message: 'Lấy đơn hàng thành công',
        });
    } catch (error) {
        logger.error('Get order by order code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

const checkStatusOrder = async (req, res) => {
    logger.info('Get order by order code');
    try {
        const { id } = req.params;
        const order = await orderModel.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }
        return res.status(200).json({
            success: true,
            status: order.status,
            message: 'Lấy trạng thái đơn hàng thành công!',
        });
    } catch (error) {
        logger.error('Get order by order code error:', error);
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

        // Xóa job hết hạn đơn hàng
        await deleteOrderExpireJob(order._id);
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

// Phương thức thanh toán
const selectPaymentMethod = async (req, res) => {
    logger.info('Select payment method');
    try {
        const { id: orderId } = req.params;
        const { method } = req.query;

        if (!orderId || !method) {
            return res.status(400).json({
                success: false,
                message: 'Order ID và phương thức thanh toán là bắt buộc',
            });
        }

        // Hiện tại chỉ có payos
        if (method !== 'payos') {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ',
            });
        }

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại!',
            });
        }

        // Chỉ cho phép chọn phương thức thanh toán nếu đơn hàng đang chờ thanh toán
        if (order.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được xử lý hoặc hủy bỏ',
            });
        }

        const paymentUrl = await payosProvider.createPayOSOrder(
            order.buyerInfo,
            order,
            order.tickets,
        );

        return res.status(200).json({
            success: true,
            payUrl: paymentUrl,
            message: 'Phương thức thanh toán đã được chọn thành công',
        });
    } catch (error) {
        logger.error('Select payment method error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Webhook handler for PayOS
const webhookHandler = async (req, res) => {
    logger.info('Webhook handler');
    try {
        const { data, code, desc } = req.body;

        // Kiểm tra signature
        const isValidSignature = payosProvider.verifyWebhookSignature(
            req.body,
            process.env.PAYOS_CHECKSUM_KEY,
        );

        if (!isValidSignature) {
            logger.error('Invalid webhook signature');
            return res.status(400).json({
                success: false,
                message: 'Signature không hợp lệ',
            });
        }

        // Kiểm tra code - PayOS trả về '00' cho thành công
        if (code !== '00') {
            logger.error('Webhook error:', desc);
            return res.status(400).json({
                success: false,
                message: desc,
            });
        }

        const { orderCode } = data;

        // Tìm đơn hàng theo orderCode
        const order = await orderModel.findOne({
            orderCode,
            status: 'PENDING',
        });
        if (!order) {
            logger.error('Order not found:', orderCode);
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // Nếu webhook có success true => thanh toán thành công
        if (req.body.success === true) {
            order.status = 'PAID';
            // Tạo vé cho người dùng
            await createTicketsForOrder(order);
            // Xóa job hết hạn đơn hàng
            await deleteOrderExpireJob(order._id);
            // Xóa cache event đó
            await invalidateEventCacheById(req, order.eventId);
        } else {
            order.status = 'CANCELED';
            // Xóa job hết hạn đơn hàng
            await deleteOrderExpireJob(order._id);
        }

        await order.save();
        logger.info(`Order ${orderCode} updated to ${order.status}`);

        return res.status(200).json({
            success: true,
            message: 'Webhook xử lý thành công',
        });
    } catch (error) {
        logger.error('Webhook handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Hàm tạo vé cho đơn hàng
const createTicketsForOrder = async (order) => {
    try {
        const tickets = [];
        let typeIndex = 1;
        for (const ticket of order.tickets) {
            for (let i = 0; i < ticket.quantity; i++) {
                const ticketCode = `${order.orderCode}${typeIndex}${i + 1}`;
                tickets.push({
                    ticketCode,
                    userId: order.userId,
                    eventId: order.eventId,
                    orderId: order._id,
                    ticketTypeId: ticket.ticketId,
                    used: false,
                    usedAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            typeIndex++;
        }

        // Gọi API tạo vé
        const response = await axios.post(
            `${process.env.TICKET_SERVICE_URL}/api/tickets/bulk`,
            { tickets },
        );

        if (!response.data.success) {
            throw new Error('Failed to create tickets');
        }

        logger.info(
            `Created ${tickets.length} tickets for order ${order.orderCode}`,
        );
    } catch (error) {
        logger.error('Create tickets error:', error);
        throw error;
    }
};

const getMyOrders = async (req, res) => {
    logger.info('Get my orders');
    try {
        const { userId } = req.user;
        const orders = await orderModel
            .find({ userId, status: 'PAID' })
            .sort({ createdAt: -1 });

        // Lấy thông tin sự kiện cho mỗi đơn hàng
        const ordersWithEventInfo = await Promise.all(
            orders.map(async (order) => {
                try {
                    const eventResponse = await axios.get(
                        `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
                    );
                    if (eventResponse.data.success) {
                        return {
                            ...order.toObject(),
                            eventName: eventResponse.data.data.name,
                            startTime: eventResponse.data.data.startTime,
                            endTime: eventResponse.data.data.endTime,
                            location: eventResponse.data.data.location,
                            background: eventResponse.data.data.background,
                        };
                    }
                    return order;
                } catch (error) {
                    logger.error(
                        `Error fetching event info for order ${order._id}:`,
                        error,
                    );
                    return order;
                }
            }),
        );

        return res.status(200).json({
            success: true,
            orders: ordersWithEventInfo,
            message: 'Lấy danh sách đơn hàng thành công',
        });
    } catch (error) {
        logger.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /orders/event/:eventId
const getOrdersByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;
        const orders = await orderModel
            .find({
                eventId,
                status: 'PAID', // Chỉ lấy đơn hàng đã thanh toán
            })
            .populate({
                path: 'tickets.ticketId',
                select: 'name price quantity quantitySold',
            })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            orders,
        });
    } catch (error) {
        logger.error('Error in getOrdersByEventId:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export default {
    getRevenue,
    createOrder,
    getOrderById,
    checkStatusOrder,
    getOrderByOrderCode,
    cancelOrder,
    selectPaymentMethod,
    webhookHandler,
    getMyOrders,
    getOrdersByEventId,
};
