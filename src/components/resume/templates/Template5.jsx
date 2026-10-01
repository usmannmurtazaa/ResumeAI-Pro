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
  FiFlag,
  FiHeart,
  FiMoreHorizontal,
  FiArrowRight,
} from 'react-icons/fi';

// ── Print styles (scoped) ─────────────────────────────────────────────────
//
// These rules used to live in a `<style jsx>` block, which is a Next.js
// `styled-jsx` construct. CRA does not transform it, so the CSS leaked
// globally. Every selector below is now prefixed with `.resume-template-5`
// — the class carried by this component's root element — so the rules
// apply only within this template's subtree.
//
// The `body { … }` rule from the original block is collapsed onto
// `.resume-template-5` itself: in print, the surrounding app chrome is
// hidden by `globals.css`, so the template root is the effective print
// body for everything inside this component.
//
// IMPORTANT: this block is deliberately duplicated per template (with a
// unique scope class) rather than moved to a shared stylesheet, so that
// changing one template's print behavior cannot silently change another's.
// When copying to another template, replace every occurrence of
// `resume-template-5` with that template's scope class.
//
// Template5's print overrides are the most impactful of the five because
// they force `.text-white` to black. Scoping this rule to
// `.resume-template-5 .text-white` prevents it from turning every
// `.text-white` element in the app (buttons, dark-mode headers, badges)
// black during print.
//
// The escaped selectors (`.border-white\/20`, `.bg-white\/10`,
// `.print\:page-break-inside-avoid`) retain their backslash escapes —
// these are required for the `/` and `:` characters to be parsed as part
// of the class name rather than as selector syntax.
const PRINT_STYLES = `
  @media print {
    .resume-template-5.max-w-4xl {
      max-width: 100% !important;
    }
    .resume-template-5.shadow-2xl {
      box-shadow: none !important;
    }
    .resume-template-5 .line-clamp-2 {
      overflow: visible !important;
      display: block !important;
    }
    .resume-template-5 .bg-gradient-to-br {
      background: #f8fafc !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .resume-template-5 .text-white {
      color: #000 !important;
    }
    .resume-template-5 .text-gray-300 {
      color: #4b5563 !important;
    }
    .resume-template-5 .text-slate-500 {
      color: #4b5563 !important;
    }
    .resume-template-5 .text-slate-600 {
      color: #4b5563 !important;
    }
    .resume-template-5 .text-slate-700 {
      color: #1f2937 !important;
    }
    .resume-template-5 .border-white\\/20 {
      border-color: #d1d5db !important;
    }
    .resume-template-5 .bg-white\\/10 {
      background: #f3f4f6 !important;
    }
    .resume-template-5 section {
      page-break-inside: avoid;
    }
    .resume-template-5 h1,
    .resume-template-5 h2,
    .resume-template-5 h3,
    .resume-template-5 h4,
    .resume-template-5 h5,
    .resume-template-5 h6 {
      page-break-after: avoid;
    }
    .resume-template-5 .print\\:page-break-inside-avoid {
      page-break-inside: avoid;
    }
    .resume-template-5 {
      font-size: 10pt;
      line-height: 1.4;
    }
    .resume-template-5 .print\\:text-xs {
      font-size: 8pt !important;
    }
    .resume-template-5 .print\\:text-sm {
      font-size: 9pt !important;
    }
    .resume-template-5 .print\\:text-base {
      font-size: 10pt !important;
    }
    .resume-template-5 .print\\:text-2xl {
      font-size: 14pt !important;
    }
  }
`;

