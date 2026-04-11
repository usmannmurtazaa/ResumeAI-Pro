import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Card from '../ui/Card';
import Progress from '../ui/Progress';

const ATSScoreMeter = ({ score = 0, breakdown = {} }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! Your resume is well-optimized for ATS systems.';
    if (score >= 60) return 'Good start! Add more keywords and metrics to improve.';
    return 'Needs improvement. Follow the suggestions below.';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <FiCheckCircle className="w-6 h-6 text-green-500" />;
    if (score >= 60) return <FiTrendingUp className="w-6 h-6 text-yellow-500" />;
    return <FiAlertCircle className="w-6 h-6 text-red-500" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">ATS Compatibility Score</h3>
        <div className="flex items-center gap-2">
          {getScoreIcon(score)}
          <span className="text-3xl font-bold">{score}%</span>
        </div>
      </div>

      <Progress 
        value={score} 
        color={getScoreColor(score)} 
        size="lg"
        className="mb-4"
      />

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {getScoreMessage(score)}
      </p>

      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Score Breakdown</h4>
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium">{value}%</span>
              </div>
              <Progress value={value} size="sm" color={getScoreColor(value)} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ATSScoreMeter;