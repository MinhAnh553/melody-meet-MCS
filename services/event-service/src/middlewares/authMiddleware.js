import logger from '../utils/logger.js';

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId || userId === 'undefined') {
        logger.warn('Access attempt with missing user ID');
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu xác thực! Vui lòng đăng nhập để tiếp tục',
        });
    }

    req.user = { userId };
    next();
};

export default {
    authenticateRequest,
};
