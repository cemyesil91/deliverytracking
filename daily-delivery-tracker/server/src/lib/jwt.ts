import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/index';
import { AppError } from './errors';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET environment variable is not set');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return secret;
}

export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload & AuthUser;
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired access token', 401);
  }
}

export function verifyRefreshToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload & AuthUser;
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
  }
}
