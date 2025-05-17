import eventModel from '../models/eventModel.js';
import logger from '../utils/logger.js';
import { validateCreateEvent } from '../utils/validation.js';
import { deleteMultipleCloudinaryImages } from '../providers/cloudinaryProvider.js';

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
        if (!event || event.status == 'pending' || event.status == 'rejected') {
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

export default {
    createEvent,
    getAllEvents,
    getEventById,
};
