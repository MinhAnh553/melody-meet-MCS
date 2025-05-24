import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import otpModel from '../models/otpModel.js';
import mailTemplate from '../templates/mailTemplate.js';
import emailProvider from '../providers/emailProvider.js';
import logger from '../utils/logger.js';
import {
    validateRegister,
    validateVerify,
    validateLogin,
} from '../utils/validation.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';

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

        // Check if user exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            logger.error('Validation error: User already exists');
            return res.status(400).json({
                success: false,
                message: 'Email đã được đăng ký',
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
        const tokens = generateTokens(newUser);

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        logger.error('Verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    logger.info(`Login request received for email: ${email}`);
    try {
        // Validate input
        const { error } = validateLogin.validate(req.body);
        if (error) {
            logger.error('Validation error:', error);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Check if user exists
        const user = await userModel.findOne({ email, deleted: false });
        if (!user) {
            logger.error('Validation error: User not found');
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác',
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.error('Validation error: Invalid password');
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác',
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                address: user.address,
                role: user.role,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token là bắt buộc',
            });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Refresh token không hợp lệ',
            });
        }

        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại',
            });
        }
        const tokens = generateTokens(user);

        return res.status(200).json({
            success: true,
            data: tokens,
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token đã hết hạn',
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Refresh token không hợp lệ',
        });
    }
};

// Logout
const logout = async (req, res) => {
    logger.info(`Logout request received`);
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.error('Validation error: Refresh token is required');
            return res.status(400).json({
                success: false,
                message: 'Refresh token là bắt buộc',
            });
        }

        logger.info(`User logged out successfully`);
        res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công',
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Get account
const getAccount = async (req, res) => {
    logger.info(`Get account request received`);
    try {
        const user = await userModel
            .findById(req.user.userId)
            .select('-password');
        res.status(200).json({ success: true, user });
    } catch (error) {
        logger.error('Get account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Update user address
const updateUserAddress = async (req, res) => {
    logger.info(`Update user address request received`);
    try {
        const data = req.body;
        const user = await userModel.updateOne(
            { _id: req.user.userId },
            {
                $set: {
                    address: {
                        ...data,
                    },
                },
            },
        );
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin tài khoản thành công',
        });
    } catch (error) {
        logger.error('Update user address error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

export default {
    sendVerificationCode,
    verifyAndRegister,
    login,
    refreshToken,
    logout,
    getAccount,
    updateUserAddress,
};
