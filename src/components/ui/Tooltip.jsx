import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

// ============================================
// TOOLTIP COMPONENT
// ============================================

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  align = 'center',
  delay = 200,
  disabled = false,
  arrow = true,
  maxWidth = 200,
  className = '',
  tooltipClassName = '',
  trigger = 'hover', // 'hover' | 'click' | 'focus'
  interactive = false,
  offset = 8,
  portal = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2',
    'top-start': 'bottom-full left-0',
    'top-end': 'bottom-full right-0',
    bottom: 'top-full left-1/2 -translate-x-1/2',
    'bottom-start': 'top-full left-0',
    'bottom-end': 'top-full right-0',
    left: 'right-full top-1/2 -translate-y-1/2',
    'left-start': 'right-full top-0',
    'left-end': 'right-full bottom-0',
    right: 'left-full top-1/2 -translate-y-1/2',
    'right-start': 'left-full top-0',
    'right-end': 'left-full bottom-0',
  };

  const arrows = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100',
    'top-start': 'bottom-[-6px] left-4 border-t-gray-900 dark:border-t-gray-100',
    'top-end': 'bottom-[-6px] right-4 border-t-gray-900 dark:border-t-gray-100',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100',
    'bottom-start': 'top-[-6px] left-4 border-b-gray-900 dark:border-b-gray-100',
    'bottom-end': 'top-[-6px] right-4 border-b-gray-900 dark:border-b-gray-100',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100',
    'left-start': 'right-[-6px] top-4 border-l-gray-900 dark:border-l-gray-100',
    'left-end': 'right-[-6px] bottom-4 border-l-gray-900 dark:border-l-gray-100',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100',
    'right-start': 'left-[-6px] top-4 border-r-gray-900 dark:border-r-gray-100',
    'right-end': 'left-[-6px] bottom-4 border-r-gray-900 dark:border-r-gray-100',
  };

  const marginClasses = {
    top: `mb-[${offset}px]`,
    'top-start': `mb-[${offset}px]`,
    'top-end': `mb-[${offset}px]`,
    bottom: `mt-[${offset}px]`,
    'bottom-start': `mt-[${offset}px]`,
    'bottom-end': `mt-[${offset}px]`,
    left: `mr-[${offset}px]`,
    'left-start': `mr-[${offset}px]`,
    'left-end': `mr-[${offset}px]`,
    right: `ml-[${offset}px]`,
    'right-start': `ml-[${offset}px]`,
    'right-end': `ml-[${offset}px]`,
  };

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && !interactive) {
      const handleScroll = () => hideTooltip();
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isVisible, interactive]);

  const getTriggerProps = () => {
    const props = { ref: triggerRef };
    
    if (trigger === 'hover') {
      props.onMouseEnter = showTooltip;
      props.onMouseLeave = hideTooltip;
    } else if (trigger === 'click') {
      props.onClick = toggleTooltip;
    } else if (trigger === 'focus') {
      props.onFocus = showTooltip;
      props.onBlur = hideTooltip;
    }
    
    return props;
  };

  const tooltipContent = (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'absolute z-[9999]',
        positions[position] || positions.top,
        tooltipClassName
      )}
      style={portal ? { top: coords.top, left: coords.left } : undefined}
      onMouseEnter={interactive ? showTooltip : undefined}
      onMouseLeave={interactive ? hideTooltip : undefined}
    >
      <div 
        className={clsx(
          'px-3 py-1.5 text-sm text-white bg-gray-900 dark:text-gray-900 dark:bg-gray-100',
          'rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
          interactive && 'pointer-events-auto',
          className
        )}
        style={{ maxWidth }}
      >
        {content}
      </div>
      {arrow && (
        <div className={clsx(
          'absolute w-0 h-0 border-4 border-transparent',
          arrows[position] || arrows.top
        )} />
      )}
    </motion.div>
  );

  return (
    <>
      <div 
        className="relative inline-block"
        {...getTriggerProps()}
      >
        {children}
      </div>
      
      {isVisible && (
        portal ? createPortal(tooltipContent, document.body) : tooltipContent
      )}
    </>
  );
};

// ============================================
// POPOVER COMPONENT (Enhanced Tooltip)
// ============================================

export const Popover = ({ 
  children,
  content,
  title,
  position = 'bottom',
  trigger = 'click',
  width = 280,
  showClose = true,
  onOpen,
  onClose,
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={trigger === 'click' ? handleToggle : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50',
              position === 'bottom' && 'top-full left-0 mt-2',
              position === 'top' && 'bottom-full left-0 mb-2',
              position === 'right' && 'left-full top-0 ml-2',
              position === 'left' && 'right-full top-0 mr-2',
              className
            )}
            style={{ width }}
            {...props}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {title && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                </div>
              )}
              <div className="p-4">
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// TOOLTIP PROVIDER (For consistent styling)
// ============================================

export const TooltipProvider = ({ children }) => children;

// ============================================
// HELPER HOOKS
// ============================================

export const useTooltip = (content, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);

  const tooltipProps = {
    ref: triggerRef,
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
  };

  const TooltipComponent = isVisible && (
    <Tooltip content={content} {...options}>
      <span ref={triggerRef} />
    </Tooltip>
  );

  return { tooltipProps, TooltipComponent, isVisible, setIsVisible };
};

export default Tooltip;