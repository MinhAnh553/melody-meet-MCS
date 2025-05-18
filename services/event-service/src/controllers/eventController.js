import eventModel from '../models/eventModel.js';
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
        await invalidateEventCache(req);

        logger.info('Event created successfully');
        return res.status(201).json({
            success: true,
            message: 'Sự kiện đã được tạo thành công!',
            data: event,
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

// [GET] /events/all-events
const getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `events:${page}:${limit}`;
        const cachedEvents = await req.redisClient.get(cacheKey);

        if (cachedEvents) {
            logger.info('Get all events from cache');
            return res.status(200).json(JSON.parse(cachedEvents));
        }

        const [events, totalNoOfEvents] = await Promise.all([
            eventModel
                .find()
                .sort({ createdAt: -1 })
                .skip(startIndex)
                .limit(limit),
            eventModel.countDocuments(),
        ]);

        const result = {
            success: true,
            events,
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

        const event = await eventModel.findById(eventId);
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại',
            });
        }

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(event));
        logger.info('Get event by id from database');

        return res.status(200).json({
            success: true,
            data: event,
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

        return res.status(200).json({
            success: true,
            data: event,
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
            ticketTypes: ticketTypes || event.ticketTypes,
            status: data.status || event.status,
            createdBy: event.createdBy || req.user.userId,
        };

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
            data: updatedEvent,
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
            events = await orderModel.aggregate([
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

                // 🔽 Sắp xếp theo tổng doanh thu (giảm dần)
                //    Nếu doanh thu bằng nhau, ưu tiên startTime gần nhất với ngày hiện tại
                {
                    $addFields: {
                        startTimeDiff: {
                            $abs: {
                                $subtract: [
                                    '$eventDetails.startTime',
                                    new Date(),
                                ],
                            },
                        },
                    },
                },
                { $sort: { totalRevenue: -1, startTimeDiff: 1 } },

                // Lấy tối đa 4 sự kiện hot nhất
                { $limit: 4 },
            ]);

            return events.map((e) => e.eventDetails);
        }

        if (type == 'special') {
            events = await eventModel
                .find({ status: status })
                .sort({ startTime: 1 })
                .limit(8);
        }

        if (type == 'all') {
            events = await eventModel.aggregate([
                {
                    $match: {
                        status: { $in: ['approved', 'event_over'] }, // Lọc các sự kiện hợp lệ
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
                        sortStatus: 1, // 'approved' (0) đứng trước 'event_over' (1)
                        startTime: 1, // Sắp xếp tăng dần theo thời gian bắt đầu
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

export default {
    createEvent,
    getAllEvents,
    getEventById,
    getMyEvents,
    getEventByIdToEdit,
    updateEvent,
    getEvents,
};
