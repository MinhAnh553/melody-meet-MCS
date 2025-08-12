import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: { type: String, required: true },
        response: { type: String },
        events: [
            {
                eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
                name: String,
                background: String,
                location: {
                    venueName: String,
                    district: String,
                    province: String,
                },
                startTime: Date,
                organizer: {
                    name: String,
                },
                status: String,
            },
        ],
    },
    { timestamps: true },
);

const chatModel = mongoose.model('Chat', chatSchema);

export default chatModel;
