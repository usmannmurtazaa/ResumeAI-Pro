/**
 * Resume Parser
 * Extracts data from PDF, DOCX, and TXT files.
 * Heavy dependencies are lazy-loaded to keep the initial bundle small.
 */

// ── Constants ──────────────────────────────────────────────────────────────

const MIN_TEXT_LENGTH = 50;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'];

// ── Lazy-Loaded Dependencies ──────────────────────────────────────────────

let pdfjsModule = null;
let mammothModule = null;

const getPdfJs = async () => {
  if (!pdfjsModule) {
    pdfjsModule = await import('pdfjs-dist');
    // Point to the worker bundled with the npm package — no external CDN needed
    pdfjsModule.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjsModule;
};

const getMammoth = async () => {
  if (!mammothModule) {
    mammothModule = await import('mammoth');
  }
  return mammothModule;
};

// ── File Validation ───────────────────────────────────────────────────────

export const validateFileType = (file) => {
  if (!file) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
};

export const getFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
};

export const getFileExtension = (filename) => {
  return filename?.split('.').pop()?.toLowerCase() || '';
};

// ── Text Extraction ───────────────────────────────────────────────────────

const extractTextFromPDF = async (file) => {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
};

const extractTextFromDOCX = async (file) => {
  const mammoth = await getMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

const extractTextFromTXT = async (file) => {
  return await file.text().then((t) => t.trim());
};

// ── Main Parsing ──────────────────────────────────────────────────────────

/**
 * Parses a resume file (PDF, DOCX, or TXT) and extracts structured data.
 * @param {File} file - The file to parse
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<Object>} Extracted resume data
 */
export const parseResumeFile = async (file, onProgress) => {
  if (!file) throw new Error('No file provided.');
  if (!validateFileType(file)) throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');

  const ext = getFileExtension(file.name);
  onProgress?.(10);

  try {
    let text = '';

    if (ext === 'pdf') {
      text = await extractTextFromPDF(file);
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractTextFromDOCX(file);
    } else if (ext === 'txt') {
      text = await extractTextFromTXT(file);
    }

    onProgress?.(50);

    if (!text || text.length < MIN_TEXT_LENGTH) {
      throw new Error(
        'Could not extract enough text. The file might be scanned or image-based. Try uploading a text-based PDF or DOCX.'
      );
    }

    const data = extractResumeData(text);
    onProgress?.(90);

    return data;
  } catch (error) {
    if (error.message.includes('Unsupported') || error.message.includes('enough text')) {
      throw error;
    }
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse the resume. Please try a different file or format.');
  }
};

// Backward-compatible alias
export const parseResume = parseResumeFile;

// ── Resume Data Extraction ────────────────────────────────────────────────

const extractResumeData = (text) => {
  const data = {
    personal: {},
    education: [],
    experience: [],
    skills: { technical: [], soft: [] },
    projects: [],
    certifications: [],
  };

  const lines = text.split('\n').filter((line) => line.trim());

  // ── Name (first non-email, non-phone line) ──────────────────────────
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (!firstLine.includes('@') && !/^[+\d]/.test(firstLine)) {
      data.personal.fullName = firstLine;
    }
  }

  // ── Email ───────────────────────────────────────────────────────────
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.personal.email = emailMatch[0];

  // ── Phone ───────────────────────────────────────────────────────────
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
  if (phoneMatch) data.personal.phone = phoneMatch[0];

  // ── Location ────────────────────────────────────────────────────────
  const locationMatch = text.match(/([A-Z][a-z]+,\s*[A-Z]{2})/);
  if (locationMatch) data.personal.location = locationMatch[0];

  // ── LinkedIn / GitHub ───────────────────────────────────────────────
  const linkedin = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
  if (linkedin) data.personal.linkedin = linkedin[0];
  const github = text.match(/(github\.com\/[a-zA-Z0-9-]+)/i);
  if (github) data.personal.github = github[0];

  // ── Skills ──────────────────────────────────────────────────────────
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'TypeScript', 'React', 'Vue', 'Angular',
    'Node.js', 'Express', 'Django', 'Flask', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'Git', 'Linux', 'REST API', 'GraphQL', 'CI/CD', 'Agile', 'Scrum',
  ];
  const foundSkills = skillKeywords.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );
  data.skills.technical = [...new Set(foundSkills)];

  // ── Sections ────────────────────────────────────────────────────────
  const extractSection = (label) => {
    const pattern = new RegExp(`${label}[\\s\\n]*([\\s\\S]*?)(?=\\n\\s*[A-Z]{2,}|$)`, 'i');
    const match = text.match(pattern);
    return match?.[1]?.trim() || '';
  };

  const educationText = extractSection('EDUCATION|ACADEMIC');
  if (educationText) {
    const degrees = educationText.match(/(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|MBA)[^.]*\./gi) || [];
    data.education = degrees.map((d) => ({ degree: d.trim(), institution: '', graduationYear: '' }));
  }

  const experienceText = extractSection('EXPERIENCE|WORK|EMPLOYMENT');
  if (experienceText) {
    const expLines = experienceText.split('\n').filter((l) => l.trim().length > 10);
    data.experience = expLines.slice(0, 5).map((l) => ({
      title: l.trim().substring(0, 80),
      company: '',
      description: l.trim(),
    }));
  }

  const certText = extractSection('CERTIFICATIONS|CERTIFICATION');
  if (certText) {
    const certs = certText.match(/(?:AWS|Azure|Google|Certified|CompTIA|Scrum)[^.]*\./gi) || [];
    data.certifications = certs.map((c) => ({ name: c.trim() }));
  }

  return data;
};

// ── Resume Scoring ────────────────────────────────────────────────────────

export const calculateResumeScore = (data) => {
  if (!data) return 0;
  let score = 0;
  if (data.personal?.fullName) score += 5;
  if (data.personal?.email) score += 5;
  if (data.personal?.phone) score += 5;
  if (data.personal?.location) score += 3;
  score += Math.min((data.education?.length || 0) * 5, 15);
  score += Math.min((data.experience?.length || 0) * 8, 25);
  score += Math.min((data.skills?.technical?.length || 0) * 2, 15);
  score += Math.min((data.skills?.soft?.length || 0), 5);
  score += Math.min((data.projects?.length || 0) * 3, 10);
  score += Math.min((data.certifications?.length || 0) * 3, 10);
  return Math.min(score, 100);
};

export default {
  parseResume,
  parseResumeFile,
  validateFileType,
  getFileSize,
  getFileExtension,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
  calculateResumeScore,
};