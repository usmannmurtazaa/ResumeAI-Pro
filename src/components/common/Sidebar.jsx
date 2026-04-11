import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiUser, FiSettings, FiLogOut, FiLayout, FiUsers, FiPieChart } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { logout, userRole } = useAuth();

  const userMenuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/builder', icon: FiFileText, label: 'Create Resume' },
    { path: '/templates', icon: FiLayout, label: 'Templates' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: FiPieChart, label: 'Overview' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/resumes', icon: FiFileText, label: 'Resumes' },
    { path: '/admin/templates', icon: FiLayout, label: 'Templates' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/20 dark:border-gray-700/20 z-40 pt-16">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-4"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;