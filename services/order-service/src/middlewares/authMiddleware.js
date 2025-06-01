import logger from '../utils/logger.js';

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-role'];

    if (!userId || userId === 'undefined') {
        logger.warn('Access attempt with missing user ID');
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu xác thực! Vui lòng đăng nhập để tiếp tục',
        });
    }

    req.user = { userId, role };
    next();
};

const authorizeRoles = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-role'];

    if (!userId || userId === 'undefined') {
        logger.warn('Access attempt with missing user ID');
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu xác thực! Vui lòng đăng nhập để tiếp tục',
        });
    }

    if (role !== 'admin') {
        logger.warn('Access attempt with invalid role');
        return res.status(401).json({
            success: false,
            message: 'Bạn không có quyền truy cập vào trang này',
        });
    }

    req.user = { userId };
    next();
};

export default {
    authenticateRequest,
    authorizeRoles,
};
