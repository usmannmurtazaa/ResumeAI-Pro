import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const parseResume = async (file) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    let text = '';
    
    if (fileType === 'pdf') {
      text = await parsePDF(file);
    } else if (fileType === 'docx' || fileType === 'doc') {
      text = await parseDOCX(file);
    } else {
      throw new Error('Unsupported file format');
    }

    return extractResumeData(text);
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
};

const parsePDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
};

const parseDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractResumeData = (text) => {
  const data = {
    personal: {},
    education: [],
    experience: [],
    skills: { technical: [], soft: [] },
    projects: [],
    certifications: []
  };

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.personal.email = emailMatch[0];

  const phoneMatch = text.match(/[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
  if (phoneMatch) data.personal.phone = phoneMatch[0];

  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    data.personal.fullName = lines[0].trim();
  }

  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker',
    'Kubernetes', 'SQL', 'MongoDB', 'TypeScript', 'Vue', 'Angular',
    'Git', 'CI/CD', 'REST API', 'GraphQL', 'HTML', 'CSS', 'Sass'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  data.skills.technical = foundSkills;

  const degreeKeywords = ['Bachelor', 'Master', 'PhD', 'B.S.', 'M.S.', 'B.A.', 'M.A.', 'MBA'];
  degreeKeywords.forEach(degree => {
    if (text.includes(degree)) {
      const degreeRegex = new RegExp(`([^.]*${degree}[^.]*\\.)`, 'i');
      const match = text.match(degreeRegex);
      if (match) {
        data.education.push({
          degree: match[0].trim(),
          institution: '',
          graduationYear: ''
        });
      }
    }
  });

  return data;
};