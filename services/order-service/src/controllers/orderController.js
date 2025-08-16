import orderModel from '../models/orderModel.js';
import logger from '../utils/logger.js';
import {
    addOrderExpireJob,
    deleteOrderExpireJob,
} from '../providers/queueProvider.js';
import { publishEvent } from '../providers/rabbitmqProvider.js';
import paymentProvider from '../providers/paymentProvider.js';
import axios from 'axios';
import cron from 'node-cron';

async function invalidateEventCacheById(req, eventId) {
    await req.redisClient.del(`event:${eventId}`);
    logger.info('Invalidate event cache');
}

async function invalidateEventCache(req) {
    const keys = await req.redisClient.keys('events:*');
    if (keys.length > 0) {
        await req.redisClient.del(keys);
        logger.info('Invalidate event cache');
    }
}

async function invalidateOrderCache(req) {
    const keys = await req.redisClient.keys('orders:*');
    if (keys.length > 0) {
        await req.redisClient.del(keys);
        logger.info('Invalidate event cache');
    }
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
            message: 'Internal Server Error',
        });
    }
};

// Doanh thu sự kiện
const getRevenueByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        const orders = await orderModel.find({ eventId, status: 'PAID' });

        if (!orders) {
            return res.status(200).json({ success: true, totalRevenue: 0 });
        }
        const totalRevenue = orders.reduce(
            (acc, order) => acc + order.totalPrice,
            0,
        );
        return res.status(200).json({ success: true, totalRevenue });
    } catch (error) {
        logger.error('Get revenue by event ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
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

        // Hủy đơn hàng cũ nếu đã có đơn hàng với cùng userId và eventId
        const oldOrder = await orderModel.findOne({
            userId,
            eventId,
            status: 'PENDING',
        });
        if (oldOrder) {
            await deleteOrderExpireJob(oldOrder._id);
            logger.info(`Order canceled: ${oldOrder._id}`);
            oldOrder.status = 'CANCELED';
            await oldOrder.save();
            await publishEvent('order.expired', {
                orderId: oldOrder._id,
                tickets: oldOrder.tickets,
            });
        }

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

        // Xóa cache
        invalidateOrderCache(req);

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
            message: 'Internal Server Error',
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
            message: 'Internal Server Error',
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
            message: 'Internal Server Error',
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
            message: 'Internal Server Error',
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

        invalidateOrderCache(req);

        return res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được hủy thành công',
        });
    } catch (error) {
        logger.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
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

        if (method !== 'payos' && method !== 'zalopay' && method !== 'vnpay') {
            return res.status(200).json({
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
            return res.status(200).json({
                success: false,
                message: 'Đơn hàng đã được xử lý hoặc hủy bỏ',
            });
        }

        let redirectUrl = '',
            transactionId = '',
            paymentPayosLinkResponse = '',
            qrCode = '';
        if (method === 'payos') {
            ({ transactionId, paymentPayosLinkResponse } =
                await paymentProvider.createPayOSOrder(order));
        } else if (method === 'vnpay') {
            ({ redirectUrl, transactionId } =
                await paymentProvider.createVNPayOrder(order, req));
        } else if (method === 'zalopay') {
            ({ redirectUrl, transactionId } =
                await paymentProvider.createZaloPayOrder(order));
        } else {
            return res
                .status(200)
                .json({ success: false, message: 'Unsupported method' });
        }

        order.payment.method = method.toUpperCase();
        order.payment.attempts.push({
            method: method.toUpperCase(),
            transactionId,
            redirectUrl,
        });

        await order.save();

        return res.status(200).json({
            success: true,
            payUrl: redirectUrl,
            paymentPayosLinkResponse,
            message: 'Phương thức thanh toán đã được chọn thành công',
        });
    } catch (error) {
        logger.error('Select payment method error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Webhook handler for PayOS
const payosWebhookHandler = async (req, res) => {
    logger.info('Webhook handler');
    try {
        const { data, code, desc, success } = req.body;

        // Kiểm tra signature
        const isValidSignature = paymentProvider.verifyWebhookSignature(
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
            'payment.attempts.transactionId': orderCode,
            status: 'PENDING',
        });
        if (!order) {
            logger.error('Order not found:', orderCode);
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        if (success === true) {
            order.status = 'PAID';
            // ✅ Tìm và cập nhật attempt tương ứng (nếu có)
            const attempt = order.payment.attempts.find(
                (a) => a.transactionId.toString() === orderCode.toString(),
            );
            if (attempt) attempt.status = 'PAID';

            // Tạo vé cho người dùng
            await createTicketsForOrder(order);
            // Xóa job hết hạn đơn hàng
            await deleteOrderExpireJob(order._id);
            // Xóa cache event đó
            await invalidateEventCacheById(req, order.eventId);
            await invalidateEventCache(req);

            // 🔔 Gửi mail chỉ khi thành công
            const event = await axios.get(
                `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
            );
            await publishEvent('notification.order.success', {
                email: order.buyerInfo.email,
                name: order.buyerInfo.name,
                event: event.data.data,
                order,
                tickets: order.tickets,
            });
        }

        invalidateOrderCache(req);

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
            message: 'Internal Server Error',
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
            {
                headers: {
                    'x-user-id': order.userId,
                    'x-user-role': 'client',
                },
            },
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
        const userId = req.user?._id;
        const orders = await orderModel
            .find({ userId, status: 'PAID' })
            .sort({ createdAt: -1 });

        // Lấy thông tin sự kiện cho mỗi đơn hàng
        const ordersWithEventInfo = await Promise.all(
            orders.map(async (order) => {
                try {
                    const eventResponse = await axios.get(
                        `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
                        {
                            headers: {
                                'x-user-id': req.user?._id,
                                'x-user-role': req.user?.role,
                            },
                        },
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
            message: 'Internal Server Error',
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

// [GET] /orders/top-organizers
const getTopOrganizers = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // day, week, month, year
        const now = new Date();
        let startDate, endDate;

        // Calculate date range based on period
        switch (period) {
            case 'day':
                startDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                );
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - daysToSubtract,
                );
                endDate = new Date(
                    startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
                );
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

        // Lấy danh sách đơn hàng đã PAID trong khoảng thời gian
        const topOrganizers = await orderModel.aggregate([
            {
                $match: {
                    status: 'PAID',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            // Kết nối với bảng events để lấy thông tin ban tổ chức
            {
                $lookup: {
                    from: 'events',
                    localField: 'eventId',
                    foreignField: '_id',
                    as: 'eventDetails',
                },
            },
            { $unwind: '$eventDetails' },
            // Chỉ lấy các sự kiện có status được duyệt hoặc đã kết thúc
            {
                $match: {
                    'eventDetails.status': { $in: ['approved', 'event_over'] },
                },
            },
            // Nhóm theo ban tổ chức (createdBy)
            {
                $group: {
                    _id: '$eventDetails.createdBy',
                    totalRevenue: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                    eventCount: { $addToSet: '$eventDetails._id' },
                },
            },
            // Tính số lượng sự kiện unique
            {
                $addFields: {
                    eventCount: { $size: '$eventCount' },
                },
            },
            // Kết nối với bảng users để lấy thông tin ban tổ chức
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'organizerInfo',
                },
            },
            { $unwind: '$organizerInfo' },
            // Chỉ lấy các ban tổ chức (role = organizer)
            { $match: { 'organizerInfo.role': 'organizer' } },
            // Sắp xếp theo doanh thu giảm dần
            { $sort: { totalRevenue: -1 } },
            // Lấy top 10
            { $limit: 10 },
            // Format dữ liệu trả về
            {
                $project: {
                    _id: 1,
                    organizerName: '$organizerInfo.organizer.name',
                    organizerEmail: '$organizerInfo.email',
                    organizerLogo: '$organizerInfo.organizer.logo',
                    totalRevenue: 1,
                    totalOrders: 1,
                    eventCount: 1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                period,
                topOrganizers,
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
            },
        });
    } catch (error) {
        logger.error('Error in getTopOrganizers:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [GET] /orders/dashboard
const getDashboard = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // day, week, month, year
        const now = new Date();
        let startDate, endDate, groupFormat, dateFormat;

        // Calculate date range based on period
        switch (period) {
            case 'day':
                startDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                );
                groupFormat = {
                    $dateToString: {
                        format: '%Y-%m-%d %H:00',
                        date: '$createdAt',
                    },
                };
                dateFormat = '%Y-%m-%d %H:00';
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - daysToSubtract,
                );
                endDate = new Date(
                    startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
                );
                groupFormat = {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                };
                dateFormat = '%Y-%m-%d';
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                groupFormat = {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                };
                dateFormat = '%Y-%m-%d';
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                groupFormat = {
                    $dateToString: { format: '%Y-%m', date: '$createdAt' },
                };
                dateFormat = '%Y-%m';
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                groupFormat = {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                };
                dateFormat = '%Y-%m-%d';
        }

        // Get total statistics
        const totalStats = await orderModel.aggregate([
            { $match: { status: 'PAID' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                },
            },
        ]);

        // Get period-specific statistics
        const periodStats = await orderModel.aggregate([
            {
                $match: {
                    status: 'PAID',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    periodRevenue: { $sum: '$totalPrice' },
                    periodOrders: { $sum: 1 },
                },
            },
        ]);

        // Get revenue by time period
        const revenueByPeriod = await orderModel.aggregate([
            {
                $match: {
                    status: 'PAID',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: groupFormat,
                    revenue: { $sum: '$totalPrice' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Generate complete date range for the period
        const dateRange = [];
        const currentDate = new Date(startDate);

        while (currentDate < endDate) {
            let formattedDate;
            if (period === 'day') {
                // Format: "YYYY-MM-DD HH:00"
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(
                    2,
                    '0',
                );
                const day = String(currentDate.getDate()).padStart(2, '0');
                const hour = String(currentDate.getHours()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day} ${hour}:00`;
                currentDate.setHours(currentDate.getHours() + 1);
            } else if (period === 'week' || period === 'month') {
                // Format: "YYYY-MM-DD"
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(
                    2,
                    '0',
                );
                const day = String(currentDate.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (period === 'year') {
                // Format: "YYYY-MM"
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(
                    2,
                    '0',
                );
                formattedDate = `${year}-${month}`;
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            dateRange.push(formattedDate);
        }

        // Fill in missing dates with zero revenue
        const completeRevenueData = dateRange.map((date) => {
            const existingData = revenueByPeriod.find(
                (item) => item._id === date,
            );
            return {
                date,
                revenue: existingData ? existingData.revenue : 0,
                orders: existingData ? existingData.orders : 0,
            };
        });

        // Get user statistics
        const totalUsers = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/users/total`,
            {
                headers: {
                    'x-user-id': req.user?._id,
                    'x-user-role': req.user?.role,
                },
            },
        );

        // Get event statistics
        const totalEvents = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/admin/total-events`,
            {
                headers: {
                    'x-user-id': req.user?._id,
                    'x-user-role': req.user?.role,
                },
            },
        );

        // Get period-specific user statistics
        let usersByPeriodData = {
            data: { periodUsers: 0, usersGrowth: 0, usersByPeriod: [] },
        };
        try {
            const usersByPeriod = await axios.get(
                `${process.env.AUTH_SERVICE_URL}/api/auth/users/period?period=${period}`,
                {
                    headers: {
                        'x-user-id': req.user?._id,
                        'x-user-role': req.user?.role,
                    },
                },
            );
            usersByPeriodData = usersByPeriod;
        } catch (error) {
            logger.error('Error fetching users by period:', error.message);
        }

        // Get period-specific event statistics
        let eventsByPeriodData = {
            data: { periodEvents: 0, eventsGrowth: 0, eventsByPeriod: [] },
        };
        try {
            const eventsByPeriod = await axios.get(
                `${process.env.EVENT_SERVICE_URL}/api/events/admin/period?period=${period}`,
                {
                    headers: {
                        'x-user-id': req.user?._id,
                        'x-user-role': req.user?.role,
                    },
                },
            );
            eventsByPeriodData = eventsByPeriod;
        } catch (error) {
            logger.error('Error fetching events by period:', error.message);
        }

        // Calculate additional statistics
        const totalRevenue =
            totalStats.length > 0 ? totalStats[0].totalRevenue : 0;
        const totalOrders =
            totalStats.length > 0 ? totalStats[0].totalOrders : 0;
        const periodRevenue =
            periodStats.length > 0 ? periodStats[0].periodRevenue : 0;
        const periodOrders =
            periodStats.length > 0 ? periodStats[0].periodOrders : 0;

        // Calculate growth percentages (comparing with previous period)
        const previousStartDate = new Date(
            startDate.getTime() - (endDate.getTime() - startDate.getTime()),
        );
        const previousPeriodStats = await orderModel.aggregate([
            {
                $match: {
                    status: 'PAID',
                    createdAt: { $gte: previousStartDate, $lt: startDate },
                },
            },
            {
                $group: {
                    _id: null,
                    previousRevenue: { $sum: '$totalPrice' },
                    previousOrders: { $sum: 1 },
                },
            },
        ]);

        const previousRevenue =
            previousPeriodStats.length > 0
                ? previousPeriodStats[0].previousRevenue
                : 0;
        const previousOrders =
            previousPeriodStats.length > 0
                ? previousPeriodStats[0].previousOrders
                : 0;

        const revenueGrowth =
            previousRevenue > 0
                ? ((periodRevenue - previousRevenue) / previousRevenue) * 100
                : 0;
        const ordersGrowth =
            previousOrders > 0
                ? ((periodOrders - previousOrders) / previousOrders) * 100
                : 0;

        return res.status(200).json({
            success: true,
            data: {
                period,
                totalRevenue,
                totalUsers: totalUsers.data.totalUsers,
                totalEvents: totalEvents.data.totalEvents,
                totalOrders,
                periodRevenue,
                periodOrders,
                revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                ordersGrowth: Math.round(ordersGrowth * 100) / 100,
                revenueByPeriod: completeRevenueData,
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
                // Add period-specific user and event statistics
                periodUsers: usersByPeriodData.data?.data?.periodUsers || 0,
                usersGrowth: usersByPeriodData.data?.data?.usersGrowth || 0,
                usersByPeriod:
                    usersByPeriodData.data?.data?.usersByPeriod || [],
                periodEvents: eventsByPeriodData.data?.data?.periodEvents || 0,
                eventsGrowth: eventsByPeriodData.data?.data?.eventsGrowth || 0,
                eventsByPeriod:
                    eventsByPeriodData.data?.data?.eventsByPeriod || [],
            },
        });
    } catch (error) {
        logger.error('Error in getDashboard:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Lấy danh sách đơn hàng của admin
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const status = req.query.status;
        const searchKey = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        const cacheKey = `orders:admin:${page}:${limit}:${status}:${searchKey}:${sortBy}:${sortOrder}`;
        const cachedOrders = await req.redisClient.get(cacheKey);

        if (cachedOrders) {
            logger.info('Get all orders from cache');
            return res.status(200).json(JSON.parse(cachedOrders));
        }

        // If searchKey is present, first try to find matching events
        let matchingEventIds = [];
        if (searchKey) {
            try {
                const eventResponse = await axios.get(
                    `${process.env.EVENT_SERVICE_URL}/api/events/search`,
                    {
                        headers: {
                            'x-user-id': req.user?._id,
                            'x-user-role': req.user?.role,
                        },
                        params: {
                            query: searchKey,
                        },
                    },
                );

                // Extract event IDs from the search results
                matchingEventIds = eventResponse.data.events.map(
                    (event) => event._id,
                );
            } catch (eventSearchError) {
                logger.warn('Error searching events:', eventSearchError);
            }
        }

        // Build query
        const query = {};

        // Add status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Add search conditions
        if (searchKey) {
            query.$or = [
                { orderCode: { $regex: searchKey, $options: 'i' } },
                { 'buyerInfo.email': { $regex: searchKey, $options: 'i' } },
            ];

            // If we found matching event IDs, add them to the search
            if (matchingEventIds.length > 0) {
                query.$or.push({ eventId: { $in: matchingEventIds } });
            }
        }

        // Build sort
        const sort = {};
        switch (sortBy) {
            case 'orderCode':
                sort.orderCode = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'totalPrice':
                sort.totalPrice = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'createdAt':
            default:
                sort.createdAt = sortOrder === 'asc' ? 1 : -1;
        }

        const [orders, totalNoOfOrders] = await Promise.all([
            orderModel.find(query).sort(sort).skip(startIndex).limit(limit),
            orderModel.countDocuments(query),
        ]);

        const ordersWithEventInfo = [];

        // Lấy thông tin sự kiện cho mỗi đơn hàng
        for (const order of orders) {
            try {
                const event = await axios.get(
                    `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
                    {
                        headers: {
                            'x-user-id': req.user?._id,
                            'x-user-role': req.user?.role,
                        },
                    },
                );

                const orderObj = order.toObject();
                orderObj.eventName = event.data.data.name;

                ordersWithEventInfo.push(orderObj);
            } catch (eventError) {
                logger.warn(
                    `Could not fetch event info for order ${order._id}:`,
                    eventError,
                );
                // Nếu không lấy được thông tin sự kiện, vẫn thêm đơn hàng vào danh sách
                ordersWithEventInfo.push(order.toObject());
            }
        }

        const result = {
            success: true,
            orders: ordersWithEventInfo,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfOrders / limit),
            totalOrders: totalNoOfOrders,
        };

        // Cache the result for 60 minutes
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get all orders from database');

        return res.status(200).json(result);
    } catch (error) {
        logger.error('Error in getAllOrders:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateStatusOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate input
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái đơn hàng là bắt buộc',
            });
        }

        // Validate status values
        const validStatuses = ['PENDING', 'PAID', 'CANCELED', 'REFUNDED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái đơn hàng không hợp lệ',
            });
        }

        // Find the order
        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // Check if the status change is valid
        if (order.status === status) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái đơn hàng đã là trạng thái này',
            });
        }

        // Update order status
        order.status = status;

        await order.save();

        // Tạo vé cho người dùng
        await createTicketsForOrder(order);
        // Xóa job hết hạn đơn hàng
        await deleteOrderExpireJob(order._id);
        // Xóa cache event
        await invalidateEventCacheById(req, order.eventId);
        await invalidateEventCache(req);

        // Invalidate order cache
        await invalidateOrderCache(req);

        const event = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
        );

        // Gửi email thông báo cho người dùng
        await publishEvent('notification.order.success', {
            email: order.buyerInfo.email,
            name: order.buyerInfo.name,
            event: event.data.data,
            order,
            tickets: order.tickets,
        });

        logger.info(`Order ${id} status updated to ${status}`);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            order,
        });
    } catch (error) {
        logger.error('Update order status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

const verifyReturnUrlHandler = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const query = req.body;

        // Xác định cổng thanh toán
        let provider = null;
        if (query.vnp_TxnRef) provider = 'vnpay';
        else if (query.apptransid) provider = 'zalopay';
        else {
            return res.status(400).json({
                success: false,
                message: 'Không xác định được cổng thanh toán',
            });
        }

        let transactionId = '';
        let verifyResult = { success: false };

        if (provider === 'vnpay') {
            transactionId = query.vnp_TxnRef;
            verifyResult = await paymentProvider.verifyVNPayReturnUrl(query);
        }

        if (provider === 'zalopay') {
            transactionId = query.apptransid;
            verifyResult = await paymentProvider.verifyZaloPayReturnUrl(query);
        }

        // Xác thực thất bại
        if (!verifyResult.success) {
            return res.status(200).json({
                success: false,
                status: 'UNPAID',
            });
        }

        const order = await orderModel.findOne({
            _id: orderId,
            'payment.attempts.transactionId': transactionId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        if (order.status == 'PAID') {
            return res.status(200).json({
                success: true,
                status: 'PAID',
            });
        }
        if (order.status == 'CANCELED') {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng đã bị hủy!',
            });
        }

        order.status = 'PAID';
        const attempt = order.payment.attempts.find(
            (a) => a.transactionId.toString() === transactionId.toString(),
        );
        if (attempt) attempt.status = 'PAID';

        // Tạo vé cho người dùng
        await createTicketsForOrder(order);
        // Xóa job hết hạn đơn hàng
        await deleteOrderExpireJob(order._id);
        // Xóa cache event đó
        await invalidateEventCacheById(req, order.eventId);
        await invalidateEventCache(req);

        // 🔔 Gửi mail chỉ khi thành công
        const event = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/${order.eventId}`,
        );

        await publishEvent('notification.order.success', {
            email: order.buyerInfo.email,
            name: order.buyerInfo.name,
            event: event.data.data,
            order,
            tickets: order.tickets,
        });

        await order.save();

        return res.status(200).json({
            success: true,
            status: 'PAID',
        });
    } catch (error) {
        console.error('[verifyReturnUrlHandler]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// cron job 5 phút xóa đơn hàng CANCELED
const deleteCanceledOrders = async (req) => {
    const canceledOrders = await orderModel.find({
        status: 'CANCELED',
        createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
    });
    for (const order of canceledOrders) {
        await order.deleteOne();
    }
};

cron.schedule('*/5 * * * *', deleteCanceledOrders);

export default {
    getRevenue,
    getRevenueByEventId,
    createOrder,
    getOrderById,
    checkStatusOrder,
    getOrderByOrderCode,
    cancelOrder,
    selectPaymentMethod,
    payosWebhookHandler,
    getMyOrders,
    getOrdersByEventId,
    getDashboard,
    getTopOrganizers,
    getAllOrders,
    updateStatusOrder,
    verifyReturnUrlHandler,
};
