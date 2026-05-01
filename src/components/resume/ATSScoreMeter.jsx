import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  FiTrendingUp, FiAlertCircle, FiCheckCircle, FiAward,
  FiTarget, FiHelpCircle, FiArrowUp, FiArrowDown,
  FiZap, FiChevronDown,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';

// ── Constants ─────────────────────────────────────────────────────────────

const SCORE_GRADES = [
  { min: 95, grade: 'A+', label: 'Outstanding', color: 'text-emerald-600' },
  { min: 90, grade: 'A', label: 'Excellent', color: 'text-green-600' },
  { min: 80, grade: 'B+', label: 'Very Good', color: 'text-lime-600' },
  { min: 70, grade: 'B', label: 'Good', color: 'text-blue-600' },
  { min: 60, grade: 'C+', label: 'Satisfactory', color: 'text-cyan-600' },
  { min: 50, grade: 'C', label: 'Average', color: 'text-yellow-600' },
  { min: 40, grade: 'D', label: 'Below Average', color: 'text-orange-600' },
  { min: 30, grade: 'E', label: 'Poor', color: 'text-red-600' },
  { min: 0, grade: 'F', label: 'Critical', color: 'text-red-700' },
];

const SCORE_MESSAGES = [
  { min: 95, msg: 'Outstanding! Perfectly optimized for ATS systems.' },
  { min: 90, msg: 'Excellent! Highly optimized and competitive.' },
  { min: 80, msg: 'Very Good! Well-optimized with minor room for improvement.' },
  { min: 70, msg: 'Good! Meets most ATS requirements.' },
  { min: 60, msg: 'Satisfactory. Add more keywords and metrics to improve.' },
  { min: 50, msg: 'Average. Significant improvements needed.' },
  { min: 40, msg: 'Below Average. Major revisions recommended.' },
  { min: 30, msg: 'Poor. Needs substantial optimization.' },
  { min: 0, msg: 'Critical. Requires immediate attention.' },
];

const QUICK_TIPS = [
  { min: 70, msg: 'Include a skills section with both technical and soft skills.' },
  { min: 50, msg: 'Quantify your achievements with numbers and percentages.' },
  { min: 0, msg: 'Add industry-specific keywords and action verbs.' },
];

const SIZE_CONFIG = {
  sm: { container: 'p-4', title: 'text-base', score: 'text-2xl', icon: 'w-5 h-5' },
  md: { container: 'p-5', title: 'text-lg', score: 'text-3xl', icon: 'w-6 h-6' },
  lg: { container: 'p-6', title: 'text-xl', score: 'text-4xl', icon: 'w-7 h-7' },
};

// ── Utility Functions ────────────────────────────────────────────────────

const getScoreGrade = (score) => SCORE_GRADES.find(g => score >= g.min) || SCORE_GRADES[SCORE_GRADES.length - 1];
const getScoreMessage = (score) => SCORE_MESSAGES.find(m => score >= m.min)?.msg || SCORE_MESSAGES[SCORE_MESSAGES.length - 1].msg;
const getScoreVariant = (score) => score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
const getQuickTip = (score) => QUICK_TIPS.find(t => score >= t.min)?.msg || QUICK_TIPS[QUICK_TIPS.length - 1].msg;

