import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import otpModel from '../models/otpModel.js';
import mailTemplate from '../templates/mailTemplate.js';
import emailProvider from '../providers/emailProvider.js';
import logger from '../utils/logger.js';
import { validateRegister, validateVerify } from '../utils/validation.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

// Generate random 4-digit code
const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send verification code
const sendVerificationCode = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    try {
        // Validate input
        const { error } = validateRegister.validate(req.body);
        if (error) {
            logger.error('Validation error:', error);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            logger.error('Validation error: Email already exists');
            return res.status(400).json({
                success: false,
                message: 'Email đã được đăng ký',
            });
        }

        // Generate and save verification code
        const code = generateVerificationCode();
        await otpModel.findOneAndUpdate(
            { email },
            { code },
            { upsert: true, new: true },
        );

        // Send email
        await emailProvider.sendMail(
            email,
            'Melody Meet: Mã Xác Minh',
            mailTemplate.otpTemplate(code),
        );

        logger.info(`Verification code sent to ${email}`);
        res.status(200).json({
            success: true,
            message: 'Mã xác minh đã được gửi đến email của bạn',
        });
    } catch (error) {
        logger.error('Send verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Verify code and register user
const verifyAndRegister = async (req, res) => {
    const { email, password, confirmPassword, code } = req.body;

    try {
        // Validate input
        const { error } = validateVerify.validate(req.body);
        if (error) {
            logger.error('Validation error:', error);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Verify code
        const verificationRecord = await otpModel.findOne({
            email,
            code,
        });
        if (!verificationRecord) {
            logger.error('Validation error: Invalid verification code');
            return res.status(400).json({
                success: false,
                message: 'Mã xác minh không đúng hoặc đã hết hạn',
            });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ email, password: hashedPassword });
        await newUser.save();

        // Delete verification code
        await otpModel.deleteOne({ email });

        // Generate tokens
        const accessToken = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
            expiresIn: '1h',
        });

        const refreshToken = jwt.sign(
            { userId: newUser._id },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' },
        );

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error('Verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

export default {
    sendVerificationCode,
    verifyAndRegister,
};
