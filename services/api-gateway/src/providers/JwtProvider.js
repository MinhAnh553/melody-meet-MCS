import JWT from 'jsonwebtoken';
import logger from '../utils/logger.js';

const verifyToken = async (token, secretSignature) => {
    try {
        return JWT.verify(token, secretSignature);
    } catch (error) {
        logger.error('Error verifying token:', error);
        throw error;
    }
};

export default {
    verifyToken,
};
