import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        userId: String,
        buyerInfo: {
            name: String,
            email: String,
            phone: String,
        },
        eventId: mongoose.Schema.Types.ObjectId,
        orderId: String,
        totalPrice: Number,
        status: {
            type: String,
            // enum: ['pending', 'paid', 'cancell'],
            default: 'pending',
        },
        expiredAt: Date,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

const orderModel = mongoose.model('Order', orderSchema);

export default orderModel;
