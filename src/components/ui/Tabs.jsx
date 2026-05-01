import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ── Utility ───────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ── Tabs Context ─────────────────────────────────────────────────────────

const TabsContext = createContext(null);

// ── Constants ─────────────────────────────────────────────────────────────

const VARIANTS = {
  underline: {
    list: 'flex border-b border-gray-200 dark:border-gray-700',
    tab: (active) => cn(
      'relative px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
      active 
        ? 'text-primary-600 dark:text-primary-400 border-primary-500' 
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
    ),
  },
  pills: {
    list: 'flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl',
    tab: (active) => cn(
      'relative px-4 py-2 text-sm font-medium rounded-lg transition-all',
      active 
        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    ),
  },
  buttons: {
    list: 'flex',
    tab: (active) => cn(
      'px-4 py-2 text-sm font-medium border transition-colors first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0',
      active
        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-300 dark:border-primary-700 z-10'
        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
    ),
  },
  cards: {
    list: 'flex gap-2',
    tab: (active) => cn(
      'px-5 py-3 text-sm font-medium rounded-xl border-2 transition-all',
      active
        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
    ),
  },
};

// ── Tabs Component ────────────────────────────────────────────────────────

const Tabs = ({ 
  tabs = [], 
  defaultTab = 0, 
  activeTab: controlledTab,
  onChange, 
  variant = 'underline',
  orientation = 'horizontal',
  className = '',
  ...props 
}) => {
  const isControlled = controlledTab !== undefined;
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeIndex = isControlled ? controlledTab : internalTab;
  const tabListRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const handleTabChange = useCallback((index) => {
    if (!isControlled) setInternalTab(index);
    onChange?.(index);
  }, [isControlled, onChange]);

  // ── Keyboard Navigation ──────────────────────────────────────────────

  const handleKeyDown = useCallback((e) => {
    const tabs = tabListRef.current?.querySelectorAll('[role="tab"]');
    if (!tabs?.length) return;

    let newIndex = activeIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (activeIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    handleTabChange(newIndex);
    tabs[newIndex]?.focus();
  }, [activeIndex, handleTabChange]);

  const variantConfig = VARIANTS[variant] || VARIANTS.underline;
  const isVertical = orientation === 'vertical';

  return (
    <TabsContext.Provider value={{ activeIndex, handleTabChange }}>
      <div className={cn(isVertical ? 'flex gap-4' : '', className)} {...props}>
        {/* Tab List */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-orientation={orientation}
          onKeyDown={handleKeyDown}
          className={cn(
            variantConfig.list,
            isVertical && 'flex-col border-b-0 border-r border-gray-200 dark:border-gray-700'
          )}
        >
          {tabs.map((tab, index) => {
            const isActive = activeIndex === index;
            const isDisabled = tab.disabled;

            return (
              <button
                key={index}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${index}`}
                tabIndex={isActive ? 0 : -1}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleTabChange(index)}
                className={cn(
                  variantConfig.tab(isActive),
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  isVertical && 'border-b-0 border-r-2 -mr-px mb-0'
                )}
              >
                {/* Icon */}
                {tab.icon && (
                  <span className={cn('inline-flex mr-2', isActive ? 'text-current' : 'text-gray-400')}>
                    {tab.icon}
                  </span>
                )}
                
                {/* Label */}
                <span>{tab.label}</span>

                {/* Badge */}
                {tab.badge !== undefined && (
                  <span className={cn(
                    'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full',
                    isActive 
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}

                {/* Underline Indicator (for underline variant) */}
                {variant === 'underline' && isActive && (
                  <motion.div
                    layoutId={prefersReducedMotion ? undefined : 'tab-indicator'}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div className={cn('flex-1', !isVertical && 'mt-4')}>
          <AnimatePresence mode="wait">
            {tabs.map((tab, index) => (
              activeIndex === index && (
                <motion.div
                  key={index}
                  role="tabpanel"
                  id={`tabpanel-${index}`}
                  aria-labelledby={`tab-${index}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.content}
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </div>
    </TabsContext.Provider>
  );
};

// ── TabPanel Component (for declarative usage) ────────────────────────────

export const TabPanel = ({ children, index }) => {
  const { activeIndex } = useContext(TabsContext) || {};
  if (activeIndex !== index) return null;
  return (
    <motion.div
      role="tabpanel"
      id={`tabpanel-${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

TabPanel.displayName = 'TabPanel';

export default React.memo(Tabs);