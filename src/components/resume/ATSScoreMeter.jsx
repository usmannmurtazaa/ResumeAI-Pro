import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiAward,
  FiTarget,
  FiClock,
  FiInfo,
  FiArrowUp,
  FiArrowDown,
  FiHelpCircle,
  FiZap,
  FiShield
} from 'react-icons/fi';
import Card from '../ui/Card';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';

const ATSScoreMeter = ({ 
  score = 0, 
  breakdown = {}, 
  previousScore = null,
  onScoreClick,
  showDetailed = true,
  size = 'lg',
  animate = true,
  className = ''
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Animate score on mount
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setDisplayScore(score);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayScore(score);
    }
  }, [score, animate]);

  // Calculate score trend
  const scoreTrend = useMemo(() => {
    if (previousScore === null) return null;
    const difference = score - previousScore;
    return {
      value: difference,
      direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral',
      percentage: ((difference / previousScore) * 100).toFixed(1)
    };
  }, [score, previousScore]);

  // Get score grade
  const getScoreGrade = (scoreValue) => {
    if (scoreValue >= 95) return { grade: 'A+', label: 'Outstanding', color: 'text-emerald-600' };
    if (scoreValue >= 90) return { grade: 'A', label: 'Excellent', color: 'text-green-600' };
    if (scoreValue >= 80) return { grade: 'B+', label: 'Very Good', color: 'text-lime-600' };
    if (scoreValue >= 70) return { grade: 'B', label: 'Good', color: 'text-blue-600' };
    if (scoreValue >= 60) return { grade: 'C+', label: 'Satisfactory', color: 'text-cyan-600' };
    if (scoreValue >= 50) return { grade: 'C', label: 'Average', color: 'text-yellow-600' };
    if (scoreValue >= 40) return { grade: 'D', label: 'Below Average', color: 'text-orange-600' };
    if (scoreValue >= 30) return { grade: 'E', label: 'Poor', color: 'text-red-600' };
    return { grade: 'F', label: 'Critical', color: 'text-red-700' };
  };

  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return 'success';
    if (scoreValue >= 60) return 'warning';
    return 'danger';
  };

  const getScoreMessage = (scoreValue) => {
    if (scoreValue >= 95) return 'Outstanding! Your resume is perfectly optimized for ATS systems.';
    if (scoreValue >= 90) return 'Excellent! Your resume is highly optimized and competitive.';
    if (scoreValue >= 80) return 'Very Good! Your resume is well-optimized with minor room for improvement.';
    if (scoreValue >= 70) return 'Good! Your resume meets most ATS requirements.';
    if (scoreValue >= 60) return 'Satisfactory. Add more keywords and metrics to improve.';
    if (scoreValue >= 50) return 'Average. Significant improvements needed for better visibility.';
    if (scoreValue >= 40) return 'Below Average. Major revisions recommended.';
    if (scoreValue >= 30) return 'Poor. Your resume needs substantial optimization.';
    return 'Critical. Your resume requires immediate attention.';
  };

  const getScoreIcon = (scoreValue) => {
    if (scoreValue >= 90) return <FiAward className="w-6 h-6 text-yellow-500" />;
    if (scoreValue >= 80) return <FiCheckCircle className="w-6 h-6 text-green-500" />;
    if (scoreValue >= 60) return <FiTrendingUp className="w-6 h-6 text-yellow-500" />;
    return <FiAlertCircle className="w-6 h-6 text-red-500" />;
  };

  const getRecommendation = (scoreValue) => {
    if (scoreValue >= 80) return {
      title: 'Ready to Apply',
      description: 'Your resume is optimized and ready for job applications.',
      icon: <FiCheckCircle className="w-5 h-5 text-green-500" />,
      action: 'Start applying to jobs with confidence!'
    };
    if (scoreValue >= 60) return {
      title: 'Minor Improvements Needed',
      description: 'Add more industry keywords and quantify achievements.',
      icon: <FiTarget className="w-5 h-5 text-yellow-500" />,
      action: 'Review suggestions to boost your score.'
    };
    return {
      title: 'Significant Optimization Required',
      description: 'Your resume needs substantial improvements for ATS compatibility.',
      icon: <FiAlertCircle className="w-5 h-5 text-red-500" />,
      action: 'Follow the recommendations to improve visibility.'
    };
  };

  // Calculate size classes
  const sizeClasses = {
    sm: {
      container: 'p-4',
      title: 'text-base',
      score: 'text-2xl',
      icon: 'w-5 h-5'
    },
    md: {
      container: 'p-5',
      title: 'text-lg',
      score: 'text-3xl',
      icon: 'w-6 h-6'
    },
    lg: {
      container: 'p-6',
      title: 'text-xl',
      score: 'text-4xl',
      icon: 'w-7 h-7'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.lg;
  const scoreGrade = getScoreGrade(displayScore);
  const recommendation = getRecommendation(displayScore);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const scoreVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.2
      }
    }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${displayScore}%`,
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card 
        className={`${currentSize.container} relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`}
        onClick={() => onScoreClick?.(displayScore)}
      >
        {/* Background Gradient based on score */}
        <div 
          className={`absolute inset-0 opacity-5 transition-opacity duration-500 ${
            displayScore >= 80 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
              : displayScore >= 60 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                : 'bg-gradient-to-br from-red-500 to-pink-500'
          }`}
        />

        {/* Header Section */}
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className={`${currentSize.title} font-semibold`}>
                ATS Compatibility Score
              </h3>
              <Tooltip content="ATS (Applicant Tracking System) score measures how well your resume is optimized for automated screening systems">
                <FiHelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            
            {/* Score Badge */}
            <motion.div
              variants={scoreVariants}
              initial="initial"
              animate="animate"
            >
              <Badge 
                variant={getScoreColor(displayScore)}
                size="lg"
                className="flex items-center gap-1"
              >
                Grade {scoreGrade.grade}
              </Badge>
            </motion.div>
          </div>

          {/* Score Display */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {getScoreIcon(displayScore)}
              </motion.div>
              
              <motion.div 
                className="flex items-baseline gap-1"
                variants={scoreVariants}
                initial="initial"
                animate="animate"
              >
                <span className={`${currentSize.score} font-bold ${scoreGrade.color}`}>
                  {displayScore}
                </span>
                <span className="text-gray-500">/100</span>
              </motion.div>
            </div>

            {/* Score Trend */}
            {scoreTrend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-1 text-sm ${
                  scoreTrend.direction === 'up' 
                    ? 'text-green-500' 
                    : scoreTrend.direction === 'down'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}
              >
                {scoreTrend.direction === 'up' && <FiArrowUp className="w-4 h-4" />}
                {scoreTrend.direction === 'down' && <FiArrowDown className="w-4 h-4" />}
                <span className="font-medium">
                  {scoreTrend.value > 0 ? '+' : ''}{scoreTrend.value} ({scoreTrend.percentage}%)
                </span>
                <span className="text-xs text-gray-400 ml-1">since last scan</span>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress 
              value={displayScore} 
              color={getScoreColor(displayScore)} 
              size={size}
              animated={animate}
              showPercentage={false}
              className="mb-2"
            />
            
            {/* Score Range Indicators */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Poor</span>
              <span>Average</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Score Message */}
          <motion.p 
            className="text-sm text-gray-600 dark:text-gray-400 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {getScoreMessage(displayScore)}
          </motion.p>

          {/* Recommendation Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`p-3 rounded-lg ${
              displayScore >= 80 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : displayScore >= 60 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {recommendation.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  {recommendation.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {recommendation.description}
                </p>
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  {recommendation.action}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Toggle Breakdown Button */}
          {showDetailed && Object.keys(breakdown).length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBreakdown(!showBreakdown);
              }}
              className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              {showBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
              <motion.span
                animate={{ rotate: showBreakdown ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.span>
            </button>
          )}
        </div>

        {/* Score Breakdown */}
        <AnimatePresence>
          {showBreakdown && showDetailed && Object.keys(breakdown).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="relative mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <FiTarget className="w-4 h-4" />
                Score Breakdown
              </h4>
              
              <div className="space-y-3">
                {Object.entries(breakdown).map(([key, value], index) => {
                  const categoryScore = typeof value === 'number' ? value : value.score || 0;
                  const weight = typeof value === 'object' ? value.weight : null;
                  
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="flex justify-between items-center text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {weight && (
                            <Tooltip content={`Weight: ${weight}% of total score`}>
                              <FiInfo className="w-3 h-3 text-gray-400" />
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getScoreGrade(categoryScore).color}`}>
                            {categoryScore}%
                          </span>
                          {weight && (
                            <span className="text-xs text-gray-400">
                              ({(categoryScore * weight / 100).toFixed(1)} weighted)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Progress 
                          value={categoryScore} 
                          size="sm" 
                          color={getScoreColor(categoryScore)}
                          animated={animate}
                        />
                        
                        {/* Hover effect for breakdown */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </div>
                      </div>

                      {/* Sub-categories if available */}
                      {typeof value === 'object' && value.subcategories && (
                        <div className="mt-2 ml-4 space-y-1">
                          {Object.entries(value.subcategories).map(([subKey, subValue]) => (
                            <div key={subKey} className="flex justify-between text-xs">
                              <span className="text-gray-500 capitalize">{subKey}</span>
                              <span className="text-gray-600">{subValue}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Total Score Calculation */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Total Score</span>
                  <span className={`font-bold ${scoreGrade.color}`}>
                    {displayScore}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated using weighted average of all categories
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Tips */}
        {displayScore < 80 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <FiZap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                Quick Win
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {displayScore < 50 && 'Add industry-specific keywords and action verbs to dramatically improve your score.'}
                {displayScore >= 50 && displayScore < 70 && 'Quantify your achievements with numbers and percentages.'}
                {displayScore >= 70 && 'Include a skills section with both technical and soft skills.'}
              </p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

// Score Circle Component (Alternative circular display)
export const ATSScoreCircle = ({ score = 0, size = 120 }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return '#10b981';
    if (scoreValue >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={45}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={45}
          stroke={getScoreColor(score)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-xs text-gray-500">ATS</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ATSScoreMeter);