import { BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { notifyPaymentStatusChanged } from '../../shared/services/notification.service';
import { AppError } from '../../shared/utils/app-error';
import { stripe } from './stripe.client';

export async function createPaymentIntent(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.userId !== userId) {
    throw new AppError('Forbidden', 403);
  }

  if (booking.payment) {
    if (booking.payment.status === PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment already completed for this booking', 409);
    }

    try {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentId);

      if (existingIntent.client_secret) {
        if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.AWAITING_PAYMENT },
          });
        }

        return {
          payment: booking.payment,
          clientSecret: existingIntent.client_secret,
        };
      }
    } catch {
      // Fall through to create a fresh intent and relink the payment record.
    }

    const replacementIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: booking.id },
    });

    const updatedPayment = await prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        stripePaymentId: replacementIntent.id,
        amount: booking.totalPrice,
        status: PaymentStatus.PENDING,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.AWAITING_PAYMENT },
    });

    return {
      payment: updatedPayment,
      clientSecret: replacementIntent.client_secret,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId: booking.id },
  });

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      stripePaymentId: paymentIntent.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.AWAITING_PAYMENT },
  });

  return {
    payment,
    clientSecret: paymentIntent.client_secret,
  };
}

export async function processWebhook(body: Buffer, signature: string | undefined, webhookSecret: string) {
  if (!signature) {
    throw new AppError('Missing Stripe signature', 400);
  }

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    const payment = await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    const booking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: { user: true },
    });

    await notifyPaymentStatusChanged({
      bookingId: booking.id,
      userId: booking.userId,
      userEmail: booking.user.email,
      userName: booking.user.name,
      paymentStatus: PaymentStatus.SUCCEEDED,
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;

    const payment = await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: PaymentStatus.FAILED },
    });

    const booking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.REJECTED },
      include: { user: true },
    });

    await notifyPaymentStatusChanged({
      bookingId: booking.id,
      userId: booking.userId,
      userEmail: booking.user.email,
      userName: booking.user.name,
      paymentStatus: PaymentStatus.FAILED,
    });
  }

  return { received: true };
}

export async function updatePaymentStatusByAdmin(bookingId: string, status: PaymentStatus) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, user: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!booking.payment) {
    throw new AppError('Payment not found for booking', 404);
  }

  const payment = await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { status },
  });

  await notifyPaymentStatusChanged({
    bookingId: booking.id,
    userId: booking.userId,
    userEmail: booking.user.email,
    userName: booking.user.name,
    paymentStatus: status,
  });

  return payment;
}
