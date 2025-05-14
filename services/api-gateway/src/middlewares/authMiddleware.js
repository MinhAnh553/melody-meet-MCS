import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Access attempt with valid token');
        return res.status(401).json({
            status: false,
            message: 'Authentication required',
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token');
            return res.status(429).json({
                status: false,
                message: 'Invalid token',
            });
        }

        req.user = user;
        next();
    });
};

export default validateToken;
