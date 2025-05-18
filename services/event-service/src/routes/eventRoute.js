import express from 'express';
import eventController from '../controllers/eventController.js';
import cloudinaryProvider from '../providers/cloudinaryProvider.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Create event
Router.route('/create').post(
    authMiddleware.authenticateRequest,
    cloudinaryProvider.fields([
        { name: 'eventBackground', maxCount: 1 },
        { name: 'organizerLogo', maxCount: 1 },
    ]),
    eventController.createEvent,
);

// Get all events
Router.route('/all-events').get(eventController.getAllEvents);

// Get my events
Router.route('/my').get(
    authMiddleware.authenticateRequest,
    eventController.getMyEvents,
);

// Get event by id
Router.route('/:id').get(eventController.getEventById);

// Get event by id to edit
Router.route('/:id/edit').get(
    authMiddleware.authenticateRequest,
    eventController.getEventByIdToEdit,
);

// Update event
Router.route('/update/:id').patch(
    authMiddleware.authenticateRequest,
    cloudinaryProvider.fields([
        { name: 'eventBackground', maxCount: 1 },
        { name: 'organizerLogo', maxCount: 1 },
    ]),
    eventController.updateEvent,
);

export default Router;
