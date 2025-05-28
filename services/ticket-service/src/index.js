import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { connectDB } from './config/database.js';
import ticketRoutes from './routes/ticketRoute.js';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;
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
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1,
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (err) {
        logger.warn('Rate limit exceeded for IP:', req.ip);
        res.status(429).json({
            success: false,
            message: 'Too many requests',
        });
    }
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
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

// Routes
app.use('/api/tickets', ticketRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Ticket Service running on port ${PORT}`);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
