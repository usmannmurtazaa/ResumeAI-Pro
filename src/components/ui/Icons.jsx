import React from 'react';

/**
 * Inline SVG icon set — Feather-style geometry.
 * No external dependency. Each icon accepts:
 *   size      → width / height (default 24)
 *   color     → stroke color (default 'currentColor')
 *   className → forwarded
 *   ...props  → any other SVG attribute
 *
 * Drop-in replacement for react-icons/fi for the icons used in the
 * resume builder. Import as:
 *   import { FiCheckCircle, FiPlus } from '../../ui/Icons';
 */

const base = (size, color, className, children, props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const FiCloud = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(size, color, className, <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />, props);

export const FiBriefcase = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>,
    props
  );

export const FiRefreshCw = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>,
    props
  );

export const FiCpu = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </>,
    props
  );

export const FiShield = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(size, color, className, <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, props);

export const FiCode = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>,
    props
  );

export const FiPenTool = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </>,
    props
  );

export const FiTrendingUp = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>,
    props
  );

export const FiGlobe = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>,
    props
  );

export const FiFile = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </>,
    props
  );

export const FiCheckCircle = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>,
    props
  );

export const FiClock = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>,
    props
  );

export const FiSearch = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    props
  );

export const FiPlus = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    props
  );

export const FiX = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    props
  );

export const FiMove = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </>,
    props
  );

export const FiChevronUp = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(size, color, className, <polyline points="18 15 12 9 6 15" />, props);

export const FiChevronDown = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(size, color, className, <polyline points="6 9 12 15 18 9" />, props);

export const FiCalendar = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>,
    props
  );

export const FiEye = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    props
  );

export const FiCopy = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>,
    props
  );

export const FiTrash2 = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>,
    props
  );

export const FiAward = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </>,
    props
  );

export const FiExternalLink = ({ size = 24, color = 'currentColor', className, ...props }) =>
  base(
    size,
    color,
    className,
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>,
    props
  );
