import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Template3 = ({ data }) => {
  const { personal = {}, experience = [], skills = {}, projects = [] } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {personal.fullName || 'Your Name'}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            {personal.title || 'Professional Title'}
          </p>
          
          <div className="flex justify-center gap-6 text-sm">
            {personal.email && (
              <span className="flex items-center gap-1">
                <FiMail /> {personal.email}
              </span>
            )}
            {personal.phone && (
              <span className="flex items-center gap-1">
                <FiPhone /> {personal.phone}
              </span>
            )}
            {personal.location && (
              <span className="flex items-center gap-1">
                <FiMapPin /> {personal.location}
              </span>
            )}
          </div>
        </header>

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
              Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{exp.title}</h3>
                      <p className="text-purple-600 dark:text-purple-400">{exp.company}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills & Projects Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Skills */}
          {skills.technical && skills.technical.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.technical.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm"
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
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                Projects
              </h2>
              <div className="space-y-4">
                {projects.slice(0, 2).map((project, index) => (
                  <div key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="font-bold">{project.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.description}
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

export default Template3;