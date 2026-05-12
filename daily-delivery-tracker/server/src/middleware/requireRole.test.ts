import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { Request, Response, NextFunction } from 'express';
import { requireRole } from './requireRole';
import type { Role } from '../types/index';

const ALL_ROLES: Role[] = ['PLATFORM_ADMIN', 'DRIVER', 'SELLER'];

function makeReq(role: Role): Partial<Request> {
  return {
    user: { id: 'user-1', username: 'testuser', role },
  };
}

function makeRes(): Partial<Response> {
  return {};
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('requireRole middleware', () => {
  it('calls next() without error when role matches', () => {
    const next = vi.fn();
    const middleware = requireRole('PLATFORM_ADMIN');
    middleware(makeReq('PLATFORM_ADMIN') as Request, makeRes() as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith(); // called with no arguments = success
  });

  it('calls next(AppError 403) when role does not match', () => {
    const next = vi.fn();
    const middleware = requireRole('PLATFORM_ADMIN');
    middleware(makeReq('DRIVER') as Request, makeRes() as Response, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('calls next(AppError 401) when req.user is missing', () => {
    const next = vi.fn();
    const middleware = requireRole('PLATFORM_ADMIN');
    middleware({ user: undefined } as unknown as Request, makeRes() as Response, next as NextFunction);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 1: Role-based access isolation
 * For any (requiredRole, userRole) pair where userRole !== requiredRole,
 * requireRole middleware must call next() with a 403 error.
 */
describe('Property 1: Role-based access isolation', () => {
  it('returns 403 for every mismatched role pair', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.constantFrom(...ALL_ROLES),
        (requiredRole, userRole) => {
          fc.pre(requiredRole !== userRole);

          const next = vi.fn();
          const middleware = requireRole(requiredRole);
          middleware(
            makeReq(userRole) as Request,
            makeRes() as Response,
            next as NextFunction
          );

          const err = next.mock.calls[0]?.[0];
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });
});
