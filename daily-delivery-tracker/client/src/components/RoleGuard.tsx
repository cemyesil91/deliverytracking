import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/index';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRole: Role;
  children: ReactNode;
}

/**
 * Redirects to /login if the user is unauthenticated or has the wrong role.
 * Requirements: 2.3, 2.4, 2.5
 */
export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
