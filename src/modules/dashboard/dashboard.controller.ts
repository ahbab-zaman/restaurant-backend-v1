import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { AppError } from '../../shared/utils/app-error';
import { getDashboardOverview } from './dashboard.service';

export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const monthsParam = Number(req.query.months);
    const offsetParam = Number(req.query.offset);

    const months = Number.isFinite(monthsParam) ? monthsParam : undefined;
    const offset = Number.isFinite(offsetParam) ? offsetParam : undefined;

    const data = await getDashboardOverview(req.user.id, req.user.role, { months, offset });
    sendSuccess(res, data, 200, 'Dashboard overview fetched');
  } catch (error) {
    next(error);
  }
}
