import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default Dashboard;