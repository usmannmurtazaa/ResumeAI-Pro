import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiEdit, FiTrash2, FiCopy, FiDownload, FiCalendar,
  FiMoreVertical, FiEye, FiShare2, FiStar,
  FiAlertCircle, FiCheckCircle, FiTarget, FiUser,
  FiBriefcase, FiTag, FiChevronRight, FiClock,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import { format, formatDistanceToNow } from 'date-fns';

// ── Constants & Utilities ──────────────────────────────────────────────────

const TEMPLATE_ICONS = {
  modern: '🎨', classic: '📄', creative: '✨',
  minimal: '◻️', executive: '👔', tech: '💻',
};

const RESUME_SECTIONS = ['personal', 'education', 'experience', 'skills'];

/**
 * Calculates resume completion percentage based on filled sections.
 */
const calculateCompletion = (resume) => {
  if (!resume?.data) return 0;
  
  const data = resume.data;
  const completed = RESUME_SECTIONS.filter(section => {
    const sectionData = data[section];
    if (!sectionData) return false;
    
    switch (section) {
      case 'personal':
        return !!(sectionData.fullName || sectionData.email);
      case 'skills':
        return Array.isArray(sectionData.technical) 
          ? sectionData.technical.length > 0 
          : Object.keys(sectionData).length > 0;
      case 'education':
      case 'experience':
        return Array.isArray(sectionData) 
          ? sectionData.length > 0 
          : Object.keys(sectionData).length > 0;
      default:
        return false;
    }
  });
  
  return (completed.length / RESUME_SECTIONS.length) * 100;
};

/**
 * Returns color variant based on ATS score.
 */
const getScoreVariant = (score) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
};

/**
 * Returns grade info for ATS score.
 */
const getScoreGrade = (score) => {
  const grades = [
    { min: 90, grade: 'A+', color: 'text-green-600' },
    { min: 80, grade: 'A', color: 'text-green-600' },
    { min: 70, grade: 'B', color: 'text-blue-600' },
    { min: 60, grade: 'C', color: 'text-yellow-600' },
    { min: 50, grade: 'D', color: 'text-orange-600' },
    { min: 0, grade: 'F', color: 'text-red-600' },
  ];
  return grades.find(g => score >= g.min) || grades[grades.length - 1];
};

/**
 * Returns status info for a resume.
 */
const getStatusInfo = (resume) => {
  const score = resume?.atsScore || 0;
  
  if (score >= 80) {
    return { icon: FiCheckCircle, color: 'text-green-500', label: 'Ready to Apply' };
  }
  if (score >= 60) {
    return { icon: FiAlertCircle, color: 'text-yellow-500', label: 'Needs Improvement' };
  }
  return { icon: FiAlertCircle, color: 'text-red-500', label: 'Requires Work' };
};

// ── Compact View ───────────────────────────────────────────────────────────

