import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiGlobe } from 'react-icons/fi';

const Template4 = ({ data }) => {
  const { personal = {}, education = [], experience = [], skills = {}, projects = [], certifications = [] } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl"
    >
      {/* Header with accent bar */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="p-8">
        {/* Name and Title */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-wide mb-2">
            {personal.fullName || 'Your Name'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {personal.title || 'Professional Title'}
          </p>
        </header>

        {/* Contact Bar */}
        <div className="flex flex-wrap justify-center gap-6 py-4 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
          {personal.email && (
            <div className="flex items-center gap-2 text-sm">
              <FiMail className="text-gray-400" />
              <span>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center gap-2 text-sm">
              <FiPhone className="text-gray-400" />
              <span>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div className="flex items-center gap-2 text-sm">
              <FiMapPin className="text-gray-400" />
              <span>{personal.location}</span>
            </div>
          )}
          {personal.website && (
            <div className="flex items-center gap-2 text-sm">
              <FiGlobe className="text-gray-400" />
              <span>{personal.website}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="col-span-1 space-y-6">
            {/* Skills */}
            {skills.technical && skills.technical.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-500">
                  Technical Skills
                </h2>
                <div className="space-y-2">
                  {skills.technical.map((skill, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>{skill}</span>
                        <span className="text-gray-400">
                          {['Expert', 'Advanced', 'Intermediate'][index % 3]}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                          style={{ width: `${100 - (index * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Soft Skills */}
            {skills.soft && skills.soft.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-500">
                  Soft Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.soft.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-500">
                  Certifications
                </h2>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h3 className="font-medium text-sm">{cert.name}</h3>
                      <p className="text-xs text-gray-500">{cert.issuer} • {cert.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-2 space-y-6">
            {/* Summary */}
            {personal.summary && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-500">
                  Professional Summary
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {personal.summary}
                </p>
              </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-500">
                  Work Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <div className="mb-2">
                        <h3 className="font-bold text-lg">{exp.title}</h3>
                        <p className="text-primary-600 dark:text-primary-400">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-500">
                  Key Projects
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {projects.map((project, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-semibold mb-1">{project.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{project.technologies}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-500">
                  Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="font-bold">{edu.degree}</h3>
                      <p className="text-primary-600 dark:text-primary-400">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.graduationYear}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Template4;