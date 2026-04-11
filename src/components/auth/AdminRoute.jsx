import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';

const AdminRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return user && userRole === 'admin' ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;