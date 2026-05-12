export interface PaginationDto {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationDto,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

export function getPaginationOffset({ page, limit }: PaginationDto): number {
  return (page - 1) * limit;
}

export function normalizePagination(
  partial: Partial<PaginationDto>,
  maxLimit = 100,
): PaginationDto {
  // Guard against NaN: Math.max(1, NaN) === NaN which would break Prisma skip/take
  const rawPage = partial.page;
  const rawLimit = partial.limit;
  const page = Math.max(1, Number.isFinite(rawPage) ? (rawPage as number) : 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.isFinite(rawLimit) ? (rawLimit as number) : 20));
  return { page, limit, sortBy: partial.sortBy, sortOrder: partial.sortOrder ?? 'desc' };
}
