import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function listUsers(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: safeUserSelect,
    }),
    prisma.user.count(),
  ]);

  return {
    items: data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function updateMyProfile(userId: string, payload: { name: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
    },
    select: safeUserSelect,
  });
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: safeUserSelect,
  });
}