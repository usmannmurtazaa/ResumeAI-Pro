import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ATSScanner from '../components/resume/ATSScanner';
import Card from '../components/ui/Card';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';
import Button from '../components/ui/Button';

const ATSScannerPage = () => {
  const navigate = useNavigate();

  const handleDataExtracted = (data) => {
    // Navigate to builder with extracted data
    navigate('/builder', { state: { extractedData: data } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={<FiArrowLeft />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">ATS Resume Scanner</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your resume to get instant ATS compatibility analysis
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300">How it works</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Our AI-powered scanner analyzes your resume against industry-standard ATS criteria. 
                You'll get a detailed score, keyword suggestions, and actionable improvements.
              </p>
            </div>
          </div>
        </Card>

        {/* Scanner Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ATSScanner onDataExtracted={handleDataExtracted} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ATSScannerPage;