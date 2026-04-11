import React from 'react';

const Avatar = ({ 
  src, 
  alt = '', 
  name = '', 
  size = 'md',
  className = '' 
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`
      ${sizes[size]} rounded-full overflow-hidden
      bg-gradient-to-r from-primary-500 to-accent-500
      flex items-center justify-center text-white font-medium
      ${className}
    `}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{name ? getInitials(name) : '?'}</span>
      )}
    </div>
  );
};

export default Avatar;