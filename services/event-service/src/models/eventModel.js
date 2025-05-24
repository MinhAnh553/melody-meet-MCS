import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        background: {
            type: String,
            required: true,
        },
        location: {
            venueName: { type: String, required: true },
            province: { type: String, required: true },
            district: { type: String, required: true },
            ward: { type: String, required: true },
            address: { type: String, required: true },
        },
        description: {
            type: String,
            required: true,
        },
        organizer: {
            logo: { type: String, required: true },
            name: { type: String, required: true },
            info: { type: String, required: true },
        },
        // ticketTypes: [
        //     {
        //         name: { type: String, required: true }, // Tên vé
        //         price: { type: Number, required: true }, // Giá vé
        //         totalQuantity: { type: Number, required: true }, // Tổng số lượng vé
        //         maxPerUser: { type: Number, required: true }, // Số vé tối đa mà 1 người có thể mua
        //         description: { type: String }, // Thông tin vé
        //     },
        // ],
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'event_over'],
            default: 'pending',
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true },
);

const eventModel = mongoose.model('Event', eventSchema);

export default eventModel;
