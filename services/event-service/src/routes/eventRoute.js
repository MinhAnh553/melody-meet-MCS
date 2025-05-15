import express from 'express';
import eventController from '../controllers/eventController.js';
import uploadCloudProvider from '../providers/uploadCloudProvider.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const Router = express.Router();

// Create event
Router.route('/create').post(
    authMiddleware.authenticateRequest,
    uploadCloudProvider.fields([
        { name: 'eventBackground', maxCount: 1 },
        { name: 'organizerLogo', maxCount: 1 },
    ]),
    eventController.createEvent,
);

// Get all events
// Router.route('/').get(eventController.getAllEvents);

export default Router;
