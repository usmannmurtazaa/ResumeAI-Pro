import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

// ── Dropdown Context ─────────────────────────────────────────────────────

const DropdownContext = createContext(null);

const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('Dropdown compound components must be used within Dropdown');
  return context;
};

// ── Constants ─────────────────────────────────────────────────────────────

const ALIGNMENTS = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
};

// ── Dropdown Component ────────────────────────────────────────────────────

const Dropdown = ({ 
  trigger, 
  children, 
  align = 'left',
  width = 'auto',
  className = '',
  onOpen,
  onClose,
  closeOnSelect = true,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // ── Click Outside Handler ─────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        close();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // ── Open/Close Handlers ──────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setActiveIndex(-1);
    onOpen?.();
    // Focus first item on next tick
    setTimeout(() => {
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]:not([disabled])');
      firstItem?.focus();
    }, 50);
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    onClose?.();
    // Return focus to trigger
    triggerRef.current?.focus();
  }, [onClose]);

  const toggle = useCallback(() => {
    isOpen ? close() : open();
  }, [isOpen, open, close]);

  // ── Keyboard Navigation ──────────────────────────────────────────────

  const handleTriggerKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) open();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) open();
    }
  }, [isOpen, open]);

  const handleMenuKeyDown = useCallback((e) => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
    if (!items?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev + 1 >= items.length ? 0 : prev + 1;
          items[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev - 1 < 0 ? items.length - 1 : prev - 1;
          items[next]?.focus();
          return next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }, [close]);

  // ── Context Value ────────────────────────────────────────────────────

  const contextValue = {
    isOpen,
    close,
    closeOnSelect,
    activeIndex,
  };

  return (
    <DropdownContext.Provider value={contextValue}>
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        {/* Trigger */}
        <div
          ref={triggerRef}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="inline-flex"
        >
          {trigger || (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" type="button">
              Options
              <FiChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={`absolute ${ALIGNMENTS[align] || ALIGNMENTS.left} mt-2 glass-card py-1 z-50 overflow-hidden`}
              style={{ width: width === 'auto' ? 'auto' : width, minWidth: '200px' }}
              role="menu"
              aria-orientation="vertical"
              onKeyDown={handleMenuKeyDown}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DropdownContext.Provider>
  );
};

// ── DropdownItem Component ────────────────────────────────────────────────

export const DropdownItem = ({ 
  children, 
  onClick, 
  icon, 
  danger = false,
  disabled = false,
  selected = false,
  shortcut,
  href,
  className = '',
}) => {
  const { close, closeOnSelect } = useDropdownContext();
  const itemRef = useRef(null);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    onClick?.(e);
    if (closeOnSelect) close();
  }, [disabled, onClick, closeOnSelect, close]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }, [handleClick]);

  const itemContent = (
    <>
      {icon && <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 ml-4">
          {shortcut}
        </kbd>
      )}
      {selected && (
        <FiCheck className="w-4 h-4 text-primary-500 flex-shrink-0 ml-2" />
      )}
    </>
  );

  const itemClasses = `
    w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
    transition-colors duration-150 rounded-md mx-1
    ${disabled 
      ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500' 
      : danger 
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer' 
        : selected
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 cursor-pointer'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
    }
    focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800
    ${className}
  `;

  if (href && !disabled) {
    return (
      <a href={href} className={itemClasses} ref={itemRef} role="menuitem" tabIndex={-1}>
        {itemContent}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={itemClasses}
      ref={itemRef}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled}
    >
      {itemContent}
    </button>
  );
};

// ── DropdownDivider Component ─────────────────────────────────────────────

export const DropdownDivider = ({ className = '' }) => (
  <div className={`my-1 border-t border-gray-200 dark:border-gray-700 mx-2 ${className}`} role="separator" />
);

// ── DropdownLabel Component ───────────────────────────────────────────────

export const DropdownLabel = ({ children, className = '' }) => (
  <div className={`px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
    {children}
  </div>
);

// ── Display Names ─────────────────────────────────────────────────────────

Dropdown.displayName = 'Dropdown';
DropdownItem.displayName = 'DropdownItem';
DropdownDivider.displayName = 'DropdownDivider';
DropdownLabel.displayName = 'DropdownLabel';

export default React.memo(Dropdown);
