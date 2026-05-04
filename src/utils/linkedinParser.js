/**
 * LinkedIn Profile Parser
 * 
 * IMPORTANT: LinkedIn's Terms of Service prohibit scraping their website.
 * The HTML parsing functionality is provided as a reference only.
 * 
 * In production, use the official LinkedIn API or encourage users to
 * download their data archive from LinkedIn (Settings → Data Privacy → Get a copy of your data).
 */

// ── Constants ──────────────────────────────────────────────────────────────

const SUPPORTED_JSON_FORMATS = ['linkedin_export', 'generic'];

// ── Utilities ──────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined' && typeof DOMParser !== 'undefined';

const safeText = (element, fallback = '') => {
  try {
    return element?.textContent?.trim() || fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (year, month) => {
  if (!year) return '';
  if (!month) return String(year);
  return `${year}-${String(month).padStart(2, '0')}`;
};

const validateProfile = (profile) => {
  const errors = [];
  if (!profile?.personal?.fullName) errors.push('Missing full name');
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ── LinkedIn Parser ───────────────────────────────────────────────────────

export const linkedinParser = {
  /**
   * Parse LinkedIn profile from HTML content.
   * 
   * ⚠️ WARNING: LinkedIn ToS prohibits scraping. This is for educational use only.
   * In production, encourage users to use the official LinkedIn data export.
   */
  parseProfile(htmlContent) {
    // SSR guard
    if (!isBrowser) {
      console.warn('LinkedIn HTML parsing is only available in browser environments.');
      return null;
    }

    if (!htmlContent || typeof htmlContent !== 'string') {
      throw new Error('Invalid HTML content provided.');
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const profile = {
        personal: {},
        experience: [],
        education: [],
        skills: [],
      };

      // Parse name
      profile.personal.fullName = safeText(
        doc.querySelector('.text-heading-xlarge, h1.inline')
      );

      // Parse headline/title
      profile.personal.title = safeText(
        doc.querySelector('.text-body-medium, .pv-top-card--list-bullet li')
      );

      // Parse location
      profile.personal.location = safeText(
        doc.querySelector('.text-body-small.inline.t-black--light, .pv-top-card--list-bullet')
      );

      // Parse summary/about
      profile.personal.summary = safeText(
        doc.querySelector('.pv-about-section .pv-shared-text-with-see-more span')
      );

      // Parse experience
      const expItems = doc.querySelectorAll('.pv-entity__position-group, .experience-item');
      expItems.forEach(item => {
        const title = safeText(item.querySelector('h3, .profile-section-card__title'));
        const company = safeText(item.querySelector('.pv-entity__secondary-title, .experience-item__subtitle'));
        if (title) {
          profile.experience.push({
            title,
            company,
            dateRange: safeText(item.querySelector('.pv-entity__date-range span, .date-range')),
            description: safeText(item.querySelector('.pv-entity__description, .show-more-less-text')),
          });
        }
      });

      // Parse education
      const eduItems = doc.querySelectorAll('.pv-education-entity, .education-item');
      eduItems.forEach(item => {
        const school = safeText(item.querySelector('.pv-entity__school-name, .profile-section-card__title'));
        if (school) {
          profile.education.push({
            institution: school,
            degree: safeText(item.querySelector('.pv-entity__degree-name span')),
            field: safeText(item.querySelector('.pv-entity__fos span')),
          });
        }
      });

      // Parse skills
      const skillItems = doc.querySelectorAll('.pv-skill-category-entity__name-text, .skill-name');
      skillItems.forEach(item => {
        const skill = safeText(item);
        if (skill) profile.skills.push(skill);
      });

      return profile;
    } catch (error) {
      console.error('Error parsing LinkedIn HTML:', error);
      throw new Error('Failed to parse LinkedIn profile. The HTML format may have changed.');
    }
  },

  /**
   * Import from LinkedIn JSON export.
   * 
   * LinkedIn allows users to download their data archive from:
   * Settings & Privacy → Data Privacy → Get a copy of your data
   * 
   * @param {Object|string} jsonData - LinkedIn JSON export or parsed object
   * @returns {Object} Standardized resume profile
   */
  async importFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format. Expected JSON object.');
      }

      const profile = {
        personal: {
          fullName: [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || '',
          title: data.headline || '',
          location: typeof data.location === 'string' ? data.location : data.location?.name || '',
          summary: data.summary || '',
          email: data.email || data.emailAddress || '',
          phone: data.phoneNumbers?.[0]?.number || '',
          linkedin: data.publicProfileUrl || data.profileUrl || '',
        },
        experience: (data.positions || data.experience || []).map(pos => ({
          title: pos.title || '',
          company: typeof pos.company === 'string' ? pos.company : pos.company?.name || '',
          location: pos.location || pos.company?.location || '',
          startDate: formatDate(pos.startDate?.year, pos.startDate?.month),
          endDate: formatDate(pos.endDate?.year, pos.endDate?.month),
          current: pos.endDate === null || pos.endDate === undefined,
          description: (pos.description || '').replace(/<\/?[^>]+(>|$)/g, ''), // Strip HTML tags
        })),
        education: (data.education || []).map(edu => ({
          institution: edu.schoolName || edu.school?.name || '',
          degree: edu.degree || edu.degreeName || '',
          field: edu.fieldOfStudy || edu.fieldsOfStudy?.[0] || '',
          startDate: String(edu.startDate?.year || ''),
          endDate: String(edu.endDate?.year || ''),
          gpa: edu.gpa || '',
        })),
        skills: (data.skills || []).map(skill => 
          typeof skill === 'string' ? skill : (skill.name || skill.skill || '')
        ).filter(Boolean),
        certifications: (data.certifications || []).map(cert => ({
          name: cert.name || '',
          issuer: cert.authority || cert.organization || '',
          date: formatDate(cert.startDate?.year, cert.startDate?.month),
          url: cert.url || cert.certificationUrl || '',
        })),
        languages: (data.languages || []).map(lang => ({
          language: lang.name || '',
          proficiency: lang.proficiency || '',
        })),
      };

      // Validate
      const validation = validateProfile(profile);
      if (!validation.isValid) {
        console.warn('Profile validation warnings:', validation.errors);
      }

      return profile;
    } catch (error) {
      if (error.message.includes('Invalid data format')) {
        throw error;
      }
      console.error('Error importing LinkedIn JSON:', error);
      throw new Error('Failed to import LinkedIn data. Please check the file format.');
    }
  },

  /**
   * Validate if the JSON data appears to be a LinkedIn export.
   */
  isLinkedInExport(data) {
    if (!data || typeof data !== 'object') return false;
    // LinkedIn exports typically have firstName, lastName, or positions
    return !!(data.firstName || data.lastName || data.positions || data.headline);
  },

  /**
   * Detect the format of the imported data.
   */
  detectFormat(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (this.isLinkedInExport(data)) return 'linkedin_export';
      return 'generic';
    } catch {
      return 'unknown';
    }
  },
};

export default linkedinParser;