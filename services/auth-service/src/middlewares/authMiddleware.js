import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token',
            });
        }

        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Token không hợp lệ',
        });
    }
};
