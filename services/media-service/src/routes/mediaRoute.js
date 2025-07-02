import express from 'express';
import multer from 'multer';
import mediaController from '../controllers/mediaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import logger from '../utils/logger.js';

const Router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
}).single('file');

// Upload media
Router.route('/upload').post(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    (req, res, next) => {
        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                logger.error('Multer error while uploading: ', err);
                return res.status(400).json({
                    message: 'Muler error while uploading:',
                    error: err.message,
                    stack: err.stack,
                });
            } else if (err) {
                logger.error('Unknown error occured while uploading: ', err);
                return res.status(500).json({
                    message: 'Unknown error occured while uploading:',
                    error: err.message,
                    stack: err.stack,
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: 'Not file found!',
                });
            }

            next();
        });
    },
    mediaController.uploadMedia,
);

Router.route('/get').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    mediaController.getAllMedias,
);

Router.route('/delete/:mediaId').delete(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    mediaController.deleteMedia,
);

export default Router;
