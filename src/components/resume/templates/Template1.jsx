import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiLinkedin, 
  FiGithub, 
  FiGlobe,
  FiCalendar,
  FiAward,
  FiExternalLink,
  FiBriefcase,
  FiBook,
  FiCode,
  FiFolder,
  FiCheckCircle,
  FiStar,
  FiClock
} from 'react-icons/fi';

const Template1 = ({ data, className = '', showAllSections = true }) => {
  const { 
    personal = {}, 
    education = [], 
    experience = [], 
    skills = {}, 
    projects = [], 
    certifications = [] 
  } = data;

  // Calculate total years of experience
  const totalExperience = useMemo(() => {
    if (!experience.length) return null;
    
    let totalMonths = 0;
    experience.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                       (end.getMonth() - start.getMonth());
        if (months > 0) totalMonths += months;
      }
    });
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    if (years === 0) return `${months} months`;
    if (months === 0) return `${years}+ years`;
    return `${years}+ years`;
  }, [experience]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Get skill level indicator
  const getSkillLevel = (skill) => {
    const details = skills.skillDetails?.[skill];
    return details?.proficiency || 'intermediate';
  };

  const getSkillLevelDots = (level) => {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const count = levels[level] || 2;
    return (
      <div className="flex gap-0.5 ml-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < count 
                ? 'bg-primary-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Check if section has content
  const hasContent = (section) => {
    switch(section) {
      case 'summary': return !!personal.summary;
      case 'experience': return experience.length > 0;
      case 'education': return education.length > 0;
      case 'skills': return (skills.technical?.length > 0 || skills.soft?.length > 0);
      case 'projects': return projects.length > 0;
      case 'certifications': return certifications.length > 0;
      case 'languages': return skills.languages?.length > 0;
      default: return false;
    }
  };

  // Section title component
  const SectionTitle = ({ title, icon: Icon }) => (
    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b-2 border-primary-500 flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-primary-500" />}
      {title}
    </h2>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden print:shadow-none ${className}`}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-6 sm:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 tracking-tight"
            >
              {personal.fullName || 'Your Name'}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl opacity-95 mb-4 font-light"
            >
              {personal.title || 'Professional Title'}
            </motion.p>
            
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
            >
              {personal.email && (
                <a 
                  href={`mailto:${personal.email}`}
                  className="flex items-center gap-2 hover:text-white/80 transition-colors"
                >
                  <FiMail className="w-4 h-4" />
                  <span className="break-all">{personal.email}</span>
                </a>
              )}
              {personal.phone && (
                <a 
                  href={`tel:${personal.phone}`}
                  className="flex items-center gap-2 hover:text-white/80 transition-colors"
                >
                  <FiPhone className="w-4 h-4" />
                  <span>{personal.phone}</span>
                </a>
              )}
              {personal.location && (
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" />
                  <span>{personal.location}</span>
                </div>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-2"
            >
              {personal.website && (
                <a 
                  href={personal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors"
                >
                  <FiGlobe className="w-4 h-4" />
                  <span className="break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {personal.linkedin && (
                <a 
                  href={personal.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors"
                >
                  <FiLinkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {personal.github && (
                <a 
                  href={personal.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors"
                >
                  <FiGithub className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
            </motion.div>
          </div>
          
          {/* Profile Image (if available) */}
          {personal.profileImage && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              src={personal.profileImage}
              alt={personal.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 object-cover"
            />
          )}
        </div>
        
        {/* Quick Stats */}
        {totalExperience && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex flex-wrap gap-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">
              <FiBriefcase className="w-3.5 h-3.5" />
              {totalExperience} experience
            </span>
            {education.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">
                <FiBook className="w-3.5 h-3.5" />
                {education.length} {education.length === 1 ? 'degree' : 'degrees'}
              </span>
            )}
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">
                <FiFolder className="w-3.5 h-3.5" />
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Summary */}
            {hasContent('summary') && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SectionTitle title="Professional Summary" />
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {personal.summary}
                </p>
              </motion.section>
            )}

            {/* Work Experience */}
            {hasContent('experience') && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionTitle title="Work Experience" icon={FiBriefcase} />
                <div className="space-y-5">
                  {experience.map((exp, index) => {
                    const duration = (() => {
                      if (!exp.startDate) return null;
                      const start = new Date(exp.startDate);
                      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
                      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                                     (end.getMonth() - start.getMonth());
                      const years = Math.floor(months / 12);
                      const remainingMonths = months % 12;
                      
                      if (years === 0) return `${remainingMonths} mos`;
                      if (remainingMonths === 0) return `${years} yr${years > 1 ? 's' : ''}`;
                      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mos`;
                    })();
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="relative pl-4 border-l-2 border-primary-200 dark:border-primary-800"
                      >
                        <div className="absolute -left-1.5 top-2 w-3 h-3 bg-primary-500 rounded-full" />
                        
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200">
                              {exp.title}
                            </h3>
                            <p className="text-primary-600 dark:text-primary-400 font-medium">
                              {exp.company}
                              {exp.location && ` • ${exp.location}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </p>
                            {duration && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <FiClock className="w-3 h-3" />
                                {duration}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Employment Type Badge */}
                        {exp.employmentType && exp.employmentType !== 'full-time' && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {exp.employmentType}
                          </span>
                        )}
                        
                        {/* Description with bullet points */}
                        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-2">
                          {exp.description?.split('\n').map((line, i) => (
                            line.trim() && (
                              <p key={i} className="flex items-start gap-2">
                                <span className="text-primary-400 mt-1.5">•</span>
                                <span>{line.trim().replace(/^[•\-]\s*/, '')}</span>
                              </p>
                            )
                          ))}
                        </div>
                        
                        {/* Technologies Used */}
                        {exp.technologies && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exp.technologies.split(',').slice(0, 5).map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                              >
                                {tech.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Projects */}
            {hasContent('projects') && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionTitle title="Projects" icon={FiFolder} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {project.name}
                        </h3>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:text-primary-600"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {project.description}
                      </p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.split(',').slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Skills Section */}
            {hasContent('skills') && (
              <motion.section
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SectionTitle title="Skills" icon={FiCode} />
                
                {/* Technical Skills */}
                {skills.technical?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Technical
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.technical.map((skill, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + index * 0.02 }}
                          className="group relative px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-2"
                        >
                          {skill}
                          {skills.skillDetails?.[skill]?.proficiency && 
                           skills.skillDetails[skill].proficiency !== 'intermediate' && (
                            <span className="text-xs text-primary-500">
                              {skills.skillDetails[skill].proficiency === 'expert' ? '⭐⭐' : '⭐'}
                            </span>
                          )}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soft Skills */}
                {skills.soft?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Soft Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.soft.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {skills.languages?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Languages
                    </h4>
                    <div className="space-y-1.5">
                      {skills.languages.map((language, index) => {
                        const proficiency = skills.skillDetails?.[language]?.proficiency;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {language}
                            </span>
                            {proficiency && (
                              <span className="text-xs text-gray-500">
                                {proficiency}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* Education */}
            {hasContent('education') && (
              <motion.section
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionTitle title="Education" icon={FiBook} />
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {edu.degree}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400 text-sm">
                        {edu.institution}
                      </p>
                      {edu.field && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                          {edu.field}
                        </p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {edu.startDate && formatDate(edu.startDate)} 
                        {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                      </p>
                      {edu.gpa && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          GPA: {edu.gpa}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Certifications */}
            {hasContent('certifications') && (
              <motion.section
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionTitle title="Certifications" icon={FiAward} />
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                      className="flex items-start gap-2"
                    >
                      <FiCheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                          {cert.name}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {cert.issuer}
                          {cert.date && ` • ${formatDate(cert.date)}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .max-w-4xl {
            max-width: 100% !important;
          }
          .shadow-2xl {
            box-shadow: none !important;
          }
          .bg-gradient-to-br {
            background: #2563eb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(Template1);