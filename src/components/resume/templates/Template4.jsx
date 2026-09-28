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
  FiFlag,
  FiHeart,
  FiMoreHorizontal,
  FiFileText,
} from 'react-icons/fi';

const Template4 = ({ data, className = '' }) => {
  const {
    personal = {},
    education = [],
    experience = [],
    skills = {},
    projects = [],
    certifications = [],
  } = data;

  // Calculate total years of experience
  const totalExperience = useMemo(() => {
    if (!experience.length) return null;

    let totalMonths = 0;
    experience.forEach((exp) => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date();
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
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

  // Get skill proficiency
  const getSkillProficiency = (skill) => {
    const details = skills.skillDetails?.[skill];
    return details?.proficiency || 'intermediate';
  };

  const getProficiencyLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
    };
    return labels[level] || 'Intermediate';
  };

  // Get top skills for display
  const topTechnicalSkills = useMemo(() => {
    const technical = skills.technical || [];
    return technical.slice(0, 6);
  }, [skills]);

  // Check if section has content
  const hasContent = (section) => {
    switch (section) {
      case 'summary':
        return !!personal.summary;
      case 'experience':
        return experience.length > 0;
      case 'education':
        return education.length > 0;
      case 'skills':
        return skills.technical?.length > 0 || skills.soft?.length > 0;
      case 'projects':
        return projects.length > 0;
      case 'certifications':
        return certifications.length > 0;
      case 'languages':
        return skills.languages?.length > 0;
      default:
        return false;
    }
  };

  // Section title component
  const SectionTitle = ({ title, icon: Icon }) => (
    <h2 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 print:text-[8px] print:mb-2 print:border-gray-300">
      {Icon && <Icon className="w-3.5 h-3.5 print:w-3 print:h-3" />}
      {title}
    </h2>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl print:shadow-none print:max-w-full ${className}`}
    >
      {/* Header with gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 print:h-1 print:bg-gray-300"></div>

      <div className="p-6 sm:p-8 print:p-4">
        {/* Name and Title */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6 print:mb-4"
        >
          {personal.profileImage && (
            <img
              src={personal.profileImage}
              alt={personal.fullName}
              className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-gray-200 dark:border-gray-700 object-cover print:w-16 print:h-16 print:border-1"
            />
          )}

          <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-1 text-gray-900 dark:text-gray-100 print:text-2xl">
            {personal.fullName || 'Your Name'}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider font-light print:text-sm print:text-gray-700">
            {personal.title || 'Professional Title'}
          </p>

          {totalExperience && (
            <div className="mt-3 print:mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400 print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                <FiBriefcase className="w-3.5 h-3.5 print:w-3 print:h-3" />
                {totalExperience} experience
              </span>
            </div>
          )}
        </motion.header>

        {/* Contact Bar */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 py-4 border-t border-b border-gray-200 dark:border-gray-700 mb-6 print:gap-x-3 print:py-2 print:mb-4 print:border-gray-300">
          {personal.email && (
            <a
              href={`mailto:${personal.email}`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group print:text-gray-700 print:hover:text-gray-700 print:text-xs"
            >
              <FiMail className="text-gray-400 group-hover:text-blue-500 transition-colors print:w-3 print:h-3" />
              <span className="break-all">{personal.email}</span>
            </a>
          )}
          {personal.phone && (
            <a
              href={`tel:${personal.phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group print:text-gray-700 print:hover:text-gray-700 print:text-xs"
            >
              <FiPhone className="text-gray-400 group-hover:text-blue-500 transition-colors print:w-3 print:h-3" />
              <span>{personal.phone}</span>
            </a>
          )}
          {personal.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 print:text-xs">
              <FiMapPin className="text-gray-400 print:w-3 print:h-3" />
              <span>{personal.location}</span>
            </div>
          )}
          {personal.website && (
            <a
              href={personal.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group print:text-gray-700 print:hover:text-gray-700 print:text-xs"
            >
              <FiGlobe className="text-gray-400 group-hover:text-blue-500 transition-colors print:w-3 print:h-3" />
              <span className="break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {personal.linkedin && (
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors print:text-blue-700 print:hover:text-blue-700 print:text-xs"
            >
              <FiLinkedin className="w-4 h-4 print:w-3 print:h-3" />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
          )}
          {personal.github && (
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors print:text-gray-700 print:hover:text-gray-700 print:text-xs"
            >
              <FiGithub className="w-4 h-4 print:w-3 print:h-3" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          )}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 print:gap-4">
          {/* Left Column - Sidebar */}
          <div className="md:col-span-1 space-y-6 print:space-y-4">
            {/* Technical Skills */}
            {topTechnicalSkills.length > 0 && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Technical Skills" icon={FiCode} />
                <div className="space-y-3 print:space-y-1.5">
                  {topTechnicalSkills.map((skill, index) => {
                    const proficiency = getSkillProficiency(skill);
                    const years = skills.skillDetails?.[skill]?.yearsOfExperience;

                    return (
                      <div key={index} className="group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 print:text-xs">
                            {skill}
                          </span>
                          <div className="flex items-center gap-2">
                            {years && (
                              <span className="text-xs text-gray-400 print:text-[10px]">
                                {years} yr
                              </span>
                            )}
                            <span className="text-xs text-gray-400 print:text-[10px]">
                              {getProficiencyLabel(proficiency)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden print:h-1">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full print:bg-gray-600"
                            style={{
                              width: `${proficiency === 'expert' ? 100 : proficiency === 'advanced' ? 75 : proficiency === 'intermediate' ? 50 : 25}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {skills.technical?.length > 6 && (
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1 print:text-[10px]">
                    <FiMoreHorizontal className="w-3 h-3 print:w-2 print:h-2" />+
                    {skills.technical.length - 6} more skills
                  </p>
                )}
              </section>
            )}

            {/* Soft Skills */}
            {skills.soft?.length > 0 && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Soft Skills" icon={FiHeart} />
                <div className="flex flex-wrap gap-2 print:gap-1">
                  {skills.soft.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors print:bg-gray-200 print:text-gray-700 print:text-[10px] print:px-2 print:py-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {skills.languages?.length > 0 && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Languages" icon={FiFlag} />
                <div className="space-y-2 print:space-y-1">
                  {skills.languages.map((language, index) => {
                    const proficiency = skills.skillDetails?.[language]?.proficiency;
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                          {language}
                        </span>
                        {proficiency && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                            {proficiency}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Certifications Summary */}
            {certifications.length > 0 && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Certifications" icon={FiAward} />
                <div className="space-y-3 print:space-y-1.5">
                  {certifications.slice(0, 3).map((cert, index) => (
                    <div key={index} className="group">
                      <div className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                        <div>
                          <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 print:text-xs">
                            {cert.name}
                          </h3>
                          <p className="text-xs text-gray-500 print:text-[10px]">{cert.issuer}</p>
                          {cert.date && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 print:text-[10px]">
                              <FiCalendar className="w-3 h-3 print:w-2 print:h-2" />
                              {formatDate(cert.date)}
                              {cert.expiryDate && !cert.neverExpires && (
                                <span className="text-gray-400 print:text-gray-500">
                                  {' '}
                                  - {formatDate(cert.expiryDate)}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {certifications.length > 3 && (
                    <p className="text-xs text-gray-400 mt-2 print:text-[10px]">
                      +{certifications.length - 3} more certifications
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="md:col-span-2 space-y-6 print:space-y-4">
            {/* Professional Summary */}
            {hasContent('summary') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Professional Summary" icon={FiUser} />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed print:text-xs print:text-gray-700">
                  {personal.summary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            {hasContent('experience') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Work Experience" icon={FiBriefcase} />
                <div className="space-y-5 print:space-y-3">
                  {experience.map((exp, index) => {
                    const duration = (() => {
                      if (!exp.startDate) return null;
                      const start = new Date(exp.startDate);
                      const end = exp.current
                        ? new Date()
                        : exp.endDate
                          ? new Date(exp.endDate)
                          : new Date();
                      const months =
                        (end.getFullYear() - start.getFullYear()) * 12 +
                        (end.getMonth() - start.getMonth());
                      const years = Math.floor(months / 12);
                      const remainingMonths = months % 12;

                      if (years === 0) return `${remainingMonths} mos`;
                      if (remainingMonths === 0) return `${years} yr${years > 1 ? 's' : ''}`;
                      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mos`;
                    })();

                    return (
                      <div
                        key={index}
                        className="relative pl-5 border-l-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors print:border-gray-300"
                      >
                        <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 print:w-2 print:h-2 print:bg-gray-600"></div>

                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                              {exp.title}
                            </h3>
                            <p className="text-blue-600 dark:text-blue-400 font-medium print:text-blue-700 print:text-xs">
                              {exp.company}
                            </p>
                            {exp.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 print:text-[10px]">
                                <FiMapPin className="w-3 h-3 print:w-2 print:h-2" />
                                {exp.location}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 print:text-xs">
                              <FiCalendar className="w-3.5 h-3.5 print:w-3 print:h-3" />
                              {formatDate(exp.startDate)} -{' '}
                              {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </p>
                            {duration && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 print:text-[10px]">
                                <FiClock className="w-3 h-3 print:w-2 print:h-2" />
                                {duration}
                              </p>
                            )}
                          </div>
                        </div>

                        {exp.employmentType && exp.employmentType !== 'full-time' && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 mb-2 print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                            {exp.employmentType}
                          </span>
                        )}

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 print:text-xs">
                          {exp.description?.split('\n').map(
                            (line, i) =>
                              line.trim() && (
                                <p key={i} className="flex items-start gap-2">
                                  <span className="text-blue-400 mt-1.5 print:text-gray-500">
                                    •
                                  </span>
                                  <span>{line.trim().replace(/^[•-]\s*/, '')}</span>
                                </p>
                              )
                          )}
                        </div>

                        {exp.technologies && (
                          <div className="flex flex-wrap gap-1.5 mt-3 print:mt-1">
                            {exp.technologies
                              .split(',')
                              .slice(0, 4)
                              .map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px]"
                                >
                                  {tech.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Key Projects */}
            {hasContent('projects') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Key Projects" icon={FiFolder} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2">
                  {projects.slice(0, 4).map((project, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow group print:bg-gray-100 print:p-2 print:shadow-none"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
                          {project.name}
                        </h3>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 print:opacity-100 print:text-blue-700"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {project.technologies && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 print:text-blue-700 print:text-[10px]">
                          {project.technologies
                            .split(',')
                            .slice(0, 3)
                            .map((t) => t.trim())
                            .join(' • ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 print:text-xs print:text-gray-700">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {hasContent('education') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Education" icon={FiBook} />
                <div className="space-y-4 print:space-y-2">
                  {education.map((edu, index) => (
                    <div
                      key={index}
                      className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 print:pb-2 print:border-gray-200"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                            {edu.degree}
                          </h3>
                          <p className="text-blue-600 dark:text-blue-400 print:text-blue-700 print:text-xs">
                            {edu.institution}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 print:text-xs">
                          {edu.startDate && formatDate(edu.startDate)}
                          {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                        </p>
                      </div>
                      {edu.field && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 print:text-[10px]">
                          Field of Study: {edu.field}
                        </p>
                      )}
                      {edu.gpa && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 print:text-[10px]">
                          GPA: {edu.gpa}
                        </p>
                      )}
                      {edu.achievements && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 print:text-[10px]">
                          {edu.achievements}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center print:mt-4 print:pt-2 print:border-gray-300">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2 print:text-[10px] print:text-gray-500">
            <FiFileText className="w-3.5 h-3.5 print:w-3 print:h-3" aria-hidden="true" />
            Professional Resume
            <span>•</span>
            <FiStar className="w-3.5 h-3.5 print:w-3 print:h-3" aria-hidden="true" />
            Available for opportunities
          </p>
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
          .line-clamp-3 {
            overflow: visible !important;
            display: block !important;
          }
          .text-blue-500 {
            color: #1d4ed8 !important;
          }
          .text-blue-600 {
            color: #1d4ed8 !important;
          }
          .text-blue-700 {
            color: #1d4ed8 !important;
          }
          .border-gray-200 {
            border-color: #d1d5db !important;
          }
          section {
            page-break-inside: avoid;
          }
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            page-break-after: avoid;
          }
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
          }
          body {
            font-size: 10pt;
            line-height: 1.4;
          }
          .print\\:text-xs {
            font-size: 8pt !important;
          }
          .print\\:text-sm {
            font-size: 9pt !important;
          }
          .print\\:text-base {
            font-size: 10pt !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(Template4);
