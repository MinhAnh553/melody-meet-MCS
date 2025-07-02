import logger from '../utils/logger.js';

const isValidPermission = (allowedRoles) => async (req, res, next) => {
    try {
        req.user = {
            id: req.headers['x-user-id'],
            role: req.headers['x-user-role'],
        };

        const userRole = req.user.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập vào API này!',
            });
        }

        next();
    } catch (error) {
        logger.error('Permission error:', error);

        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi kiểm tra quyền truy cập!',
        });
    }
};

export default {
    isValidPermission,
};
