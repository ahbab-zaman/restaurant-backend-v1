import bcrypt from 'bcryptjs';
import { PrismaClient, Role, RoomType } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [adminPassword, managerPassword, guestPassword] = await Promise.all([
    bcrypt.hash('Super123@', 12),
    bcrypt.hash('Hotel123', 12),
    bcrypt.hash('Guest123', 12),
  ]);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@admin.com' },
    update: { name: 'MR Super Admin', passwordHash: adminPassword, role: Role.SUPER_ADMIN },
    create: {
      name: 'MR Super Admin',
      email: 'super@admin.com',
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  const hotelAdmin = await prisma.user.upsert({
    where: { email: 'hotel@admin.com' },
    update: { name: 'Hotel Manager', passwordHash: managerPassword, role: Role.HOTEL_ADMIN },
    create: {
      name: 'Hotel Manager',
      email: 'hotel@admin.com',
      passwordHash: managerPassword,
      role: Role.HOTEL_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'guest@gmail.com' },
    update: { name: 'Guest User', passwordHash: guestPassword, role: Role.GUEST },
    create: {
      name: 'Guest User',
      email: 'guest@gmail.com',
      passwordHash: guestPassword,
      role: Role.GUEST,
    },
  });

  const hotel = await prisma.hotel.create({
    data: {
      adminId: hotelAdmin.id,
      name: 'Grand Horizon Hotel',
      address: '123 Downtown Avenue, Dhaka',
      description: 'Luxury city-center hotel for business and leisure stays.',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      imagePublicId: 'sample',
    },
  });

  const rooms = [
    { name: 'Single Comfort', type: RoomType.SINGLE, price: 80, capacity: 1 },
    { name: 'Double Standard', type: RoomType.DOUBLE, price: 120, capacity: 2 },
    { name: 'Family Suite', type: RoomType.SUITE, price: 220, capacity: 4 },
    { name: 'Deluxe Panorama', type: RoomType.DELUXE, price: 320, capacity: 3 },
    { name: 'Sky Penthouse', type: RoomType.PENTHOUSE, price: 500, capacity: 5 },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { hotelId_name: { hotelId: hotel.id, name: room.name } },
      update: {
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        images: [],
        isAvailable: true,
      },
      create: {
        hotelId: hotel.id,
        name: room.name,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        images: [],
        isAvailable: true,
      },
    });
  }

  console.log(`Seed complete. Super admin id: ${superAdmin.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
