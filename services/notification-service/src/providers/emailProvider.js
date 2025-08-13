import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async (email, subject, html) => {
    try {
        // Validate email configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error(
                'Email configuration missing: EMAIL_USER or EMAIL_PASS not set',
            );
        }

        logger.info(
            `Attempting to send email to: ${email}, subject: ${subject}`,
        );

        const result = await transporter.sendMail({
            from: `"Melody Meet" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html,
        });

        logger.info(
            `Email sent successfully to ${email}, messageId: ${result.messageId}`,
        );
        return result;
    } catch (error) {
        logger.error(`Failed to send email to ${email}:`, error);

        // Provide more specific error messages
        if (error.code === 'EAUTH') {
            throw new Error(
                'Email authentication failed. Please check EMAIL_USER and EMAIL_PASS.',
            );
        } else if (error.code === 'ECONNECTION') {
            throw new Error(
                'Email connection failed. Please check your internet connection.',
            );
        } else {
            throw new Error(`Gửi email thất bại: ${error.message}`);
        }
    }
};

export default {
    sendMail,
};
