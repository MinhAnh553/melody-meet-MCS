import emailProvider from '../providers/emailProvider.js';
import mailTemplate from '../utils/mailTemplate.js';
import logger from '../utils/logger.js';

// Gửi mã OTP
export const handleOtpNotification = async (event) => {
    try {
        // event: { email, otp }
        if (!event.email || !event.otp) {
            logger.warn('Invalid OTP notification event:', event);
            return;
        }

        logger.info(`Sending OTP email to: ${event.email}`);
        await emailProvider.sendMail(
            event.email,
            'Melody Meet: Mã Xác Minh',
            mailTemplate.otpTemplate(event.otp),
        );
        logger.info(`✅ OTP email sent successfully to: ${event.email}`);
    } catch (error) {
        logger.error(`❌ Failed to send OTP email to ${event.email}:`, error);
    }
};

// Gửi xác nhận đơn hàng thành công
export const handleOrderSuccessNotification = async (event) => {
    try {
        // event: { email, name, event: {name, startTime, endTime, ...}, order, tickets }
        if (
            !event.email ||
            !event.name ||
            !event.event ||
            !event.order ||
            !event.tickets
        ) {
            logger.warn('Invalid order success notification event:', event);
            return;
        }

        logger.info(`Sending order success email to: ${event.email}`);
        await emailProvider.sendMail(
            event.email,
            'Melody Meet: Giao Dịch Thành Công',
            mailTemplate.ticketInfoTemplate(
                event.name,
                event.event,
                event.order,
                event.tickets,
            ),
        );
        logger.info(
            `✅ Order success email sent successfully to: ${event.email}`,
        );
    } catch (error) {
        logger.error(
            `❌ Failed to send order success email to ${event.email}:`,
            error,
        );
    }
};

// Gửi nhắc nhở sự kiện
export const handleEventReminderNotification = async (event) => {
    try {
        // event: { email, name, event: {name, startTime, endTime, location, ...} }
        if (!event.email || !event.name || !event.event) {
            logger.warn('Invalid event reminder notification event:', event);
            return;
        }

        logger.info(`Sending event reminder email to: ${event.email}`);
        await emailProvider.sendMail(
            event.email,
            'Melody Meet: Nhắc Nhở Sự Kiện',
            mailTemplate.eventReminderTemplate(event.name, event.event),
        );
        logger.info(
            `✅ Event reminder email sent successfully to: ${event.email}`,
        );
    } catch (error) {
        logger.error(
            `❌ Failed to send event reminder email to ${event.email}:`,
            error,
        );
    }
};

export const handleUpgradeApprovedNotification = async (event) => {
    try {
        // event: { email, organizationName }
        if (!event.email || !event.organizationName) {
            logger.warn('Invalid upgrade approved notification event:', event);
            return;
        }

        logger.info(`Sending upgrade approved email to: ${event.email}`);
        await emailProvider.sendMail(
            event.email,
            'Melody Meet: Yêu cầu nâng cấp được duyệt',
            mailTemplate.upgradeApprovedTemplate(event.organizationName),
        );
        logger.info(
            `✅ Upgrade approved email sent successfully to: ${event.email}`,
        );
    } catch (error) {
        logger.error(
            `❌ Failed to send upgrade approved email to ${event.email}:`,
            error,
        );
    }
};

export const handleUpgradeRejectedNotification = async (event) => {
    try {
        // event: { email, adminNote }
        if (!event.email) {
            logger.warn('Invalid upgrade rejected notification event:', event);
            return;
        }

        logger.info(`Sending upgrade rejected email to: ${event.email}`);
        await emailProvider.sendMail(
            event.email,
            'Melody Meet: Yêu cầu nâng cấp bị từ chối',
            mailTemplate.upgradeRejectedTemplate(event.adminNote),
        );
        logger.info(
            `✅ Upgrade rejected email sent successfully to: ${event.email}`,
        );
    } catch (error) {
        logger.error(
            `❌ Failed to send upgrade rejected email to ${event.email}:`,
            error,
        );
    }
};
