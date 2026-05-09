import { Prisma, Role, RoomType } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { deleteRoomImage, uploadRoomImage } from '../../shared/utils/cloudinary';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type RequestUser = {
  id: string;
  role: Role;
};

type CreateRoomsInput = {
  roomNumber: string;
  type: RoomType;
  price: number;
  capacity: number;
  floor: number;
  description?: string;
  amenities: string[];
  isAvailable?: boolean;
  quantity: number;
};

type UpdateRoomInput = {
  type?: RoomType;
  price?: number;
  capacity?: number;
  floor?: number;
  description?: string;
  amenities?: string[];
  isAvailable?: boolean;
};

function splitRoomNumber(roomNumber: string): { prefix: string; number: number } {
  const match = roomNumber.match(/^(.*?)(\d+)$/);

  if (!match) {
    throw new AppError('roomNumber must end with a numeric part for bulk creation.', 422);
  }

  return {
    prefix: match[1],
    number: Number(match[2]),
  };
}

function buildRoomNumbers(baseRoomNumber: string, quantity: number): string[] {
  if (quantity === 1) {
    return [baseRoomNumber];
  }

  const { prefix, number } = splitRoomNumber(baseRoomNumber);
  return Array.from({ length: quantity }, (_, index) => `${prefix}${number + index}`);
}

async function assertHotelAccess(hotelId: string, reqUser: RequestUser) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  if (reqUser.role === Role.HOTEL_ADMIN && hotel.adminId !== reqUser.id) {
    throw new AppError('Access denied. You can only manage rooms in your own hotel.', 403);
  }

  return hotel;
}

export async function createRooms(hotelId: string, payload: CreateRoomsInput, reqUser: RequestUser, imageBuffer?: Buffer) {
  await assertHotelAccess(hotelId, reqUser);

  const roomNumbers = buildRoomNumbers(payload.roomNumber, payload.quantity);
  const existing = await prisma.room.findMany({
    where: {
      hotelId,
      roomNumber: { in: roomNumbers },
    },
    select: { roomNumber: true },
  });

  if (existing.length > 0) {
    const taken = existing.map((item) => item.roomNumber).join(', ');
    throw new AppError(`Room number already exists for this hotel: ${taken}`, 409);
  }

  let uploadedImage: { imageUrl: string; publicId: string } | null = null;

  if (imageBuffer) {
    uploadedImage = await uploadRoomImage(imageBuffer);
  }

  const roomsData: Prisma.RoomCreateManyInput[] = roomNumbers.map((number) => ({
    hotelId,
    roomNumber: number,
    type: payload.type,
    price: payload.price,
    capacity: payload.capacity,
    floor: payload.floor,
    description: payload.description,
    amenities: payload.amenities,
    isAvailable: payload.isAvailable ?? true,
    imageUrl: uploadedImage?.imageUrl,
    imagePublicId: uploadedImage?.publicId,
  }));

  try {
    await prisma.room.createMany({ data: roomsData });

    return prisma.room.findMany({
      where: {
        hotelId,
        roomNumber: { in: roomNumbers },
      },
      orderBy: { roomNumber: 'asc' },
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteRoomImage(uploadedImage.publicId);
    }
    throw error;
  }
}

export async function listRoomsByHotel(hotelId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where: Prisma.RoomWhereInput = {
    hotelId,
    ...(query.type && typeof query.type === 'string' ? { type: query.type as RoomType } : {}),
    ...(query.isAvailable === 'true' ? { isAvailable: true } : {}),
    ...(query.isAvailable === 'false' ? { isAvailable: false } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function listRoomsByHotelIds(hotelIds: string[], query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where: Prisma.RoomWhereInput = {
    hotelId: { in: hotelIds },
    ...(query.type && typeof query.type === 'string' ? { type: query.type as RoomType } : {}),
    ...(query.isAvailable === 'true' ? { isAvailable: true } : {}),
    ...(query.isAvailable === 'false' ? { isAvailable: false } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}


export async function updateRoom(
  hotelId: string,
  roomId: string,
  payload: UpdateRoomInput,
  reqUser: RequestUser,
  imageBuffer?: Buffer,
) {
  await assertHotelAccess(hotelId, reqUser);

  const existingRoom = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
  });

  if (!existingRoom) {
    throw new AppError('Room not found', 404);
  }

  let nextImage: { imageUrl: string; publicId: string } | null = null;
  if (imageBuffer) {
    nextImage = await uploadRoomImage(imageBuffer);
  }

  const data: Prisma.RoomUpdateInput = {
    ...payload,
    ...(nextImage && {
      imageUrl: nextImage.imageUrl,
      imagePublicId: nextImage.publicId,
    }),
  };

  try {
    const updated = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    if (nextImage && existingRoom.imagePublicId) {
      await deleteRoomImage(existingRoom.imagePublicId);
    }

    return updated;
  } catch (error) {
    if (nextImage) {
      await deleteRoomImage(nextImage.publicId);
    }
    throw error;
  }
}

export async function removeRoom(hotelId: string, roomId: string, reqUser: RequestUser) {
  await assertHotelAccess(hotelId, reqUser);

  const existingRoom = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
  });

  if (!existingRoom) {
    throw new AppError('Room not found', 404);
  }

  await prisma.room.delete({ where: { id: roomId } });

  if (existingRoom.imagePublicId) {
    await deleteRoomImage(existingRoom.imagePublicId);
  }
}
