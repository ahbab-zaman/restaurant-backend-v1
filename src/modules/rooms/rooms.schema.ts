import { z } from 'zod';
import { RoomType } from '@prisma/client';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  type: z.nativeEnum(RoomType),
  price: z.preprocess(toNumber, z.number().positive()),
  capacity: z.preprocess(toNumber, z.number().int().positive()),
  floor: z.preprocess(toNumber, z.number().int()),
  description: z.string().trim().max(1000).optional(),
  amenities: z.preprocess(toArray, z.array(z.string().trim().min(1)).default([])),
  isAvailable: z.boolean().optional(),
  quantity: z.preprocess(toNumber, z.number().int().min(1).max(50)),
});

export const updateRoomSchema = createRoomSchema.omit({ roomNumber: true, quantity: true }).partial();
