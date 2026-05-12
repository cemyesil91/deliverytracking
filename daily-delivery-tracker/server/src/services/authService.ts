import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/index';

/**
 * In-memory store of valid refresh tokens.
 * Supports logout/invalidation by removing tokens from this set.
 * In a production system this would be backed by Redis or a DB table.
 */
const validRefreshTokens = new Set<string>();

/**
 * Authenticate a user by username and password.
 * Returns a pair of access and refresh tokens on success.
 *
 * Throws:
 *   ACCOUNT_DISABLED (403) — user exists but isActive is false
 *   INVALID_CREDENTIALS (401) — username not found or password mismatch
 */
export async function login(
  username: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('ACCOUNT_DISABLED', 'This account has been deactivated', 403);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password', 401);
  }

  const authUser: AuthUser = { id: user.id, username: user.username, role: user.role };
  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);

  validRefreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
}

/**
 * Issue a new access token given a valid refresh token.
 *
 * Throws:
 *   INVALID_TOKEN (401) — token is invalid, expired, or not in the valid set
 */
export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  if (!validRefreshTokens.has(token)) {
    throw new AppError('INVALID_TOKEN', 'Refresh token is invalid or has been revoked', 401);
  }

  // verifyRefreshToken throws INVALID_TOKEN if the JWT itself is bad/expired
  const user = verifyRefreshToken(token);

  const accessToken = generateAccessToken(user);
  return { accessToken };
}

/**
 * Invalidate a refresh token (logout).
 * Silently succeeds even if the token was not in the valid set.
 */
export async function logout(token: string): Promise<void> {
  validRefreshTokens.delete(token);
}

/**
 * Hash a plain-text password using bcrypt.
 * Exported for use in account creation (seed, account service).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Exposed for testing purposes only — allows clearing the token store between tests.
 * @internal
 */
export function _clearRefreshTokenStore(): void {
  validRefreshTokens.clear();
}
