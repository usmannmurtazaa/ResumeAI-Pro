/**
 * Maps logical template ids (builder, Firestore, marketing pages) to React template modules.
 * Keeps preview + PDF export in sync.
 */
export function getResumeTemplateLoader(templateId) {
  const id = String(templateId || 'modern').toLowerCase();

  switch (id) {
    case 'classic':
    case 'executive':
    case 'corporate':
    case 'minimal':
      return () => import('./Template2.jsx');
    case 'creative':
    case 'startup':
      return () => import('./Template3.jsx');
    case 'tech':
      return () => import('./Template4.jsx');
    case 'elegant':
      return () => import('./Template5.jsx');
    case 'modern':
    default:
      return () => import('./Template1.jsx');
  }
}
