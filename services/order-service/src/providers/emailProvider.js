import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
        await transporter.sendMail({
            from: `"Melody Meet" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html,
        });
    } catch (error) {
        throw new Error('Gửi email thất bại. Vui lòng thử lại sau.');
    }
};

export default {
    sendMail,
};
