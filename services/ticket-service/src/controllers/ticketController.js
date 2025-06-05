import ticketModel from '../models/ticketModel.js';
import logger from '../utils/logger.js';
import { validateCreateBulkTicket } from '../utils/validation.js';

const createBulkTicket = async (req, res) => {
    try {
        const { error } = validateCreateBulkTicket.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { tickets } = req.body;
        const createdTickets = await ticketModel.insertMany(tickets);

        logger.info(`Created ${createdTickets.length} tickets`);
        return res.status(201).json({
            success: true,
            tickets: createdTickets,
            message: 'Tạo vé thành công',
        });
    } catch (error) {
        logger.error('Create bulk ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

export default {
    createBulkTicket,
};
