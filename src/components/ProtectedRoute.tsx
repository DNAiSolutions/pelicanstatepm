import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import type { AccessType } from '../services/userProfileService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiresProfile?: boolean;
  allowedAccess?: AccessType[];
}

export function ProtectedRoute({ children, requiredRoles, requiresProfile = true, allowedAccess }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, profileLoading, requiresOnboarding, accessType, isDevelopmentProfile } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfile && !profileLoading && !isDevelopmentProfile) {
    if (requiresOnboarding) {
      if (location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
    } else if (allowedAccess && !allowedAccess.includes(accessType)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check if user has required role
  if (requiredRoles && user?.role && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
