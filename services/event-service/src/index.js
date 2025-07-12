import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Redis from 'ioredis';

import { connectDB } from './config/database.js';
import eventRoutes from './routes/eventRoute.js';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { connectRabbitMQ, consumeEvent } from './providers/rabbitmqProvider.js';
import { handleOrderExpired } from './handlers/orderEventHandler.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;
// Connect to database
await connectDB();
const redisClient = new Redis(process.env.REDIS_URL);

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

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

        // Consume events from RabbitMQ
        await consumeEvent('order.expired', handleOrderExpired);

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
