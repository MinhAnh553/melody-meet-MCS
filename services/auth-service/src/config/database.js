import mongoose from 'mongoose';
import logger from '../utils/logger.js';
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Đã kết nối MongoDB (Auth)');
    } catch (error) {
        logger.error('Kết nối MongoDB thất bại:', error.message);
        process.exit(1);
    }
};
