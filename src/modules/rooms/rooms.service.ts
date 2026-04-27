import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type CreateRoomInput = {
  hotelId: string;
  name: string;
  type: Prisma.RoomCreateInput['type'];
  price: number;
  capacity: number;
  images: string[];
  isAvailable?: boolean;
  description?: string;
};

export async function createRoom(payload: CreateRoomInput) {
  return prisma.room.create({
    data: {
      hotelId: payload.hotelId,
      name: payload.name,
      type: payload.type,
      price: payload.price,
      capacity: payload.capacity,
      images: payload.images,
      isAvailable: payload.isAvailable ?? true,
      description: payload.description,
    },
  });
}

export async function listRooms(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where: Prisma.RoomWhereInput = {
    isAvailable: query.available === 'false' ? undefined : true,
  };

  const [items, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { hotel: true },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { hotel: true },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  return room;
}

export async function updateRoom(id: string, payload: Partial<CreateRoomInput>) {
  return prisma.room.update({
    where: { id },
    data: payload,
  });
}

export async function removeRoom(id: string) {
  await prisma.room.delete({ where: { id } });
}