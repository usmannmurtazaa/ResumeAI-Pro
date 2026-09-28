import { FiLayout, FiFileText, FiStar, FiCpu, FiBook } from 'react-icons/fi';

export const siteConfig = {
  name: 'Maniesta Career OS',
  shortName: 'Maniesta Career OS',
  tagline: 'AI-Powered ATS Resume Builder',
  description:
    'Create professional, ATS-optimized resumes with AI-powered suggestions. Stand out from the crowd and land your dream job faster with Maniesta Career OS.',
  keywords: [
    'resume builder',
    'ATS resume',
    'CV maker',
    'professional resume',
    'AI resume builder',
    'job application',
    'career tools',
    'resume templates',
    'cover letter',
    'job search',
  ],

  url: process.env.REACT_APP_SITE_URL || 'https://maniestacareer.netlify.app',
  // apiUrl removed - the app uses the Firebase SDK directly, not a REST API.
  // Any code reading siteConfig.apiUrl will receive an empty string.
  apiUrl: '',

  author: 'Usman Murtaza',
  authorLinks: {
    github: 'https://github.com/Usmannmurtazaa',
    portfolio: 'https://usmanmurtaza.netlify.app',
    linkedin: 'https://www.linkedin.com/in/Usmannmurtazaa/',
    twitter: 'https://twitter.com/usmann_murtazaa',
    email: 'usmanmurtazaportfolio@gmail.com',
  },

  // Brand social accounts have not been created yet. Empty strings here
  // mean the Footer (and any other consumer that filters on `href`) will
  // simply not render these icons. Add real URLs when the accounts exist.
  links: {
    twitter: '',
    github: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    discord: '',
  },

  contact: {
    email: 'usmanmurtazaportfolio@gmail.com',
    address: {
      city: 'Karachi',
      country: 'Pakistan',
    },
  },

  ogImage: '/og-image.png',
  ogImageAlt: 'Maniesta Career OS - AI-Powered ATS Resume Builder',
  twitterImage: '/twitter-image.png',
  favicon: '/favicon.ico',
  logo: '/logo.png',
  logoDark: '/logo.png',

  twitter: {
    card: 'summary_large_image',
    site: '@usmann_murtazaa',
    creator: '@usmann_murtazaa',
  },

  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',

  termsUrl: '/terms',
  privacyUrl: '/privacy',

  pricing: {
    currency: 'USD',
    plans: {
      free: {
        name: 'Free',
        price: 0,
        features: ['5 Resumes', 'Basic Templates', 'ATS Score Check', 'PDF Download'],
      },
      pro: {
        name: 'Professional',
        price: 19.99,
        period: 'month',
        features: [
          'Unlimited Resumes',
          'Premium Templates',
          'AI Suggestions',
          'Priority Support',
          'LinkedIn Import',
        ],
      },
      business: {
        name: 'Business',
        price: 49.99,
        period: 'month',
        features: [
          'Everything in Pro',
          'Team Management',
          'Analytics Dashboard',
          'API Access',
          'Custom Branding',
        ],
      },
    },
  },

  features: {
    enableAISuggestions: true,
    enableLinkedInImport: true,
    enableJobMatching: true,
    enableCoverLetter: true,
    enableMultipleLanguages: true,
    enableDarkMode: true,
    enableCollaboration: false,
    enableAnalytics: true,
    enableNotifications: true,
    enableChat: true,
  },

  limits: {
    free: {
      maxResumes: 5,
      maxTemplates: 5,
      maxAISuggestions: 10,
      maxImports: 3,
    },
    pro: {
      maxResumes: -1,
      maxTemplates: -1,
      maxAISuggestions: -1,
      maxImports: -1,
    },
    business: {
      maxResumes: -1,
      maxTemplates: -1,
      maxAISuggestions: -1,
      maxImports: -1,
      maxTeamMembers: 10,
    },
  },

  templates: [
    {
      id: 'modern',
      name: 'Modern Professional',
      category: 'professional',
      thumbnail: '/templates/modern.png',
      description: 'Clean and contemporary design with a professional touch',
      popular: true,
      Icon: FiLayout,
    },
    {
      id: 'classic',
      name: 'Classic Executive',
      category: 'executive',
      thumbnail: '/templates/classic.png',
      description: 'Traditional format ideal for senior positions',
      popular: true,
      Icon: FiFileText,
    },
    {
      id: 'creative',
      name: 'Creative Portfolio',
      category: 'creative',
      thumbnail: '/templates/creative.png',
      description: 'Stand out with a unique and creative layout',
      Icon: FiStar,
    },
    {
      id: 'tech',
      name: 'Tech Innovator',
      category: 'tech',
      thumbnail: '/templates/tech.png',
      description: 'Modern design tailored for tech industry',
      popular: true,
      Icon: FiCpu,
    },
    {
      id: 'elegant',
      name: 'Elegant Serif',
      category: 'academic',
      thumbnail: '/templates/elegant.png',
      description: 'Sophisticated serif design for academic positions',
      Icon: FiBook,
    },
  ],

  // ── SEO Configuration ────────────────────────────────────────────────
  // Central source of truth for per-route metadata. The SeoManager
  // component reads this via getSeoForPath(pathname) and injects the
  // correct <title>, <meta name="description">, <link rel="canonical">,
  // and <meta name="robots"> for the current route.
  seo: {
    siteName: 'Maniesta Career OS',
    siteUrl: 'https://maniestacareer.netlify.app',
    defaultImage: 'https://maniestacareer.netlify.app/og-image.png',
    defaultImageAlt: 'Maniesta Career OS - AI-Powered ATS Resume Builder',
    twitterHandle: '@usmann_murtazaa',
    twitterCreator: '@usmann_murtazaa',
    authorName: 'Usman Murtaza',
    defaultRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

    routes: {
      // ─── Public, indexable ────────────────────────────────────────
      '/': {
        title: 'Maniesta Career OS - AI-Powered ATS Resume Builder',
        description:
          'Create ATS-optimised resumes with AI-powered suggestions, 25+ professional templates, real-time scoring, and instant PDF download. Free to start.',
        robots: 'index, follow',
      },
      '/features': {
        title: 'Features - AI Resume Builder Tools | Maniesta Career OS',
        description:
          'Explore Maniesta Career OS features: AI content generation, ATS scoring, keyword suggestions, LinkedIn import, and 25+ professional templates.',
        robots: 'index, follow',
      },
      '/pricing': {
        title: 'Pricing - Free & Premium Resume Plans | Maniesta Career OS',
        description:
          'Simple pricing for every job seeker. Start free, upgrade for unlimited resumes, premium templates, and AI-powered optimisation. No credit card required.',
        robots: 'index, follow',
      },
      '/templates': {
        title: 'Resume Templates - Professional & ATS-Ready | Maniesta Career OS',
        description:
          'Browse 25+ professional resume templates optimised for ATS. Modern, classic, creative, and tech designs. Pick one, customise, and download.',
        robots: 'index, follow',
      },
      '/blog': {
        title: 'Career & Resume Blog | Maniesta Career OS',
        description:
          'Practical advice on resume writing, ATS optimisation, job search strategy, and career growth - written for modern job seekers.',
        robots: 'index, follow',
      },
      '/blog/:slug': {
        title: 'Article | Maniesta Career OS',
        description:
          'Practical advice on resume writing, ATS optimisation, and job search strategy from the Maniesta Career OS team.',
        robots: 'index, follow',
      },
      '/about': {
        title: 'About Usman Murtaza & Maniesta Career OS',
        description:
          'Learn about Maniesta Career OS, created by Usman Murtaza - a Full Stack Developer building modern web applications with React and AI.',
        robots: 'index, follow',
      },
      '/careers': {
        title: 'Careers - Join Maniesta Career OS',
        description:
          'Explore career opportunities at Maniesta Career OS and the Maniesta ecosystem. We hire developers, designers, and content writers.',
        robots: 'index, follow',
      },
      '/contact': {
        title: 'Contact Maniesta Career OS - Support & Inquiries',
        description:
          'Get in touch with Maniesta Career OS for support, feedback, partnerships, or business inquiries. We respond within 24 hours.',
        robots: 'index, follow',
      },
      '/help': {
        title: 'Help Center | Maniesta Career OS',
        description:
          'Find answers to common questions about using Maniesta Career OS - building resumes, ATS scoring, templates, billing, and account management.',
        robots: 'index, follow',
      },
      '/faq': {
        title: 'FAQ - Frequently Asked Questions | Maniesta Career OS',
        description:
          'Answers to common questions about ATS resumes, Maniesta Career OS features, pricing, and how to land more interviews.',
        robots: 'index, follow',
      },
      '/privacy': {
        title: 'Privacy Policy | Maniesta Career OS',
        description:
          'How Maniesta Career OS collects, uses, and protects your personal data. Your privacy and data security are our priority.',
        robots: 'index, follow',
      },
      '/terms': {
        title: 'Terms of Service | Maniesta Career OS',
        description:
          'Terms and conditions for using Maniesta Career OS. Read our acceptable use policy, subscription terms, and user responsibilities.',
        robots: 'index, follow',
      },

      // ─── Auth routes (not for indexing) ──────────────────────────
      '/login': {
        title: 'Sign In | Maniesta Career OS',
        description: 'Sign in to your Maniesta Career OS account to manage your resumes.',
        robots: 'noindex, nofollow',
      },
      '/signup': {
        title: 'Create Account | Maniesta Career OS',
        description:
          'Create a free Maniesta Career OS account and start building ATS-optimised resumes.',
        robots: 'noindex, nofollow',
      },
      '/forgot-password': {
        title: 'Reset Password | Maniesta Career OS',
        description: 'Reset your Maniesta Career OS account password.',
        robots: 'noindex, nofollow',
      },
      '/verify-email': {
        title: 'Verify Email | Maniesta Career OS',
        description: 'Verify your email address to complete your Maniesta Career OS registration.',
        robots: 'noindex, nofollow',
      },

      // ─── Protected routes (require auth, not for indexing) ───────
      '/dashboard': {
        title: 'Dashboard | Maniesta Career OS',
        description: 'Your Maniesta Career OS dashboard.',
        robots: 'noindex, nofollow',
      },
      '/builder/:id?': {
        title: 'Resume Builder | Maniesta Career OS',
        description: 'Build and edit your resume with AI assistance.',
        robots: 'noindex, nofollow',
      },
      '/profile': {
        title: 'Profile | Maniesta Career OS',
        description: 'Manage your Maniesta Career OS profile.',
        robots: 'noindex, nofollow',
      },
      '/settings': {
        title: 'Settings | Maniesta Career OS',
        description: 'Manage your Maniesta Career OS preferences.',
        robots: 'noindex, nofollow',
      },
      '/my-resumes': {
        title: 'My Resumes | Maniesta Career OS',
        description: 'View and manage all of your resumes.',
        robots: 'noindex, nofollow',
      },
      '/preview/:id': {
        title: 'Preview Resume | Maniesta Career OS',
        description: 'Preview your resume.',
        robots: 'noindex, nofollow',
      },
      '/ats-scanner': {
        title: 'ATS Scanner | Maniesta Career OS',
        description: 'Scan your resume for ATS compatibility and get optimisation tips.',
        robots: 'noindex, nofollow',
      },
      '/billing': {
        title: 'Billing | Maniesta Career OS',
        description: 'Manage your Maniesta Career OS subscription and billing.',
        robots: 'noindex, nofollow',
      },
      '/analytics': {
        title: 'Analytics | Maniesta Career OS',
        description: 'Track your resume performance and job application analytics.',
        robots: 'noindex, nofollow',
      },
      '/cover-letter': {
        title: 'Cover Letter Builder | Maniesta Career OS',
        description: 'Build AI-assisted cover letters that match your resume.',
        robots: 'noindex, nofollow',
      },

      // ─── Admin (never index) ──────────────────────────────────────
      '/admin/*': {
        title: 'Admin | Maniesta Career OS',
        description: 'Maniesta Career OS admin panel.',
        robots: 'noindex, nofollow',
      },
    },

    notFound: {
      title: 'Page Not Found | Maniesta Career OS',
      description: 'The page you are looking for does not exist or has been moved.',
      robots: 'noindex, nofollow',
    },
  },

  // Navigation
  navigation: {
    main: [
      { name: 'Features', href: '/features' },
      { name: 'Templates', href: '/templates' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Blog', href: '/blog' },
    ],
    dashboard: [
      { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { name: 'My Resumes', href: '/my-resumes', icon: 'FileText' },
      { name: 'Templates', href: '/templates', icon: 'Layout' },
      { name: 'ATS Scanner', href: '/ats-scanner', icon: 'Scan' },
      { name: 'Analytics', href: '/analytics', icon: 'BarChart' },
      { name: 'Settings', href: '/settings', icon: 'Settings' },
    ],
    admin: [
      { name: 'Admin Dashboard', href: '/admin', icon: 'Shield' },
      { name: 'User Management', href: '/admin/users', icon: 'Users' },
      { name: 'Analytics', href: '/admin/analytics', icon: 'TrendingUp' },
      { name: 'Settings', href: '/admin/settings', icon: 'Settings' },
    ],
    footer: {
      product: [
        { name: 'Features', href: '/features' },
        { name: 'Templates', href: '/templates' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'FAQ', href: '/faq' },
      ],
      company: [
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
      ],
      resources: [
        { name: 'Resume Tips', href: '/blog/resume-tips' },
        { name: 'Career Advice', href: '/blog/career' },
        { name: 'ATS Guide', href: '/blog/ats-guide' },
        { name: 'Interview Prep', href: '/blog/interview' },
      ],
      legal: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
      ],
    },
  },

  // API Endpoints
  api: {
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify',
      resetPassword: '/auth/reset-password',
    },
    resumes: {
      list: '/resumes',
      create: '/resumes',
      get: '/resumes/:id',
      update: '/resumes/:id',
      delete: '/resumes/:id',
      duplicate: '/resumes/:id/duplicate',
      download: '/resumes/:id/download',
    },
    ats: {
      scan: '/ats/scan',
      analyze: '/ats/analyze',
      suggestions: '/ats/suggestions',
      score: '/ats/score',
    },
    ai: {
      generate: '/ai/generate',
      suggest: '/ai/suggest',
      improve: '/ai/improve',
      keywords: '/ai/keywords',
    },
    import: {
      linkedin: '/import/linkedin',
      json: '/import/json',
      pdf: '/import/pdf',
    },
  },

  // Analytics Events
  analytics: {
    events: {
      PAGE_VIEW: 'page_view',
      SIGNUP_STARTED: 'signup_started',
      SIGNUP_COMPLETED: 'signup_completed',
      LOGIN: 'login',
      RESUME_CREATED: 'resume_created',
      RESUME_UPDATED: 'resume_updated',
      RESUME_DELETED: 'resume_deleted',
      RESUME_DOWNLOADED: 'resume_downloaded',
      TEMPLATE_SELECTED: 'template_selected',
      ATS_SCAN: 'ats_scan',
      AI_SUGGESTION_USED: 'ai_suggestion_used',
      UPGRADE_STARTED: 'upgrade_started',
      UPGRADE_COMPLETED: 'upgrade_completed',
    },
  },

  // Error Messages
  errors: {
    auth: {
      invalidEmail: 'Please enter a valid email address',
      weakPassword: 'Password must be at least 8 characters with letters and numbers',
      emailInUse: 'This email is already registered',
      userNotFound: 'No account found with this email',
      wrongPassword: 'Incorrect password',
      tooManyRequests: 'Too many attempts. Please try again later',
      networkError: 'Network error. Please check your connection',
    },
    resume: {
      notFound: 'Resume not found',
      saveFailed: 'Failed to save resume',
      deleteFailed: 'Failed to delete resume',
      downloadFailed: 'Failed to download resume',
    },
    general: {
      serverError: 'An unexpected error occurred. Please try again',
      unauthorized: 'Please sign in to continue',
      forbidden: 'You do not have permission to access this resource',
      notFound: 'The requested resource was not found',
      validationError: 'Please check your input and try again',
    },
  },

  // Success Messages
  success: {
    auth: {
      signup: 'Account created successfully! Welcome aboard!',
      login: 'Welcome back!',
      logout: 'You have been signed out',
      passwordReset: 'Password reset email sent. Check your inbox',
      emailVerified: 'Email verified successfully',
    },
    resume: {
      created: 'Resume created successfully',
      updated: 'Resume saved',
      deleted: 'Resume deleted',
      duplicated: 'Resume duplicated',
      downloaded: 'Resume downloaded',
    },
  },

  // Date & Time Formats
  formats: {
    date: 'MMM dd, yyyy',
    dateTime: 'MMM dd, yyyy HH:mm',
    time: 'HH:mm',
    shortDate: 'MM/dd/yyyy',
    monthYear: 'MMM yyyy',
  },

  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false,
    },
    resume: {
      minSummaryLength: 50,
      maxSummaryLength: 500,
      minSkills: 3,
      minExperience: 1,
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      templates: 3600, // 1 hour
      user: 300, // 5 minutes
      resumes: 60, // 1 minute
      static: 86400, // 24 hours
    },
  },

  // Environment Information
  environment: process.env.NODE_ENV || 'development',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
};

