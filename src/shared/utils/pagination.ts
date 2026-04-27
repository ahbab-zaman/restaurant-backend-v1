export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(total: number, page: number, limit: number): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}