import mongoose from 'mongoose';

const upgradeRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizer: {
            logo: { type: String },
            logoMediaId: { type: String },
            name: { type: String, required: true },
            info: { type: String },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
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
