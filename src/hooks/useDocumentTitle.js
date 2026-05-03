// src/hooks/useDocumentTitle.js
import { useEffect, useRef } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_APP_NAME = 'ResumeAI Pro';
const SEPARATOR = ' | ';

// ── useDocumentTitle ──────────────────────────────────────────────────────

/**
 * Sets the document title and restores it on unmount.
 * 
 * @param {string} title - The page-specific title
 * @param {Object} options - Configuration options
 * @param {string} options.suffix - App name suffix (default: 'ResumeAI Pro')
 * @param {string} options.separator - Separator between title and suffix (default: ' | ')
 * @param {boolean} options.prepend - Put suffix before title instead of after
 */
export const useDocumentTitle = (title, options = {}) => {
  const {
    suffix = DEFAULT_APP_NAME,
    separator = SEPARATOR,
    prepend = false,
  } = options;

  const previousTitleRef = useRef(null);

  useEffect(() => {
    // SSR guard
    if (typeof document === 'undefined') return;

    // Store current title for restoration
    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title;
    }

    // Build new title
    const newTitle = title
      ? (prepend 
          ? `${suffix}${separator}${title}` 
          : `${title}${separator}${suffix}`)
      : suffix;

    document.title = newTitle;

    return () => {
      // Restore previous title
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
      }
    };
  }, [title, suffix, separator, prepend]);
};

// ── usePageTitle (Declarative with additional metadata) ──────────────────

/**
 * Sets page title and optional meta description.
 * 
 * @param {Object} pageMeta - Page metadata
 * @param {string} pageMeta.title - Page title
 * @param {string} pageMeta.description - Meta description
 * @param {string} pageMeta.suffix - App name suffix
 */
export const usePageTitle = ({ title, description, suffix = DEFAULT_APP_NAME }) => {
  const previousTitleRef = useRef(null);
  const previousDescriptionRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Store current values
    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title;
    }

    // Set title
    document.title = title ? `${title}${SEPARATOR}${suffix}` : suffix;

    // Set meta description if provided
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        if (previousDescriptionRef.current === null) {
          previousDescriptionRef.current = metaDescription.getAttribute('content');
        }
        metaDescription.setAttribute('content', description);
      }
    }

    return () => {
      // Restore previous title
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
      }

      // Restore previous meta description
      if (previousDescriptionRef.current !== null) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', previousDescriptionRef.current);
        }
      }
    };
  }, [title, description, suffix]);
};

// ── useTitleTemplate ─────────────────────────────────────────────────────

/**
 * Creates a reusable title template for consistent page titles.
 * 
 * @example
 * const { setPageTitle } = useTitleTemplate({ suffix: 'MyApp' });
 * // In any component:
 * setPageTitle('Dashboard'); // Sets: "Dashboard | MyApp"
 */
export const useTitleTemplate = (options = {}) => {
  const {
    suffix = DEFAULT_APP_NAME,
    separator = SEPARATOR,
  } = options;

  const setPageTitle = (title) => {
    if (typeof document === 'undefined') return;
    document.title = title ? `${title}${separator}${suffix}` : suffix;
  };

  return { setPageTitle };
};

// ── useMetaTags ──────────────────────────────────────────────────────────

/**
 * Dynamically sets meta tags for the page.
 * 
 * @param {Object} meta - Meta tag key-value pairs
 */
export const useMetaTags = (meta = {}) => {
  const previousValuesRef = useRef({});

  useEffect(() => {
    if (typeof document === 'undefined') return;

    Object.entries(meta).forEach(([name, content]) => {
      if (!content) return;

      // Try to find existing meta tag
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      
      // Create if doesn't exist
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }

      // Store previous value
      if (!(name in previousValuesRef.current)) {
        previousValuesRef.current[name] = metaTag.getAttribute('content');
      }

      // Set new content
      metaTag.setAttribute('content', content);
    });

    return () => {
      // Restore previous values
      Object.entries(previousValuesRef.current).forEach(([name, content]) => {
        const metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
          if (content) {
            metaTag.setAttribute('content', content);
          } else {
            metaTag.remove();
          }
        }
      });
      previousValuesRef.current = {};
    };
  }, [meta]);
};

export default useDocumentTitle;