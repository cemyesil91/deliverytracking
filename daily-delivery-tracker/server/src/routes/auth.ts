import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService';

const router = Router();

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * POST /auth/login
 * Authenticate user, return access token, set refresh token cookie.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.login(username, password);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Invalidate refresh token, clear cookie.
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (token) {
      await authService.logout(token);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/refresh
 * Issue a new access token using the refresh token cookie.
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!token) {
      res.status(401).json({ error: 'MISSING_TOKEN', message: 'No refresh token provided' });
      return;
    }

    const { accessToken } = await authService.refreshToken(token);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
});

export default router;
