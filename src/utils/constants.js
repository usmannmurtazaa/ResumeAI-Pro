export const APP_NAME = 'ATS Resume Builder';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Create professional, ATS-optimized resumes';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  BUILDER: '/builder',
  TEMPLATES: '/templates',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms'
};

export const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin'
};

export const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const TEMPLATE_CATEGORIES = {
  PROFESSIONAL: 'professional',
  CREATIVE: 'creative',
  EXECUTIVE: 'executive',
  MODERN: 'modern',
  MINIMAL: 'minimal'
};

export const INDUSTRIES = [
  'Technology',
  'Marketing',
  'Finance',
  'Healthcare',
  'Education',
  'Sales',
  'Engineering',
  'Design',
  'Consulting',
  'Legal',
  'Manufacturing',
  'Retail'
];

export const JOB_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Manager',
  'Director',
  'Executive',
  'Internship'
];

export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  RESUME_PDF: 10 * 1024 * 1024, // 10MB
  IMPORT: 2 * 1024 * 1024 // 2MB
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  API: 'YYYY-MM-DD',
  MONTH_YEAR: 'MMM YYYY'
};

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

export const TOAST_DURATIONS = {
  SHORT: 2000,
  NORMAL: 4000,
  LONG: 6000
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};