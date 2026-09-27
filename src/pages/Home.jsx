import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FiFileText,
  FiCheckCircle,
  FiDownload,
  FiArrowRight,
  FiAward,
  FiZap,
  FiShield,
  FiTarget,
  FiLayout,
  FiPlay,
  FiBarChart2,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

// ── Constants ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FiTarget,
    title: 'ATS-Optimized Templates',
    description: 'Professionally designed templates that pass applicant tracking systems.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiZap,
    title: 'AI Smart Suggestions',
    description: 'Get real-time keyword recommendations to boost your resume score.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiDownload,
    title: 'Instant PDF Export',
    description: 'Download your resume as a professional, print-ready PDF with one click.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FiBarChart2,
    title: 'Real-Time ATS Scoring',
    description: 'Track your ATS compatibility score and get actionable improvement tips.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FiLayout,
    title: 'Professional Templates',
    description: 'Choose from a curated set of modern and classic resume designs.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: FiShield,
    title: 'Privacy First',
    description: 'Your data is encrypted and never shared with third parties.',
    color: 'from-teal-500 to-green-500',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Template',
    desc: 'Select from our ATS-optimized templates.',
    icon: FiLayout,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    step: '02',
    title: 'Fill Your Details',
    desc: 'Add experience, skills, and education with AI suggestions.',
    icon: FiFileText,
    color: 'from-purple-500 to-pink-500',
  },
  {
    step: '03',
    title: 'Download & Apply',
    desc: 'Export as PDF and start applying to your dream jobs.',
    icon: FiDownload,
    color: 'from-green-500 to-emerald-500',
  },
];

const TECH_STACK = ['React', 'Firebase', 'OpenAI API', 'Tailwind CSS', 'Node.js'];

// ── Component ─────────────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const [animateHero] = useState(true);

  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleGetStarted = useCallback(() => {
    navigate(user ? '/dashboard' : '/signup');
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl" />
          </div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <motion.div
                initial={animateHero ? { opacity: 0, x: -30 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-6">
                  <FiAward className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    Free plan available · No credit card required
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Create Your <span className="gradient-text">ATS-Optimized Resume</span> in Minutes
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                  Build professional resumes that get past applicant tracking systems and land more
                  interviews.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="group bg-gradient-to-r from-primary-500 to-accent-500"
                  >
                    {user ? 'Go to Dashboard' : 'Get Started Free'}
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/templates')}>
                    View Templates
                  </Button>
                </div>

                {/* Honest feature highlights - no fabricated numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-2">
                    <FiShield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      ATS-Optimized
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiZap className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      AI-Powered
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiDownload className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      Instant PDF
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      Free to Start
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Preview */}
              <motion.div
                initial={animateHero ? { opacity: 0, x: 30 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-2xl" />
                <Card className="relative p-2 shadow-2xl overflow-hidden">
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 h-80 md:h-96 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <FiFileText className="w-20 h-20 mb-4 opacity-90" />
                      <h3 className="text-2xl font-bold mb-2">Resume Preview</h3>
                      <p className="text-sm opacity-80 mb-6">Professional ATS-Friendly Design</p>
                      <button
                        onClick={handleGetStarted}
                        aria-label="Get started with Resume Ai Pro"
                        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
                      >
                        <FiPlay className="w-6 h-6 text-white ml-1" />
                      </button>
                    </div>
                  </div>
                </Card>
                <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">ATS-Optimized</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 glass-card px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <FiAward className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Premium Template</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Built With - honest tech stack instead of fake company endorsements */}
        <section className="py-12 px-4 border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto">
            <p className="text-center text-sm text-gray-500 uppercase tracking-wider mb-8">
              Built with modern technology
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {TECH_STACK.map((tech, i) => (
                <div key={i} className="text-xl font-bold text-gray-400 dark:text-gray-600">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to <span className="gradient-text">Succeed</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                All the tools you need to create a standout resume
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-6 h-full hover:shadow-xl transition-all group">
                    <div
                      className={`w-14 h-14 mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                Simple Process
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create your professional resume in three steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {HOW_IT_WORKS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative text-center"
                >
                  <Card className="p-6 h-full">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* User Stories - honest placeholder until real testimonials exist */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="warning" className="mb-4">
                User Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Real stories <span className="gradient-text">coming soon</span>
              </h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <Card className="p-8 md:p-10 text-center">
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Resume Ai Pro is a new product. As soon as we have real user stories to share,
                  they will be featured here - with names, photos, and permission. Want to be among
                  the first?
                </p>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-primary-500 to-accent-500"
                >
                  Try Resume Ai Pro Free
                  <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                  No credit card required
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <div className="glass-card p-12 max-w-4xl mx-auto bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Land Your <span className="gradient-text">Dream Job?</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Start building your ATS-optimised resume today. Free to try, no credit card
                required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-primary-500 to-accent-500"
                >
                  Get Started Free
                  <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/templates')}>
                  Browse Templates
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
