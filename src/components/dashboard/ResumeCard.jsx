import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiEdit, 
  FiTrash2, 
  FiCopy, 
  FiDownload, 
  FiCalendar, 
  FiClock,
  FiMoreVertical,
  FiEye,
  FiShare2,
  FiStar,
  FiAlertCircle,
  FiCheckCircle,
  FiTarget,
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiMail,
  FiPhone,
  FiChevronRight,
  FiTag
} from 'react-icons/fi';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import { format, formatDistanceToNow } from 'date-fns';

const ResumeCard = ({ 
  resume, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onDownload,
  onPreview,
  onShare,
  viewMode = 'grid',
  selected = false,
  onSelect
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const getTemplateIcon = (template) => {
    const icons = {
      modern: '🎨',
      classic: '📄',
      creative: '✨',
      minimal: '◻️',
      executive: '👔',
      tech: '💻'
    };
    return icons[template?.toLowerCase()] || '📄';
  };

  const scoreGrade = getScoreGrade(resume.atsScore || 0);
  const completionPercentage = calculateCompletion(resume);

  function calculateCompletion(resume) {
    if (!resume.data) return 0;
    
    const sections = ['personal', 'education', 'experience', 'skills'];
    const completed = sections.filter(section => {
      const data = resume.data[section];
      if (section === 'personal') return data?.fullName && data?.email;
      if (section === 'skills') return data?.technical?.length > 0;
      return data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
    });
    
    return (completed.length / sections.length) * 100;
  }

  const personal = resume.data?.personal || {};
  const hasPersonalInfo = personal.fullName || personal.title;

  if (viewMode === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="group"
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
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                resume.atsScore >= 80 ? 'from-green-500 to-emerald-500' :
                resume.atsScore >= 60 ? 'from-yellow-500 to-orange-500' :
                'from-red-500 to-pink-500'
              } flex items-center justify-center text-white text-xl`}>
                {getTemplateIcon(resume.template)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{resume.name || 'Untitled Resume'}</h3>
                  {hasPersonalInfo && (
                    <p className="text-sm text-gray-500 truncate">
                      {personal.fullName || personal.title}
                    </p>
                  )}
                </div>
                <Badge variant={getScoreColor(resume.atsScore || 0)} size="sm">
                  {resume.atsScore || 0}%
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {resume.updatedAt 
                    ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
                    : 'Never'}
                </span>
                <Progress value={completionPercentage} size="sm" className="w-16" />
              </div>
            </div>

            {/* Quick Actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1"
                >
                  <Tooltip content="Edit">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Download">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
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
            />
          </div>
        )}

        {/* Featured Badge */}
        {resume.atsScore >= 90 && (
          <div className="absolute top-3 right-3 z-10">
            <Tooltip content="Top Performer">
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <FiStar className="w-3 h-3 fill-current" />
                Featured
              </Badge>
            </Tooltip>
          </div>
        )}

        {/* Header Section */}
        <div className={`flex justify-between items-start mb-4 ${onSelect ? 'ml-6' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold truncate">
                {resume.name || 'Untitled Resume'}
              </h3>
              {resume.status === 'draft' && (
                <Badge variant="secondary" size="sm">Draft</Badge>
              )}
            </div>
            
            {/* Personal Info Preview */}
            {hasPersonalInfo && (
              <div className="space-y-0.5 mb-2">
                {personal.fullName && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {personal.fullName}
                  </p>
                )}
                {personal.title && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FiBriefcase className="w-3 h-3" />
                    {personal.title}
                  </p>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3 h-3" />
                <Tooltip content={resume.updatedAt ? format(new Date(resume.updatedAt), 'PPP p') : 'Never'}>
                  <span>
                    {resume.updatedAt 
                      ? formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })
                      : 'Never updated'}
                  </span>
                </Tooltip>
              </span>
              <span className="flex items-center gap-1">
                <FiTag className="w-3 h-3" />
                <span className="capitalize">{resume.template || 'Modern'}</span>
              </span>
              {resume.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <FiDownload className="w-3 h-3" />
                  {resume.downloadCount} download{resume.downloadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* ATS Score Display */}
          <div className="text-right ml-4">
            <div className="flex items-center gap-1">
              <Tooltip content={`ATS Score: ${scoreGrade.grade}`}>
                <span className={`text-xl font-bold ${scoreGrade.color}`}>
                  {resume.atsScore || 0}%
                </span>
              </Tooltip>
            </div>
            <p className="text-xs text-gray-400">ATS Score</p>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Completion</span>
            <span className="text-xs font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress 
            value={completionPercentage} 
            size="sm"
            color={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'danger'}
          />
        </div>

        {/* ATS Score Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiTarget className="w-3 h-3" />
              ATS Compatibility
            </span>
            <span className="text-xs font-medium">{resume.atsScore || 0}%</span>
          </div>
          <Progress 
            value={resume.atsScore || 0} 
            size="sm"
            color={getScoreColor(resume.atsScore || 0)}
          />
        </div>

        {/* Skills Preview */}
        {resume.data?.skills?.technical?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Top Skills</p>
            <div className="flex flex-wrap gap-1">
              {resume.data.skills.technical.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {skill}
                </Badge>
              ))}
              {resume.data.skills.technical.length > 3 && (
                <Badge variant="secondary" size="sm">
                  +{resume.data.skills.technical.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Tooltip content="Edit Resume">
            <button
              onClick={onEdit}
              className="flex-1 p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all hover:scale-105"
            >
              <FiEdit className="w-4 h-4 mx-auto" />
            </button>
          </Tooltip>
          
          <Tooltip content="Preview">
            <button
              onClick={onPreview}
              className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-105"
            >
              <FiEye className="w-4 h-4 mx-auto" />
            </button>
          </Tooltip>
          
          <Tooltip content="Download PDF">
            <button
              onClick={onDownload}
              className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:scale-105"
            >
              <FiDownload className="w-4 h-4 mx-auto" />
            </button>
          </Tooltip>
          
          <Tooltip content="Duplicate">
            <button
              onClick={onDuplicate}
              className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-105"
            >
              <FiCopy className="w-4 h-4 mx-auto" />
            </button>
          </Tooltip>
          
          {/* More Options Menu */}
          <div className="relative">
            <Tooltip content="More options">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105"
              >
                <FiMoreVertical className="w-4 h-4 mx-auto" />
              </button>
            </Tooltip>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20"
                >
                  <div className="py-1">
                    {onShare && (
                      <button
                        onClick={() => { onShare(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FiShare2 className="w-4 h-4" />
                        Share
                      </button>
                    )}
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            {resume.status === 'completed' || resume.atsScore >= 80 ? (
              <>
                <FiCheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Ready to Apply</span>
              </>
            ) : resume.atsScore >= 60 ? (
              <>
                <FiAlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500">Needs Improvement</span>
              </>
            ) : (
              <>
                <FiAlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500">Requires Work</span>
              </>
            )}
          </span>
          
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-primary-500 hover:text-primary-600 transition-colors"
          >
            Continue Editing
            <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ResumeCard;