import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateTokens = (user) => {
    try {
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY },
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id,
            },
            JWT_REFRESH_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY },
        );

        return { accessToken, refreshToken };
    } catch (error) {
        logger.error('Error generating tokens:', error);
        throw error;
    }
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        logger.error('Error verifying access token:', error);
        throw error;
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        logger.error('Error verifying refresh token:', error);
        throw error;
    }
};

export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error('Error decoding token:', error);
        throw error;
    }
};
