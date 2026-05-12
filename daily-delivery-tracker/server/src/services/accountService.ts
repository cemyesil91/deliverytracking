import { prisma } from '../lib/prisma';
import { hashPassword } from './authService';
import { AppError } from '../lib/errors';
import type { Role } from '../types/index';

export interface AccountSummary {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateAccountData {
  username: string;
  password: string;
  role: Role;
}

export interface UpdateAccountData {
  role?: Role;
  isActive?: boolean;
}

/**
 * Return all user accounts without exposing passwordHash.
 */
export async function listAccounts(): Promise<AccountSummary[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return users as AccountSummary[];
}

/**
 * Create a new user account.
 *
 * Throws:
 *   USERNAME_TAKEN (409) — a user with the given username already exists
 */
export async function createAccount(data: CreateAccountData): Promise<AccountSummary> {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new AppError('USERNAME_TAKEN', 'A user with that username already exists', 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      role: data.role,
    },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user as AccountSummary;
}

/**
 * Update an existing user account's role and/or active status.
 *
 * Throws:
 *   NOT_FOUND (404) — no user with the given id exists
 */
export async function updateAccount(id: string, data: UpdateAccountData): Promise<AccountSummary> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user as AccountSummary;
}
