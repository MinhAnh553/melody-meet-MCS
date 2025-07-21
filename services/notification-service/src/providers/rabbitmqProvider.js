import amqp from 'amqplib';
import logger from '../utils/logger.js';

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'event_exchange';
const RECONNECT_INTERVAL = 5000; // 5 giây

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        connection.on('error', (err) => {
            logger.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed. Reconnecting...');
            setTimeout(connectRabbitMQ, RECONNECT_INTERVAL);
        });

        channel = await connection.createChannel();

        channel.on('error', (err) => {
            logger.error('RabbitMQ channel error:', err);
        });

        channel.on('close', () => {
            logger.warn('RabbitMQ channel closed.');
        });

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: false,
        });
        logger.info('✅ Connected to RabbitMQ');

        return channel;
    } catch (error) {
        logger.error('❌ Error connecting to RabbitMQ:', error);
        setTimeout(connectRabbitMQ, RECONNECT_INTERVAL); // retry
    }
}

async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectRabbitMQ();
    }
    await channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(message)),
    );
    logger.info(`Event published to ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
    if (!channel) {
        await connectRabbitMQ();
    }
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    await channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            channel.ack(msg);
        }
    });
    logger.info(`Subscribed to event: ${routingKey}`);
}

export { connectRabbitMQ, publishEvent, consumeEvent }; 