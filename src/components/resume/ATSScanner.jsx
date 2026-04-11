import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { parseResume } from '../../utils/resumeParser';
import { calculateATSScore, analyzeResume } from '../../utils/atsKeywords';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

const ATSScanner = ({ onDataExtracted }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await scanResume(acceptedFiles[0]);
      }
    }
  });

  const scanResume = async (resumeFile) => {
    setScanning(true);
    try {
      const parsed = await parseResume(resumeFile);
      setExtractedData(parsed);

      const score = calculateATSScore(parsed);
      const analysis = analyzeResume(parsed);

      setScanResult({
        score,
        ...analysis
      });

      toast.success('Resume scanned successfully!');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan resume. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! Your resume is well-optimized for ATS systems.';
    if (score >= 60) return 'Good! Add more keywords and metrics to improve.';
    return 'Needs improvement. Follow the suggestions below.';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!scanResult && (
        <Card className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-700 hover:border-primary-500'
              }`}
          >
            <input {...getInputProps()} />
            <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Upload Your Resume for ATS Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag & drop your resume or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, DOCX, DOC (Max 10MB)
            </p>
          </div>
        </Card>
      )}

      {/* Scanning Progress */}
      {scanning && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Resume</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Scanning for ATS compatibility and extracting data...
          </p>
        </Card>
      )}

      {/* Scan Results */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">ATS Compatibility Score</h3>
                <div className={`text-4xl font-bold ${getScoreColor(scanResult.score)}`}>
                  {scanResult.score}%
                </div>
              </div>
              <Progress value={scanResult.score} size="lg" className="mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {getScoreMessage(scanResult.score)}
              </p>
            </Card>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="p-6">
                <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <FiCheckCircle /> Strengths
                </h4>
                <ul className="space-y-2">
                  {scanResult.strengths?.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Areas for Improvement */}
              <Card className="p-6">
                <h4 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                  <FiAlertCircle /> Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {scanResult.weaknesses?.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-yellow-500 mt-1">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Suggestions */}
            <Card className="p-6">
              <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <FiTrendingUp /> Suggested Improvements
              </h4>
              <div className="space-y-3">
                {scanResult.suggestions?.map((suggestion, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Missing Keywords */}
            {scanResult.missingKeywords?.length > 0 && (
              <Card className="p-6">
                <h4 className="font-semibold mb-3">Recommended Keywords to Add</h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.missingKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="primary">{keyword}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => onDataExtracted?.(extractedData)}>
                Import Data to Builder
              </Button>
              <Button variant="outline" onClick={() => {
                setScanResult(null);
                setExtractedData(null);
              }}>
                Scan Another Resume
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ATSScanner;