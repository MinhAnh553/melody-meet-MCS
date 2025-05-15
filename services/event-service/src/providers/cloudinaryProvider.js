import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// Multer storage configuration
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'event_images',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

// Multer upload configuration
const uploadCloudProvider = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Utility functions for Cloudinary operations
export const deleteCloudinaryImage = async (imagePath) => {
    try {
        // Extract public_id from the image path
        const publicId = imagePath.split('/').slice(-1)[0].split('.')[0];
        const result = await cloudinary.uploader.destroy(
            `event_images/${publicId}`,
        );
        logger.info(`Successfully deleted image from Cloudinary: ${publicId}`);
        return result;
    } catch (error) {
        logger.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

export const deleteMultipleCloudinaryImages = async (imagePaths) => {
    try {
        const deletePromises = imagePaths.map((path) =>
            deleteCloudinaryImage(path),
        );
        await Promise.all(deletePromises);
        logger.info('Successfully deleted multiple images from Cloudinary');
    } catch (error) {
        logger.error('Error deleting multiple images from Cloudinary:', error);
        throw error;
    }
};

export default uploadCloudProvider;
