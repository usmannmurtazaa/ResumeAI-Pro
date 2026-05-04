// ── Industry Keywords ─────────────────────────────────────────────────────

export const industryKeywords = {
  technology: [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Microservices', 'REST API',
    'GraphQL', 'Agile', 'Scrum', 'Git', 'Linux', 'System Design',
  ],
  marketing: [
    'SEO', 'SEM', 'Social Media', 'Content Marketing', 'Email Marketing',
    'Google Analytics', 'PPC', 'CRM', 'Marketing Automation', 'Brand Strategy',
    'Market Research', 'Digital Advertising', 'Campaign Management', 'Copywriting',
    'Lead Generation', 'B2B Marketing', 'B2C Marketing', 'Growth Hacking',
  ],
  finance: [
    'Financial Analysis', 'Budgeting', 'Forecasting', 'Risk Management',
    'Investment', 'Portfolio Management', 'Excel', 'Bloomberg', 'SAP',
    'Financial Modeling', 'Auditing', 'Tax Planning', 'Valuation', 'M&A',
  ],
  healthcare: [
    'Patient Care', 'EMR', 'HIPAA', 'Clinical Research', 'Healthcare Management',
    'Medical Terminology', 'Patient Safety', 'Healthcare Compliance', 'Epic Systems',
    'Nursing', 'Diagnosis', 'Treatment Planning', 'Public Health',
  ],
  sales: [
    'Business Development', 'Account Management', 'Lead Generation', 'B2B Sales',
    'B2C Sales', 'Negotiation', 'CRM', 'Salesforce', 'Pipeline Management',
    'Revenue Growth', 'Market Expansion', 'Cold Calling', 'Consultative Selling',
  ],
  education: [
    'Curriculum Development', 'Classroom Management', 'Lesson Planning',
    'Student Assessment', 'Special Education', 'Educational Technology',
    'Teaching', 'Instructional Design', 'E-Learning', 'Distance Learning',
  ],
  engineering: [
    'CAD', 'SolidWorks', 'AutoCAD', 'MATLAB', 'Simulink', 'FEA', 'CFD',
    'Mechanical Design', 'Electrical Engineering', 'Civil Engineering',
    'Structural Analysis', 'Thermodynamics', 'Manufacturing', 'Quality Control',
    'Six Sigma', 'Lean Manufacturing', 'PLC', 'Robotics', 'Automation',
  ],
  design: [
    'UI/UX', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Wireframing', 'Prototyping', 'User Research', 'Usability Testing',
    'Design Systems', 'Visual Design', 'Interaction Design', 'Product Design',
  ],
  consulting: [
    'Strategy Consulting', 'Management Consulting', 'Business Analysis',
    'Process Improvement', 'Change Management', 'Stakeholder Management',
    'Client Relations', 'Problem Solving', 'Data Analysis', 'Presentation Skills',
  ],
  general: [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management',
    'Project Management', 'Critical Thinking', 'Analytical Skills', 'Organization',
    'Attention to Detail', 'Adaptability', 'Creativity', 'Initiative', 'Reliability',
  ],
};

// ── Action Verbs ──────────────────────────────────────────────────────────

export const actionVerbs = {
  leadership: ['Led', 'Managed', 'Directed', 'Supervised', 'Coordinated', 'Spearheaded', 'Orchestrated', 'Headed', 'Guided', 'Mentored', 'Trained', 'Delegated', 'Oversaw', 'Chaired', 'Facilitated'],
  achievement: ['Achieved', 'Increased', 'Decreased', 'Improved', 'Reduced', 'Generated', 'Delivered', 'Exceeded', 'Surpassed', 'Boosted', 'Maximized', 'Optimized', 'Accomplished', 'Attained', 'Realized'],
  development: ['Developed', 'Created', 'Designed', 'Built', 'Implemented', 'Launched', 'Established', 'Founded', 'Engineered', 'Architected', 'Crafted', 'Formulated', 'Devised', 'Pioneered', 'Innovated'],
  analysis: ['Analyzed', 'Evaluated', 'Assessed', 'Researched', 'Investigated', 'Identified', 'Reviewed', 'Audited', 'Examined', 'Scrutinized', 'Interpreted', 'Diagnosed', 'Forecasted', 'Projected', 'Measured'],
  collaboration: ['Collaborated', 'Partnered', 'Facilitated', 'Negotiated', 'Communicated', 'Presented', 'Advised', 'Consulted', 'Liaised', 'Coordinated', 'Mediated', 'Networked', 'United', 'Allied'],
  optimization: ['Optimized', 'Streamlined', 'Enhanced', 'Automated', 'Restructured', 'Revitalized', 'Transformed', 'Modernized', 'Refined', 'Upgraded', 'Overhauled', 'Reorganized', 'Simplified', 'Consolidated', 'Integrated'],
};