const CompactResumeCard = ({ resume, selected, onSelect, onEdit, onDownload, onPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  const score = resume?.atsScore || 0;
  const completion = useMemo(() => calculateCompletion(resume), [resume]);
  const personal = resume?.data?.personal || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`p-4 transition-all ${selected ? 'ring-2 ring-primary-500' : ''}`}>
        {onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              aria-label={`Select ${resume.name || 'resume'}`}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${
            score >= 80 ? 'from-green-500 to-emerald-500' :
            score >= 60 ? 'from-yellow-500 to-orange-500' :
            'from-red-500 to-pink-500'
          } flex items-center justify-center text-white text-xl`}>
            {TEMPLATE_ICONS[resume?.template?.toLowerCase()] || '📄'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{resume?.name || 'Untitled Resume'}</h3>
                {personal.fullName && (
                  <p className="text-sm text-gray-500 truncate">{personal.fullName}</p>
                )}
              </div>
              <Badge variant={getScoreVariant(score)} size="sm">{score}%</Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {resume?.updatedAt 
                  ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
                  : 'Never'}
              </span>
              <Progress value={completion} size="sm" className="w-16" />
            </div>
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1"
              >
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(resume); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Edit resume"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                )}
                {onDownload && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(resume); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Download resume"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

// ── Grid View ──────────────────────────────────────────────────────────────

const GridResumeCard = ({ 
  resume, selected, onSelect, 
  onEdit, onDelete, onDuplicate, onDownload, onPreview, onShare 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuDirection, setMenuDirection] = useState('up');
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const score = resume?.atsScore || 0;
  const completion = useMemo(() => calculateCompletion(resume), [resume]);
  const scoreGrade = useMemo(() => getScoreGrade(score), [score]);
  const statusInfo = useMemo(() => getStatusInfo(resume), [resume]);
  const personal = resume?.data?.personal || {};
  const skills = resume?.data?.skills?.technical || [];

  // Check menu position and flip if needed
  const handleToggleMenu = useCallback(() => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const menuHeight = 120; // Approximate menu height
      setMenuDirection(spaceAbove > menuHeight ? 'up' : 'down');
    }
    setShowMenu(prev => !prev);
  }, [showMenu]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Card className={`p-5 transition-all duration-300 hover:shadow-xl ${
        selected ? 'ring-2 ring-primary-500' : ''
      }`}>
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              aria-label={`Select ${resume.name || 'resume'}`}
            />
          </div>
        )}

        {/* Featured Badge */}
        {score >= 90 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="warning" size="sm" className="flex items-center gap-1">
              <FiStar className="w-3 h-3 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className={`flex justify-between items-start mb-4 ${onSelect ? 'ml-6' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold truncate">
                {resume?.name || 'Untitled Resume'}
              </h3>
              {resume?.status === 'draft' && (
                <Badge variant="secondary" size="sm">Draft</Badge>
              )}
            </div>
            
            {personal.fullName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <FiUser className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{personal.fullName}</span>
              </p>
            )}
            {personal.title && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiBriefcase className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{personal.title}</span>
              </p>
            )}
          </div>

          <div className="text-right ml-4 flex-shrink-0">
            <span className={`text-xl font-bold ${scoreGrade.color}`}>
              {score}%
            </span>
            <p className="text-xs text-gray-400">ATS</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <FiCalendar className="w-3 h-3" />
            {resume?.updatedAt 
              ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
              : 'Never updated'}
          </span>
          <span className="flex items-center gap-1">
            <FiTag className="w-3 h-3" />
            <span className="capitalize">{resume?.template || 'Modern'}</span>
          </span>
        </div>

        {/* Completion Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Completion</span>
            <span className="text-xs font-medium">{Math.round(completion)}%</span>
          </div>
          <Progress value={completion} size="sm" color={getScoreVariant(completion)} />
        </div>

        {/* ATS Score Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiTarget className="w-3 h-3" />
              ATS Compatibility
            </span>
            <span className="text-xs font-medium">{score}%</span>
          </div>
          <Progress value={score} size="sm" color={getScoreVariant(score)} />
        </div>

        {/* Skills Preview */}
        {skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Top Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="secondary" size="sm">{skill}</Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="secondary" size="sm">+{skills.length - 3}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
          {[
            { onClick: onEdit, icon: FiEdit, color: 'primary', label: 'Edit' },
            { onClick: onPreview, icon: FiEye, color: 'purple', label: 'Preview' },
            { onClick: onDownload, icon: FiDownload, color: 'green', label: 'Download' },
            { onClick: onDuplicate, icon: FiCopy, color: 'blue', label: 'Duplicate' },
          ].map(({ onClick, icon: Icon, color, label }) => (
            onClick && (
              <button
                key={label}
                onClick={() => onClick(resume)}
                className={`flex-1 p-2 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 rounded-lg hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-all hover:scale-105`}
                aria-label={`${label} resume`}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            )
          ))}

          {/* More Menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={handleToggleMenu}
              className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105"
              aria-label="More options"
              aria-expanded={showMenu}
            >
              <FiMoreVertical className="w-4 h-4 mx-auto" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 ${
                    menuDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
                  }`}
                >
                  <div className="py-1">
                    {onShare && (
                      <button
                        onClick={() => { onShare(resume); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FiShare2 className="w-4 h-4" /> Share
                      </button>
                    )}
                    <button
                      onClick={() => { onDelete(resume); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={`flex items-center gap-1 ${statusInfo.color}`}>
            <statusInfo.icon className="w-3 h-3" />
            {statusInfo.label}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(resume)}
              className="flex items-center gap-1 text-primary-500 hover:text-primary-600 transition-colors"
            >
              Continue Editing
              <FiChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const ResumeCard = (props) => {
  const { viewMode = 'grid' } = props;

  if (viewMode === 'compact') {
    return <CompactResumeCard {...props} />;
  }

  return <GridResumeCard {...props} />;
};

export default React.memo(ResumeCard);
