import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ============================================
// FILE VALIDATION
// ============================================

export const validateFileType = (file) => {
  if (!file) return false;
  
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
};

export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// ============================================
// TEXT EXTRACTION
// ============================================

export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const extractTextFromDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

export const extractTextFromTXT = async (file) => {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT');
  }
};

// ============================================
// MAIN PARSING FUNCTIONS
// ============================================

export const parseResumeFile = async (file, onProgress) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    // Report progress
    if (onProgress) onProgress(10);
    
    let text = '';
    
    if (fileType === 'pdf') {
      text = await extractTextFromPDF(file);
    } else if (fileType === 'docx' || fileType === 'doc') {
      text = await extractTextFromDOCX(file);
    } else if (fileType === 'txt') {
      text = await extractTextFromTXT(file);
    } else {
      throw new Error('Unsupported file format');
    }
    
    if (onProgress) onProgress(50);
    
    if (!text || text.length < 50) {
      throw new Error('Could not extract sufficient text from the file. The file may be scanned or image-based.');
    }
    
    const data = extractResumeData(text);
    
    if (onProgress) onProgress(90);
    
    return data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const parseResume = parseResumeFile;

// ============================================
// RESUME DATA EXTRACTION
// ============================================

const extractResumeData = (text) => {
  const data = {
    personal: {},
    education: [],
    experience: [],
    skills: { technical: [], soft: [] },
    projects: [],
    certifications: []
  };

  // Extract Name (first non-empty line)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Check if first line looks like a name (not an email or phone)
    if (!firstLine.includes('@') && !firstLine.match(/^[+\d]/)) {
      data.personal.fullName = firstLine;
    }
  }

  // Extract Email
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) data.personal.email = emailMatch[0];

  // Extract Phone
  const phonePatterns = [
    /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/,
    /[0-9]{3}[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}/,
    /\(\d{3}\)\s*\d{3}[-\s]?\d{4}/
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      data.personal.phone = phoneMatch[0];
      break;
    }
  }

  // Extract Location
  const locationPatterns = [
    /([A-Z][a-z]+,\s*[A-Z]{2})/,
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
    /(Remote|Hybrid|On-site)/i
  ];
  
  for (const pattern of locationPatterns) {
    const locationMatch = text.match(pattern);
    if (locationMatch) {
      data.personal.location = locationMatch[0];
      break;
    }
  }

  // Extract LinkedIn
  const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
  if (linkedinMatch) data.personal.linkedin = linkedinMatch[0];

  // Extract GitHub
  const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9-]+)/i);
  if (githubMatch) data.personal.github = githubMatch[0];

  // Extract Skills
  const skillKeywords = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP',
    'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Perl', 'Haskell', 'Lua', 'Objective-C',
    
    // Frontend
    'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'jQuery', 'Redux', 'MobX',
    'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'SCSS', 'Less', 'Tailwind', 'Bootstrap', 'Material-UI',
    'Webpack', 'Vite', 'Babel', 'ES6', 'ES7', 'ES8',
    
    // Backend
    'Node.js', 'Node', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
    'Laravel', 'Symfony', 'ASP.NET', '.NET', 'Ruby on Rails', 'NestJS', 'Koa',
    
    // Database
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
    'Cassandra', 'SQLite', 'Oracle', 'Firebase', 'Supabase', 'Prisma', 'Sequelize',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
    'CI/CD', 'Terraform', 'Ansible', 'CircleCI', 'GitHub Actions', 'GitLab CI',
    'Nginx', 'Apache', 'Linux', 'Unix', 'Bash', 'Shell',
    
    // Mobile
    'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic',
    
    // Data Science & AI
    'Machine Learning', 'Deep Learning', 'AI', 'TensorFlow', 'PyTorch', 'Keras',
    'Scikit-learn', 'Pandas', 'NumPy', 'SciPy', 'OpenCV', 'NLP', 'Computer Vision',
    
    // Testing
    'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Enzyme',
    
    // Tools
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Trello',
    'Slack', 'Teams', 'Figma', 'Sketch', 'Adobe XD', 'Postman', 'Swagger',
    
    // Soft Skills
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Project Management', 'Agile', 'Scrum', 'Kanban'
  ];
  
  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  skillKeywords.forEach(skill => {
    const skillRegex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'i');
    if (skillRegex.test(textLower)) {
      foundSkills.push(skill);
    }
  });
  
  data.skills.technical = [...new Set(foundSkills)];

  // Extract soft skills
  const softSkillKeywords = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Project Management', 'Adaptability', 'Creativity', 'Collaboration',
    'Mentoring', 'Negotiation', 'Presentation', 'Public Speaking', 'Conflict Resolution'
  ];
  
  const foundSoftSkills = softSkillKeywords.filter(skill =>
    textLower.includes(skill.toLowerCase())
  );
  data.skills.soft = [...new Set(foundSoftSkills)];

  // Extract Education
  const educationSection = extractSection(text, ['EDUCATION', 'ACADEMIC', 'QUALIFICATIONS']);
  if (educationSection) {
    const degreePatterns = [
      /(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA|Associate|Doctorate)[^.]*\./gi,
      /([^.]*University[^.]*\.)/gi,
      /([^.]*College[^.]*\.)/gi,
      /([^.]*Institute[^.]*\.)/gi
    ];
    
    degreePatterns.forEach(pattern => {
      const matches = educationSection.match(pattern) || [];
      matches.forEach(match => {
        data.education.push({
          degree: match.trim(),
          institution: '',
          graduationYear: extractYear(match)
        });
      });
    });
  }

  // Extract Experience
  const experienceSection = extractSection(text, ['EXPERIENCE', 'WORK', 'EMPLOYMENT', 'PROFESSIONAL']);
  if (experienceSection) {
    const jobPatterns = [
      /(Software|Senior|Lead|Principal|Staff)?\s*(Engineer|Developer|Manager|Director|Analyst|Designer|Architect|Consultant)/gi,
      /([^.]*at\s+[^.]*\.)/gi,
      /([^.]*,\s*[A-Z][a-z]+\s+[A-Z][a-z]+[^.]*\.)/gi
    ];
    
    const lines = experienceSection.split('\n').filter(line => line.trim().length > 10);
    lines.slice(0, 5).forEach(line => {
      data.experience.push({
        title: line.trim().substring(0, 50),
        company: '',
        description: line.trim()
      });
    });
  }

  // Extract Projects
  const projectsSection = extractSection(text, ['PROJECTS', 'PROJECT', 'PORTFOLIO']);
  if (projectsSection) {
    const lines = projectsSection.split('\n').filter(line => line.trim().length > 10);
    lines.slice(0, 3).forEach(line => {
      data.projects.push({
        name: line.trim().substring(0, 50),
        description: line.trim()
      });
    });
  }

  // Extract Certifications
  const certSection = extractSection(text, ['CERTIFICATIONS', 'CERTIFICATION', 'CERTIFICATES']);
  if (certSection) {
    const certPatterns = [
      /(AWS|Azure|Google|Cisco|CompTIA|PMI|Scrum|ITIL|Six Sigma)[^.]*Certified[^.]*\./gi,
      /(Certified[^.]*\.)/gi
    ];
    
    certPatterns.forEach(pattern => {
      const matches = certSection.match(pattern) || [];
      matches.forEach(match => {
        data.certifications.push({
          name: match.trim()
        });
      });
    });
  }

  // Extract Summary
  const summaryMatch = text.match(/^([^.]*\.){2,4}/m);
  if (summaryMatch) {
    data.personal.summary = summaryMatch[0].trim();
  }

  return data;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const extractSection = (text, sectionNames) => {
  const patterns = sectionNames.map(name => 
    new RegExp(`${name}[\\s\\n]*([\\s\\S]*?)(?=\\n\\s*[A-Z]{2,}|$)`, 'i')
  );
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return null;
};

