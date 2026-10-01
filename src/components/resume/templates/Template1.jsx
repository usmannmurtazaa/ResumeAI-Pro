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
} from 'react-icons/fi';

// ── Print styles (scoped) ─────────────────────────────────────────────────
//
// These rules used to live in a `<style jsx>` block, which is a Next.js
// `styled-jsx` construct. CRA does not transform it, so the CSS leaked
// globally. Every selector below is now prefixed with `.resume-template-1`
// — the class carried by this component's root element — so the rules
// apply only within this template's subtree.
//
// The `body { … }` rule from the original block is collapsed onto
// `.resume-template-1` itself: in print, the surrounding app chrome is
// hidden by `globals.css`, so the template root is the effective print
// body for everything inside this component.
//
// IMPORTANT: this block is deliberately duplicated per template (with a
// unique scope class) rather than moved to a shared stylesheet, so that
// changing one template's print behavior cannot silently change another's.
// When copying to another template, replace every occurrence of
// `resume-template-1` with that template's scope class.
const PRINT_STYLES = `
  @media print {
    .resume-template-1.max-w-4xl {
      max-width: 100% !important;
    }
    .resume-template-1.shadow-2xl {
      box-shadow: none !important;
    }
    .resume-template-1 .bg-gradient-to-br {
      background: #2563eb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .resume-template-1 .text-primary-500 {
      color: #2563eb !important;
    }
    .resume-template-1 .border-primary-500 {
      border-color: #2563eb !important;
    }
    .resume-template-1 section {
      page-break-inside: avoid;
    }
    .resume-template-1 h1,
    .resume-template-1 h2,
    .resume-template-1 h3,
    .resume-template-1 h4,
    .resume-template-1 h5,
    .resume-template-1 h6 {
      page-break-after: avoid;
    }
    .resume-template-1 .print\\:page-break-inside-avoid {
      page-break-inside: avoid;
    }
    .resume-template-1 {
      font-size: 10pt;
      line-height: 1.4;
    }
    .resume-template-1 .print\\:text-xs {
      font-size: 8pt !important;
    }
    .resume-template-1 .print\\:text-sm {
      font-size: 9pt !important;
    }
    .resume-template-1 .print\\:text-base {
      font-size: 10pt !important;
    }
    .resume-template-1 .print\\:text-lg {
      font-size: 11pt !important;
    }
    .resume-template-1 .print\\:text-xl {
      font-size: 12pt !important;
    }
    .resume-template-1 .print\\:text-2xl {
      font-size: 14pt !important;
    }
  }
`;

