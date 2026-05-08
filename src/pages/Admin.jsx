import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Code-split operational admin consoles (Firestore-heavy). */
const AdminUsers = lazy(() => import('./admin/AdminUsers'));
const AdminResumes = lazy(() => import('./admin/AdminResumes'));
const AdminSectionPlaceholder = lazy(() => import('./admin/AdminSectionPlaceholder'));

const NestedFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <Loader size="lg" text="Loading admin section..." />
  </div>
);

const AdminHome = () => (
  <RouteErrorBoundary>
    <AdminLayout title="Admin Dashboard" description="Platform overview and key metrics">
      <AdminDashboard />
    </AdminLayout>
  </RouteErrorBoundary>
);

/**
 * Nested admin SPA — guarded by AdminRoute in App.jsx.
 * Mirrors sidebar paths under /admin/* so deep links resolve.
 */
const Admin = () => {
  const { user, loading, initializing, hasRole } = useAuth();

  useDocumentTitle('Admin | ResumeAI Pro');

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader variant="brand" size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  if (!user || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<NestedFallback />}>
        <Routes>
          <Route index element={<AdminHome />} />
          <Route
            path="users"
            element={
              <RouteErrorBoundary>
                <AdminUsers />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="resumes"
            element={
              <RouteErrorBoundary>
                <AdminResumes />
              </RouteErrorBoundary>
            }
          />
          {/* Command palette / sidebar targets without dedicated screens yet */}
          <Route path="*" element={<AdminSectionPlaceholder />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Admin;
