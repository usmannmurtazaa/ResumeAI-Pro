import React, { forwardRef } from 'react';

const Textarea = forwardRef(({ 
  label, 
  error, 
  className = '',
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-3 rounded-xl
          border border-gray-200 dark:border-gray-700
          bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          outline-none transition-all duration-200 resize-y
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;