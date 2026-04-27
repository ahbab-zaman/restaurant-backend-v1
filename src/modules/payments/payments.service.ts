import { BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { stripe } from './stripe.client';

export async function createPaymentIntent(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.payment) {
    throw new AppError('Payment already exists for this booking', 409);
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

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;

    const payment = await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: PaymentStatus.FAILED },
    });

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.REJECTED },
    });
  }

  return { received: true };
}