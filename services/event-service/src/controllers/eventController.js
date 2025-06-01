import axios from 'axios';

import eventModel from '../models/eventModel.js';
import ticketTypeModel from '../models/ticketTypeModel.js';
import logger from '../utils/logger.js';
import { validateCreateEvent } from '../utils/validation.js';
import {
    deleteCloudinaryImage,
    deleteMultipleCloudinaryImages,
} from '../providers/cloudinaryProvider.js';

async function invalidateEventCache(req) {
    const keys = await req.redisClient.keys('events:*');
    if (keys.length > 0) {
        await req.redisClient.del(keys);
        logger.info('Invalidate event cache');
    }
}

// [POST] /events/create
const createEvent = async (req, res) => {
    logger.info('Request to create event');
    let uploadedImages = [];

    try {
        const data = req.body;
        if (!req.files) {
            logger.error('No files uploaded');
            return res.status(400).json({
                success: false,
                message: 'Vui lòng tải lên hình ảnh',
            });
        }

        // Store uploaded image paths for potential cleanup
        uploadedImages = [
            req.files.eventBackground[0].path,
            req.files.organizerLogo[0].path,
        ];

        // Parse lại dữ liệu ticketTypes từ chuỗi JSON
        let ticketTypes;
        try {
            ticketTypes = JSON.parse(data.ticketTypes);
        } catch (e) {
            logger.error('Error parsing ticketTypes:', e);
            await deleteMultipleCloudinaryImages(uploadedImages);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
            });
        }

        const eventData = {
            name: data.eventName,
            background: req.files.eventBackground[0].path,
            location: {
                venueName: data.venueName,
                province: data.province,
                district: data.district,
                ward: data.ward,
                address: data.address,
            },
            description: data.description,
            organizer: {
                logo: req.files.organizerLogo[0].path,
                name: data.organizerName,
                info: data.organizerInfo,
            },
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            ticketTypes: ticketTypes,
            createdBy: req.user.userId,
        };

        // Validate input
        const { error } = validateCreateEvent.validate(eventData);
        if (error) {
            logger.error('Validation error:', error);
            await deleteMultipleCloudinaryImages(uploadedImages);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const event = await eventModel.create(eventData);
        await ticketTypeModel.create(
            ticketTypes.map((ticketType) => ({
                ...ticketType,
                eventId: event._id,
            })),
        );

        await invalidateEventCache(req);

        logger.info('Event created successfully');
        return res.status(201).json({
            success: true,
            message: 'Sự kiện đã được tạo thành công!',
        });
    } catch (error) {
        logger.error('Create event error:', error);
        // Clean up uploaded images if any error occurs
        if (uploadedImages.length > 0) {
            await deleteMultipleCloudinaryImages(uploadedImages);
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/admin/all-events
const getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const status = req.query.status;
        const searchKey = req.query.search || '';
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder || 'asc';

        const cacheKey = `events:admin:${page}:${limit}:${status}:${searchKey}:${sortBy}:${sortOrder}`;
        const cachedEvents = await req.redisClient.get(cacheKey);

        if (cachedEvents) {
            logger.info('Get all events from cache');
            return res.status(200).json(JSON.parse(cachedEvents));
        }

        // Build query
        const query = {};
        if (searchKey) {
            query.$or = [
                { name: { $regex: searchKey, $options: 'i' } },
                { 'organizer.name': { $regex: searchKey, $options: 'i' } },
            ];
        }
        // Chỉ thêm điều kiện status nếu không phải 'all'
        if (status && status !== 'all') {
            query.status = status;
        }

        // Build sort
        const sort = {};
        switch (sortBy) {
            case 'name':
                sort.name = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'date':
                sort.startTime = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'revenue':
                sort.totalRevenue = sortOrder === 'asc' ? 1 : -1;
                break;
            default:
                sort.startTime = -1;
        }

        const [events, totalNoOfEvents] = await Promise.all([
            eventModel.find(query).sort(sort).skip(startIndex).limit(limit),
            eventModel.countDocuments(query),
        ]);

        const eventsWithInfo = [];

        //Vòng lặp để thêm thông tin người tạo sự kiện và doanh thu vào kết quả
        for (const event of events) {
            // Gọi API lấy thông tin người tạo sự kiện
            const organizerInfo = await axios.get(
                `${process.env.AUTH_SERVICE_URL}/api/auth/users/organizer/${event.createdBy}`,
            );

            // Gọi API tính toán doanh thu sự kiện
            const revenue = await axios.get(
                `${process.env.ORDER_SERVICE_URL}/api/orders/revenue/${event._id}`,
            );

            // Lấy ticketTypes
            const ticketTypes = await ticketTypeModel.find({
                eventId: event._id,
            });

            // Thêm thông tin người tạo sự kiện và doanh thu vào kết quả
            const eventObj = event.toObject();
            eventObj.email = organizerInfo.data.organizer.email;
            eventObj.totalRevenue = revenue.data.totalRevenue;
            eventObj.ticketTypes = ticketTypes;
            eventsWithInfo.push(eventObj);
        }

        const result = {
            success: true,
            events: eventsWithInfo,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfEvents / limit),
            totalEvents: totalNoOfEvents,
        };

        // Cache the result for 60 minutes
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get all events from database');

        return res.status(200).json(result);
    } catch (error) {
        logger.error('Get all events error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/:id
const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const cacheKey = `event:${eventId}`;
        const cachedEvent = await req.redisClient.get(cacheKey);

        if (cachedEvent) {
            logger.info('Get event by id from cache');
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedEvent),
            });
        }

        const event = await eventModel.findOne({
            _id: eventId,
            status: { $in: ['approved', 'event_over'] }, // Only fetch approved or event_over events
        });

        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại',
            });
        }

        const eventData = event.toObject();
        const ticketTypes = await ticketTypeModel.find({
            eventId: eventId,
        });
        eventData.ticketTypes = ticketTypes;
        // Cache the event data for 60 minutes
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(eventData));
        logger.info('Get event by id from database');

        return res.status(200).json({
            success: true,
            data: eventData,
        });
    } catch (error) {
        logger.error('Get event by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/my
const getMyEvents = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const status = req.query.status || 'pending';
        const searchKey = req.query.query || '';
        const cacheKey = `events:my:${userId}:${page}:${limit}:${status}:${searchKey}`;
        const cachedEvents = await req.redisClient.get(cacheKey);

        if (cachedEvents) {
            logger.info('Get my events from cache');
            return res.status(200).json(JSON.parse(cachedEvents));
        }

        const events = await eventModel
            .find({
                createdBy: userId,
                status,
                $or: [
                    { name: { $regex: searchKey, $options: 'i' } },
                    { organizer: { $regex: searchKey, $options: 'i' } },
                ],
            })
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalNoOfEvents = await eventModel.countDocuments({
            createdBy: userId,
            status,
            $or: [
                { name: { $regex: searchKey, $options: 'i' } },
                { organizer: { $regex: searchKey, $options: 'i' } },
            ],
        });

        const result = {
            success: true,
            events,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfEvents / limit),
            totalEvents: totalNoOfEvents,
        };

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get my events from database');
        return res.status(200).json(result);
    } catch (error) {
        logger.error('Get my events error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/:id/edit
const getEventByIdToEdit = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await eventModel.findById(eventId);

        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại',
            });
        }

        const ticketTypes = await ticketTypeModel.find({
            eventId: eventId,
        });

        // Convert event to plain object and add ticketTypes
        const eventData = event.toObject();
        eventData.ticketTypes = ticketTypes;

        return res.status(200).json({
            success: true,
            data: eventData,
        });
    } catch (error) {
        logger.error('Get event by id to edit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [PATCH] /events/update/:id
const updateEvent = async (req, res) => {
    try {
        const data = req.body;
        const eventId = req.params.id;
        const event = await eventModel.findById(eventId);
        let dataUpdate = {};
        let uploadedImages = [];
        if (req.files) {
            if (
                req.files.eventBackground &&
                req.files.eventBackground.length > 0
            ) {
                if (event.background) {
                    await deleteCloudinaryImage(event.background);
                }
                uploadedImages.push(req.files.eventBackground[0].path);
                data.background = req.files.eventBackground[0].path;
            }
            if (req.files.organizerLogo && req.files.organizerLogo.length > 0) {
                if (event.organizer.logo) {
                    await deleteCloudinaryImage(event.organizer.logo);
                }
                uploadedImages.push(req.files.organizerLogo[0].path);
                data.organizerLogo = req.files.organizerLogo[0].path;
            }
        }
        if (!event) {
            logger.error('Event not found');
            if (uploadedImages.length > 0) {
                await deleteMultipleCloudinaryImages(uploadedImages);
            }
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại',
            });
        }

        if (event.status === 'approved' || event.status === 'event_over') {
            if (uploadedImages.length > 0) {
                await deleteMultipleCloudinaryImages(uploadedImages);
            }
            return res.status(400).json({
                success: false,
                message: 'Sự kiện đã được duyệt hoặc đã diễn ra',
            });
        }

        if (event.status === 'rejected') {
            data.status = 'pending';
        }

        let ticketTypes;
        try {
            ticketTypes = JSON.parse(data.ticketTypes);
        } catch (error) {
            logger.error('Error parsing ticketTypes:', error);
            if (uploadedImages.length > 0) {
                await deleteMultipleCloudinaryImages(uploadedImages);
            }
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
            });
        }

        dataUpdate = {
            name: data.eventName || event.name,
            background: data.background || event.background,
            location: {
                venueName: data.venueName || event.location.venueName,
                province: data.province || event.location.province,
                district: data.district || event.location.district,
                ward: data.ward || event.location.ward,
                address: data.address || event.location.address,
            },
            description: data.description || event.description,
            organizer: {
                logo: data.organizerLogo || event.organizer.logo,
                name: data.organizerName || event.organizer.name,
                info: data.organizerInfo || event.organizer.info,
            },
            startTime: new Date(data.startTime) || event.startTime,
            endTime: new Date(data.endTime) || event.endTime,
            status: data.status || event.status,
            createdBy: event.createdBy || req.user.userId,
        };

        // Xóa các loại vé cũ
        await ticketTypeModel.deleteMany({ eventId: eventId });
        // Thêm các loại vé mới
        await ticketTypeModel.create(
            ticketTypes.map((ticketType) => ({
                ...ticketType,
                eventId: eventId,
            })),
        );

        // Update event
        const updatedEvent = await eventModel.findByIdAndUpdate(
            eventId,
            dataUpdate,
            {
                new: true,
            },
        );

        await invalidateEventCache(req);

        return res.status(200).json({
            success: true,
            message: 'Sự kiện đã được cập nhật thành công!',
        });
    } catch (error) {
        logger.error('Update event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events
const getEvents = async (req, res) => {
    try {
        const { type, status = 'approved' } = req.query;
        const cacheKey = `events:${type}:${status}`;
        const cachedEvents = await req.redisClient.get(cacheKey);

        if (cachedEvents) {
            logger.info('Get events from cache');
            return res.status(200).json(JSON.parse(cachedEvents));
        }

        let events;
        if (type == 'trending') {
            const result = await axios.get(
                `${process.env.ORDER_SERVICE_URL}/api/orders/revenue`,
            );
            events = result.data.revenue;
        }

        if (type == 'special') {
            events = await eventModel.aggregate([
                { $match: { status } },
                { $sort: { startTime: 1 } },
                { $limit: 8 },
                {
                    $lookup: {
                        from: 'tickettypes',
                        localField: '_id',
                        foreignField: 'eventId',
                        as: 'ticketTypes',
                    },
                },
            ]);
        }

        if (type == 'all') {
            events = await eventModel.aggregate([
                {
                    $match: {
                        status: { $in: ['approved', 'event_over'] },
                    },
                },
                {
                    $addFields: {
                        sortStatus: {
                            $cond: {
                                if: { $eq: ['$status', 'approved'] },
                                then: 0,
                                else: 1,
                            },
                        },
                    },
                },
                {
                    $sort: {
                        sortStatus: 1,
                        startTime: 1,
                    },
                },
                {
                    // Chèn ticketTypes từ collection tickettypes
                    $lookup: {
                        from: 'tickettypes', // collection name (phải là lowercase, đúng tên Mongo)
                        localField: '_id', // event._id
                        foreignField: 'eventId', // ticketType.eventId
                        as: 'ticketTypes',
                    },
                },
            ]);
        }

        const result = {
            success: true,
            events,
        };

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get events from database');
        return res.status(200).json(result);
    } catch (error) {
        logger.error('Get events error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [POST] /events/order/:id
const createOrder = async (req, res) => {
    logger.info('Create order');
    try {
        const userId = req.user.userId;
        const eventId = req.params.id;
        const data = req.body;
        const tickets = JSON.parse(data.items);
        const event = await eventModel.findById(eventId);

        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại',
            });
        }

        if (event.status !== 'approved') {
            logger.error('Event is not approved');
            return res.status(400).json({
                success: false,
                message: 'Sự kiện chưa được duyệt',
            });
        }

        if (event.startTime < new Date()) {
            logger.error('Event has already started');
            return res.status(400).json({
                success: false,
                message: 'Sự kiện đã bắt đầu',
            });
        }

        // Check if tickets are valid
        if (!Array.isArray(tickets) || tickets.length === 0) {
            logger.error('No tickets provided');
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ít nhất một loại vé',
            });
        }

        // Số lượng vé không được vượt quá số lượng vé còn lại
        for (const item of tickets) {
            const ticketType = await ticketTypeModel.findById(item.ticketId);
            if (!ticketType) {
                logger.error(`Ticket type not found: ${item.ticketId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Loại vé không tồn tại',
                });
            }
            if (
                item.quantity >
                ticketType.totalQuantity - ticketType.quantitySold
            ) {
                logger.error(
                    `Not enough tickets for type: ${item.ticketTypeId}`,
                );
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vé không đủ cho loại vé ${ticketType.name}`,
                });
            }
            // Cập nhật số lượng vé đã bán
            ticketType.quantitySold += item.quantity;
            await ticketType.save();
        }

        // Gọi đến order-service để tạo đơn hàng
        const response = await axios.post(
            `${process.env.ORDER_SERVICE_URL}/api/orders/create`,
            {
                userId,
                eventId,
                tickets,
                totalPrice: data.totalPrice,
                buyerInfo: JSON.parse(data.buyerInfo),
            },
        );

        const orderId = response.data.orderId;

        return res.status(201).json({
            success: true,
            orderId,
            message:
                'Tạo đơn hàng thành công! Vui lòng thanh toán trong 15 phút!',
        });
    } catch (error) {
        logger.error('Create order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/search?query=abc
const searchEvents = async (req, res) => {
    try {
        const { query = '' } = req.query;
        const cacheKey = `events:search:${query}`;
        const cachedEvents = await req.redisClient.get(cacheKey);

        if (cachedEvents) {
            logger.info('Get search events from cache');
            return res.status(200).json(JSON.parse(cachedEvents));
        }

        // Tìm kiếm sự kiện theo tên
        const events = await eventModel
            .find({
                status: { $in: ['approved', 'event_over'] },
                name: { $regex: query, $options: 'i' },
            })
            .sort({ startTime: 1 })
            .select('_id name background');

        const result = {
            success: true,
            events,
        };

        // Cache kết quả trong 1 giờ
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get search events from database');

        return res.status(200).json(result);
    } catch (error) {
        logger.error('Search events error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/organizer/:eventId/summary
const getEventSummary = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.userId;

        // Kiểm tra sự kiện tồn tại và thuộc về người dùng
        const event = await eventModel.findOne({
            _id: eventId,
            createdBy: userId,
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    'Không tìm thấy sự kiện hoặc bạn không có quyền truy cập',
            });
        }

        // Lấy danh sách đơn hàng từ order-service
        const ordersResponse = await axios.get(
            `${process.env.ORDER_SERVICE_URL}/api/orders/event/${eventId}`,
        );
        const orders = ordersResponse.data.orders || [];

        let totalRevenue = 0;
        let totalSold = 0;
        let ticketDetails = [];
        let revenueByDate = [];

        // Map để lưu trữ thông tin vé theo loại
        const ticketTypeMap = new Map();

        // Xử lý từng đơn hàng
        for (const order of orders) {
            totalRevenue += order.totalPrice;
            totalSold += order.tickets.reduce(
                (sum, ticket) => sum + ticket.quantity,
                0,
            );

            // Xử lý chi tiết vé
            for (const ticket of order.tickets) {
                const ticketType = await ticketTypeModel.findById(
                    ticket.ticketId,
                );
                if (ticketType) {
                    const key = ticketType._id.toString();
                    if (!ticketTypeMap.has(key)) {
                        ticketTypeMap.set(key, {
                            name: ticketType.name,
                            price: ticketType.price,
                            quantity: ticketType.totalQuantity,
                            quantitySold: 0,
                        });
                    }
                    // Cập nhật số lượng vé đã bán
                    ticketTypeMap.get(key).quantitySold += ticket.quantity;
                }
            }

            // Xử lý doanh thu theo ngày
            let date = new Date(order.createdAt).toLocaleDateString();
            let revenue = order.totalPrice;

            let index = revenueByDate.findIndex((item) => item.date === date);
            if (index === -1) {
                revenueByDate.push({ date, revenue });
            } else {
                revenueByDate[index].revenue += revenue;
            }
        }

        // Chuyển Map thành mảng
        ticketDetails = Array.from(ticketTypeMap.values());

        return res.status(200).json({
            success: true,
            totalRevenue: totalRevenue || 0,
            totalSold: totalSold || 0,
            ticketDetails: ticketDetails.length > 0 ? ticketDetails : [],
            revenueByDate: revenueByDate.length > 0 ? revenueByDate : [],
        });
    } catch (error) {
        logger.error('Error in getEventSummary:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [GET] /events/admin/total-events
const getTotalEvents = async (req, res) => {
    try {
        const totalEvents = await eventModel.countDocuments();
        return res.status(200).json({
            success: true,
            totalEvents,
        });
    } catch (error) {
        logger.error('Error in getTotalEvents:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// [PUT] /events/:id/status - Cập nhật trạng thái sự kiện
const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        console.log('MinhAnh553: updateEventStatus -> data', data);

        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected', 'event_over'];
        if (!validStatuses.includes(data.status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ',
            });
        }

        // Validate reject reason when status is rejected
        if (
            data.status === 'rejected' &&
            (!data.rejectReason || data.rejectReason.trim() === '')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do từ chối',
            });
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {
            status: data.status,
            ...(data.status === 'rejected'
                ? { rejectReason: data.rejectReason.trim() }
                : { rejectReason: null }),
        };

        // Tìm và cập nhật sự kiện
        const updatedEvent = await eventModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true },
        );

        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện',
            });
        }

        // Invalidate cache
        await invalidateEventCache(req);

        // Ghi log
        logger.info(`Event ${id} status updated to ${data.status}`);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái sự kiện thành công',
            event: updatedEvent,
        });
    } catch (error) {
        logger.error('Update event status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái sự kiện',
        });
    }
};

export default {
    createEvent,
    getAllEvents,
    getEventById,
    getMyEvents,
    getEventByIdToEdit,
    updateEvent,
    getEvents,
    createOrder,
    searchEvents,
    getEventSummary,
    getTotalEvents,
    updateEventStatus,
};
