import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'event_images',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        // transformation: [{ width: 800, height: 600, crop: 'limit' }],
    },
});

// const uploadCloudProvider = multer({ storage });
const uploadCloudProvider = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadCloudProvider;
