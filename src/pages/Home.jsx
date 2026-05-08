import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiCheckCircle, FiDownload, FiTrendingUp, FiArrowRight,
  FiStar, FiUsers, FiAward, FiZap, FiShield, FiTarget, FiLayout,
  FiPlay, FiChevronRight, FiChevronLeft, 
  FiBarChart2, // FIXED: Added missing import
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { usePageTitle } from '../hooks/useDocumentTitle';
import { useInView } from '../hooks/useIntersectionObserver';

// ── Constants ─────────────────────────────────────────────────────────────

const TARGET_STATS = { users: 50000, resumes: 100000, templates: 25 };

const FEATURES = [
  { icon: FiTarget, title: 'ATS-Optimized Templates', description: 'Professionally designed templates that pass applicant tracking systems.', color: 'from-blue-500 to-cyan-500' },
  { icon: FiZap, title: 'AI Smart Suggestions', description: 'Get real-time keyword recommendations to boost your resume score.', color: 'from-purple-500 to-pink-500' },
  { icon: FiDownload, title: 'Instant PDF Export', description: 'Download your resume as a professional, print-ready PDF with one click.', color: 'from-green-500 to-emerald-500' },
  { icon: FiBarChart2, title: 'Real-Time ATS Scoring', description: 'Track your ATS compatibility score and get actionable improvement tips.', color: 'from-orange-500 to-red-500' }, // FIXED: Now properly imported
  { icon: FiLayout, title: '25+ Premium Templates', description: 'Choose from a wide variety of modern and classic resume designs.', color: 'from-indigo-500 to-purple-500' },
  { icon: FiShield, title: 'Privacy First', description: 'Your data is encrypted and never shared with third parties.', color: 'from-teal-500 to-green-500' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Choose Template', desc: 'Select from 25+ ATS-optimized templates.', icon: FiLayout, color: 'from-blue-500 to-cyan-500' },
  { step: '02', title: 'Fill Your Details', desc: 'Add experience, skills, and education with AI suggestions.', icon: FiFileText, color: 'from-purple-500 to-pink-500' },
  { step: '03', title: 'Download & Apply', desc: 'Export as PDF and start applying to your dream jobs.', icon: FiDownload, color: 'from-green-500 to-emerald-500' },
];

const TESTIMONIALS = [
  { text: "ResumeAI Pro transformed my job search. Within two weeks, I landed interviews at three Fortune 500 companies!", author: "Sarah Chen", role: "Software Engineer at Google", avatar: "SC" },
  { text: "The AI suggestions are incredible. My resume score went from 45% to 92% in just 30 minutes.", author: "Michael Rodriguez", role: "Product Manager at Microsoft", avatar: "MR" },
  { text: "I've tried many resume builders, but ResumeAI Pro is by far the best.", author: "Emily Watson", role: "Marketing Director at Amazon", avatar: "EW" },
  { text: "Finally, a resume builder that actually understands ATS systems.", author: "David Kim", role: "Senior Recruiter at Meta", avatar: "DK" },
];

const TRUSTED_BY = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'];

// ── Utility ───────────────────────────────────────────────────────────────

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ── Component ─────────────────────────────────────────────────────────────

const Home = () => {
  usePageTitle({
    title: 'ResumeAI Pro - AI-Powered ATS Resume Builder',
    description: 'Create professional, ATS-optimized resumes in minutes. AI-powered suggestions, 25+ templates, real-time scoring.',
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({ users: 0, resumes: 0, templates: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const animationRef = useRef(null);
  const mountedRef = useRef(true);

  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  /** useIntersectionObserver returns an object; useInView exposes the [ref, boolean] tuple. */
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ── RAF-based stats animation ─────────────────────────────────────────

  useEffect(() => {
    if (!statsInView || hasAnimated) return;
    setHasAnimated(true);

    const duration = 2000;
    const startTime = performance.now();

    const animate = (timestamp) => {
      if (!mountedRef.current) return;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setAnimatedStats({
        users: Math.round(TARGET_STATS.users * eased),
        resumes: Math.round(TARGET_STATS.resumes * eased),
        templates: Math.round(TARGET_STATS.templates * eased),
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [statsInView, hasAnimated]);

  // ── Auto-rotate testimonials ─────────────────────────────────────────

  useEffect(() => {
    if (TESTIMONIALS.length <= 1) return;
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleGetStarted = useCallback(() => {
    navigate(user ? '/dashboard' : '/signup');
  }, [user, navigate]);

  const currentTestimonialData = TESTIMONIALS[currentTestimonial];

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
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-6">
                  <FiAward className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Trusted by 50,000+ professionals</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Create Your{' '}<span className="gradient-text">ATS-Optimized Resume</span>{' '}in Minutes
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                  Build professional resumes that get past applicant tracking systems and land 3x more interviews.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <Button size="lg" onClick={handleGetStarted} className="group bg-gradient-to-r from-primary-500 to-accent-500">
                    {user ? 'Go to Dashboard' : 'Get Started Free'}
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/templates')}>View Templates</Button>
                </div>

                {/* Stats */}
                <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { value: animatedStats.users, label: 'Active Users', format: (v) => `${(v / 1000).toFixed(0)}K+`, icon: FiUsers, color: 'text-blue-500' },
                    { value: 85, label: 'Interview Rate', format: (v) => `${v}%`, icon: FiTrendingUp, color: 'text-green-500' },
                    { value: animatedStats.templates, label: 'Templates', format: (v) => `${v}+`, icon: FiLayout, color: 'text-purple-500' },
                    { value: '4.9', label: 'User Rating', format: (v) => `${v}/5.0`, icon: FiStar, color: 'text-yellow-500' },
                  ].map((stat, i) => (
                    <div key={i} className="group">
                      <div className={`flex items-center gap-2 mb-1 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.format(stat.value)}</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Column - Preview */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-2xl" />
                <Card className="relative p-2 shadow-2xl overflow-hidden">
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 h-80 md:h-96 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <FiFileText className="w-20 h-20 mb-4 opacity-90" />
                      <h3 className="text-2xl font-bold mb-2">Resume Preview</h3>
                      <p className="text-sm opacity-80 mb-6">Professional ATS-Friendly Design</p>
                      <button onClick={handleGetStarted} className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110">
                        <FiPlay className="w-6 h-6 text-white ml-1" />
                      </button>
                    </div>
                  </div>
                </Card>
                <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">ATS Score: 98%</span></div>
                </div>
                <div className="absolute -top-4 -right-4 glass-card px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2"><FiStar className="w-4 h-4 text-yellow-500 fill-current" /><span className="text-sm font-medium">Premium Template</span></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Trusted By */}
        <section className="py-12 px-4 border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto">
            <p className="text-center text-sm text-gray-500 uppercase tracking-wider mb-8">Trusted by professionals from</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {TRUSTED_BY.map((company, i) => (
                <div key={i} className="text-xl font-bold text-gray-400 dark:text-gray-600">{company}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to <span className="gradient-text">Succeed</span></h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">All the tools you need to create a standout resume</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                  <Card className="p-6 h-full hover:shadow-xl transition-all group">
                    <div className={`w-14 h-14 mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
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
              <Badge variant="secondary" className="mb-4">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It <span className="gradient-text">Works</span></h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Create your professional resume in three steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {HOW_IT_WORKS.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative text-center">
                  <Card className="p-6 h-full">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
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

        {/* Testimonials */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <Badge variant="warning" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our <span className="gradient-text">Users Say</span></h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div key={currentTestimonial} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="p-8 md:p-10">
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => <FiStar key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
                    </div>
                    <p className="text-xl md:text-2xl text-center text-gray-700 dark:text-gray-300 italic mb-8">"{currentTestimonialData.text}"</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-semibold">{currentTestimonialData.avatar}</div>
                      <div className="text-left"><p className="font-semibold text-lg">{currentTestimonialData.author}</p><p className="text-gray-500 dark:text-gray-400">{currentTestimonialData.role}</p></div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={() => setCurrentTestimonial(p => p === 0 ? TESTIMONIALS.length - 1 : p - 1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><FiChevronLeft className="w-5 h-5" /></button>
                <div className="flex gap-2">{TESTIMONIALS.map((_, i) => <button key={i} onClick={() => setCurrentTestimonial(i)} className={`h-2 rounded-full transition-all ${i === currentTestimonial ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />)}</div>
                <button onClick={() => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><FiChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <div className="glass-card p-12 max-w-4xl mx-auto bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Land Your <span className="gradient-text">Dream Job?</span></h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">Join 50,000+ professionals who've accelerated their careers.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} className="group bg-gradient-to-r from-primary-500 to-accent-500">Get Started Free<FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/templates')}>Browse Templates</Button>
              </div>
              <p className="text-sm text-gray-500 mt-6">No credit card required • Free plan available</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;