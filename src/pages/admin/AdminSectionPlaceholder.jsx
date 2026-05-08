import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import Card from '../../components/ui/Card';

/**
 * Fallback for admin URLs that appear in navigation but do not yet have a
 * dedicated screen. Keeps sidebar / command palette links from rendering a blank area.
 */
const AdminSectionPlaceholder = () => {
  const { pathname } = useLocation();
  const segment =
    pathname.replace(/^\/admin\/?/, '').replace(/\//g, ' › ') || 'admin home';

  return (
    <AdminLayout title="Admin area" description="Section overview">
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">“{segment}”</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          This administrative view is reserved for upcoming tooling. Resume and account
          operations are available from User Management and Resume Management.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300"
          >
            User management
          </Link>
          <Link
            to="/admin/resumes"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300"
          >
            Resume management
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Admin home
          </Link>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminSectionPlaceholder;
