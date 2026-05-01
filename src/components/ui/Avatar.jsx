import React, { useState, useCallback } from 'react';
import { FiUser } from 'react-icons/fi';

// ── Constants ─────────────────────────────────────────────────────────────

const SIZES = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', badge: 'w-2 h-2' },
  sm: { container: 'w-8 h-8', text: 'text-xs', badge: 'w-2.5 h-2.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', badge: 'w-3 h-3' },
  lg: { container: 'w-12 h-12', text: 'text-base', badge: 'w-3.5 h-3.5' },
  xl: { container: 'w-16 h-16', text: 'text-lg', badge: 'w-4 h-4' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', badge: 'w-4 h-4' },
};

const GRADIENT_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
];

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
  premium: 'bg-yellow-500',
  admin: 'bg-purple-500',
};

// ── Utility Functions ────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name) => {
  if (!name) return GRADIENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
};

// ── Component ─────────────────────────────────────────────────────────────

const Avatar = ({ 
  src, 
  alt = '', 
  name = '', 
  size = 'md',
  status,
  badge,
  className = '',
  onClick,
  disabled = false,
  ...props
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZES[size] || SIZES.md;
  const initials = getInitials(name);
  const gradient = getColorFromName(name);
  const showImage = src && !imgError;
  const Comp = onClick ? 'button' : 'div';

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  }, [onClick]);

  return (
    <div className="relative inline-flex flex-shrink-0">
      <Comp
        className={`
          ${sizeConfig.container} rounded-full overflow-hidden
          bg-gradient-to-br ${gradient}
          flex items-center justify-center text-white font-medium
          ${onClick ? 'cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all active:scale-95' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        onClick={disabled ? undefined : onClick}
        onKeyDown={disabled ? undefined : handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `${alt || name || 'Avatar'}` : undefined}
        title={alt || name || 'Avatar'}
        type={Comp === 'button' ? 'button' : undefined}
        {...props}
      >
        {showImage ? (
          <img 
            src={src} 
            alt={alt || name || 'Avatar'} 
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : initials ? (
          <span className={`${sizeConfig.text} select-none`} aria-hidden="true">
            {initials}
          </span>
        ) : (
          <FiUser className={`${sizeConfig.text} opacity-70`} aria-hidden="true" />
        )}
      </Comp>

      {/* Status Indicator */}
      {status && STATUS_COLORS[status] && (
        <span 
          className={`absolute bottom-0 right-0 ${sizeConfig.badge} ${STATUS_COLORS[status]} rounded-full border-2 border-white dark:border-gray-900`}
          aria-label={status}
          title={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      )}

      {/* Custom Badge */}
      {badge && !status && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );
};

// ── Avatar Group ──────────────────────────────────────────────────────────

export const AvatarGroup = ({ 
  avatars = [], 
  max = 5, 
  size = 'md',
  className = '',
}) => {
  const visible = avatars.slice(0, max);
  const hidden = avatars.length - max;

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {visible.map((avatar, index) => (
        <div key={index} className="relative ring-2 ring-white dark:ring-gray-900 rounded-full">
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {hidden > 0 && (
        <div className={`${SIZES[size]?.container || 'w-10 h-10'} rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white dark:ring-gray-900`}>
          +{hidden}
        </div>
      )}
    </div>
  );
};

export default React.memo(Avatar);