import multer from 'multer';
import { AppError } from '../utils/app-error';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxSizeInBytes = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

export const hotelImageUpload = multer({
  storage,
  limits: { fileSize: maxSizeInBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new AppError('Only JPG, PNG, and WEBP images are allowed.', 422));
      return;
    }

    cb(null, true);
  },
});
