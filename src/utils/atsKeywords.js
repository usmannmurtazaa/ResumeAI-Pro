// ── Shared data (imported from ./atsData) ─────────────────────────────────
//
// The keyword, verb, and passive-phrase constants live in `atsData.js` so
// that `atsScoring.js` can import them without creating a module cycle
// through this file. They are re-exported here for backward compatibility
// with existing consumers; new code should import them directly from
// `./atsData`.

import { industryKeywords, actionVerbs, passivePhrases } from './atsData';

export { industryKeywords, actionVerbs, passivePhrases };

// ── Canonical scorer (imported from ./atsScoring) ─────────────────────────
//
// `calculateATSScore` below delegates to `atsScoring.calculateDetailedScore`
// so that every ATS score in the application is produced by the same
// algorithm, regardless of which module computes it.

import { calculateDetailedScore } from './atsScoring';

// ── Memoized Helpers ──────────────────────────────────────────────────────
// These two flat arrays are computed once at module load and reused by the
// public helpers below.
//   - ALL_KEYWORDS is consumed by `suggestKeywords` when a job description
//     is provided.
//   - ALL_VERBS is consumed by `detectWeakVerbs`.
// `passivePhrases` is re-exported for backward compatibility and is not
// consumed inside this module.

const ALL_KEYWORDS = Object.values(industryKeywords).flat();
const ALL_VERBS = Object.values(actionVerbs).flat();

// ── Keyword Categories ────────────────────────────────────────────────────

