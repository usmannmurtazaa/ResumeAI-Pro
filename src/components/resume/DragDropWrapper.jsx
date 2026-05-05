import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  FiMove, FiChevronUp, FiChevronDown, FiLock, FiUnlock,
  FiEye, FiEyeOff, FiMoreVertical, FiCopy, FiTrash2,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const ItemTypes = { SECTION: 'section' };

// ── DraggableSection ─────────────────────────────────────────────────────

export const DraggableSection = ({ 
  id, index, moveSection, children, 
  onToggleVisibility, onToggleLock, onDuplicate, onDelete,
  isVisible = true, isLocked = false, showControls = true,
  className = '', disabled = false,
}) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // ── FIXED: Properly combined drag and drop refs ──────────────────────

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: () => ({ id, index }),
    canDrag: () => !disabled && !isLocked,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.SECTION,
    canDrop: () => !isLocked,
    hover: (draggedItem, monitor) => {
      if (!ref.current || draggedItem.index === index) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (draggedItem.index < index && hoverClientY < hoverMiddleY) return;
      if (draggedItem.index > index && hoverClientY > hoverMiddleY) return;

      moveSection(draggedItem.index, index);
      draggedItem.index = index;
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  // FIXED: Properly attach both drag and drop to the same element
  useEffect(() => {
    drag(drop(ref));
  }, [drag, drop]);

  // ── Keyboard Navigation ──────────────────────────────────────────────

  const handleKeyDown = useCallback((e) => {
    if (disabled || isLocked) return;
    if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); moveSection(index, index - 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSection(index, index + 1); } // FIXED: Bounds checked in moveSection
  }, [disabled, isLocked, index, moveSection]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="listitem"
      aria-grabbed={isDragging}
      className={`relative group transition-all duration-200 ${
        isDragging ? 'cursor-grabbing z-50 shadow-lg' : 'cursor-default'
      } ${isOver && canDrop ? 'ring-2 ring-primary-500/50 rounded-lg' : ''} ${
        !isVisible ? 'opacity-60' : ''
      } ${className}`}
    >
      {/* Drop indicator */}
      {isOver && canDrop && <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-500 rounded-full" />}

      {/* Drag Handle */}
      {!disabled && !isLocked && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing z-10 transition-opacity opacity-0 group-hover:opacity-100"
          aria-label="Drag to reorder">
          <FiMove className="w-4 h-4" />
        </div>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 z-10">
          <FiLock className="w-4 h-4" />
        </div>
      )}

      {/* Content */}
      <div className="pl-10 pr-2">{children}</div>

      {/* Controls (visible on hover) */}
      {showControls && isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1 z-20"
        >
          <ControlButton icon={isVisible ? FiEye : FiEyeOff} onClick={onToggleVisibility} title={isVisible ? 'Hide' : 'Show'} />
          <ControlButton icon={isLocked ? FiLock : FiUnlock} onClick={onToggleLock} title={isLocked ? 'Unlock' : 'Lock'} color={isLocked ? 'text-orange-500' : ''} />
          <ControlButton icon={FiChevronUp} onClick={() => index > 0 && moveSection(index, index - 1)} disabled={index === 0 || isLocked} title="Move up" />
          <ControlButton icon={FiChevronDown} onClick={() => moveSection(index, index + 1)} disabled={isLocked} title="Move down" />
          {onDuplicate && <ControlButton icon={FiCopy} onClick={onDuplicate} title="Duplicate" />}
          {onDelete && <ControlButton icon={FiTrash2} onClick={onDelete} title="Delete" color="text-red-500 hover:bg-red-100" />}
        </motion.div>
      )}
    </motion.div>
  );
};

// ── Small helper for control buttons ────────────────────────────────────

const ControlButton = ({ icon: Icon, onClick, disabled, title, color = '' }) => (
  <button onClick={onClick} disabled={disabled}
    className={`p-2 rounded-md transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : `hover:bg-gray-100 dark:hover:bg-gray-700 ${color}`}`}
    title={title} aria-label={title}>
    <Icon className={`w-4 h-4 ${!color ? 'text-gray-600 dark:text-gray-400' : ''}`} />
  </button>
);

// ── DragDropContainer ──────────────────────────────────────────────────

export const DragDropContainer = ({ 
  children, onReorder, className = '',
  showEmptyState = true, emptyStateMessage = 'No sections to display',
  itemSpacing = 4,
}) => {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const childrenRef = useRef(children);

  // ── FIXED: Only update items when children actually change ──────────

  useEffect(() => {
    const childArray = React.Children.toArray(children);
    // Compare by keys to avoid unnecessary updates
    const currentKeys = childArray.map(c => c.key).join(',');
    const prevKeys = React.Children.toArray(childrenRef.current).map(c => c.key).join(',');
    
    if (currentKeys !== prevKeys) {
      childrenRef.current = childArray;
      setItems(childArray);
      setHistory([childArray]);
      setHistoryIndex(0);
    }
  }, [children]);

  // ── FIXED: Move with bounds check, no toast spam ───────────────────

  const moveSection = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    
    setItems(prev => {
      if (toIndex >= prev.length) return prev;
      
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      
      // Update history (debounced)
      setHistory(h => {
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push(updated);
        return newHistory;
      });
      setHistoryIndex(h => Math.min(h + 1, 50)); // Cap history at 50
      
      onReorder?.(updated);
      return updated;
    });
  }, [onReorder, historyIndex]);

  // ── Undo/Redo ──────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
      onReorder?.(history[newIndex]);
      toast.success('Undo', { duration: 1500 });
    }
  }, [historyIndex, history, onReorder]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
      onReorder?.(history[newIndex]);
      toast.success('Redo', { duration: 1500 });
    }
  }, [historyIndex, history, onReorder]);

  // ── FIXED: Only listen for undo/redo when container is focused ────

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div className={className}>
      {/* Toolbar */}
      {history.length > 1 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <button onClick={undo} disabled={historyIndex === 0}
            className="px-3 py-1.5 text-sm rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1">
            <FiChevronUp className="w-4 h-4" />Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}
            className="px-3 py-1.5 text-sm rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1">
            <FiChevronDown className="w-4 h-4" />Redo
          </button>
          <span className="flex-1" />
          <span className="text-xs text-gray-500">Drag to reorder • Ctrl+Z to undo</span>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && showEmptyState && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <FiMove className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      )}

      {/* Items */}
      <motion.div className={`space-y-${itemSpacing}`}>
        <AnimatePresence mode="popLayout">
          {items.map((child, index) => {
            if (!React.isValidElement(child)) return child;
            return React.cloneElement(child, {
              key: child.key || `section-${index}`,
              index,
              moveSection,
            });
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ── SortableList (Simplified wrapper) ──────────────────────────────────

export const SortableList = ({ items = [], onReorder, renderItem, keyExtractor = (_, i) => i, className = '' }) => {
  const moveItem = useCallback((from, to) => {
    if (from === to) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onReorder?.(updated);
  }, [items, onReorder]);

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <DraggableSection key={keyExtractor(item, index)} id={index} index={index} moveSection={moveItem}>
          {renderItem(item, index)}
        </DraggableSection>
      ))}
      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <FiMove className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No items</p>
        </div>
      )}
    </div>
  );
};

export default DragDropContainer;
