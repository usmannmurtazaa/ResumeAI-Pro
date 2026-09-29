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
  FiClock,
  FiUser,
  FiTarget,
  FiFlag,
} from 'react-icons/fi';

// ── Print styles (scoped) ─────────────────────────────────────────────────
//
// These rules used to live in a `<style jsx>` block, which is a Next.js
// `styled-jsx` construct. CRA does not transform it, so the CSS leaked
// globally. Every selector below is now prefixed with `.resume-template-2`
// — the class carried by this component's root element — so the rules
// apply only within this template's subtree.
//
// The `body { … }` rule from the original block is collapsed onto
// `.resume-template-2` itself: in print, the surrounding app chrome is
// hidden by `globals.css`, so the template root is the effective print
// body for everything inside this component.
//
// IMPORTANT: this block is deliberately duplicated per template (with a
// unique scope class) rather than moved to a shared stylesheet, so that
// changing one template's print behavior cannot silently change another's.
// When copying to another template, replace every occurrence of
// `resume-template-2` with that template's scope class.
//
// Template2's print block covers a smaller set of `print:text-*` size
// overrides than Template1's (xs/sm/base only, not lg/xl/2xl). That
// difference is intentional and preserved.
const PRINT_STYLES = `
  @media print {
    .resume-template-2.max-w-4xl {
      max-width: 100% !important;
    }
    .resume-template-2.shadow-2xl {
      box-shadow: none !important;
    }
    .resume-template-2 .bg-gradient-to-b {
      background: #f9fafb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .resume-template-2 .text-primary-500 {
      color: #2563eb !important;
    }
    .resume-template-2 .border-primary-500 {
      border-color: #2563eb !important;
    }
    .resume-template-2 section {
      page-break-inside: avoid;
    }
    .resume-template-2 h1,
    .resume-template-2 h2,
    .resume-template-2 h3,
    .resume-template-2 h4,
    .resume-template-2 h5,
    .resume-template-2 h6 {
      page-break-after: avoid;
    }
    .resume-template-2 .print\\:page-break-inside-avoid {
      page-break-inside: avoid;
    }
    .resume-template-2 {
      font-size: 10pt;
      line-height: 1.4;
    }
    .resume-template-2 .print\\:text-xs {
      font-size: 8pt !important;
    }
    .resume-template-2 .print\\:text-sm {
      font-size: 9pt !important;
    }
    .resume-template-2 .print\\:text-base {
      font-size: 10pt !important;
    }
  }
`;

