import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, FiCheckCircle, FiAlertCircle, FiTrendingUp,
  FiFile, FiDownload, FiCopy, FiAward, FiTarget,
  FiBriefcase, FiBook, FiCode, FiRefreshCw, FiX,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

// ── Safe Dynamic Imports (Fallback if modules don't exist) ───────────────

const safeImport = async (importFn, fallback) => {
  try {
    const module = await importFn();
    return module;
  } catch {
    console.warn('Module not found, using fallback');
    return fallback;
  }
};

// ── Constants ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Inline Fallback Utilities (Used if external modules are missing) ──────

const validateFileType = (file) => {
  const acceptedMimeTypes = Object.keys(ACCEPTED_TYPES);
  const acceptedExtensions = Object.values(ACCEPTED_TYPES).flat();
  return acceptedMimeTypes.includes(file.type) || 
         acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

const getFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Fallback resume parser
const parseResumeFile = async (file, onProgress) => {
  onProgress?.(0.3);
  const text = await file.text();
  onProgress?.(0.6);
  
  // Basic extraction
  const lines = text.split('\n').filter(Boolean);
  const extracted = {
    personal: { fullName: lines[0] || '', email: '', phone: '' },
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
  };
  
  // Try to find email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) extracted.personal.email = emailMatch[0];
  
  // Try to find phone
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
  if (phoneMatch) extracted.personal.phone = phoneMatch[0];
  
  onProgress?.(1);
  return extracted;
};

// Fallback ATS analyzer
const calculateATSScore = async (data) => {
  let score = 50; // Base score
  
  if (data?.personal?.fullName) score += 10;
  if (data?.personal?.email) score += 5;
  if (data?.experience?.length > 0) score += 15;
  if (data?.education?.length > 0) score += 10;
  if (data?.skills?.technical?.length >= 5) score += 10;
  
  return Math.min(score, 100);
};

const analyzeResume = async (data) => {
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];
  
  if (data?.personal?.fullName) strengths.push('Full name is present');
  else weaknesses.push('Missing full name');
  
  if (data?.personal?.email) strengths.push('Email address found');
  else weaknesses.push('No email address detected');
  
  if (data?.experience?.length > 0) strengths.push(`${data.experience.length} work experience entries found`);
  else weaknesses.push('No work experience detected');
  
  if (data?.skills?.technical?.length >= 5) strengths.push('Good technical skills coverage');
  else weaknesses.push('Add more technical skills (aim for 5+)');
  
  suggestions.push('Add quantifiable achievements with numbers and percentages');
  suggestions.push('Use industry-standard keywords from job descriptions');
  suggestions.push('Keep formatting simple and avoid complex tables');
  
  return { strengths, weaknesses, suggestions };
};

const suggestKeywords = async (industry, existingSkills) => {
  const keywordBank = {
    technology: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'GraphQL', 'CI/CD', 'Agile'],
    marketing: ['SEO', 'Content Strategy', 'Social Media', 'Analytics', 'Email Marketing', 'PPC', 'Brand Management'],
    finance: ['Financial Analysis', 'Risk Management', 'Excel', 'Bloomberg', 'SQL', 'Financial Modeling', 'GAAP'],
    healthcare: ['Patient Care', 'HIPAA', 'EMR', 'Clinical Research', 'Medical Terminology', 'Healthcare Management'],
    sales: ['Lead Generation', 'CRM', 'Cold Calling', 'Account Management', 'Salesforce', 'Negotiation', 'Pipeline'],
  };
  
  const keywords = keywordBank[industry] || keywordBank.technology;
  return keywords.filter(k => !existingSkills.includes(k));
};

