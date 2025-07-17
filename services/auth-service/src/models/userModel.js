import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: String,
        phone: String,
        email: String,
        password: String,
        role: {
            type: String,
            default: 'client',
        },
        status: {
            type: String,
            default: 'active',
        },
        organizer: {
            name: { type: String },
            tax: { type: String },
            website: { type: String },
            description: { type: String },
            email: { type: String },
            phone: { type: String },
            logo: { type: String },
            logoMediaId: { type: String },
            licenseUrl: { type: String },
            licenseMediaId: { type: String },
            accountName: { type: String },
            accountNumber: { type: String },
            bankName: { type: String },
            agree: { type: Boolean },
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: Date,
    },
    {
        timestamps: true,
    },
);

const userModel = mongoose.model('User', userSchema);

export default userModel;
