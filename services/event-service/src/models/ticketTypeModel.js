import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        totalQuantity: { type: Number, required: true },
        quantitySold: { type: Number, default: 0 }, // tăng khi order thành công
        maxPerUser: { type: Number, required: true },
        description: { type: String },
    },
    { timestamps: true },
);

const ticketTypeModel = mongoose.model('TicketType', ticketTypeSchema);

export default ticketTypeModel;
