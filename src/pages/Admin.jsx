import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Loader from '../components/common/Loader';

const Admin = () => {
  const { user, loading, initializing, hasRole } = useAuth();
  const navigate = useNavigate();

  // Set page title
  useDocumentTitle('Admin Dashboard');

  // Redirect non-admins
  useEffect(() => {
    if (!loading && !initializing && !hasRole('admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, initializing, hasRole, navigate]);

  // Loading state
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader variant="brand" size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  // Not admin - don't render anything (redirect will happen)
  if (!hasRole('admin')) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AdminLayout title="Admin Dashboard" description="Platform overview and key metrics">
        <AdminDashboard />
      </AdminLayout>
    </ErrorBoundary>
  );
};

export default Admin;
