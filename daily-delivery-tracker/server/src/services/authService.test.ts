import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock prisma before importing authService
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock jwt to avoid needing real secrets
vi.mock('../lib/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
}));

import { login, _clearRefreshTokenStore } from './authService';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

async function makeActiveUser(username: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 1); // low rounds for test speed
  return {
    id: 'user-id-1',
    username,
    passwordHash,
    role: 'SELLER' as const,
    isActive: true,
    createdAt: new Date(),
  };
}

async function makeInactiveUser(username: string, password: string) {
  const user = await makeActiveUser(username, password);
  return { ...user, isActive: false };
}

beforeEach(() => {
  vi.clearAllMocks();
  _clearRefreshTokenStore();
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('authService.login', () => {
  it('returns tokens for valid credentials', async () => {
    const user = await makeActiveUser('alice', 'password123');
    mockFindUnique.mockResolvedValue(user);

    const result = await login('alice', 'password123');
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });

  it('throws INVALID_CREDENTIALS for unknown username', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(login('unknown', 'password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('throws INVALID_CREDENTIALS for wrong password', async () => {
    const user = await makeActiveUser('alice', 'correct-password');
    mockFindUnique.mockResolvedValue(user);
    await expect(login('alice', 'wrong-password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('throws ACCOUNT_DISABLED for inactive user', async () => {
    const user = await makeInactiveUser('alice', 'password123');
    mockFindUnique.mockResolvedValue(user);
    await expect(login('alice', 'password123')).rejects.toMatchObject({
      code: 'ACCOUNT_DISABLED',
      statusCode: 403,
    });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 12: Deactivated user cannot log in
 * For any user account with isActive: false, login must be rejected with an
 * authentication error (ACCOUNT_DISABLED, 403).
 */
describe('Property 12: Deactivated user cannot log in', () => {
  it('always rejects login for deactivated accounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 1, maxLength: 20 }),
          password: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ username, password }) => {
          const user = await makeInactiveUser(username, password);
          mockFindUnique.mockResolvedValue(user);

          await expect(login(username, password)).rejects.toMatchObject({
            code: 'ACCOUNT_DISABLED',
            statusCode: 403,
          });
        }
      ),
      { numRuns: 50 } // fewer runs since each involves bcrypt
    );
  });
});
