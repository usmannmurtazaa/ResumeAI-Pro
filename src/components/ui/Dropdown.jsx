import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const Dropdown = ({ 
  trigger, 
  children, 
  align = 'left',
  width = 'auto',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Options
            <FiChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute ${alignments[align]} mt-2 glass-card p-2 min-w-[200px] z-50`}
            style={{ width: width === 'auto' ? 'auto' : width }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, icon, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left
        transition-colors duration-200
        ${danger 
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
};

export default Dropdown;