import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Redis from 'ioredis';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import proxy from 'express-http-proxy';
import logger from './utils/logger.js';
import authMiddleware from './middlewares/authMiddleware.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

// DDoS protection and rate limiting
const rateLimitOptions = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Sensitive endpoint rate limit exceeded for IP:', req.ip);
        res.status(429).json({
            success: false,
            message: 'Too many requests',
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(rateLimitOptions);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },
    proxyErrorHandler: (err, res) => {
        logger.error('Proxy error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error!',
            error: err.message,
        });
    },
};

// Setting up proxy for our auth service
app.use(
    '/v1/auth',
    (req, res, next) => {
        // Danh sách các pattern route không cần xác thực
        const publicPatterns = [
            '/v1/auth/register/send-code',
            '/v1/auth/register/verify',
            '/v1/auth/login',
            '/v1/auth/refresh_token',
            /^\/v1\/auth\/users\/[^\/]+$/, // /v1/auth/users/:id
        ];

        // Kiểm tra nếu route hiện tại match với bất kỳ pattern nào
        const isPublicRoute = publicPatterns.some((pattern) => {
            if (pattern instanceof RegExp) {
                return pattern.test(req.originalUrl);
            }
            return pattern === req.originalUrl;
        });

        if (isPublicRoute) {
            return next();
        }

        // Nếu không phải public route, áp dụng validateToken
        authMiddleware.isAuthorized(req, res, next);
    },
    proxy(process.env.AUTH_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            // Chỉ thêm headers user nếu request đã được xác thực
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }
            proxyReqOpts.headers['content-type'] = 'application/json';
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from auth service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
    }),
);

// Setting up proxy for our event service
app.use(
    '/v1/events',
    (req, res, next) => {
        // Danh sách các pattern route không cần xác thực
        const publicPatterns = [
            /^\/v1\/events\?/, // Query parameters
            /^\/v1\/events\/[^\/]+$/, // /v1/events/:id
            /^\/v1\/events\/reviews\/event\/[^\/]+\/stats$/, // /v1/events/reviews/event/:id/stats
            /^\/v1\/events\/reviews\/event\/[^\/]+$/, // /v1/events/reviews/event/:id
            /^\/v1\/events\/reviews\/organizer\/[^\/]+(\?.*)?$/, //  /v1/events/reviews/organizer/:id?page=1&limit=10
        ];

        // Kiểm tra nếu route hiện tại match với bất kỳ pattern nào
        const isPublicRoute = publicPatterns.some((pattern) => {
            if (pattern instanceof RegExp) {
                return pattern.test(req.originalUrl);
            }
            return pattern === req.originalUrl;
        });

        if (isPublicRoute) {
            return next();
        }

        // Nếu không phải public route, áp dụng validateToken
        authMiddleware.isAuthorized(req, res, next);
    },
    proxy(process.env.EVENT_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            // Chỉ thêm headers user nếu request đã được xác thực
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }

            if (
                typeof srcReq.headers['content-type'] !== 'string' ||
                !srcReq.headers['content-type'].startsWith(
                    'multipart/form-data',
                )
            ) {
                proxyReqOpts.headers['content-type'] = 'application/json';
            }

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from event service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
        parseReqBody: false,
    }),
);

// Setting up proxy for our order service
app.use(
    '/v1/orders/webhook',
    proxy(process.env.ORDER_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers['content-type'] = 'application/json';

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from order service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
    }),
);

app.use(
    '/v1/orders',
    authMiddleware.isAuthorized,
    proxy(process.env.ORDER_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }

            proxyReqOpts.headers['content-type'] = 'application/json';

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from order service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
    }),
);

app.use(
    '/v1/tickets',
    authMiddleware.isAuthorized,
    proxy(process.env.TICKET_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }

            proxyReqOpts.headers['content-type'] = 'application/json';

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from ticket service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
    }),
);

app.use(
    '/v1/media',
    authMiddleware.isAuthorized,
    proxy(process.env.MEDIA_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }

            if (
                typeof srcReq.headers['content-type'] !== 'string' ||
                !srcReq.headers['content-type'].startsWith(
                    'multipart/form-data',
                )
            ) {
                proxyReqOpts.headers['content-type'] = 'application/json';
            }

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from media service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
        parseReqBody: false,
    }),
);

app.use(
    '/v1/chats',
    authMiddleware.isAuthorized,
    proxy(process.env.CHAT_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq?.jwtDecoded) {
                proxyReqOpts.headers['x-user-id'] = srcReq.jwtDecoded._id;
                proxyReqOpts.headers['x-user-role'] = srcReq.jwtDecoded.role;
            }

            proxyReqOpts.headers['content-type'] = 'application/json';

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                'Response received from chat service:',
                proxyRes.statusCode,
            );
            return proxyResData;
        },
    }),
);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger.info(`🚀 Auth Service running on ${process.env.AUTH_SERVICE_URL}`);
    logger.info(`🚀 Event Service running on ${process.env.EVENT_SERVICE_URL}`);
    logger.info(`🚀 Order Service running on ${process.env.ORDER_SERVICE_URL}`);
    logger.info(
        `🚀 Ticket Service running on ${process.env.TICKET_SERVICE_URL}`,
    );
    logger.info(`🚀 Media Service running on ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`🚀 Chat Service running on ${process.env.CHAT_SERVICE_URL}`);
    logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
