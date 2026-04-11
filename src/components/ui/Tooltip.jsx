import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-gray-200',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-gray-800 dark:border-b-gray-200',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-gray-800 dark:border-l-gray-200',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-gray-800 dark:border-r-gray-200',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              absolute z-50 ${positions[position]}
              px-2 py-1 text-xs text-white bg-gray-800 dark:text-gray-800 dark:bg-gray-200
              rounded whitespace-nowrap pointer-events-none
            `}
          >
            {content}
            <div className={`
              absolute w-0 h-0
              border-4 border-transparent
              ${arrows[position]}
            `} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;