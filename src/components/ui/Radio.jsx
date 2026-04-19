import React from 'react';

const Radio = ({ label, name, value, checked, onChange, error, className = '' }) => {
  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className={`
        w-5 h-5 rounded-full border-2 
        border-gray-300 dark:border-gray-600
        peer-checked:border-primary-500
        transition-all duration-200 relative
        ${error ? 'border-red-500' : ''}
      `}>
        <div className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-2.5 h-2.5 rounded-full bg-primary-500
          transition-opacity duration-200
          ${checked ? 'opacity-100' : 'opacity-0'}
        `} />
      </div>
      {label && (
        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default Radio;