import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('./authService', () => ({
  hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
}));

import { createAccount } from './accountService';
import { prisma } from '../lib/prisma';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('accountService.createAccount', () => {
  it('creates an account when username is unique', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'new-id',
      username: 'bob',
      role: 'DRIVER',
      isActive: true,
      createdAt: new Date(),
    });

    const result = await createAccount({ username: 'bob', password: 'pass', role: 'DRIVER' });
    expect(result.username).toBe('bob');
    expect(result.role).toBe('DRIVER');
  });

  it('throws USERNAME_TAKEN when username already exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      createAccount({ username: 'existing', password: 'pass', role: 'SELLER' })
    ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', statusCode: 409 });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 13: Duplicate username rejection
 * For any existing username, attempting to create an account with the same
 * username must return a conflict error and not create a duplicate record.
 */
describe('Property 13: Duplicate username rejection (accounts)', () => {
  it('always rejects duplicate usernames', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        async (username) => {
          // Simulate existing user
          mockFindUnique.mockResolvedValue({ id: 'existing-id', username });

          await expect(
            createAccount({ username, password: 'password', role: 'SELLER' })
          ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', statusCode: 409 });

          // create should never be called
          expect(mockCreate).not.toHaveBeenCalled();
          vi.clearAllMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
