import { lazy } from 'react';
import { 
  FiHome, 
  FiFileText, 
  FiLayout, 
  FiUser, 
  FiSettings,
  FiCreditCard,
  FiInfo,
  FiMail,
  FiShield,
  FiUsers,
  FiBarChart2,
  FiActivity,
  FiAward
} from 'react-icons/fi';

// Lazy load pages for better performance with prefetch hints
export const routes = {
  // Public routes (no authentication required)
  public: [
    {
      path: '/',
      component: lazy(() => import('../pages/Home')),
      exact: true,
      meta: {
        title: 'Home',
        description: 'Create professional ATS-optimized resumes with AI-powered suggestions',
        showInNav: true,
        icon: FiHome
      }
    },
    {
      path: '/features',
      component: lazy(() => import('../pages/Features')),
      exact: true,
      meta: {
        title: 'Features',
        description: 'Discover all the powerful features of ResumeAi Pro',
        showInNav: true
      }
    },
    {
      path: '/pricing',
      component: lazy(() => import('../pages/Pricing')),
      exact: true,
      meta: {
        title: 'Pricing',
        description: 'Choose the perfect plan for your career journey',
        showInNav: true,
        icon: FiCreditCard
      }
    },
    {
      path: '/templates',
      component: lazy(() => import('../pages/Templates')),
      exact: true,
      meta: {
        title: 'Resume Templates',
        description: 'Browse our collection of professional ATS-friendly templates',
        showInNav: true,
        icon: FiLayout
      }
    },
    {
      path: '/blog',
      component: lazy(() => import('../pages/Blog')),
      exact: true,
      meta: {
        title: 'Blog',
        description: 'Career advice, resume tips, and job search strategies',
        showInNav: true
      }
    },
    {
      path: '/blog/:slug',
      component: lazy(() => import('../pages/BlogPost')),
      exact: true,
      meta: {
        title: 'Blog Post',
        showInNav: false
      }
    },
    {
      path: '/login',
      component: lazy(() => import('../pages/Login')),
      exact: true,
      meta: {
        title: 'Sign In',
        description: 'Sign in to your ResumeAi Pro account',
        showInNav: false,
        redirectIfAuth: '/dashboard'
      }
    },
    {
      path: '/signup',
      component: lazy(() => import('../pages/SignUp')),
      exact: true,
      meta: {
        title: 'Sign Up',
        description: 'Create your free ResumeAi Pro account',
        showInNav: false,
        redirectIfAuth: '/dashboard'
      }
    },
    {
      path: '/forgot-password',
      component: lazy(() => import('../pages/ForgotPassword')),
      exact: true,
      meta: {
        title: 'Reset Password',
        description: 'Reset your account password',
        showInNav: false,
        redirectIfAuth: '/dashboard'
      }
    },
    {
      path: '/verify-email',
      component: lazy(() => import('../pages/VerifyEmail')),
      exact: true,
      meta: {
        title: 'Verify Email',
        description: 'Verify your email address',
        showInNav: false
      }
    },
    {
      path: '/about',
      component: lazy(() => import('../pages/About')),
      exact: true,
      meta: {
        title: 'About Us',
        description: 'Learn about ResumeAi Pro and our mission',
        showInNav: false,
        icon: FiInfo
      }
    },
    {
      path: '/contact',
      component: lazy(() => import('../pages/Contact')),
      exact: true,
      meta: {
        title: 'Contact Us',
        description: 'Get in touch with the ResumeAi Pro team',
        showInNav: false,
        icon: FiMail
      }
    },
    {
      path: '/careers',
      component: lazy(() => import('../pages/Careers')),
      exact: true,
      meta: {
        title: 'Careers',
        description: 'Join our team and help people land their dream jobs',
        showInNav: false
      }
    },
    {
      path: '/press',
      component: lazy(() => import('../pages/Press')),
      exact: true,
      meta: {
        title: 'Press',
        description: 'Press releases and media resources',
        showInNav: false
      }
    },
    {
      path: '/privacy',
      component: lazy(() => import('../pages/Privacy')),
      exact: true,
      meta: {
        title: 'Privacy Policy',
        description: 'How we protect and handle your data',
        showInNav: false
      }
    },
    {
      path: '/terms',
      component: lazy(() => import('../pages/Terms')),
      exact: true,
      meta: {
        title: 'Terms of Service',
        description: 'Terms and conditions for using ResumeAi Pro',
        showInNav: false
      }
    },
    {
      path: '/cookies',
      component: lazy(() => import('../pages/Cookies')),
      exact: true,
      meta: {
        title: 'Cookie Policy',
        description: 'How we use cookies on ResumeAi Pro',
        showInNav: false
      }
    },
    {
      path: '/accessibility',
      component: lazy(() => import('../pages/Accessibility')),
      exact: true,
      meta: {
        title: 'Accessibility',
        description: 'Our commitment to accessibility',
        showInNav: false
      }
    },
    {
      path: '/sitemap',
      component: lazy(() => import('../pages/Sitemap')),
      exact: true,
      meta: {
        title: 'Sitemap',
        description: 'Navigate all pages on ResumeAi Pro',
        showInNav: false
      }
    }
  ],
  
  // Protected routes (authentication required)
  protected: [
    {
      path: '/dashboard',
      component: lazy(() => import('../pages/Dashboard')),
      exact: true,
      meta: {
        title: 'Dashboard',
        description: 'Manage your resumes and track your progress',
        icon: FiHome,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/builder',
      component: lazy(() => import('../pages/Builder')),
      exact: true,
      meta: {
        title: 'Create Resume',
        description: 'Build your professional ATS-optimized resume',
        icon: FiFileText,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/builder/:id',
      component: lazy(() => import('../pages/Builder')),
      exact: true,
      meta: {
        title: 'Edit Resume',
        description: 'Edit your resume',
        showInSidebar: false,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/preview/:id',
      component: lazy(() => import('../pages/Preview')),
      exact: true,
      meta: {
        title: 'Preview Resume',
        description: 'Preview your resume',
        showInSidebar: false,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/my-templates',
      component: lazy(() => import('../pages/MyTemplates')),
      exact: true,
      meta: {
        title: 'My Templates',
        description: 'Your saved and custom templates',
        icon: FiLayout,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/ats-scanner',
      component: lazy(() => import('../pages/ATSScannerPage')),
      exact: true,
      meta: {
        title: 'ATS Scanner',
        description: 'Analyze your existing resume for ATS compatibility',
        icon: FiActivity,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/analytics',
      component: lazy(() => import('../pages/Analytics')),
      exact: true,
      meta: {
        title: 'Analytics',
        description: 'Track your resume performance',
        icon: FiBarChart2,
        roles: ['premium', 'admin']
      }
    },
    {
      path: '/cover-letter',
      component: lazy(() => import('../pages/CoverLetter')),
      exact: true,
      meta: {
        title: 'Cover Letter',
        description: 'Create a matching cover letter',
        icon: FiFileText,
        roles: ['premium', 'admin']
      }
    },
    {
      path: '/import',
      component: lazy(() => import('../pages/Import')),
      exact: true,
      meta: {
        title: 'Import Resume',
        description: 'Import your resume from LinkedIn or PDF',
        icon: FiFileText,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/profile',
      component: lazy(() => import('../pages/Profile')),
      exact: true,
      meta: {
        title: 'My Profile',
        description: 'Manage your personal information',
        icon: FiUser,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/settings',
      component: lazy(() => import('../pages/Settings')),
      exact: true,
      meta: {
        title: 'Settings',
        description: 'Configure your account settings',
        icon: FiSettings,
        roles: ['user', 'premium', 'admin']
      }
    },
    {
      path: '/billing',
      component: lazy(() => import('../pages/Billing')),
      exact: true,
      meta: {
        title: 'Billing',
        description: 'Manage your subscription and payment methods',
        icon: FiCreditCard,
        roles: ['premium', 'admin']
      }
    },
    {
      path: '/api-keys',
      component: lazy(() => import('../pages/ApiKeys')),
      exact: true,
      meta: {
        title: 'API Keys',
        description: 'Manage your API access keys',
        icon: FiShield,
        roles: ['premium', 'admin']
      }
    }
  ],
  
  // Admin routes (admin role required)
  admin: [
    {
      path: '/admin',
      component: lazy(() => import('../pages/Admin/Dashboard')),
      exact: true,
      meta: {
        title: 'Admin Dashboard',
        description: 'Platform administration overview',
        icon: FiShield,
        roles: ['admin']
      }
    },
    {
      path: '/admin/users',
      component: lazy(() => import('../pages/Admin/Users')),
      exact: true,
      meta: {
        title: 'User Management',
        description: 'Manage platform users',
        icon: FiUsers,
        roles: ['admin']
      }
    },
    {
      path: '/admin/users/:userId',
      component: lazy(() => import('../pages/Admin/UserDetail')),
      exact: true,
      meta: {
        title: 'User Details',
        description: 'View and edit user details',
        showInSidebar: false,
        roles: ['admin']
      }
    },
    {
      path: '/admin/resumes',
      component: lazy(() => import('../pages/Admin/Resumes')),
      exact: true,
      meta: {
        title: 'Resume Management',
        description: 'Manage all platform resumes',
        icon: FiFileText,
        roles: ['admin']
      }
    },
    {
      path: '/admin/templates',
      component: lazy(() => import('../pages/Admin/Templates')),
      exact: true,
      meta: {
        title: 'Template Management',
        description: 'Manage resume templates',
        icon: FiLayout,
        roles: ['admin']
      }
    },
    {
      path: '/admin/analytics',
      component: lazy(() => import('../pages/Admin/Analytics')),
      exact: true,
      meta: {
        title: 'Platform Analytics',
        description: 'Detailed platform analytics and metrics',
        icon: FiBarChart2,
        roles: ['admin']
      }
    },
    {
      path: '/admin/settings',
      component: lazy(() => import('../pages/Admin/Settings')),
      exact: true,
      meta: {
        title: 'Admin Settings',
        description: 'Platform configuration settings',
        icon: FiSettings,
        roles: ['admin']
      }
    },
    {
      path: '/admin/logs',
      component: lazy(() => import('../pages/Admin/Logs')),
      exact: true,
      meta: {
        title: 'System Logs',
        description: 'View system activity logs',
        icon: FiActivity,
        roles: ['admin']
      }
    },
    {
      path: '/admin/feature-flags',
      component: lazy(() => import('../pages/Admin/FeatureFlags')),
      exact: true,
      meta: {
        title: 'Feature Flags',
        description: 'Manage feature toggles',
        icon: FiAward,
        roles: ['admin']
      }
    }
  ],
  
  // Error routes (404, 500, etc.)
  errors: [
    {
      path: '/404',
      component: lazy(() => import('../pages/NotFound')),
      exact: true,
      meta: {
        title: '404 - Page Not Found',
        description: 'The page you are looking for does not exist'
      }
    },
    {
      path: '/500',
      component: lazy(() => import('../pages/ServerError')),
      exact: true,
      meta: {
        title: '500 - Server Error',
        description: 'An unexpected error occurred'
      }
    },
    {
      path: '/maintenance',
      component: lazy(() => import('../pages/Maintenance')),
      exact: true,
      meta: {
        title: 'Maintenance',
        description: 'We are currently performing maintenance'
      }
    },
    {
      path: '*',
      component: lazy(() => import('../pages/NotFound')),
      meta: {
        title: '404 - Page Not Found'
      }
    }
  ]
};

// Flatten all routes for easy lookup
export const getAllRoutes = () => {
  return [
    ...routes.public,
    ...routes.protected,
    ...routes.admin,
    ...routes.errors
  ];
};

// Get navigation items (routes that should appear in navigation)
export const getNavigationItems = (userRole = null) => {
  const allRoutes = [...routes.public, ...routes.protected];
  
  return allRoutes
    .filter(route => route.meta?.showInNav)
    .filter(route => {
      if (!route.meta?.roles) return true;
      if (!userRole) return false;
      return route.meta.roles.includes(userRole);
    });
};

// Get sidebar items for dashboard
export const getSidebarItems = (userRole = 'user') => {
  const protectedRoutes = routes.protected.filter(route => 
    route.meta?.icon && route.meta?.showInSidebar !== false
  );
  
  const adminRoutes = userRole === 'admin' ? routes.admin.filter(route => 
    route.meta?.icon && route.meta?.showInSidebar !== false
  ) : [];
  
  return [...protectedRoutes, ...adminRoutes].filter(route => {
    if (!route.meta?.roles) return true;
    return route.meta.roles.includes(userRole);
  });
};

// Get route by path
export const getRouteByPath = (path) => {
  const allRoutes = getAllRoutes();
  return allRoutes.find(route => {
    // Handle dynamic routes
    const routePath = route.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${routePath}$`);
    return regex.test(path);
  });
};

// Get breadcrumbs for current path
export const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  let currentPath = '';
  
  for (const path of paths) {
    currentPath += `/${path}`;
    const route = getRouteByPath(currentPath);
    
    if (route) {
      breadcrumbs.push({
        path: currentPath,
        title: route.meta?.title || path,
        icon: route.meta?.icon
      });
    }
  }
  
  return breadcrumbs;
};

// Check if route requires authentication
export const isProtectedRoute = (path) => {
  const allProtectedPaths = [
    ...routes.protected.map(r => r.path),
    ...routes.admin.map(r => r.path)
  ];
  
  return allProtectedPaths.some(routePath => {
    const regex = new RegExp(`^${routePath.replace(/:\w+/g, '[^/]+')}$`);
    return regex.test(path);
  });
};

// Check if route requires admin role
export const isAdminRoute = (path) => {
  return routes.admin.some(route => {
    const regex = new RegExp(`^${route.path.replace(/:\w+/g, '[^/]+')}$`);
    return regex.test(path);
  });
};

// Get route meta data
export const getRouteMeta = (path) => {
  const route = getRouteByPath(path);
  return route?.meta || {
    title: 'ResumeAi Pro',
    description: 'Create professional ATS-optimized resumes'
  };
};

// Get default redirect after login
export const getDefaultRedirect = (userRole) => {
  if (userRole === 'admin') return '/admin';
  return '/dashboard';
};

// Route groups for code splitting
export const routeGroups = {
  auth: ['/login', '/signup', '/forgot-password', '/verify-email'],
  dashboard: ['/dashboard', '/builder', '/profile', '/settings'],
  admin: ['/admin'],
  marketing: ['/', '/features', '/pricing', '/templates', '/blog', '/about', '/contact']
};

// Prefetch routes for better performance
export const prefetchRoutes = [
  '/dashboard',
  '/builder',
  '/templates'
];

export default routes;