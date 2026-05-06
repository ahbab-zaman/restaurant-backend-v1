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

async function uploadImage(fileBuffer: Buffer, folder: string, errorMessage: string): Promise<UploadImageResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(errorMessage, 500));
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

export async function uploadHotelImage(fileBuffer: Buffer): Promise<UploadImageResult> {
  return uploadImage(fileBuffer, 'hotels', 'Failed to upload hotel image');
}

export async function uploadRoomImage(fileBuffer: Buffer): Promise<UploadImageResult> {
  return uploadImage(fileBuffer, 'rooms', 'Failed to upload room image');
}

export async function deleteHotelImage(publicId: string): Promise<void> {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

export async function deleteRoomImage(publicId: string): Promise<void> {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
