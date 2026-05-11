import { BookingStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { notifyBookingCreated } from '../../shared/services/notification.service';
import { AppError } from '../../shared/utils/app-error';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type CreateBookingInput = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  notes?: string;
};

type AvailabilityInput = {
  roomId: string;
  startDate: Date;
  days: number;
};

type RoomAvailabilityDate = {
  date: string;
  isAvailable: boolean;
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

  const booking = await prisma.booking.create({
    data: {
      userId,
      roomId: payload.roomId,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      guestCount: payload.guestCount,
      notes: payload.notes,
      totalPrice,
      // Keep newly created bookings non-blocking until payment intent is initialized.
      status: BookingStatus.PENDING,
    },
    include: { room: { include: { hotel: true } }, user: true },
  });

  await notifyBookingCreated({
    bookingId: booking.id,
    userId: booking.userId,
    userEmail: booking.user.email,
    userName: booking.user.name,
    hotelName: booking.room.hotel.name,
    roomNumber: booking.room.roomNumber,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalPrice: booking.totalPrice,
  });

  return booking;
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
      include: { room: { include: { hotel: true } }, payment: true, user: true },
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

export async function getBookingById(id: string, userId: string, role: Role) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true, payment: true, user: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (role === Role.GUEST && booking.userId !== userId) {
    throw new AppError('Forbidden', 403);
  }

  return booking;
}

export async function listAllBookings(query: Record<string, unknown>, userId: string, role: Role) {
  const { page, limit, skip } = parsePagination(query);
  const where: Prisma.BookingWhereInput =
    role === Role.HOTEL_ADMIN
      ? {
          room: {
            hotel: {
              adminId: userId,
            },
          },
        }
      : {};

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { room: { include: { hotel: true } }, payment: true, user: true },
    }),
    prisma.booking.count({ where }),
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

export async function getRoomAvailabilityWindow(payload: AvailabilityInput) {
  const room = await prisma.room.findUnique({
    where: { id: payload.roomId },
    select: { id: true, isAvailable: true },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (!room.isAvailable) {
    return {
      roomId: payload.roomId,
      startDate: payload.startDate.toISOString(),
      days: payload.days,
      items: [] as RoomAvailabilityDate[],
    };
  }

  const start = new Date(payload.startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + payload.days + 1);

  const overlapping = await prisma.booking.findMany({
    where: {
      roomId: payload.roomId,
      status: { in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: 'asc' },
  });

  const items: RoomAvailabilityDate[] = [];

  for (let i = 0; i < payload.days; i += 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(start.getUTCDate() + i);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const isBlocked = overlapping.some(
      (booking) => booking.checkIn < dayEnd && booking.checkOut > dayStart,
    );

    items.push({
      date: dayStart.toISOString(),
      isAvailable: !isBlocked,
    });
  }

  return {
    roomId: payload.roomId,
    startDate: start.toISOString(),
    days: payload.days,
    items: items.filter((item) => item.isAvailable),
  };
}
