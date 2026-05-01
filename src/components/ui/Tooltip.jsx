import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const POSITIONS = {
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

// Arrow border direction for each position
const ARROW_DIRECTIONS = {
  top: 'bottom', 'top-start': 'bottom', 'top-end': 'bottom',
  bottom: 'top', 'bottom-start': 'top', 'bottom-end': 'top',
  left: 'right', 'left-start': 'right', 'left-end': 'right',
  right: 'left', 'right-start': 'left', 'right-end': 'left',
};

// ── Tooltip Component ─────────────────────────────────────────────────────

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 200,
  disabled = false,
  arrow = true,
  maxWidth = 200,
  className = '',
  tooltipClassName = '',
  trigger = 'hover', // 'hover' | 'click' | 'focus'
  interactive = false,
  portal = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const isTouchDevice = useRef(false);

  // ── Detect touch device ────────────────────────────────────────────

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // ── Show/Hide ──────────────────────────────────────────────────────

  const show = useCallback(() => {
    if (disabled || (isTouchDevice.current && trigger === 'hover')) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    } else {
      setIsVisible(true);
    }
  }, [disabled, trigger, delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Hide on scroll (unless interactive) ──────────────────────────

  useEffect(() => {
    if (!isVisible || interactive) return;
    const handler = () => hide();
    window.addEventListener('scroll', handler, { capture: true });
    return () => window.removeEventListener('scroll', handler, { capture: true });
  }, [isVisible, interactive, hide]);

  // ── Trigger Props ─────────────────────────────────────────────────

  const getTriggerProps = () => {
    const props = { ref: triggerRef };

    if (trigger === 'hover') {
      props.onMouseEnter = show;
      props.onMouseLeave = hide;
      props.onFocus = show;
      props.onBlur = hide;
    } else if (trigger === 'click') {
      props.onClick = toggle;
    } else if (trigger === 'focus') {
      props.onFocus = show;
      props.onBlur = hide;
    }

    return props;
  };

  // ── Arrow Component ───────────────────────────────────────────────

  const Arrow = () => {
    if (!arrow) return null;
    const arrowDir = ARROW_DIRECTIONS[position] || 'bottom';
    return (
      <div 
        className={cn(
          'absolute w-2 h-2 rotate-45',
          'bg-gray-900 dark:bg-gray-100',
          arrowDir === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
          arrowDir === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
          arrowDir === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
          arrowDir === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2',
        )}
      />
    );
  };

  // ── Tooltip Content ───────────────────────────────────────────────

  const tooltipContent = (
    <motion.div
      ref={tooltipRef}
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute z-[9999]',
        POSITIONS[position] || POSITIONS.top,
        position.startsWith('top') ? 'mb-2' : 
        position.startsWith('bottom') ? 'mt-2' :
        position.startsWith('left') ? 'mr-2' : 'ml-2',
        tooltipClassName
      )}
      onMouseEnter={interactive ? show : undefined}
      onMouseLeave={interactive ? hide : undefined}
      role="tooltip"
    >
      <div 
        className={cn(
          'px-3 py-1.5 text-sm text-white bg-gray-900 dark:text-gray-900 dark:bg-gray-100',
          'rounded-lg shadow-lg whitespace-nowrap',
          interactive ? 'pointer-events-auto' : 'pointer-events-none',
          className
        )}
        style={{ maxWidth }}
      >
        {content}
      </div>
      <Arrow />
    </motion.div>
  );

  return (
    <>
      <div className="relative inline-flex" {...getTriggerProps()}>
        {children}
        <AnimatePresence>
          {isVisible && (
            portal 
              ? createPortal(tooltipContent, document.body) 
              : tooltipContent
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// ── Popover Component ─────────────────────────────────────────────────────

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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        close();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) onOpen?.();
      else onClose?.();
      return next;
    });
  }, [onOpen, onClose]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const positionClasses = {
    bottom: 'top-full left-0 mt-2',
    top: 'bottom-full left-0 mb-2',
    right: 'left-full top-0 ml-2',
    left: 'right-full top-0 mr-2',
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={trigger === 'click' ? toggle : undefined}>
        {children}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute z-50', positionClasses[position] || positionClasses.bottom, className)}
            style={{ width }}
            role="dialog"
            aria-label={title}
            {...props}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {(title || showClose) && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  {title && <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{title}</h4>}
                  {showClose && (
                    <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className="p-4">{content}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(Tooltip);