const extractYear = (text) => {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : '';
};

// ============================================
// RESUME SCORING
// ============================================

export const calculateResumeScore = (data) => {
  let score = 0;
  
  // Personal Info (20 points)
  if (data.personal?.fullName) score += 5;
  if (data.personal?.email) score += 5;
  if (data.personal?.phone) score += 5;
  if (data.personal?.location) score += 3;
  if (data.personal?.summary) score += 2;
  
  // Education (15 points)
  if (data.education?.length > 0) {
    score += Math.min(data.education.length * 5, 15);
  }
  
  // Experience (25 points)
  if (data.experience?.length > 0) {
    score += Math.min(data.experience.length * 8, 25);
  }
  
  // Skills (20 points)
  if (data.skills?.technical?.length > 0) {
    score += Math.min(data.skills.technical.length * 2, 15);
  }
  if (data.skills?.soft?.length > 0) {
    score += Math.min(data.skills.soft.length, 5);
  }
  
  // Projects (10 points)
  if (data.projects?.length > 0) {
    score += Math.min(data.projects.length * 3, 10);
  }
  
  // Certifications (10 points)
  if (data.certifications?.length > 0) {
    score += Math.min(data.certifications.length * 3, 10);
  }
  
  return Math.min(score, 100);
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  parseResume,
  parseResumeFile,
  validateFileType,
  getFileSize,
  getFileExtension,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
  calculateResumeScore
};