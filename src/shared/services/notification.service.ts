import { NotificationType, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { sendMail } from './mailer';

type BookingNotificationInput = {
  bookingId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  hotelName?: string | null;
  roomNumber?: string | null;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
};

type PaymentStatusNotificationInput = {
  bookingId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  paymentStatus: PaymentStatus;
};

function fmtDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function isMissingNotificationsTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2021' &&
    String(error.message).includes('notifications')
  );
}

export async function notifyBookingCreated(input: BookingNotificationInput) {
  const subject = `Booking confirmed in system: ${input.bookingId}`;
  const message = [
    `Hi ${input.userName || 'Guest'},`,
    '',
    'Your booking has been created successfully.',
    `Booking ID: ${input.bookingId}`,
    `Hotel: ${input.hotelName || 'N/A'}`,
    `Room: ${input.roomNumber || 'N/A'}`,
    `Check-in: ${fmtDate(input.checkIn)}`,
    `Check-out: ${fmtDate(input.checkOut)}`,
    `Total: $${input.totalPrice.toFixed(2)}`,
  ].join('\n');

  let notificationId: string | null = null;
  try {
    const notification = await prisma.notification.create({
      data: {
        bookingId: input.bookingId,
        userId: input.userId,
        type: NotificationType.BOOKING_CREATED,
        subject,
        message,
      },
    });
    notificationId = notification.id;
  } catch (error) {
    if (!isMissingNotificationsTableError(error)) {
      console.error('Failed to create booking notification record', error);
    }
  }

  try {
    await sendMail({ to: input.userEmail, subject, text: message });
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  } catch (error) {
    if (notificationId) {
      const messageError = error instanceof Error ? error.message : 'Unknown email error';
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', error: messageError },
      });
    }
  }
}

export async function notifyPaymentStatusChanged(input: PaymentStatusNotificationInput) {
  const subject = `Payment status updated: ${input.bookingId}`;
  const message = [
    `Hi ${input.userName || 'Guest'},`,
    '',
    `Your payment status for booking ${input.bookingId} is now: ${input.paymentStatus}.`,
  ].join('\n');

  let notificationId: string | null = null;
  try {
    const notification = await prisma.notification.create({
      data: {
        bookingId: input.bookingId,
        userId: input.userId,
        type: NotificationType.PAYMENT_STATUS_CHANGED,
        subject,
        message,
      },
    });
    notificationId = notification.id;
  } catch (error) {
    if (!isMissingNotificationsTableError(error)) {
      console.error('Failed to create payment notification record', error);
    }
  }

  try {
    await sendMail({ to: input.userEmail, subject, text: message });
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  } catch (error) {
    if (notificationId) {
      const messageError = error instanceof Error ? error.message : 'Unknown email error';
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', error: messageError },
      });
    }
  }
}
