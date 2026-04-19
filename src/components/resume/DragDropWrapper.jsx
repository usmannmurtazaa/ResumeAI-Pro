import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  FiMove, 
  FiChevronUp, 
  FiChevronDown, 
  FiLock, 
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiMoreVertical,
  FiCopy,
  FiTrash2,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ItemTypes = {
  SECTION: 'section',
};

// Draggable Section Component with enhanced features
export const DraggableSection = ({ 
  id, 
  index, 
  moveSection, 
  children, 
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
  isVisible = true,
  isLocked = false,
  showControls = true,
  className = '',
  dragHandleClassName = '',
  disabled = false
}) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.SECTION,
    item: () => ({ id, index }),
    canDrag: () => !disabled && !isLocked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        // Handle successful drop
      }
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.SECTION,
    canDrop: () => !isLocked,
    hover: (draggedItem, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveSection(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  const combineRefs = (dragRef, dropRef) => {
    dragRef(dropRef(ref));
  };

  combineRefs(drag, drop);

  // Animation variants
  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    dragging: {
      opacity: 0.5,
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    }
  };

  const handleKeyDown = (e) => {
    if (disabled || isLocked) return;
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) moveSection(index, index - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSection(index, index + 1);
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      ref={preview}
      variants={sectionVariants}
      initial="initial"
      animate={isDragging ? "dragging" : "animate"}
      exit="exit"
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="listitem"
      aria-grabbed={isDragging}
      aria-disabled={disabled || isLocked}
      className={`
        relative group transition-all duration-200
        ${isDragging ? 'cursor-grabbing z-50' : 'cursor-default'}
        ${isOver && canDrop ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
        ${!isVisible ? 'opacity-60' : ''}
        ${className}
      `}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Drop Indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-primary-500 bg-opacity-5 rounded-lg pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-500" />
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500" />
        </div>
      )}

      {/* Drag Handle */}
      {!disabled && !isLocked && (
        <div
          ref={ref}
          className={`
            absolute left-2 top-1/2 transform -translate-y-1/2 p-2 
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            transition-all duration-200 cursor-grab active:cursor-grabbing
            ${isDragging ? 'opacity-0' : 'opacity-100'}
            ${dragHandleClassName}
            z-10
          `}
          aria-label="Drag to reorder"
          title="Drag to reorder (or use arrow keys)"
        >
          <FiMove className="w-4 h-4" />
        </div>
      )}

      {/* Locked Indicator */}
      {isLocked && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 z-10">
          <FiLock className="w-4 h-4" />
        </div>
      )}

      {/* Content */}
      <div className={`pl-10 pr-2 ${!isVisible ? 'grayscale' : ''}`}>
        {children}
      </div>

      {/* Section Controls */}
      {showControls && (isHovered || showMenu) && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1 z-20"
        >
          {/* Visibility Toggle */}
          <button
            onClick={onToggleVisibility}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isVisible ? "Hide section" : "Show section"}
            aria-label={isVisible ? "Hide section" : "Show section"}
          >
            {isVisible ? (
              <FiEye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiEyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={onToggleLock}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isLocked ? "Unlock section" : "Lock section"}
            aria-label={isLocked ? "Unlock section" : "Lock section"}
          >
            {isLocked ? (
              <FiLock className="w-4 h-4 text-orange-500" />
            ) : (
              <FiUnlock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Move Up */}
          <button
            onClick={() => index > 0 && moveSection(index, index - 1)}
            disabled={index === 0 || isLocked}
            className={`
              p-2 rounded-md transition-colors
              ${index === 0 || isLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title="Move up"
            aria-label="Move section up"
          >
            <FiChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Move Down */}
          <button
            onClick={() => moveSection(index, index + 1)}
            disabled={isLocked}
            className={`
              p-2 rounded-md transition-colors
              ${isLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title="Move down"
            aria-label="Move section down"
          >
            <FiChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Duplicate */}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Duplicate section"
              aria-label="Duplicate section"
            >
              <FiCopy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
              title="Delete section"
              aria-label="Delete section"
            >
              <FiTrash2 className="w-4 h-4 text-red-500" />
            </button>
          )}

          {/* More Options */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="More options"
            aria-label="More options"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </motion.div>
      )}

      {/* Hidden Section Overlay */}
      {!isVisible && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 rounded-lg flex items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Hidden</span>
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30"
          >
            <div className="py-1">
              <button
                onClick={() => {
                  onToggleVisibility?.();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" />
                {isVisible ? 'Hide Section' : 'Show Section'}
              </button>
              
              <button
                onClick={() => {
                  onToggleLock?.();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                {isLocked ? 'Unlock Section' : 'Lock Section'}
              </button>
              
              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FiCopy className="w-4 h-4" />
                  Duplicate Section
                </button>
              )}
              
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Section
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Enhanced DragDrop Container
export const DragDropContainer = ({ 
  children, 
  onReorder, 
  className = '',
  showEmptyState = true,
  emptyStateMessage = 'No sections to display',
  enableAnimations = true,
  itemSpacing = 4
}) => {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    const childArray = React.Children.toArray(children);
    setItems(childArray);
    
    // Initialize history
    if (history.length === 0) {
      setHistory([childArray]);
      setHistoryIndex(0);
    }
  }, [children]);

  const moveSection = (fromIndex, toIndex) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    
    // Update state
    setItems(updatedItems);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedItems);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Callback
    onReorder?.(updatedItems);
    
    // Show toast
    toast.success('Section reordered', { 
      icon: '↕️',
      duration: 1500 
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
      onReorder?.(history[newIndex]);
      toast.success('Undo successful');
    } else {
      toast.error('Nothing to undo');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
      onReorder?.(history[newIndex]);
      toast.success('Redo successful');
    } else {
      toast.error('Nothing to redo');
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      redo();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Toolbar */}
      {(history.length > 1) && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className={`
              p-2 rounded-md transition-colors text-sm flex items-center gap-1
              ${historyIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
            title="Undo (Ctrl+Z)"
          >
            <FiChevronUp className="w-4 h-4" />
            Undo
          </button>
          
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className={`
              p-2 rounded-md transition-colors text-sm flex items-center gap-1
              ${historyIndex === history.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
            title="Redo (Ctrl+Y)"
          >
            <FiChevronDown className="w-4 h-4" />
            Redo
          </button>
          
          <div className="flex-1" />
          
          <span className="text-xs text-gray-500">
            Drag sections to reorder
          </span>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && showEmptyState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
        >
          <FiMove className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyStateMessage}</p>
        </motion.div>
      )}

      {/* Draggable Items */}
      <motion.div
        variants={enableAnimations ? containerVariants : {}}
        initial={enableAnimations ? "hidden" : false}
        animate={enableAnimations ? "visible" : false}
        className={`space-y-${itemSpacing}`}
      >
        <AnimatePresence mode="popLayout">
          {items.map((child, index) => {
            if (React.isValidElement(child)) {
              return (
                <DraggableSection
                  key={child.key || `section-${index}`}
                  id={index}
                  index={index}
                  moveSection={moveSection}
                  {...child.props}
                >
                  {child}
                </DraggableSection>
              );
            }
            return child;
          })}
        </AnimatePresence>
      </motion.div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd> to navigate • 
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">Ctrl+Z</kbd> to undo • 
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded ml-1">Ctrl+Y</kbd> to redo
      </div>
    </div>
  );
};

// Sortable List Component (Alternative simpler version)
export const SortableList = ({ 
  items = [], 
  onReorder, 
  renderItem,
  keyExtractor = (item, index) => index,
  className = '' 
}) => {
  const moveItem = (fromIndex, toIndex) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    onReorder?.(updatedItems);
  };

  return (
    <DragDropContainer onReorder={(reorderedItems) => {
      // Extract original items from React children
      const extractedItems = reorderedItems.map(child => {
        if (React.isValidElement(child)) {
          return child.props.item;
        }
        return child;
      });
      onReorder?.(extractedItems);
    }}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </div>
      ))}
    </DragDropContainer>
  );
};

export default DragDropContainer;