const Template5 = ({ data, className = '' }) => {
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

  // Get top skills for display
  const topTechnicalSkills = useMemo(() => {
    const technical = skills.technical || [];
    return technical.slice(0, 8);
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

  // Section title for dark header
  const DarkSectionTitle = ({ title, icon: Icon }) => (
    <h3 className="text-white font-semibold mb-4 flex items-center gap-2 border-b border-white/20 pb-2 print:text-black print:border-gray-300 print:mb-2">
      {Icon && <Icon className="w-4 h-4 print:w-3 print:h-3" />}
      {title}
    </h3>
  );

  // Section title for light cards
  const LightSectionTitle = ({ title, icon: Icon }) => (
    <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 print:text-gray-700 print:border-gray-300 print:mb-2">
      {Icon && <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400 print:w-3 print:h-3" />}
      {title}
    </h3>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`resume-template-5 max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-2xl print:shadow-none print:bg-white print:max-w-full ${className}`}
    >
      <div className="relative">
        {/* Dark Header Background */}
        <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-black print:h-auto print:bg-slate-800 print:static">
          <div className="absolute inset-0 opacity-10 print:hidden">
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative p-6 sm:p-8 print:p-4">
          {/* Profile Header Section */}
          <div className="mb-8 print:mb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                {personal.profileImage && (
                  <img
                    src={personal.profileImage}
                    alt={personal.fullName}
                    className="w-24 h-24 rounded-full mb-4 border-4 border-white/20 object-cover print:w-20 print:h-20 print:border-2 print:border-white"
                  />
                )}

                <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white print:text-black print:text-2xl">
                  {personal.fullName || 'Your Name'}
                </h1>

                <p className="text-xl text-gray-300 mb-3 print:text-gray-700 print:text-base">
                  {personal.title || 'Professional Title'}
                </p>

                {totalExperience && (
                  <div className="flex flex-wrap gap-2 print:gap-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-200 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:text-xs print:px-2 print:py-1">
                      <FiBriefcase className="w-3.5 h-3.5 print:w-3 print:h-3" />
                      {totalExperience} experience
                    </span>
                    {education.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-200 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:text-xs print:px-2 print:py-1">
                        <FiBook className="w-3.5 h-3.5 print:w-3 print:h-3" />
                        {education.length} {education.length === 1 ? 'degree' : 'degrees'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Quick Links */}
              <div className="flex gap-3 print:gap-2">
                {personal.email && (
                  <a
                    href={`mailto:${personal.email}`}
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:p-2"
                    title={personal.email}
                  >
                    <FiMail className="w-5 h-5 print:w-3 print:h-3" />
                  </a>
                )}
                {personal.phone && (
                  <a
                    href={`tel:${personal.phone}`}
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:p-2"
                    title={personal.phone}
                  >
                    <FiPhone className="w-5 h-5 print:w-3 print:h-3" />
                  </a>
                )}
                {personal.linkedin && (
                  <a
                    href={personal.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:p-2"
                    title="LinkedIn"
                  >
                    <FiLinkedin className="w-5 h-5 print:w-3 print:h-3" />
                  </a>
                )}
                {personal.github && (
                  <a
                    href={personal.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/20 print:bg-gray-200 print:text-gray-700 print:border-gray-300 print:p-2"
                    title="GitHub"
                  >
                    <FiGithub className="w-5 h-5 print:w-3 print:h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 print:gap-4">
            {/* Left Column - Contact & Skills */}
            <div className="md:col-span-1 space-y-6 print:space-y-4">
              {/* Contact Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 print:bg-gray-100 print:border-gray-300 print:p-3">
                <DarkSectionTitle title="Contact" icon={FiUser} />
                <div className="space-y-3 print:space-y-1.5">
                  {personal.email && (
                    <a
                      href={`mailto:${personal.email}`}
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group print:text-gray-700 print:hover:text-gray-700"
                    >
                      <FiMail className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform print:w-3 print:h-3" />
                      <span className="text-sm break-all print:text-xs">{personal.email}</span>
                    </a>
                  )}
                  {personal.phone && (
                    <a
                      href={`tel:${personal.phone}`}
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group print:text-gray-700 print:hover:text-gray-700"
                    >
                      <FiPhone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform print:w-3 print:h-3" />
                      <span className="text-sm print:text-xs">{personal.phone}</span>
                    </a>
                  )}
                  {personal.location && (
                    <div className="flex items-start gap-3 text-gray-300 print:text-gray-700">
                      <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                      <span className="text-sm print:text-xs">{personal.location}</span>
                    </div>
                  )}
                  {personal.website && (
                    <a
                      href={personal.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-gray-300 hover:text-white transition-colors group print:text-gray-700 print:hover:text-gray-700"
                    >
                      <FiGlobe className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform print:w-3 print:h-3" />
                      <span className="text-sm break-all print:text-xs">
                        {personal.website.replace(/^https?:\/\//, '')}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Technical Skills */}
              {topTechnicalSkills.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Technical Skills" icon={FiCode} />
                  <div className="flex flex-wrap gap-2 print:gap-1">
                    {topTechnicalSkills.map((skill, index) => {
                      const years = skills.skillDetails?.[skill]?.yearsOfExperience;

                      return (
                        <span
                          key={index}
                          className="group relative px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg text-sm shadow-md transition-all print:bg-gray-200 print:text-gray-700 print:shadow-none print:text-xs print:px-2 print:py-1"
                        >
                          {skill}
                          {years && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center print:hidden">
                              {years}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {skills.technical?.length > 8 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1 print:text-[10px]">
                      <FiMoreHorizontal className="w-3 h-3 print:w-2 print:h-2" />+
                      {skills.technical.length - 8} more skills
                    </p>
                  )}
                </div>
              )}

              {/* Soft Skills */}
              {skills.soft?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Soft Skills" icon={FiHeart} />
                  <div className="flex flex-wrap gap-2 print:gap-1">
                    {skills.soft.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px] print:px-2 print:py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {skills.languages?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Languages" icon={FiFlag} />
                  <div className="space-y-2 print:space-y-1">
                    {skills.languages.map((language, index) => {
                      const proficiency = skills.skillDetails?.[language]?.proficiency;
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                            {language}
                          </span>
                          {proficiency && (
                            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full print:bg-gray-200 print:text-gray-700 print:text-[10px]">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Certifications" icon={FiAward} />
                  <div className="space-y-3 print:space-y-1.5">
                    {certifications.slice(0, 3).map((cert, index) => (
                      <div key={index}>
                        <div className="flex items-start gap-2">
                          <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                          <div>
                            <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 print:text-xs">
                              {cert.name}
                            </h4>
                            <p className="text-xs text-gray-500 print:text-[10px]">{cert.issuer}</p>
                            {cert.date && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 print:text-[10px]">
                                <FiCalendar className="w-3 h-3 print:w-2 print:h-2" />
                                {formatDate(cert.date)}
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
                </div>
              )}
            </div>

            {/* Right Column - Main Content */}
            <div className="md:col-span-2 space-y-6 print:space-y-4">
              {/* Professional Summary */}
              {hasContent('summary') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Professional Summary" icon={FiUser} />
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm print:text-xs print:text-gray-700">
                    {personal.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {hasContent('experience') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                  <LightSectionTitle title="Work Experience" icon={FiBriefcase} />
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
                          className="border-l-2 border-slate-400 dark:border-slate-600 pl-4 hover:border-slate-600 dark:hover:border-slate-400 transition-colors print:border-gray-300"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                                {exp.title}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 font-medium print:text-slate-700 print:text-xs">
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
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 print:text-[10px]">
                                  <FiClock className="w-3 h-3 print:w-2 print:h-2" />
                                  {duration}
                                </p>
                              )}
                            </div>
                          </div>

                          {exp.employmentType && exp.employmentType !== 'full-time' && (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mb-2 print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                              {exp.employmentType}
                            </span>
                          )}

                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 print:text-xs">
                            {exp.description?.split('\n').map(
                              (line, i) =>
                                line.trim() && (
                                  <p key={i} className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-1.5 print:text-gray-500">
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
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px]"
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
                </div>
              )}

              {/* Projects & Education Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:gap-4">
                {/* Key Projects */}
                {hasContent('projects') && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                    <LightSectionTitle title="Key Projects" icon={FiFolder} />
                    <div className="space-y-4 print:space-y-2">
                      {projects.slice(0, 3).map((project, index) => (
                        <div key={index} className="group">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 print:text-sm">
                              {project.name}
                            </h4>
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 print:opacity-100 print:text-slate-700"
                              >
                                <FiExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {project.technologies && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 print:text-[10px]">
                              {project.technologies
                                .split(',')
                                .slice(0, 3)
                                .map((t) => t.trim())
                                .join(' • ')}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 print:text-xs print:text-gray-700">
                            {project.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    {projects.length > 3 && (
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 print:text-[10px]">
                        <FiArrowRight className="w-3 h-3 print:w-2 print:h-2" />+
                        {projects.length - 3} more projects
                      </p>
                    )}
                  </div>
                )}

                {/* Education */}
                {hasContent('education') && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg print:bg-white print:border print:border-gray-300 print:p-3 print:shadow-none">
                    <LightSectionTitle title="Education" icon={FiBook} />
                    <div className="space-y-4 print:space-y-2">
                      {education.map((edu, index) => (
                        <div
                          key={index}
                          className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 print:pb-2 print:border-gray-200"
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 print:text-sm">
                            {edu.degree}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-400 text-sm print:text-slate-700 print:text-xs">
                            {edu.institution}
                          </p>
                          {edu.field && (
                            <p className="text-gray-500 text-xs mt-0.5 print:text-[10px]">
                              {edu.field}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-500 print:text-xs">
                              {edu.startDate && formatDate(edu.startDate)}
                              {edu.endDate &&
                                ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                            </p>
                            {edu.gpa && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-[10px]">
                                GPA: {edu.gpa}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center print:mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 print:text-[10px] print:text-gray-500">
              Professional Resume • Available for opportunities
            </p>
          </div>
        </div>
      </div>

      {/* Scoped print stylesheet. Rendered as a plain <style> element with
          the CSS string injected via dangerouslySetInnerHTML. All selectors
          are scoped to `.resume-template-5` so the rules cannot leak
          outside this component. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
    </motion.div>
  );
};

export default React.memo(Template5);
