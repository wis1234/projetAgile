import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isAdminUser } from '@/utils/authUtils';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is either 'admin' or 'super_admin' using our utility that checks the enhanced user object
  const isAdmin = isAdminUser(user);
  
  if (!isAdmin) {
    console.warn('Access denied to admin route for user:', user.email);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;