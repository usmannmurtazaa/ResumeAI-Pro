import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub } from 'react-icons/fi';

const Template1 = ({ data }) => {
  const { personal = {}, education = [], experience = [], skills = {}, projects = [] } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          {personal.fullName || 'Your Name'}
        </h1>
        <p className="text-xl opacity-90 mb-4">
          {personal.title || 'Professional Title'}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          {personal.email && (
            <div className="flex items-center gap-2">
              <FiMail />
              <span>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center gap-2">
              <FiPhone />
              <span>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div className="flex items-center gap-2">
              <FiMapPin />
              <span>{personal.location}</span>
            </div>
          )}
          {personal.linkedin && (
            <div className="flex items-center gap-2">
              <FiLinkedin />
              <span>{personal.linkedin}</span>
            </div>
          )}
          {personal.github && (
            <div className="flex items-center gap-2">
              <FiGithub />
              <span>{personal.github}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Summary */}
        {personal.summary && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-primary-500 pb-2">
              Professional Summary
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {personal.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-primary-500 pb-2">
              Work Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {exp.title}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400">
                        {exp.company}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-primary-500 pb-2">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {edu.degree}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400">
                      {edu.institution}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {edu.graduationYear}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.technical && skills.technical.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-primary-500 pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.technical.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-primary-500 pb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};

export default Template1;