const getRecommendation = (score) => {
  if (score >= 80) return { title: 'Ready to Apply', desc: 'Your resume is optimized for job applications.', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', action: 'Start applying with confidence!' };
  if (score >= 60) return { title: 'Minor Improvements', desc: 'Add keywords and quantify achievements.', icon: FiTarget, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', action: 'Review suggestions to boost your score.' };
  return { title: 'Optimization Required', desc: 'Your resume needs substantial improvements.', icon: FiAlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', action: 'Follow recommendations to improve.' };
};

const getScoreIcon = (score) => {
  if (score >= 90) return <FiAward className="w-6 h-6 text-yellow-500" />;
  if (score >= 80) return <FiCheckCircle className="w-6 h-6 text-green-500" />;
  if (score >= 60) return <FiTrendingUp className="w-6 h-6 text-yellow-500" />;
  return <FiAlertCircle className="w-6 h-6 text-red-500" />;
};

// ── Main Component ─────────────────────────────────────────────────────────

const ATSScoreMeter = ({ 
  score = 0, 
  breakdown = {}, 
  previousScore = null,
  onScoreClick,
  showDetailed = true,
  size = 'lg',
  animate = true,
  className = '',
}) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  // ── FIXED: Properly cleaned up timer ──────────────────────────────────

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayScore(score);
      return;
    }
    const timer = setTimeout(() => setDisplayScore(score), 100);
    return () => clearTimeout(timer);
  }, [score, shouldAnimate]);

  // ── Score Trend ──────────────────────────────────────────────────────

  const scoreTrend = useMemo(() => {
    if (previousScore === null || previousScore === 0) return null;
    const diff = score - previousScore;
    return {
      value: diff,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      percentage: ((Math.abs(diff) / previousScore) * 100).toFixed(1),
    };
  }, [score, previousScore]);

  // ── Derived Values ───────────────────────────────────────────────────

  const scoreGrade = getScoreGrade(displayScore);
  const recommendation = useMemo(() => getRecommendation(displayScore), [displayScore]);
  const currentSize = SIZE_CONFIG[size] || SIZE_CONFIG.lg;
  const scoreVariant = getScoreVariant(displayScore);

  // ── Animation Variants ──────────────────────────────────────────────

  const containerVariants = shouldAnimate 
    ? { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
    : { hidden: {}, visible: {} };

  const scoreVariants = shouldAnimate
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.2 } } }
    : { initial: {}, animate: {} };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      <Card 
        className={`${currentSize.container} relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`}
        onClick={() => onScoreClick?.(displayScore)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onScoreClick?.(displayScore); }}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 opacity-5 transition-opacity duration-500 ${
          displayScore >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
          displayScore >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
          'bg-gradient-to-br from-red-500 to-pink-500'
        }`} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className={`${currentSize.title} font-semibold text-gray-900 dark:text-white`}>ATS Score</h3>
              <Tooltip content="Measures how well your resume is optimized for Applicant Tracking Systems">
                <FiHelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <motion.div variants={scoreVariants} initial="initial" animate="animate">
              <Badge variant={scoreVariant} size="lg">Grade {scoreGrade.grade}</Badge>
            </motion.div>
          </div>

          {/* Score Display */}
          <div className="flex items-center gap-4 mb-4">
            <motion.div initial={shouldAnimate ? { rotate: -180, opacity: 0 } : {}} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              {getScoreIcon(displayScore)}
            </motion.div>
            <motion.div className="flex items-baseline gap-1" variants={scoreVariants} initial="initial" animate="animate">
              <span className={`${currentSize.score} font-bold ${scoreGrade.color}`}>{displayScore}</span>
              <span className="text-gray-500 text-sm">/100</span>
            </motion.div>
            {scoreTrend && (
              <motion.div initial={shouldAnimate ? { opacity: 0, x: -10 } : {}} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className={`flex items-center gap-1 text-sm ${scoreTrend.direction === 'up' ? 'text-green-500' : scoreTrend.direction === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                {scoreTrend.direction === 'up' && <FiArrowUp className="w-4 h-4" />}
                {scoreTrend.direction === 'down' && <FiArrowDown className="w-4 h-4" />}
                <span className="font-medium">{scoreTrend.value > 0 ? '+' : ''}{scoreTrend.value}</span>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={displayScore} color={scoreVariant} size={size} animated={shouldAnimate} showPercentage={false} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Poor</span><span>Average</span><span>Good</span><span>Excellent</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{getScoreMessage(displayScore)}</p>

          {/* Recommendation */}
          <div className={`p-3 rounded-lg ${recommendation.bg} border border-gray-200/50 dark:border-gray-700/50`}>
            <div className="flex items-start gap-3">
              <recommendation.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${recommendation.color}`} />
              <div>
                <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{recommendation.desc}</p>
                <p className="text-xs font-medium text-primary-500 mt-1">{recommendation.action}</p>
              </div>
            </div>
          </div>

          {/* Breakdown Toggle */}
          {showDetailed && Object.keys(breakdown).length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
              className="mt-4 text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
              type="button"
            >
              {showBreakdown ? 'Hide' : 'Show'} Breakdown
              <motion.span animate={{ rotate: showBreakdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <FiChevronDown className="w-4 h-4" />
              </motion.span>
            </button>
          )}
        </div>

        {/* Breakdown Panel */}
        <AnimatePresence>
          {showBreakdown && showDetailed && Object.keys(breakdown).length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="relative mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-sm mb-3"><FiTarget className="w-4 h-4 inline mr-2" />Score Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(breakdown).map(([key, value], i) => {
                  const catScore = typeof value === 'number' ? value : value?.score || 0;
                  const weight = typeof value === 'object' ? value?.weight : null;
                  const subcategories = typeof value === 'object' ? value?.subcategories : null;
                  
                  return (
                    <motion.div key={key} initial={shouldAnimate ? { opacity: 0, x: -10 } : {}} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`font-medium ${getScoreGrade(catScore).color}`}>{catScore}%</span>
                      </div>
                      <Progress value={catScore} size="sm" color={getScoreVariant(catScore)} animated={shouldAnimate} />
                      {subcategories && (
                        <div className="mt-1 ml-4 space-y-0.5">
                          {Object.entries(subcategories).map(([sk, sv]) => (
                            <div key={sk} className="flex justify-between text-xs"><span className="text-gray-500">{sk}</span><span>{sv}%</span></div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                <span className="text-sm font-medium">Total: </span>
                <span className={`font-bold ${scoreGrade.color}`}>{displayScore}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Tip */}
        {displayScore < 80 && (
          <motion.div initial={shouldAnimate ? { opacity: 0 } : {}} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <FiZap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-0.5">Quick Win</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{getQuickTip(displayScore)}</p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

// ── Score Circle Component (FIXED: Proportional sizing) ──────────────────

export const ATSScoreCircle = ({ score = 0, size = 120, strokeWidth = 8 }) => {
  const prefersReducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke={getScoreColor(score)} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round"
          initial={prefersReducedMotion ? {} : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: prefersReducedMotion ? 0 : 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}</span>
        <span className="text-xs text-gray-500">ATS</span>
      </div>
    </div>
  );
};

export default React.memo(ATSScoreMeter);