import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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
import JwtProvider from '../providers/JwtProvider.js';

dotenv.config();

const ACCESS_TOKEN_SECRET_SIGNATURE =
    process.env.ACCESS_TOKEN_SECRET_SIGNATURE ||
    'tLPQcRzyKdURPJKIoEbgvw7a1mPH466w';
const REFRESH_TOKEN_SECRET_SIGNATURE =
    process.env.REFRESH_TOKEN_SECRET_SIGNATURE ||
    'aFj4d6sST6G6qynXTWgPQaDfvfdgwQq3';

// Send verification code
const sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
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
        const code = Math.floor(1000 + Math.random() * 9000).toString();
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
            message: 'Internal Server Error',
        });
    }
};

// Verify code and register user
const verifyAndRegister = async (req, res) => {
    const { email, password, code } = req.body;

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

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
        });
    } catch (error) {
        logger.error('Verification code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
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

        const userInfo = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        // Generate tokens
        const accessToken = await JwtProvider.generateToken(
            userInfo,
            ACCESS_TOKEN_SECRET_SIGNATURE,
            '10 m',
            // '5',
        );
        const refreshToken = await JwtProvider.generateToken(
            userInfo,
            REFRESH_TOKEN_SECRET_SIGNATURE,
            '14 days',
        );

        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                ...userInfo,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.body?.refreshToken;

        const refreshTokenDecoded = await JwtProvider.verifyToken(
            refreshToken,
            REFRESH_TOKEN_SECRET_SIGNATURE,
        );

        const userInfo = {
            id: refreshTokenDecoded.id,
            email: refreshTokenDecoded.email,
            role: refreshTokenDecoded.role,
        };

        const accessToken = await JwtProvider.generateToken(
            userInfo,
            ACCESS_TOKEN_SECRET_SIGNATURE,
            '10 m',
            // '5',
        );

        res.status(200).json({
            success: true,
            message: 'Tạo mới accessToken thành công!',
            accessToken,
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Get account
const getAccount = async (req, res) => {
    logger.info(`Get account request received`);
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, user });
    } catch (error) {
        logger.error('Get account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Update user address
const updateUserAddress = async (req, res) => {
    logger.info(`Update user address request received`);
    try {
        const data = req.body;
        const user = await userModel.updateOne(
            { _id: req.user.id },
            { $set: data },
        );
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin tài khoản thành công',
        });
    } catch (error) {
        logger.error('Update user address error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Get total users
const getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments({ deleted: false });
        res.status(200).json({ success: true, totalUsers });
    } catch (error) {
        logger.error('Get total users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ deleted: false })
            .select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        logger.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const user = await userModel.findByIdAndUpdate(id, data, { new: true });
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công',
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

export default {
    sendVerificationCode,
    verifyAndRegister,
    login,
    refreshToken,
    getAccount,
    updateUserAddress,
    getTotalUsers,
    getAllUsers,
    updateUser,
};
