import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { deleteHotelImage, uploadHotelImage } from '../../shared/utils/cloudinary';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type CreateHotelInput = {
  name: string;
  address: string;
  description?: string;
};

type RequestUser = {
  id: string;
  role: Role;
};

async function getHotelForWrite(id: string, reqUser: RequestUser) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { admin: true },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  if (reqUser.role === Role.HOTEL_ADMIN && hotel.adminId !== reqUser.id) {
    throw new AppError('Access denied. You can only manage your own hotel.', 403);
  }

  return hotel;
}

export async function createHotel(userId: string, payload: CreateHotelInput, imageBuffer: Buffer) {
  const uploadedImage = await uploadHotelImage(imageBuffer);

  try {
  return prisma.hotel.create({
    data: {
      adminId: userId,
      name: payload.name,
      address: payload.address,
      description: payload.description,
      imageUrl: uploadedImage.imageUrl,
      imagePublicId: uploadedImage.publicId,
    },
    include: { admin: true },
  });
  } catch (error) {
    await deleteHotelImage(uploadedImage.publicId);
    throw error;
  }
}

export async function listHotels(query: Record<string, unknown>, reqUser?: RequestUser) {
  const { page, limit, skip } = parsePagination(query);
  const where = reqUser?.role === Role.HOTEL_ADMIN ? { adminId: reqUser.id } : undefined;

  const [items, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    }),
    prisma.hotel.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function getHotelById(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { admin: true },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  return hotel;
}

export async function updateHotel(
  id: string,
  payload: Partial<CreateHotelInput>,
  reqUser: RequestUser,
  imageBuffer?: Buffer,
) {
  const existingHotel = await getHotelForWrite(id, reqUser);
  let nextImage: { imageUrl: string; publicId: string } | null = null;

  if (imageBuffer) {
    nextImage = await uploadHotelImage(imageBuffer);
  }

  const data: Prisma.HotelUpdateInput = {
    ...payload,
    ...(nextImage && {
      imageUrl: nextImage.imageUrl,
      imagePublicId: nextImage.publicId,
    }),
  };

  try {
    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data,
      include: { admin: true },
    });

    if (nextImage && existingHotel.imagePublicId) {
      await deleteHotelImage(existingHotel.imagePublicId);
    }

    return updatedHotel;
  } catch (error) {
    if (nextImage) {
      await deleteHotelImage(nextImage.publicId);
    }
    throw error;
  }
}

export async function removeHotel(id: string, reqUser: RequestUser) {
  const existingHotel = await getHotelForWrite(id, reqUser);
  await prisma.hotel.delete({ where: { id } });
  if (existingHotel.imagePublicId) {
    await deleteHotelImage(existingHotel.imagePublicId);
  }
}
