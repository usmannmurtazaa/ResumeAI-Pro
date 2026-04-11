const industryKeywords = {
  technology: [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker',
    'Kubernetes', 'CI/CD', 'Agile', 'Scrum', 'REST API', 'GraphQL',
    'Microservices', 'Cloud Computing', 'DevOps', 'Machine Learning'
  ],
  marketing: [
    'SEO', 'SEM', 'Social Media', 'Content Marketing', 'Email Marketing',
    'Google Analytics', 'PPC', 'CRM', 'Marketing Automation', 'Brand Strategy',
    'Market Research', 'Digital Advertising', 'Campaign Management'
  ],
  finance: [
    'Financial Analysis', 'Budgeting', 'Forecasting', 'Risk Management',
    'Investment', 'Portfolio Management', 'Excel', 'Bloomberg', 'SAP',
    'QuickBooks', 'Financial Modeling', 'Auditing', 'Tax Planning'
  ],
  healthcare: [
    'Patient Care', 'EMR', 'HIPAA', 'Clinical Research', 'Healthcare Management',
    'Medical Terminology', 'Patient Safety', 'Healthcare Compliance', 'Epic Systems'
  ],
  sales: [
    'Business Development', 'Account Management', 'Lead Generation', 'B2B Sales',
    'B2C Sales', 'Negotiation', 'CRM', 'Salesforce', 'Pipeline Management',
    'Customer Relationship', 'Revenue Growth', 'Market Expansion'
  ]
};

const actionVerbs = [
  'Achieved', 'Developed', 'Implemented', 'Led', 'Managed', 'Created',
  'Increased', 'Decreased', 'Improved', 'Optimized', 'Streamlined',
  'Launched', 'Designed', 'Executed', 'Coordinated', 'Spearheaded',
  'Transformed', 'Generated', 'Established', 'Orchestrated'
];

export const calculateATSScore = (resumeData) => {
  let score = 0;
  
  // Check for complete sections (40 points)
  const requiredSections = ['personal', 'education', 'experience', 'skills'];
  requiredSections.forEach(section => {
    if (resumeData[section] && Object.keys(resumeData[section]).length > 0) {
      score += 10;
    }
  });

  // Check for keywords in skills (30 points)
  const skills = resumeData.skills?.technical || [];
  const allKeywords = Object.values(industryKeywords).flat();
  const matchedKeywords = skills.filter(skill => 
    allKeywords.some(keyword => 
      skill.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  score += Math.min(30, (matchedKeywords.length / 10) * 30);

  // Check for action verbs in experience (20 points)
  const experiences = resumeData.experience || [];
  const description = experiences.map(exp => exp.description).join(' ');
  const usedActionVerbs = actionVerbs.filter(verb => 
    description.toLowerCase().includes(verb.toLowerCase())
  );
  score += Math.min(20, (usedActionVerbs.length / 5) * 20);

  // Check for quantifiable achievements (10 points)
  const hasMetrics = /(\d+%|\$\d+|\d+ people|\d+ years)/.test(JSON.stringify(experiences));
  if (hasMetrics) score += 10;

  return Math.round(score);
};

export const suggestKeywords = (industry, currentSkills) => {
  const industrySpecificKeywords = industryKeywords[industry.toLowerCase()] || [];
  const suggestions = industrySpecificKeywords.filter(
    keyword => !currentSkills.some(skill => 
      skill.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  return suggestions.slice(0, 10);
};

export const analyzeResume = (resumeData) => {
  const analysis = {
    score: calculateATSScore(resumeData),
    suggestions: [],
    strengths: [],
    weaknesses: []
  };

  // Check personal info
  if (!resumeData.personal?.email) {
    analysis.weaknesses.push('Missing email address');
    analysis.suggestions.push('Add a professional email address');
  }
  if (!resumeData.personal?.phone) {
    analysis.weaknesses.push('Missing phone number');
    analysis.suggestions.push('Include a contact phone number');
  }

  // Check experience bullet points
  const experiences = resumeData.experience || [];
  experiences.forEach(exp => {
    if (exp.description && exp.description.length < 100) {
      analysis.weaknesses.push('Experience descriptions are too brief');
      analysis.suggestions.push('Expand on your achievements with specific examples');
    }
  });

  // Check skills
  const skills = resumeData.skills?.technical || [];
  if (skills.length < 5) {
    analysis.weaknesses.push('Limited skills listed');
    analysis.suggestions.push('Add more relevant technical skills');
  }

  return analysis;
};