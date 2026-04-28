import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
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

export async function createHotel(userId: string, payload: CreateHotelInput) {
  const existingHotel = await prisma.hotel.findUnique({
    where: { adminId: userId },
    select: { id: true },
  });

  if (existingHotel) {
    throw new AppError('You already have a hotel', 409);
  }

  return prisma.hotel.create({
    data: {
      adminId: userId,
      name: payload.name,
      address: payload.address,
      description: payload.description,
    },
    include: { admin: true },
  });
}

export async function listHotels(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.hotel.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    }),
    prisma.hotel.count(),
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
) {
  await getHotelForWrite(id, reqUser);

  const data: Prisma.HotelUpdateInput = {
    ...payload,
  };

  return prisma.hotel.update({
    where: { id },
    data,
    include: { admin: true },
  });
}

export async function removeHotel(id: string, reqUser: RequestUser) {
  await getHotelForWrite(id, reqUser);
  await prisma.hotel.delete({ where: { id } });
}