const KEYWORD_CATEGORIES = {
  programming: [
    'JavaScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'TypeScript',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'Scala',
    'R',
    'MATLAB',
  ],
  frontend: [
    'React',
    'Angular',
    'Vue',
    'Next.js',
    'Nuxt',
    'Svelte',
    'HTML',
    'CSS',
    'Sass',
    'Tailwind',
    'Bootstrap',
    'Webpack',
    'Vite',
    'Redux',
  ],
  backend: [
    'Node.js',
    'Express',
    'Django',
    'Flask',
    'FastAPI',
    'Spring',
    'Laravel',
    'ASP.NET',
    'Ruby on Rails',
    'NestJS',
    'GraphQL',
    'REST API',
  ],
  database: [
    'SQL',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'DynamoDB',
    'Cassandra',
    'SQLite',
    'Oracle',
    'Firebase',
    'Supabase',
  ],
  cloud: [
    'AWS',
    'Azure',
    'GCP',
    'Google Cloud',
    'Cloud Computing',
    'Serverless',
    'Lambda',
    'EC2',
    'S3',
    'CloudFormation',
    'Terraform',
  ],
  devops: [
    'Docker',
    'Kubernetes',
    'Jenkins',
    'CI/CD',
    'Git',
    'GitHub Actions',
    'GitLab CI',
    'CircleCI',
    'Ansible',
    'Puppet',
    'Chef',
    'Nginx',
    'Apache',
  ],
  mobile: [
    'React Native',
    'Flutter',
    'iOS',
    'Android',
    'Swift',
    'Kotlin',
    'Mobile Development',
    'Xamarin',
    'Ionic',
    'Capacitor',
  ],
  data: [
    'Machine Learning',
    'AI',
    'Data Science',
    'TensorFlow',
    'PyTorch',
    'Pandas',
    'NumPy',
    'Scikit-learn',
    'Data Analysis',
    'Big Data',
    'Hadoop',
    'Spark',
    'Tableau',
    'Power BI',
  ],
  soft: [
    'Leadership',
    'Communication',
    'Teamwork',
    'Problem Solving',
    'Critical Thinking',
    'Time Management',
    'Project Management',
    'Adaptability',
    'Creativity',
    'Collaboration',
    'Mentoring',
  ],
  business: [
    'Agile',
    'Scrum',
    'Kanban',
    'Product Management',
    'Business Analysis',
    'Strategy',
    'Stakeholder Management',
    'Budgeting',
    'Forecasting',
  ],
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns all keyword categories, optionally filtered by resume data.
 * @param {Object|null} resumeData - Resume data object to filter categories.
 * @returns {Object} Filtered keyword categories present in the resume.
 */
export const getKeywordCategories = (resumeData = null) => {
  if (!resumeData) return KEYWORD_CATEGORIES;

  const text = JSON.stringify(resumeData).toLowerCase();
  const filtered = {};

  Object.entries(KEYWORD_CATEGORIES).forEach(([category, keywords]) => {
    const present = keywords.filter((kw) => text.includes(kw.toLowerCase()));
    if (present.length > 0) filtered[category] = present;
  });

  return filtered;
};

/**
 * Calculates the ATS compatibility score (0-100) for a resume.
 *
 * Delegates to `atsScoring.calculateDetailedScore` — the canonical
 * scorer used throughout the application — so that the same resume
 * produces the same score regardless of which module computes it.
 *
 * Behavior preserved from the previous implementation:
 *   • Empty / nullish input returns 0.
 *   • The function never throws. Circular-reference input (which would
 *     throw inside the canonical scorer's `JSON.stringify`) is caught
 *     and returns 0.
 *
 * @param {Object} resumeData - The complete resume data.
 * @returns {number} The ATS score in the range [0, 100].
 */
export const calculateATSScore = (resumeData) => {
  if (!resumeData) return 0;
  try {
    return calculateDetailedScore(resumeData).overall;
  } catch {
    return 0;
  }
};

/**
 * Analyzes a resume and returns strengths, weaknesses, and suggestions.
 * @param {Object} resumeData - Resume data.
 * @returns {{ strengths: string[], weaknesses: string[], suggestions: string[] }}
 */
export const analyzeResume = (resumeData) => {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  // Personal info
  if (resumeData?.personal?.email && resumeData?.personal?.fullName) {
    strengths.push('Complete contact information');
  } else {
    if (!resumeData?.personal?.email) weaknesses.push('Missing email address');
    if (!resumeData?.personal?.fullName) weaknesses.push('Missing full name');
  }

  if (resumeData?.personal?.summary?.length > 100) {
    strengths.push('Professional summary included');
  } else {
    weaknesses.push('Add a professional summary (100+ characters)');
    suggestions.push('Write a compelling summary highlighting your key strengths');
  }

  // Experience
  if (resumeData?.experience?.length > 0) {
    strengths.push(`${resumeData.experience.length} work experience entries`);

    const desc = resumeData.experience.map((e) => e.description || '').join(' ');
    if (/(\d+%|\$\d+)/i.test(desc)) {
      strengths.push('Quantifiable achievements included');
    } else {
      weaknesses.push('No quantifiable achievements');
      suggestions.push('Add numbers, percentages, or dollar amounts to your achievements');
    }
  } else {
    weaknesses.push('No work experience listed');
    suggestions.push('Add internships, volunteer work, or relevant projects');
  }

  // Skills
  if ((resumeData?.skills?.technical?.length || 0) >= 5) {
    strengths.push(`${resumeData.skills.technical.length} technical skills`);
  } else {
    weaknesses.push('Add more technical skills (aim for 5+)');
    suggestions.push('List programming languages, tools, and technologies');
  }

  return { strengths, weaknesses, suggestions };
};

/**
 * Suggests keywords based on industry, existing skills, and optional job description.
 * @param {string} industry - Industry name (key of industryKeywords).
 * @param {string[]} currentSkills - Currently possessed skills.
 * @param {string} [jobDescription=''] - Job description text to extract additional keywords.
 * @returns {string[]} Suggested keywords not already in currentSkills.
 */
export const suggestKeywords = (industry, currentSkills = [], jobDescription = '') => {
  const industryWords = industryKeywords[industry?.toLowerCase()] || industryKeywords.general;

  if (jobDescription) {
    const jobWords = ALL_KEYWORDS.filter((kw) =>
      jobDescription.toLowerCase().includes(kw.toLowerCase())
    );
    return jobWords
      .filter((kw) => !currentSkills.some((s) => s.toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 20);
  }

  return industryWords
    .filter((kw) => !currentSkills.some((s) => s.toLowerCase().includes(kw.toLowerCase())))
    .slice(0, 20);
};

/**
 * Calculates relevance score for a keyword (0-100).
 * @param {string} keyword - Keyword to evaluate.
 * @param {string} industry - Industry name.
 * @param {string} [jobDescription=''] - Job description text.
 * @returns {number} Relevance score.
 */
export const calculateKeywordRelevance = (keyword, industry, jobDescription = '') => {
  let relevance = 50;
  const industryWords = industryKeywords[industry?.toLowerCase()] || [];
  if (industryWords.includes(keyword)) relevance += 30;
  if (jobDescription?.toLowerCase().includes(keyword.toLowerCase())) relevance += 20;
  return Math.min(relevance, 100);
};

/**
 * Returns current keyword trends. (In production, would fetch from an API.)
 * @returns {{ trending: string[], emerging: string[], declining: string[] }}
 */
export const getKeywordTrends = () => ({
  trending: ['AI', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps'],
  emerging: ['Web3', 'Blockchain', 'Edge Computing', 'Quantum Computing'],
  declining: ['jQuery', 'Flash', 'Silverlight'],
});

/**
 * Detects the most likely industry based on resume content.
 * @param {Object} resumeData - Resume data.
 * @returns {string} The best-matching industry name.
 */
export const detectIndustry = (resumeData) => {
  if (!resumeData) return 'technology';

  const text = JSON.stringify(resumeData).toLowerCase();
  const scores = Object.entries(industryKeywords).map(([industry, keywords]) => ({
    industry,
    score: keywords.filter((kw) => text.includes(kw.toLowerCase())).length,
  }));

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best.score > 2 ? best.industry : 'general';
};

/**
 * Calculates detailed metrics for a resume.
 * @param {Object} resumeData - Resume data.
 * @returns {{ wordCount: number, sectionCount: number, skillCount: number, experienceCount: number, educationCount: number }}
 */
export const calculateDetailedMetrics = (resumeData) => ({
  wordCount: JSON.stringify(resumeData).split(/\s+/).length,
  sectionCount: Object.keys(resumeData || {}).filter(
    (k) =>
      resumeData[k] &&
      (Array.isArray(resumeData[k])
        ? resumeData[k].length > 0
        : typeof resumeData[k] === 'object' && Object.keys(resumeData[k]).length > 0)
  ).length,
  skillCount:
    (resumeData?.skills?.technical?.length || 0) + (resumeData?.skills?.soft?.length || 0),
  experienceCount: resumeData?.experience?.length || 0,
  educationCount: resumeData?.education?.length || 0,
});

/**
 * Detects weak action verbs in text.
 * @param {string} text - The text to analyze.
 * @returns {Object} Analysis results.
 */
export const detectWeakVerbs = (text) => {
  if (!text) return { weak: [], strong: [], ratio: 0 };
  const lower = text.toLowerCase();
  const weak = [];
  const strong = [];

  [
    'handled',
    'managed',
    'responsible for',
    'assisted',
    'helped',
    'supported',
    'participated',
    'worked on',
    'did',
    'made',
    'performed',
    'implemented',
    'used',
    'utilized',
    'operated',
    'maintained',
    'provided',
    'served',
  ].forEach((v) => {
    if (lower.includes(v)) weak.push(v);
  });

  ALL_VERBS.forEach((v) => {
    if (lower.includes(v.toLowerCase())) strong.push(v);
  });

  return {
    weak,
    strong,
    ratio: strong.length / (weak.length + strong.length || 1),
  };
};

/**
 * Named aggregate of the module's public surface. Declared as a named
 * constant (rather than inline in `export default`) so stack traces,
 * DevTools, and editor auto-import show the symbol as `atsKeywordsApi`
 * instead of `<anonymous>`. Consumers can import either the default export
 * or the named export - both refer to the same object.
 */
const atsKeywordsApi = {
  industryKeywords,
  actionVerbs,
  passivePhrases,
  getKeywordCategories,
  calculateATSScore,
  analyzeResume,
  suggestKeywords,
  calculateKeywordRelevance,
  getKeywordTrends,
  detectIndustry,
  calculateDetailedMetrics,
  detectWeakVerbs,
};

export { atsKeywordsApi };
export default atsKeywordsApi;
