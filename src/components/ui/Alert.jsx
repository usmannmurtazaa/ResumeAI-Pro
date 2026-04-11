import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiXCircle, 
  FiX 
} from 'react-icons/fi';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  closable = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const icons = {
    success: <FiCheckCircle className="w-5 h-5 text-green-500" />,
    warning: <FiAlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <FiXCircle className="w-5 h-5 text-red-500" />,
    info: <FiInfo className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`
            relative flex gap-3 p-4 rounded-lg border-l-4
            ${colors[type]}
            ${className}
          `}
        >
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="flex-1">
            {title && <h4 className="font-medium mb-1">{title}</h4>}
            <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
          </div>
          {closable && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;