"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const [adminPassword, managerPassword, guestPassword] = await Promise.all([
        bcryptjs_1.default.hash('Super123@', 12),
        bcryptjs_1.default.hash('Hotel123', 12),
        bcryptjs_1.default.hash('Guest123', 12),
    ]);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'super@admin.com' },
        update: { name: 'MR Super Admin', passwordHash: adminPassword, role: client_1.Role.SUPER_ADMIN },
        create: {
            name: 'MR Super Admin',
            email: 'super@admin.com',
            passwordHash: adminPassword,
            role: client_1.Role.SUPER_ADMIN,
        },
    });
    const hotelAdmin = await prisma.user.upsert({
        where: { email: 'hotel@admin.com' },
        update: { name: 'Hotel Manager', passwordHash: managerPassword, role: client_1.Role.HOTEL_ADMIN },
        create: {
            name: 'Hotel Manager',
            email: 'hotel@admin.com',
            passwordHash: managerPassword,
            role: client_1.Role.HOTEL_ADMIN,
        },
    });
    await prisma.user.upsert({
        where: { email: 'guest@gmail.com' },
        update: { name: 'Guest User', passwordHash: guestPassword, role: client_1.Role.GUEST },
        create: {
            name: 'Guest User',
            email: 'guest@gmail.com',
            passwordHash: guestPassword,
            role: client_1.Role.GUEST,
        },
    });
    const hotel = await prisma.hotel.upsert({
        where: { adminId: hotelAdmin.id },
        update: {
            name: 'Grand Horizon Hotel',
            address: '123 Downtown Avenue, Dhaka',
            description: 'Luxury city-center hotel for business and leisure stays.',
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            imagePublicId: 'sample',
        },
        create: {
            adminId: hotelAdmin.id,
            name: 'Grand Horizon Hotel',
            address: '123 Downtown Avenue, Dhaka',
            description: 'Luxury city-center hotel for business and leisure stays.',
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            imagePublicId: 'sample',
        },
    });
    const rooms = [
        { name: 'Single Comfort', type: client_1.RoomType.SINGLE, price: 80, capacity: 1 },
        { name: 'Double Standard', type: client_1.RoomType.DOUBLE, price: 120, capacity: 2 },
        { name: 'Family Suite', type: client_1.RoomType.SUITE, price: 220, capacity: 4 },
        { name: 'Deluxe Panorama', type: client_1.RoomType.DELUXE, price: 320, capacity: 3 },
        { name: 'Sky Penthouse', type: client_1.RoomType.PENTHOUSE, price: 500, capacity: 5 },
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
//# sourceMappingURL=seed.js.map