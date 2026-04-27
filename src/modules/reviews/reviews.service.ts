import { BookingStatus } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

type CreateReviewInput = {
  roomId: string;
  rating: number;
  comment?: string;
};

export async function createReview(userId: string, payload: CreateReviewInput) {
  const eligibleBooking = await prisma.booking.findFirst({
    where: {
      userId,
      roomId: payload.roomId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    },
  });

  if (!eligibleBooking) {
    throw new AppError('You can only review rooms you have booked', 403);
  }

  return prisma.review.create({
    data: {
      userId,
      roomId: payload.roomId,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: { user: true, room: true },
  });
}

export async function listRoomReviews(roomId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const where = { roomId };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items,
    meta: buildPaginationMeta(total, page, limit),
  };
}