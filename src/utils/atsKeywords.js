// ============================================
// INDUSTRY KEYWORDS
// ============================================

export const industryKeywords = {
  technology: [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Microservices', 'REST API',
    'GraphQL', 'Agile', 'Scrum', 'Git', 'Linux', 'System Design'
  ],
  marketing: [
    'SEO', 'SEM', 'Social Media', 'Content Marketing', 'Email Marketing',
    'Google Analytics', 'PPC', 'CRM', 'Marketing Automation', 'Brand Strategy',
    'Market Research', 'Digital Advertising', 'Campaign Management', 'Copywriting',
    'Lead Generation', 'B2B Marketing', 'B2C Marketing', 'Growth Hacking',
    'Facebook Ads', 'Google Ads', 'Instagram Marketing', 'LinkedIn Marketing'
  ],
  finance: [
    'Financial Analysis', 'Budgeting', 'Forecasting', 'Risk Management',
    'Investment', 'Portfolio Management', 'Excel', 'Bloomberg', 'SAP',
    'QuickBooks', 'Financial Modeling', 'Auditing', 'Tax Planning',
    'Valuation', 'M&A', 'Due Diligence', 'Capital Markets', 'Private Equity',
    'Venture Capital', 'Hedge Funds', 'Asset Management', 'Corporate Finance'
  ],
  healthcare: [
    'Patient Care', 'EMR', 'HIPAA', 'Clinical Research', 'Healthcare Management',
    'Medical Terminology', 'Patient Safety', 'Healthcare Compliance', 'Epic Systems',
    'Nursing', 'Diagnosis', 'Treatment Planning', 'Public Health',
    'Healthcare Administration', 'Medical Records', 'Patient Education'
  ],
  sales: [
    'Business Development', 'Account Management', 'Lead Generation', 'B2B Sales',
    'B2C Sales', 'Negotiation', 'CRM', 'Salesforce', 'Pipeline Management',
    'Customer Relationship', 'Revenue Growth', 'Market Expansion', 'Cold Calling',
    'Consultative Selling', 'Solution Selling', 'Territory Management',
    'Quota Achievement', 'Sales Strategy', 'Closing', 'Prospecting'
  ],
  education: [
    'Curriculum Development', 'Classroom Management', 'Lesson Planning',
    'Student Assessment', 'Special Education', 'Educational Technology',
    'Teaching', 'Instructional Design', 'E-Learning', 'Distance Learning',
    'Student Engagement', 'Differentiated Instruction', 'STEM Education'
  ],
  engineering: [
    'CAD', 'SolidWorks', 'AutoCAD', 'MATLAB', 'Simulink', 'FEA', 'CFD',
    'Mechanical Design', 'Electrical Engineering', 'Civil Engineering',
    'Structural Analysis', 'Thermodynamics', 'Manufacturing', 'Quality Control',
    'Six Sigma', 'Lean Manufacturing', 'PLC', 'Robotics', 'Automation'
  ],
  design: [
    'UI/UX', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
    'InDesign', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing',
    'Design Systems', 'Visual Design', 'Interaction Design', 'Product Design',
    'Graphic Design', 'Web Design', 'Mobile Design', 'Typography', 'Color Theory'
  ],
  consulting: [
    'Strategy Consulting', 'Management Consulting', 'Business Analysis',
    'Process Improvement', 'Change Management', 'Stakeholder Management',
    'Client Relations', 'Problem Solving', 'Data Analysis', 'Presentation Skills',
    'Project Management', 'Market Analysis', 'Competitive Analysis'
  ],
  general: [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management',
    'Project Management', 'Critical Thinking', 'Analytical Skills', 'Organization',
    'Attention to Detail', 'Adaptability', 'Creativity', 'Initiative', 'Reliability'
  ]
};

// ============================================
// ACTION VERBS
// ============================================

