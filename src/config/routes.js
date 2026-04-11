import { lazy } from 'react';

// Lazy load pages for better performance
export const routes = {
  public: [
    {
      path: '/',
      component: lazy(() => import('../pages/Home')),
      exact: true
    },
    {
      path: '/login',
      component: lazy(() => import('../pages/Login')),
      exact: true
    },
    {
      path: '/signup',
      component: lazy(() => import('../pages/SignUp')),
      exact: true
    },
    {
      path: '/forgot-password',
      component: lazy(() => import('../pages/ForgotPasswordPage')),
      exact: true
    },
    {
      path: '/pricing',
      component: lazy(() => import('../pages/Pricing')),
      exact: true
    },
    {
      path: '/about',
      component: lazy(() => import('../pages/About')),
      exact: true
    },
    {
      path: '/contact',
      component: lazy(() => import('../pages/Contact')),
      exact: true
    },
    {
      path: '/privacy',
      component: lazy(() => import('../pages/Privacy')),
      exact: true
    },
    {
      path: '/terms',
      component: lazy(() => import('../pages/Terms')),
      exact: true
    }
  ],
  
  protected: [
    {
      path: '/dashboard',
      component: lazy(() => import('../pages/Dashboard')),
      exact: true
    },
    {
      path: '/builder/:id?',
      component: lazy(() => import('../pages/Builder')),
      exact: true
    },
    {
      path: '/templates',
      component: lazy(() => import('../pages/Templates')),
      exact: true
    },
    {
      path: '/profile',
      component: lazy(() => import('../pages/Profile')),
      exact: true
    },
    {
      path: '/settings',
      component: lazy(() => import('../pages/Settings')),
      exact: true
    }
  ],
  
  admin: [
    {
      path: '/admin',
      component: lazy(() => import('../pages/Admin')),
      exact: true
    }
  ],
  
  errors: [
    {
      path: '*',
      component: lazy(() => import('../pages/NotFound'))
    }
  ]
};