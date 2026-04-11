import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiInfo } from 'react-icons/fi';

const NotificationPanel = ({ isOpen, onClose }) => {
  const notifications = [
    { id: 1, title: 'Welcome!', message: 'Thanks for joining ResumeAi Pro', read: false, time: '5m ago' },
    { id: 2, title: 'ATS Scan Complete', message: 'Your resume scored 85%', read: true, time: '2h ago' },
    { id: 3, title: 'New Template Available', message: 'Check out our new executive template', read: false, time: '1d ago' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-80 glass-card p-2 z-50"
        >
          <div className="flex justify-between items-center mb-2 p-2">
            <div className="flex items-center gap-2">
              <FiBell className="w-4 h-4" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              aria-label="Close notifications"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <FiInfo className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notif.read 
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800' 
                      : 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{notif.title}</h4>
                    <span className="text-xs text-gray-500">{notif.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2">
              View all notifications
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;