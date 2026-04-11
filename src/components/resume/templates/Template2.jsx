import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Template2 = ({ data }) => {
  const { personal = {}, education = [], experience = [], skills = {} } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-900"
    >
      <div className="grid grid-cols-3 gap-0">
        {/* Sidebar */}
        <div className="col-span-1 bg-gray-100 dark:bg-gray-800 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {personal.fullName || 'Your Name'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {personal.title || 'Professional Title'}
            </p>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              {personal.email && (
                <div className="flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  <span>{personal.email}</span>
                </div>
              )}
              {personal.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  <span>{personal.phone}</span>
                </div>
              )}
              {personal.location && (
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" />
                  <span>{personal.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {skills.technical && skills.technical.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Skills</h3>
              <div className="space-y-2">
                {skills.technical.map((skill, index) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    • {skill}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-2 p-6">
          {/* Summary */}
          {personal.summary && (
            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-300">
                Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {personal.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-300">
                Experience
              </h3>
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={index}>
                    <div className="mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {exp.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {exp.company} | {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-300">
                Education
              </h3>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {edu.degree}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {edu.institution} | {edu.graduationYear}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Template2;