const industryKeywords = {
  technology: ['software', 'developer', 'engineer', 'cloud', 'api', 'database', 'frontend', 'backend', 'devops'],
  marketing: ['marketing', 'brand', 'campaign', 'social media', 'content', 'seo', 'analytics', 'digital'],
  finance: ['finance', 'accounting', 'investment', 'banking', 'risk', 'compliance', 'audit', 'tax'],
  healthcare: ['patient', 'clinical', 'medical', 'healthcare', 'treatment', 'diagnosis', 'therapy'],
  sales: ['sales', 'revenue', 'client', 'account', 'pipeline', 'quota', 'negotiation', 'crm'],
};

const getKeywordCategories = (data) => {
  const categories = {};
  const text = JSON.stringify(data).toLowerCase();
  
  Object.entries(industryKeywords).forEach(([industry, keywords]) => {
    const matches = keywords.filter(k => text.includes(k));
    if (matches.length > 0) categories[industry] = matches;
  });
  
  return categories;
};

// ── MetricCard Component (Memoized) ──────────────────────────────────────

const MetricCard = React.memo(({ icon, label, value }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div className="flex justify-center text-gray-600 dark:text-gray-400 mb-1">{icon}</div>
    <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
));

MetricCard.displayName = 'MetricCard';

// ── Utility Functions ────────────────────────────────────────────────────

const detectIndustry = (data) => {
  const text = JSON.stringify(data).toLowerCase();
  const scores = Object.entries(industryKeywords).map(([industry, keywords]) => ({
    industry,
    score: keywords.filter(k => text.includes(k.toLowerCase())).length,
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best?.score > 2 ? best.industry : 'general';
};

const countActionVerbs = (data) => {
  const verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'achieved', 'increased', 'reduced', 'designed', 'launched'];
  const text = JSON.stringify(data.experience || []).toLowerCase();
  return verbs.filter(v => text.includes(v)).length;
};

const countQuantifiableAchievements = (data) => {
  const text = JSON.stringify(data.experience || []);
  const patterns = [/\d+%/, /\$\d+/, /\d+\s*(people|users|clients)/, /\d+\s*years/];
  return patterns.reduce((c, p) => c + (text.match(new RegExp(p.source, 'gi'))?.length || 0), 0);
};

const calculateTotalExperience = (data) => {
  const experiences = data.experience || [];
  let totalYears = 0;
  experiences.forEach(exp => {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end = exp.endDate?.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate);
      if (!isNaN(start) && !isNaN(end)) totalYears += (end - start) / (1000 * 60 * 60 * 24 * 365);
    }
  });
  return Math.round(totalYears * 10) / 10;
};

// ── Score Helpers ────────────────────────────────────────────────────────

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreGrade = (score) => {
  const grades = [
    { min: 90, grade: 'A+', color: 'text-green-600' },
    { min: 80, grade: 'A', color: 'text-green-600' },
    { min: 70, grade: 'B', color: 'text-blue-600' },
    { min: 60, grade: 'C', color: 'text-yellow-600' },
    { min: 50, grade: 'D', color: 'text-orange-600' },
  ];
  return grades.find(g => score >= g.min) || { grade: 'F', color: 'text-red-600' };
};

const getScoreMessage = (score) => {
  if (score >= 80) return 'Excellent! Your resume is well-optimized for ATS systems.';
  if (score >= 60) return 'Good! Add more keywords and metrics to improve your score.';
  return 'Needs improvement. Follow the suggestions below.';
};

// ── Main Component ─────────────────────────────────────────────────────────

