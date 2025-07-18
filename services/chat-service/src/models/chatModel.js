import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        response: { type: String, required: true },
        events: [
            {
                eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
                name: String,
                // Add more event fields as needed
            }
        ],
    },
    { timestamps: true },
);

const chatModel = mongoose.model('Chat', chatSchema);

export default chatModel;
