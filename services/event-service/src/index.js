import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { connectDB } from './config/database.js';
import eventRoutes from './routes/eventRoute.js';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { connectRabbitMQ } from './providers/rabbitmqProvider.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;
// Connect to database
await connectDB();
const redisClient = new Redis(process.env.REDIS_URI);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

// DDoS protection and rate limiting
// const rateLimiter = new RateLimiterRedis({
//     storeClient: redisClient,
//     keyPrefix: 'middleware',
//     points: 10,
//     duration: 1,
// });

// app.use(async (req, res, next) => {
//     try {
//         await rateLimiter.consume(req.ip);
//         next();
//     } catch (err) {
//         logger.warn('Rate limit exceeded for IP:', req.ip);
//         res.status(429).json({
//             success: false,
//             message: 'Too many requests',
//         });
//     }
// });

// // IP based rate limiting for sensitive endpoints
// const sensitiveEndpointsLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 50,
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: (req, res) => {
//         logger.warn('Sensitive endpoint rate limit exceeded for IP:', req.ip);
//         res.status(429).json({
//             success: false,
//             message: 'Too many requests',
//         });
//     },
//     store: new RedisStore({
//         sendCommand: (...args) => redisClient.call(...args),
//     }),
// });

// Apply this sensitiveEndpointsLimiter to our routes
// app.use('/api/events/', sensitiveEndpointsLimiter);

// Routes
app.use(
    '/api/events',
    (req, res, next) => {
        req.redisClient = redisClient;
        next();
    },
    eventRoutes,
);

// Error handling middleware
app.use(errorHandler);

async function startServer() {
    try {
        await connectRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`🚀 Event Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
