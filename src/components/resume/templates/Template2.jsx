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
  FiClock,
  FiUser,
  FiTarget,
  FiFlag
} from 'react-icons/fi';

const Template2 = ({ data, className = '' }) => {
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

  // Get skill level
  const getSkillProficiency = (skill) => {
    const details = skills.skillDetails?.[skill];
    return details?.proficiency || 'intermediate';
  };

  const getProficiencyColor = (level) => {
    const colors = {
      beginner: 'bg-gray-300',
      intermediate: 'bg-blue-400',
      advanced: 'bg-green-400',
      expert: 'bg-purple-400'
    };
    return colors[level] || colors.intermediate;
  };

  const getProficiencyWidth = (level) => {
    const widths = {
      beginner: '25%',
      intermediate: '50%',
      advanced: '75%',
      expert: '100%'
    };
    return widths[level] || '50%';
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

  // Section title component for sidebar
  const SidebarTitle = ({ title, icon: Icon }) => (
    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4" />}
      {title}
    </h3>
  );

  // Section title component for main content
  const MainTitle = ({ title, icon: Icon }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b-2 border-primary-500 pb-2">
      {Icon && <Icon className="w-4 h-4 text-primary-500" />}
      {title}
    </h3>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl print:shadow-none ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Sidebar - Left Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 sm:p-7"
        >
          {/* Profile Section */}
          <div className="mb-8 text-center md:text-left">
            {personal.profileImage && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                src={personal.profileImage}
                alt={personal.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto md:mx-0 mb-4 border-4 border-white dark:border-gray-700 shadow-lg object-cover"
              />
            )}
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1"
            >
              {personal.fullName || 'Your Name'}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-primary-600 dark:text-primary-400 font-medium mb-3"
            >
              {personal.title || 'Professional Title'}
            </motion.p>
            
            {/* Quick Stats */}
            {totalExperience && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium"
              >
                <FiBriefcase className="w-3.5 h-3.5" />
                {totalExperience} experience
              </motion.div>
            )}
          </div>

          {/* Contact Information */}
          {hasContent('contact') !== false && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <SidebarTitle title="Contact" icon={FiUser} />
              <div className="space-y-3 text-sm">
                {personal.email && (
                  <a 
                    href={`mailto:${personal.email}`}
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FiMail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
                    <span className="break-all">{personal.email}</span>
                  </a>
                )}
                {personal.phone && (
                  <a 
                    href={`tel:${personal.phone}`}
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FiPhone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
                    <span>{personal.phone}</span>
                  </a>
                )}
                {personal.location && (
                  <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                    <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{personal.location}</span>
                  </div>
                )}
                {personal.website && (
                  <a 
                    href={personal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FiGlobe className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
                    <span className="break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {personal.linkedin && (
                  <a 
                    href={personal.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FiLinkedin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {personal.github && (
                  <a 
                    href={personal.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                  >
                    <FiGithub className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500" />
                    <span>GitHub Profile</span>
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* Technical Skills */}
          {skills.technical?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <SidebarTitle title="Technical Skills" icon={FiCode} />
              <div className="space-y-3">
                {skills.technical.map((skill, index) => {
                  const proficiency = getSkillProficiency(skill);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + index * 0.02 }}
                      className="group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {skill}
                        </span>
                        {skills.skillDetails?.[skill]?.yearsOfExperience && (
                          <span className="text-xs text-gray-400">
                            {skills.skillDetails[skill].yearsOfExperience} yr
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: getProficiencyWidth(proficiency) }}
                          transition={{ duration: 0.5, delay: 0.5 + index * 0.02 }}
                          className={`h-full ${getProficiencyColor(proficiency)} rounded-full`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Soft Skills */}
          {skills.soft?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <SidebarTitle title="Soft Skills" icon={FiTarget} />
              <div className="flex flex-wrap gap-2">
                {skills.soft.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + index * 0.02 }}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs shadow-sm"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Languages */}
          {skills.languages?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <SidebarTitle title="Languages" icon={FiFlag} />
              <div className="space-y-2">
                {skills.languages.map((language, index) => {
                  const proficiency = skills.skillDetails?.[language]?.proficiency;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + index * 0.02 }}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {language}
                      </span>
                      {proficiency && (
                        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                          {proficiency}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Certifications Summary */}
          {certifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <SidebarTitle title="Certifications" icon={FiAward} />
              <div className="space-y-2">
                {certifications.slice(0, 3).map((cert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + index * 0.02 }}
                    className="flex items-start gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cert.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cert.issuer}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {certifications.length > 3 && (
                  <p className="text-xs text-gray-400 mt-1">
                    +{certifications.length - 3} more
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content - Right Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 p-6 sm:p-7"
        >
          {/* Professional Summary */}
          {hasContent('summary') && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <MainTitle title="Professional Profile" />
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {personal.summary}
              </p>
            </motion.section>
          )}

          {/* Work Experience */}
          {hasContent('experience') && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <MainTitle title="Work Experience" icon={FiBriefcase} />
              <div className="space-y-6">
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
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="relative"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">
                            {exp.title}
                          </h4>
                          <p className="text-primary-600 dark:text-primary-400 font-medium">
                            {exp.company}
                          </p>
                          {exp.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <FiMapPin className="w-3 h-3" />
                              {exp.location}
                            </p>
                          )}
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
                      
                      {/* Description */}
                      <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1.5">
                        {exp.description?.split('\n').map((line, i) => (
                          line.trim() && (
                            <p key={i} className="flex items-start gap-2">
                              <span className="text-primary-400 mt-1.5">•</span>
                              <span>{line.trim().replace(/^[•\-]\s*/, '')}</span>
                            </p>
                          )
                        ))}
                      </div>
                      
                      {/* Technologies */}
                      {exp.technologies && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {exp.technologies.split(',').map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
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
              transition={{ delay: 0.45 }}
              className="mb-8"
            >
              <MainTitle title="Key Projects" icon={FiFolder} />
              <div className="space-y-4">
                {projects.slice(0, 3).map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {project.name}
                      </h4>
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
                        {project.technologies.split(',').slice(0, 4).map((tech, i) => (
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

          {/* Education */}
          {hasContent('education') && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <MainTitle title="Education" icon={FiBook} />
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {edu.degree}
                        </h4>
                        <p className="text-primary-600 dark:text-primary-400 text-sm">
                          {edu.institution}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {edu.startDate && formatDate(edu.startDate)} 
                        {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                      </p>
                    </div>
                    {edu.field && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        Field of Study: {edu.field}
                      </p>
                    )}
                    {edu.gpa && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        GPA: {edu.gpa}
                      </p>
                    )}
                    {edu.achievements && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {edu.achievements}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
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
          .bg-gradient-to-b {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(Template2);