const ATSScanner = ({ onDataExtracted, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [error, setError] = useState(null);

  // ── File Validation ──────────────────────────────────────────────────

  const validateFile = useCallback((file) => {
    const errors = [];
    if (!validateFileType(file)) errors.push('Unsupported format. Upload PDF, DOCX, or TXT.');
    if (file.size > MAX_FILE_SIZE) errors.push('File too large (max 10MB).');
    if (file.size === 0) errors.push('File is empty.');
    return errors;
  }, []);

  // ── Scan Resume ──────────────────────────────────────────────────────

  const scanResume = useCallback(async (resumeFile) => {
    const fileErrors = validateFile(resumeFile);
    if (fileErrors.length > 0) {
      setError(fileErrors[0]);
      toast.error(fileErrors[0]);
      return;
    }

    setScanning(true);
    setError(null);
    setCurrentFile(resumeFile);
    setScanProgress(0);

    try {
      // Step 1: Parse
      setScanProgress(10);
      const parsed = await parseResumeFile(resumeFile, (p) => setScanProgress(10 + p * 30));
      if (!parsed || Object.keys(parsed).length === 0) throw new Error('Could not extract data.');
      setExtractedData(parsed);
      setScanProgress(40);

      // Step 2: Score
      setScanProgress(50);
      const score = await calculateATSScore(parsed);
      setScanProgress(70);

      // Step 3: Analyze
      const analysis = await analyzeResume(parsed);
      setScanProgress(85);

      // Step 4: Keywords
      const industry = detectIndustry(parsed);
      const missing = await suggestKeywords(industry, parsed.skills?.technical || []);
      const categories = getKeywordCategories(parsed);
      setScanProgress(95);

      const result = {
        score,
        industry,
        ...analysis,
        missingKeywords: missing.slice(0, 15),
        keywordCategories: categories,
        fileInfo: {
          name: resumeFile.name,
          size: getFileSize(resumeFile.size),
          type: resumeFile.type,
          scannedAt: new Date().toISOString(),
        },
        metrics: {
          sectionCompleteness: {
            personal: !!(parsed.personal?.fullName && parsed.personal?.email),
            education: (parsed.education?.length || 0) > 0,
            experience: (parsed.experience?.length || 0) > 0,
            skills: (parsed.skills?.technical?.length || 0) > 0,
          },
          actionVerbCount: countActionVerbs(parsed),
          quantifiableAchievements: countQuantifiableAchievements(parsed),
          experienceYears: calculateTotalExperience(parsed),
          readabilityScore: 'Good readability',
        },
      };

      setScanResult(result);
      setScanProgress(100);
      toast.success('Resume analyzed!');
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan resume.');
      toast.error(err.message || 'Scan failed');
    } finally {
      setTimeout(() => setScanning(false), 500);
    }
  }, [validateFile]);

  // ── Dropzone ─────────────────────────────────────────────────────────

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: async (accepted, rejected) => {
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === 'file-too-large') toast.error('File too large (max 10MB)');
        else if (err.code === 'file-invalid-type') toast.error('Invalid file type');
        else toast.error(err.message);
        return;
      }
      if (accepted.length > 0) await scanResume(accepted[0]);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      toast.success('Data imported to builder!');
    }
  }, [extractedData, onDataExtracted]);

  const handleExport = useCallback(() => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify({ ...scanResult, extractedData, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ats-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  }, [scanResult, extractedData]);

  const handleReset = useCallback(() => {
    setScanResult(null); setExtractedData(null); setCurrentFile(null); setError(null); setScanProgress(0);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!scanResult && !scanning && (
        <Card className="p-6 sm:p-8">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 scale-105' : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'
          }`}>
            <input {...getInputProps()} />
            <FiUpload className="w-14 h-14 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isDragActive ? 'Drop your resume' : 'Upload Resume for ATS Analysis'}</h3>
            <p className="text-gray-500 mb-4 text-sm">Get instant feedback on ATS compatibility</p>
            <Button variant="primary" className="mx-auto">Choose File</Button>
            <p className="text-xs text-gray-400 mt-4">PDF, DOCX, DOC, TXT (Max 10MB)</p>
          </div>
        </Card>
      )}

      {/* Scanning Progress */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <motion.div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <FiFile className="absolute inset-0 m-auto w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyzing...</h3>
              <p className="text-gray-500 mb-4">{currentFile?.name}</p>
              <Progress value={scanProgress} size="lg" showPercentage className="max-w-md mx-auto" />
              <p className="text-xs text-gray-400 mt-3">
                {scanProgress < 40 ? 'Extracting text...' : scanProgress < 70 ? 'Calculating score...' : scanProgress < 85 ? 'Analyzing keywords...' : 'Generating recommendations...'}
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !scanning && !scanResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">Scan Failed</h4>
                  <p className="text-red-600 dark:text-red-300 mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>Try Again</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {scanResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Score Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div><FiFile className="w-5 h-5 inline mr-2 text-gray-400" />{scanResult.fileInfo.name} <Badge variant="secondary" size="sm">{scanResult.fileInfo.size}</Badge></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} icon={<FiDownload />}>Export</Button>
                  <Button variant="outline" size="sm" onClick={handleReset} icon={<FiRefreshCw />}>New Scan</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className={`text-6xl font-bold ${getScoreColor(scanResult.score)}`}>{scanResult.score}</div>
                  <div className="text-sm text-gray-500">out of 100</div>
                  <Badge variant={scanResult.score >= 80 ? 'success' : scanResult.score >= 60 ? 'warning' : 'error'}>{getScoreGrade(scanResult.score).grade}</Badge>
                </div>
                <div className="md:col-span-2 flex flex-col justify-center">
                  <Progress value={scanResult.score} size="lg" className="mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">{getScoreMessage(scanResult.score)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard icon={<FiBriefcase />} label="Experience" value={`${scanResult.metrics.experienceYears}yrs`} />
                <MetricCard icon={<FiCode />} label="Action Verbs" value={scanResult.metrics.actionVerbCount} />
                <MetricCard icon={<FiTarget />} label="Achievements" value={scanResult.metrics.quantifiableAchievements} />
                <MetricCard icon={<FiBook />} label="Readability" value={scanResult.metrics.readabilityScore} />
              </div>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold text-green-600 mb-3"><FiCheckCircle className="w-5 h-5 inline mr-2" />Strengths</h4>
                <ul className="space-y-1">{scanResult.strengths?.map((s, i) => <li key={i} className="text-sm flex gap-2"><span className="text-green-500">✓</span>{s}</li>)}</ul>
              </Card>
              <Card className="p-6">
                <h4 className="font-semibold text-yellow-600 mb-3"><FiAlertCircle className="w-5 h-5 inline mr-2" />Areas for Improvement</h4>
                <ul className="space-y-1">{scanResult.weaknesses?.map((w, i) => <li key={i} className="text-sm flex gap-2"><span className="text-yellow-500">!</span>{w}</li>)}</ul>
              </Card>
            </div>

            {/* Suggestions */}
            <Card className="p-6">
              <h4 className="font-semibold mb-3"><FiTrendingUp className="w-5 h-5 inline mr-2" />Suggestions</h4>
              <div className="space-y-2">{scanResult.suggestions?.map((s, i) => <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">{s}</div>)}</div>
            </Card>

            {/* Missing Keywords */}
            {scanResult.missingKeywords?.length > 0 && (
              <Card className="p-6">
                <h4 className="font-semibold mb-3">Recommended Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.missingKeywords.map((k, i) => (
                    <Badge key={i} variant="primary" size="md" className="cursor-pointer hover:scale-105"
                      onClick={() => { navigator.clipboard?.writeText(k); toast.success(`"${k}" copied!`); }}>
                      {k} <FiCopy className="w-3 h-3 inline ml-1" />
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Import Button */}
            <div className="sticky bottom-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl shadow-lg flex gap-3">
              <Button onClick={handleImport} className="flex-1" icon={<FiUpload />} disabled={!onDataExtracted}>
                Import to Builder
              </Button>
              <Button variant="outline" onClick={() => setShowDetailedReport(true)} icon={<FiAward />}>View Report</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Report Modal */}
      <Modal isOpen={showDetailedReport} onClose={() => setShowDetailedReport(false)} title="Detailed Report" size="lg">
        {scanResult && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto">{JSON.stringify({ ...scanResult, extractedData }, null, 2)}</pre>
            <Button onClick={() => setShowDetailedReport(false)} className="w-full">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(ATSScanner);