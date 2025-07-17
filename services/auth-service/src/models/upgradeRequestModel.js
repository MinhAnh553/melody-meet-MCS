import mongoose from 'mongoose';

const upgradeRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organization: {
            name: { type: String, required: true },
            tax: { type: String },
            website: { type: String },
            description: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            logo: { type: String },
            logoMediaId: { type: String },
            licenseUrl: { type: String },
            licenseMediaId: { type: String },
            accountName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            bankName: { type: String, required: true },
        },
        agree: { type: Boolean, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        adminNote: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const upgradeRequestModel = mongoose.model(
    'UpgradeRequest',
    upgradeRequestSchema,
);

export default upgradeRequestModel;
