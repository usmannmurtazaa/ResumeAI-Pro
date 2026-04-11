import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, FiX, FiUser, FiLogOut, FiSettings, 
  FiFileText, FiHome, FiSearch, FiBell,
  FiSun, FiMoon, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import NotificationPanel from './NotificationPanel';
import ThemeCustomizer from './ThemeCustomizer';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout, userRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: FiHome },
    { to: '/templates', label: 'Templates', icon: FiFileText },
    { to: '/pricing', label: 'Pricing', icon: null },
  ];

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: FiFileText },
    { to: '/ats-scanner', label: 'ATS Scanner', icon: FiSearch },
  ];

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20 dark:border-gray-700/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="ResumeAi Pro" className="h-8" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              
              {user && userLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <FiSun className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <FiMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
              </button>

              {/* Notifications - Hidden on mobile */}
              {user && (
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <FiBell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <NotificationPanel 
                    isOpen={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                  />
                </div>
              )}

              {/* User Menu - Hidden on mobile */}
              {user ? (
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="User menu"
                  >
                    <Avatar name={user.displayName || user.email || ''} size="sm" />
                    <FiChevronDown className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 glass-card p-2"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                        
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          <FiUser className="w-4 h-4" />
                          Profile
                        </Link>
                        
                        <Link
                          to="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          <FiSettings className="w-4 h-4" />
                          Settings
                        </Link>
                        
                        {userRole === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <FiSettings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')} size="sm">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/signup')} size="sm">
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Menu"
              >
                {isMenuOpen ? <FiX className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="space-y-1">
                  {[...navLinks, ...(user ? userLinks : [])].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      {link.icon && <link.icon className="w-5 h-5" />}
                      {link.label}
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <Link
                        to="/profile"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <FiUser className="w-5 h-5" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <FiSettings className="w-5 h-5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <FiLogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <Link
                        to="/login"
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Search Overlay */}
      <SearchBar isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Theme Customizer */}
      <ThemeCustomizer />
    </>
  );
};

export default Navbar;