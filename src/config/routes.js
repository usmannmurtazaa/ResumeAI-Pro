/**
 * Single source of truth for application paths and lightweight route metadata.
 *
 * IMPORTANT: Lazy-loaded React components stay in App.jsx — webpack applies
 * `webpackPrefetch` predictably only with static import() paths there.
 */

/** Public marketing/content — no authentication */
export const PUBLIC_PATHS = [
  '/',
  '/features',
  '/pricing',
  '/templates',
  '/blog',
  '/blog/:slug',
  '/about',
  '/careers',
  '/contact',
  '/help',
  '/faq',
  '/privacy',
  '/terms',
];

/** Auth flows — not wrapped in PrivateRoute */
export const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/verify-email'];

/** Protected app — gated by PrivateRoute in App.jsx (see isProtectedRoute) */
export const PROTECTED_PATHS = [
  '/dashboard',
  '/builder',
  '/builder/:id',
  '/profile',
  '/settings',
  '/my-resumes',
  '/preview/:id',
  '/ats-scanner',
  '/billing',
  '/analytics',
  '/cover-letter',
];

/** Nested under /admin/* — wired in pages/Admin.jsx */
export const ADMIN_CHILD_PATHS = {
  HOME: '',
  USERS: 'users',
  RESUMES: 'resumes',
};

const META = ({ title, description, showInNav, roles }) => ({
  title,
  description,
  showInNav: Boolean(showInNav),
  ...(roles?.length ? { roles } : {}),
});

/** Meta only — mirrors live routes in App.jsx + admin children */
export const routeDefinitions = [
  { path: '/', meta: META({ title: 'Home', showInNav: true }) },
  { path: '/features', meta: META({ title: 'Features', showInNav: true }) },
  { path: '/pricing', meta: META({ title: 'Pricing', showInNav: true }) },
  { path: '/templates', meta: META({ title: 'Resume Templates', showInNav: true }) },
  { path: '/blog', meta: META({ title: 'Blog', showInNav: true }) },
  { path: '/blog/:slug', meta: META({ title: 'Blog Post' }) },
  { path: '/about', meta: META({ title: 'About Us' }) },
  { path: '/careers', meta: META({ title: 'Careers' }) },
  { path: '/contact', meta: META({ title: 'Contact' }) },
  { path: '/help', meta: META({ title: 'Help' }) },
  { path: '/faq', meta: META({ title: 'FAQ' }) },
  { path: '/privacy', meta: META({ title: 'Privacy Policy' }) },
  { path: '/terms', meta: META({ title: 'Terms of Service' }) },
  { path: '/login', meta: META({ title: 'Sign In' }) },
  { path: '/signup', meta: META({ title: 'Sign Up' }) },
  { path: '/forgot-password', meta: META({ title: 'Reset Password' }) },
  { path: '/verify-email', meta: META({ title: 'Verify Email' }) },
  { path: '/dashboard', meta: META({ title: 'Dashboard', roles: ['user', 'premium', 'admin'] }) },
  { path: '/builder', meta: META({ title: 'Create Resume', roles: ['user', 'premium', 'admin'] }) },
  { path: '/builder/:id', meta: META({ title: 'Edit Resume', roles: ['user', 'premium', 'admin'] }) },
  { path: '/preview/:id', meta: META({ title: 'Preview Resume', roles: ['user', 'premium', 'admin'] }) },
  { path: '/profile', meta: META({ title: 'My Profile', roles: ['user', 'premium', 'admin'] }) },
  { path: '/settings', meta: META({ title: 'Settings', roles: ['user', 'premium', 'admin'] }) },
  { path: '/my-resumes', meta: META({ title: 'My Resumes', roles: ['user', 'premium', 'admin'] }) },
  { path: '/ats-scanner', meta: META({ title: 'ATS Scanner', roles: ['user', 'premium', 'admin'] }) },
  { path: '/billing', meta: META({ title: 'Billing', roles: ['user', 'premium', 'admin'] }) },
  { path: '/analytics', meta: META({ title: 'Analytics', roles: ['premium', 'admin'] }) },
  { path: '/cover-letter', meta: META({ title: 'Cover Letter', roles: ['premium', 'admin'] }) },
  { path: '/admin', meta: META({ title: 'Admin Dashboard', roles: ['admin'] }) },
  { path: '/admin/users', meta: META({ title: 'User Management', roles: ['admin'] }) },
  { path: '/admin/resumes', meta: META({ title: 'Resume Management', roles: ['admin'] }) },
];

/** Segment-wise match — supports `:param` Dynamic segments */
function matchesPattern(pattern, pathname) {
  const norm = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  if (pattern === '/') return norm === '/' || norm === '';

  const pSeg = norm.split('/').filter(Boolean);
  const rSeg = pattern.split('/').filter(Boolean);

  if (rSeg.length !== pSeg.length) return false;

  return rSeg.every((seg, i) => seg.startsWith(':') || seg === pSeg[i]);
}

export const getRouteByPath = (pathname) => {
  const clean = pathname.split('?')[0];
  return routeDefinitions.find((r) => matchesPattern(r.path, clean));
};

export const getRouteMeta = (pathname) =>
  getRouteByPath(pathname)?.meta ?? {
    title: 'ResumeAI Pro',
    description: 'Create professional ATS-optimized resumes',
  };

/**
 * Mirrors PrivateRoute usage in App.jsx (admin tree + authenticated app paths).
 */
export const isProtectedRoute = (pathname) => {
  const p = pathname.split('?')[0];
  const clean = p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;

  if (clean === '/admin' || clean.startsWith('/admin/')) return true;

  const exactProtected = [
    '/dashboard',
    '/profile',
    '/settings',
    '/my-resumes',
    '/ats-scanner',
    '/billing',
    '/analytics',
    '/cover-letter',
  ];
  if (exactProtected.includes(clean)) return true;

  if (clean === '/builder' || clean.startsWith('/builder/')) return true;
  if (clean.startsWith('/preview/')) return true;

  return false;
};

export const isAdminAreaPath = (pathname) =>
  pathname.split('?')[0] === '/admin' || pathname.split('?')[0].startsWith('/admin/');

export const getDefaultRedirect = (userRole) =>
  userRole === 'admin' ? '/admin' : '/dashboard';

export const prefetchRouteHints = ['/dashboard', '/builder', '/templates'];

export default {
  PUBLIC_PATHS,
  AUTH_PATHS,
  PROTECTED_PATHS,
  ADMIN_CHILD_PATHS,
  routeDefinitions,
};
