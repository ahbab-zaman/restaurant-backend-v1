import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/env';
import { AppError } from './app-error';

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

type UploadImageResult = {
  imageUrl: string;
  publicId: string;
};

export async function uploadHotelImage(fileBuffer: Buffer): Promise<UploadImageResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'hotels',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Failed to upload hotel image', 500));
          return;
        }

        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(fileBuffer);
  });
}

export async function deleteHotelImage(publicId: string): Promise<void> {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
