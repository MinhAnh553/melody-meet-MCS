import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Document will be automatically deleted after 5 minutes
    },
});

const otpModel = mongoose.model('Otp', otpSchema);

export default otpModel;
