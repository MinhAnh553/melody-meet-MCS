import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
    {
        ticketCode: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        ticketTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TicketType',
        },
        used: { type: Boolean, default: false },
        usedAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

const ticketModel = mongoose.model('Ticket', ticketSchema);

export default ticketModel;
