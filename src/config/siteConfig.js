import { FiLayout, FiFileText, FiStar, FiCpu, FiBook } from 'react-icons/fi';

export const siteConfig = {
  name: 'Resume Ai Pro',
  shortName: 'Maniesta',
  tagline: 'AI-Powered ATS Resume Builder',
  description:
    'Create professional, ATS-optimized resumes with AI-powered suggestions. Stand out from the crowd and land your dream job faster with Resume Ai Pro.',
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

  url: process.env.REACT_APP_SITE_URL || 'https://resumeaixpro.netlify.app',
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.resumeai.pro',

  author: 'Usman Murtaza',
  authorLinks: {
    github: 'https://github.com/usmannmurtazaa',
    portfolio: 'https://usmanmurtaza.netlify.app',
    linkedin: 'https://linkedin.com/in/usmanmurtaza01',
    twitter: 'https://twitter.com/usmannmurtazaa',
    email: 'usman@resumeai.pro',
  },

  links: {
    twitter: 'https://twitter.com/resumeaixpro',
    github: 'https://github.com/resumeaixpro',
    linkedin: 'https://linkedin.com/company/resumeaixpro',
    facebook: 'https://facebook.com/resumeaixpro',
    instagram: 'https://instagram.com/resumeaixpro',
    discord: 'https://discord.gg/resumeaixpro',
  },

  contact: {
    email: 'support@resumeai.pro',
    sales: 'sales@resumeai.pro',
    press: 'press@resumeai.pro',
    careers: 'careers@resumeai.pro',
    phone: '+1 (555) 123-4567',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
    },
  },

  ogImage: '/og-image.png',
  ogImageAlt: 'Resume Ai Pro - AI-Powered ATS Resume Builder',
  twitterImage: '/twitter-image.png',
  favicon: '/favicon.ico',
  logo: '/logo.png',
  logoDark: '/logo.png',

  twitter: {
    card: 'summary_large_image',
    site: '@resumeaixpro',
    creator: '@usmannmurtazaa',
  },

  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',

  termsUrl: '/terms',
  privacyUrl: '/privacy',
  cookiePolicyUrl: '/cookies',
  refundPolicyUrl: '/refund',
  accessibilityUrl: '/accessibility',

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
      { name: 'My Resumes', href: '/dashboard/resumes', icon: 'FileText' },
      { name: 'Templates', href: '/dashboard/templates', icon: 'Layout' },
      { name: 'ATS Scanner', href: '/dashboard/scanner', icon: 'Scan' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart' },
      { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
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
        { name: 'Cookie Policy', href: '/cookies' },
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

// Helper functions
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
  return siteConfig.industries.find((i) => i.id === industryId);
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

export default siteConfig;
