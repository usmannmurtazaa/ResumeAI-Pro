import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiTrendingUp,
  FiFile,
  FiX,
  FiDownload,
  FiCopy,
  FiAward,
  FiTarget,
  FiBriefcase,
  FiBook,
  FiCode,
  FiRefreshCw
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

// Import real parsing utilities
import { 
  parseResumeFile, 
  extractTextFromPDF, 
  extractTextFromDOCX,
  validateFileType,
  getFileSize
} from '../../utils/resumeParser';

import { 
  calculateATSScore, 
  analyzeResume, 
  suggestKeywords,
  industryKeywords,
  actionVerbs,
  getKeywordCategories
} from '../../utils/atsKeywords';

const ATSScanner = ({ onDataExtracted, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [error, setError] = useState(null);

  // Real file validation
  const validateFile = useCallback((file) => {
    const errors = [];
    
    // Check file type
    if (!validateFileType(file)) {
      errors.push('Unsupported file format. Please upload PDF, DOCX, or DOC.');
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit.');
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty.');
    }
    
    return errors;
  }, []);

  // Real scanning process with progress
  const scanResume = useCallback(async (resumeFile) => {
    const fileErrors = validateFile(resumeFile);
    if (fileErrors.length > 0) {
      toast.error(fileErrors[0]);
      setError(fileErrors[0]);
      return;
    }

    setScanning(true);
    setError(null);
    setCurrentFile(resumeFile);
    setScanProgress(0);
    
    try {
      // Step 1: Parse file (40%)
      setScanProgress(10);
      const parsedData = await parseResumeFile(resumeFile, (progress) => {
        setScanProgress(10 + progress * 0.3);
      });
      
      // Validate parsed data
      if (!parsedData || Object.keys(parsedData).length === 0) {
        throw new Error('Could not extract data from the file. Please ensure the file contains readable text.');
      }
      
      setExtractedData(parsedData);
      setScanProgress(40);

      // Step 2: Calculate ATS Score (30%)
      setScanProgress(50);
      const atsScore = await calculateATSScore(parsedData);
      setScanProgress(70);

      // Step 3: Analyze Resume (30%)
      const analysis = await analyzeResume(parsedData);
      setScanProgress(85);

      // Step 4: Generate suggestions
      const industry = detectIndustry(parsedData);
      const missingKeywords = await suggestKeywords(industry, parsedData.skills?.technical || []);
      const keywordCategories = getKeywordCategories(parsedData);
      
      setScanProgress(95);

      // Compile complete scan result
      const result = {
        score: atsScore,
        industry,
        ...analysis,
        missingKeywords: missingKeywords.slice(0, 15),
        keywordCategories,
        fileInfo: {
          name: resumeFile.name,
          size: getFileSize(resumeFile.size),
          type: resumeFile.type,
          scannedAt: new Date().toISOString()
        },
        metrics: calculateDetailedMetrics(parsedData, atsScore)
      };

      setScanResult(result);
      setScanProgress(100);
      
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      console.error('Scan error:', error);
      setError(error.message || 'Failed to scan resume. Please try again.');
      toast.error(error.message || 'Failed to scan resume. Please try again.');
    } finally {
      setTimeout(() => setScanning(false), 500);
    }
  }, [validateFile]);

  // Detect industry from resume content
  const detectIndustry = (data) => {
    const text = JSON.stringify(data).toLowerCase();
    const industries = Object.keys(industryKeywords);
    
    const scores = industries.map(industry => {
      const keywords = industryKeywords[industry];
      const matches = keywords.filter(kw => text.includes(kw.toLowerCase()));
      return { industry, score: matches.length };
    });
    
    const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
    return bestMatch.score > 2 ? bestMatch.industry : 'general';
  };

  // Calculate detailed metrics
  const calculateDetailedMetrics = (data, score) => {
    return {
      sectionCompleteness: {
        personal: !!data.personal?.fullName && !!data.personal?.email,
        education: (data.education?.length || 0) > 0,
        experience: (data.experience?.length || 0) > 0,
        skills: (data.skills?.technical?.length || 0) > 0,
        projects: (data.projects?.length || 0) > 0,
        certifications: (data.certifications?.length || 0) > 0
      },
      keywordDensity: calculateKeywordDensity(data),
      actionVerbCount: countActionVerbs(data),
      quantifiableAchievements: countQuantifiableAchievements(data),
      readabilityScore: calculateReadabilityScore(data),
      experienceYears: calculateTotalExperience(data)
    };
  };

  const calculateKeywordDensity = (data) => {
    const text = JSON.stringify(data).toLowerCase();
    const words = text.split(/\s+/);
    const allKeywords = Object.values(industryKeywords).flat();
    const keywordCount = allKeywords.filter(kw => text.includes(kw.toLowerCase())).length;
    return Math.round((keywordCount / words.length) * 1000) / 10;
  };

  const countActionVerbs = (data) => {
    const text = JSON.stringify(data.experience || []).toLowerCase();
    return actionVerbs.filter(verb => text.includes(verb.toLowerCase())).length;
  };

  const countQuantifiableAchievements = (data) => {
    const text = JSON.stringify(data.experience || []);
    const patterns = [/\d+%/, /\$\d+/, /\d+\s*(people|users|clients)/, /\d+\s*years/];
    return patterns.reduce((count, pattern) => count + (text.match(pattern)?.length || 0), 0);
  };

  const calculateReadabilityScore = (data) => {
    // Simple readability estimation
    const text = JSON.stringify(data.experience || []);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    
    if (avgWordsPerSentence < 10) return 'Easy to read';
    if (avgWordsPerSentence < 20) return 'Good readability';
    return 'Consider shorter sentences';
  };

  const calculateTotalExperience = (data) => {
    const experiences = data.experience || [];
    let totalYears = 0;
    
    experiences.forEach(exp => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
        totalYears += years;
      }
    });
    
    return Math.round(totalYears * 10) / 10;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];
        
        if (error.code === 'file-too-large') {
          toast.error('File is too large. Maximum size is 10MB.');
        } else if (error.code === 'file-invalid-type') {
          toast.error('Invalid file type. Please upload PDF, DOCX, or DOC.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      if (acceptedFiles.length > 0) {
        await scanResume(acceptedFiles[0]);
      }
    }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! Your resume is well-optimized for ATS systems.';
    if (score >= 60) return 'Good! Add more keywords and metrics to improve your score.';
    return 'Needs improvement. Follow the suggestions below to increase ATS compatibility.';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const handleImportData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      toast.success('Data imported to resume builder!');
    }
  };

  const handleExportReport = () => {
    if (!scanResult) return;
    
    const report = {
      ...scanResult,
      extractedData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
  };

  const handleReset = () => {
    setScanResult(null);
    setExtractedData(null);
    setCurrentFile(null);
    setError(null);
    setScanProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!scanResult && !scanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 sm:p-8">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer 
                transition-all duration-300 relative overflow-hidden
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-700 hover:border-primary-500 hover:scale-102'
                }
              `}
            >
              <input {...getInputProps()} />
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500" />
              </div>
              
              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FiUpload className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
              </motion.div>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                {isDragActive ? 'Drop your resume here' : 'Upload Your Resume for ATS Analysis'}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                Get instant feedback on ATS compatibility and optimization suggestions
              </p>
              
              <Button variant="primary" className="mx-auto">
                Choose File
              </Button>
              
              <p className="text-xs sm:text-sm text-gray-500 mt-4">
                Supported formats: PDF, DOCX, DOC, TXT (Max 10MB)
              </p>
            </div>

            {/* Tips Section */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                <FiTarget className="w-4 h-4" />
                Tips for Better ATS Score
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use standard section headings (Experience, Education, Skills)</li>
                <li>• Include industry-specific keywords</li>
                <li>• Use action verbs and quantifiable achievements</li>
                <li>• Avoid images, charts, or complex formatting</li>
                <li>• Save as PDF with selectable text (not scanned images)</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Scanning Progress */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-6 sm:p-8">
              <div className="text-center">
                {/* Animated Scanner */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div
                    className="absolute inset-0 border-4 border-primary-200 dark:border-primary-800 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiFile className="w-8 h-8 text-primary-500" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">Analyzing Your Resume</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {currentFile?.name}
                </p>
                
                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-4">
                  <Progress 
                    value={scanProgress} 
                    size="lg" 
                    showPercentage
                    animated
                  />
                </div>
                
                {/* Scanning Steps */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  {scanProgress < 40 && <p>📄 Extracting text and parsing content...</p>}
                  {scanProgress >= 40 && scanProgress < 70 && <p>🎯 Calculating ATS compatibility score...</p>}
                  {scanProgress >= 70 && scanProgress < 85 && <p>🔍 Analyzing keywords and structure...</p>}
                  {scanProgress >= 85 && <p>✨ Generating recommendations...</p>}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !scanning && !scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">
                    Scan Failed
                  </h4>
                  <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Results */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* File Info & Overall Score */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiFile className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{scanResult.fileInfo.name}</span>
                    <Badge variant="secondary" size="sm">{scanResult.fileInfo.size}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Scanned on {new Date(scanResult.fileInfo.scannedAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportReport} icon={<FiDownload />}>
                    Export Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} icon={<FiRefreshCw />}>
                    New Scan
                  </Button>
                </div>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="col-span-1">
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(scanResult.score)}`}>
                      {scanResult.score}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">out of 100</div>
                    <Badge 
                      variant={scanResult.score >= 80 ? 'success' : scanResult.score >= 60 ? 'warning' : 'error'}
                      className="text-lg px-4 py-1"
                    >
                      Grade {getScoreGrade(scanResult.score).grade}
                    </Badge>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <div className="h-full flex flex-col justify-center">
                    <Progress value={scanResult.score} size="lg" className="mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {getScoreMessage(scanResult.score)}
                    </p>
                    {scanResult.industry && (
                      <p className="text-sm text-primary-600 dark:text-primary-400 mt-2">
                        Detected Industry: <span className="font-medium capitalize">{scanResult.industry}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  icon={<FiBriefcase />}
                  label="Experience"
                  value={`${scanResult.metrics.experienceYears} years`}
                />
                <MetricCard
                  icon={<FiCode />}
                  label="Action Verbs"
                  value={scanResult.metrics.actionVerbCount}
                />
                <MetricCard
                  icon={<FiTarget />}
                  label="Achievements"
                  value={scanResult.metrics.quantifiableAchievements}
                />
                <MetricCard
                  icon={<FiBook />}
                  label="Readability"
                  value={scanResult.metrics.readabilityScore}
                />
              </div>
            </Card>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="p-6">
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5" /> 
                  Strengths ({scanResult.strengths?.length || 0})
                </h4>
                <ul className="space-y-2">
                  {scanResult.strengths?.map((strength, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="flex-1">{strength}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>

              {/* Areas for Improvement */}
              <Card className="p-6">
                <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5" /> 
                  Areas for Improvement ({scanResult.weaknesses?.length || 0})
                </h4>
                <ul className="space-y-2">
                  {scanResult.weaknesses?.map((weakness, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    >
                      <span className="text-yellow-500 mt-1">!</span>
                      <span className="flex-1">{weakness}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Suggestions */}
            <Card className="p-6">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" /> 
                Suggested Improvements
              </h4>
              <div className="space-y-3">
                {scanResult.suggestions?.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Missing Keywords */}
            {scanResult.missingKeywords?.length > 0 && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <FiTarget className="w-5 h-5 text-purple-500" />
                  Recommended Keywords to Add
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.missingKeywords.map((keyword, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <Badge 
                        variant="primary" 
                        size="md"
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          navigator.clipboard?.writeText(keyword);
                          toast.success(`"${keyword}" copied to clipboard!`);
                        }}
                      >
                        {keyword}
                        <FiCopy className="w-3 h-3 ml-1 inline" />
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Click on any keyword to copy it to clipboard
                </p>
              </Card>
            )}

            {/* Section Completeness */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Section Completeness</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(scanResult.metrics.sectionCompleteness).map(([section, isComplete]) => (
                  <div key={section} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm capitalize">{section}</span>
                    {isComplete && <FiCheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl shadow-lg">
              <Button 
                onClick={handleImportData} 
                className="flex-1"
                icon={<FiUpload className="w-4 h-4" />}
              >
                Import Data to Resume Builder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDetailedReport(true)}
                icon={<FiAward className="w-4 h-4" />}
              >
                View Detailed Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Report Modal */}
      <Modal
        isOpen={showDetailedReport}
        onClose={() => setShowDetailedReport(false)}
        title="Detailed ATS Analysis Report"
        size="lg"
      >
        {scanResult && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Report content - similar to above but more detailed */}
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold mb-2">File Information</h5>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(scanResult.fileInfo, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold mb-2">Extracted Data Preview</h5>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setShowDetailedReport(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div className="flex justify-center text-gray-600 dark:text-gray-400 mb-1">
      {icon}
    </div>
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export default React.memo(ATSScanner);