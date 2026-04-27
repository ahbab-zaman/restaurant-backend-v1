import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type CreateBookingInput = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  notes?: string;
};

export async function createBooking(userId: string, payload: CreateBookingInput) {
  if (payload.checkIn >= payload.checkOut) {
    throw new AppError('checkOut must be after checkIn', 422);
  }

  const room = await prisma.room.findUnique({ where: { id: payload.roomId } });
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (!room.isAvailable) {
    throw new AppError('Room is not available', 400);
  }

  if (payload.guestCount > room.capacity) {
    throw new AppError('Guest count exceeds room capacity', 400);
  }

  const overlap = await prisma.booking.findFirst({
    where: {
      roomId: payload.roomId,
      status: { in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED] },
      checkIn: { lt: payload.checkOut },
      checkOut: { gt: payload.checkIn },
    },
  });

  if (overlap) {
    throw new AppError('Room is already booked for selected dates', 409);
  }

  const nights = Math.ceil((payload.checkOut.getTime() - payload.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * room.price;

  return prisma.booking.create({
    data: {
      userId,
      roomId: payload.roomId,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      guestCount: payload.guestCount,
      notes: payload.notes,
      totalPrice,
      status: BookingStatus.AWAITING_PAYMENT,
    },
    include: { room: true },
  });
}

export async function listMyBookings(userId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where: Prisma.BookingWhereInput = { userId };

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { room: true, payment: true },
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function listAllBookings(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { room: true, payment: true, user: true },
    }),
    prisma.booking.count(),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  return prisma.booking.update({
    where: { id },
    data: { status },
    include: { room: true, payment: true },
  });
}