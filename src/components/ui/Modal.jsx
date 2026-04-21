import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft } from 'react-icons/fi';
import { clsx } from 'clsx';
import Button from './Button';

// ============================================
// MODAL COMPONENT
// ============================================

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  description,
  children, 
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showHeader = true,
  showFooter = false,
  footerContent,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  preventScroll = true,
  fullScreen = false,
  position = 'center',
  actions,
  loading = false,
  ...props 
}) => {
  const modalRef = useRef(null);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen && preventScroll) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, preventScroll]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && closeOnEsc) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  const variants = {
    default: 'glass-card',
    solid: 'bg-white dark:bg-gray-800 shadow-xl',
    transparent: 'bg-transparent shadow-none',
  };

  const positions = {
    center: 'items-center',
    top: 'items-start pt-16',
    bottom: 'items-end pb-16',
  };

  const animations = {
    center: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    top: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    bottom: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
    },
    left: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
    },
    right: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
    },
  };

  const currentAnimation = animations[position] || animations.center;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              'fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm',
              overlayClassName
            )}
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <div 
            className={clsx(
              'fixed inset-0 z-50 overflow-y-auto',
              positions[position] || 'items-center'
            )}
          >
            <div className={clsx(
              'flex min-h-full justify-center p-4',
              fullScreen ? 'p-0' : '',
              positions[position] || 'items-center'
            )}>
              <motion.div
                ref={modalRef}
                {...currentAnimation}
                transition={{ duration: 0.2 }}
                className={clsx(
                  sizes[size],
                  'w-full',
                  variants[variant],
                  fullScreen && '!max-w-full !h-screen !m-0 !rounded-none',
                  'rounded-2xl',
                  className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-describedby={description ? 'modal-description' : undefined}
                {...props}
              >
                {/* Header */}
                {showHeader && (title || showCloseButton) && (
                  <div className={clsx(
                    'flex items-center justify-between',
                    fullScreen ? 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' : 'mb-4'
                  )}>
                    <div>
                      {title && (
                        <h2 
                          id="modal-title"
                          className={clsx(
                            'font-bold gradient-text',
                            fullScreen ? 'text-2xl' : 'text-xl'
                          )}
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p 
                          id="modal-description"
                          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Close modal"
                        disabled={loading}
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={clsx(
                  fullScreen ? 'px-6 py-4 flex-1 overflow-y-auto' : '',
                  contentClassName
                )}>
                  {children}
                </div>

                {/* Footer */}
                {showFooter && (footerContent || actions) && (
                  <div className={clsx(
                    'flex items-center justify-end gap-3',
                    fullScreen ? 'px-6 py-4 border-t border-gray-200 dark:border-gray-700' : 'mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'
                  )}>
                    {footerContent || (
                      <>
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                          Cancel
                        </Button>
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

// ============================================
// CONFIRM MODAL COMPONENT
// ============================================

export const ConfirmModal = ({ 
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  ...props 
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    showFooter
    footerContent={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          variant={confirmVariant} 
          onClick={onConfirm} 
          loading={loading}
        >
          {confirmText}
        </Button>
      </>
    }
    {...props}
  >
    {message && <p className="text-gray-600 dark:text-gray-400">{message}</p>}
  </Modal>
);

// ============================================
// DRAWER COMPONENT (Slide-out)
// ============================================

export const Drawer = ({ 
  isOpen,
  onClose,
  title,
  children,
  placement = 'right',
  size = 'md',
  ...props 
}) => {
  const sizes = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[500px]',
    xl: 'w-[600px]',
    full: 'w-screen',
  };

  const placements = {
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      className: 'right-0 h-full',
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
      className: 'left-0 h-full',
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
      className: 'top-0 w-full',
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      className: 'bottom-0 w-full',
    },
  };

  const currentPlacement = placements[placement];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...currentPlacement}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'fixed z-50 bg-white dark:bg-gray-800 shadow-xl',
              sizes[size],
              currentPlacement.className,
              placement === 'top' || placement === 'bottom' ? 'h-auto max-h-[90vh]' : ''
            )}
            {...props}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold gradient-text">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// SHEET COMPONENT (Mobile-friendly bottom sheet)
// ============================================

export const Sheet = ({ 
  isOpen,
  onClose,
  title,
  children,
  showHandle = true,
  ...props 
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl max-h-[90vh] overflow-hidden"
          {...props}
        >
          {showHandle && (
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold gradient-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ============================================
// EXPORT DEFAULT
// ============================================

export default Modal;