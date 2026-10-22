import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading indicator while session restore is in-flight
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-solar-400" />
        <span className="text-sm font-medium">Restoring secure session...</span>
      </div>
    );
  }

  // If not authenticated, redirect to appropriate login portal with return location
  if (!isAuthenticated || !user) {
    if (requireAdmin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires admin role and user is not admin, redirect to admin login with unauthorized state
  if (requireAdmin && user.role !== 'admin') {
    return (
      <Navigate
        to="/admin/login"
        state={{
          from: location,
          error: 'Access Denied: Administrator privileges are required to view the requested resource.',
        }}
        replace
      />
    );
  }


  return <>{children}</>;
};
