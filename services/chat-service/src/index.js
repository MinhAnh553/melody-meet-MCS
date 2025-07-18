import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Redis from 'ioredis';

import { connectDB } from './config/database.js';
import chatRoutes from './routes/chatRoute.js';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3006;
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
app.use('/api/chats', chatRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Chat Service running on port ${PORT}`);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
