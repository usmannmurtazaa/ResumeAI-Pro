import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub } from 'react-icons/fi';

const Template5 = ({ data }) => {
  const { personal = {}, education = [], experience = [], skills = {}, projects = [] } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="relative">
        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950"></div>
        
        <div className="relative p-8">
          {/* Profile Section */}
          <div className="text-white mb-8">
            <h1 className="text-5xl font-bold mb-2">
              {personal.fullName || 'Your Name'}
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              {personal.title || 'Professional Title'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Contact & Skills */}
            <div className="col-span-1 space-y-6">
              {/* Contact Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">Contact</h3>
                <div className="space-y-3">
                  {personal.email && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <FiMail />
                      <span className="text-sm">{personal.email}</span>
                    </div>
                  )}
                  {personal.phone && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <FiPhone />
                      <span className="text-sm">{personal.phone}</span>
                    </div>
                  )}
                  {personal.location && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <FiMapPin />
                      <span className="text-sm">{personal.location}</span>
                    </div>
                  )}
                  {personal.linkedin && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <FiLinkedin />
                      <span className="text-sm">{personal.linkedin}</span>
                    </div>
                  )}
                  {personal.github && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <FiGithub />
                      <span className="text-sm">{personal.github}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {skills.technical && skills.technical.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.technical.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-md text-sm shadow-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Experience & Education */}
            <div className="col-span-2 space-y-6">
              {/* Summary */}
              {personal.summary && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    Professional Summary
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {personal.summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <h3 className="font-semibold mb-6 text-gray-800 dark:text-gray-200">
                    Work Experience
                  </h3>
                  <div className="space-y-6">
                    {experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-slate-600 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                              {exp.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects & Education Grid */}
              <div className="grid grid-cols-2 gap-6">
                {projects.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                      Key Projects
                    </h3>
                    <div className="space-y-4">
                      {projects.map((project, index) => (
                        <div key={index}>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {project.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {project.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {education.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
                      Education
                    </h3>
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div key={index}>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {edu.degree}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {edu.institution}
                          </p>
                          <p className="text-sm text-gray-500">{edu.graduationYear}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Template5;