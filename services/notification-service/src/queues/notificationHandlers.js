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