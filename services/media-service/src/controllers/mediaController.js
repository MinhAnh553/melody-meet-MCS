import mediaModel from '../models/mediaModel.js';
import cloudinaryProvider from '../providers/cloudinaryProvider.js';
import logger from '../utils/logger.js';

const uploadMedia = async (req, res) => {
    logger.info(`Starting media upload`);
    try {
        if (!req.file) {
            logger.error('No file found. Please add a file and try again!');
            res.status(400).json({
                success: false,
                message: 'Không tìm thấy tệp nào. Vui lòng thêm tệp và thử lại',
            });
        }

        const { originalname, mimetype, buffer } = req.file;
        const userId = req.user._id;

        logger.info(`File details: name=${originalname}, type=${mimetype}`);
        logger.info('Uploading to cloudinary starting...');

        const cloudinaryUploadResult =
            await cloudinaryProvider.uploadMediaToCloudinary(req.file);
        logger.info(
            `Cloudinary upload successfully. Public Id: ${cloudinaryUploadResult.public_id}`,
        );

        const newlyCreatedMedia = new mediaModel({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUploadResult.secure_url,
            userId,
        });

        newlyCreatedMedia.save();

        res.status(200).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: 'Tải lên thành công!',
        });
    } catch (error) {
        logger.error('Upload media error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

const getAllMedias = async (req, res) => {
    try {
        const result = await mediaModel.find({ userId: req.user._id });

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cann't find any media for this user",
            });
        }

        res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        logger.error('Error fetching medias', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

const deleteMedia = async (req, res) => {
    const { mediaId } = req.params;
    try {
        await cloudinaryProvider.deleteMediaFromCloudinary(mediaId);
        await mediaModel.findOneAndDelete({
            mediaId,
        });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        logger.error('Error delete medias', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

export default {
    uploadMedia,
    getAllMedias,
    deleteMedia,
};
