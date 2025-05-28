import ticketModel from '../models/ticketModel.js';
import logger from '../utils/logger.js';
import { validateRegister } from '../utils/validation.js';

const sendVerificationCode = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    try {
        // Validate input
        const { error } = validateRegister.validate(req.body);
        if (error) {
            logger.error('Validation error:', error);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        logger.info(`Verification code sent to ${email}`);
        res.status(200).json({
            success: true,
            message: 'Mã xác minh đã được gửi đến email của bạn',
        });
    } catch (error) {
        logger.error('Send verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

export default {
    sendVerificationCode,
};