// ── Helper functions ─────────────────────────────────────────────────

export const getFeatureFlag = (featureName) => {
  return siteConfig.features[featureName] || false;
};

export const getLimit = (plan, limitName) => {
  const planLimits = siteConfig.limits[plan];
  return planLimits ? planLimits[limitName] : siteConfig.limits.free[limitName];
};

export const getTemplateById = (templateId) => {
  return siteConfig.templates.find((t) => t.id === templateId);
};

export const getIndustryById = (industryId) => {
  return siteConfig.industries?.find((i) => i.id === industryId);
};

export const getErrorMessage = (category, errorCode) => {
  return siteConfig.errors[category]?.[errorCode] || siteConfig.errors.general.serverError;
};

export const getSuccessMessage = (category, action) => {
  return siteConfig.success[category]?.[action] || 'Operation completed successfully';
};

export const getApiEndpoint = (endpoint, params = {}) => {
  let url = siteConfig.api[endpoint.split('.')[0]]?.[endpoint.split('.')[1]] || endpoint;

  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });

  return `${siteConfig.apiUrl}${url}`;
};

export const isFeatureEnabled = (featureName) => {
  return siteConfig.features[featureName] === true;
};

export const getNavigationItem = (path) => {
  const allNav = [
    ...siteConfig.navigation.main,
    ...siteConfig.navigation.dashboard,
    ...siteConfig.navigation.admin,
  ];
  return allNav.find((item) => item.href === path);
};

