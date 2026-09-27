import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FiTarget,
  FiAward,
  FiZap,
  FiShield,
  FiGithub,
  FiLinkedin,
  FiGlobe,
  FiMail,
  FiArrowRight,
  FiUser,
  FiLayout,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────

const FOUNDER_SOCIAL_LINKS = [
  { icon: FiGithub, href: 'https://github.com/Usmannmurtazaa', label: 'GitHub' },
  { icon: FiLinkedin, href: 'https://www.linkedin.com/in/Usmannmurtazaa/', label: 'LinkedIn' },
  { icon: FiGlobe, href: 'https://usmanmurtaza.netlify.app', label: 'Portfolio' },
  { icon: FiMail, href: 'mailto:usmanmurtazaportfolio@gmail.com', label: 'Email' },
];

const VALUES = [
  {
    icon: FiTarget,
    title: 'Mission-Driven',
    description: "We're dedicated to helping job seekers succeed in their career journey",
  },
  {
    icon: FiShield,
    title: 'Privacy First',
    description: 'Your data is encrypted and never shared with third parties',
  },
  {
    icon: FiZap,
    title: 'Innovation',
    description: 'Constantly improving our AI and ATS optimization algorithms',
  },
  {
    icon: FiLayout,
    title: 'User-Centric',
    description: "Every feature is designed with our users' success in mind",
  },
];

const MILESTONES = [
  {
    year: '2024',
    title: 'The Beginning',
    description: 'Resume Ai Pro was conceptualized to solve the ATS challenge',
  },
  {
    year: '2025',
    title: 'Beta Launch',
    description: 'Launched beta version with basic templates and ATS scoring',
  },
  {
    year: '2026',
    title: 'Official Launch',
    description: 'Full platform launch with AI-powered suggestions and modern templates',
  },
];

const PRODUCT_HIGHLIGHTS = [
  {
    icon: FiZap,
    title: 'AI-Powered Writing',
    description: 'Generate and refine resume content with AI-driven suggestions',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiTarget,
    title: 'ATS-First Design',
    description: 'Every template is optimised for applicant tracking systems',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiLayout,
    title: 'Modern Templates',
    description: 'A curated set of professional, ready-to-use resume designs',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: FiShield,
    title: 'Privacy Focused',
    description: 'Your data stays yours - encrypted and never shared',
    color: 'from-teal-500 to-green-500',
  },
];

// ── Component ─────────────────────────────────────────────────────────────

const About = () => {
  const { scrollY } = useScroll();

  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            style={{ y: headerY, opacity: headerOpacity }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="primary" className="mb-4">
                About Us
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Empowering Careers with <span className="gradient-text">Resume Ai Pro</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                We're on a mission to help job seekers land their dream jobs with professional,
                AI-powered, ATS-optimized resumes.
              </p>
            </motion.div>
          </motion.div>

          {/* Product Highlights - honest feature claims instead of fabricated stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-20">
            {PRODUCT_HIGHLIGHTS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-6 text-center relative overflow-hidden group h-full">
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity rounded-full blur-2xl`}
                  />
                  <div
                    className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Our Story Section */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="secondary" className="mb-4">
                  Our Story
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  From a Simple Idea to a{' '}
                  <span className="gradient-text">Modern Resume Platform</span>
                </h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p>
                    Created by <strong>Usman Murtaza</strong>, Resume Ai Pro was born from a
                    frustrating observation: countless qualified candidates were being filtered out
                    by Applicant Tracking Systems before a human ever saw their resume.
                  </p>
                  <p>
                    As a software engineer who had experienced this firsthand, Usman set out to
                    create a solution that would level the playing field. What started as a personal
                    project grew into a platform used by job seekers around the world.
                  </p>
                  <p>
                    Today, Resume Ai Pro combines AI technology with professional design to ensure
                    your resume not only passes ATS filters but also impresses hiring managers.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-2xl" />
                <Card className="relative p-8">
                  <div className="space-y-6">
                    {MILESTONES.map((milestone, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                            {milestone.year.slice(2)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{milestone.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {milestone.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Values Section */}
          <div className="max-w-6xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="primary" className="mb-4">
                Our Values
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Drives <span className="gradient-text">Us Forward</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our core values shape everything we do at Resume Ai Pro
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-6 h-full text-center group">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Founder Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="warning" className="mb-4">
                Meet the Founder
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built by a Developer, <span className="gradient-text">For Job Seekers</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-accent-500 flex items-center justify-center shadow-2xl">
                      <FiUser className="w-20 h-20 md:w-24 md:h-24 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">Usman Murtaza</h3>
                    <p className="text-lg text-primary-600 dark:text-primary-400 mb-3">
                      Founder & Developer
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Full-stack developer and creator of the Maniesta ecosystem. After experiencing
                      firsthand how ATS systems filter out qualified candidates, Usman built Resume
                      Ai Pro to make professional, ATS-optimized resumes accessible to everyone.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                      <Badge variant="primary">Full-Stack Development</Badge>
                      <Badge variant="secondary">AI Integration</Badge>
                      <Badge variant="success">Product Design</Badge>
                      <Badge variant="warning">Web Development</Badge>
                    </div>
                    <div className="flex gap-3 justify-center md:justify-start">
                      {FOUNDER_SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label={label}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-center text-gray-600 dark:text-gray-400 italic">
                    "My goal is simple: to help every job seeker put their best foot forward and
                    land the career they deserve."
                  </p>
                  <p className="text-center text-sm text-gray-500 mt-2">- Usman Murtaza, Founder</p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Card className="p-10 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Transform Your Resume?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start building your ATS-optimised resume today. Free to try, no credit card
                required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="group">
                    Get Started Free
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/templates">
                  <Button variant="outline" size="lg">
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
