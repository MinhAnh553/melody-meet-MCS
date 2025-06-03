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
            message: 'Internal server error',
        });
    }
};

// Doanh thu sự kiện
const getRevenueByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;
        const orders = await orderModel.find({ eventId, status: 'PAID' });
        const totalRevenue = orders.reduce(
            (acc, order) => acc + order.totalPrice,
            0,
        );
        return res.status(200).json({ success: true, totalRevenue });
    } catch (error) {
        logger.error('Get revenue by event ID error:', error);
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

        invalidateOrderCache(req);

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
            await invalidateEventCache(req);
        } else {
            order.status = 'CANCELED';
            // Xóa job hết hạn đơn hàng
            await deleteOrderExpireJob(order._id);
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

// [GET] /orders/dashboard
const getDashboard = async (req, res) => {
    try {
        const { userId, role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập vào trang này',
            });
        }

        const orders = await orderModel.aggregate([
            { $match: { status: 'PAID' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    countPaidOrders: { $sum: 1 },
                },
            },
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ordersMonth = await orderModel.find({
            status: 'PAID',
            createdAt: { $gte: thirtyDaysAgo }, // Lọc theo thời gian
        });

        const revenueByDay = [];
        const labels = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i)); // Tạo nhãn ngày từ 30 ngày trước đến hôm nay
            const formattedDate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
            labels.push(formattedDate);
            revenueByDay.push({ date: formattedDate, revenue: 0 }); // Khởi tạo revenue = 0
        }

        // Cộng doanh thu theo từng ngày
        ordersMonth.forEach((order) => {
            const orderDate = order.createdAt.toISOString().split('T')[0]; // Format YYYY-MM-DD
            const index = labels.indexOf(orderDate); // Xác định vị trí trong mảng
            if (index !== -1) {
                revenueByDay[index].revenue += order.totalPrice;
            }
        });

        // Tổng người dùng
        const totalUsers = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/users/total`,
        );

        // Tổng sự kiện
        const totalEvents = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/admin/total-events`,
        );

        const totalOrders = orders.length > 0 ? orders[0].countPaidOrders : 0;
        const totalRevenue = orders.length > 0 ? orders[0].totalRevenue : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalUsers: totalUsers.data.totalUsers,
                totalEvents: totalEvents.data.totalEvents,
                totalOrders,
                revenueByDay,
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
            message: 'Internal server error',
        });
    }
};

export default {
    getRevenue,
    getRevenueByEventId,
    createOrder,
    getOrderById,
    checkStatusOrder,
    getOrderByOrderCode,
    cancelOrder,
    selectPaymentMethod,
    webhookHandler,
    getMyOrders,
    getOrdersByEventId,
    getDashboard,
    getAllOrders,
    updateStatusOrder,
};
