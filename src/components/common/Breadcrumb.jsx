import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

// ── Route Label Mappings ──────────────────────────────────────────────────
/**
 * Maps route paths to human-readable labels.
 * Extend this with your application's routes.
 */
const ROUTE_LABELS = {
  'dashboard': 'Dashboard',
  'builder': 'Resume Builder',
  'my-resumes': 'My Resumes',
  'templates': 'Templates',
  'preview': 'Preview',
  'profile': 'Profile',
  'settings': 'Settings',
  'billing': 'Billing & Plans',
  'ats-scanner': 'ATS Scanner',
  'cover-letter': 'Cover Letter',
  'analytics': 'Analytics',
  'admin': 'Admin Panel',
  'pricing': 'Pricing',
  'about': 'About Us',
  'contact': 'Contact',
  'blog': 'Blog',
  'features': 'Features',
  'help': 'Help Center',
  'faq': 'FAQ',
  'privacy': 'Privacy Policy',
  'terms': 'Terms of Service',
  'careers': 'Careers',
  'login': 'Sign In',
  'signup': 'Create Account',
  'forgot-password': 'Forgot Password',
  'verify-email': 'Verify Email',
};

/**
 * Maximum label length before truncation.
 */
const MAX_LABEL_LENGTH = 30;

/**
 * Paths that should not appear in breadcrumbs.
 */
const HIDDEN_PATHS = ['edit', 'create', 'new', 'view'];

// ── Utility Functions ─────────────────────────────────────────────────────

/**
 * Converts a path segment to a human-readable label.
 */
const pathToLabel = (path) => {
  // Check if it's a known route
  if (ROUTE_LABELS[path]) {
    return ROUTE_LABELS[path];
  }
  
  // Check if it's a dynamic ID (UUID, Firebase ID, etc.)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(path) || 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path)) {
    return 'Details'; // Generic label for dynamic IDs
  }
  
  // Default: humanize the path
  return path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncates a label if it exceeds the maximum length.
 */
const truncateLabel = (label, maxLength = MAX_LABEL_LENGTH) => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
};

/**
 * Generates breadcrumb items from the current path.
 */
const generateBreadcrumbsFromPath = (pathname, customItems = []) => {
  // Use custom items if provided
  if (customItems.length > 0) {
    return customItems.map(item => ({
      ...item,
      label: truncateLabel(item.label),
    }));
  }

  const paths = pathname.split('/').filter(Boolean);
  
  // Home is always the first item
  const breadcrumbs = [];
  
  // Only add Dashboard as first item if we're in the app (logged-in area)
  if (paths.length > 0 && paths[0] !== '') {
    // Don't add Dashboard for public routes
    const isPublicRoute = ['pricing', 'about', 'contact', 'blog', 'features', 
                          'help', 'faq', 'privacy', 'terms', 'careers',
                          'login', 'signup', 'forgot-password'].includes(paths[0]);
    
    if (!isPublicRoute && paths[0] !== 'blog') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/dashboard',
        isHome: true,
      });
    }
  }

  // Generate remaining breadcrumbs
  paths.forEach((path, index) => {
    // Skip hidden paths
    if (HIDDEN_PATHS.includes(path.toLowerCase())) return;
    
    const currentPath = '/' + paths.slice(0, index + 1).join('/');
    const label = pathToLabel(path);
    const isLast = index === paths.length - 1;
    
    // For dynamic IDs, use the parent path
    if (label === 'Details' && index > 0) {
      // Don't add - the parent label is sufficient
      return;
    }
    
    breadcrumbs.push({
      label: truncateLabel(label),
      path: currentPath,
      isLast,
      isDynamic: label === 'Details',
    });
  });

  return breadcrumbs;
};

// ── Component ─────────────────────────────────────────────────────────────

const Breadcrumb = ({ 
  items = [], 
  separator = null,
  showHome = true,
  className = '',
  maxItems = 5,
  onItemClick = null,
}) => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const generated = generateBreadcrumbsFromPath(location.pathname, items);
    
    // Limit number of items (collapse middle items if too many)
    if (generated.length > maxItems) {
      const first = generated[0];
      const last = generated[generated.length - 1];
      const middle = [{ label: '...', path: null, isEllipsis: true }];
      
      return [first, ...middle, last];
    }
    
    return generated;
  }, [location.pathname, items, maxItems]);

  // Don't render if only home
  if (breadcrumbs.length <= 1 && showHome) return null;

  // ── JSON-LD Structured Data ────────────────────────────────────────────
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs
      .filter(item => !item.isEllipsis)
      .map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.label,
        'item': item.path ? `${window.location.origin}${item.path}` : undefined,
      })),
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Visual Breadcrumb */}
      <nav 
        aria-label="Breadcrumb"
        className={`flex items-center flex-wrap gap-1 text-sm ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {/* Home Icon */}
          {showHome && (
            <li className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Home"
              >
                <FiHome className="w-4 h-4" />
              </Link>
              
              {breadcrumbs.length > 0 && (
                <span className="mx-1 text-gray-300 dark:text-gray-600" aria-hidden="true">
                  {separator || <FiChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
            </li>
          )}

          {/* Breadcrumb Items */}
          {breadcrumbs.map((item, index) => (
            <li key={item.path || `ellipsis-${index}`} className="flex items-center">
              {item.isEllipsis ? (
                <span 
                  className="px-2 py-1 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                  title="More items"
                >
                  ...
                </span>
              ) : item.isLast ? (
                // Current page (not clickable)
                <span
                  className="px-2 py-1 text-gray-900 dark:text-gray-100 font-medium bg-gray-100 dark:bg-gray-800 rounded-md"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                // Parent page (clickable)
                <Link
                  to={item.path}
                  className="px-2 py-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 truncate max-w-[150px] sm:max-w-[200px]"
                  onClick={onItemClick ? (e) => onItemClick(item, e) : undefined}
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}

              {/* Separator (not after last item) */}
              {!item.isLast && index < breadcrumbs.length - 1 && (
                <span className="mx-1 text-gray-300 dark:text-gray-600" aria-hidden="true">
                  {separator || <FiChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// ── Usage Examples Component ──────────────────────────────────────────────

/**
 * Example usage and documentation for the Breadcrumb component.
 * Remove this in production.
 */
export const BreadcrumbExamples = () => {
  const exampleItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Resumes', path: '/my-resumes' },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Auto-generated from URL */}
      <Breadcrumb />
      
      {/* With custom items */}
      <Breadcrumb items={exampleItems} />
      
      {/* Custom separator */}
      <Breadcrumb separator={<span className="text-gray-400">/</span>} />
      
      {/* Without home icon */}
      <Breadcrumb showHome={false} />
    </div>
  );
};

export default Breadcrumb;