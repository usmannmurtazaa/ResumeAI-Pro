// ── src/data/constants.js ────────────────────────────────────────────────

// ==========================================================================
// Application Constants
// ==========================================================================

export const APP_NAME = 'ResumeAI Pro';
export const APP_VERSION = '2.5.0';
export const APP_DESCRIPTION = 'AI-powered ATS resume builder';
export const APP_URL = 'https://resumeaixpro.netlify.app';
export const SUPPORT_EMAIL = 'support@resumeaipro.com';
export const PRIVACY_EMAIL = 'privacy@resumeaipro.com';
export const LEGAL_EMAIL = 'legal@resumeaipro.com';

// ==========================================================================
// Feature Flags & Limits
// ==========================================================================

export const FREE_RESUME_LIMIT = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_EVENTS_TO_FETCH = 200;
export const MAX_NOTIFICATIONS_PER_PAGE = 50;
export const RESUMES_PER_PAGE = 20;
export const USERS_PER_PAGE = 20;
export const BATCH_CHUNK_SIZE = 400;
export const DEBOUNCE_AUTO_SAVE = 1500; // ms
export const DEBOUNCE_SEARCH = 300; // ms
export const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

// ==========================================================================
// Resume Sections
// ==========================================================================

export const RESUME_SECTIONS = [
  'personal',
  'education',
  'experience',
  'skills',
  'projects',
  'certifications',
];

export const RESUME_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

// ==========================================================================
// ATS Score Grades
// ==========================================================================

export const SCORE_GRADES = [
  { min: 95, grade: 'A+', label: 'Outstanding', color: 'text-emerald-600' },
  { min: 90, grade: 'A', label: 'Excellent', color: 'text-green-600' },
  { min: 80, grade: 'B+', label: 'Very Good', color: 'text-lime-600' },
  { min: 70, grade: 'B', label: 'Good', color: 'text-blue-600' },
  { min: 60, grade: 'C+', label: 'Satisfactory', color: 'text-cyan-600' },
  { min: 50, grade: 'C', label: 'Average', color: 'text-yellow-600' },
  { min: 40, grade: 'D', label: 'Below Average', color: 'text-orange-600' },
  { min: 30, grade: 'E', label: 'Poor', color: 'text-red-600' },
  { min: 0, grade: 'F', label: 'Critical', color: 'text-red-700' },
];

// ==========================================================================
// Resume Templates
// ==========================================================================

export const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: '🎨', description: 'Clean and contemporary', color: 'from-blue-500 to-cyan-500' },
  { id: 'classic', name: 'Classic', icon: '📄', description: 'Traditional format', color: 'from-gray-600 to-gray-800' },
  { id: 'creative', name: 'Creative', icon: '✨', description: 'Stand out design', color: 'from-purple-500 to-pink-500' },
  { id: 'minimal', name: 'Minimal', icon: '◻️', description: 'Simple and elegant', color: 'from-green-500 to-emerald-500' },
  { id: 'executive', name: 'Executive', icon: '👔', description: 'Senior positions', color: 'from-slate-700 to-slate-900' },
  { id: 'tech', name: 'Tech', icon: '💻', description: 'Tech industry focus', color: 'from-indigo-500 to-blue-600' },
];

// ==========================================================================
// Template Categories (for TemplateSelector)
// ==========================================================================

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'executive', name: 'Executive', icon: '👔' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'minimal', name: 'Minimal', icon: '✨' },
];

// ==========================================================================
// Auth Providers
// ==========================================================================

export const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Continue with Google', icon: 'FcGoogle' },
  { id: 'github', label: 'Continue with GitHub', icon: 'FiGithub' },
  { id: 'facebook', label: 'Continue with Facebook', icon: 'FiFacebook' },
];

// ==========================================================================
// Theme Presets
// ==========================================================================

export const THEME_PRESETS = {
  default: { name: 'Default', primary: '#6366f1', accent: '#8b5cf6' },
  ocean: { name: 'Ocean', primary: '#0ea5e9', accent: '#06b6d4' },
  forest: { name: 'Forest', primary: '#10b981', accent: '#059669' },
  sunset: { name: 'Sunset', primary: '#f59e0b', accent: '#ef4444' },
  rose: { name: 'Rose', primary: '#ec4899', accent: '#f43f5e' },
  midnight: { name: 'Midnight', primary: '#1e293b', accent: '#334155' },
  lavender: { name: 'Lavender', primary: '#a855f7', accent: '#d946ef' },
  mint: { name: 'Mint', primary: '#14b8a6', accent: '#2dd4bf' },
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// ==========================================================================
// Firebase Collections
// ==========================================================================

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  RESUMES: 'resumes',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  SUBSCRIPTIONS: 'subscriptions',
  ANALYTICS: 'analytics',
  SESSIONS: 'sessions',
  DELETED_ACCOUNTS: 'deletedAccounts',
};

// ==========================================================================
// Notification Types
// ==========================================================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  RESUME_CREATED: 'resume_created',
  RESUME_UPDATED: 'resume_updated',
  RESUME_DELETED: 'resume_deleted',
  RESUME_DOWNLOADED: 'resume_downloaded',
  ATS_SCORE_CHANGED: 'ats_score_changed',
  ATS_SCORE_MILESTONE: 'ats_score_milestone',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  NEW_FEATURE: 'new_feature',
  WELCOME: 'welcome',
  TIP: 'tip',
};

// ==========================================================================
// Allowed File Types
// ==========================================================================

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

// ==========================================================================
// Date/Time Formats
// ==========================================================================

export const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export const TIME_FORMATS = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

// ==========================================================================
// Restricted Profile Fields (security)
// ==========================================================================

