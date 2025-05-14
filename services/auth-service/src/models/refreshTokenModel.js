import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: Date.now,
            expires: '7d',
        },
    },
    { timestamps: true },
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
