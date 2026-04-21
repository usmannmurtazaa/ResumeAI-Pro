import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiHome,
  FiFileText,
  FiUser,
  FiSettings,
  FiLayout,
  FiTarget,
  FiTrendingUp,
  FiCreditCard,
  FiHelpCircle,
  FiCommand,
  FiPlus,
  FiActivity,
  FiUsers,
  FiBarChart2,
  FiShield,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiCornerDownLeft,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useResume } from '../../contexts/ResumeContext';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, userRole, isPremium } = useAuth();
  const { resumes, createResume } = useResume();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const executeCommand = (command) => {
    if (command.action) {
      command.action();
    } else if (command.path) {
      navigate(command.path);
    }
    onClose();
  };

  const handleCreateResume = async () => {
    try {
      const newResume = await createResume({ name: 'Quick Resume' });
      toast.success('Resume created!');
      navigate(`/builder/${newResume.id}`);
    } catch (error) {
      toast.error('Failed to create resume');
    }
    onClose();
  };

  // Base commands available to everyone
  const baseCommands = useMemo(() => [
    {
      id: 'home',
      label: 'Go to Home',
      icon: FiHome,
      path: '/',
      shortcut: '⌘H',
      category: 'Navigation',
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: FiHome,
      path: '/dashboard',
      shortcut: '⌘D',
      category: 'Navigation',
    },
    {
      id: 'templates',
      label: 'Browse Templates',
      icon: FiLayout,
      path: '/templates',
      shortcut: '⌘T',
      category: 'Navigation',
    },
    {
      id: 'pricing',
      label: 'View Pricing',
      icon: FiCreditCard,
      path: '/pricing',
      category: 'Navigation',
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: FiHelpCircle,
      path: '/help',
      category: 'Navigation',
    },
  ], []);

  // User commands (authenticated)
  const userCommands = useMemo(() => user ? [
    {
      id: 'new-resume',
      label: 'Create New Resume',
      icon: FiPlus,
      action: handleCreateResume,
      shortcut: '⌘N',
      category: 'Resumes',
    },
    {
      id: 'builder',
      label: 'Resume Builder',
      icon: FiFileText,
      path: '/builder',
      category: 'Resumes',
    },
    {
      id: 'ats-scanner',
      label: 'ATS Scanner',
      icon: FiTarget,
      path: '/ats-scanner',
      shortcut: '⌘S',
      category: 'Tools',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FiTrendingUp,
      path: '/analytics',
      premium: true,
      category: 'Tools',
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: FiUser,
      path: '/profile',
      shortcut: '⌘P',
      category: 'Account',
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: FiSettings,
      path: '/settings',
      shortcut: '⌘,',
      category: 'Account',
    },
  ] : [
    {
      id: 'login',
      label: 'Sign In',
      icon: FiUser,
      path: '/login',
      category: 'Account',
    },
    {
      id: 'signup',
      label: 'Sign Up',
      icon: FiPlus,
      path: '/signup',
      category: 'Account',
    },
  ], [user]);

  // Recent resumes (quick access)
  const recentResumeCommands = useMemo(() => {
    if (!user || !resumes.length) return [];
    
    return resumes.slice(0, 5).map((resume, index) => ({
      id: `resume-${resume.id}`,
      label: resume.name || 'Untitled Resume',
      icon: FiFileText,
      path: `/builder/${resume.id}`,
      shortcut: index < 9 ? `⌘${index + 1}` : undefined,
      category: 'Recent Resumes',
    }));
  }, [user, resumes]);

  // Admin commands
  const adminCommands = useMemo(() => userRole === 'admin' ? [
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: FiShield,
      path: '/admin',
      shortcut: '⌘A',
      category: 'Admin',
    },
    {
      id: 'admin-users',
      label: 'User Management',
      icon: FiUsers,
      path: '/admin/users',
      category: 'Admin',
    },
    {
      id: 'admin-resumes',
      label: 'Resume Management',
      icon: FiFileText,
      path: '/admin/resumes',
      category: 'Admin',
    },
    {
      id: 'admin-analytics',
      label: 'Platform Analytics',
      icon: FiBarChart2,
      path: '/admin/analytics',
      category: 'Admin',
    },
  ] : [], [userRole]);

  // Combine all commands
  const allCommands = useMemo(() => [
    ...baseCommands,
    ...userCommands,
    ...recentResumeCommands,
    ...adminCommands,
  ], [baseCommands, userCommands, recentResumeCommands, adminCommands]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchTerm) return allCommands;
    
    const term = searchTerm.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(term) ||
      cmd.category?.toLowerCase().includes(term)
    );
  }, [allCommands, searchTerm]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      const category = cmd.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-[15vh] z-[101] mx-auto max-w-xl"
          >
            <div className="glass-card p-2 shadow-2xl">
              {/* Search Input */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="pl-10 pr-4 py-3 text-lg border-0 bg-transparent focus:ring-0"
                  wrapperClassName="mb-0"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ESC</kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
                {Object.keys(groupedCommands).length > 0 ? (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {category}
                      </p>
                      {commands.map((cmd, idx) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;
                        const isPremiumLocked = cmd.premium && !isPremium;

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => isPremiumLocked ? toast.error('Upgrade to Pro to access this feature') : executeCommand(cmd)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-primary-500 text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            } ${isPremiumLocked ? 'opacity-50' : ''}`}
                            disabled={isPremiumLocked}
                          >
                            <span className="flex items-center gap-3">
                              <cmd.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                              <span className="text-sm">{cmd.label}</span>
                              {cmd.premium && !isPremium && (
                                <Badge variant="warning" size="sm">PRO</Badge>
                              )}
                            </span>
                            <span className="flex items-center gap-2">
                              {cmd.shortcut && (
                                <kbd className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                  {cmd.shortcut}
                                </kbd>
                              )}
                              {isSelected && <FiCornerDownLeft className="w-3 h-3 opacity-70" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No commands found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FiArrowUp className="w-3 h-3" />
                    <FiArrowDown className="w-3 h-3" />
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCornerDownLeft className="w-3 h-3" />
                    <span>Select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>ESC</span>
                    <span>Close</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCommand className="w-3 h-3" />
                  <span>K to open</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;