/**
 * Returns the SEO metadata for a given pathname.
 *
 * Handles:
 *   - Exact matches            → '/pricing'
 *   - Dynamic segments         → '/blog/:slug', '/builder/:id?', '/preview/:id'
 *   - Prefix wildcards         → '/admin/*'
 *   - Fallback to notFound     → for unmatched paths
 *
 * @param {string} pathname - The current route pathname (without search/hash).
 * @returns {{ title: string, description: string, robots: string }}
 */
export const getSeoForPath = (pathname) => {
  const routes = siteConfig.seo.routes;

  // 1. Exact match
  if (routes[pathname]) return routes[pathname];

  // 2. Dynamic segments - convert ':param' to a wildcard and test
  for (const pattern of Object.keys(routes)) {
    if (!pattern.includes(':')) continue;
    const regexStr = '^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\?$/, '?') + '$';
    if (new RegExp(regexStr).test(pathname)) return routes[pattern];
  }

  // 3. Prefix wildcards - e.g. '/admin/*'
  for (const pattern of Object.keys(routes)) {
    if (!pattern.endsWith('/*')) continue;
    const prefix = pattern.slice(0, -2);
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return routes[pattern];
  }

  // 4. Fallback
  return siteConfig.seo.notFound;
};

export default siteConfig;