const Template1 = ({ data, className = '' }) => {
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
    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b-2 border-primary-500 flex items-center gap-2 print:border-primary-500">
      {Icon && <Icon className="w-5 h-5 text-primary-500 print:w-4 print:h-4" />}
      {title}
    </h2>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`resume-template-1 max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full ${className}`}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-6 sm:p-8 text-white print:bg-primary-700 print:p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 print:flex-row print:items-start print:justify-between">
          <div className="flex-1 print:flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 tracking-tight print:text-2xl print:mb-1">
              {personal.fullName || 'Your Name'}
            </h1>

            <p className="text-lg sm:text-xl opacity-95 mb-4 font-light print:text-base print:mb-2">
              {personal.title || 'Professional Title'}
            </p>

            {/* Contact Information */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm print:text-xs">
              {personal.email && (
                <a
                  href={`mailto:${personal.email}`}
                  className="flex items-center gap-2 hover:text-white/80 transition-colors print:hover:text-white"
                >
                  <FiMail className="w-4 h-4 print:w-3 print:h-3" />
                  <span className="break-all">{personal.email}</span>
                </a>
              )}
              {personal.phone && (
                <a
                  href={`tel:${personal.phone}`}
                  className="flex items-center gap-2 hover:text-white/80 transition-colors print:hover:text-white"
                >
                  <FiPhone className="w-4 h-4 print:w-3 print:h-3" />
                  <span>{personal.phone}</span>
                </a>
              )}
              {personal.location && (
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 print:w-3 print:h-3" />
                  <span>{personal.location}</span>
                </div>
              )}
              {personal.website && (
                <a
                  href={personal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors print:hover:text-white"
                >
                  <FiGlobe className="w-4 h-4 print:w-3 print:h-3" />
                  <span className="break-all">{personal.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {personal.linkedin && (
                <a
                  href={personal.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors print:hover:text-white"
                >
                  <FiLinkedin className="w-4 h-4 print:w-3 print:h-3" />
                  <span>LinkedIn</span>
                </a>
              )}
              {personal.github && (
                <a
                  href={personal.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white/80 transition-colors print:hover:text-white"
                >
                  <FiGithub className="w-4 h-4 print:w-3 print:h-3" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>

          {/* Profile Image (if available) */}
          {personal.profileImage && (
            <img
              src={personal.profileImage}
              alt={personal.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 object-cover print:w-20 print:h-20 print:border-2"
            />
          )}
        </div>

        {/* Quick Stats */}
        {totalExperience && (
          <div className="mt-4 flex flex-wrap gap-3 print:mt-2 print:gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium print:bg-transparent print:border print:border-white/20 print:text-xs print:px-2 print:py-1">
              <FiBriefcase className="w-3.5 h-3.5 print:w-3 print:h-3" />
              {totalExperience} experience
            </span>
            {education.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium print:bg-transparent print:border print:border-white/20 print:text-xs print:px-2 print:py-1">
                <FiBook className="w-3.5 h-3.5 print:w-3 print:h-3" />
                {education.length} {education.length === 1 ? 'degree' : 'degrees'}
              </span>
            )}
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium print:bg-transparent print:border print:border-white/20 print:text-xs print:px-2 print:py-1">
                <FiFolder className="w-3.5 h-3.5 print:w-3 print:h-3" />
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-8 print:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 print:space-y-4">
            {/* Professional Summary */}
            {hasContent('summary') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Professional Summary" />
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm print:text-black print:text-xs">
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
                        className="relative pl-4 border-l-2 border-primary-200 dark:border-primary-800 print:border-l print:border-gray-300"
                      >
                        <div className="absolute -left-1.5 top-2 w-3 h-3 bg-primary-500 rounded-full print:w-2 print:h-2 print:bg-gray-600" />
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                              {exp.title}
                            </h3>
                            <p className="text-primary-600 dark:text-primary-400 font-medium print:text-primary-700 print:text-xs">
                              {exp.company}
                              {exp.location && ` • ${exp.location}`}
                            </p>
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

                        {/* Employment Type Badge */}
                        {exp.employmentType && exp.employmentType !== 'full-time' && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 mb-2 print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                            {exp.employmentType}
                          </span>
                        )}

                        {/* Description with bullet points */}
                        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-2 print:text-xs">
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

                        {/* Technologies Used */}
                        {exp.technologies && (
                          <div className="flex flex-wrap gap-1 mt-2 print:mt-1">
                            {exp.technologies
                              .split(',')
                              .slice(0, 5)
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

            {/* Projects */}
            {hasContent('projects') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Projects" icon={FiFolder} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2">
                  {projects.map((project, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all print:p-2 print:border-gray-300"
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
                            .slice(0, 3)
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6 print:space-y-4">
            {/* Skills Section */}
            {hasContent('skills') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Skills" icon={FiCode} />

                {/* Technical Skills */}
                {skills.technical?.length > 0 && (
                  <div className="mb-4 print:mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 print:text-xs">
                      Technical
                    </h4>
                    <div className="flex flex-wrap gap-1.5 print:gap-1">
                      {skills.technical.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm print:bg-gray-200 print:text-gray-700 print:text-xs print:px-2 print:py-1"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soft Skills */}
                {skills.soft?.length > 0 && (
                  <div className="mb-4 print:mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 print:text-xs">
                      Soft Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5 print:gap-1">
                      {skills.soft.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm print:bg-gray-200 print:text-gray-700 print:text-xs print:px-2 print:py-1"
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
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 print:text-xs">
                      Languages
                    </h4>
                    <div className="space-y-1.5 print:space-y-1">
                      {skills.languages.map((language, index) => {
                        const proficiency = skills.skillDetails?.[language]?.proficiency;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                              {language}
                            </span>
                            {proficiency && (
                              <span className="text-xs text-gray-500 print:text-[10px]">
                                {proficiency}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
                        {edu.degree}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400 text-sm print:text-xs print:text-primary-700">
                        {edu.institution}
                      </p>
                      {edu.field && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 print:text-[10px]">
                          {edu.field}
                        </p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 print:text-[10px]">
                        {edu.startDate && formatDate(edu.startDate)}
                        {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                      </p>
                      {edu.gpa && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs print:text-[10px]">
                          GPA: {edu.gpa}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {hasContent('certifications') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Certifications" icon={FiAward} />
                <div className="space-y-3 print:space-y-1.5">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-2 print:gap-1">
                      <FiCheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm print:text-xs">
                          {cert.name}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs print:text-[10px]">
                          {cert.issuer}
                          {cert.date && ` • ${formatDate(cert.date)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Scoped print stylesheet. Rendered as a plain <style> element with
          the CSS string injected via dangerouslySetInnerHTML. All selectors
          are scoped to `.resume-template-1` so the rules cannot leak
          outside this component. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
    </motion.div>
  );
};

export default React.memo(Template1);
