import JwtProvider from '../providers/JwtProvider.js';
import logger from '../utils/logger.js';

const isAuthorized = async (req, res, next) => {
    const accessToken = req.headers.authorization;
    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized!',
        });
    }

    try {
        const accessTokenDecoded = await JwtProvider.verifyToken(
            accessToken.split(' ')[1],
            process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
        );

        req.jwtDecoded = accessTokenDecoded;

        next();
    } catch (error) {
        logger.error('Authentication JWT error:', error);
        if (error.message?.includes('jwt expired')) {
            return res.status(410).json({
                success: false,
                message: 'Need to refresh token',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Unauthorized!',
        });
    }
};

export default {
    isAuthorized,
};