export const actionVerbs = {
  leadership: [
    'Led', 'Managed', 'Directed', 'Supervised', 'Coordinated', 'Spearheaded',
    'Orchestrated', 'Headed', 'Guided', 'Mentored', 'Trained', 'Delegated',
    'Oversaw', 'Governed', 'Administered', 'Chaired', 'Facilitated'
  ],
  achievement: [
    'Achieved', 'Increased', 'Decreased', 'Improved', 'Reduced', 'Generated',
    'Delivered', 'Exceeded', 'Surpassed', 'Boosted', 'Maximized', 'Optimized',
    'Accomplished', 'Attained', 'Realized', 'Produced', 'Yielded'
  ],
  development: [
    'Developed', 'Created', 'Designed', 'Built', 'Implemented', 'Launched',
    'Established', 'Founded', 'Constructed', 'Engineered', 'Architected',
    'Crafted', 'Formulated', 'Devised', 'Pioneered', 'Innovated'
  ],
  analysis: [
    'Analyzed', 'Evaluated', 'Assessed', 'Researched', 'Investigated',
    'Identified', 'Reviewed', 'Audited', 'Examined', 'Scrutinized',
    'Interpreted', 'Diagnosed', 'Forecasted', 'Projected', 'Measured'
  ],
  collaboration: [
    'Collaborated', 'Partnered', 'Facilitated', 'Negotiated', 'Communicated',
    'Presented', 'Advised', 'Consulted', 'Liaised', 'Coordinated',
    'Mediated', 'Arbitrated', 'Networked', 'United', 'Allied'
  ],
  optimization: [
    'Optimized', 'Streamlined', 'Enhanced', 'Automated', 'Restructured',
    'Revitalized', 'Transformed', 'Modernized', 'Refined', 'Upgraded',
    'Overhauled', 'Reorganized', 'Simplified', 'Consolidated', 'Integrated'
  ]
};

// ============================================
// KEYWORD CATEGORIES
// ============================================

export const getKeywordCategories = (resumeData = null) => {
  const categories = {
    programming: [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust',
      'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB'
    ],
    frontend: [
      'React', 'Angular', 'Vue', 'Next.js', 'Nuxt', 'Svelte', 'HTML', 'CSS',
      'Sass', 'Tailwind', 'Bootstrap', 'Webpack', 'Vite', 'Redux'
    ],
    backend: [
      'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel',
      'ASP.NET', 'Ruby on Rails', 'NestJS', 'GraphQL', 'REST API'
    ],
    database: [
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'DynamoDB', 'Cassandra', 'SQLite', 'Oracle', 'Firebase', 'Supabase'
    ],
    cloud: [
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Cloud Computing', 'Serverless',
      'Lambda', 'EC2', 'S3', 'CloudFormation', 'Terraform'
    ],
    devops: [
      'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub Actions',
      'GitLab CI', 'CircleCI', 'Ansible', 'Puppet', 'Chef', 'Nginx', 'Apache'
    ],
    mobile: [
      'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin',
      'Mobile Development', 'Xamarin', 'Ionic', 'Capacitor'
    ],
    data: [
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
      'Pandas', 'NumPy', 'Scikit-learn', 'Data Analysis', 'Big Data',
      'Hadoop', 'Spark', 'Tableau', 'Power BI'
    ],
    soft: [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
      'Critical Thinking', 'Time Management', 'Project Management',
      'Adaptability', 'Creativity', 'Collaboration', 'Mentoring'
    ],
    business: [
      'Agile', 'Scrum', 'Kanban', 'Product Management', 'Business Analysis',
      'Strategy', 'Stakeholder Management', 'Budgeting', 'Forecasting'
    ]
  };
  
  // If resume data is provided, filter categories to only those present in resume
  if (resumeData) {
    const text = JSON.stringify(resumeData).toLowerCase();
    const filteredCategories = {};
    
    Object.entries(categories).forEach(([category, keywords]) => {
      const presentKeywords = keywords.filter(kw => 
        text.includes(kw.toLowerCase())
      );
      if (presentKeywords.length > 0) {
        filteredCategories[category] = presentKeywords;
      }
    });
    
    return filteredCategories;
  }
  
  return categories;
};

