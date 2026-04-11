import React from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiCopy, FiDownload, FiCalendar, FiClock } from 'react-icons/fi';
import Card from '../ui/Card';

const ResumeCard = ({ resume, onEdit, onDelete, onDuplicate, onDownload }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{resume.name || 'Untitled Resume'}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3 h-3" />
                {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {resume.template || 'Modern'}
              </span>
            </div>
          </div>
          <div className={`text-lg font-bold ${getScoreColor(resume.atsScore)}`}>
            {resume.atsScore || 0}%
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${resume.atsScore || 0}%` }}
              className={`h-2 rounded-full ${
                resume.atsScore >= 80 ? 'bg-green-500' :
                resume.atsScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <FiEdit className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onDownload}
            className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <FiDownload className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onDuplicate}
            className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FiCopy className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onDelete}
            className="flex-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <FiTrash2 className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ResumeCard;