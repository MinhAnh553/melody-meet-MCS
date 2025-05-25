import logger from '../utils/logger.js';
import ticketTypeModel from '../models/ticketTypeModel.js';

// Xử lý sự kiện order hết hạn
const handleOrderExpired = async (data) => {
    try {
        const { tickets } = data;

        // Release tickets back to inventory
        for (const ticket of tickets) {
            const ticketType = await ticketTypeModel.findById(ticket.ticketId);
            if (ticketType) {
                ticketType.quantitySold -= ticket.quantity;
                await ticketType.save();
                logger.info(
                    `Released ${ticket.quantity} tickets for type ${ticket.ticketId}`,
                );
            }
        }
    } catch (error) {
        logger.error('Error processing order expiration:', error);
    }
};

export { handleOrderExpired };
