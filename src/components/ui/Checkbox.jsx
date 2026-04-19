import React, { forwardRef } from 'react';
import { FiCheck } from 'react-icons/fi';

const Checkbox = forwardRef(({ 
  label, 
  error, 
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className={`
            w-5 h-5 rounded border-2 
            border-gray-300 dark:border-gray-600
            peer-checked:border-primary-500 peer-checked:bg-primary-500
            transition-all duration-200
            ${error ? 'border-red-500' : ''}
          `}>
            <FiCheck className={`
              w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              transition-opacity duration-200
              ${props.checked ? 'opacity-100' : 'opacity-0'}
            `} />
          </div>
        </div>
        {label && (
          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
export default Checkbox;