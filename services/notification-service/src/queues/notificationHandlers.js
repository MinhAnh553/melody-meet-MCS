import emailProvider from '../providers/emailProvider.js';
import mailTemplate from '../utils/mailTemplate.js';

// Gửi mã OTP
export const handleOtpNotification = async (event) => {
    // event: { email, otp }
    if (!event.email || !event.otp) return;
    await emailProvider.sendMail(
        event.email,
        'Melody Meet: Mã Xác Minh',
        mailTemplate.otpTemplate(event.otp)
    );
};

// Gửi xác nhận đơn hàng thành công
export const handleOrderSuccessNotification = async (event) => {
    // event: { email, name, event: {name, startTime, endTime, ...}, order, tickets }
    if (!event.email || !event.name || !event.event || !event.order || !event.tickets) return;
    await emailProvider.sendMail(
        event.email,
        'Melody Meet: Giao Dịch Thành Công',
        mailTemplate.ticketInfoTemplate(event.name, event.event, event.order, event.tickets)
    );
};

// Gửi nhắc nhở sự kiện
export const handleEventReminderNotification = async (event) => {
    // event: { email, name, event: {name, startTime, endTime, location, ...} }
    if (!event.email || !event.name || !event.event) return;
    await emailProvider.sendMail(
        event.email,
        'Melody Meet: Nhắc Nhở Sự Kiện',
        mailTemplate.eventReminderTemplate(event.name, event.event)
    );
};

export const handleUpgradeApprovedNotification = async (event) => {
    // event: { email, organizationName }
    if (!event.email || !event.organizationName) return;
    await emailProvider.sendMail(
        event.email,
        'Melody Meet: Yêu cầu nâng cấp được duyệt',
        mailTemplate.upgradeApprovedTemplate(event.organizationName)
    );
};

export const handleUpgradeRejectedNotification = async (event) => {
    // event: { email, adminNote }
    if (!event.email) return;
    await emailProvider.sendMail(
        event.email,
        'Melody Meet: Yêu cầu nâng cấp bị từ chối',
        mailTemplate.upgradeRejectedTemplate(event.adminNote)
    );
}; 