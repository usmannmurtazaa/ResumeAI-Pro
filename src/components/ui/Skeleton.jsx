import React from 'react';

const Skeleton = ({ 
  variant = 'rect', 
  width, 
  height, 
  className = '',
  count = 1 
}) => {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  const skeletonItem = (
    <div
      className={`
        animate-pulse bg-gray-200 dark:bg-gray-700
        ${variants[variant]}
        ${className}
      `}
      style={{ width, height }}
    />
  );

  if (count === 1) return skeletonItem;

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{skeletonItem}</React.Fragment>
      ))}
    </div>
  );
};

export default Skeleton;