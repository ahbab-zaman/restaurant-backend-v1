import { BookingStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.CONFIRMED,
];
const INCLUDED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];
const REVENUE_BOOKING_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED];

type DashboardScope = {
  bookingWhere: Prisma.BookingWhereInput;
  roomWhere: Prisma.RoomWhereInput;
  hotelWhere: Prisma.HotelWhereInput;
};
type DashboardPeriodOptions = {
  months?: number;
  offset?: number;
};

function buildScope(userId: string, role: Role): DashboardScope {
  if (role === Role.HOTEL_ADMIN) {
    return {
      bookingWhere: { room: { hotel: { adminId: userId } } },
      roomWhere: { hotel: { adminId: userId } },
      hotelWhere: { adminId: userId },
    };
  }

  return {
    bookingWhere: {},
    roomWhere: {},
    hotelWhere: {},
  };
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export async function getDashboardOverview(userId: string, role: Role, options?: DashboardPeriodOptions) {
  const scope = buildScope(userId, role);
  const now = new Date();
  const requestedMonths = Math.trunc(options?.months ?? 6);
  const requestedOffset = Math.trunc(options?.offset ?? 0);
  const months = Math.min(Math.max(requestedMonths, 1), 24);
  const offset = Math.max(requestedOffset, 0);
  const currentMonthStart = startOfMonth(now);
  const anchorMonthStart = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() - offset, 1, 0, 0, 0, 0));
  const nextMonthStart = endOfMonth(anchorMonthStart);
  const chartStart = new Date(Date.UTC(anchorMonthStart.getUTCFullYear(), anchorMonthStart.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0));

  const [
    totalBookings,
    totalRooms,
    totalHotels,
    totalGuestsAggregate,
    totalRevenueAggregate,
    monthlyRevenueBookings,
    monthlyGuestBookings,
    recentBookings,
    todayCheckIns,
    todayCheckOuts,
    activeBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        ...scope.bookingWhere,
      },
    }),
    prisma.room.count({ where: scope.roomWhere }),
    prisma.hotel.count({ where: scope.hotelWhere }),
    prisma.booking.aggregate({
      where: {
        ...scope.bookingWhere,
        status: { in: INCLUDED_BOOKING_STATUSES },
      },
      _sum: { guestCount: true },
    }),
    prisma.booking.aggregate({
      where: {
        ...scope.bookingWhere,
        status: { in: REVENUE_BOOKING_STATUSES },
      },
      _sum: { totalPrice: true },
    }),
    prisma.booking.findMany({
      where: {
        ...scope.bookingWhere,
        status: { in: REVENUE_BOOKING_STATUSES },
        updatedAt: { gte: chartStart, lt: nextMonthStart },
      },
      select: { totalPrice: true, updatedAt: true },
    }),
    prisma.booking.findMany({
      where: {
        ...scope.bookingWhere,
        status: { in: INCLUDED_BOOKING_STATUSES },
        createdAt: { gte: chartStart },
      },
      select: { guestCount: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: scope.bookingWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        guestCount: true,
        user: { select: { name: true, email: true } },
        room: {
          select: {
            roomNumber: true,
            hotel: { select: { name: true } },
          },
        },
      },
    }),
    prisma.booking.count({
      where: {
        ...scope.bookingWhere,
        status: { in: INCLUDED_BOOKING_STATUSES },
        checkIn: {
          gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)),
          lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)),
        },
      },
    }),
    prisma.booking.count({
      where: {
        ...scope.bookingWhere,
        status: { in: INCLUDED_BOOKING_STATUSES },
        checkOut: {
          gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)),
          lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)),
        },
      },
    }),
    prisma.booking.count({
      where: {
        ...scope.bookingWhere,
        status: { in: ACTIVE_BOOKING_STATUSES },
      },
    }),
  ]);

  const monthlyMap = new Map<string, { month: string; revenue: number; guests: number }>();
  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = new Date(Date.UTC(anchorMonthStart.getUTCFullYear(), anchorMonthStart.getUTCMonth() - i, 1));
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const month = monthDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    monthlyMap.set(key, { month, revenue: 0, guests: 0 });
  }

  monthlyRevenueBookings.forEach((booking) => {
    const key = `${booking.updatedAt.getUTCFullYear()}-${String(booking.updatedAt.getUTCMonth() + 1).padStart(2, '0')}`;
    const item = monthlyMap.get(key);
    if (item) {
      item.revenue += booking.totalPrice;
    }
  });

  monthlyGuestBookings.forEach((booking) => {
    const key = `${booking.createdAt.getUTCFullYear()}-${String(booking.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
    const item = monthlyMap.get(key);
    if (item) {
      item.guests += booking.guestCount;
    }
  });

  const monthlyStats = Array.from(monthlyMap.values()).map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(2)),
  }));

  const monthlyRevenue = monthlyStats.reduce((sum, item) => sum + item.revenue, 0);
  const currentMonthRevenue = monthlyStats[monthlyStats.length - 1]?.revenue ?? 0;
  const previousMonthRevenue = monthlyStats[monthlyStats.length - 2]?.revenue ?? 0;
  const revenueGrowthPercentage =
    previousMonthRevenue > 0
      ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(2))
      : currentMonthRevenue > 0
        ? 100
        : 0;

  const occupancyRate = totalRooms > 0 ? Number(((activeBookings / totalRooms) * 100).toFixed(2)) : 0;

  return {
    role,
    totals: {
      totalGuests: totalGuestsAggregate._sum.guestCount ?? 0,
      totalRevenue: Number((totalRevenueAggregate._sum.totalPrice ?? 0).toFixed(2)),
      totalBookings,
      totalRooms,
      totalHotels,
      occupancyRate,
      activeBookings,
      todayCheckIns,
      todayCheckOuts,
    },
    trends: {
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      currentMonthRevenue: Number(currentMonthRevenue.toFixed(2)),
      previousMonthRevenue: Number(previousMonthRevenue.toFixed(2)),
      revenueGrowthPercentage,
    },
    monthlyStats,
    period: {
      chartFrom: chartStart.toISOString(),
      chartTo: nextMonthStart.toISOString(),
      currentMonthFrom: currentMonthStart.toISOString(),
    },
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      guestName: booking.user.name,
      guestEmail: booking.user.email,
      hotelName: booking.room.hotel.name,
      roomNumber: booking.room.roomNumber,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      createdAt: booking.createdAt,
    })),
  };
}
