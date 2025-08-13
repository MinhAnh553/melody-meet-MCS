import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { connectRabbitMQ, consumeEvent } from './providers/rabbitmqProvider.js';
import {
    handleOtpNotification,
    handleOrderSuccessNotification,
    handleEventReminderNotification,
    handleUpgradeApprovedNotification,
    handleUpgradeRejectedNotification,
} from './queues/notificationHandlers.js';

dotenv.config();

async function startWorker() {
    try {
        // Connect to RabbitMQ
        await connectRabbitMQ();
        logger.info('✅ Connected to RabbitMQ');

        // Subscribe to notification events
        await consumeEvent('notification.otp', handleOtpNotification);
        await consumeEvent(
            'notification.order.success',
            handleOrderSuccessNotification,
        );
        await consumeEvent(
            'notification.event.reminder',
            handleEventReminderNotification,
        );
        await consumeEvent(
            'notification.upgrade.approved',
            handleUpgradeApprovedNotification,
        );
        await consumeEvent(
            'notification.upgrade.rejected',
            handleUpgradeRejectedNotification,
        );

        logger.info('🚀 Notification Worker is listening to events...');
    } catch (error) {
        logger.error('❌ Error starting worker:', error);
        process.exit(1);
    }
}

startWorker();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', () => {
    logger.info('🛑 Shutting down notification service...');
    process.exit(0);
});