export const RESTRICTED_PROFILE_FIELDS = [
  'role',
  'status',
  'emailVerified',
  'authProvider',
  'createdAt',
  'updatedAt',
  'lastLogin',
  'lastLogout',
  'metadata',
  'linkedProviders',
  'providerData',
  'userId',
  'uid',
];

// ==========================================================================
// Storage Paths
// ==========================================================================

export const STORAGE_PATHS = {
  AVATARS: 'avatars',
  RESUMES: 'resumes',
  PROFILE_IMAGES: 'avatars',
};

// ==========================================================================
// Local Storage Keys
// ==========================================================================

export const LOCAL_STORAGE_KEYS = {
  THEME_MODE: 'themeMode',
  THEME_PRESET: 'themePreset',
  CUSTOM_THEME: 'customTheme',
  FONT_SIZE: 'fontSize',
  REDUCED_MOTION: 'reducedMotion',
  HIGH_CONTRAST: 'highContrast',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  ADMIN_SIDEBAR_COLLAPSED: 'adminSidebarCollapsed',
  BUILDER_PREVIEW: 'builder_preview',
  RESUME_VIEW_MODE: 'resumeViewMode',
  COOKIE_CONSENT: 'cookieConsent',
  NOTIFICATION_SOUND: 'notification_sound',
  REMEMBERED_EMAIL: 'remembered_email',
  SESSION_ID: 'resumeai-pro.current-session-id',
};

// ==========================================================================
// Roles & domain enums (formerly src/utils/constants.js — single source here)
// ==========================================================================

export const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
};

/** Slug map for filters — distinct from `TEMPLATE_CATEGORIES` (UI array for selector). */
export const TEMPLATE_CATEGORY_SLUGS = {
  PROFESSIONAL: 'professional',
  CREATIVE: 'creative',
  EXECUTIVE: 'executive',
  MODERN: 'modern',
  MINIMAL: 'minimal',
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
  'Retail',
];

export const JOB_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Manager',
  'Director',
  'Executive',
  'Internship',
];

export const FILE_SIZE_LIMITS = {
  AVATAR: MAX_PROFILE_IMAGE_SIZE,
  RESUME_PDF: MAX_FILE_SIZE,
  IMPORT: 2 * 1024 * 1024,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/** Human-readable date format tokens (settings UI uses `DATE_FORMATS` array below). */
export const DATE_TEMPLATE_STRINGS = {
  DISPLAY: 'MMM DD, YYYY',
  API: 'YYYY-MM-DD',
  MONTH_YEAR: 'MMM YYYY',
};

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

export const TOAST_DURATIONS = {
  SHORT: 2000,
  NORMAL: 4000,
  LONG: 6000,
};

/** Default Tailwind-style breakpoints for non-hook consumers. */
export const STANDARD_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ==========================================================================
// Route Paths
// ==========================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  BUILDER: '/builder',
  TEMPLATES: '/templates',
  PRICING: '/pricing',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  BILLING: '/billing',
  MY_RESUMES: '/my-resumes',
  ANALYTICS: '/analytics',
  ATS_SCANNER: '/ats-scanner',
  COVER_LETTER: '/cover-letter',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESUMES: '/admin/resumes',
  BLOG: '/blog',
  ABOUT: '/about',
  CONTACT: '/contact',
  HELP: '/help',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CAREERS: '/careers',
  FEATURES: '/features',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
};

// ==========================================================================
// Common Password List (for validation)
// ==========================================================================

export const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '12345678', 'qwerty123',
  'admin123', 'letmein123', 'welcome123', 'abc123456', 'Password1',
];

// ==========================================================================
// Quick Tips (Dashboard)
// ==========================================================================

export const QUICK_TIPS = [
  { icon: 'FiTarget', title: 'Use Keywords', description: 'Include industry-specific keywords from the job description', color: 'text-blue-500' },
  { icon: 'FiStar', title: 'Quantify Results', description: 'Use numbers and percentages to demonstrate your impact', color: 'text-green-500' },
  { icon: 'FiFileText', title: 'Keep it Simple', description: 'Avoid complex formatting, tables, or graphics', color: 'text-purple-500' },
];

export default {
  APP_NAME, APP_VERSION, APP_DESCRIPTION, APP_URL,
  SUPPORT_EMAIL, PRIVACY_EMAIL, LEGAL_EMAIL,
  FREE_RESUME_LIMIT, MAX_FILE_SIZE, MAX_PROFILE_IMAGE_SIZE,
  MAX_EVENTS_TO_FETCH, MAX_NOTIFICATIONS_PER_PAGE, RESUMES_PER_PAGE, USERS_PER_PAGE,
  BATCH_CHUNK_SIZE, DEBOUNCE_AUTO_SAVE, DEBOUNCE_SEARCH, ADMIN_SESSION_TIMEOUT,
  RESUME_SECTIONS, RESUME_STATUS, SCORE_GRADES,
  TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_SLUGS, SOCIAL_PROVIDERS,
  THEME_PRESETS, THEME_MODES, FIRESTORE_COLLECTIONS,
  NOTIFICATION_TYPES, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES,
  DATE_FORMATS, DATE_TEMPLATE_STRINGS, TIME_FORMATS, LANGUAGES, RESTRICTED_PROFILE_FIELDS,
  STORAGE_PATHS, LOCAL_STORAGE_KEYS, ROUTES, COMMON_PASSWORDS, QUICK_TIPS,
  USER_ROLES, INDUSTRIES, JOB_LEVELS, FILE_SIZE_LIMITS, PAGINATION,
  ANIMATION_DURATIONS, TOAST_DURATIONS, STANDARD_BREAKPOINTS,
};