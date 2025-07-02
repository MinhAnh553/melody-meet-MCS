import express from 'express';
import eventController from '../controllers/eventController.js';
import cloudinaryProvider from '../providers/cloudinaryProvider.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Create event
Router.route('/organizer/create').post(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    cloudinaryProvider.fields([
        { name: 'eventBackground', maxCount: 1 },
        // { name: 'organizerLogo', maxCount: 1 },
    ]),
    eventController.createEvent,
);

// Get event summary
Router.route('/organizer/:eventId/summary').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    eventController.getEventSummary,
);

// Get my events
Router.route('/organizer/my').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    eventController.getMyEvents,
);

// Get ticket sold
Router.route('/organizer/total_ticket_sold').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    eventController.getTotalTicketSold,
);

// Get all events
Router.route('/admin/all-events').get(
    authMiddleware.isValidPermission(['admin']),
    eventController.getAllEvents,
);

// Total events
Router.route('/admin/total-events').get(
    authMiddleware.isValidPermission(['admin']),
    eventController.getTotalEvents,
);

// Update event status (admin only)
Router.route('/admin/update/:id/status').put(
    authMiddleware.isValidPermission(['admin']),
    cloudinaryProvider.fields([]),
    eventController.updateEventStatus,
);

// Get event
Router.route('/').get(eventController.getEvents);

// Search
Router.route('/search').get(eventController.searchEvents);

// Get event by id to edit
Router.route('/:id/edit').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    eventController.getEventByIdToEdit,
);

// Update event
Router.route('/update/:id').patch(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    cloudinaryProvider.fields([
        { name: 'eventBackground', maxCount: 1 },
        // { name: 'organizerLogo', maxCount: 1 },
    ]),
    eventController.updateEvent,
);

// Create order event
Router.route('/order/:id').post(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    cloudinaryProvider.fields([]),
    eventController.createOrder,
);

// Tạo đánh giá mới
Router.route('/reviews/create').post(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    cloudinaryProvider.fields([]),
    eventController.createReview,
);

// Lấy đánh giá của một sự kiện
Router.route('/reviews/event/:eventId').get(eventController.getEventReviews);

// Lấy thống kê đánh giá của một sự kiện
Router.route('/reviews/event/:eventId/stats').get(
    eventController.getEventReviewStats,
);

// Lấy đánh giá của người dùng hiện tại
Router.route('/reviews/my-reviews').get(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    eventController.getMyReviews,
);

// Lấy tất cả đánh giá của các sự kiện do organizer tổ chức
Router.route('/reviews/organizer/:organizerId').get(
    eventController.getOrganizerReviews,
);

// Kiểm tra sự kiện đã được đánh giá chưa
Router.route('/reviews/check-event/:eventId').get(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    eventController.checkEventReview,
);

// Cập nhật đánh giá
Router.route('/reviews/:reviewId').put(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    cloudinaryProvider.fields([]),
    eventController.updateReview,
);

// Xóa đánh giá
Router.route('/reviews/:reviewId').delete(
    authMiddleware.isValidPermission(['client', 'organizer', 'admin']),
    eventController.deleteReview,
);

// Get event by id
Router.route('/:id').get(eventController.getEventById);

export default Router;
