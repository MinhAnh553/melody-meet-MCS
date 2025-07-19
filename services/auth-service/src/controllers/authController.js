import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';
import otpModel from '../models/otpModel.js';
import upgradeRequestModel from '../models/upgradeRequestModel.js';
import mailTemplate from '../templates/mailTemplate.js';
import emailProvider from '../providers/emailProvider.js';
import logger from '../utils/logger.js';
import {
    validateRegister,
    validateVerify,
    validateLogin,
} from '../utils/validation.js';
import JwtProvider from '../providers/JwtProvider.js';
import axios from 'axios';

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
            return res.status(200).json({
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
            name: user.name,
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
            name: refreshTokenDecoded.name,
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
        if (user.role === req.user?.role && user.role === 'organizer') {
            // Lấy tổng số sự kiện đã tạo
            const totalEvents = await axios.get(
                `${process.env.EVENT_SERVICE_URL}/api/events/organizer/my?query=&page=1&limit=10&status=approved`,
                {
                    headers: {
                        'x-user-id': req.user?.id,
                        'x-user-role': req.user?.role,
                    },
                },
            );
            // Lấy tổng số số vé đã bán
            const totalTickets = await axios.get(
                `${process.env.EVENT_SERVICE_URL}/api/events/organizer/total_ticket_sold`,
                {
                    headers: {
                        'x-user-id': req.user?.id,
                        'x-user-role': req.user?.role,
                    },
                },
            );

            const organizerData = user.toObject();

            organizerData.organizer.totalEvents =
                totalEvents.data.totalEvents || 0;

            organizerData.organizer.totalTickets =
                totalTickets.data.totalTickets || 0;

            return res.status(200).json({ success: true, user: organizerData });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        logger.error('Get account error:', error);
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const status = req.query.status;
        const searchKey = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortUser = req.query.sortUser || 'desc';

        // const cacheKey = `users:admin:${page}:${limit}:${status}:${searchKey}:${sortBy}:${sortUser}`;
        // const cachedUsers = await req.redisClient.get(cacheKey);

        // if (cachedUsers) {
        //     logger.info('Get all users from cache');
        //     return res.status(200).json(JSON.parse(cachedUsers));
        // }

        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (searchKey) {
            query.$or = [{ email: { $regex: searchKey, $options: 'i' } }];
        }

        const sort = {};
        switch (sortBy) {
            case 'email':
                sort.email = sortUser === 'asc' ? 1 : -1;
                break;
            case 'createdAt':
            default:
                sort.createdAt = sortUser === 'asc' ? 1 : -1;
        }

        const users = await userModel
            .find(query)
            .select('-password')
            .skip(startIndex)
            .limit(limit)
            .sort(sort);

        const totalUsers = await userModel.countDocuments(query);

        const result = {
            success: true,
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        };

        // await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));
        logger.info('Get all users from database');

        return res.status(200).json(result);
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

// Get user by ID (for external services)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        res.status(200).json({
            success: true,
            organizer: user.organizer,
        });
    } catch (error) {
        logger.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Update organizer
const updateOrganizer = async (req, res) => {
    try {
        const { id } = req.user;
        const data = req.body;
        // Cập nhật trực tiếp các trường của organizer
        const update = {};
        for (const key of [
            'name',
            'tax',
            'website',
            'description',
            'email',
            'phone',
            'logo',
            'logoMediaId',
            'licenseUrl',
            'licenseMediaId',
            'accountName',
            'accountNumber',
            'bankName',
            'agree',
        ]) {
            if (typeof data[key] !== 'undefined') {
                update[`organizer.${key}`] = data[key];
            }
        }
        const organizer = await userModel.findByIdAndUpdate(id, update, {
            new: true,
        });
        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin ban tổ chức thành công',
        });
    } catch (error) {
        logger.error('Update organizer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Create upgrade request
const createUpgradeRequest = async (req, res) => {
    try {
        const { id } = req.user;
        const { organization, agree } = req.body;

        // Check if user already has a pending request
        const existingRequest = await upgradeRequestModel.findOne({
            userId: id,
            status: 'pending',
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có yêu cầu nâng cấp đang chờ xử lý',
            });
        }

        // Check if user is already an organizer
        const user = await userModel.findById(id);
        if (user.role === 'organizer') {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã là người tổ chức sự kiện',
            });
        }

        // Create upgrade request
        const upgradeRequest = new upgradeRequestModel({
            userId: id,
            organization,
            agree,
        });

        await upgradeRequest.save();

        logger.info(`Upgrade request created for user: ${id}`);
        res.status(201).json({
            success: true,
            message:
                'Yêu cầu nâng cấp đã được gửi thành công! Vui lòng chờ xem xét.',
        });
    } catch (error) {
        logger.error('Create upgrade request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Get upgrade requests (admin only)
const getUpgradeRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const startIndex = (page - 1) * limit;

        const query = {};
        if (status !== 'all') {
            query.status = status;
        }

        const upgradeRequests = await upgradeRequestModel
            .find(query)
            .populate('userId', 'email name')
            .populate('adminId', 'email name')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalRequests = await upgradeRequestModel.countDocuments(query);

        res.status(200).json({
            success: true,
            upgradeRequests,
            currentPage: page,
            totalPages: Math.ceil(totalRequests / limit),
            totalRequests,
        });
    } catch (error) {
        logger.error('Get upgrade requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Approve upgrade request (admin only)
const approveUpgradeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user.id;

        const upgradeRequest = await upgradeRequestModel.findById(requestId);
        if (!upgradeRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu nâng cấp',
            });
        }

        if (upgradeRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được xử lý',
            });
        }

        // Update user role to organizer
        await userModel.findByIdAndUpdate(upgradeRequest.userId, {
            role: 'organizer',
            organizer: upgradeRequest.organization,
            agree: upgradeRequest.agree,
        });

        // Update request status
        upgradeRequest.status = 'approved';
        upgradeRequest.adminId = adminId;
        await upgradeRequest.save();

        // Send email notification to user
        const user = await userModel.findById(upgradeRequest.userId);
        if (user) {
            await emailProvider.sendMail(
                user.email,
                'Melody Meet: Yêu cầu nâng cấp được duyệt',
                mailTemplate.upgradeApprovedTemplate(
                    upgradeRequest.organization.name,
                ),
            );
        }

        logger.info(`Upgrade request approved: ${requestId}`);
        res.status(200).json({
            success: true,
            message: 'Yêu cầu nâng cấp đã được duyệt thành công',
        });
    } catch (error) {
        logger.error('Approve upgrade request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Reject upgrade request (admin only)
const rejectUpgradeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminNote } = req.body;
        const adminId = req.user.id;

        const upgradeRequest = await upgradeRequestModel.findById(requestId);
        if (!upgradeRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu nâng cấp',
            });
        }

        if (upgradeRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được xử lý',
            });
        }

        // Update request status
        upgradeRequest.status = 'rejected';
        upgradeRequest.adminId = adminId;
        upgradeRequest.adminNote = adminNote;
        await upgradeRequest.save();

        // Send email notification to user
        const user = await userModel.findById(upgradeRequest.userId);
        if (user) {
            await emailProvider.sendMail(
                user.email,
                'Melody Meet: Yêu cầu nâng cấp bị từ chối',
                mailTemplate.upgradeRejectedTemplate(adminNote),
            );
        }

        logger.info(`Upgrade request rejected: ${requestId}`);
        res.status(200).json({
            success: true,
            message: 'Yêu cầu nâng cấp đã bị từ chối',
        });
    } catch (error) {
        logger.error('Reject upgrade request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Get user's upgrade request status
const getUserUpgradeRequest = async (req, res) => {
    try {
        const { id } = req.user;

        const upgradeRequest = await upgradeRequestModel
            .findOne({ userId: id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            upgradeRequest,
        });
    } catch (error) {
        logger.error('Get user upgrade request error:', error);
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
    getTotalUsers,
    getAllUsers,
    updateUser,
    getUserById,
    updateOrganizer,
    createUpgradeRequest,
    getUpgradeRequests,
    approveUpgradeRequest,
    rejectUpgradeRequest,
    getUserUpgradeRequest,
};
