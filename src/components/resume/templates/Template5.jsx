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
  FiFlag,
  FiTrendingUp,
  FiUsers,
  FiHeart,
  FiCoffee,
  FiMoreHorizontal,
  FiDownload,
  FiShare2,
  FiArrowRight
} from 'react-icons/fi';

const Template5 = ({ data, className = '' }) => {
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

  // Get top skills for display
  const topTechnicalSkills = useMemo(() => {
    const technical = skills.technical || [];
    return technical.slice(0, 8);
  }, [skills]);

  // Get skill proficiency
  const getSkillProficiency = (skill) => {
    const details = skills.skillDetails?.[skill];
    return details?.proficiency || 'intermediate';
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

  // Section title for dark header
  const DarkSectionTitle = ({ title, icon: Icon }) => (
    <h3 className="text-white font-semibold mb-4 flex items-center gap-2 border-b border-white/20 pb-2">
      {Icon && <Icon className="w-4 h-4" />}
      {title}
    </h3>
  );

  // Section title for light cards
  const LightSectionTitle = ({ title, icon: Icon }) => (
    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
      {Icon && <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
      {title}
    </h3>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-2xl print:shadow-none ${className}`}
    >
      <div className="relative">
        {/* Dark Header Background */}
        <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-black">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="relative p-6 sm:p-8">
          {/* Profile Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                {personal.profileImage && (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    src={personal.profileImage}
                    alt={personal.fullName}
                    className="w-24 h-24 rounded-full mb-4 border-4 border-white/20 object-cover"
                  />
                )}
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white">
                  {personal.fullName || 'Your Name'}
                </h1>
                
                <p className="text-xl text-gray-300 mb-3">
                  {personal.title || 'Professional Title'}
                </p>
                
                {/* Quick Stats */}
                {totalExperience && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-200 border border-white/20">
                      <FiBriefcase className="w-3.5 h-3.5" />
                      {totalExperience} experience
                    </span>
                    {education.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-200 border border-white/20">
                        <FiBook className="w-3.5 h-3.5" />
                        {education.length} {education.length === 1 ? 'degree' : 'degrees'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contact Quick Links */}
              <div className="flex gap-3">
                {personal.email && (
                  <a
                    href={`mailto:${personal.email}`}
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20"
                    title={personal.email}
                  >
                    <FiMail className="w-5 h-5" />
                  </a>
                )}
                {personal.phone && (
                  <a
                    href={`tel:${personal.phone}`}
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20"
                    title={personal.phone}
                  >
                    <FiPhone className="w-5 h-5" />
                  </a>
                )}
                {personal.linkedin && (
                  <a
                    href={personal.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20"
                    title="LinkedIn"
                  >
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                )}
                {personal.github && (
                  <a
                    href={personal.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20"
                    title="GitHub"
                  >
                    <FiGithub className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Contact & Skills */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-1 space-y-6"
            >
              {/* Contact Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <DarkSectionTitle title="Contact" icon={FiUser} />
                <div className="space-y-3">
                  {personal.email && (
                    <a 
                      href={`mailto:${personal.email}`}
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group"
                    >
                      <FiMail className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm break-all">{personal.email}</span>
                    </a>
                  )}
                  {personal.phone && (
                    <a 
                      href={`tel:${personal.phone}`}
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group"
                    >
                      <FiPhone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">{personal.phone}</span>
                    </a>
                  )}
                  {personal.location && (
                    <div className="flex items-start gap-3 text-gray-300">
                      <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{personal.location}</span>
                    </div>
                  )}
                  {personal.website && (
                    <a 
                      href={personal.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group"
                    >
                      <FiGlobe className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Technical Skills */}
              {topTechnicalSkills.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Technical Skills" icon={FiCode} />
                  <div className="flex flex-wrap gap-2">
                    {topTechnicalSkills.map((skill, index) => {
                      const proficiency = getSkillProficiency(skill);
                      const years = skills.skillDetails?.[skill]?.yearsOfExperience;
                      
                      return (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.03 }}
                          whileHover={{ scale: 1.05 }}
                          className="group relative px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg text-sm shadow-md transition-all"
                        >
                          {skill}
                          {years && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                              {years}
                            </span>
                          )}
                        </motion.span>
                      );
                    })}
                  </div>
                  
                  {skills.technical?.length > 8 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                      <FiMoreHorizontal className="w-3 h-3" />
                      +{skills.technical.length - 8} more skills
                    </p>
                  )}
                </div>
              )}

              {/* Soft Skills */}
              {skills.soft?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Soft Skills" icon={FiHeart} />
                  <div className="flex flex-wrap gap-2">
                    {skills.soft.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + index * 0.02 }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {skills.languages?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Languages" icon={FiFlag} />
                  <div className="space-y-2">
                    {skills.languages.map((language, index) => {
                      const proficiency = skills.skillDetails?.[language]?.proficiency;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.03 }}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {language}
                          </span>
                          {proficiency && (
                            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {proficiency}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Certifications Summary */}
              {certifications.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Certifications" icon={FiAward} />
                  <div className="space-y-3">
                    {certifications.slice(0, 3).map((cert, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.03 }}
                      >
                        <div className="flex items-start gap-2">
                          <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {cert.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {cert.issuer}
                            </p>
                            {cert.date && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {formatDate(cert.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {certifications.length > 3 && (
                      <p className="text-xs text-gray-400 mt-2">
                        +{certifications.length - 3} more certifications
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column - Main Content */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="md:col-span-2 space-y-6"
            >
              {/* Professional Summary */}
              {hasContent('summary') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Professional Summary" icon={FiUser} />
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {personal.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {hasContent('experience') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                  <LightSectionTitle title="Work Experience" icon={FiBriefcase} />
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
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                          className="border-l-2 border-slate-400 dark:border-slate-600 pl-4 hover:border-slate-600 dark:hover:border-slate-400 transition-colors"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-gray-800 dark:text-gray-200">
                                {exp.title}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 font-medium">
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
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <FiClock className="w-3 h-3" />
                                  {duration}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {exp.employmentType && exp.employmentType !== 'full-time' && (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mb-2">
                              {exp.employmentType}
                            </span>
                          )}
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                            {exp.description?.split('\n').map((line, i) => (
                              line.trim() && (
                                <p key={i} className="flex items-start gap-2">
                                  <span className="text-slate-400 mt-1.5">•</span>
                                  <span>{line.trim().replace(/^[•\-]\s*/, '')}</span>
                                </p>
                              )
                            ))}
                          </div>
                          
                          {exp.technologies && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {exp.technologies.split(',').slice(0, 4).map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs"
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
                </div>
              )}

              {/* Projects & Education Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Key Projects */}
                {hasContent('projects') && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                    <LightSectionTitle title="Key Projects" icon={FiFolder} />
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="group"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">
                              {project.name}
                            </h4>
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <FiExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          
                          {project.technologies && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {project.technologies.split(',').slice(0, 3).map(t => t.trim()).join(' • ')}
                            </p>
                          )}
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {project.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    
                    {projects.length > 3 && (
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                        <FiArrowRight className="w-3 h-3" />
                        +{projects.length - 3} more projects
                      </p>
                    )}
                  </div>
                )}

                {/* Education */}
                {hasContent('education') && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
                    <LightSectionTitle title="Education" icon={FiBook} />
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {edu.degree}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {edu.institution}
                          </p>
                          {edu.field && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {edu.field}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-500">
                              {edu.startDate && formatDate(edu.startDate)} 
                              {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                            </p>
                            {edu.gpa && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                GPA: {edu.gpa}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              📋 Professional Resume • Available for opportunities
            </p>
          </motion.div>
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
          .line-clamp-2 {
            overflow: visible !important;
            display: block !important;
          }
          .bg-gradient-to-br {
            background: #f8fafc !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(Template5);