const Template2 = ({ data, className = '' }) => {
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

  const getProficiencyWidth = (level) => {
    const widths = {
      beginner: '25%',
      intermediate: '50%',
      advanced: '75%',
      expert: '100%',
    };
    return widths[level] || '50%';
  };

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

  // Section title component for sidebar
  const SidebarTitle = ({ title, icon: Icon }) => (
    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2 print:text-[8px] print:mb-2">
      {Icon && <Icon className="w-4 h-4 print:w-3 print:h-3" />}
      {title}
    </h3>
  );

  // Section title component for main content
  const MainTitle = ({ title, icon: Icon }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b-2 border-primary-500 pb-2 print:text-xs print:mb-2 print:border-primary-500">
      {Icon && <Icon className="w-4 h-4 text-primary-500 print:w-3 print:h-3" />}
      {title}
    </h3>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`resume-template-2 max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl print:shadow-none print:max-w-full ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 print:grid-cols-3">
        {/* Sidebar - Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 sm:p-7 print:bg-gray-50 print:p-4"
        >
          {/* Profile Section */}
          <div className="mb-8 text-center md:text-left print:mb-4">
            {personal.profileImage && (
              <img
                src={personal.profileImage}
                alt={personal.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto md:mx-0 mb-4 border-4 border-white dark:border-gray-700 shadow-lg object-cover print:w-20 print:h-20 print:border-2 print:shadow-none"
              />
            )}

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1 print:text-lg">
              {personal.fullName || 'Your Name'}
            </h2>

            <p className="text-primary-600 dark:text-primary-400 font-medium mb-3 print:text-sm">
              {personal.title || 'Professional Title'}
            </p>

            {totalExperience && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                <FiBriefcase className="w-3.5 h-3.5 print:w-3 print:h-3" />
                {totalExperience} experience
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="mb-8 print:mb-4">
            <SidebarTitle title="Contact" icon={FiUser} />
            <div className="space-y-3 text-sm print:space-y-1.5 print:text-xs">
              {personal.email && (
                <a
                  href={`mailto:${personal.email}`}
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group print:text-gray-700 print:hover:text-gray-700"
                >
                  <FiMail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500 print:w-3 print:h-3" />
                  <span className="break-all">{personal.email}</span>
                </a>
              )}
              {personal.phone && (
                <a
                  href={`tel:${personal.phone}`}
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group print:text-gray-700 print:hover:text-gray-700"
                >
                  <FiPhone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500 print:w-3 print:h-3" />
                  <span>{personal.phone}</span>
                </a>
              )}
              {personal.location && (
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400 print:text-gray-700">
                  <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 print:w-3 print:h-3" />
                  <span>{personal.location}</span>
                </div>
              )}
              {personal.website && (
                <a
                  href={personal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group print:text-gray-700 print:hover:text-gray-700"
                >
                  <FiGlobe className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500 print:w-3 print:h-3" />
                  <span className="break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {personal.linkedin && (
                <a
                  href={personal.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group print:text-gray-700 print:hover:text-gray-700"
                >
                  <FiLinkedin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500 print:w-3 print:h-3" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {personal.github && (
                <a
                  href={personal.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group print:text-gray-700 print:hover:text-gray-700"
                >
                  <FiGithub className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-primary-500 print:w-3 print:h-3" />
                  <span>GitHub Profile</span>
                </a>
              )}
            </div>
          </div>

          {/* Technical Skills */}
          {skills.technical?.length > 0 && (
            <div className="mb-8 print:mb-4">
              <SidebarTitle title="Technical Skills" icon={FiCode} />
              <div className="space-y-3 print:space-y-1.5">
                {skills.technical.map((skill, index) => {
                  const proficiency = getSkillProficiency(skill);
                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                          {skill}
                        </span>
                        {skills.skillDetails?.[skill]?.yearsOfExperience && (
                          <span className="text-xs text-gray-400 print:text-[10px]">
                            {skills.skillDetails[skill].yearsOfExperience} yr
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden print:h-1">
                        <div
                          className="h-full bg-primary-500 rounded-full print:bg-gray-600"
                          style={{ width: getProficiencyWidth(proficiency) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {skills.soft?.length > 0 && (
            <div className="mb-8 print:mb-4">
              <SidebarTitle title="Soft Skills" icon={FiTarget} />
              <div className="flex flex-wrap gap-2 print:gap-1">
                {skills.soft.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs shadow-sm print:bg-gray-200 print:text-gray-700 print:text-[10px] print:shadow-none"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {skills.languages?.length > 0 && (
            <div className="mb-8 print:mb-4">
              <SidebarTitle title="Languages" icon={FiFlag} />
              <div className="space-y-2 print:space-y-1">
                {skills.languages.map((language, index) => {
                  const proficiency = skills.skillDetails?.[language]?.proficiency;
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                        {language}
                      </span>
                      {proficiency && (
                        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                          {proficiency}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certifications Summary */}
          {certifications.length > 0 && (
            <div className="print:mb-4">
              <SidebarTitle title="Certifications" icon={FiAward} />
              <div className="space-y-2 print:space-y-1">
                {certifications.slice(0, 3).map((cert, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 print:text-xs">
                        {cert.name}
                      </p>
                      <p className="text-xs text-gray-500 print:text-[10px]">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
                {certifications.length > 3 && (
                  <p className="text-xs text-gray-400 mt-1 print:text-[10px]">
                    +{certifications.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content - Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 p-6 sm:p-7 print:p-4"
        >
          {/* Professional Summary */}
          {hasContent('summary') && (
            <section className="mb-8 print:mb-4 print:page-break-inside-avoid">
              <MainTitle title="Professional Profile" />
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed print:text-xs print:text-gray-700">
                {personal.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {hasContent('experience') && (
            <section className="mb-8 print:mb-4 print:page-break-inside-avoid">
              <MainTitle title="Work Experience" icon={FiBriefcase} />
              <div className="space-y-6 print:space-y-3">
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
                    <div key={index} className="relative">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                            {exp.title}
                          </h4>
                          <p className="text-primary-600 dark:text-primary-400 font-medium print:text-primary-700 print:text-xs">
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

                      <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1.5 print:text-xs">
                        {exp.description?.split('\n').map(
                          (line, i) =>
                            line.trim() && (
                              <p key={i} className="flex items-start gap-2">
                                <span className="text-primary-400 mt-1.5 print:text-gray-500">
                                  •
                                </span>
                                <span>{line.trim().replace(/^[•-]\s*/, '')}</span>
                              </p>
                            )
                        )}
                      </div>

                      {exp.technologies && (
                        <div className="flex flex-wrap gap-1.5 mt-3 print:mt-1">
                          {exp.technologies.split(',').map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px]"
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

          {/* Projects */}
          {hasContent('projects') && (
            <section className="mb-8 print:mb-4 print:page-break-inside-avoid">
              <MainTitle title="Key Projects" icon={FiFolder} />
              <div className="space-y-4 print:space-y-2">
                {projects.slice(0, 3).map((project, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
                        {project.name}
                      </h4>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600 print:text-primary-700"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 print:text-xs">
                      {project.description}
                    </p>
                    {project.technologies && (
                      <div className="flex flex-wrap gap-1 print:gap-0.5">
                        {project.technologies
                          .split(',')
                          .slice(0, 4)
                          .map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs print:bg-gray-100 print:text-gray-700 print:text-[10px]"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {hasContent('education') && (
            <section className="print:page-break-inside-avoid">
              <MainTitle title="Education" icon={FiBook} />
              <div className="space-y-4 print:space-y-2">
                {education.map((edu, index) => (
                  <div
                    key={index}
                    className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 print:pb-2 print:border-gray-200"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
                          {edu.degree}
                        </h4>
                        <p className="text-primary-600 dark:text-primary-400 text-sm print:text-primary-700 print:text-xs">
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
        </motion.div>
      </div>

      {/* Scoped print stylesheet. Rendered as a plain <style> element with
          the CSS string injected via dangerouslySetInnerHTML. All selectors
          are scoped to `.resume-template-2` so the rules cannot leak
          outside this component. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
    </motion.div>
  );
};

export default React.memo(Template2);