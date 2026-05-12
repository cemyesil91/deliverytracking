import type { AuthUser } from './index';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
