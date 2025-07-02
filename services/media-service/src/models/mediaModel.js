import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
    {
        publicId: String,
        originalName: String,
        mimeType: String,
        url: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const mediaModel = mongoose.model('Media', mediaSchema);

export default mediaModel;
