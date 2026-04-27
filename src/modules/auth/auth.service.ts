import { AppError } from '../../shared/utils/app-error';

type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

export async function getCurrentUser(user?: CurrentUser): Promise<CurrentUser> {
  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  return user;
}