import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

// ── useCommandPalette Hook ───────────────────────────────────────────────

export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

// ── CommandPalette Component ─────────────────────────────────────────────

const CommandPalette = ({ isOpen, onClose, onToggle, commands = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute top-20 left-1/2 w-full max-w-lg -translate-x-1/2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-2">
              <div className="flex items-center gap-3 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                <FiSearch className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />
                <button
                  onClick={onClose}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close command palette"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 max-h-80 overflow-y-auto p-2">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action?.();
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {cmd.icon && <cmd.icon className="h-4 w-4 text-gray-500" />}
                      <span>{cmd.label}</span>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-gray-500">No commands found</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;