// ── Memoized Helpers ──────────────────────────────────────────────────────

const ALL_KEYWORDS = Object.values(industryKeywords).flat();
const ALL_VERBS = Object.values(actionVerbs).flat();

// ── Keyword Categories ────────────────────────────────────────────────────

const KEYWORD_CATEGORIES = {
  programming: ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB'],
  frontend: ['React', 'Angular', 'Vue', 'Next.js', 'Nuxt', 'Svelte', 'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Webpack', 'Vite', 'Redux'],
  backend: ['Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', 'ASP.NET', 'Ruby on Rails', 'NestJS', 'GraphQL', 'REST API'],
  database: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra', 'SQLite', 'Oracle', 'Firebase', 'Supabase'],
  cloud: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Cloud Computing', 'Serverless', 'Lambda', 'EC2', 'S3', 'CloudFormation', 'Terraform'],
  devops: ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Ansible', 'Puppet', 'Chef', 'Nginx', 'Apache'],
  mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Mobile Development', 'Xamarin', 'Ionic', 'Capacitor'],
  data: ['Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Data Analysis', 'Big Data', 'Hadoop', 'Spark', 'Tableau', 'Power BI'],
  soft: ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Project Management', 'Adaptability', 'Creativity', 'Collaboration', 'Mentoring'],
  business: ['Agile', 'Scrum', 'Kanban', 'Product Management', 'Business Analysis', 'Strategy', 'Stakeholder Management', 'Budgeting', 'Forecasting'],
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns all keyword categories, optionally filtered by resume data.
 */
export const getKeywordCategories = (resumeData = null) => {
  if (!resumeData) return KEYWORD_CATEGORIES;

  const text = JSON.stringify(resumeData).toLowerCase();
  const filtered = {};

  Object.entries(KEYWORD_CATEGORIES).forEach(([category, keywords]) => {
    const present = keywords.filter(kw => text.includes(kw.toLowerCase()));
    if (present.length > 0) filtered[category] = present;
  });

  return filtered;
};

/**
 * Calculates ATS compatibility score (0-100).
 */
export const calculateATSScore = (resumeData) => {
  if (!resumeData) return 0;

  let score = 0;
  const breakdown = {};

  // Personal Information (20 points)
  if (resumeData.personal) {
    let pts = 0;
    if (resumeData.personal.fullName) pts += 5;
    if (resumeData.personal.email) pts += 5;
    if (resumeData.personal.phone) pts += 4;
    if (resumeData.personal.location) pts += 3;
    if (resumeData.personal.linkedin) pts += 2;
    if (resumeData.personal.summary?.length > 50) pts += 1;
    breakdown.personal = Math.min(pts, 20);
    score += breakdown.personal;
  }

  // Experience (25 points)
  if (resumeData.experience?.length > 0) {
    let pts = Math.min(resumeData.experience.length * 5, 15);

    const desc = resumeData.experience.map(e => e.description || '').join(' ');
    if (ALL_VERBS.some(v => desc.toLowerCase().includes(v.toLowerCase()))) pts += 5;
    if (/(\d+%|\$\d+|\d+\s*(people|users|clients|team))/i.test(desc)) pts += 5;

    breakdown.experience = Math.min(pts, 25);
    score += breakdown.experience;
  }

  // Education (15 points)
  if (resumeData.education?.length > 0) {
    breakdown.education = Math.min(resumeData.education.length * 5, 15);
    score += breakdown.education;
  }

  // Skills (20 points)
  if (resumeData.skills) {
    let pts = 0;
    if (resumeData.skills.technical?.length > 0) pts += Math.min(resumeData.skills.technical.length * 2, 12);
    if (resumeData.skills.soft?.length > 0) pts += Math.min(resumeData.skills.soft.length * 2, 8);
    breakdown.skills = Math.min(pts, 20);
    score += breakdown.skills;
  }

  // Projects (10 points)
  if (resumeData.projects?.length > 0) {
    breakdown.projects = Math.min(resumeData.projects.length * 3, 10);
    score += breakdown.projects;
  }

  // Certifications (10 points)
  if (resumeData.certifications?.length > 0) {
    breakdown.certifications = Math.min(resumeData.certifications.length * 3, 10);
    score += breakdown.certifications;
  }

  return Math.min(score, 100);
};

/**
 * Analyzes a resume and returns strengths, weaknesses, and suggestions.
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

    const desc = resumeData.experience.map(e => e.description || '').join(' ');
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
 */
export const suggestKeywords = (industry, currentSkills = [], jobDescription = '') => {
  const industryWords = industryKeywords[industry?.toLowerCase()] || industryKeywords.general;

  // If job description provided, prioritize its keywords
  if (jobDescription) {
    const jobWords = ALL_KEYWORDS.filter(kw =>
      jobDescription.toLowerCase().includes(kw.toLowerCase())
    );
    return jobWords.filter(kw =>
      !currentSkills.some(s => s.toLowerCase().includes(kw.toLowerCase()))
    ).slice(0, 20);
  }

  return industryWords.filter(kw =>
    !currentSkills.some(s => s.toLowerCase().includes(kw.toLowerCase()))
  ).slice(0, 20);
};

/**
 * Calculates relevance score for a keyword (0-100).
 */
export const calculateKeywordRelevance = (keyword, industry, jobDescription = '') => {
  let relevance = 50;
  const industryWords = industryKeywords[industry?.toLowerCase()] || [];
  if (industryWords.includes(keyword)) relevance += 30;
  if (jobDescription?.toLowerCase().includes(keyword.toLowerCase())) relevance += 20;
  return Math.min(relevance, 100);
};

/**
 * Returns keyword trends (in production, fetch from API).
 */
export const getKeywordTrends = () => ({
  trending: ['AI', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps'],
  emerging: ['Web3', 'Blockchain', 'Edge Computing', 'Quantum Computing'],
  declining: ['jQuery', 'Flash', 'Silverlight'],
});

/**
 * Detects the most likely industry based on resume content.
 */
export const detectIndustry = (resumeData) => {
  if (!resumeData) return 'technology';

  const text = JSON.stringify(resumeData).toLowerCase();
  const scores = Object.entries(industryKeywords).map(([industry, keywords]) => ({
    industry,
    score: keywords.filter(kw => text.includes(kw.toLowerCase())).length,
  }));

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best.score > 2 ? best.industry : 'general';
};

/**
 * Calculates detailed metrics for a resume.
 */
export const calculateDetailedMetrics = (resumeData) => ({
  wordCount: JSON.stringify(resumeData).split(/\s+/).length,
  sectionCount: Object.keys(resumeData || {}).filter(k =>
    resumeData[k] && (Array.isArray(resumeData[k]) ? resumeData[k].length > 0 : typeof resumeData[k] === 'object' && Object.keys(resumeData[k]).length > 0)
  ).length,
  skillCount: (resumeData?.skills?.technical?.length || 0) + (resumeData?.skills?.soft?.length || 0),
  experienceCount: resumeData?.experience?.length || 0,
  educationCount: resumeData?.education?.length || 0,
});

export default {
  industryKeywords, actionVerbs, getKeywordCategories,
  calculateATSScore, analyzeResume, suggestKeywords,
  calculateKeywordRelevance, getKeywordTrends,
  detectIndustry, calculateDetailedMetrics,
};