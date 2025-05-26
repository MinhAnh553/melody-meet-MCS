import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger.js';
import { publishEvent } from './rabbitmqProvider.js';
import orderModel from '../models/orderModel.js';

// Cấu hình Redis cho BullMQ
const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

// Khởi tạo Redis client
const redisClient = new Redis(process.env.REDIS_URL, redisOptions);

// Khởi tạo queue
const orderExpireQueue = new Queue('order-expire', {
    connection: redisOptions,
});

// Khởi tạo worker
const orderExpireWorker = new Worker(
    'order-expire',
    async (job) => {
        const { orderId, tickets } = job.data;
        try {
            // Chuyển trạng thái đơn hàng thành "CANCELED"
            const order = await orderModel.findById(orderId);
            if (!order) {
                logger.error(`Order ${orderId} not found`);
                throw new Error(`Order ${orderId} not found`);
            }

            if (order.status !== 'PENDING') {
                logger.warn(`Order ${orderId} is not in PENDING status`);
                return;
            }
            order.status = 'CANCELED';
            await order.save();

            // Publish event to release tickets back to inventory
            await publishEvent('order.expired', {
                orderId,
                tickets,
            });
            logger.info(`Order ${orderId} expired and tickets released`);
        } catch (error) {
            logger.error('Error processing expired order:', error);
            throw error;
        }
    },
    {
        connection: redisOptions,
    },
);

// Xử lý các sự kiện của worker
orderExpireWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

orderExpireWorker.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed:`, error);
});

// Hàm thêm job mới vào queue
const addOrderExpireJob = async (orderId, tickets) => {
    try {
        await orderExpireQueue.add(
            'expireOrder',
            { orderId, tickets },
            {
                delay: 15 * 60 * 1000, // 15 phút
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
        logger.info(`Added expire job for order ${orderId}`);
    } catch (error) {
        logger.error('Error adding expire job:', error);
        throw error;
    }
};

// Hàm đóng kết nối
const closeConnections = async () => {
    await orderExpireQueue.close();
    await orderExpireWorker.close();
    await redisClient.quit();
};

export { redisClient, orderExpireQueue, addOrderExpireJob, closeConnections };
