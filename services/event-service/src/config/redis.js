import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

// Helper functions for event creation caching
export const cacheEventData = async (userId, eventData) => {
    const key = `event_draft:${userId}`;
    await redisClient.set(key, JSON.stringify(eventData), 'EX', 86400); // Expires in 24 hours
};

export const getEventData = async (userId) => {
    const key = `event_draft:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
};

export const deleteEventData = async (userId) => {
    const key = `event_draft:${userId}`;
    await redisClient.del(key);
};

export default redisClient;
