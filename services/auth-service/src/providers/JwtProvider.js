import JWT from 'jsonwebtoken';
import logger from '../utils/logger.js';

const generateToken = async (userInfo, secretSignature, tokenLife) => {
    try {
        return JWT.sign(userInfo, secretSignature, {
            algorithm: 'HS256',
            expiresIn: tokenLife,
        });
    } catch (error) {
        logger.error('Error generating tokens:', error);
        throw error;
    }
};

const verifyToken = async (token, secretSignature) => {
    try {
        return JWT.verify(token, secretSignature);
    } catch (error) {
        logger.error('Error verifying token:', error);
        throw error;
    }
};

export default {
    generateToken,
    verifyToken,
};