// ============================================
// ATS SCORE CALCULATION
// ============================================

export const calculateATSScore = (resumeData) => {
  if (!resumeData) return 0;
  
  let score = 0;
  const breakdown = {};
  
  // Personal Information (20 points)
  if (resumeData.personal) {
    let personalScore = 0;
    if (resumeData.personal.fullName) personalScore += 5;
    if (resumeData.personal.email) personalScore += 5;
    if (resumeData.personal.phone) personalScore += 5;
    if (resumeData.personal.location) personalScore += 3;
    if (resumeData.personal.summary && resumeData.personal.summary.length > 50) personalScore += 2;
    breakdown.personal = personalScore;
    score += personalScore;
  }
  
  // Experience (25 points)
  if (resumeData.experience?.length > 0) {
    let expScore = 0;
    expScore += Math.min(resumeData.experience.length * 5, 15);
    
    const descriptions = resumeData.experience.map(e => e.description || '').join(' ');
    const hasActionVerbs = Object.values(actionVerbs).flat().some(verb =>
      descriptions.toLowerCase().includes(verb.toLowerCase())
    );
    const hasMetrics = /(\d+%|\$\d+|\d+\s*(people|users|clients|team))/i.test(descriptions);
    
    if (hasActionVerbs) expScore += 5;
    if (hasMetrics) expScore += 5;
    
    breakdown.experience = Math.min(expScore, 25);
    score += breakdown.experience;
  }
  
  // Education (15 points)
  if (resumeData.education?.length > 0) {
    breakdown.education = Math.min(resumeData.education.length * 5, 15);
    score += breakdown.education;
  }
  
  // Skills (20 points)
  if (resumeData.skills) {
    let skillsScore = 0;
    if (resumeData.skills.technical?.length > 0) {
      skillsScore += Math.min(resumeData.skills.technical.length * 2, 12);
    }
    if (resumeData.skills.soft?.length > 0) {
      skillsScore += Math.min(resumeData.skills.soft.length * 2, 8);
    }
    breakdown.skills = Math.min(skillsScore, 20);
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

// ============================================
// RESUME ANALYSIS
// ============================================

export const analyzeResume = (resumeData) => {
  const analysis = {
    score: calculateATSScore(resumeData),
    strengths: [],
    weaknesses: [],
    suggestions: [],
    missingKeywords: []
  };
  
  // Check personal info
  if (!resumeData.personal?.email) {
    analysis.weaknesses.push('Missing email address');
    analysis.suggestions.push('Add a professional email address');
  } else {
    analysis.strengths.push('Includes contact information');
  }
  
  if (!resumeData.personal?.phone) {
    analysis.weaknesses.push('Missing phone number');
    analysis.suggestions.push('Include a contact phone number');
  }
  
  if (!resumeData.personal?.summary) {
    analysis.weaknesses.push('Missing professional summary');
    analysis.suggestions.push('Add a compelling professional summary');
  } else if (resumeData.personal.summary.length > 50) {
    analysis.strengths.push('Includes professional summary');
  }
  
  // Check experience
  if (!resumeData.experience?.length) {
    analysis.weaknesses.push('No work experience listed');
    analysis.suggestions.push('Add your work experience, including internships and volunteer work');
  } else {
    analysis.strengths.push(`Includes ${resumeData.experience.length} work experience entries`);
    
    const descriptions = resumeData.experience.map(e => e.description || '').join(' ');
    const hasMetrics = /(\d+%|\$\d+|\d+\s*(people|users|clients))/i.test(descriptions);
    
    if (!hasMetrics) {
      analysis.weaknesses.push('Missing quantifiable achievements');
      analysis.suggestions.push('Add numbers and percentages to quantify your achievements');
    } else {
      analysis.strengths.push('Includes quantifiable achievements');
    }
  }
  
  // Check education
  if (!resumeData.education?.length) {
    analysis.weaknesses.push('No education listed');
    analysis.suggestions.push('Add your educational background');
  } else {
    analysis.strengths.push('Includes education details');
  }
  
  // Check skills
  if (!resumeData.skills?.technical?.length) {
    analysis.weaknesses.push('No technical skills listed');
    analysis.suggestions.push('Add relevant technical skills');
  } else if (resumeData.skills.technical.length >= 5) {
    analysis.strengths.push(`Includes ${resumeData.skills.technical.length} technical skills`);
  }
  
  return analysis;
};

// ============================================
// KEYWORD SUGGESTIONS
// ============================================

export const suggestKeywords = (industry, currentSkills = [], jobDescription = '') => {
  const industrySpecificKeywords = industryKeywords[industry?.toLowerCase()] || industryKeywords.technology;
  
  // If job description provided, extract keywords from it
  if (jobDescription) {
    const jobKeywords = extractKeywordsFromJobDescription(jobDescription);
    return jobKeywords.filter(kw => !currentSkills.some(skill => 
      skill.toLowerCase().includes(kw.toLowerCase()) ||
      kw.toLowerCase().includes(skill.toLowerCase())
    ));
  }
  
  // Otherwise suggest from industry
  return industrySpecificKeywords.filter(keyword =>
    !currentSkills.some(skill => 
      skill.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(skill.toLowerCase())
    )
  );
};

export const calculateKeywordRelevance = (keyword, industry, jobDescription = '') => {
  let relevance = 50; // Base relevance
  
  // Check if keyword is in industry-specific list
  const industryKeywordsList = industryKeywords[industry?.toLowerCase()] || [];
  if (industryKeywordsList.includes(keyword)) {
    relevance += 30;
  }
  
  // Check if keyword appears in job description
  if (jobDescription && jobDescription.toLowerCase().includes(keyword.toLowerCase())) {
    relevance += 20;
  }
  
  return Math.min(relevance, 100);
};

export const getKeywordTrends = () => {
  // Simulated trending keywords - in production this would come from an API
  return {
    trending: ['AI', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps'],
    emerging: ['Web3', 'Blockchain', 'Edge Computing', 'Quantum Computing'],
    declining: ['jQuery', 'Flash', 'Silverlight']
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const extractKeywordsFromJobDescription = (jobDescription) => {
  const allKeywords = Object.values(industryKeywords).flat();
  const text = jobDescription.toLowerCase();
  
  return allKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
};

export const detectIndustry = (resumeData) => {
  if (!resumeData) return 'technology';
  
  const text = JSON.stringify(resumeData).toLowerCase();
  const industries = Object.keys(industryKeywords);
  
  const scores = industries.map(industry => {
    const keywords = industryKeywords[industry];
    const matches = keywords.filter(kw => text.includes(kw.toLowerCase()));
    return { industry, score: matches.length };
  });
  
  const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
  return bestMatch.score > 2 ? bestMatch.industry : 'general';
};

export const calculateDetailedMetrics = (resumeData) => {
  return {
    wordCount: JSON.stringify(resumeData).split(/\s+/).length,
    sectionCount: Object.keys(resumeData).filter(k => 
      resumeData[k] && (Array.isArray(resumeData[k]) ? resumeData[k].length > 0 : Object.keys(resumeData[k]).length > 0)
    ).length,
    skillCount: (resumeData.skills?.technical?.length || 0) + (resumeData.skills?.soft?.length || 0),
    experienceCount: resumeData.experience?.length || 0,
    educationCount: resumeData.education?.length || 0
  };
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  industryKeywords,
  actionVerbs,
  getKeywordCategories,
  calculateATSScore,
  analyzeResume,
  suggestKeywords,
  calculateKeywordRelevance,
  getKeywordTrends,
  detectIndustry,
  calculateDetailedMetrics
};