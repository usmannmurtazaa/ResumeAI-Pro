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
  FiFolder,
  FiCheckCircle,
  FiStar,
  FiClock,
  FiUser,
  FiFlag,
  FiZap,
  FiHeart,
  FiSmile,
} from 'react-icons/fi';

const Template3 = ({ data, className = '' }) => {
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

  // Get top skills for highlight section
  const topSkills = useMemo(() => {
    const technical = skills.technical || [];
    const withProficiency = technical.map((skill) => ({
      name: skill,
      proficiency: skills.skillDetails?.[skill]?.proficiency || 'intermediate',
      years: skills.skillDetails?.[skill]?.yearsOfExperience,
    }));

    return withProficiency
      .sort((a, b) => {
        const levels = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };
        return (levels[b.proficiency] || 0) - (levels[a.proficiency] || 0);
      })
      .slice(0, 6);
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

  // Section title component with gradient
  const SectionTitle = ({ title, icon: Icon }) => (
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 print:text-lg print:mb-2">
      {Icon && <Icon className="w-6 h-6 text-purple-500 print:w-4 print:h-4" />}
      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent print:bg-none print:text-purple-700">
        {title}
      </span>
    </h2>
  );

  // Skill card component
  const SkillCard = ({ skill, proficiency, years }) => {
    const getProficiencyStars = (level) => {
      const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      const count = levels[level] || 2;
      return (
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <FiStar
              key={i}
              className={`w-3.5 h-3.5 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'} print:w-2.5 print:h-2.5`}
            />
          ))}
        </div>
      );
    };

    return (
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200 dark:border-purple-800/30 hover:shadow-lg transition-all print:bg-white print:border-gray-300 print:shadow-none print:p-2">
        <div className="flex items-start justify-between mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
            {skill}
          </span>
          {years && (
            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full print:bg-gray-200 print:text-gray-700 print:text-[10px]">
              {years} {years === '1' ? 'yr' : 'yrs'}
            </span>
          )}
        </div>
        {getProficiencyStars(proficiency)}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`max-w-4xl mx-auto bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:bg-white print:max-w-full ${className}`}
    >
      <div className="p-6 sm:p-8 print:p-4">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8 print:mb-4"
        >
          {/* Profile Image */}
          {personal.profileImage && (
            <img
              src={personal.profileImage}
              alt={personal.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4 border-white dark:border-gray-700 shadow-xl object-cover print:w-20 print:h-20 print:border-2 print:shadow-none"
            />
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 print:text-2xl">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent print:bg-none print:text-purple-700">
              {personal.fullName || 'Your Name'}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-4 print:text-base print:text-gray-700">
            {personal.title || 'Professional Title'}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-2 mb-4 print:gap-1">
            {totalExperience && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 print:bg-gray-100 print:border-gray-300 print:text-gray-700 print:text-xs print:px-2 print:py-1">
                <FiBriefcase className="w-4 h-4 print:w-3 print:h-3" />
                {totalExperience}
              </span>
            )}
            {education.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 print:bg-gray-100 print:border-gray-300 print:text-gray-700 print:text-xs print:px-2 print:py-1">
                <FiBook className="w-4 h-4 print:w-3 print:h-3" />
                {education.length} {education.length === 1 ? 'Degree' : 'Degrees'}
              </span>
            )}
            {certifications.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 print:bg-gray-100 print:border-gray-300 print:text-gray-700 print:text-xs print:px-2 print:py-1">
                <FiAward className="w-4 h-4 print:w-3 print:h-3" />
                {certifications.length} {certifications.length === 1 ? 'Cert' : 'Certs'}
              </span>
            )}
          </div>

          {/* Contact Information */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm print:gap-x-3 print:text-xs">
            {personal.email && (
              <a
                href={`mailto:${personal.email}`}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors print:text-gray-700 print:hover:text-gray-700"
              >
                <FiMail className="w-4 h-4 print:w-3 print:h-3" />
                <span>{personal.email}</span>
              </a>
            )}
            {personal.phone && (
              <a
                href={`tel:${personal.phone}`}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors print:text-gray-700 print:hover:text-gray-700"
              >
                <FiPhone className="w-4 h-4 print:w-3 print:h-3" />
                <span>{personal.phone}</span>
              </a>
            )}
            {personal.location && (
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 print:text-gray-700">
                <FiMapPin className="w-4 h-4 print:w-3 print:h-3" />
                <span>{personal.location}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mt-2 print:gap-x-3 print:text-xs">
            {personal.website && (
              <a
                href={personal.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors print:text-purple-700 print:hover:text-purple-700"
              >
                <FiGlobe className="w-4 h-4 print:w-3 print:h-3" />
                <span>{personal.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {personal.linkedin && (
              <a
                href={personal.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors print:text-purple-700 print:hover:text-purple-700"
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
                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors print:text-purple-700 print:hover:text-purple-700"
              >
                <FiGithub className="w-4 h-4 print:w-3 print:h-3" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </motion.header>

        {/* Professional Summary */}
        {hasContent('summary') && (
          <section className="mb-8 print:mb-4 print:page-break-inside-avoid">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/30 print:bg-white print:border-gray-300 print:p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white print:bg-purple-700 print:p-2">
                  <FiUser className="w-6 h-6 print:w-4 print:h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2 print:text-base">
                    Professional Profile
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed print:text-xs print:text-gray-700">
                    {personal.summary}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top Skills Highlight */}
        {topSkills.length > 0 && (
          <section className="mb-8 print:mb-4 print:page-break-inside-avoid">
            <SectionTitle title="Core Competencies" icon={FiZap} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:gap-2">
              {topSkills.map((skill, index) => (
                <SkillCard
                  key={index}
                  skill={skill.name}
                  proficiency={skill.proficiency}
                  years={skill.years}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
          {/* Left Column */}
          <div className="space-y-6 print:space-y-4">
            {/* Work Experience */}
            {hasContent('experience') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Experience" icon={FiBriefcase} />
                <div className="space-y-4 print:space-y-2">
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
                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-purple-200/50 dark:border-purple-800/30 hover:shadow-lg transition-all print:bg-white print:border-gray-300 print:p-3"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                              {exp.title}
                            </h3>
                            <p className="text-purple-600 dark:text-purple-400 font-medium print:text-purple-700 print:text-xs">
                              {exp.company}
                            </p>
                            {exp.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 print:text-[10px]">
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
                              <p className="text-xs text-purple-500 flex items-center gap-1 mt-1 print:text-[10px]">
                                <FiClock className="w-3 h-3 print:w-2 print:h-2" />
                                {duration}
                              </p>
                            )}
                          </div>
                        </div>

                        {exp.employmentType && exp.employmentType !== 'full-time' && (
                          <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs mb-2 print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                            {exp.employmentType}
                          </span>
                        )}

                        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1.5 print:text-xs">
                          {exp.description?.split('\n').map(
                            (line, i) =>
                              line.trim() && (
                                <p key={i} className="flex items-start gap-2">
                                  <span className="text-purple-400 mt-1.5 print:text-gray-500">
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
                                  className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px]"
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
          </div>

          {/* Right Column */}
          <div className="space-y-6 print:space-y-4">
            {/* Projects */}
            {hasContent('projects') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Featured Projects" icon={FiFolder} />
                <div className="space-y-4 print:space-y-2">
                  {projects.slice(0, 3).map((project, index) => (
                    <div
                      key={index}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-pink-200/50 dark:border-pink-800/30 hover:shadow-lg transition-all print:bg-white print:border-gray-300 print:p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-sm">
                          {project.name}
                        </h3>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-500 hover:text-purple-600 transition-colors print:text-purple-700"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 print:text-xs">
                        {project.description}
                      </p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-1.5 print:gap-1">
                          {project.technologies
                            .split(',')
                            .slice(0, 4)
                            .map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs print:bg-gray-200 print:text-gray-700 print:text-[10px]"
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
                <SectionTitle title="Education" icon={FiBook} />
                <div className="space-y-3 print:space-y-1.5">
                  {education.map((edu, index) => (
                    <div
                      key={index}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30 hover:shadow-lg transition-all print:bg-white print:border-gray-300 print:p-2"
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 print:text-sm">
                        {edu.degree}
                      </h3>
                      <p className="text-purple-600 dark:text-purple-400 text-sm print:text-purple-700 print:text-xs">
                        {edu.institution}
                      </p>
                      {edu.field && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 print:text-[10px]">
                          {edu.field}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2 print:mt-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs print:text-[10px]">
                          {edu.startDate && formatDate(edu.startDate)}
                          {edu.endDate && ` - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                        </p>
                        {edu.gpa && (
                          <p className="text-purple-600 dark:text-purple-400 text-xs font-medium print:text-purple-700 print:text-[10px]">
                            GPA: {edu.gpa}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {hasContent('certifications') && (
              <section className="print:page-break-inside-avoid">
                <SectionTitle title="Certifications" icon={FiAward} />
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30 print:bg-white print:border-gray-300 print:p-2">
                  <div className="space-y-2 print:space-y-1">
                    {certifications.slice(0, 3).map((cert, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0 print:w-3 print:h-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 print:text-xs">
                            {cert.name}
                          </p>
                          <p className="text-xs text-gray-500 print:text-[10px]">
                            {cert.issuer} {cert.date && `• ${formatDate(cert.date)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Soft Skills & Languages */}
            {(skills.soft?.length > 0 || skills.languages?.length > 0) && (
              <section className="print:page-break-inside-avoid">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-5 border border-purple-200/50 dark:border-purple-800/30 print:bg-white print:border-gray-300 print:p-3">
                  {skills.soft?.length > 0 && (
                    <div className="mb-4 print:mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 print:text-sm">
                        <FiHeart className="w-4 h-4 text-pink-500 print:w-3 print:h-3" />
                        Soft Skills
                      </h4>
                      <div className="flex flex-wrap gap-2 print:gap-1">
                        {skills.soft.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-full text-sm print:bg-gray-200 print:text-gray-700 print:text-xs print:px-2 print:py-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skills.languages?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 print:text-sm">
                        <FiFlag className="w-4 h-4 text-purple-500 print:w-3 print:h-3" />
                        Languages
                      </h4>
                      <div className="space-y-1.5 print:space-y-1">
                        {skills.languages.map((language, index) => {
                          const proficiency = skills.skillDetails?.[language]?.proficiency;
                          return (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                                {language}
                              </span>
                              {proficiency && (
                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full print:bg-gray-200 print:text-gray-700 print:text-[10px]">
                                  {proficiency}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Quote */}
        <div className="mt-8 text-center print:mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-full print:bg-gray-100 print:border print:border-gray-300">
            <FiSmile className="w-4 h-4 text-purple-500 print:w-3 print:h-3" />
            <span className="text-sm text-gray-600 dark:text-gray-400 print:text-xs print:text-gray-700">
              Ready to bring creativity and expertise to your team
            </span>
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
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .backdrop-blur-sm {
            backdrop-filter: none !important;
          }
          .text-purple-500 {
            color: #6b21a8 !important;
          }
          .text-purple-600 {
            color: #6b21a8 !important;
          }
          .text-purple-700 {
            color: #6b21a8 !important;
          }
          .border-purple-200 {
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
          .print\\:text-lg {
            font-size: 11pt !important;
          }
          .print\\:text-2xl {
            font-size: 14pt !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(Template3);
