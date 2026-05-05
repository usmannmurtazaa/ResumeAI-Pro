import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Button from './Button';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = {
  xs: 'max-w-xs', sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl',
  xl: 'max-w-4xl', '2xl': 'max-w-6xl', full: 'max-w-[calc(100vw-2rem)]',
};

const DRAWER_SIZES = { sm: 'w-80', md: 'w-96', lg: 'w-[500px]', xl: 'w-[600px]', full: 'w-screen' };

const VARIANTS = { default: 'glass-card', solid: 'bg-white dark:bg-gray-800 shadow-xl', transparent: 'bg-transparent shadow-none' };

const POSITIONS = {
  center: 'items-center',
  top: 'items-start pt-16',
  bottom: 'items-end pb-16',
};

const ANIMATIONS = {
  center: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
  top: { initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } },
  bottom: { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 50 } },
  left: { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } },
  right: { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 } },
};

const DRAWER_ANIMATIONS = {
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: 'right-0 h-full' },
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, className: 'left-0 h-full' },
  top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' }, className: 'top-0 w-full' },
  bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, className: 'bottom-0 w-full' },
};

// ── Focus Trap Hook ──────────────────────────────────────────────────────

const useFocusTrap = (containerRef, isActive) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const getFocusableElements = () => container.querySelectorAll(focusableSelector);

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus first element
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef]);
};

// ── Scroll Lock Hook ─────────────────────────────────────────────────────

const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    // Store scroll position
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    // iOS fix
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};

// ── Modal Component ───────────────────────────────────────────────────────

const Modal = ({ 
  isOpen, onClose, title, description, children, 
  size = 'md', variant = 'default',
  showCloseButton = true, closeOnOverlayClick = true, closeOnEsc = true,
  showHeader = true, showFooter = false, footerContent,
  className = '', overlayClassName = '', contentClassName = '',
  preventScroll = true, fullScreen = false, position = 'center',
  actions, loading = false, initialFocusRef,
  ...props 
}) => {
  const modalRef = useRef(null);

  useScrollLock(isOpen && preventScroll);
  useFocusTrap(modalRef, isOpen);

  // Focus initial element
  useEffect(() => {
    if (isOpen && initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
  }, [isOpen, initialFocusRef]);

  // Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEsc, onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  }, [closeOnOverlayClick, onClose]);

  const currentAnimation = ANIMATIONS[position] || ANIMATIONS.center;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn('fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm', overlayClassName)}
            onClick={handleOverlayClick} aria-hidden="true" />

          <div className={cn('fixed inset-0 z-50 overflow-y-auto', POSITIONS[position] || 'items-center')}>
            <div className={cn('flex min-h-full justify-center p-4', fullScreen && 'p-0', POSITIONS[position] || 'items-center')}>
              <motion.div ref={modalRef} {...currentAnimation} transition={{ duration: 0.2 }}
                className={cn(
                  SIZES[size] || SIZES.md, 'w-full', VARIANTS[variant] || VARIANTS.default,
                  fullScreen && '!max-w-full !h-screen !m-0 !rounded-none', 'rounded-2xl',
                  className
                )}
                role="dialog" aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-describedby={description ? 'modal-description' : undefined}
                {...props}
              >
                {/* Header */}
                {showHeader && (title || showCloseButton) && (
                  <div className={cn('flex items-center justify-between', fullScreen ? 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' : 'mb-4')}>
                    <div className="min-w-0 flex-1 mr-4">
                      {title && <h2 id="modal-title" className={cn('font-bold gradient-text truncate', fullScreen ? 'text-2xl' : 'text-xl')}>{title}</h2>}
                      {description && <p id="modal-description" className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
                    </div>
                    {showCloseButton && (
                      <button onClick={onClose} disabled={loading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Close modal" type="button">
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={cn(fullScreen ? 'px-6 py-4 flex-1 overflow-y-auto' : '', contentClassName)}>{children}</div>

                {/* Footer */}
                {showFooter && (footerContent || actions) && (
                  <div className={cn('flex items-center justify-end gap-3', fullScreen ? 'px-6 py-4 border-t border-gray-200 dark:border-gray-700' : 'mt-6 pt-4 border-t border-gray-200 dark:border-gray-700')}>
                    {footerContent || (
                      <>
                        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        {actions}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── ConfirmModal ──────────────────────────────────────────────────────────

export const ConfirmModal = ({ 
  isOpen, onClose, onConfirm, title = 'Are you sure?', message,
  confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'danger',
  loading = false, ...props 
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showFooter
    footerContent={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelText}</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>
    } {...props}>
    {message && <p className="text-gray-600 dark:text-gray-400">{message}</p>}
  </Modal>
);

// ── Drawer ────────────────────────────────────────────────────────────────

export const Drawer = ({ 
  isOpen, onClose, title, children, placement = 'right', size = 'md',
  closeOnOverlayClick = true, ...props 
}) => {
  const currentPlacement = DRAWER_ANIMATIONS[placement] || DRAWER_ANIMATIONS.right;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined} />
          <motion.div {...currentPlacement} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn('fixed z-50 bg-white dark:bg-gray-800 shadow-xl', DRAWER_SIZES[size] || DRAWER_SIZES.md, currentPlacement.className)}
            {...props}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold gradient-text truncate">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0" aria-label="Close">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sheet (Bottom Sheet) ──────────────────────────────────────────────────

export const Sheet = ({ isOpen, onClose, title, children, showHandle = true, ...props }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl max-h-[90vh] overflow-hidden" {...props}>
          {showHandle && (
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold gradient-text">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label="Close">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default React.memo(Modal);
