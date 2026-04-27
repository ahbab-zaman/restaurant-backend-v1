import { z } from 'zod';
import { RoomType } from '@prisma/client';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
};

export const createRoomSchema = z.object({
  hotelId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  type: z.nativeEnum(RoomType),
  price: z.number().positive(),
  capacity: z.number().int().positive(),
  images: z.preprocess(toArray, z.array(z.string().url()).default([])),
  isAvailable: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();